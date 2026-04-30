'use server';

// submitProject — DRAFT → SUBMITTED transition.
// Steps:
//   1. Auth + cross-tenant check
//   2. Load project + program cycle
//   3. validateGuards (must pass — name length, kind, pmContact, sectors, plan rows, budget rows)
//   4. canTransitionProject(DRAFT, SUBMITTED) === true
//   5. Idempotency (T-05-01-01): if already SUBMITTED within last 5s, return existing
//   6. Create ProjectVersion snapshot of pre-submit state (PROJ-20..22 history)
//   7. Update project: status=SUBMITTED, submittedAt=now, currentVersion++
//   8. If isTwoYear flag in generalInfoJson + nextYear: create year+1 record TENTATIVE with parentProjectId
//   9. Mock notification dispatch to BANQL users
//
// PROJ-14 + PROJ-17/18 (đề án 2 năm).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionProject,
  parseBudget,
  parseGeneralInfo,
  parseObjectives,
  parsePlan,
  validateGuards,
  type ProjectStatus,
} from '@/lib/workflows/project';

const IDEMPOTENCY_WINDOW_MS = 5_000;

export type SubmitProjectResult = {
  id: string;
  code: string;
  status: ProjectStatus;
  submittedAt: Date;
  currentVersion: number;
  childTentativeId: string | null;
};

async function submitProjectImpl(projectId: string): Promise<SubmitProjectResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      programCycle: { select: { id: true, year: true, status: true } },
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.organizationId !== orgId) {
    throw new Error('Bạn không có quyền nộp đề án này');
  }

  const generalInfo = parseGeneralInfo(project.generalInfoJson);
  const objectives = parseObjectives(project.objectivesJson);
  const plan = parsePlan(project.planJson);
  const budget = parseBudget(project.budgetJson);

  // Idempotency — return existing if just submitted
  if (project.status === 'SUBMITTED' && project.submittedAt) {
    const elapsed = Date.now() - project.submittedAt.getTime();
    if (elapsed < IDEMPOTENCY_WINDOW_MS) {
      return {
        id: project.id,
        code: project.code,
        status: project.status as ProjectStatus,
        submittedAt: project.submittedAt,
        currentVersion: project.currentVersion,
        childTentativeId: null,
      };
    }
  }

  // Determine source state — handles RESUBMITTED path too (SUPPLEMENT_REQUIRED → RESUBMITTED)
  const fromStatus = project.status as ProjectStatus;
  const targetStatus: ProjectStatus =
    fromStatus === 'SUPPLEMENT_REQUIRED' ? 'RESUBMITTED' : 'SUBMITTED';

  if (!canTransitionProject(fromStatus, targetStatus)) {
    throw new Error(
      `Không thể chuyển từ trạng thái hiện tại sang "${targetStatus}"`,
    );
  }

  // Validate guards
  const guards = validateGuards(
    {
      status: fromStatus,
      name: project.name,
      kind: project.kind,
      pmContactId: project.pmContactId,
      generalInfo,
      objectives,
      plan,
      budget,
      programCycleStatus: project.programCycle.status,
      assignedToUserId: project.assignedReviewerId,
    },
    targetStatus,
  );
  if (!guards.ok) {
    throw new Error(
      'Hồ sơ chưa đầy đủ:\n• ' + guards.errors.join('\n• '),
    );
  }

  // Snapshot before mutation
  const snapshot = {
    name: project.name,
    kind: project.kind,
    year: project.year,
    generalInfo,
    objectives,
    plan,
    budget,
    pmContactId: project.pmContactId,
    status: project.status,
    capturedAt: new Date().toISOString(),
  };

  const now = new Date();
  const nextVersion = project.currentVersion + 1;

  // Atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    await tx.projectVersion.create({
      data: {
        projectId: project.id,
        versionNumber: project.currentVersion,
        snapshotJson: JSON.stringify(snapshot),
        reason:
          targetStatus === 'RESUBMITTED'
            ? 'Nộp lại sau yêu cầu bổ sung'
            : 'Nộp đề án',
        createdById: session.user.id,
      },
    });

    const updated = await tx.project.update({
      where: { id: project.id },
      data: {
        status: targetStatus,
        submittedAt: now,
        currentVersion: nextVersion,
      },
    });

    // Đề án 2 năm — only on first submit (DRAFT → SUBMITTED)
    let childTentativeId: string | null = null;
    if (
      targetStatus === 'SUBMITTED' &&
      generalInfo.isTwoYear === true &&
      typeof generalInfo.nextYear === 'number' &&
      !project.parentProjectId // don't recurse if already a child
    ) {
      const nextYear = generalInfo.nextYear;
      // Reuse same code base, suffix -P2
      const childCode = `${project.code}-P2`;
      const existingChild = await tx.project.findFirst({
        where: { parentProjectId: project.id },
        select: { id: true },
      });
      if (!existingChild) {
        const child = await tx.project.create({
          data: {
            code: childCode,
            programCycleId: project.programCycleId,
            organizationId: project.organizationId,
            parentProjectId: project.id,
            name: `${project.name} (Năm ${nextYear})`,
            year: nextYear,
            kind: project.kind,
            status: 'TENTATIVE',
            generalInfoJson: project.generalInfoJson,
            objectivesJson: project.objectivesJson,
            planJson: project.planJson,
            budgetJson: project.budgetJson,
            pmContactId: project.pmContactId,
            proposedBudget: project.proposedBudget,
            searchKey: project.searchKey,
            createdById: session.user.id,
          },
        });
        childTentativeId = child.id;
      } else {
        childTentativeId = existingChild.id;
      }
    }

    return { updated, childTentativeId };
  });

  // Mock notification: dispatch in-app notification to BQL users
  // (write-only — doesn't fail business action if notification dispatch errors)
  try {
    const banqlUsers = await prisma.user.findMany({
      where: { role: 'BANQL', isActive: true },
      select: { id: true },
    });
    if (banqlUsers.length > 0) {
      const notification = await prisma.notification.create({
        data: {
          projectId: project.id,
          type: 'CYCLE_OPENED', // reuse existing enum (Phase 5 to extend)
          subject: `Đề án mới từ ${project.code}`,
          content: `<p>Có đề án mới được nộp: <strong>${project.name}</strong> (mã ${project.code}).</p>`,
          recipientType: 'USER',
          createdById: session.user.id,
        },
      });
      await prisma.notificationDispatch.createMany({
        data: banqlUsers.map((u) => ({
          notificationId: notification.id,
          recipientUserId: u.id,
          status: 'SENT',
        })),
      });
    }
  } catch (err) {
    console.error('[submitProject] notification dispatch failed:', err);
  }

  revalidatePath('/de-an');
  revalidatePath(`/de-an/${project.id}`);
  if (result.childTentativeId) {
    revalidatePath(`/de-an/${result.childTentativeId}`);
  }

  return {
    id: result.updated.id,
    code: result.updated.code,
    status: result.updated.status as ProjectStatus,
    submittedAt: result.updated.submittedAt!,
    currentVersion: result.updated.currentVersion,
    childTentativeId: result.childTentativeId,
  };
}

export const submitProject = withAuditLog<[string], SubmitProjectResult>(
  {
    action: 'SUBMIT',
    resource: 'de-an',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      status: r.status,
      submittedAt: r.submittedAt,
      currentVersion: r.currentVersion,
      childTentativeId: r.childTentativeId,
    }),
  },
  submitProjectImpl,
);
