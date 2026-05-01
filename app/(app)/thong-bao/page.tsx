// /thong-bao — Inbox page for current user.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { type Role } from '@/lib/constants';
import {
  listMyNotifications,
  getUnreadCount,
  type ListMyNotificationsOptions,
} from '@/lib/notifications';
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '@/lib/notification-types';

import { NotificationFilterBar } from './_components/NotificationFilterBar';
import { NotificationList } from './_components/NotificationList';

export const metadata = { title: 'Thông báo' };

type SearchParams = { [key: string]: string | string[] | undefined };

function asString(v: string | string[] | undefined): string | undefined {
  if (typeof v !== 'string' || v === '') return undefined;
  return v;
}

function parseDate(v: string | string[] | undefined): Date | undefined {
  const s = asString(v);
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

export default async function ThongBaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!(await canFromDB(session.user.role as Role, 'thong-bao', 'read'))) {
    redirect('/dashboard');
  }

  const params = await searchParams;

  const typeParam = asString(params.type);
  const typeFilter: NotificationType | undefined =
    typeParam && (NOTIFICATION_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as NotificationType)
      : undefined;

  const options: ListMyNotificationsOptions = {
    unreadOnly: asString(params.unreadOnly) === 'true',
    type: typeFilter,
    fromDate: parseDate(params.from),
    toDate: parseDate(params.to),
    limit: 100,
  };

  const [{ rows, total }, unreadCount] = await Promise.all([
    listMyNotifications(session.user.id, options),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Thông báo</h1>
        <p className="text-sm text-slate-600 mt-1">
          Tất cả thông báo gửi đến bạn — bao gồm yêu cầu xử lý và cảnh báo SLA
        </p>
      </div>

      <NotificationFilterBar />

      <NotificationList rows={rows} total={total} unreadCount={unreadCount} />
    </div>
  );
}
