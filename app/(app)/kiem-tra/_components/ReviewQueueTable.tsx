'use client';

// ReviewQueueTable — chuyên viên list các hồ sơ được giao kiểm tra.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ClipboardList, ExternalLink } from 'lucide-react';

import {
  DataTable,
  type ColumnDef,
} from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import type { MyReviewProjectRow } from '../_actions/list-mine';

type Props = {
  rows: MyReviewProjectRow[];
};

export function ReviewQueueTable({ rows }: Props) {
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<MyReviewProjectRow, unknown>[]>(
    () => [
      {
        id: 'code',
        header: 'Mã đề án',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-slate-700">
            {row.original.code}
          </span>
        ),
      },
      {
        id: 'name',
        header: 'Tên đề án',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="line-clamp-2 text-sm font-medium text-slate-900">
              {row.original.name}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>{row.original.organizationName}</span>
              <span>•</span>
              <span>Chu kỳ {row.original.programCycleYear}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'kind',
        header: 'Loại đề án',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 font-normal text-slate-700"
          >
            {PROJECT_KIND_LABELS[row.original.kind] ?? row.original.kind}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} entity="PROJECT" />
        ),
      },
      {
        id: 'progress',
        header: 'Tiến độ checklist',
        cell: ({ row }) => {
          const { passed, total, ratio } = row.original.checklistProgress;
          const pct = Math.round(ratio * 100);
          const tone =
            ratio >= 0.8
              ? 'bg-emerald-500'
              : ratio >= 0.5
                ? 'bg-amber-400'
                : 'bg-slate-300';
          return (
            <div className="min-w-[140px]">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  {passed}/{total} mục
                </span>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn('h-full transition-all', tone)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'assigned',
        header: 'Phân công',
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-slate-700">
              {row.original.assignedAt
                ? formatDate(row.original.assignedAt)
                : '—'}
            </div>
            <div className="mt-0.5 text-xs">
              {row.original.isOverdue ? (
                <span className="inline-flex items-center gap-1 font-medium text-red-600">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  Quá hạn {row.original.daysReviewing - 7} ngày
                </span>
              ) : row.original.daysReviewing > 0 ? (
                <span className="text-slate-500">
                  {row.original.daysReviewing} ngày
                </span>
              ) : (
                <span className="text-slate-500">Hôm nay</span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 200,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/de-an/${row.original.id}`)}
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Xem hồ sơ
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/kiem-tra/${row.original.id}`)}
            >
              <ClipboardList className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Kiểm tra
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <DataTable<MyReviewProjectRow>
      columns={columns}
      data={rows}
      total={rows.length}
      pageIndex={0}
      pageSize={Math.max(rows.length, 10)}
      onPageChange={() => {}}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/kiem-tra/${row.id}`)}
      emptyState={{
        icon: 'inbox',
        heading: 'Chưa có hồ sơ được giao',
        description:
          'Lãnh đạo Ban quản lý sẽ phân công hồ sơ cho bạn kiểm tra. Khi có hồ sơ mới, danh sách này sẽ hiển thị ở đây.',
      }}
    />
  );
}
