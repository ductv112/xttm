'use server';

// Phase 9 (M5) Plan 09-01 Task 1.
// Server actions cho Nghiệm thu + Thanh lý trên /de-an/[id].
// ACCEPT-01..06: BQL tạo biên bản, sinh PDF, upload bản scan, thanh lý HĐ.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { ACCEPTANCE_AUDIT_TYPES } from '@/lib/audit-types';
import {
  type AcceptanceResult,
  ACCEPTANCE_RESULTS,
  formatAcceptanceNumber,
} from '@/lib/workflows/acceptance';
import type { Role } from '@/lib/constants';

export type AcceptanceActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };

// =============================================================================
// createAcceptanceRecord — BQL tạo biên bản nghiệm thu sau khi báo cáo APPROVED
// =============================================================================

export type CreateAcceptanceInput = {
  projectId: string;
  reportId: string;
  recordNumber?: string; // optional, auto-gen nếu trống
  recordDate: Date;
  result: AcceptanceResult;
  comments?: string;
};

export async function createAcceptanceRecord(
  input: CreateAcceptanceInput,
): Promise<AcceptanceActionResult<{ id: string; recordNumber: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'nghiem-thu', 'create'))) {
    return { ok: false, error: 'Bạn không có quyền lập biên bản nghiệm thu' };
  }

  if (!ACCEPTANCE_RESULTS.includes(input.result)) {
    return { ok: false, error: 'Kết quả nghiệm thu không hợp lệ' };
  }

  const report = await prisma.report.findUnique({
    where: { id: input.reportId },
    select: {
      id: true,
      projectId: true,
      status: true,
      project: { select: { code: true } },
    },
  });
  if (!report) return { ok: false, error: 'Không tìm thấy báo cáo' };
  if (report.projectId !== input.projectId) {
    return { ok: false, error: 'Báo cáo không thuộc đề án này' };
  }
  if (report.status !== 'APPROVED') {
    return {
      ok: false,
      error: 'Báo cáo phải được duyệt trước khi lập biên bản nghiệm thu',
    };
  }

  // Check existing
  const existing = await prisma.acceptanceRecord.findUnique({
    where: { reportId: input.reportId },
  });
  if (existing) {
    return {
      ok: false,
      error: 'Báo cáo này đã có biên bản nghiệm thu',
    };
  }

  // Generate record number
  let recordNumber: string = input.recordNumber?.trim() ?? '';
  if (!recordNumber) {
    const year = input.recordDate.getFullYear();
    const all = await prisma.acceptanceRecord.findMany({
      where: { recordNumber: { contains: `/BB-NT-XTTM/${year}` } },
      select: { recordNumber: true },
    });
    let maxSeq = 0;
    for (const r of all) {
      const match = r.recordNumber.match(/^(\d+)\//);
      if (match && match[1]) {
        const n = Number.parseInt(match[1], 10);
        if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
      }
    }
    recordNumber = formatAcceptanceNumber(year, maxSeq + 1);
  }

  const created = await prisma.acceptanceRecord.create({
    data: {
      projectId: input.projectId,
      reportId: input.reportId,
      recordNumber,
      recordDate: input.recordDate,
      result: input.result,
      comments: input.comments?.trim() ?? null,
      createdById: session.user.id,
    },
  });

  void logAudit(
    {
      ...ACCEPTANCE_AUDIT_TYPES.ACCEPT_CREATE,
      resourceId: created.id,
      after: {
        recordNumber,
        result: input.result,
        recordDate: input.recordDate,
      },
      metadata: { projectCode: report.project.code },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${input.projectId}`);
  return { ok: true, data: { id: created.id, recordNumber } };
}

// =============================================================================
// uploadScannedRecord — upload bản scan biên bản đã ký tay
// =============================================================================

export async function uploadScannedRecord(
  recordId: string,
  scannedFileUrl: string,
): Promise<AcceptanceActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'nghiem-thu', 'update'))) {
    return { ok: false, error: 'Bạn không có quyền upload bản scan' };
  }

  const record = await prisma.acceptanceRecord.findUnique({
    where: { id: recordId },
    include: { project: { select: { id: true, code: true } } },
  });
  if (!record) {
    return { ok: false, error: 'Không tìm thấy biên bản nghiệm thu' };
  }

  await prisma.acceptanceRecord.update({
    where: { id: recordId },
    data: { scannedFileUrl },
  });

  void logAudit(
    {
      ...ACCEPTANCE_AUDIT_TYPES.ACCEPT_UPLOAD_RECORD,
      resourceId: recordId,
      after: { scannedFileUrl },
      metadata: { projectCode: record.project.code },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${record.project.id}`);
  return { ok: true };
}

// =============================================================================
// finalizeAcceptance — chốt nghiệm thu → project COMPLETED
// =============================================================================

export async function finalizeAcceptance(
  recordId: string,
): Promise<AcceptanceActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'nghiem-thu', 'update'))) {
    return { ok: false, error: 'Bạn không có quyền chốt nghiệm thu' };
  }

  const record = await prisma.acceptanceRecord.findUnique({
    where: { id: recordId },
    include: {
      project: { select: { id: true, code: true, status: true } },
    },
  });
  if (!record) {
    return { ok: false, error: 'Không tìm thấy biên bản nghiệm thu' };
  }
  if (!record.scannedFileUrl) {
    return {
      ok: false,
      error: 'Vui lòng upload bản scan đã ký trước khi chốt nghiệm thu',
    };
  }

  // Project transition: IN_PROGRESS → COMPLETED
  if (record.project.status === 'IN_PROGRESS') {
    await prisma.project.update({
      where: { id: record.project.id },
      data: { status: 'COMPLETED' },
    });
  }

  void logAudit(
    {
      ...ACCEPTANCE_AUDIT_TYPES.ACCEPT_FINALIZE,
      resourceId: recordId,
      before: { projectStatus: record.project.status },
      after: { projectStatus: 'COMPLETED', transition: 'Chốt nghiệm thu' },
      metadata: { projectCode: record.project.code },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${record.project.id}`);
  return { ok: true };
}

// =============================================================================
// liquidateContract — thanh lý hợp đồng (sau nghiệm thu)
// =============================================================================

export async function liquidateContract(
  recordId: string,
  liquidationDate: Date,
  liquidationFileUrl?: string,
): Promise<AcceptanceActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'nghiem-thu', 'update'))) {
    return { ok: false, error: 'Bạn không có quyền thanh lý hợp đồng' };
  }

  const record = await prisma.acceptanceRecord.findUnique({
    where: { id: recordId },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          status: true,
          contract: { select: { id: true, status: true } },
        },
      },
    },
  });
  if (!record) {
    return { ok: false, error: 'Không tìm thấy biên bản nghiệm thu' };
  }

  await prisma.$transaction([
    prisma.acceptanceRecord.update({
      where: { id: recordId },
      data: {
        liquidationDate,
        liquidationFileUrl: liquidationFileUrl ?? null,
      },
    }),
    ...(record.project.contract
      ? [
          prisma.contract.update({
            where: { id: record.project.contract.id },
            data: { status: 'LIQUIDATED' },
          }),
        ]
      : []),
  ]);

  void logAudit(
    {
      ...ACCEPTANCE_AUDIT_TYPES.ACCEPT_LIQUIDATE,
      resourceId: recordId,
      after: {
        liquidationDate,
        contractStatus: 'LIQUIDATED',
      },
      metadata: { projectCode: record.project.code },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${record.project.id}`);
  return { ok: true };
}

// =============================================================================
// getAcceptanceForProject — fetch biên bản nghiệm thu
// =============================================================================

export type AcceptanceSummary = {
  id: string;
  recordNumber: string;
  recordDate: Date;
  result: AcceptanceResult;
  comments: string | null;
  scannedFileUrl: string | null;
  liquidationDate: Date | null;
  liquidationFileUrl: string | null;
  createdAt: Date;
  reportId: string;
};

export async function getAcceptanceForProject(
  projectId: string,
): Promise<AcceptanceSummary | null> {
  const session = await auth();
  if (!session?.user) return null;

  const record = await prisma.acceptanceRecord.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return null;

  return {
    id: record.id,
    recordNumber: record.recordNumber,
    recordDate: record.recordDate,
    result: record.result as AcceptanceResult,
    comments: record.comments,
    scannedFileUrl: record.scannedFileUrl,
    liquidationDate: record.liquidationDate,
    liquidationFileUrl: record.liquidationFileUrl,
    createdAt: record.createdAt,
    reportId: record.reportId,
  };
}
