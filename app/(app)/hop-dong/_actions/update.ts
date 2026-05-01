'use server';

// updateContract — Phase 8 Plan 08-01 Task 2.
// Edit hợp đồng: termsHtml, signedDate, totalValue, effectiveFrom/To, status transition.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { CONTRACT_AUDIT_TYPES } from '@/lib/audit-types';
import type { Role } from '@/lib/constants';
import {
  CONTRACT_STATUSES,
  type ContractStatus,
} from '@/lib/amendment-rules';

export type UpdateContractInput = {
  termsHtml?: string;
  totalValue?: number;
  signedDate?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
};

export type UpdateContractResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateContract(
  contractId: string,
  input: UpdateContractInput,
): Promise<UpdateContractResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'update'))) {
    return { ok: false, error: 'Bạn không có quyền chỉnh sửa hợp đồng' };
  }

  const before = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!before) return { ok: false, error: 'Không tìm thấy hợp đồng' };

  const data: Record<string, unknown> = {};
  if (input.termsHtml !== undefined) data.termsHtml = input.termsHtml;
  if (input.totalValue !== undefined && input.totalValue >= 0)
    data.totalValue = input.totalValue;
  if (input.signedDate !== undefined)
    data.signedDate = input.signedDate ? new Date(input.signedDate) : null;
  if (input.effectiveFrom !== undefined)
    data.effectiveFrom = input.effectiveFrom
      ? new Date(input.effectiveFrom)
      : null;
  if (input.effectiveTo !== undefined)
    data.effectiveTo = input.effectiveTo
      ? new Date(input.effectiveTo)
      : null;

  const after = await prisma.contract.update({
    where: { id: contractId },
    data,
  });

  void logAudit(
    {
      ...CONTRACT_AUDIT_TYPES.CONTRACT_UPDATE,
      resourceId: contractId,
      before: {
        termsHtml: before.termsHtml,
        totalValue: before.totalValue,
        signedDate: before.signedDate,
      },
      after: {
        termsHtml: after.termsHtml,
        totalValue: after.totalValue,
        signedDate: after.signedDate,
      },
    },
    session.user.id,
  );

  revalidatePath('/hop-dong');
  revalidatePath(`/hop-dong/${contractId}`);
  revalidatePath(`/de-an/${after.projectId}`);
  return { ok: true };
}

// =============================================================================
// transitionContract — đổi status: DRAFT → SIGNED → IN_PROGRESS → COMPLETED → LIQUIDATED
// =============================================================================

const ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['SIGNED'],
  SIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['LIQUIDATED'],
  LIQUIDATED: [],
};

export type TransitionContractResult =
  | { ok: true }
  | { ok: false; error: string };

export async function transitionContract(
  contractId: string,
  to: ContractStatus,
): Promise<TransitionContractResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'update'))) {
    return { ok: false, error: 'Bạn không có quyền chuyển trạng thái' };
  }
  if (!CONTRACT_STATUSES.includes(to)) {
    return { ok: false, error: 'Trạng thái không hợp lệ' };
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) return { ok: false, error: 'Không tìm thấy hợp đồng' };

  const from = contract.status as ContractStatus;
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    return {
      ok: false,
      error: `Không thể chuyển từ ${from} sang ${to}`,
    };
  }

  // SIGNED requires scan + signedDate
  if (to === 'SIGNED') {
    if (!contract.scanFileUrl) {
      return {
        ok: false,
        error: 'Cần upload bản scan hợp đồng đã ký trước khi chuyển trạng thái',
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id: contractId },
      data: {
        status: to,
        signedDate:
          to === 'SIGNED' && !contract.signedDate
            ? new Date()
            : contract.signedDate,
        signedById:
          to === 'SIGNED' && !contract.signedById ? session.user.id : contract.signedById,
      },
    });

    // Sync project status when contract enters IN_PROGRESS
    if (to === 'IN_PROGRESS') {
      const project = await tx.project.findUnique({
        where: { id: contract.projectId },
      });
      if (project && project.status === 'APPROVED') {
        await tx.project.update({
          where: { id: project.id },
          data: { status: 'IN_PROGRESS' },
        });
      }
    }
    if (to === 'COMPLETED') {
      const project = await tx.project.findUnique({
        where: { id: contract.projectId },
      });
      if (project && project.status === 'IN_PROGRESS') {
        await tx.project.update({
          where: { id: project.id },
          data: { status: 'COMPLETED' },
        });
      }
    }
  });

  const auditType =
    to === 'SIGNED'
      ? CONTRACT_AUDIT_TYPES.CONTRACT_SIGN
      : to === 'COMPLETED'
        ? CONTRACT_AUDIT_TYPES.CONTRACT_COMPLETE
        : to === 'LIQUIDATED'
          ? CONTRACT_AUDIT_TYPES.CONTRACT_LIQUIDATE
          : CONTRACT_AUDIT_TYPES.CONTRACT_UPDATE;

  void logAudit(
    {
      ...auditType,
      resourceId: contractId,
      before: { status: from },
      after: { status: to, transition: `${from} → ${to}` },
    },
    session.user.id,
  );

  revalidatePath('/hop-dong');
  revalidatePath(`/hop-dong/${contractId}`);
  revalidatePath(`/de-an/${contract.projectId}`);
  return { ok: true };
}
