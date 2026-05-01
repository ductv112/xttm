'use server';

// listContracts — Phase 8 Plan 08-01 Task 2.
// Liệt kê hợp đồng với filter year + status + search.
// RBAC:
//   - DONVI: chỉ HĐ thuộc tổ chức của mình
//   - BANQL/TAICHINH/LANHDAO/ADMIN: tất cả HĐ

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type ContractListRow = {
  id: string;
  contractNo: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  totalValue: number;
  signedDate: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  status: string;
  hasScan: boolean;
  createdAt: Date;
};

export type ContractListFilter = {
  year?: number;
  status?: string;
  search?: string;
};

export async function listContracts(
  filter: ContractListFilter = {},
): Promise<ContractListRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'read'))) {
    throw new Error('Bạn không có quyền xem danh sách hợp đồng');
  }

  // RBAC scope: DONVI only sees own org
  const orgFilter =
    role === 'DONVI' && session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

  const where: Record<string, unknown> = { ...orgFilter };
  if (filter.status) where.status = filter.status;
  if (filter.year) {
    where.contractNo = { startsWith: `XTTM/${filter.year}/` };
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      project: { select: { id: true, code: true, name: true } },
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let rows: ContractListRow[] = contracts.map((c) => ({
    id: c.id,
    contractNo: c.contractNo,
    projectId: c.project.id,
    projectCode: c.project.code,
    projectName: c.project.name,
    organizationName: c.organization.name,
    totalValue: c.totalValue,
    signedDate: c.signedDate,
    effectiveFrom: c.effectiveFrom,
    effectiveTo: c.effectiveTo,
    status: c.status,
    hasScan: !!c.scanFileUrl,
    createdAt: c.createdAt,
  }));

  if (filter.search) {
    const q = filter.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.contractNo.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.organizationName.toLowerCase().includes(q),
    );
  }

  return rows;
}

// =============================================================================
// listOverdueContracts — Phase 8 cảnh báo 60 ngày sau quyết định mà chưa SIGNED
// =============================================================================

export type OverdueContractWarning = {
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  decisionDate: Date;
  decisionNumber: string;
  daysOverdue: number;
  hasContract: boolean;
  contractStatus: string | null;
};

export async function listOverdueContractWarnings(): Promise<
  OverdueContractWarning[]
> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'read'))) {
    return [];
  }

  // Find all decisions
  const decisions = await prisma.approvalDecision.findMany({
    select: {
      decisionNumber: true,
      decisionDate: true,
      approvedItemsJson: true,
    },
  });

  type DecisionInfo = { decisionDate: Date; decisionNumber: string };
  const decisionByProject = new Map<string, DecisionInfo>();
  for (const d of decisions) {
    try {
      const items = JSON.parse(d.approvedItemsJson);
      if (Array.isArray(items)) {
        for (const item of items) {
          if (typeof item?.projectId === 'string') {
            decisionByProject.set(item.projectId, {
              decisionDate: d.decisionDate,
              decisionNumber: d.decisionNumber,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (decisionByProject.size === 0) return [];

  const projectIds = [...decisionByProject.keys()];
  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
      deletedAt: null,
      // RBAC scope
      ...(role === 'DONVI' && session.user.organizationId
        ? { organizationId: session.user.organizationId }
        : {}),
    },
    include: {
      organization: { select: { name: true } },
      contract: { select: { status: true } },
    },
  });

  const now = Date.now();
  const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
  const warnings: OverdueContractWarning[] = [];

  for (const p of projects) {
    const dec = decisionByProject.get(p.id);
    if (!dec) continue;

    const elapsed = now - dec.decisionDate.getTime();
    if (elapsed < SIXTY_DAYS) continue;

    // Already signed? skip warning
    if (p.contract && ['SIGNED', 'IN_PROGRESS', 'COMPLETED', 'LIQUIDATED'].includes(p.contract.status)) {
      continue;
    }

    warnings.push({
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      organizationName: p.organization.name,
      decisionDate: dec.decisionDate,
      decisionNumber: dec.decisionNumber,
      daysOverdue: Math.floor(elapsed / (24 * 60 * 60 * 1000)) - 60,
      hasContract: !!p.contract,
      contractStatus: p.contract?.status ?? null,
    });
  }

  // Sort by daysOverdue desc
  warnings.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return warnings;
}

// =============================================================================
// listApprovedProjectsWithoutContract — projects đã được phê duyệt nhưng chưa có HĐ
// =============================================================================

export type ApprovedProjectAwaitingContract = {
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  approvedBudget: number;
  decisionDate: Date | null;
  decisionNumber: string | null;
  daysSinceDecision: number | null;
};

export async function listApprovedProjectsWithoutContract(): Promise<
  ApprovedProjectAwaitingContract[]
> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'create'))) {
    return [];
  }

  // Decisions map
  const decisions = await prisma.approvalDecision.findMany({
    select: {
      decisionNumber: true,
      decisionDate: true,
      approvedItemsJson: true,
    },
  });
  const decisionByProject = new Map<
    string,
    { decisionDate: Date; decisionNumber: string; approvedBudget: number }
  >();
  for (const d of decisions) {
    try {
      const items = JSON.parse(d.approvedItemsJson);
      if (Array.isArray(items)) {
        for (const item of items) {
          if (typeof item?.projectId === 'string') {
            decisionByProject.set(item.projectId, {
              decisionDate: d.decisionDate,
              decisionNumber: d.decisionNumber,
              approvedBudget: typeof item.approvedBudget === 'number' ? item.approvedBudget : 0,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Projects approved without contract
  const projects = await prisma.project.findMany({
    where: {
      status: { in: ['APPROVED', 'IN_PROGRESS'] },
      contract: null,
      deletedAt: null,
    },
    include: {
      organization: { select: { name: true } },
    },
  });

  const now = Date.now();
  const rows: ApprovedProjectAwaitingContract[] = projects.map((p) => {
    const dec = decisionByProject.get(p.id);
    const decisionDate = dec?.decisionDate ?? null;
    const days = decisionDate
      ? Math.floor((now - decisionDate.getTime()) / (24 * 60 * 60 * 1000))
      : null;
    return {
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      organizationName: p.organization.name,
      approvedBudget: dec?.approvedBudget ?? p.approvedBudget ?? p.proposedBudget ?? 0,
      decisionDate,
      decisionNumber: dec?.decisionNumber ?? null,
      daysSinceDecision: days,
    };
  });

  rows.sort(
    (a, b) =>
      (b.daysSinceDecision ?? 0) - (a.daysSinceDecision ?? 0),
  );
  return rows;
}
