'use client';

// AcceptanceQueueTable — DataTable cho /nghiem-thu (BQL queue lập biên bản + thanh lý).
// Click row → /de-an/[projectId]#nghiem-thu để mở tab nghiệm thu.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import {
  DataTable,
  type ColumnDef,
} from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';

import type {
  AcceptanceQueueRow,
  AcceptanceQueueState,
} from '../_actions/list';

const STATE_LABELS: Record<AcceptanceQueueState, string> = {
  PENDING: 'Chờ lập biên bản',
  AWAITING_LIQUIDATION: 'Chờ thanh lý hợp đồng',
};

const STATE_TONES: Record<AcceptanceQueueState, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  AWAITING_LIQUIDATION: 'border-blue-200 bg-blue-50 text-blue-700',
};

const RESULT_LABELS: Record<'PASS' | 'PARTIAL' | 'FAIL', string> = {
  PASS: 'Đạt',
  PARTIAL: 'Đạt một phần',
  FAIL: 'Không đạt',
};

const RESULT_TONES: Record<'PASS' | 'PARTIAL' | 'FAIL', string> = {
  PASS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-700',
  FAIL: 'border-red-200 bg-red-50 text-red-700',
};

type Props = {
  rows: AcceptanceQueueRow[];
};

export function AcceptanceQueueTable({ rows }: Props) {
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<AcceptanceQueueRow, unknown>[]>(
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
        id: 'state',
        header: 'Trạng thái xử lý',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className={`w-fit font-normal ${STATE_TONES[row.original.state]}`}
            >
              {STATE_LABELS[row.original.state]}
            </Badge>
            {row.original.acceptanceResult ? (
              <Badge
                variant="outline"
                className={`w-fit font-normal ${RESULT_TONES[row.original.acceptanceResult]}`}
              >
                Kết quả: {RESULT_LABELS[row.original.acceptanceResult]}
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'reportApprovedAt',
        header: 'Mốc thời gian',
        cell: ({ row }) => (
          <div className="text-xs text-slate-700">
            {row.original.acceptanceRecordNumber ? (
              <div>
                Biên bản{' '}
                <span className="font-medium">
                  {row.original.acceptanceRecordNumber}
                </span>
                {row.original.acceptanceDate ? (
                  <span className="text-slate-500">
                    {' '}
                    · {formatDate(row.original.acceptanceDate)}
                  </span>
                ) : null}
              </div>
            ) : (
              <div>
                Báo cáo duyệt{' '}
                <span className="text-slate-500">
                  {row.original.reportApprovedAt
                    ? formatDate(row.original.reportApprovedAt)
                    : '—'}
                </span>
              </div>
            )}
            <div
              className={
                row.original.daysWaiting >= 14
                  ? 'mt-0.5 font-medium text-amber-600'
                  : 'mt-0.5 text-slate-500'
              }
            >
              {row.original.daysWaiting === 0
                ? 'Hôm nay'
                : `Đã ${row.original.daysWaiting} ngày`}
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
                router.push(`/de-an/${row.original.projectId}#nghiem-thu`)
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
    <DataTable<AcceptanceQueueRow>
      columns={columns}
      data={rows}
      total={rows.length}
      pageIndex={0}
      pageSize={Math.max(rows.length, 10)}
      onPageChange={() => {}}
      getRowId={(row) => row.projectId}
      onRowClick={(row) =>
        router.push(`/de-an/${row.projectId}#nghiem-thu`)
      }
      emptyState={{
        icon: 'inbox',
        heading: 'Không có đề án nào chờ nghiệm thu',
        description:
          'Khi báo cáo kết quả được duyệt, đề án sẽ xuất hiện ở đây để Ban quản lý lập biên bản nghiệm thu và thanh lý hợp đồng.',
      }}
    />
  );
}
