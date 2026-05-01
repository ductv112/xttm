'use client';

// ContractList — Phase 8 Plan 08-01 Task 2.
// DataTable với columns: số HĐ | đề án | đơn vị | giá trị | ngày ký | status | actions

import * as React from 'react';
import Link from 'next/link';
import { Search, FileText, Eye } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_BADGE,
  type ContractStatus,
} from '@/lib/amendment-rules';
import { formatDate, formatVNDCompact } from '@/lib/format';

import type { ContractListRow } from '../_actions/list';

export type ContractListProps = {
  rows: ContractListRow[];
  years: number[];
};

export function ContractList({ rows, years }: ContractListProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [yearFilter, setYearFilter] = React.useState<string>('ALL');

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (yearFilter !== 'ALL' && !r.contractNo.startsWith(`XTTM/${yearFilter}/`))
        return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.contractNo.toLowerCase().includes(q) &&
          !r.projectCode.toLowerCase().includes(q) &&
          !r.projectName.toLowerCase().includes(q) &&
          !r.organizationName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rows, search, statusFilter, yearFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            placeholder="Tìm theo số HĐ, mã đề án, tên đề án, đơn vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả năm</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {CONTRACT_STATUS_LABELS[s]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Số HĐ</th>
              <th className="px-4 py-3">Đề án</th>
              <th className="px-4 py-3">Đơn vị chủ trì</th>
              <th className="px-4 py-3 text-right">Giá trị</th>
              <th className="px-4 py-3">Ngày ký</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    icon="file-x"
                    heading="Chưa có hợp đồng"
                    description="Hãy tạo hợp đồng từ đề án đã được phê duyệt."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const statusKey = r.status as ContractStatus;
                return (
                  <tr
                    key={r.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/hop-dong/${r.id}`}
                        className="font-mono text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {r.contractNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {r.projectName}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {r.projectCode}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.organizationName}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatVNDCompact(r.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.signedDate ? formatDate(r.signedDate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          CONTRACT_STATUS_BADGE[statusKey] ??
                          'bg-slate-100 text-slate-800'
                        }
                      >
                        {CONTRACT_STATUS_LABELS[statusKey] ?? r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/hop-dong/${r.id}`}>
                            <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
                            Xem
                          </Link>
                        </Button>
                        {r.hasScan ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/hop-dong/${r.id}#scan`}
                              title="Bản scan"
                            >
                              <FileText
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        Hiển thị <strong>{filtered.length}</strong> / {rows.length} hợp đồng
      </div>
    </div>
  );
}
