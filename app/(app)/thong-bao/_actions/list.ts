'use server';

// Server actions for /thong-bao inbox.
// Wraps lib/notifications inbox helpers with auth + RBAC.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { type Role } from '@/lib/constants';
import {
  listMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type ListMyNotificationsOptions,
  type InboxNotification,
} from '@/lib/notifications';

export async function listMyInbox(
  options: ListMyNotificationsOptions = {},
): Promise<{ rows: InboxNotification[]; total: number }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role as Role, 'thong-bao', 'read'))) {
    throw new Error('Bạn không có quyền xem thông báo');
  }
  return listMyNotifications(session.user.id, options);
}

export async function getMyUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user) return 0;
  return getUnreadCount(session.user.id);
}

export async function markRead(dispatchId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  await markNotificationRead(dispatchId, session.user.id);
  revalidatePath('/thong-bao');
}

export async function markAllRead(): Promise<{ count: number }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const result = await markAllNotificationsRead(session.user.id);
  revalidatePath('/thong-bao');
  return result;
}
