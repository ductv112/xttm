'use server';

// listPreviousProjects — return APPROVED/IN_PROGRESS/COMPLETED projects from the
// caller's organization (any prior year) so the user can prefill a new draft
// via copy-from-previous (PROJ-13).
//
// Cross-tenant guard: where.organizationId === session.user.organizationId.
// Status filter: only "successful" historical projects (APPROVED+) so user
// doesn't accidentally clone a rejected or cancelled draft.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export type PreviousProjectItem = {
  id: string;
  code: string;
  name: string;
  year: number;
  kind: string;
  status: string;
  programCycleYear: number;
  totalBudget: number | null;
  submittedAt: Date | null;
};

const COPY_ELIGIBLE_STATUSES = [
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export async function listPreviousProjects(): Promise<PreviousProjectItem[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  // ADMIN bypass: full data access — list previous projects across ALL orgs
  const isAdmin = session.user.role === ROLES.ADMIN;
  const orgId = session.user.organizationId;
  if (!isAdmin && !orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const rows = await prisma.project.findMany({
    where: {
      ...(isAdmin ? {} : { organizationId: orgId! }),
      deletedAt: null,
      status: { in: [...COPY_ELIGIBLE_STATUSES] },
    },
    orderBy: [{ year: 'desc' }, { submittedAt: 'desc' }],
    take: 50,
    include: {
      programCycle: { select: { year: true } },
    },
  });

  return rows.map((p) => {
    let totalBudget: number | null = null;
    if (p.budgetJson) {
      try {
        const parsed = JSON.parse(p.budgetJson);
        if (parsed && typeof parsed.total === 'number') totalBudget = parsed.total;
      } catch {
        totalBudget = null;
      }
    }
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      year: p.year,
      kind: p.kind,
      status: p.status,
      programCycleYear: p.programCycle.year,
      totalBudget,
      submittedAt: p.submittedAt,
    };
  });
}
