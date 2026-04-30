'use server';

// assignProjects / unassignProject — BQL phân công đề án vào hội đồng.
// Khi assign: project transitions VALID → EVALUATING (single-source-of-truth via canTransitionProject).
// Audit: COUNCIL_ASSIGN_PROJECT (action ASSIGN × tham-dinh).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import { canTransitionProject } from '@/lib/workflows/project';
import type { Role } from '@/lib/constants';

export type AssignProjectsInput = {
  councilId: string;
  projectIds: string[];
};

export type AssignProjectsResult = {
  councilId: string;
  assigned: number;
  skipped: Array<{ projectId: string; reason: string }>;
};

async function assignProjectsImpl(
  input: AssignProjectsInput,
): Promise<AssignProjectsResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'create'))) {
    throw new Error('Bạn không có quyền phân công đề án vào hội đồng');
  }

  if (!input.projectIds.length) {
    throw new Error('Vui lòng chọn ít nhất 1 đề án để phân công');
  }
  if (input.projectIds.length > 50) {
    throw new Error('Số lượng đề án phân công không vượt quá 50');
  }

  const council = await prisma.evaluationCouncil.findUnique({
    where: { id: input.councilId },
    select: { id: true, lockStatus: true, programCycleId: true },
  });
  if (!council) {
    throw new Error('Không tìm thấy hội đồng');
  }
  if (council.lockStatus === 'LOCKED') {
    throw new Error('Hội đồng đã bị khóa, không thể phân công thêm đề án');
  }

  const projects = await prisma.project.findMany({
    where: { id: { in: input.projectIds } },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      programCycleId: true,
      passedFormalCheck: true,
      deletedAt: true,
    },
  });

  const skipped: Array<{ projectId: string; reason: string }> = [];
  const okProjectIds: string[] = [];
  for (const p of projects) {
    if (p.deletedAt) {
      skipped.push({ projectId: p.id, reason: 'Đề án đã bị xoá' });
      continue;
    }
    if (p.programCycleId !== council.programCycleId) {
      skipped.push({
        projectId: p.id,
        reason: 'Đề án không thuộc chu kỳ của hội đồng',
      });
      continue;
    }
    if (p.status === 'EVALUATING') {
      // Already in EVALUATING — assignment may exist; we'll upsert
      okProjectIds.push(p.id);
      continue;
    }
    if (p.status !== 'VALID') {
      skipped.push({
        projectId: p.id,
        reason: `Đề án đang ở trạng thái ${p.status} — chỉ phân công được khi VALID`,
      });
      continue;
    }
    if (!canTransitionProject('VALID', 'EVALUATING')) {
      skipped.push({ projectId: p.id, reason: 'Workflow không cho phép' });
      continue;
    }
    okProjectIds.push(p.id);
  }

  if (okProjectIds.length === 0) {
    return { councilId: input.councilId, assigned: 0, skipped };
  }

  // Atomic: create assignments + transition projects in single tx
  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    let assigned = 0;
    for (const pid of okProjectIds) {
      // Idempotent assignment
      const existing = await tx.projectCouncilAssignment.findUnique({
        where: { councilId_projectId: { councilId: council.id, projectId: pid } },
      });
      if (!existing) {
        await tx.projectCouncilAssignment.create({
          data: { councilId: council.id, projectId: pid, assignedAt: now },
        });
        assigned += 1;
      }
      // Transition VALID → EVALUATING (only if project is currently VALID)
      const proj = await tx.project.findUnique({
        where: { id: pid },
        select: { status: true },
      });
      if (proj?.status === 'VALID') {
        await tx.project.update({
          where: { id: pid },
          data: { status: 'EVALUATING', updatedAt: now },
        });
      }
    }
    return { assigned };
  });

  revalidatePath(`/hoi-dong/${input.councilId}`);
  revalidatePath('/hoi-dong');
  revalidatePath('/tham-dinh');

  return {
    councilId: input.councilId,
    assigned: result.assigned,
    skipped,
  };
}

export const assignProjects = withAuditLog<
  [AssignProjectsInput],
  AssignProjectsResult
>(
  {
    action: 'ASSIGN',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([input]) => input.councilId,
    captureAfter: (r, [input]) => ({
      councilId: r.councilId,
      assignedCount: r.assigned,
      skippedCount: r.skipped.length,
      projectIds: input.projectIds,
    }),
    metadata: { reason: 'BQL phân công đề án vào hội đồng' },
  },
  assignProjectsImpl,
);

