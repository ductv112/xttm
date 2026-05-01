'use client';

// ReportReviewQueueTable — DataTable cho /bao-cao (BQL queue duyệt báo cáo kết quả).
// Click row → /de-an/[projectId]#bao-cao để mở tab Báo cáo và xử lý.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import {
  DataTable,
  type ColumnDef,
} from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';

import type { ReportReviewQueueRow } from '../_actions/list';

type Props = {
  rows: ReportReviewQueueRow[];
};

export function ReportReviewQueueTable({ rows }: Props) {
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<ReportReviewQueueRow, unknown>[]>(
    () => [
      {
        id: 'projectCode',
        header: 'Mã đề án',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-slate-700">
            {row.original.projectCode}
          </span>
        ),
      },
      {
        id: 'projectName',
        header: 'Tên đề án / Đơn vị',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="line-clamp-2 text-sm font-medium text-slate-900">
              {row.original.projectName}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {row.original.organizationName} · Chu kỳ{' '}
              {row.original.programCycleYear}
            </div>
          </div>
        ),
      },
      {
        id: 'reportTitle',
        header: 'Báo cáo',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="line-clamp-2 text-sm text-slate-700">
              {row.original.reportTitle}
            </div>
            {row.original.attendingCompaniesCount !== null ? (
              <div className="mt-0.5 text-xs text-slate-500">
                {row.original.attendingCompaniesCount} doanh nghiệp tham gia
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: 'submittedAt',
        header: 'Ngày nộp',
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-slate-700">
              {row.original.submittedAt
                ? formatDate(row.original.submittedAt)
                : '—'}
            </div>
            <div
              className={
                row.original.daysWaiting >= 7
                  ? 'mt-0.5 text-xs font-medium text-amber-600'
                  : 'mt-0.5 text-xs text-slate-500'
              }
            >
              {row.original.daysWaiting === 0
                ? 'Hôm nay'
                : `Đợi ${row.original.daysWaiting} ngày`}
            </div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 130,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              onClick={() =>
                router.push(`/de-an/${row.original.projectId}#bao-cao`)
              }
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Xử lý
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <DataTable<ReportReviewQueueRow>
      columns={columns}
      data={rows}
      total={rows.length}
      pageIndex={0}
      pageSize={Math.max(rows.length, 10)}
      onPageChange={() => {}}
      getRowId={(row) => row.reportId}
      onRowClick={(row) =>
        router.push(`/de-an/${row.projectId}#bao-cao`)
      }
      emptyState={{
        icon: 'inbox',
        heading: 'Không có báo cáo nào chờ duyệt',
        description:
          'Khi đơn vị chủ trì nộp báo cáo kết quả, danh sách sẽ hiển thị ở đây để Ban quản lý xét duyệt.',
      }}
    />
  );
}
