'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_BADGE,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCES,
  AUDIT_RESOURCE_LABELS,
  type AuditAction,
  type AuditResource,
} from '@/lib/audit-types';
import { listAuditLogs } from '../_actions/list';
import type {
  AuditFilter,
  AuditListResult,
  AuditLogRow,
} from '../_actions/types';
import { AuditLogDetailSheet } from './AuditLogDetailSheet';

const PAGE_SIZE = 50;

type Props = {
  initialFilter: AuditFilter;
  initialPageIndex: number;
  initialData: AuditListResult;
};

export function AuditLogTable({
  initialFilter,
  initialPageIndex,
  initialData,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const pageIndex = Math.max(0, Number(sp.get('page') ?? '0') || 0);

  // Filter mirrors URL — re-derive on every render so query key reacts to URL change
  const filter: AuditFilter = React.useMemo(
    () => ({
      userId: sp.get('userId') || undefined,
      resources: parseListParam<AuditResource>(sp.get('resources'), AUDIT_RESOURCES),
      actions: parseListParam<AuditAction>(sp.get('actions'), AUDIT_ACTIONS),
      from: sp.get('from') || undefined,
      to: sp.get('to') || undefined,
      keyword: sp.get('q') || undefined,
    }),
    [sp],
  );

  const isInitial =
    pageIndex === initialPageIndex &&
    JSON.stringify(filter) === JSON.stringify(initialFilter);

  const { data, isFetching, isError, error } = useQuery<AuditListResult>({
    queryKey: ['audit-log', filter, pageIndex],
    queryFn: () => listAuditLogs(filter, pageIndex, PAGE_SIZE),
    placeholderData: keepPreviousData,
    initialData: isInitial ? initialData : undefined,
    staleTime: 30_000,
  });

  const [selected, setSelected] = React.useState<AuditLogRow | null>(null);

  function setPage(next: number) {
    const params = new URLSearchParams(sp.toString());
    if (next <= 0) params.delete('page');
    else params.set('page', String(next));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">
          Đã xảy ra lỗi khi tải nhật ký:{' '}
          {error instanceof Error ? error.message : 'Vui lòng thử lại'}
        </p>
      </div>
    );
  }

  if (!data) {
    return <TableSkeleton />;
  }

  const total = data.total;
  const rows = data.rows;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showFrom = total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const showTo = Math.min(total, (pageIndex + 1) * PAGE_SIZE);

  return (
    <>
      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Thời gian</TableHead>
              <TableHead className="w-[220px]">Người dùng</TableHead>
              <TableHead className="w-[140px]">Hành động</TableHead>
              <TableHead className="w-[180px]">Phân hệ</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead className="w-[60px] text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[260px]">
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn('cursor-pointer hover:bg-slate-50')}
                  onClick={() => setSelected(row)}
                >
                  <TableCell className="text-sm">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900">
                      {row.userFullName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {ROLE_LABELS[row.userRole as Role] ?? row.userRole}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        AUDIT_ACTION_BADGE[row.action],
                      )}
                    >
                      {AUDIT_ACTION_LABELS[row.action]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {AUDIT_RESOURCE_LABELS[row.resource] ?? row.resource}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600 truncate max-w-[260px]">
                    {row.resourceId ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Xem chi tiết"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(row);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-600">
              Hiển thị{' '}
              <span className="font-medium text-slate-900">
                {showFrom.toLocaleString('vi-VN')}–{showTo.toLocaleString('vi-VN')}
              </span>{' '}
              trong tổng{' '}
              <span className="font-medium text-slate-900">
                {total.toLocaleString('vi-VN')}
              </span>{' '}
              bản ghi
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pageIndex <= 0 || isFetching}
                onClick={() => setPage(pageIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="text-sm text-slate-600">
                Trang {pageIndex + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pageIndex >= totalPages - 1 || isFetching}
                onClick={() => setPage(pageIndex + 1)}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AuditLogDetailSheet
        row={selected}
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <History className="h-12 w-12 text-slate-400" />
      <h3 className="text-base font-semibold text-slate-900">Chưa có nhật ký</h3>
      <p className="text-sm text-slate-600 max-w-md">
        Chưa có nhật ký nào trong khoảng thời gian này. Nhật ký sẽ tự động ghi
        nhận khi có thao tác thay đổi dữ liệu trong hệ thống.
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function parseListParam<T extends string>(
  raw: string | null,
  allowed: readonly T[],
): T[] | undefined {
  if (!raw) return undefined;
  const set = new Set(allowed as readonly string[]);
  const arr = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => set.has(s));
  return arr.length === 0 ? undefined : arr;
}
