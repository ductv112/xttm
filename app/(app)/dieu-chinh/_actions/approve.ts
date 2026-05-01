'use server';

// Approve / reject / route-to-evaluation — Phase 8 Plan 08-01 Task 4.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { AMENDMENT_AUDIT_TYPES } from '@/lib/audit-types';
import type { Role } from '@/lib/constants';

export type AmendmentActionResult =
  | { ok: true; decisionNumber?: string }
  | { ok: false; error: string };

// =============================================================================
// approveAmendment — chỉ áp dụng cho loại nhỏ
// =============================================================================

export async function approveAmendment(
  amendmentId: string,
): Promise<AmendmentActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'de-an', 'approve'))) {
    return { ok: false, error: 'Bạn không có quyền phê duyệt điều chỉnh' };
  }

  const a = await prisma.projectAmendment.findUnique({
    where: { id: amendmentId },
    include: { project: { select: { id: true, code: true, name: true } } },
  });
  if (!a) return { ok: false, error: 'Không tìm thấy yêu cầu điều chỉnh' };
  if (a.status !== 'PENDING') {
    return { ok: false, error: 'Yêu cầu đã được xử lý' };
  }
  if (a.isCritical) {
    return {
      ok: false,
      error:
        'Loại điều chỉnh trọng yếu không thể phê duyệt nội bộ — phải chuyển thẩm định lại',
    };
  }

  // Sinh số quyết định điều chỉnh
  const year = new Date().getFullYear();
  const prefix = `XTTM-DC/${year}/`;
  const existing = await prisma.projectAmendment.findMany({
    where: { decisionNumber: { startsWith: prefix } },
    select: { decisionNumber: true },
  });
  let maxSeq = 0;
  for (const e of existing) {
    if (!e.decisionNumber) continue;
    const tail = e.decisionNumber.slice(prefix.length);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
  }
  const decisionNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
  const decisionDate = new Date();

  // Apply changes to project (per amendmentType)
  const updates = await applyAmendmentToProject(a);

  await prisma.$transaction([
    prisma.projectAmendment.update({
      where: { id: a.id },
      data: {
        status: 'APPROVED',
        decisionNumber,
        decisionDate,
        reviewedById: session.user.id,
        reviewedAt: decisionDate,
      },
    }),
    ...updates,
  ]);

  void logAudit(
    {
      ...AMENDMENT_AUDIT_TYPES.AMENDMENT_APPROVE,
      resourceId: a.projectId,
      after: {
        amendmentId: a.id,
        decisionNumber,
        decisionDate,
      },
      metadata: { projectCode: a.project.code },
    },
    session.user.id,
  );

  revalidatePath('/dieu-chinh');
  revalidatePath(`/dieu-chinh/${amendmentId}`);
  revalidatePath(`/de-an/${a.projectId}`);
  return { ok: true, decisionNumber };
}

// =============================================================================
// rejectAmendment
// =============================================================================

