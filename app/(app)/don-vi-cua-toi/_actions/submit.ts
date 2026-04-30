'use server';

// submitMyProfile — đơn vị gửi hồ sơ xác nhận cho BQL phê duyệt.
// Flow: validateGuards → canTransitionOrgProfile(DRAFT, SUBMITTED) → update +
// submittedAt = now → audit → mock notification fan-out tới BANQL users.
//
// Mock dispatch pattern: tạo Notification + NotificationDispatch records (theo
// pattern lib/notifications.ts từ Phase 3), KHÔNG gửi email thật.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionOrgProfile,
  parseCapabilities,
  parseContacts,
  parseLegalInfo,
  validateGuards,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

export type SubmitMyProfileResult = {
  id: string;
  status: OrgProfileStatus;
  submittedAt: Date;
  notificationId: string | null;
  dispatchCount: number;
};

async function submitMyProfileImpl(): Promise<SubmitMyProfileResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
    include: { organization: { select: { name: true } } },
  });
  if (!profile) {
    throw new Error('Hồ sơ chưa được khởi tạo — vui lòng tải lại trang');
  }
  if (profile.organizationId !== orgId) {
    throw new Error('Bạn không có quyền gửi hồ sơ này');
  }

  // Transition guard
  const currentStatus = profile.status as OrgProfileStatus;
  if (!canTransitionOrgProfile(currentStatus, 'SUBMITTED')) {
    throw new Error(
      `Không thể gửi hồ sơ ở trạng thái hiện tại (${currentStatus}). Chỉ cho phép gửi từ "Bản nháp".`,
    );
  }

  // Domain guards
  const subject = {
    legalInfo: parseLegalInfo(profile.legalInfoJson),
    capabilities: parseCapabilities(profile.capabilitiesJson),
    contacts: parseContacts(profile.contactsJson),
  };
  const guard = validateGuards(subject);
  if (!guard.ok) {
    throw new Error(
      'Hồ sơ chưa đầy đủ: ' + guard.errors.join('; '),
    );
  }

  const now = new Date();

  // Update + audit-friendly status snapshot
  const updated = await prisma.organizationProfile.update({
    where: { id: profile.id },
    data: {
      status: 'SUBMITTED',
      submittedAt: now,
      rejectionReason: null, // clear previous rejection if resubmit
    },
  });

  // Mock notification dispatch tới BANQL users (Phase 4 mock pattern)
  // Find all active BANQL users
  const banqlUsers = await prisma.user.findMany({
    where: { role: 'BANQL', isActive: true },
    select: { id: true, organizationId: true },
  });

  let notificationId: string | null = null;
  let dispatchCount = 0;

  if (banqlUsers.length > 0) {
    const orgName = profile.organization.name;
    const notification = await prisma.notification.create({
      data: {
        type: 'CYCLE_INVITATION', // reuse type — NotificationType enum chưa có ORG_PROFILE_*
        subject: `Hồ sơ tổ chức của ${orgName} đã được gửi xác nhận`,
        content: `<p>Đơn vị <strong>${orgName}</strong> vừa gửi hồ sơ tổ chức xác nhận. Vui lòng truy cập trang Đơn vị chủ trì để xem xét và phê duyệt.</p>`,
        recipientType: 'USER',
        createdById: session.user.id,
      },
    });

    await prisma.notificationDispatch.createMany({
      data: banqlUsers.map((u) => ({
        notificationId: notification.id,
        recipientUserId: u.id,
        recipientOrgId: u.organizationId ?? null,
        status: 'SENT' as const,
        sentAt: now,
      })),
    });

    notificationId = notification.id;
    dispatchCount = banqlUsers.length;
  }

  revalidatePath('/don-vi-cua-toi');
  revalidatePath('/don-vi-chu-tri');

  return {
    id: updated.id,
    status: updated.status as OrgProfileStatus,
    submittedAt: now,
    notificationId,
    dispatchCount,
  };
}

export const submitMyProfile = withAuditLog<[], SubmitMyProfileResult>(
  {
    action: 'SUBMIT',
    resource: 'don-vi-chu-tri',
    resourceIdFromResult: (r) => r?.id ?? null,
    captureAfter: (r) => ({
      status: r.status,
      submittedAt: r.submittedAt,
      dispatchCount: r.dispatchCount,
    }),
  },
  submitMyProfileImpl,
);
