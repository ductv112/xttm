'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/format';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type DataTablePaginationProps = {
  pageIndex: number; // 0-based
  pageSize: number;
  total: number;
  onChange: (pageIndex: number, pageSize: number) => void;
};

/**
 * Pagination footer cho DataTable.
 * - Left: "Hiển thị {a}-{b} trong {total} mục"
 * - Right: page size select (10/20/50/100) + first/prev/next/last buttons + "Trang n/total"
 */
export function DataTablePagination({
  pageIndex,
  pageSize,
  total,
  onChange,
}: DataTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const start = total === 0 ? 0 : safePageIndex * pageSize + 1;
  const end = Math.min(total, (safePageIndex + 1) * pageSize);

  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < pageCount - 1;

  const handlePageSizeChange = (next: string) => {
    // When pageSize changes, reset to first page so user doesn't end up on
    // an out-of-bounds index
    onChange(0, Number(next));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      <div>
        Hiển thị <span className="font-medium text-slate-900">{formatNumber(start)}</span>
        {'-'}
        <span className="font-medium text-slate-900">{formatNumber(end)}</span>
        {' trong '}
        <span className="font-medium text-slate-900">{formatNumber(total)}</span>
        {' mục'}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <Select
            value={String(pageSize)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-20" aria-label="Số bản ghi mỗi trang">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>/ trang</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canPrev}
            onClick={() => onChange(0, pageSize)}
            aria-label="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canPrev}
            onClick={() => onChange(safePageIndex - 1, pageSize)}
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="px-2 text-sm">
            Trang <span className="font-medium text-slate-900">{safePageIndex + 1}</span>
            {'/'}
            <span className="font-medium text-slate-900">{pageCount}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => onChange(safePageIndex + 1, pageSize)}
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => onChange(pageCount - 1, pageSize)}
            aria-label="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DataTablePagination;
