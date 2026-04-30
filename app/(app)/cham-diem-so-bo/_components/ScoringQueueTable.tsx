'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, ScrollText } from 'lucide-react';

import {
  DataTable,
  type ColumnDef,
} from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatVNDCompact } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import type { ValidProjectRow } from '../_actions/list-valid';

type Props = {
  rows: ValidProjectRow[];
};

export function ScoringQueueTable({ rows }: Props) {
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<ValidProjectRow, unknown>[]>(
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
        id: 'budget',
        header: 'Dự toán',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-slate-700">
            {row.original.totalBudget !== null
              ? formatVNDCompact(row.original.totalBudget)
              : '—'}
          </span>
        ),
      },
      {
        id: 'sheetStatus',
        header: 'Tình trạng',
        cell: ({ row }) => {
          const s = row.original.scoreSheetStatus;
          if (s === 'SUBMITTED') {
            return (
              <Badge className="border-emerald-200 bg-emerald-50 font-normal text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2
                  className="mr-1 h-3 w-3"
                  aria-hidden="true"
                />
                Đã nộp phiếu
              </Badge>
            );
          }
          if (s === 'DRAFT') {
            return (
              <Badge className="border-amber-200 bg-amber-50 font-normal text-amber-800 hover:bg-amber-50">
                Đang chấm
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 font-normal text-slate-600"
            >
              Chưa chấm
            </Badge>
          );
        },
      },
      {
        id: 'totalScore',
        header: 'Điểm tổng',
        cell: ({ row }) => (
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {row.original.totalScore !== null
              ? row.original.totalScore.toFixed(2)
              : '—'}
          </span>
        ),
      },
      {
        id: 'validatedAt',
        header: 'Ngày hợp lệ',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.validatedAt
              ? formatDate(row.original.validatedAt)
              : '—'}
          </span>
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
              Xem
            </Button>
            <Button
              size="sm"
              onClick={() =>
                router.push(`/cham-diem-so-bo/${row.original.id}`)
              }
            >
              <ScrollText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Chấm điểm
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <DataTable<ValidProjectRow>
      columns={columns}
      data={rows}
      total={rows.length}
      pageIndex={0}
      pageSize={Math.max(rows.length, 10)}
      onPageChange={() => {}}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/cham-diem-so-bo/${row.id}`)}
      emptyState={{
        icon: 'inbox',
        heading: 'Chưa có hồ sơ chờ chấm điểm sơ bộ',
        description:
          'Sau khi xác nhận hồ sơ hợp lệ ở trang Kiểm tra hồ sơ, hồ sơ sẽ xuất hiện ở đây để bạn chấm điểm sơ bộ.',
      }}
    />
  );
}
