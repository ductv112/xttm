// ProjectStatusTimeline — vertical timeline visual hiển thị các status transitions
// của đề án (PROJ-19). Plan 05-03 Tổng quan tab embed.
//
// Pattern: server-side fetch audit log entries cho project + render filtered
// theo TRANSITION/SUBMIT actions. Mỗi entry hiển thị status từ → đến + thời điểm
// + người thực hiện. Current status hiển thị ở dòng cuối cùng (active dot).
//
// Để giữ component pure presentation, audit fetching được thực hiện ở RSC
// page và pass props transitions array.

import * as React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@/lib/workflows/project';

export type ProjectTimelineEntry = {
  id: string;
  /** Trạng thái sau transition (status displayed at this row) */
  status: ProjectStatus;
  /** Thời điểm transition xảy ra */
  at: Date;
  /** Người thực hiện hành động */
  byName: string | null;
  /** Mô tả ngắn (vd: "Nộp đề án", "Yêu cầu bổ sung") */
  label: string;
};

export type ProjectStatusTimelineProps = {
  entries: ReadonlyArray<ProjectTimelineEntry>;
  currentStatus: ProjectStatus;
};

/**
 * Visual timeline of project status transitions.
 *
 * - Đầu = trạng thái hiện tại (CHECK if reached terminal positive, CIRCLE active otherwise)
 * - Mỗi entry render dot trái + line kết nối + content phải
 * - Empty state: hiển thị 1 dot tương ứng currentStatus với mô tả "Trạng thái hiện tại"
 */
export function ProjectStatusTimeline({
  entries,
  currentStatus,
}: ProjectStatusTimelineProps) {
  const reversed = [...entries].reverse(); // hiển thị mới nhất ở đầu (top)
  const isTerminal = ['COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(
    currentStatus,
  );

  if (reversed.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Circle className="h-3 w-3 fill-blue-700" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {PROJECT_STATUS_LABELS[currentStatus]}
              </span>
              <StatusBadge entity="PROJECT" status={currentStatus} />
            </div>
            <p className="mt-1 text-xs text-slate-500">Trạng thái hiện tại</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
      {reversed.map((entry, idx) => {
        const isCurrent = idx === 0;
        const isPositiveTerminal =
          isCurrent && (isTerminal && currentStatus !== 'REJECTED' && currentStatus !== 'CANCELLED');
        const Icon = isPositiveTerminal
          ? CheckCircle2
          : isCurrent
            ? Clock
            : Circle;
        return (
          <li key={entry.id} className="relative">
            <span
              className={cn(
                'absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2',
                isCurrent
                  ? 'border-blue-700 bg-white text-blue-700'
                  : 'border-slate-300 bg-white text-slate-400',
              )}
              aria-hidden="true"
            >
              <Icon
                className={cn(
                  'h-3 w-3',
                  isCurrent && !isPositiveTerminal ? 'fill-blue-700 stroke-blue-700' : '',
                )}
              />
            </span>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {entry.label}
                </span>
                <StatusBadge entity="PROJECT" status={entry.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime(entry.at)}
                {entry.byName ? (
                  <>
                    {' · '}
                    <span className="font-medium text-slate-700">
                      {entry.byName}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default ProjectStatusTimeline;
