'use server';

// listCouncils — BQL view các hội đồng thẩm định trong chu kỳ active.
// Returns councils with member count + assignment count + submitted scoresheet count.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type CouncilListRow = {
  id: string;
  name: string;
  term: string;
  lockStatus: 'OPEN' | 'LOCKED';
  programCycleYear: number;
  programCycleStatus: string;
  memberCount: number;
  assignmentCount: number;
  submittedSheetCount: number;
  createdAt: Date;
};

/**
 * List councils trong cycle active (OPEN_REGISTRATION/CLOSED_REGISTRATION/EVALUATING).
 * Falls back to most recent cycle if none active.
 */
export async function listCouncils(): Promise<CouncilListRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    throw new Error('Bạn không có quyền xem hội đồng thẩm định');
  }

  // Pick relevant cycle: ưu tiên cycle có status EVALUATING / CLOSED_REGISTRATION /
  // OPEN_REGISTRATION; fallback most recent.
  const activeCycle = await prisma.programCycle.findFirst({
    where: {
      status: { in: ['EVALUATING', 'CLOSED_REGISTRATION', 'OPEN_REGISTRATION'] },
    },
    orderBy: { year: 'desc' },
    select: { id: true, year: true, status: true },
  });

  const targetCycle =
    activeCycle ??
    (await prisma.programCycle.findFirst({
      orderBy: { year: 'desc' },
      select: { id: true, year: true, status: true },
    }));
  if (!targetCycle) return [];

  const councils = await prisma.evaluationCouncil.findMany({
    where: { programCycleId: targetCycle.id },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      _count: {
        select: { members: true, assignments: true },
      },
    },
  });

  // Submitted score sheet count per council
  const sheetCounts = await prisma.scoreSheet.groupBy({
    by: ['councilId'],
    where: {
      kind: 'EVALUATION',
      status: 'SUBMITTED',
      councilId: { in: councils.map((c) => c.id) },
    },
    _count: { _all: true },
  });
  const sheetCountByCouncil = new Map(
    sheetCounts.map((r) => [r.councilId, r._count._all] as const),
  );

  return councils.map((c) => ({
    id: c.id,
    name: c.name,
    term: c.term,
    lockStatus: (c.lockStatus as 'OPEN' | 'LOCKED') ?? 'OPEN',
    programCycleYear: targetCycle.year,
    programCycleStatus: targetCycle.status,
    memberCount: c._count.members,
    assignmentCount: c._count.assignments,
    submittedSheetCount: sheetCountByCouncil.get(c.id) ?? 0,
    createdAt: c.createdAt,
  }));
}
