'use server';

// sendInvitation — CYCLE-13 mock dispatch.
// T-03-03-04 mitigation: in-memory Map rate limit (cycleId → lastSentAt) with 5-min cooldown.
// recipientOrgIds.length capped at 50 via Zod.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import { sendCycleInvitation } from '@/lib/notifications';
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '@/lib/notification-types';

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 phút
// In-memory rate limit table (single-instance only — production multi-instance would use Redis)
const RATE_LIMIT = new Map<string, number>();

const NOTIFICATION_TYPE_ENUM = z.enum(
  NOTIFICATION_TYPES as readonly string[] as readonly [string, ...string[]],
);

// Internal schema (NOT exported — 'use server' module rule).
const sendInvitationInputSchemaInternal = z.object({
  cycleId: z.string().min(1, 'Mã chu kỳ không hợp lệ'),
  subject: z
    .string({ message: 'Vui lòng nhập tiêu đề' })
    .trim()
    .min(5, 'Tiêu đề tối thiểu 5 ký tự')
    .max(300, 'Tiêu đề tối đa 300 ký tự'),
  contentHtml: z
    .string({ message: 'Vui lòng nhập nội dung' })
    .min(50, 'Nội dung tối thiểu 50 ký tự')
    .max(50_000, 'Nội dung tối đa 50.000 ký tự'),
  recipientOrgIds: z
    .array(z.string().min(1))
    .min(1, 'Vui lòng chọn ít nhất 1 đơn vị nhận thông báo')
    .max(50, 'Số lượng đơn vị nhận thông báo không vượt quá 50'),
  notificationType: NOTIFICATION_TYPE_ENUM.default('CYCLE_INVITATION'),
});

export type SendInvitationInput = z.input<typeof sendInvitationInputSchemaInternal>;

export type SendInvitationResult = {
  notificationId: string;
  dispatchCount: number;
  sentAt: Date;
};

async function sendInvitationImpl(
  input: SendInvitationInput,
): Promise<SendInvitationResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'update'))) {
    throw new Error('Bạn không có quyền gửi thông báo chu kỳ chương trình');
  }

  const result = sendInvitationInputSchemaInternal.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error('Dữ liệu không hợp lệ: ' + (first?.message ?? 'lỗi không xác định'));
  }
  const parsed = result.data;

  // Rate limit check (T-03-03-04)
  const last = RATE_LIMIT.get(parsed.cycleId);
  if (last && Date.now() - last < RATE_LIMIT_WINDOW_MS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (Date.now() - last);
    const remainingSec = Math.ceil(remainingMs / 1000);
    throw new Error(
      `Vui lòng đợi ít nhất 5 phút trước khi gửi đợt thông báo tiếp theo (còn ${remainingSec} giây)`,
    );
  }

  // Validate cycle exists + status not DRAFT
  const cycle = await prisma.programCycle.findUnique({
    where: { id: parsed.cycleId },
    select: { id: true, status: true },
  });
  if (!cycle) {
    throw new Error('Không tìm thấy chu kỳ chương trình');
  }
  if (cycle.status === 'DRAFT') {
    throw new Error('Chu kỳ ở trạng thái nháp không thể gửi thông báo');
  }

  // Dispatch via lib/notifications (pure data layer — RBAC + audit are this caller's job)
  const dispatch = await sendCycleInvitation({
    cycleId: parsed.cycleId,
    subject: parsed.subject,
    contentHtml: parsed.contentHtml,
    recipientOrgIds: parsed.recipientOrgIds,
    createdById: session.user.id,
    type: parsed.notificationType as NotificationType,
  });

  // Mark rate-limit slot only after success
  RATE_LIMIT.set(parsed.cycleId, Date.now());

  revalidatePath('/chuong-trinh/' + parsed.cycleId);

  return {
    notificationId: dispatch.notificationId,
    dispatchCount: dispatch.dispatchCount,
    sentAt: new Date(),
  };
}

export const sendInvitation = withAuditLog<[SendInvitationInput], SendInvitationResult>(
  {
    action: 'DISPATCH',
    resource: 'chuong-trinh',
    resourceIdFromArgs: ([input]) => input?.cycleId ?? null,
    captureAfter: (r, [input]) => ({
      notificationId: r.notificationId,
      dispatchCount: r.dispatchCount,
      recipientCount: input?.recipientOrgIds?.length ?? 0,
      subject: input?.subject ?? null,
      type: input?.notificationType ?? 'CYCLE_INVITATION',
    }),
  },
  sendInvitationImpl,
);
