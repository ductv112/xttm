'use server';

// listCycles — paginated list of ProgramCycle for card view (Plan 03-05).
// RBAC line 1-3: auth + canFromDB('chuong-trinh', 'read').

import type { Prisma } from '@prisma/client';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { ProgramCycleStatus } from '@/lib/workflows/programCycle';
import type { CycleListFilter, CycleListItem } from './types';

const MS_PER_DAY = 86_400_000;

function safeParseStringArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    // ignore — return empty
  }
  return [];
}

function computeDaysRemaining(closeAt: Date | null): number | null {
  if (!closeAt) return null;
  const diff = closeAt.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}

export async function listCycles(
  filter: CycleListFilter | undefined = undefined,
): Promise<CycleListItem[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'read'))) {
    throw new Error('Bạn không có quyền truy cập danh sách chu kỳ chương trình');
  }

  const where: Prisma.ProgramCycleWhereInput = {};
  if (filter?.year !== undefined && Number.isFinite(filter.year)) {
    where.year = filter.year;
  }
  if (filter?.statuses && filter.statuses.length > 0) {
    where.status = { in: filter.statuses };
  }

  const rows = await prisma.programCycle.findMany({
    where,
    orderBy: { year: 'desc' },
    include: {
      _count: { select: { projects: true } },
    },
  });

  return rows.map((row) => {
    const invitedOrgIds = safeParseStringArray(row.invitedOrganizations);
    return {
      id: row.id,
      year: row.year,
      name: row.name,
      status: row.status as ProgramCycleStatus,
      totalBudget: row.totalBudget,
      registrationOpenAt: row.registrationOpenAt,
      registrationCloseAt: row.registrationCloseAt,
      supplementDeadline: row.supplementDeadline,
      createdAt: row.createdAt,
      projectCount: row._count.projects,
      invitedOrgCount: invitedOrgIds.length,
      daysRemaining: computeDaysRemaining(row.registrationCloseAt),
    };
  });
}
