'use server';

// requestSupplement — Chuyên viên trả hồ sơ yêu cầu bổ sung.
// IN_REVIEW → SUPPLEMENT_REQUIRED. Lưu reason. Mock notification cho đơn vị chủ trì.
// Audit TRANSITION × 'tiep-nhan' + REASON metadata.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionProject,
  type ProjectStatus,
} from '@/lib/workflows/project';

const RequestSupplementSchema = z.object({
  projectId: z.string().min(1),
  reason: z
    .string()
    .min(20, 'Vui lòng ghi rõ nội dung cần bổ sung (tối thiểu 20 ký tự)')
    .max(2000, 'Nội dung quá dài (tối đa 2000 ký tự)'),
});

export type RequestSupplementInput = z.infer<typeof RequestSupplementSchema>;

export type RequestSupplementResult = {
  id: string;
  code: string;
  status: ProjectStatus;
  reason: string;
};

async function requestSupplementImpl(
  rawInput: RequestSupplementInput,
): Promise<RequestSupplementResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const parsed = RequestSupplementSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join('; '));
  }
  const input = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      assignedReviewerId: true,
      organizationId: true,
      deletedAt: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.assignedReviewerId !== session.user.id) {
    throw new Error('Bạn không phải chuyên viên được giao kiểm tra hồ sơ này');
  }
  if (project.status !== 'IN_REVIEW') {
    throw new Error('Chỉ có thể yêu cầu bổ sung khi hồ sơ đang được kiểm tra');
  }
  if (
    !canTransitionProject(
      project.status as ProjectStatus,
      'SUPPLEMENT_REQUIRED',
    )
  ) {
    throw new Error('Chuyển trạng thái không được phép');
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: 'SUPPLEMENT_REQUIRED',
      supplementRequestReason: input.reason,
    },
    select: { id: true, code: true, status: true, supplementRequestReason: true },
  });

  // Mock notification dispatch to đơn vị chủ trì
  try {
    const orgUsers = await prisma.user.findMany({
      where: {
        organizationId: project.organizationId,
        role: 'DONVI',
        isActive: true,
      },
      select: { id: true },
    });
    if (orgUsers.length > 0) {
      const notification = await prisma.notification.create({
        data: {
          projectId: project.id,
          type: 'CYCLE_OPENED', // reuse existing enum until INTAKE notification type added
          subject: `Yêu cầu bổ sung hồ sơ: ${project.code}`,
          content: `<p>Hồ sơ <strong>${project.name}</strong> (${project.code}) cần được bổ sung.</p><p><strong>Nội dung yêu cầu:</strong></p><blockquote>${escapeHtml(input.reason)}</blockquote><p>Vui lòng truy cập trang Đề án để cập nhật hồ sơ và nộp lại.</p>`,
          recipientType: 'USER',
          createdById: session.user.id,
        },
      });
      await prisma.notificationDispatch.createMany({
        data: orgUsers.map((u) => ({
          notificationId: notification.id,
          recipientUserId: u.id,
          status: 'SENT',
        })),
      });
    }
  } catch (err) {
    console.error('[requestSupplement] notification dispatch failed:', err);
  }

  revalidatePath(`/kiem-tra/${project.id}`);
  revalidatePath('/kiem-tra');
  revalidatePath(`/de-an/${project.id}`);

  return {
    id: updated.id,
    code: updated.code,
    status: updated.status as ProjectStatus,
    reason: updated.supplementRequestReason ?? input.reason,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const requestSupplement = withAuditLog<
  [RequestSupplementInput],
  RequestSupplementResult
>(
  {
    action: 'TRANSITION',
    resource: 'tiep-nhan',
    resourceIdFromArgs: ([input]) => input.projectId,
    captureAfter: (r) => ({
      status: r.status,
      transition: 'IN_REVIEW→SUPPLEMENT_REQUIRED',
      reason: r.reason,
    }),
    metadata: { reason: 'Chuyên viên trả hồ sơ yêu cầu bổ sung' },
  },
  requestSupplementImpl,
);
