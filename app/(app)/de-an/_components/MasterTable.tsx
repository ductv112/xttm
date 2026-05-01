'use client';

// MasterTable — DataTable cấp hệ thống cho non-DONVI roles trên /de-an.
// Click row → /de-an/[id] (page detail đã có 11 tab đầy đủ vòng đời).

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, ListChecks } from 'lucide-react';

import {
  DataTable,
  type ColumnDef,
} from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatVNDCompact } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import type { MasterProjectRow } from '../_actions/list-all';

type Props = {
  rows: MasterProjectRow[];
};

export function MasterTable({ rows }: Props) {
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<MasterProjectRow, unknown>[]>(
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
        header: 'Tên đề án / Đơn vị',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="line-clamp-2 text-sm font-medium text-slate-900">
              {row.original.name}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {row.original.organizationName} · Chu kỳ{' '}
              {row.original.programCycleYear}
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
        id: 'budget',
        header: 'Ngân sách',
        cell: ({ row }) => {
          const proposed = row.original.totalBudget;
          const approved = row.original.approvedBudget;
          return (
            <div className="text-right text-sm">
              {approved !== null ? (
                <div className="font-medium text-emerald-700">
                  {formatVNDCompact(approved)}
                </div>
              ) : null}
              {proposed !== null ? (
                <div
                  className={
                    approved !== null
                      ? 'text-xs text-slate-500'
                      : 'text-slate-700'
                  }
                >
                  {approved !== null ? 'Đề xuất: ' : ''}
                  {formatVNDCompact(proposed)}
                </div>
              ) : (
                <div className="text-slate-400">—</div>
              )}
            </div>
          );
        },
      },
      {
        id: 'milestone',
        header: 'Mốc thời gian',
        cell: ({ row }) => {
          const r = row.original;
          if (r.approvedAt) {
            return (
              <div className="text-xs text-slate-700">
                <div>
                  Ký HĐ <span className="text-slate-500">{formatDate(r.approvedAt)}</span>
                </div>
                {r.assignedReviewerName ? (
                  <div className="mt-0.5 text-slate-500">
                    CV: {r.assignedReviewerName}
                  </div>
                ) : null}
              </div>
            );
          }
          if (r.receivedAt) {
            return (
              <div className="text-xs text-slate-700">
                <div>
                  Tiếp nhận{' '}
                  <span className="text-slate-500">
                    {formatDate(r.receivedAt)}
                  </span>
                </div>
                {r.assignedReviewerName ? (
                  <div className="mt-0.5 text-slate-500">
                    CV: {r.assignedReviewerName}
                  </div>
                ) : null}
              </div>
            );
          }
          if (r.submittedAt) {
            return (
              <div className="text-xs text-slate-700">
                <div>
                  Đã nộp{' '}
                  <span className="text-slate-500">
                    {formatDate(r.submittedAt)}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div className="text-xs text-slate-500">
              Tạo {formatDate(r.createdAt)}
            </div>
          );
        },
      },
      {
        id: 'progress',
        header: 'Tiến độ',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs">
            <Step done={row.original.hasContract} label="HĐ" />
            <Step done={row.original.hasReport} label="BC" />
            <Step done={row.original.hasAcceptance} label="NT" />
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end"
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
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <DataTable<MasterProjectRow>
      columns={columns}
      data={rows}
      total={rows.length}
      pageIndex={0}
      pageSize={Math.max(rows.length, 20)}
      onPageChange={() => {}}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/de-an/${row.id}`)}
      emptyState={{
        icon: 'inbox',
        heading: 'Không tìm thấy đề án nào',
        description:
          'Hiện không có đề án nào khớp bộ lọc. Thử mở rộng tiêu chí tìm kiếm hoặc xóa lọc.',
      }}
    />
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={
        done
          ? 'inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700'
          : 'inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-slate-400'
      }
      title={
        label === 'HĐ'
          ? 'Hợp đồng'
          : label === 'BC'
            ? 'Báo cáo'
            : 'Nghiệm thu'
      }
    >
      {done ? <ListChecks className="h-3 w-3" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
