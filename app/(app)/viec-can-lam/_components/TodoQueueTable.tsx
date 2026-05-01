'use client';

// TodoQueueTable — DataTable cho /viec-can-lam (DONVI hàng đợi việc cần làm).
// Click row hoặc nút "Xử lý" → đi tới đề án + tab tương ứng.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import {
  DataTable,
  type ColumnDef,
} from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { TodoRow, TodoType } from '../_actions/list';

const TYPE_LABELS: Record<TodoType, string> = {
  PROJECT_DRAFT: 'Đề án nháp',
  PROJECT_SUPPLEMENT: 'Cần bổ sung hồ sơ',
  REPORT_NEEDED: 'Cần lập báo cáo',
  REPORT_DRAFT: 'Báo cáo nháp',
  REPORT_RETURNED: 'Báo cáo trả bổ sung',
  AMENDMENT_PENDING: 'Điều chỉnh chờ duyệt',
};

const TYPE_TONES: Record<TodoType, string> = {
  PROJECT_DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  PROJECT_SUPPLEMENT: 'border-amber-200 bg-amber-50 text-amber-700',
  REPORT_NEEDED: 'border-blue-200 bg-blue-50 text-blue-700',
  REPORT_DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  REPORT_RETURNED: 'border-amber-200 bg-amber-50 text-amber-700',
  AMENDMENT_PENDING: 'border-violet-200 bg-violet-50 text-violet-700',
};

type Props = {
  rows: TodoRow[];
};

export function TodoQueueTable({ rows }: Props) {
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<TodoRow, unknown>[]>(
    () => [
      {
        id: 'type',
        header: 'Loại việc',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`w-fit font-normal ${TYPE_TONES[row.original.type]}`}
          >
            {TYPE_LABELS[row.original.type]}
          </Badge>
        ),
      },
      {
        id: 'projectName',
        header: 'Đề án',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="line-clamp-2 text-sm font-medium text-slate-900">
              {row.original.projectName}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span className="font-mono">{row.original.projectCode}</span>
              {' · '}
              Chu kỳ {row.original.programCycleYear}
            </div>
          </div>
        ),
      },
      {
        id: 'description',
        header: 'Nội dung',
        cell: ({ row }) => (
          <div className="max-w-lg text-sm text-slate-700">
            {row.original.description}
          </div>
        ),
      },
      {
        id: 'days',
        header: 'Số ngày',
        cell: ({ row }) => (
          <div
            className={
              row.original.daysWaiting >= 7
                ? 'text-sm font-medium text-amber-600'
                : 'text-sm text-slate-500'
            }
          >
            {row.original.daysWaiting === 0
              ? 'Hôm nay'
              : `${row.original.daysWaiting} ngày`}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 130,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              onClick={() => router.push(row.original.href)}
            >
              <ExternalLink
                className="mr-1 h-3.5 w-3.5"
                aria-hidden="true"
              />
              Xử lý
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <DataTable<TodoRow>
      columns={columns}
      data={rows}
      total={rows.length}
      pageIndex={0}
      pageSize={Math.max(rows.length, 10)}
      onPageChange={() => {}}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(row.href)}
      emptyState={{
        icon: 'inbox',
        heading: 'Không có việc nào cần xử lý',
        description:
          'Bạn đang theo kịp tiến độ — mọi việc đã được xử lý hoặc đang chờ Ban quản lý phản hồi.',
      }}
    />
  );
}
