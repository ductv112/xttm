'use server';

// listMyProjects — return projects for the logged-in DONVI user's organization.
// Cross-tenant guard (T-05-01-02): always filter by session.user.organizationId.
// Filters: year + status + kind (all optional).

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ProjectStatus } from '@/lib/workflows/project';

export type ListMyProjectsFilters = {
  year?: number;
  status?: ProjectStatus | string;
  kind?: string;
};

export type MyProjectListItem = {
  id: string;
  code: string;
  name: string;
  year: number;
  kind: string;
  status: string;
  programCycleYear: number | null;
  programCycleName: string | null;
  programCycleStatus: string | null;
  parentProjectId: string | null;
  submittedAt: Date | null;
  totalBudget: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listMyProjects(
  filters: ListMyProjectsFilters = {},
): Promise<MyProjectListItem[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const where: {
    organizationId: string;
    deletedAt: null;
    year?: number;
    status?: string;
    kind?: string;
  } = {
    organizationId: orgId,
    deletedAt: null,
  };
  if (filters.year !== undefined) where.year = filters.year;
  if (filters.status) where.status = filters.status as string;
  if (filters.kind) where.kind = filters.kind;

  const rows = await prisma.project.findMany({
    where,
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: {
      programCycle: {
        select: { year: true, name: true, status: true },
      },
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
    if (totalBudget === null && typeof p.proposedBudget === 'number') {
      totalBudget = p.proposedBudget;
    }
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      year: p.year,
      kind: p.kind,
      status: p.status,
      programCycleYear: p.programCycle?.year ?? null,
      programCycleName: p.programCycle?.name ?? null,
      programCycleStatus: p.programCycle?.status ?? null,
      parentProjectId: p.parentProjectId,
      submittedAt: p.submittedAt,
      totalBudget,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });
}
