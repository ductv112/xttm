'use server';

// listSubmissionCandidates — list các đề án EVALUATING của chu kỳ active,
// sort theo điểm trung bình giảm dần (top of ranking → top of list).
// Used by SubmissionDraftForm.tsx multi-select project picker.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type SubmissionCandidate = {
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  proposedBudget: number | null;
  /** Hội đồng đã thẩm định (null nếu chưa) */
  councilName: string | null;
  councilId: string | null;
  /** Lock status của hội đồng */
  councilLockStatus: 'OPEN' | 'LOCKED' | null;
  /** Average submitted score (excluding COI) */
  averageScore: number | null;
  /** Số phiếu đã nộp (excluding COI) */
  submittedCount: number;
  totalMembers: number;
  /** Đã có quyết định phê duyệt cho đề án này chưa? */
  alreadyDecided: boolean;
};

export async function listSubmissionCandidates(): Promise<SubmissionCandidate[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'read'))) {
    throw new Error('Bạn không có quyền xem danh sách phê duyệt');
  }

  // Pick active cycle
  const activeCycle = await prisma.programCycle.findFirst({
    where: {
      status: { in: ['EVALUATING', 'CLOSED_REGISTRATION', 'OPEN_REGISTRATION'] },
    },
    orderBy: { year: 'desc' },
    select: { id: true, year: true },
  });
  const targetCycle =
    activeCycle ??
    (await prisma.programCycle.findFirst({
      orderBy: { year: 'desc' },
      select: { id: true, year: true },
    }));
  if (!targetCycle) return [];

  // Load EVALUATING projects
  const projects = await prisma.project.findMany({
    where: {
      programCycleId: targetCycle.id,
      status: 'EVALUATING',
      deletedAt: null,
    },
    include: {
      organization: { select: { name: true } },
    },
  });

  // Load assignments + sheets in batch
  const projectIds = projects.map((p) => p.id);
  const [assignments, sheets, decisions] = await Promise.all([
    prisma.projectCouncilAssignment.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        council: { select: { id: true, name: true, lockStatus: true } },
      },
    }),
    prisma.scoreSheet.findMany({
      where: {
        projectId: { in: projectIds },
        kind: 'EVALUATION',
        status: 'SUBMITTED',
      },
    }),
    prisma.approvalDecision.findMany({
      select: { approvedItemsJson: true },
    }),
  ]);

  // Build council lookup per project
  const assignmentByProject = new Map<
    string,
    { councilId: string; councilName: string; lockStatus: 'OPEN' | 'LOCKED' }
  >();
  for (const a of assignments) {
    if (!assignmentByProject.has(a.projectId)) {
      assignmentByProject.set(a.projectId, {
        councilId: a.council.id,
        councilName: a.council.name,
        lockStatus: (a.council.lockStatus as 'OPEN' | 'LOCKED') ?? 'OPEN',
      });
    }
  }

  // Compute member counts per council
  const councilIds = [...new Set(assignments.map((a) => a.councilId))];
  const memberCounts = councilIds.length
    ? await prisma.councilMember.groupBy({
        by: ['councilId'],
        where: { councilId: { in: councilIds } },
        _count: { _all: true },
      })
    : [];
  const memberCountByCouncil = new Map(
    memberCounts.map((m) => [m.councilId, m._count._all] as const),
  );

  // Compute averages per project (exclude COI)
  const sheetsByProject = new Map<
    string,
    Array<{ totalScore: number | null; conflictOfInterest: boolean }>
  >();
  for (const s of sheets) {
    if (!sheetsByProject.has(s.projectId))
      sheetsByProject.set(s.projectId, []);
    sheetsByProject.get(s.projectId)!.push({
      totalScore: s.totalScore,
      conflictOfInterest: s.conflictOfInterest,
    });
  }

  // Build set of already-decided project ids
  const decidedProjectIds = new Set<string>();
  for (const d of decisions) {
    try {
      const arr = JSON.parse(d.approvedItemsJson);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (typeof item?.projectId === 'string') {
            decidedProjectIds.add(item.projectId);
          }
        }
      }
    } catch {
      // ignore parse error
    }
  }

  const rows: SubmissionCandidate[] = projects.map((p) => {
    const sheets = sheetsByProject.get(p.id) ?? [];
    const validForAvg = sheets.filter(
      (s) => !s.conflictOfInterest && s.totalScore !== null,
    );
    const avg =
      validForAvg.length > 0
        ? Math.round(
            (validForAvg.reduce((a, s) => a + (s.totalScore ?? 0), 0) /
              validForAvg.length) *
              100,
          ) / 100
        : null;

    const assignment = assignmentByProject.get(p.id);
    return {
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      organizationName: p.organization.name,
      proposedBudget: p.proposedBudget,
      councilName: assignment?.councilName ?? null,
      councilId: assignment?.councilId ?? null,
      councilLockStatus: assignment?.lockStatus ?? null,
      averageScore: avg,
      submittedCount: validForAvg.length,
      totalMembers: assignment
        ? memberCountByCouncil.get(assignment.councilId) ?? 0
        : 0,
      alreadyDecided: decidedProjectIds.has(p.id),
    };
  });

  // Sort by averageScore desc (null scores at bottom)
  rows.sort((a, b) => {
    const aS = a.averageScore ?? -1;
    const bS = b.averageScore ?? -1;
    return bS - aS;
  });

  return rows;
}

