'use server';

// listProjectsForRole — master list cấp hệ thống cho mọi role (trừ DONVI dùng listMyProjects).
// Phạm vi xem theo role:
//   - ADMIN / BANQL / LANHDAO: tất cả đề án
//   - CHUYENVIEN: tất cả đề án (filter mineOnly để chỉ xem assigned của mình)
//   - HOIDONG: đề án ở giai đoạn thẩm định trở đi (VALID, EVALUATING, APPROVED, REJECTED, REJECTED_FINAL, IN_PROGRESS, COMPLETED)
//   - TAICHINH: đề án có hợp đồng (APPROVED, IN_PROGRESS, COMPLETED)

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { ROLES, type Role } from '@/lib/constants';
import type { Prisma } from '@prisma/client';

export type MasterFilters = {
  search?: string;
  status?: string;
  year?: number;
  kind?: string;
  organizationId?: string;
  mineOnly?: boolean;
};

export type MasterProjectRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  status: string;
  organizationId: string;
  organizationName: string;
  programCycleYear: number;
  programCycleId: string;
  totalBudget: number | null;
  approvedBudget: number | null;
  submittedAt: Date | null;
  receivedAt: Date | null;
  assignedReviewerId: string | null;
  assignedReviewerName: string | null;
  approvedAt: Date | null;
  decisionNumber: string | null;
  hasContract: boolean;
  hasReport: boolean;
  hasAcceptance: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const HOIDONG_SCOPE = [
  'VALID',
  'EVALUATING',
  'APPROVED',
  'REJECTED',
  'REJECTED_FINAL',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

const TAICHINH_SCOPE = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] as const;

export async function listProjectsForRole(
  filters: MasterFilters = {},
): Promise<MasterProjectRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'de-an', 'read'))) {
    throw new Error('Bạn không có quyền xem danh sách đề án');
  }

  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
  };

  // Role-scoped status filter
  if (role === ROLES.HOIDONG) {
    where.status = { in: [...HOIDONG_SCOPE] };
  } else if (role === ROLES.TAICHINH) {
    where.status = { in: [...TAICHINH_SCOPE] };
  }

  // CHUYENVIEN "mineOnly" filter
  if (role === ROLES.CHUYENVIEN && filters.mineOnly) {
    where.assignedReviewerId = session.user.id;
  }

  // Common filters
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.year !== undefined) {
    where.programCycle = { year: filters.year };
  }
  if (filters.kind) {
    where.kind = filters.kind;
  }
  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  }
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q } },
      { code: { contains: q } },
      { organization: { name: { contains: q } } },
      { searchKey: { contains: q.toLowerCase() } },
    ];
  }

  const rows = await prisma.project.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      organization: { select: { name: true } },
      programCycle: { select: { id: true, year: true } },
      contract: { select: { id: true, signedDate: true } },
      reports: { select: { id: true }, take: 1 },
      acceptanceRecords: { select: { id: true }, take: 1 },
    },
  });

  // Resolve assigned reviewer names in 1 batch query
  const reviewerIds = Array.from(
    new Set(
      rows
        .map((r) => r.assignedReviewerId)
        .filter((v): v is string => Boolean(v)),
    ),
  );
  const reviewerMap = new Map<string, string>();
  if (reviewerIds.length > 0) {
    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, fullName: true },
    });
    for (const u of reviewers) {
      reviewerMap.set(u.id, u.fullName);
    }
  }

  return rows.map((p) => {
    let totalBudget: number | null = null;
    if (p.budgetJson) {
      try {
        const parsed = JSON.parse(p.budgetJson);
        if (parsed && typeof parsed.total === 'number') {
          totalBudget = parsed.total;
        }
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
      kind: p.kind,
      status: p.status,
      organizationId: p.organizationId,
      organizationName: p.organization.name,
      programCycleYear: p.programCycle.year,
      programCycleId: p.programCycle.id,
      totalBudget,
      approvedBudget: p.approvedBudget,
      submittedAt: p.submittedAt,
      receivedAt: p.receivedAt,
      assignedReviewerId: p.assignedReviewerId,
      assignedReviewerName: p.assignedReviewerId
        ? (reviewerMap.get(p.assignedReviewerId) ?? null)
        : null,
      approvedAt: p.contract?.signedDate ?? null,
      decisionNumber: null,
      hasContract: Boolean(p.contract),
      hasReport: p.reports.length > 0,
      hasAcceptance: p.acceptanceRecords.length > 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });
}

/**
 * Distinct cycle years for filter dropdown.
 */
export async function listAvailableYears(): Promise<number[]> {
  const cycles = await prisma.programCycle.findMany({
    select: { year: true },
    orderBy: { year: 'desc' },
  });
  const seen = new Set<number>();
  const out: number[] = [];
  for (const c of cycles) {
    if (!seen.has(c.year)) {
      seen.add(c.year);
      out.push(c.year);
    }
  }
  return out;
}