export async function rejectAmendment(
  amendmentId: string,
  reason: string,
): Promise<AmendmentActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'de-an', 'approve'))) {
    return { ok: false, error: 'Bạn không có quyền từ chối' };
  }
  if (!reason || reason.trim().length < 5) {
    return { ok: false, error: 'Lý do từ chối quá ngắn' };
  }

  const a = await prisma.projectAmendment.findUnique({
    where: { id: amendmentId },
    select: { id: true, projectId: true, status: true },
  });
  if (!a) return { ok: false, error: 'Không tìm thấy yêu cầu' };
  if (a.status !== 'PENDING') {
    return { ok: false, error: 'Yêu cầu đã được xử lý' };
  }

  await prisma.projectAmendment.update({
    where: { id: amendmentId },
    data: {
      status: 'REJECTED',
      reviewerComment: reason.trim(),
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  void logAudit(
    {
      ...AMENDMENT_AUDIT_TYPES.AMENDMENT_REJECT,
      resourceId: a.projectId,
      after: { amendmentId, reason: reason.slice(0, 200) },
    },
    session.user.id,
  );

  revalidatePath('/dieu-chinh');
  revalidatePath(`/dieu-chinh/${amendmentId}`);
  revalidatePath(`/de-an/${a.projectId}`);
  return { ok: true };
}

// =============================================================================
// routeAmendmentToEvaluation — loại trọng yếu → quay lại thẩm định
// =============================================================================

export async function routeAmendmentToEvaluation(
  amendmentId: string,
): Promise<AmendmentActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'de-an', 'approve'))) {
    return { ok: false, error: 'Bạn không có quyền chuyển thẩm định lại' };
  }

  const a = await prisma.projectAmendment.findUnique({
    where: { id: amendmentId },
    include: { project: { select: { id: true, status: true, code: true } } },
  });
  if (!a) return { ok: false, error: 'Không tìm thấy yêu cầu' };
  if (a.status !== 'PENDING') {
    return { ok: false, error: 'Yêu cầu đã được xử lý' };
  }
  if (!a.isCritical) {
    return {
      ok: false,
      error: 'Chỉ chuyển thẩm định lại với điều chỉnh trọng yếu',
    };
  }

  await prisma.$transaction([
    prisma.projectAmendment.update({
      where: { id: amendmentId },
      data: {
        status: 'RESUBMIT_EVALUATION',
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.project.update({
      where: { id: a.projectId },
      data: { status: 'EVALUATING' },
    }),
  ]);

  void logAudit(
    {
      ...AMENDMENT_AUDIT_TYPES.AMENDMENT_ROUTE_TO_EVALUATION,
      resourceId: a.projectId,
      before: { status: a.project.status },
      after: { status: 'EVALUATING', amendmentId, transition: 'RESUBMIT_EVALUATION' },
      metadata: { projectCode: a.project.code },
    },
    session.user.id,
  );

  revalidatePath('/dieu-chinh');
  revalidatePath(`/dieu-chinh/${amendmentId}`);
  revalidatePath(`/de-an/${a.projectId}`);
  return { ok: true };
}

// =============================================================================
// applyAmendmentToProject — apply change to Project record (loại nhỏ only)
// =============================================================================

type UpdatePromise = ReturnType<typeof prisma.project.update>;

async function applyAmendmentToProject(a: {
  id: string;
  projectId: string;
  amendmentType: string;
  newValueJson: string | null;
}): Promise<UpdatePromise[]> {
  let newValue: unknown = null;
  try {
    newValue = a.newValueJson ? JSON.parse(a.newValueJson) : null;
  } catch {
    newValue = null;
  }

  const data: Record<string, unknown> = {};

  switch (a.amendmentType) {
    case 'TIME': {
      // newValue: { start, end } — patch generalInfo.timeRange + plannedStart/End
      if (newValue && typeof newValue === 'object') {
        const v = newValue as { start?: string; end?: string };
        const project = await prisma.project.findUnique({
          where: { id: a.projectId },
          select: { generalInfoJson: true },
        });
        if (project) {
          let gi: Record<string, unknown> = {};
          try {
            gi = project.generalInfoJson ? JSON.parse(project.generalInfoJson) : {};
          } catch {
            gi = {};
          }
          const tr = (gi.timeRange as Record<string, unknown>) ?? {};
          if (v.start) tr.start = v.start;
          if (v.end) tr.end = v.end;
          gi.timeRange = tr;
          data.generalInfoJson = JSON.stringify(gi);
        }
        if (v.start) data.plannedStartAt = new Date(v.start);
        if (v.end) data.plannedEndAt = new Date(v.end);
      }
      break;
    }
    case 'LOCATION': {
      if (typeof newValue === 'string') data.location = newValue;
      break;
    }
    case 'PROJECT_NAME': {
      if (typeof newValue === 'string' && newValue.trim().length > 0) {
        data.name = newValue.trim();
      }
      break;
    }
    case 'UNIT_NAME':
    case 'OTHER':
      // No structural change — record in audit only
      break;
    default:
      break;
  }

  if (Object.keys(data).length === 0) return [];
  return [
    prisma.project.update({
      where: { id: a.projectId },
      data,
    }),
  ];
}