// ---------------------------------------------------------------------------
// listSubmissions — list các tờ trình đã được lập trong chu kỳ hiện tại.
// ---------------------------------------------------------------------------

export type SubmissionRow = {
  id: string;
  draftNumber: string | null;
  draftedAt: Date;
  status: 'DRAFT' | 'SUBMITTED_TO_BO';
  projectCount: number;
  totalProposedBudget: number;
  hasDecision: boolean;
  decisionNumber: string | null;
  decisionDate: Date | null;
  totalApprovedBudget: number | null;
};

export async function listSubmissions(): Promise<SubmissionRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'read'))) {
    throw new Error('Bạn không có quyền xem danh sách tờ trình');
  }

  const activeCycle = await prisma.programCycle.findFirst({
    where: {
      status: { in: ['EVALUATING', 'CLOSED_REGISTRATION', 'APPROVED', 'COMPLETED'] },
    },
    orderBy: { year: 'desc' },
    select: { id: true },
  });
  if (!activeCycle) return [];

  const submissions = await prisma.submissionDraft.findMany({
    where: { programCycleId: activeCycle.id },
    orderBy: { draftedAt: 'desc' },
    include: { decision: true },
  });

  // Compute total proposed budgets via project lookup
  const allProjectIds = new Set<string>();
  const projectIdsBySubmission = new Map<string, string[]>();
  for (const s of submissions) {
    let ids: string[] = [];
    try {
      const parsed = JSON.parse(s.projectIdsJson);
      if (Array.isArray(parsed)) ids = parsed.filter((x) => typeof x === 'string');
    } catch {
      ids = [];
    }
    projectIdsBySubmission.set(s.id, ids);
    for (const id of ids) allProjectIds.add(id);
  }

  const projects = allProjectIds.size
    ? await prisma.project.findMany({
        where: { id: { in: [...allProjectIds] } },
        select: { id: true, proposedBudget: true },
      })
    : [];
  const proposedBudgetById = new Map(
    projects.map((p) => [p.id, p.proposedBudget ?? 0]),
  );

  return submissions.map((s) => {
    const ids = projectIdsBySubmission.get(s.id) ?? [];
    const totalProposed = ids.reduce(
      (acc, id) => acc + (proposedBudgetById.get(id) ?? 0),
      0,
    );
    return {
      id: s.id,
      draftNumber: s.draftNumber,
      draftedAt: s.draftedAt,
      status: (s.status as 'DRAFT' | 'SUBMITTED_TO_BO') ?? 'DRAFT',
      projectCount: ids.length,
      totalProposedBudget: totalProposed,
      hasDecision: !!s.decision,
      decisionNumber: s.decision?.decisionNumber ?? null,
      decisionDate: s.decision?.decisionDate ?? null,
      totalApprovedBudget: s.decision?.totalApprovedBudget ?? null,
    };
  });
}
