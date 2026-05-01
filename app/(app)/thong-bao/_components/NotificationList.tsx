'use client';

// NotificationList — list of notifications, click to mark read + navigate to entity.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import {
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from '@/lib/notification-types';
import type { InboxNotification } from '@/lib/notifications';
import { markRead, markAllRead } from '../_actions/list';

type Props = {
  rows: InboxNotification[];
  total: number;
  unreadCount: number;
};

const TYPE_BADGE: Record<NotificationType, string> = {
  CYCLE_INVITATION: 'bg-blue-100 text-blue-800',
  CYCLE_CONFIG_CHANGED: 'bg-amber-100 text-amber-800',
  CYCLE_EXTENDED: 'bg-amber-100 text-amber-800',
  CYCLE_OPENED: 'bg-emerald-100 text-emerald-800',
  CYCLE_CLOSED: 'bg-slate-100 text-slate-700',
  NEW_PROJECT: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  SUPPLEMENT_REQUEST: 'bg-amber-100 text-amber-800',
  APPROVAL_RESULT: 'bg-emerald-100 text-emerald-800',
  SLA_WARNING: 'bg-red-100 text-red-800',
  GENERAL: 'bg-slate-100 text-slate-700',
};

function entityHref(it: InboxNotification): string | null {
  if (it.projectId) return `/de-an/${it.projectId}`;
  if (it.programCycleId) return `/chuong-trinh/${it.programCycleId}`;
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function NotificationList({ rows, total, unreadCount }: Props) {
  const router = useRouter();
  const [marking, setMarking] = React.useState(false);
  const [pendingDispatchId, setPendingDispatchId] = React.useState<
    string | null
  >(null);

  const handleClick = async (it: InboxNotification) => {
    setPendingDispatchId(it.dispatchId);
    try {
      if (it.status !== 'READ') {
        await markRead(it.dispatchId);
      }
      const href = entityHref(it);
      if (href) {
        router.push(href);
      } else {
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setPendingDispatchId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      const result = await markAllRead();
      toast.success(`Đã đánh dấu ${result.count} thông báo là đã đọc`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setMarking(false);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <EmptyState
          icon="inbox"
          heading="Chưa có thông báo"
          description="Khi có hoạt động liên quan đến bạn, thông báo sẽ xuất hiện tại đây."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Hiển thị <strong>{rows.length}</strong> trên tổng số{' '}
          <strong>{total}</strong> thông báo
          {unreadCount > 0 ? ` · ${unreadCount} chưa đọc` : ''}
        </p>
        {unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={marking}
          >
            {marking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        ) : null}
      </div>

      <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
        {rows.map((it) => {
          const isUnread = it.status !== 'READ';
          const isPending = pendingDispatchId === it.dispatchId;
          return (
            <li
              key={it.dispatchId}
              className={cn(
                'transition-colors',
                isUnread && 'bg-blue-50/50',
              )}
            >
              <button
                type="button"
                onClick={() => handleClick(it)}
                disabled={isPending}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-inset"
              >
                <div className="flex items-start gap-3">
                  {isUnread ? (
                    <span
                      aria-hidden="true"
                      className="mt-2 h-2 w-2 rounded-full bg-blue-600 shrink-0"
                    />
                  ) : (
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={cn(
                          'text-xs',
                          TYPE_BADGE[it.type as NotificationType] ??
                            'bg-slate-100 text-slate-700',
                        )}
                      >
                        {NOTIFICATION_TYPE_LABELS[
                          it.type as NotificationType
                        ] ?? it.type}
                      </Badge>
                      <span
                        className={cn(
                          'text-sm',
                          isUnread
                            ? 'font-semibold text-slate-900'
                            : 'font-medium text-slate-800',
                        )}
                      >
                        {it.subject}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {stripHtml(it.content)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {it.sentAt
                        ? formatDistanceToNow(it.sentAt, {
                            addSuffix: true,
                            locale: vi,
                          })
                        : ''}
                      {it.readAt
                        ? ` · Đã đọc ${formatDistanceToNow(it.readAt, {
                            addSuffix: true,
                            locale: vi,
                          })}`
                        : ''}
                    </p>
                  </div>
                  {isPending ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-slate-400 mt-1"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
