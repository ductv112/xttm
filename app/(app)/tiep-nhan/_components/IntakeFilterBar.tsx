'use client';

// IntakeFilterBar — search + kind + ngày nộp range filter cho /tiep-nhan.
// Pushes filter state vào URL searchParams; page server component re-fetches.

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

const KIND_OPTIONS = Object.entries(PROJECT_KIND_LABELS).map(([code, label]) => ({
  code,
  label,
}));

export function IntakeFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [search, setSearch] = React.useState(sp.get('q') ?? '');
  const [kind, setKind] = React.useState(sp.get('kind') ?? 'ALL');
  const [fromDate, setFromDate] = React.useState(sp.get('from') ?? '');
  const [toDate, setToDate] = React.useState(sp.get('to') ?? '');

  // Sync URL whenever local state changes (debounced for search)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (kind && kind !== 'ALL') params.set('kind', kind);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname is stable
  }, [search, kind, fromDate, toDate]);

  const hasActive =
    search.trim().length > 0 ||
    (kind && kind !== 'ALL') ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const handleClear = () => {
    setSearch('');
    setKind('ALL');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="min-w-[260px] flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Tìm kiếm
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mã đề án, tên đề án, tên đơn vị…"
            className="pl-8"
          />
        </div>
      </div>

      <div className="w-[220px]">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Loại đề án
        </label>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {KIND_OPTIONS.map((opt) => (
              <SelectItem key={opt.code} value={opt.code}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[160px]">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Từ ngày
        </label>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
      </div>

      <div className="w-[160px]">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Đến ngày
        </label>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {hasActive ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-9 text-slate-600"
        >
          <X className="mr-1 h-4 w-4" aria-hidden="true" />
          Xóa lọc
        </Button>
      ) : null}
    </div>
  );
}
