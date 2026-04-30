'use server';

// approveOrgProfile — BQL phê duyệt hồ sơ. T-04-01-01 mitigated: chỉ BANQL/ADMIN
// có canFromDB('don-vi-chu-tri', 'approve') = true.
// Transition guard: SUBMITTED → APPROVED only.
// Side effect: mock notification gửi tới các user của đơn vị (recipientType=ORGANIZATION).

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

const profileIdSchema = z
  .string()
  .min(1, 'Mã hồ sơ không hợp lệ')
  .max(64, 'Mã hồ sơ không hợp lệ');

export type ApproveOrgProfileResult = {
  id: string;
  status: OrgProfileStatus;
  approvedAt: Date;
  notificationId: string | null;
};

async function approveOrgProfileImpl(
  profileId: string,
): Promise<ApproveOrgProfileResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'don-vi-chu-tri', 'approve'))) {
    throw new Error('Bạn không có quyền phê duyệt hồ sơ đơn vị');
  }

  const idParse = profileIdSchema.safeParse(profileId);
  if (!idParse.success) {
    throw new Error(idParse.error.issues[0]?.message ?? 'Mã hồ sơ không hợp lệ');
  }

  const profile = await prisma.organizationProfile.findUnique({
    where: { id: idParse.data },
    include: { organization: { select: { id: true, name: true } } },
  });
  if (!profile) {
    throw new Error('Không tìm thấy hồ sơ đơn vị');
  }

  const currentStatus = profile.status as OrgProfileStatus;
  if (!canTransitionOrgProfile(currentStatus, 'APPROVED')) {
    throw new Error(
      `Không thể phê duyệt hồ sơ ở trạng thái hiện tại (${currentStatus}). Chỉ phê duyệt được hồ sơ "Đã gửi xác nhận".`,
    );
  }

  const now = new Date();
  const updated = await prisma.organizationProfile.update({
    where: { id: profile.id },
    data: {
      status: 'APPROVED',
      approvedAt: now,
      approvedById: session.user.id,
      rejectionReason: null,
    },
  });

  // Mock notification fan-out tới đơn vị (theo organization)
  let notificationId: string | null = null;
  const orgUsers = await prisma.user.findMany({
    where: { organizationId: profile.organizationId, isActive: true },
    select: { id: true },
  });
  if (orgUsers.length > 0) {
    const notification = await prisma.notification.create({
      data: {
        type: 'CYCLE_INVITATION', // reuse — Phase 4 không thêm enum mới
        subject: `Hồ sơ tổ chức của ${profile.organization.name} đã được phê duyệt`,
        content: `<p>Ban quản lý CT XTTM xác nhận hồ sơ tổ chức của <strong>${profile.organization.name}</strong> đã được <strong>phê duyệt</strong>. Quý đơn vị có thể bắt đầu khai báo đề án trong các chu kỳ chương trình XTTM tới.</p>`,
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
    approvedAt: now,
    notificationId,
  };
}

export const approveOrgProfile = withAuditLog<
  [string],
  ApproveOrgProfileResult
>(
  {
    action: 'APPROVE',
    resource: 'don-vi-chu-tri',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      status: r.status,
      approvedAt: r.approvedAt,
    }),
  },
  approveOrgProfileImpl,
);
