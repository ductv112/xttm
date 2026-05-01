'use client';

// NotificationBell — topbar bell icon with unread count badge + dropdown of recent.
// Polls /api unread count every 60s.

import * as React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getMyUnreadCount,
  listMyInbox,
  markRead,
  markAllRead,
} from '@/app/(app)/thong-bao/_actions/list';
import type { InboxNotification } from '@/lib/notifications';

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [items, setItems] = React.useState<InboxNotification[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [marking, setMarking] = React.useState(false);

  // Poll unread count
  React.useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const count = await getMyUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        // silent — don't toast on background poll
      }
    };
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Load top 10 when dropdown opens
  React.useEffect(() => {
    if (!open) return;
    setLoadingItems(true);
    listMyInbox({ limit: 10 })
      .then((res) => setItems(res.rows))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [open]);

  const handleItemClick = async (it: InboxNotification) => {
    if (it.status !== 'READ') {
      try {
        await markRead(it.dispatchId);
        setUnreadCount((n) => Math.max(0, n - 1));
        setItems((arr) =>
          arr.map((x) =>
            x.dispatchId === it.dispatchId
              ? { ...x, status: 'READ', readAt: new Date() }
              : x,
          ),
        );
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      const res = await markAllRead();
      setUnreadCount(0);
      setItems((arr) =>
        arr.map((x) => ({ ...x, status: 'READ', readAt: new Date() })),
      );
      toast.success(`Đã đánh dấu ${res.count} thông báo là đã đọc`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setMarking(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
          className="relative text-slate-600 hover:text-blue-700"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white shadow-sm"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Thông báo</h3>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={marking}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 disabled:opacity-60"
            >
              {marking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Đánh dấu đã đọc
            </button>
          ) : null}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loadingItems ? (
            <div className="px-4 py-8 flex items-center justify-center text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Chưa có thông báo nào
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((it) => (
                <li
                  key={it.dispatchId}
                  className={cn(
                    'px-4 py-3 hover:bg-slate-50',
                    it.status !== 'READ' && 'bg-blue-50/40',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleItemClick(it)}
                    className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                  >
                    <div className="flex items-start gap-2">
                      {it.status !== 'READ' ? (
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-2 w-2 rounded-full bg-blue-600 shrink-0"
                        />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {it.subject}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {stripHtml(it.content)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {it.sentAt
                            ? formatDistanceToNow(it.sentAt, {
                                addSuffix: true,
                                locale: vi,
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
          <Link
            href="/thong-bao"
            className="block text-center text-sm font-medium text-blue-700 hover:text-blue-900 py-1"
            onClick={() => setOpen(false)}
          >
            Xem tất cả thông báo
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
