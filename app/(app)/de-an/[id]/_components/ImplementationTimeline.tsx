// ImplementationTimeline — Phase 8 Plan 08-01 Task 3.
// Simple horizontal timeline với CSS grid + flexbox. KHÔNG dùng Gantt library.

import * as React from 'react';
import { CheckCircle2, Circle, AlertOctagon, Loader } from 'lucide-react';

import type { ImplementationMilestone } from '@/lib/implementation';
import { formatDate } from '@/lib/format';

const STATUS_LABEL: Record<ImplementationMilestone['status'], string> = {
  PENDING: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang triển khai',
  DONE: 'Hoàn thành',
  BLOCKED: 'Bị gián đoạn',
};

const STATUS_ICON: Record<ImplementationMilestone['status'], React.ElementType> = {
  PENDING: Circle,
  IN_PROGRESS: Loader,
  DONE: CheckCircle2,
  BLOCKED: AlertOctagon,
};

const STATUS_COLOR: Record<ImplementationMilestone['status'], string> = {
  PENDING: 'bg-slate-200 text-slate-700',
  IN_PROGRESS: 'bg-blue-200 text-blue-800',
  DONE: 'bg-emerald-200 text-emerald-800',
  BLOCKED: 'bg-red-200 text-red-800',
};

const PROGRESS_BAR_COLOR: Record<ImplementationMilestone['status'], string> = {
  PENDING: 'bg-slate-300',
  IN_PROGRESS: 'bg-blue-500',
  DONE: 'bg-emerald-500',
  BLOCKED: 'bg-red-500',
};

export function ImplementationTimeline({
  milestones,
}: {
  milestones: ImplementationMilestone[];
}) {
  if (milestones.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Chưa có mốc công việc nào trong kế hoạch triển khai.
      </div>
    );
  }

  // Compute aggregate progress
  const aggregate =
    milestones.length > 0
      ? Math.round(
          milestones.reduce((acc, m) => acc + m.progress, 0) /
            milestones.length,
        )
      : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800">
            Tổng tiến độ
          </h4>
          <span className="text-2xl font-bold text-slate-900">
            {aggregate}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
            style={{ width: `${aggregate}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {milestones.map((m, idx) => {
          const Icon = STATUS_ICON[m.status];
          return (
            <div
              key={m.id}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${STATUS_COLOR[m.status]}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-slate-900">
                      {m.title}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[m.status]}`}
                    >
                      {STATUS_LABEL[m.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {m.startDate ? (
                      <>
                        Từ {formatDate(m.startDate)}
                        {m.endDate ? ` - ${formatDate(m.endDate)}` : ''}
                      </>
                    ) : (
                      'Chưa định ngày'
                    )}
                    {m.owner ? ` · Phụ trách: ${m.owner}` : ''}
                  </div>
                  {m.note ? (
                    <p className="mt-1 text-xs text-slate-500 italic">
                      {m.note}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-lg font-bold text-slate-900">
                    {m.progress}%
                  </span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all ${PROGRESS_BAR_COLOR[m.status]}`}
                  style={{ width: `${m.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
