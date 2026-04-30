'use client';

// IntakeTable — DataTable cho /tiep-nhan với row "Tiếp nhận" + bulk action.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, Inbox } from 'lucide-react';
import { toast } from 'sonner';

import {
  DataTable,
  type ColumnDef,
  type RowSelectionState,
  type BulkAction,
} from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import type { IntakeQueueRow } from '../_actions/list';
import { receiveProject, receiveProjects } from '../_actions/receive';

type Props = {
  rows: IntakeQueueRow[];
};

export function IntakeTable({ rows }: Props) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const handleReceive = React.useCallback(
    async (id: string, code: string) => {
      if (busyId) return;
      try {
        setBusyId(id);
        await receiveProject(id);
        toast.success(`Đã tiếp nhận hồ sơ ${code}`);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Tiếp nhận hồ sơ thất bại',
        );
      } finally {
        setBusyId(null);
      }
    },
    [router, busyId],
  );

  const columns = React.useMemo<ColumnDef<IntakeQueueRow, unknown>[]>(
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
            <div className="mt-1 text-xs text-slate-500">
              Chu kỳ {row.original.programCycleYear}
            </div>
          </div>
        ),
      },
      {
        id: 'organization',
        header: 'Đơn vị',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.organizationName}
          </span>
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
        id: 'submittedAt',
        header: 'Ngày nộp',
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-slate-700">
              {row.original.submittedAt
                ? formatDate(row.original.submittedAt)
                : '—'}
            </div>
            {row.original.daysWaiting > 0 ? (
              <div
                className={
                  row.original.daysWaiting >= 7
                    ? 'mt-0.5 text-xs font-medium text-amber-600'
                    : 'mt-0.5 text-xs text-slate-500'
                }
              >
                Đợi {row.original.daysWaiting} ngày
              </div>
            ) : (
              <div className="mt-0.5 text-xs text-slate-500">Hôm nay</div>
            )}
          </div>
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
        id: 'actions',
        header: '',
        size: 230,
        cell: ({ row }) => {
          const isBusy = busyId === row.original.id;
          return (
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
                onClick={() => handleReceive(row.original.id, row.original.code)}
                disabled={isBusy}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {isBusy ? 'Đang tiếp nhận…' : 'Tiếp nhận'}
              </Button>
            </div>
          );
        },
      },
    ],
    [router, busyId, handleReceive],
  );

  const bulkActions = React.useMemo<BulkAction<IntakeQueueRow>[]>(
    () => [
      {
        id: 'bulk-receive',
        label: 'Tiếp nhận hàng loạt',
        icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
        requireConfirm: {
          title: 'Tiếp nhận hàng loạt',
          description:
            'Toàn bộ hồ sơ đã chọn sẽ được tiếp nhận và chuyển sang trạng thái "Đã phân công" (chờ phân công chuyên viên).',
          confirmLabel: 'Tiếp nhận',
        },
        onClick: async (selected) => {
          try {
            const ids = selected.map((s) => s.id);
            const result = await receiveProjects(ids);
            const ok = result.filter((r) => r.ok).length;
            const fail = result.filter((r) => !r.ok).length;
            if (ok > 0) {
              toast.success(`Đã tiếp nhận ${ok} hồ sơ`);
            }
            if (fail > 0) {
              toast.error(`${fail} hồ sơ không thể tiếp nhận`);
            }
            setRowSelection({});
            router.refresh();
          } catch (err) {
            toast.error(
              err instanceof Error
                ? err.message
                : 'Tiếp nhận hàng loạt thất bại',
            );
          }
        },
      },
    ],
    [router],
  );

  return (
    <DataTable<IntakeQueueRow>
      columns={columns}
      data={rows}
      total={rows.length}
      pageIndex={0}
      pageSize={Math.max(rows.length, 10)}
      onPageChange={() => {}}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      getRowId={(row) => row.id}
      bulkActions={bulkActions}
      emptyState={{
        icon: 'inbox',
        heading: 'Không có hồ sơ chờ tiếp nhận',
        description:
          'Khi đơn vị chủ trì nộp đề án, hồ sơ sẽ xuất hiện ở đây để Ban quản lý tiếp nhận.',
      }}
    />
  );
}

export { Inbox }; // re-export to silence unused import warning if needed
