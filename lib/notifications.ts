// Mock dispatch helper — composes Notification (parent) + N NotificationDispatches (children).
// CYCLE-13 mock dispatch: create records only, no real email send.
// Pure data layer — server actions (Plan 03-03+) wrap with RBAC + withAuditLog.

import { prisma } from '@/lib/prisma';
import type { NotificationType, DispatchStatus } from '@/lib/notification-types';

export type SendInvitationInput = {
  cycleId: string;
  subject: string;
  contentHtml: string;
  recipientOrgIds: string[];
  createdById: string;
  type?: NotificationType; // default 'CYCLE_INVITATION'
};

export type SendInvitationResult = {
  notificationId: string;
  dispatchCount: number;
};

/**
 * Create 1 Notification + N NotificationDispatch (1 per recipientOrgId), all in one tx.
 * Status defaults to SENT, sentAt = now, recipientUserId = null
 * (recipient identified at org level — Phase 4 inbox UI fan-out per org's users).
 */
export async function sendCycleInvitation(
  input: SendInvitationInput,
): Promise<SendInvitationResult> {
  if (!input.recipientOrgIds.length) {
    throw new Error('Vui lòng chọn ít nhất 1 đơn vị nhận thông báo');
  }
  if (input.recipientOrgIds.length > 50) {
    throw new Error('Số lượng đơn vị nhận thông báo không vượt quá 50 (T-03-01-04)');
  }

  const notificationType: NotificationType = input.type ?? 'CYCLE_INVITATION';
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const notification = await tx.notification.create({
      data: {
        programCycleId: input.cycleId,
        type: notificationType,
        subject: input.subject,
        content: input.contentHtml,
        recipientType: 'ORGANIZATION',
        createdById: input.createdById,
      },
    });

    await tx.notificationDispatch.createMany({
      data: input.recipientOrgIds.map((orgId) => ({
        notificationId: notification.id,
        recipientOrgId: orgId,
        status: 'SENT' satisfies DispatchStatus,
        sentAt: now,
      })),
    });

    return {
      notificationId: notification.id,
      dispatchCount: input.recipientOrgIds.length,
    };
  });
}

export type CycleDispatchSummary = {
  id: string;
  subject: string;
  type: string;
  createdAt: Date;
  dispatchCount: number;
  sentAt: Date | null;
};

/**
 * List notifications attached to a cycle, most recent first.
 * Returns dispatch count via _count aggregate; first dispatch's sentAt as overall sentAt.
 */
export async function listCycleDispatches(
  cycleId: string,
  options: { limit?: number } = {},
): Promise<CycleDispatchSummary[]> {
  const limit = options.limit ?? 20;
  const rows = await prisma.notification.findMany({
    where: { programCycleId: cycleId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      _count: { select: { dispatches: true } },
      dispatches: {
        orderBy: { sentAt: 'asc' },
        take: 1,
        select: { sentAt: true },
      },
    },
  });

  return rows.map((n) => ({
    id: n.id,
    subject: n.subject,
    type: n.type,
    createdAt: n.createdAt,
    dispatchCount: n._count.dispatches,
    sentAt: n.dispatches[0]?.sentAt ?? null,
  }));
}

/**
 * Mark a single dispatch as read. Used by Phase 4 inbox UI.
 * Idempotent: if already READ, updates readAt to now (latest acknowledgement).
 */
export async function markDispatchRead(dispatchId: string): Promise<void> {
  await prisma.notificationDispatch.update({
    where: { id: dispatchId },
    data: { status: 'READ', readAt: new Date() },
  });
}

export type CycleNotificationStats = {
  totalNotifications: number;
  totalDispatches: number;
  readDispatches: number;
};

/**
 * Aggregate stats for the "Đơn vị mời + thông báo" tab badge counters.
 */
export async function getCycleNotificationStats(
  cycleId: string,
): Promise<CycleNotificationStats> {
  const [totalNotifications, dispatchAgg] = await Promise.all([
    prisma.notification.count({ where: { programCycleId: cycleId } }),
    prisma.notificationDispatch.groupBy({
      by: ['status'],
      where: { notification: { programCycleId: cycleId } },
      _count: { _all: true },
    }),
  ]);

  let totalDispatches = 0;
  let readDispatches = 0;
  for (const row of dispatchAgg) {
    totalDispatches += row._count._all;
    if (row.status === 'READ') readDispatches += row._count._all;
  }

  return { totalNotifications, totalDispatches, readDispatches };
}
