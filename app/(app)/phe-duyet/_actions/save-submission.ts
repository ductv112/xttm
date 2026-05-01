'use server';

// saveSubmission / finalizeSubmission — BQL soạn / chốt tờ trình phê duyệt.
// Audit: SUBMISSION_CREATE / SUBMISSION_UPDATE / SUBMISSION_FINALIZE.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import type { Role } from '@/lib/constants';

export type SaveSubmissionInput = {
  /** Update existing if id provided, else create new */
  id?: string | null;
  programCycleId?: string | null; // optional override; defaults to active cycle
  councilId?: string | null;
  draftNumber?: string | null;
  projectIds: string[];
  contentHtml: string;
};

export type SaveSubmissionResult = {
  id: string;
  status: 'DRAFT' | 'SUBMITTED_TO_BO';
  projectCount: number;
};

async function saveSubmissionImpl(
  input: SaveSubmissionInput,
): Promise<SaveSubmissionResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'create'))) {
    throw new Error('Bạn không có quyền soạn tờ trình');
  }

  if (!Array.isArray(input.projectIds) || input.projectIds.length === 0) {
    throw new Error('Tờ trình phải có ít nhất 1 đề án');
  }
  if (input.projectIds.length > 50) {
    throw new Error('Tờ trình tối đa 50 đề án');
  }

  if (!input.contentHtml || input.contentHtml.trim().length < 50) {
    throw new Error('Nội dung tờ trình quá ngắn (tối thiểu 50 ký tự)');
  }

  // Resolve cycle
  let cycleId = input.programCycleId ?? null;
  if (!cycleId) {
    const c = await prisma.programCycle.findFirst({
      where: {
        status: { in: ['EVALUATING', 'CLOSED_REGISTRATION', 'APPROVED'] },
      },
      orderBy: { year: 'desc' },
      select: { id: true },
    });
    if (!c) throw new Error('Không có chu kỳ chương trình thẩm định');
    cycleId = c.id;
  }

  // Validate all project ids exist + are EVALUATING
  const projects = await prisma.project.findMany({
    where: { id: { in: input.projectIds } },
    select: { id: true, status: true },
  });
  const projectIdsValid = projects.map((p) => p.id);
  if (projectIdsValid.length !== input.projectIds.length) {
    throw new Error('Một số đề án không tồn tại');
  }

  const draftNumber = input.draftNumber?.trim() || null;

  let resultId: string;
  let status: 'DRAFT' | 'SUBMITTED_TO_BO' = 'DRAFT';
  if (input.id) {
    // Block update if decision exists
    const existing = await prisma.submissionDraft.findUnique({
      where: { id: input.id },
      include: { decision: true },
    });
    if (!existing) throw new Error('Không tìm thấy tờ trình');
    if (existing.decision) {
      throw new Error(
        'Tờ trình đã có quyết định phê duyệt — không thể chỉnh sửa',
      );
    }
    const updated = await prisma.submissionDraft.update({
      where: { id: input.id },
      data: {
        programCycleId: cycleId,
        councilId: input.councilId ?? null,
        draftNumber,
        projectIdsJson: JSON.stringify(projectIdsValid),
        contentHtml: input.contentHtml,
      },
      select: { id: true, status: true },
    });
    resultId = updated.id;
    status = (updated.status as 'DRAFT' | 'SUBMITTED_TO_BO') ?? 'DRAFT';
  } else {
    const created = await prisma.submissionDraft.create({
      data: {
        programCycleId: cycleId,
        councilId: input.councilId ?? null,
        draftNumber,
        draftedById: session.user.id,
        projectIdsJson: JSON.stringify(projectIdsValid),
        contentHtml: input.contentHtml,
        status: 'DRAFT',
      },
      select: { id: true, status: true },
    });
    resultId = created.id;
    status = 'DRAFT';
  }

  revalidatePath('/phe-duyet');
  revalidatePath(`/phe-duyet/${resultId}`);

  return {
    id: resultId,
    status,
    projectCount: projectIdsValid.length,
  };
}

