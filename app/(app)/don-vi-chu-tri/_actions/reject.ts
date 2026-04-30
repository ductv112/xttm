'use server';

// rejectOrgProfile — BQL từ chối hồ sơ với lý do. Reason min 10 chars (Zod).
// Transition guard: SUBMITTED → REJECTED. Notification fan-out tới đơn vị.

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionOrgProfile,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

const rejectInputSchema = z.object({
  profileId: z.string().min(1).max(64),
  reason: z
    .string({ message: 'Vui lòng nhập lý do từ chối' })
    .trim()
    .min(10, 'Lý do từ chối tối thiểu 10 ký tự')
    .max(2000, 'Lý do từ chối tối đa 2000 ký tự'),
});

export type RejectOrgProfileInput = z.infer<typeof rejectInputSchema>;

export type RejectOrgProfileResult = {
  id: string;
  status: OrgProfileStatus;
  rejectionReason: string;
  notificationId: string | null;
};

async function rejectOrgProfileImpl(
  input: RejectOrgProfileInput,
): Promise<RejectOrgProfileResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'don-vi-chu-tri', 'approve'))) {
    // Same RBAC scope as approve — BQL has both authorities
    throw new Error('Bạn không có quyền từ chối hồ sơ đơn vị');
  }

  const parsed = rejectInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dữ liệu từ chối không hợp lệ');
  }
  const { profileId, reason } = parsed.data;

  const profile = await prisma.organizationProfile.findUnique({
    where: { id: profileId },
    include: { organization: { select: { id: true, name: true } } },
  });
  if (!profile) {
    throw new Error('Không tìm thấy hồ sơ đơn vị');
  }

  const currentStatus = profile.status as OrgProfileStatus;
  if (!canTransitionOrgProfile(currentStatus, 'REJECTED')) {
    throw new Error(
      `Không thể từ chối hồ sơ ở trạng thái hiện tại (${currentStatus}). Chỉ từ chối được hồ sơ "Đã gửi xác nhận".`,
    );
  }

  const now = new Date();
  const updated = await prisma.organizationProfile.update({
    where: { id: profile.id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      // Keep submittedAt as historical record; clear approvedAt/approvedById in case of re-reject
    },
  });

  // Notification fan-out tới đơn vị
  let notificationId: string | null = null;
  const orgUsers = await prisma.user.findMany({
    where: { organizationId: profile.organizationId, isActive: true },
    select: { id: true },
  });
  if (orgUsers.length > 0) {
    const notification = await prisma.notification.create({
      data: {
        type: 'CYCLE_INVITATION', // reuse — Phase 4 không thêm enum mới
        subject: `Hồ sơ tổ chức của ${profile.organization.name} cần bổ sung`,
        content: `<p>Ban quản lý CT XTTM đã xem xét hồ sơ và đề nghị quý đơn vị bổ sung. <strong>Lý do:</strong></p><blockquote>${reason}</blockquote><p>Vui lòng truy cập trang Hồ sơ tổ chức để chỉnh sửa và gửi lại.</p>`,
        recipientType: 'ORGANIZATION',
        createdById: session.user.id,
      },
    });
    await prisma.notificationDispatch.createMany({
      data: orgUsers.map((u) => ({
        notificationId: notification.id,
        recipientUserId: u.id,
        recipientOrgId: profile.organizationId,
        status: 'SENT' as const,
        sentAt: now,
      })),
    });
    notificationId = notification.id;
  }

  revalidatePath('/don-vi-cua-toi');
  revalidatePath('/don-vi-chu-tri');

  return {
    id: updated.id,
    status: updated.status as OrgProfileStatus,
    rejectionReason: reason,
    notificationId,
  };
}

export const rejectOrgProfile = withAuditLog<
  [RejectOrgProfileInput],
  RejectOrgProfileResult
>(
  {
    action: 'REJECT',
    resource: 'don-vi-chu-tri',
    resourceIdFromArgs: ([input]) => input?.profileId ?? null,
    captureAfter: (r) => ({
      status: r.status,
      rejectionReason: r.rejectionReason,
    }),
  },
  rejectOrgProfileImpl,
);
