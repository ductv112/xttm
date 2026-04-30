'use server';

// withdrawProject — SUBMITTED → DRAFT (rút hồ sơ).
// Allowed only when:
//   - caller is owner of project (cross-tenant guard)
//   - project.status === 'SUBMITTED'
//   - project.assignedReviewerId === null (chưa được phân công)
// PROJ-15. Audit logged.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionProject,
  type ProjectStatus,
} from '@/lib/workflows/project';

export type WithdrawProjectResult = {
  id: string;
  code: string;
  status: ProjectStatus;
};

async function withdrawProjectImpl(
  projectId: string,
): Promise<WithdrawProjectResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      organizationId: true,
      status: true,
      assignedReviewerId: true,
      deletedAt: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.organizationId !== orgId) {
    throw new Error('Bạn không có quyền rút hồ sơ này');
  }

  if (project.status !== 'SUBMITTED') {
    throw new Error('Chỉ có thể rút hồ sơ khi đề án đang ở trạng thái "Đã nộp"');
  }
  if (project.assignedReviewerId) {
    throw new Error(
      'Đề án đã được phân công cho chuyên viên — không thể rút hồ sơ',
    );
  }
  if (!canTransitionProject(project.status as ProjectStatus, 'DRAFT')) {
    throw new Error('Chuyển trạng thái không được phép');
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: 'DRAFT',
      submittedAt: null,
    },
    select: { id: true, code: true, status: true },
  });

  revalidatePath('/de-an');
  revalidatePath(`/de-an/${project.id}`);

  return {
    id: updated.id,
    code: updated.code,
    status: updated.status as ProjectStatus,
  };
}

export const withdrawProject = withAuditLog<[string], WithdrawProjectResult>(
  {
    action: 'TRANSITION',
    resource: 'de-an',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({ status: r.status, transition: 'SUBMITTED→DRAFT' }),
    metadata: { reason: 'Rút hồ sơ' },
  },
  withdrawProjectImpl,
);