export const saveSubmission = withAuditLog<
  [SaveSubmissionInput],
  SaveSubmissionResult
>(
  {
    action: 'CREATE',
    resource: 'phe-duyet',
    resourceIdFromResult: (r) => r.id,
    captureAfter: (r) => ({
      submissionId: r.id,
      status: r.status,
      projectCount: r.projectCount,
      kind: 'SUBMISSION_SAVE',
    }),
    metadata: { reason: 'BQL soạn / cập nhật tờ trình phê duyệt' },
  },
  saveSubmissionImpl,
);

// ---------------------------------------------------------------------------

async function finalizeSubmissionImpl(
  submissionId: string,
): Promise<{ id: string; status: 'SUBMITTED_TO_BO'; submittedAt: Date }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'create'))) {
    throw new Error('Bạn không có quyền chốt tờ trình');
  }

  const submission = await prisma.submissionDraft.findUnique({
    where: { id: submissionId },
    include: { decision: true },
  });
  if (!submission) throw new Error('Không tìm thấy tờ trình');
  if (submission.decision) {
    throw new Error('Tờ trình đã có quyết định phê duyệt');
  }
  if (submission.status === 'SUBMITTED_TO_BO') {
    return {
      id: submission.id,
      status: 'SUBMITTED_TO_BO',
      submittedAt: submission.submittedToBoAt ?? new Date(),
    };
  }

  const now = new Date();
  const updated = await prisma.submissionDraft.update({
    where: { id: submissionId },
    data: { status: 'SUBMITTED_TO_BO', submittedToBoAt: now },
    select: { id: true, submittedToBoAt: true },
  });
  revalidatePath('/phe-duyet');
  revalidatePath(`/phe-duyet/${submissionId}`);
  return {
    id: updated.id,
    status: 'SUBMITTED_TO_BO',
    submittedAt: updated.submittedToBoAt ?? now,
  };
}

export const finalizeSubmission = withAuditLog<
  [string],
  { id: string; status: 'SUBMITTED_TO_BO'; submittedAt: Date }
>(
  {
    action: 'SUBMIT',
    resource: 'phe-duyet',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      submissionId: r.id,
      status: r.status,
      submittedAt: r.submittedAt,
      kind: 'SUBMISSION_FINALIZE',
    }),
    metadata: { reason: 'BQL chốt tờ trình gửi Bộ' },
  },
  finalizeSubmissionImpl,
);

// ---------------------------------------------------------------------------
// getSubmissionDetail — load submission + linked projects + decision (if any).
// ---------------------------------------------------------------------------

export type SubmissionDetailProject = {
  id: string;
  code: string;
  name: string;
  organizationName: string;
  proposedBudget: number | null;
  status: string;
  averageScore: number | null;
  rank: number | null;
};

export type SubmissionDetail = {
  id: string;
  draftNumber: string | null;
  draftedAt: Date;
  status: 'DRAFT' | 'SUBMITTED_TO_BO';
  submittedToBoAt: Date | null;
  contentHtml: string;
  projects: SubmissionDetailProject[];
  programCycleYear: number;
  councilId: string | null;
  councilName: string | null;
  decision: {
    id: string;
    decisionNumber: string;
    decisionDate: Date;
    signedByName: string;
    signedByTitle: string;
    totalApprovedBudget: number;
    notes: string | null;
    approvedItems: Array<{
      projectId: string;
      approvedBudget: number;
      comments?: string;
    }>;
  } | null;
};

