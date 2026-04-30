'use server';

// getAggregateScores — tổng hợp điểm trung bình + ranking các đề án trong hội đồng.
// Real-time data layer cho BQL view + báo cáo PDF.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type AggregateProjectScore = {
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  proposedBudget: number | null;
  /** Số phiếu đã nộp cho đề án này */
  submittedCount: number;
  /** Tổng số thành viên hội đồng — báo cho biết tỉ lệ chấm điểm */
  totalMembers: number;
  /** Số phiếu COI (xung đột lợi ích) — ko đếm vào avg */
  coiCount: number;
  /** Trung bình điểm tổng (totalScore) qua các phiếu SUBMITTED không COI; null khi 0 phiếu hợp lệ */
  averageScore: number | null;
  /** Min/Max */
  minScore: number | null;
  maxScore: number | null;
  /** Ranking (1-based) sau khi sort desc bởi averageScore — null khi chưa có điểm */
  rank: number | null;
  /** Project status snapshot */
  status: string;
  approvedBudget: number | null;
};

export type AggregateScoreSheet = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string | null;
  status: 'DRAFT' | 'SUBMITTED';
  totalScore: number | null;
  conflictOfInterest: boolean;
  submittedAt: Date | null;
  comment: string | null;
};

export type CouncilAggregate = {
  council: {
    id: string;
    name: string;
    term: string;
    lockStatus: 'OPEN' | 'LOCKED';
    programCycleYear: number;
    programCycleId: string;
  };
  members: Array<{
    id: string;
    userId: string;
    fullName: string;
    role: string;
    submittedSheetCount: number;
    draftSheetCount: number;
  }>;
  projects: AggregateProjectScore[];
  /** All sheets keyed by projectId for drill-down */
  sheetsByProject: Record<string, AggregateScoreSheet[]>;
};

export async function getAggregateScores(
  councilId: string,
): Promise<CouncilAggregate | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    throw new Error('Bạn không có quyền xem kết quả thẩm định');
  }

  const council = await prisma.evaluationCouncil.findUnique({
    where: { id: councilId },
    include: {
      programCycle: { select: { year: true, id: true } },
      members: {
        orderBy: { joinedAt: 'asc' },
      },
      assignments: {
        orderBy: { assignedAt: 'asc' },
      },
    },
  });
  if (!council) return null;

  const projectIds = council.assignments.map((a) => a.projectId);
  const memberUserIds = council.members.map((m) => m.userId);

  // Load projects
  const projects = projectIds.length
    ? await prisma.project.findMany({
        where: { id: { in: projectIds } },
        include: { organization: { select: { name: true } } },
      })
    : [];
  const projectById = new Map(projects.map((p) => [p.id, p] as const));

  // Load member users (parallel)
  const memberUsers = memberUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: memberUserIds } },
        select: { id: true, fullName: true, role: true },
      })
    : [];
  const userById = new Map(memberUsers.map((u) => [u.id, u] as const));

  // Load all evaluation scoresheets for this council
  const sheets = await prisma.scoreSheet.findMany({
    where: { councilId, kind: 'EVALUATION' },
    orderBy: { updatedAt: 'desc' },
  });

  // Build sheets by project
  const sheetsByProject: Record<string, AggregateScoreSheet[]> = {};
  for (const s of sheets) {
    const reviewerUser = userById.get(s.reviewerId);
    const entry: AggregateScoreSheet = {
      id: s.id,
      reviewerId: s.reviewerId,
      reviewerName: reviewerUser?.fullName ?? '(không rõ)',
      reviewerRole:
        council.members.find((m) => m.userId === s.reviewerId)?.role ?? null,
      status: (s.status as 'DRAFT' | 'SUBMITTED') ?? 'DRAFT',
      totalScore: s.totalScore,
      conflictOfInterest: s.conflictOfInterest,
      submittedAt: s.submittedAt,
      comment: s.comment,
    };
    if (!sheetsByProject[s.projectId]) sheetsByProject[s.projectId] = [];
    sheetsByProject[s.projectId]!.push(entry);
  }

  // Compute per-project aggregates
  const totalMembers = council.members.length;
  const projectAggregates: AggregateProjectScore[] = [];
  for (const pid of projectIds) {
    const proj = projectById.get(pid);
    if (!proj) continue;
    const projSheets = sheetsByProject[pid] ?? [];
    const submitted = projSheets.filter((s) => s.status === 'SUBMITTED');
    const validForAvg = submitted.filter(
      (s) => !s.conflictOfInterest && s.totalScore !== null,
    );
    const coiCount = submitted.filter((s) => s.conflictOfInterest).length;

    let avg: number | null = null;
    let min: number | null = null;
    let max: number | null = null;
    if (validForAvg.length > 0) {
      const scores = validForAvg.map((s) => s.totalScore ?? 0);
      avg =
        Math.round(
          (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
        ) / 100;
      min = Math.min(...scores);
      max = Math.max(...scores);
    }

    projectAggregates.push({
      projectId: pid,
      projectCode: proj.code,
      projectName: proj.name,
      organizationName: proj.organization.name,
      proposedBudget: proj.proposedBudget,
      submittedCount: submitted.length,
      totalMembers,
      coiCount,
      averageScore: avg,
      minScore: min,
      maxScore: max,
      rank: null,
      status: proj.status,
      approvedBudget: proj.approvedBudget,
    });
  }

  // Compute rank — projects with averageScore !== null sorted desc; ties share rank
  const ranked = [...projectAggregates]
    .filter((p) => p.averageScore !== null)
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
  ranked.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  // Member sheet counts
  const memberRows = council.members.map((m) => {
    const submittedCount = sheets.filter(
      (s) => s.reviewerId === m.userId && s.status === 'SUBMITTED',
    ).length;
    const draftCount = sheets.filter(
      (s) => s.reviewerId === m.userId && s.status === 'DRAFT',
    ).length;
    const u = userById.get(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      fullName: u?.fullName ?? '(không rõ)',
      role: m.role,
      submittedSheetCount: submittedCount,
      draftSheetCount: draftCount,
    };
  });

  return {
    council: {
      id: council.id,
      name: council.name,
      term: council.term,
      lockStatus: (council.lockStatus as 'OPEN' | 'LOCKED') ?? 'OPEN',
      programCycleYear: council.programCycle.year,
      programCycleId: council.programCycle.id,
    },
    members: memberRows,
    projects: projectAggregates,
    sheetsByProject,
  };
}
