'use client';

// MasterFilterBar — search + status + year + kind + (mineOnly cho CHUYENVIEN) + Export Excel.
// Sync state với URL searchParams; page server re-fetch.

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PROJECT_KIND_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
} from '@/lib/workflows/project';

import { exportProjectsExcel } from '../_actions/export-all';
import type { MasterFilters } from '../_actions/list-all';

const KIND_OPTIONS = Object.entries(PROJECT_KIND_LABELS).map(
  ([code, label]) => ({ code, label }),
);
const STATUS_OPTIONS = PROJECT_STATUSES.map((s) => ({
  code: s,
  label: PROJECT_STATUS_LABELS[s] ?? s,
}));

type Props = {
  years: number[];
  showMineOnly?: boolean;
};

export function MasterFilterBar({ years, showMineOnly = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [search, setSearch] = React.useState(sp.get('q') ?? '');
  const [status, setStatus] = React.useState(sp.get('status') ?? 'ALL');
  const [year, setYear] = React.useState(sp.get('year') ?? 'ALL');
  const [kind, setKind] = React.useState(sp.get('kind') ?? 'ALL');
  const [mineOnly, setMineOnly] = React.useState(sp.get('mine') === '1');
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (status && status !== 'ALL') params.set('status', status);
      if (year && year !== 'ALL') params.set('year', year);
      if (kind && kind !== 'ALL') params.set('kind', kind);
      if (mineOnly) params.set('mine', '1');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname stable
  }, [search, status, year, kind, mineOnly]);

  const hasActive =
    search.trim().length > 0 ||
    (status && status !== 'ALL') ||
    (year && year !== 'ALL') ||
    (kind && kind !== 'ALL') ||
    mineOnly;

  const handleClear = () => {
    setSearch('');
    setStatus('ALL');
    setYear('ALL');
    setKind('ALL');
    setMineOnly(false);
  };

  function buildFilter(): MasterFilters {
    return {
      search: search.trim() || undefined,
      status: status !== 'ALL' ? status : undefined,
      year: year !== 'ALL' ? Number.parseInt(year, 10) : undefined,
      kind: kind !== 'ALL' ? kind : undefined,
      mineOnly: mineOnly || undefined,
    };
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { filename, base64, count } = await exportProjectsExcel(
        buildFilter(),
      );
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${count.toLocaleString('vi-VN')} đề án`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xuất Excel thất bại';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }

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

      <div className="w-[180px]">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Trạng thái
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.code} value={opt.code}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[140px]">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Năm chu kỳ
        </label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[200px]">
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

      {showMineOnly ? (
        <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
          <Checkbox
            checked={mineOnly}
            onCheckedChange={(v) => setMineOnly(!!v)}
            aria-label="Chỉ xem đề án được giao cho tôi"
          />
          Chỉ của tôi
        </label>
      ) : null}

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

      <div className="ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="h-9"
        >
          {exporting ? (
            <Loader2
              className="mr-1.5 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          Xuất Excel
        </Button>
      </div>
    </div>
  );
}
