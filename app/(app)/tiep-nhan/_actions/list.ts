'use server';

// listSubmittedProjects — danh sách hồ sơ chờ tiếp nhận (status SUBMITTED hoặc RESUBMITTED).
// RBAC: canFromDB('tiep-nhan', 'read') — BQL/CHUYENVIEN/ADMIN.
// BQL view all; CHUYENVIEN sees their assigned/in-review queue qua /kiem-tra.
// Filter by org name search, kind, ngày nộp range.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type IntakeQueueFilters = {
  search?: string;
  kind?: string;
  fromDate?: string; // ISO yyyy-mm-dd
  toDate?: string;
  status?: 'SUBMITTED' | 'RESUBMITTED' | 'ALL';
};

export type IntakeQueueRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  status: string;
  organizationName: string;
  programCycleYear: number;
  submittedAt: Date | null;
  totalBudget: number | null;
  daysWaiting: number; // số ngày từ submittedAt đến nay
};

export async function listSubmittedProjects(
  filters: IntakeQueueFilters = {},
): Promise<IntakeQueueRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    throw new Error('Bạn không có quyền truy cập danh sách hồ sơ tiếp nhận');
  }

  const targetStatuses =
    filters.status === 'ALL'
      ? ['SUBMITTED', 'RESUBMITTED']
      : filters.status
        ? [filters.status]
        : ['SUBMITTED', 'RESUBMITTED'];

  const where: {
    status: { in: string[] };
    deletedAt: null;
    kind?: string;
    submittedAt?: { gte?: Date; lte?: Date };
    OR?: Array<Record<string, unknown>>;
  } = {
    status: { in: targetStatuses },
    deletedAt: null,
  };
  if (filters.kind) where.kind = filters.kind;
  if (filters.fromDate || filters.toDate) {
    const range: { gte?: Date; lte?: Date } = {};
    if (filters.fromDate) range.gte = new Date(filters.fromDate);
    if (filters.toDate) {
      const end = new Date(filters.toDate);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    where.submittedAt = range;
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
    orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
    include: {
      programCycle: { select: { year: true } },
      organization: { select: { name: true } },
    },
  });

  const now = Date.now();
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
    const daysWaiting = p.submittedAt
      ? Math.max(0, Math.floor((now - p.submittedAt.getTime()) / 86_400_000))
      : 0;
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      kind: p.kind,
      status: p.status,
      organizationName: p.organization.name,
      programCycleYear: p.programCycle.year,
      submittedAt: p.submittedAt,
      totalBudget,
      daysWaiting,
    };
  });
}
