'use server';

// Phase 9 (M5) Plan 09-01 Task 1+3.
// transitionFinancial — chuyển trạng thái hồ sơ tài chính theo state machine.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { FINANCE_AUDIT_TYPES } from '@/lib/audit-types';
import {
  canTransitionFinancial,
  FINANCIAL_STATUS_LABELS,
  type FinancialStatus,
} from '@/lib/workflows/financial';
import type { Role } from '@/lib/constants';

export type FinanceTransitionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function transitionFinancial(
  recordId: string,
  toStatus: FinancialStatus,
  notes?: string,
): Promise<FinanceTransitionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tai-chinh', 'update'))) {
    return { ok: false, error: 'Bạn không có quyền cập nhật hồ sơ tài chính' };
  }

  const record = await prisma.financialRecord.findUnique({
    where: { id: recordId },
  });
  if (!record) return { ok: false, error: 'Không tìm thấy hồ sơ' };

  const fromStatus = record.status as FinancialStatus;
  if (!canTransitionFinancial(fromStatus, toStatus)) {
    return {
      ok: false,
      error: `Không thể chuyển từ ${FINANCIAL_STATUS_LABELS[fromStatus]} → ${FINANCIAL_STATUS_LABELS[toStatus]}`,
    };
  }

  // Build update data based on target status
  const data: Record<string, unknown> = {
    status: toStatus,
  };
  const now = new Date();
  if (toStatus === 'SUBMITTED') {
    data.submittedAt = now;
  } else if (toStatus === 'APPROVED') {
    data.approvedById = session.user.id;
    data.approvedAt = now;
  } else if (toStatus === 'DISBURSED') {
    data.disbursedAt = now;
    data.transactionDate = record.transactionDate ?? now;
  } else if (toStatus === 'SETTLED') {
    data.transactionDate = record.transactionDate ?? now;
  }
  if (notes && notes.trim().length > 0) {
    data.notes = notes.trim();
  }

  await prisma.financialRecord.update({
    where: { id: recordId },
    data,
  });

  void logAudit(
    {
      ...FINANCE_AUDIT_TYPES.FIN_TRANSITION,
      resourceId: recordId,
      before: { status: fromStatus },
      after: {
        status: toStatus,
        transition: `${FINANCIAL_STATUS_LABELS[fromStatus]} → ${FINANCIAL_STATUS_LABELS[toStatus]}`,
      },
      metadata: {
        recordType: record.recordType,
        recordNumber: record.recordNumber,
      },
    },
    session.user.id,
  );

  revalidatePath('/tai-chinh');
  revalidatePath(`/tai-chinh/${recordId}`);
  revalidatePath(`/de-an/${record.projectId}`);
  return { ok: true };
}
