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

// =============================================================================
// Phase 10 (M6) — Personal inbox helpers
// listMyNotifications / getUnreadCount / markRead / markAllRead / createNotification
// =============================================================================

export type CreateNotificationInput = {
  type: NotificationType;
  subject: string;
  contentHtml: string;
  recipientUserIds?: string[];
  recipientOrgIds?: string[];
  createdById: string;
  projectId?: string | null;
  programCycleId?: string | null;
};

/**
 * Generic notification creator for Phase 10 inbox triggers.
 * Idempotent: caller responsible for upstream dedupe (e.g. SLA detection).
 * Either recipientUserIds or recipientOrgIds must be non-empty.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<{ notificationId: string; dispatchCount: number }> {
  const userIds = input.recipientUserIds ?? [];
  const orgIds = input.recipientOrgIds ?? [];
  if (userIds.length === 0 && orgIds.length === 0) {
    throw new Error('Phải có ít nhất 1 người nhận');
  }

  const recipientType = userIds.length > 0 ? 'USER' : 'ORGANIZATION';
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const notification = await tx.notification.create({
      data: {
        type: input.type,
        subject: input.subject,
        content: input.contentHtml,
        recipientType,
        createdById: input.createdById,
        projectId: input.projectId ?? null,
        programCycleId: input.programCycleId ?? null,
      },
    });

    const dispatchData = [
      ...userIds.map((uid) => ({
        notificationId: notification.id,
        recipientUserId: uid,
        status: 'SENT' satisfies DispatchStatus,
        sentAt: now,
      })),
      ...orgIds.map((oid) => ({
        notificationId: notification.id,
        recipientOrgId: oid,
        status: 'SENT' satisfies DispatchStatus,
        sentAt: now,
      })),
    ];

    if (dispatchData.length > 0) {
      await tx.notificationDispatch.createMany({ data: dispatchData });
    }

    return {
      notificationId: notification.id,
      dispatchCount: dispatchData.length,
    };
  });
}

export type InboxNotification = {
  dispatchId: string;
  notificationId: string;
  type: NotificationType;
  subject: string;
  content: string;
  status: DispatchStatus;
  sentAt: Date | null;
  readAt: Date | null;
  projectId: string | null;
  programCycleId: string | null;
  createdAt: Date;
};

export type ListMyNotificationsOptions = {
  unreadOnly?: boolean;
  type?: NotificationType;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
};

/**
 * List notifications dispatched to the current user.
 * Returns dispatches scoped to userId (recipientUserId).
 */
export async function listMyNotifications(
  userId: string,
  options: ListMyNotificationsOptions = {},
): Promise<{ rows: InboxNotification[]; total: number }> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const where: Parameters<typeof prisma.notificationDispatch.findMany>[0] extends
    | { where?: infer W }
    | undefined
    ? W
    : never = {
    recipientUserId: userId,
  };
  if (options.unreadOnly) {
    where.status = { in: ['SENT', 'PENDING'] };
  }
  if (options.fromDate || options.toDate) {
    where.sentAt = {};
    if (options.fromDate) where.sentAt.gte = options.fromDate;
    if (options.toDate) where.sentAt.lte = options.toDate;
  }
  if (options.type) {
    where.notification = { type: options.type };
  }

  const [rows, total] = await Promise.all([
    prisma.notificationDispatch.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        notification: {
          select: {
            id: true,
            type: true,
            subject: true,
            content: true,
            createdAt: true,
            projectId: true,
            programCycleId: true,
          },
        },
      },
    }),
    prisma.notificationDispatch.count({ where }),
  ]);

  return {
    rows: rows.map((d) => ({
      dispatchId: d.id,
      notificationId: d.notificationId,
      type: d.notification.type as NotificationType,
      subject: d.notification.subject,
      content: d.notification.content,
      status: d.status as DispatchStatus,
      sentAt: d.sentAt,
      readAt: d.readAt,
      projectId: d.notification.projectId,
      programCycleId: d.notification.programCycleId,
      createdAt: d.notification.createdAt,
    })),
    total,
  };
}

/**
 * Count unread (SENT/PENDING) notifications for current user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notificationDispatch.count({
    where: {
      recipientUserId: userId,
      status: { in: ['SENT', 'PENDING'] },
    },
  });
}

/**
 * Mark a single dispatch READ. Idempotent — already-READ rows refresh readAt.
 * Verifies ownership: dispatch.recipientUserId === userId.
 */
export async function markNotificationRead(
  dispatchId: string,
  userId: string,
): Promise<void> {
  const dispatch = await prisma.notificationDispatch.findUnique({
    where: { id: dispatchId },
    select: { recipientUserId: true },
  });
  if (!dispatch) {
    throw new Error('Không tìm thấy thông báo');
  }
  if (dispatch.recipientUserId !== userId) {
    throw new Error('Bạn không có quyền truy cập thông báo này');
  }
  await prisma.notificationDispatch.update({
    where: { id: dispatchId },
    data: { status: 'READ', readAt: new Date() },
  });
}

/**
 * Mark all unread (SENT/PENDING) notifications for the user as READ.
 */
export async function markAllNotificationsRead(
  userId: string,
): Promise<{ count: number }> {
  const now = new Date();
  const result = await prisma.notificationDispatch.updateMany({
    where: {
      recipientUserId: userId,
      status: { in: ['SENT', 'PENDING'] },
    },
    data: { status: 'READ', readAt: now },
  });
  return { count: result.count };
}
