'use server';

// Phase 9 (M5) Plan 09-01 Task 3.
// listFinancialRecords — fetch + filter financial records cho /tai-chinh.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';
import type {
  FinancialRecordType,
  FinancialStatus,
} from '@/lib/workflows/financial';

export type FinancialRecordRow = {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  contractId: string | null;
  contractNo: string | null;
  recordType: FinancialRecordType;
  recordNumber: string | null;
  amount: number;
  status: FinancialStatus;
  submittedAt: Date | null;
  approvedAt: Date | null;
  disbursedAt: Date | null;
  transactionDate: Date | null;
  notes: string | null;
  createdAt: Date;
};

export type FinancialFilters = {
  recordType?: FinancialRecordType;
  status?: FinancialStatus;
  projectId?: string;
  yearFrom?: number;
  yearTo?: number;
};

export async function listFinancialRecords(
  filters: FinancialFilters = {},
): Promise<FinancialRecordRow[]> {
  const session = await auth();
  if (!session?.user) return [];
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tai-chinh', 'read'))) return [];

  const records = await prisma.financialRecord.findMany({
    where: {
      ...(filters.recordType ? { recordType: filters.recordType } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  if (records.length === 0) return [];

  const projectIds = [...new Set(records.map((r) => r.projectId))];
  const contractIds = records
    .map((r) => r.contractId)
    .filter((id): id is string => Boolean(id));

  const [projects, contracts] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: {
        id: true,
        code: true,
        name: true,
        organization: { select: { name: true } },
      },
    }),
    contractIds.length > 0
      ? prisma.contract.findMany({
          where: { id: { in: contractIds } },
          select: { id: true, contractNo: true },
        })
      : Promise.resolve([]),
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const contractMap = new Map(contracts.map((c) => [c.id, c]));

  return records.map((r) => {
    const p = projectMap.get(r.projectId);
    const c = r.contractId ? contractMap.get(r.contractId) : null;
    return {
      id: r.id,
      projectId: r.projectId,
      projectCode: p?.code ?? '(không rõ)',
      projectName: p?.name ?? '(không rõ)',
      organizationName: p?.organization.name ?? '(không rõ)',
      contractId: r.contractId,
      contractNo: c?.contractNo ?? null,
      recordType: r.recordType as FinancialRecordType,
      recordNumber: r.recordNumber,
      amount: r.amount,
      status: r.status as FinancialStatus,
      submittedAt: r.submittedAt,
      approvedAt: r.approvedAt,
      disbursedAt: r.disbursedAt,
      transactionDate: r.transactionDate,
      notes: r.notes,
      createdAt: r.createdAt,
    };
  });
}

// =============================================================================
// getFinancialDetail — fetch single record + project + contract
// =============================================================================

export type FinancialDetail = FinancialRecordRow & {
  approvedByName: string | null;
  createdByName: string | null;
};

export async function getFinancialDetail(
  id: string,
): Promise<FinancialDetail | null> {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tai-chinh', 'read'))) return null;

  const record = await prisma.financialRecord.findUnique({
    where: { id },
  });
  if (!record) return null;

  const project = await prisma.project.findUnique({
    where: { id: record.projectId },
    select: {
      id: true,
      code: true,
      name: true,
      organization: { select: { name: true } },
    },
  });

  const contract = record.contractId
    ? await prisma.contract.findUnique({
        where: { id: record.contractId },
        select: { id: true, contractNo: true },
      })
    : null;

  const approvedBy = record.approvedById
    ? await prisma.user.findUnique({
        where: { id: record.approvedById },
        select: { fullName: true },
      })
    : null;
  const createdBy = await prisma.user.findUnique({
    where: { id: record.createdById },
    select: { fullName: true },
  });

  return {
    id: record.id,
    projectId: record.projectId,
    projectCode: project?.code ?? '(không rõ)',
    projectName: project?.name ?? '(không rõ)',
    organizationName: project?.organization.name ?? '(không rõ)',
    contractId: record.contractId,
    contractNo: contract?.contractNo ?? null,
    recordType: record.recordType as FinancialRecordType,
    recordNumber: record.recordNumber,
    amount: record.amount,
    status: record.status as FinancialStatus,
    submittedAt: record.submittedAt,
    approvedAt: record.approvedAt,
    disbursedAt: record.disbursedAt,
    transactionDate: record.transactionDate,
    notes: record.notes,
    createdAt: record.createdAt,
    approvedByName: approvedBy?.fullName ?? null,
    createdByName: createdBy?.fullName ?? null,
  };
}

// =============================================================================
// listProjectFinancialRecords — fetch records cho project tab
// =============================================================================

export async function listProjectFinancialRecords(
  projectId: string,
): Promise<FinancialRecordRow[]> {
  const session = await auth();
  if (!session?.user) return [];

  // No additional permission check — project page already authorized via getProjectDetail
  return listFinancialRecords({ projectId });
}

// =============================================================================
// listEligibleProjectsForFinance — projects có thể tạo financial record
// (ADVANCE: contract SIGNED+; PAYMENT: nghiệm thu PASS; SETTLEMENT: COMPLETED)
// =============================================================================

export type EligibleProject = {
  id: string;
  code: string;
  name: string;
  organizationName: string;
  status: string;
  contractId: string | null;
  contractNo: string | null;
  contractValue: number | null;
  contractStatus: string | null;
};

export async function listEligibleProjectsForFinance(): Promise<
  EligibleProject[]
> {
  const session = await auth();
  if (!session?.user) return [];
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tai-chinh', 'create'))) return [];

  const projects = await prisma.project.findMany({
    where: {
      status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
      contract: { isNot: null },
    },
    include: {
      organization: { select: { name: true } },
      contract: {
        select: {
          id: true,
          contractNo: true,
          totalValue: true,
          status: true,
        },
      },
    },
    orderBy: { code: 'asc' },
  });

  return projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    organizationName: p.organization.name,
    status: p.status,
    contractId: p.contract?.id ?? null,
    contractNo: p.contract?.contractNo ?? null,
    contractValue: p.contract?.totalValue ?? null,
    contractStatus: p.contract?.status ?? null,
  }));
}
