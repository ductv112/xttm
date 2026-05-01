'use server';

// listAssignedProjects — list các đề án trong hội đồng mà user (HOIDONG) được giao chấm.
// Returns project list + sheet status + council info.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type AssignedProjectRow = {
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  proposedBudget: number | null;
  projectStatus: string;
  councilId: string;
  councilName: string;
  councilTerm: string;
  councilLockStatus: 'OPEN' | 'LOCKED';
  scoreSheetStatus: 'DRAFT' | 'SUBMITTED' | null;
  scoreSheetTotalScore: number | null;
  scoreSheetConflictOfInterest: boolean | null;
  memberRole: string;
};

export async function listAssignedProjects(): Promise<AssignedProjectRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const userId = session.user.id;

  // Find all CouncilMember rows for this user
  const memberships = await prisma.councilMember.findMany({
    where: { userId },
    include: {
      council: {
        select: {
          id: true,
          name: true,
          term: true,
          lockStatus: true,
          assignments: {
            include: {
              // we'll resolve project + organization separately for type clarity
            },
          },
        },
      },
    },
  });

  if (memberships.length === 0) return [];

  const projectIds = new Set<string>();
  for (const m of memberships) {
    for (const a of m.council.assignments) {
      projectIds.add(a.projectId);
    }
  }
  if (projectIds.size === 0) return [];

  const projects = await prisma.project.findMany({
    where: { id: { in: Array.from(projectIds) } },
    include: {
      organization: { select: { name: true } },
    },
  });
  const projectById = new Map(projects.map((p) => [p.id, p]));

  // ScoreSheets per (projectId, reviewerId=user, kind=EVALUATION)
  const sheets = await prisma.scoreSheet.findMany({
    where: {
      reviewerId: userId,
      kind: 'EVALUATION',
      projectId: { in: Array.from(projectIds) },
    },
  });
  const sheetByProject = new Map(sheets.map((s) => [s.projectId, s]));

  const rows: AssignedProjectRow[] = [];
  for (const m of memberships) {
    for (const a of m.council.assignments) {
      const proj = projectById.get(a.projectId);
      if (!proj) continue;
      const sheet = sheetByProject.get(a.projectId);
      rows.push({
        projectId: proj.id,
        projectCode: proj.code,
        projectName: proj.name,
        organizationName: proj.organization.name,
        proposedBudget: proj.proposedBudget,
        projectStatus: proj.status,
        councilId: m.council.id,
        councilName: m.council.name,
        councilTerm: m.council.term,
        councilLockStatus: (m.council.lockStatus as 'OPEN' | 'LOCKED') ?? 'OPEN',
        scoreSheetStatus: sheet
          ? ((sheet.status as 'DRAFT' | 'SUBMITTED') ?? 'DRAFT')
          : null,
        scoreSheetTotalScore: sheet?.totalScore ?? null,
        scoreSheetConflictOfInterest: sheet?.conflictOfInterest ?? null,
        memberRole: m.role,
      });
    }
  }
  return rows;
}