export async function getSubmissionDetail(
  id: string,
): Promise<SubmissionDetail | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'read'))) {
    throw new Error('Bạn không có quyền xem');
  }

  const submission = await prisma.submissionDraft.findUnique({
    where: { id },
    include: { decision: true },
  });
  if (!submission) return null;

  let projectIds: string[] = [];
  try {
    const parsed = JSON.parse(submission.projectIdsJson);
    if (Array.isArray(parsed)) {
      projectIds = parsed.filter((x: unknown): x is string => typeof x === 'string');
    }
  } catch {
    projectIds = [];
  }

  const [projects, cycle, council] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: { organization: { select: { name: true } } },
    }),
    prisma.programCycle.findUnique({
      where: { id: submission.programCycleId },
      select: { year: true },
    }),
    submission.councilId
      ? prisma.evaluationCouncil.findUnique({
          where: { id: submission.councilId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  // Compute average per project
  const sheets = await prisma.scoreSheet.findMany({
    where: {
      projectId: { in: projectIds },
      kind: 'EVALUATION',
      status: 'SUBMITTED',
    },
  });
  const validForAvg = new Map<string, number[]>();
  for (const s of sheets) {
    if (s.conflictOfInterest || s.totalScore === null) continue;
    if (!validForAvg.has(s.projectId)) validForAvg.set(s.projectId, []);
    validForAvg.get(s.projectId)!.push(s.totalScore);
  }
  const avgByProject = new Map<string, number>();
  for (const [pid, scores] of validForAvg.entries()) {
    if (scores.length > 0) {
      avgByProject.set(
        pid,
        Math.round(
          (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
        ) / 100,
      );
    }
  }

  // Rank by avg desc
  const rankedIds = [...avgByProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  const rankByProject = new Map<string, number>();
  rankedIds.forEach((id, idx) => rankByProject.set(id, idx + 1));

  // Sort projects in original order from JSON; consumer can re-sort
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const orderedProjects: SubmissionDetailProject[] = projectIds
    .map((id) => {
      const p = projectMap.get(id);
      if (!p) return null;
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        organizationName: p.organization.name,
        proposedBudget: p.proposedBudget,
        status: p.status,
        averageScore: avgByProject.get(p.id) ?? null,
        rank: rankByProject.get(p.id) ?? null,
      };
    })
    .filter((x): x is SubmissionDetailProject => x !== null);

  let decision: SubmissionDetail['decision'] = null;
  if (submission.decision) {
    let approvedItems: NonNullable<
      SubmissionDetail['decision']
    >['approvedItems'] = [];
    try {
      const parsed = JSON.parse(submission.decision.approvedItemsJson);
      if (Array.isArray(parsed)) {
        approvedItems = parsed
          .filter(
            (x: unknown): x is { projectId: string; approvedBudget: number; comments?: string } =>
              typeof x === 'object' &&
              x !== null &&
              typeof (x as { projectId?: unknown }).projectId === 'string' &&
              typeof (x as { approvedBudget?: unknown }).approvedBudget === 'number',
          )
          .map((x) => ({
            projectId: x.projectId,
            approvedBudget: x.approvedBudget,
            comments: x.comments,
          }));
      }
    } catch {
      approvedItems = [];
    }

    decision = {
      id: submission.decision.id,
      decisionNumber: submission.decision.decisionNumber,
      decisionDate: submission.decision.decisionDate,
      signedByName: submission.decision.signedByName,
      signedByTitle: submission.decision.signedByTitle,
      totalApprovedBudget: submission.decision.totalApprovedBudget,
      notes: submission.decision.notes,
      approvedItems,
    };
  }

  return {
    id: submission.id,
    draftNumber: submission.draftNumber,
    draftedAt: submission.draftedAt,
    status: (submission.status as 'DRAFT' | 'SUBMITTED_TO_BO') ?? 'DRAFT',
    submittedToBoAt: submission.submittedToBoAt,
    contentHtml: submission.contentHtml,
    projects: orderedProjects,
    programCycleYear: cycle?.year ?? 0,
    councilId: submission.councilId,
    councilName: council?.name ?? null,
    decision,
  };
}
