'use client';

// FinancialRecordTable — Phase 9 Plan 09-01 Task 3.
// Bảng hồ sơ tài chính với filter, search, pagination.

import * as React from 'react';
import Link from 'next/link';
import { Search, Filter as FilterIcon, ChevronRight } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatVND, formatDate } from '@/lib/format';
import {
  FINANCIAL_RECORD_TYPES,
  FINANCIAL_TYPE_LABELS,
  FINANCIAL_STATUSES,
  FINANCIAL_STATUS_LABELS,
  FINANCIAL_STATUS_BADGE,
  type FinancialRecordType,
  type FinancialStatus,
} from '@/lib/workflows/financial';

import type { FinancialRecordRow } from '../_actions/list';

const PAGE_SIZE = 15;

export function FinancialRecordTable({
  rows,
}: {
  rows: ReadonlyArray<FinancialRecordRow>;
}) {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<
    FinancialRecordType | 'ALL'
  >('ALL');
  const [statusFilter, setStatusFilter] = React.useState<
    FinancialStatus | 'ALL'
  >('ALL');
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== 'ALL' && r.recordType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (q) {
        const haystack = [
          r.recordNumber,
          r.projectCode,
          r.projectName,
          r.organizationName,
          r.contractNo,
          r.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
        <div className="relative flex-1 min-w-60">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            placeholder="Tìm số phiếu, mã đề án, đơn vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) =>
            setTypeFilter(v as FinancialRecordType | 'ALL')
          }
        >
          <SelectTrigger className="w-44">
            <FilterIcon className="mr-1 h-4 w-4" aria-hidden="true" />
            <SelectValue placeholder="Loại hồ sơ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            {FINANCIAL_RECORD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {FINANCIAL_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as FinancialStatus | 'ALL')
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {FINANCIAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {FINANCIAL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pageRows.length === 0 ? (
        <div className="p-2">
          <EmptyState
            icon="file-x"
            heading="Chưa có hồ sơ tài chính nào"
            description="Khi tạo hồ sơ tạm ứng/thanh toán/quyết toán, danh sách sẽ hiển thị tại đây."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Số phiếu</th>
                <th className="px-3 py-2 font-medium">Loại</th>
                <th className="px-3 py-2 font-medium">Đề án</th>
                <th className="px-3 py-2 font-medium">Đơn vị</th>
                <th className="px-3 py-2 text-right font-medium">Số tiền</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium">Ngày tạo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 font-mono text-xs text-blue-700">
                    {r.recordNumber ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-800"
                    >
                      {FINANCIAL_TYPE_LABELS[r.recordType]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/de-an/${r.projectId}`}
                      className="text-blue-700 hover:underline"
                    >
                      <span className="font-mono text-xs">
                        {r.projectCode}
                      </span>
                      <span className="ml-1 text-slate-700">
                        {r.projectName.length > 40
                          ? r.projectName.slice(0, 40) + '…'
                          : r.projectName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {r.organizationName}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">
                    {formatVND(r.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={FINANCIAL_STATUS_BADGE[r.status]}
                    >
                      {FINANCIAL_STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/tai-chinh/${r.id}`}
                      className="inline-flex items-center text-blue-700 hover:underline"
                    >
                      Xem
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
          <div>
            Trang {safePage} / {totalPages} · Tổng {filtered.length} hồ sơ
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