// ---------------------------------------------------------------------------

export type UnassignProjectInput = {
  councilId: string;
  projectId: string;
};

async function unassignProjectImpl(
  input: UnassignProjectInput,
): Promise<{ projectId: string; revertedToValid: boolean }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'create'))) {
    throw new Error('Bạn không có quyền hủy phân công');
  }

  const council = await prisma.evaluationCouncil.findUnique({
    where: { id: input.councilId },
    select: { id: true, lockStatus: true },
  });
  if (!council) {
    throw new Error('Không tìm thấy hội đồng');
  }
  if (council.lockStatus === 'LOCKED') {
    throw new Error('Hội đồng đã bị khóa, không thể hủy phân công');
  }

  // Block unassign if any submitted scoresheet exists
  const submittedSheets = await prisma.scoreSheet.count({
    where: {
      councilId: input.councilId,
      projectId: input.projectId,
      kind: 'EVALUATION',
      status: 'SUBMITTED',
    },
  });
  if (submittedSheets > 0) {
    throw new Error(
      `Đã có ${submittedSheets} phiếu chấm nộp cho đề án này — không thể hủy phân công`,
    );
  }

  // Check whether the project is still assigned to other councils
  const otherAssignments = await prisma.projectCouncilAssignment.count({
    where: {
      projectId: input.projectId,
      councilId: { not: input.councilId },
    },
  });

  let revertedToValid = false;
  await prisma.$transaction(async (tx) => {
    await tx.projectCouncilAssignment
      .delete({
        where: {
          councilId_projectId: {
            councilId: input.councilId,
            projectId: input.projectId,
          },
        },
      })
      .catch(() => {
        // already removed — idempotent
      });
    if (otherAssignments === 0) {
      const proj = await tx.project.findUnique({
        where: { id: input.projectId },
        select: { status: true },
      });
      if (proj?.status === 'EVALUATING') {
        await tx.project.update({
          where: { id: input.projectId },
          data: { status: 'VALID' },
        });
        revertedToValid = true;
      }
    }
  });

  revalidatePath(`/hoi-dong/${input.councilId}`);
  return { projectId: input.projectId, revertedToValid };
}

export const unassignProject = withAuditLog<
  [UnassignProjectInput],
  { projectId: string; revertedToValid: boolean }
>(
  {
    action: 'ASSIGN',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([input]) => input.councilId,
    captureAfter: (r) => ({
      projectId: r.projectId,
      revertedToValid: r.revertedToValid,
      kind: 'UNASSIGN_PROJECT',
    }),
    metadata: { reason: 'BQL hủy phân công đề án khỏi hội đồng' },
  },
  unassignProjectImpl,
);

// ---------------------------------------------------------------------------
// listAssignableProjects — BQL chọn đề án status=VALID để gán vào council.
// ---------------------------------------------------------------------------

export type AssignableProjectRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  organizationName: string;
  proposedBudget: number | null;
  alreadyAssigned: boolean;
  alreadyAssignedHere: boolean;
};

export async function listAssignableProjects(
  councilId: string,
): Promise<AssignableProjectRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    throw new Error('Bạn không có quyền xem');
  }

  const council = await prisma.evaluationCouncil.findUnique({
    where: { id: councilId },
    select: { id: true, programCycleId: true },
  });
  if (!council) return [];

  const projects = await prisma.project.findMany({
    where: {
      programCycleId: council.programCycleId,
      status: { in: ['VALID', 'EVALUATING'] },
      deletedAt: null,
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      organization: { select: { name: true } },
    },
  });

  const assignments = await prisma.projectCouncilAssignment.findMany({
    where: { projectId: { in: projects.map((p) => p.id) } },
    select: { projectId: true, councilId: true },
  });
  const assignedAnywhere = new Map<string, string>();
  for (const a of assignments) {
    assignedAnywhere.set(a.projectId, a.councilId);
  }

  return projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    status: p.status,
    organizationName: p.organization.name,
    proposedBudget: p.proposedBudget,
    alreadyAssigned: assignedAnywhere.has(p.id),
    alreadyAssignedHere: assignedAnywhere.get(p.id) === councilId,
  }));
}
