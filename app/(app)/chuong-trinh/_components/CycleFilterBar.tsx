'use client';

// Filter bar URL-driven cho /chuong-trinh — source-of-truth là URL search params
// (bookmarkable + browser nav friendly). Plan 03-05 CYCLE-15.
//
// URL format: ?year=2026&status=OPEN_REGISTRATION,CLOSED_REGISTRATION
//
// 2 fields:
//   - Year: shadcn Select single (Tất cả + dynamic year list từ prop)
//   - Status: MultiSelect (7 statuses with VN labels từ CYCLE_STATUS_LABELS)
//
// Reset button "Xóa bộ lọc" — clears all sp params.

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/shared/MultiSelect';
import {
  PROGRAM_CYCLE_STATUSES,
  CYCLE_STATUS_LABELS,
  type ProgramCycleStatus,
} from '@/lib/workflows/programCycle';

const ALL_YEARS_VALUE = '__all__';
const STATUS_SET = new Set<ProgramCycleStatus>(PROGRAM_CYCLE_STATUSES);

const STATUS_OPTIONS = PROGRAM_CYCLE_STATUSES.map((s) => ({
  value: s,
  label: CYCLE_STATUS_LABELS[s],
}));

export type CycleFilterBarProps = {
  yearOptions: number[];
};

export function CycleFilterBar({ yearOptions }: CycleFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current filter state from URL (single source of truth)
  const yearParam = searchParams.get('year');
  const statusParam = searchParams.get('status');

  const currentYear: string = yearParam && /^\d+$/.test(yearParam)
    ? yearParam
    : ALL_YEARS_VALUE;

  const currentStatuses: ProgramCycleStatus[] = React.useMemo(() => {
    if (!statusParam) return [];
    return statusParam
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is ProgramCycleStatus =>
        STATUS_SET.has(s as ProgramCycleStatus),
      );
  }, [statusParam]);

  const updateUrl = React.useCallback(
    (patch: { year?: string | null; statuses?: ProgramCycleStatus[] | null }) => {
      const sp = new URLSearchParams(searchParams.toString());

      if (patch.year !== undefined) {
        if (patch.year === null || patch.year === ALL_YEARS_VALUE) {
          sp.delete('year');
        } else {
          sp.set('year', patch.year);
        }
      }

      if (patch.statuses !== undefined) {
        if (patch.statuses === null || patch.statuses.length === 0) {
          sp.delete('status');
        } else {
          sp.set('status', patch.statuses.join(','));
        }
      }

      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const handleYearChange = (value: string) => {
    updateUrl({ year: value });
  };

  const handleStatusChange = (values: string[]) => {
    const validated = values.filter((v): v is ProgramCycleStatus =>
      STATUS_SET.has(v as ProgramCycleStatus),
    );
    updateUrl({ statuses: validated });
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const hasActiveFilters = currentYear !== ALL_YEARS_VALUE || currentStatuses.length > 0;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cycle-filter-year" className="text-xs text-slate-600">
          Năm
        </Label>
        <Select value={currentYear} onValueChange={handleYearChange}>
          <SelectTrigger id="cycle-filter-year" className="w-40">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_YEARS_VALUE}>Tất cả</SelectItem>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cycle-filter-status" className="text-xs text-slate-600">
          Trạng thái
        </Label>
        <MultiSelect
          id="cycle-filter-status"
          options={STATUS_OPTIONS}
          values={currentStatuses}
          onChange={handleStatusChange}
          placeholder="Tất cả trạng thái"
          searchPlaceholder="Tìm trạng thái..."
          triggerWidth="w-64"
        />
      </div>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="ml-auto self-end text-slate-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Xóa bộ lọc
        </Button>
      ) : null}
    </div>
  );
}

export default CycleFilterBar;
