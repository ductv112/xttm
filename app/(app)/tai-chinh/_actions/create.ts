'use server';

// Phase 9 (M5) Plan 09-01 Task 1+3.
// Server actions tạo hồ sơ tài chính (advance/payment/settlement).

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { FINANCE_AUDIT_TYPES } from '@/lib/audit-types';
import {
  formatFinancialRecordNumber,
  type FinancialRecordType,
} from '@/lib/workflows/financial';
import type { Role } from '@/lib/constants';

export type FinanceCreateResult =
  | { ok: true; id: string; recordNumber: string }
  | { ok: false; error: string };

const createSchema = z.object({
  projectId: z.string().min(1, 'Vui lòng chọn đề án'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  notes: z.string().optional(),
  transactionDate: z.date().optional(),
});

async function generateRecordNumber(
  type: FinancialRecordType,
): Promise<string> {
  const year = new Date().getFullYear();
  const all = await prisma.financialRecord.findMany({
    where: {
      recordType: type,
      recordNumber: { contains: `-${year}-` },
    },
    select: { recordNumber: true },
  });
  let maxSeq = 0;
  for (const r of all) {
    if (!r.recordNumber) continue;
    const match = r.recordNumber.match(/-(\d{3,})$/);
    if (match && match[1]) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }
  }
  return formatFinancialRecordNumber(type, year, maxSeq + 1);
}

async function commonCreate(
  type: FinancialRecordType,
  input: z.infer<typeof createSchema>,
): Promise<FinanceCreateResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tai-chinh', 'create'))) {
    return { ok: false, error: 'Bạn không có quyền tạo hồ sơ tài chính' };
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: {
      id: true,
      code: true,
      status: true,
      contract: { select: { id: true, status: true, totalValue: true } },
    },
  });
  if (!project) return { ok: false, error: 'Không tìm thấy đề án' };

  // Type-specific guards
  if (type === 'ADVANCE') {
    if (
      !project.contract ||
      !['SIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(project.contract.status)
    ) {
      return {
        ok: false,
        error: 'Tạm ứng chỉ áp dụng cho đề án đã ký hợp đồng',
      };
    }
  } else if (type === 'PAYMENT') {
    if (!project.contract) {
      return {
        ok: false,
        error: 'Thanh toán yêu cầu đề án có hợp đồng',
      };
    }
    // Check có nghiệm thu hoặc đang triển khai
    const accept = await prisma.acceptanceRecord.findFirst({
      where: { projectId: input.projectId },
      select: { id: true, result: true },
    });
    if (
      !accept &&
      !['IN_PROGRESS', 'COMPLETED'].includes(project.status)
    ) {
      return {
        ok: false,
        error:
          'Thanh toán chỉ tạo sau khi đề án triển khai hoặc có biên bản nghiệm thu',
      };
    }
  } else if (type === 'SETTLEMENT') {
    if (!['COMPLETED', 'IN_PROGRESS'].includes(project.status)) {
      return {
        ok: false,
        error:
          'Quyết toán chỉ tạo sau khi đề án triển khai/hoàn thành',
      };
    }
  }

  const recordNumber = await generateRecordNumber(type);

  const created = await prisma.financialRecord.create({
    data: {
      projectId: input.projectId,
      contractId: project.contract?.id ?? null,
      recordType: type,
      recordNumber,
      amount: input.amount,
      status: 'DRAFT',
      notes: input.notes?.trim() || null,
      transactionDate: input.transactionDate ?? null,
      createdById: session.user.id,
    },
  });

  const auditMeta =
    type === 'ADVANCE'
      ? FINANCE_AUDIT_TYPES.FIN_CREATE_ADVANCE
      : type === 'PAYMENT'
        ? FINANCE_AUDIT_TYPES.FIN_CREATE_PAYMENT
        : FINANCE_AUDIT_TYPES.FIN_CREATE_SETTLEMENT;

  void logAudit(
    {
      ...auditMeta,
      resourceId: created.id,
      after: {
        recordNumber,
        amount: input.amount,
        type,
      },
      metadata: { projectCode: project.code },
    },
    session.user.id,
  );

  revalidatePath('/tai-chinh');
  revalidatePath(`/de-an/${input.projectId}`);
  return { ok: true, id: created.id, recordNumber };
}

// =============================================================================
// createAdvance — tạm ứng (sau ký HĐ)
// =============================================================================

export async function createAdvance(
  input: z.infer<typeof createSchema>,
): Promise<FinanceCreateResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
    };
  }
  return commonCreate('ADVANCE', parsed.data);
}

// =============================================================================
// createPayment — thanh toán (sau nghiệm thu)
// =============================================================================

export async function createPayment(
  input: z.infer<typeof createSchema>,
): Promise<FinanceCreateResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
    };
  }
  return commonCreate('PAYMENT', parsed.data);
}

// =============================================================================
// createSettlement — quyết toán cuối kỳ
// =============================================================================

export async function createSettlement(
  input: z.infer<typeof createSchema>,
): Promise<FinanceCreateResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
    };
  }
  return commonCreate('SETTLEMENT', parsed.data);
}
