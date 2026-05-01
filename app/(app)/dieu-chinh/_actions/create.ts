'use server';

// createAmendmentRequest — Phase 8 Plan 08-01 Task 4.
// Đơn vị tạo yêu cầu điều chỉnh đề án theo Điều 13 NĐ 28.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { AMENDMENT_AUDIT_TYPES } from '@/lib/audit-types';
import {
  AMENDMENT_TYPES,
  isCriticalAmendment,
  type AmendmentType,
} from '@/lib/amendment-rules';

export type CreateAmendmentInput = {
  projectId: string;
  amendmentType: AmendmentType;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
};

export type CreateAmendmentResult =
  | { ok: true; amendmentId: string; isCritical: boolean }
  | { ok: false; error: string };

export async function createAmendmentRequest(
  input: CreateAmendmentInput,
): Promise<CreateAmendmentResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }

  if (!AMENDMENT_TYPES.includes(input.amendmentType)) {
    return { ok: false, error: 'Loại điều chỉnh không hợp lệ' };
  }
  if (!input.reason || input.reason.trim().length < 50) {
    return {
      ok: false,
      error: 'Lý do điều chỉnh phải ít nhất 50 ký tự',
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      code: true,
      name: true,
    },
  });
  if (!project) return { ok: false, error: 'Không tìm thấy đề án' };

  // RBAC: DONVI must own project. BANQL có thể tạo thay (rare).
  const role = session.user.role;
  const isOwn =
    role === 'DONVI' &&
    project.organizationId === session.user.organizationId;
  if (!isOwn && role !== 'BANQL' && role !== 'ADMIN') {
    return { ok: false, error: 'Bạn không có quyền tạo yêu cầu điều chỉnh' };
  }

  // Project phải đã APPROVED hoặc IN_PROGRESS
  if (!['APPROVED', 'IN_PROGRESS'].includes(project.status)) {
    return {
      ok: false,
      error: 'Chỉ điều chỉnh đề án đã được phê duyệt',
    };
  }

  const isCritical = isCriticalAmendment(input.amendmentType);

  const amendment = await prisma.projectAmendment.create({
    data: {
      projectId: input.projectId,
      amendmentType: input.amendmentType,
      isCritical,
      oldValueJson: JSON.stringify(input.oldValue ?? null),
      newValueJson: JSON.stringify(input.newValue ?? null),
      reason: input.reason.trim(),
      status: 'PENDING',
      requestedById: session.user.id,
    },
  });

  void logAudit(
    {
      ...AMENDMENT_AUDIT_TYPES.AMENDMENT_REQUEST,
      resourceId: input.projectId,
      after: {
        amendmentId: amendment.id,
        type: input.amendmentType,
        isCritical,
      },
      metadata: {
        projectCode: project.code,
        reason: input.reason.slice(0, 200),
      },
    },
    session.user.id,
  );

  revalidatePath('/dieu-chinh');
  revalidatePath(`/de-an/${input.projectId}`);
  return { ok: true, amendmentId: amendment.id, isCritical };
}
