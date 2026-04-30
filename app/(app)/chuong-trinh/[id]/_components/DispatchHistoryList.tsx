'use client';

// DispatchHistoryList — render dispatch summary từ getCycleDetail.
// Plan 03-06 Tab Đơn vị mời. Empty state khi chưa có dispatch nào.

import * as React from 'react';
import { Mail } from 'lucide-react';

import { formatDateTime } from '@/lib/format';
import { formatRelative } from '@/lib/date';
import {
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from '@/lib/notification-types';
import type { CycleDispatchSummaryRow } from '../../_actions/types';

export type DispatchHistoryListProps = {
  dispatches: ReadonlyArray<CycleDispatchSummaryRow>;
};

export function DispatchHistoryList({ dispatches }: DispatchHistoryListProps) {
  if (dispatches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <Mail
          className="mx-auto mb-2 h-10 w-10 text-slate-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-700">
          Chưa có thông báo nào được gửi
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Soạn thông báo trên đây và nhấn &quot;Gửi&quot; để bắt đầu chiến dịch mời
          đăng ký.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {dispatches.map((d) => {
        const typeLabel =
          NOTIFICATION_TYPE_LABELS[d.type as NotificationType] ?? d.type;
        return (
          <li
            key={d.id}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="mt-0.5 shrink-0 rounded-full bg-emerald-50 p-2 text-emerald-700">
              <Mail className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{d.subject}</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {d.dispatchCount} đơn vị
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                <span>{typeLabel}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span title={formatDateTime(d.sentAt ?? d.createdAt)}>
                  {formatRelative(d.sentAt ?? d.createdAt)}
                </span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default DispatchHistoryList;
