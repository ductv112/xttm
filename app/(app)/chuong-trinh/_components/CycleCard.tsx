'use client';

// Card hiển thị 1 cycle trong card grid /chuong-trinh.
// Plan 03-05 — header (year 4xl + status badge), stats grid 2x2,
// progress bar timeline (% thời gian đã trôi qua giữa registrationOpenAt → CloseAt),
// countdown widget cho OPEN_REGISTRATION (amber khi ≤7 ngày), footer "Xem chi tiết".
//
// Whole card wrapped trong <Link href={`/chuong-trinh/${id}`}> — toàn card clickable.

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatVNDCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

import type { CycleListItem } from '../_actions/types';

export type CycleCardProps = {
  cycle: CycleListItem;
};

type CountdownDisplay = {
  label: string;
  className: string;
};

function resolveCountdown(cycle: CycleListItem): CountdownDisplay {
  switch (cycle.status) {
    case 'OPEN_REGISTRATION': {
      const days = cycle.daysRemaining;
      if (days == null) {
        return { label: 'Chưa cấu hình hạn', className: 'text-slate-500' };
      }
      const className = days <= 7 ? 'text-amber-600' : 'text-slate-900';
      return { label: `${days} ngày`, className };
    }
    case 'CLOSED_REGISTRATION':
      return { label: 'Đã đóng cổng', className: 'text-amber-700' };
    case 'COMPLETED':
      return { label: 'Đã hoàn thành', className: 'text-slate-500' };
    case 'APPROVED':
      return { label: 'Đã phê duyệt', className: 'text-emerald-700' };
    case 'EVALUATING':
      return { label: 'Đang thẩm định', className: 'text-blue-700' };
    case 'DRAFT':
    case 'READY':
    default:
      return { label: 'Chưa mở cổng', className: 'text-slate-500' };
  }
}

type ProgressInfo = {
  pct: number;
  open: Date;
  close: Date;
};

function computeProgress(cycle: CycleListItem): ProgressInfo | null {
  const open = cycle.registrationOpenAt ? new Date(cycle.registrationOpenAt) : null;
  const close = cycle.registrationCloseAt
    ? new Date(cycle.registrationCloseAt)
    : null;
  if (!open || !close) return null;
  const total = close.getTime() - open.getTime();
  if (total <= 0) return null;
  const elapsed = Math.min(total, Math.max(0, Date.now() - open.getTime()));
  const pct = Math.round((elapsed / total) * 100);
  return { pct, open, close };
}

export function CycleCard({ cycle }: CycleCardProps) {
  const countdown = resolveCountdown(cycle);
  const progress = computeProgress(cycle);
  const totalBudgetDisplay =
    cycle.totalBudget != null ? formatVNDCompact(cycle.totalBudget) : 'Chưa cấu hình';

  return (
    <Link
      href={`/chuong-trinh/${cycle.id}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
      aria-label={`Xem chi tiết chu kỳ ${cycle.year} - ${cycle.name}`}
    >
      <div className="card-elevated p-6 hover:border-primary/40">
        {/* Header: year + status badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-4xl font-bold text-primary leading-none tracking-tight">
              {cycle.year}
            </div>
            <div className="text-sm text-slate-600 mt-2 line-clamp-2">
              {cycle.name}
            </div>
          </div>
          <StatusBadge status={cycle.status} entity="PROGRAM_CYCLE" />
        </div>

        {/* Stats grid 2x2 */}
        <dl className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-slate-500">Tổng kinh phí</dt>
            <dd className="text-base font-semibold text-slate-900 mt-0.5">
              {totalBudgetDisplay}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Đề án đăng ký</dt>
            <dd className="text-base font-semibold text-slate-900 mt-0.5">
              {cycle.projectCount} đề án
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Đơn vị mời</dt>
            <dd className="text-base font-semibold text-slate-900 mt-0.5">
              {cycle.invitedOrgCount} đơn vị
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Hạn còn lại</dt>
            <dd className={cn('text-base font-semibold mt-0.5', countdown.className)}>
              {countdown.label}
            </dd>
          </div>
        </dl>

        {/* Progress bar timeline */}
        {progress ? (
          <div className="mt-5">
            <div
              className="h-2 rounded-full bg-slate-100 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.pct}
              aria-label={`Tiến độ thời gian: ${progress.pct}%`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {formatDate(progress.open)} → {formatDate(progress.close)}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end text-sm font-medium text-primary group-hover:underline">
          Xem chi tiết
          <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

export default CycleCard;
