'use client';

import { Filter, Download } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  CYCLE_YEARS,
  COMPARE_YEARS,
  KIND_FILTERS,
  SECTOR_FILTERS,
  MARKET_FILTERS,
} from '../_data/mock-kpi';

export type FilterState = {
  year: number;
  compareYear: number;
  kind: string;
  sector: string;
  market: string;
};

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onExport: () => void;
};

export function FilterBar({ value, onChange, onExport }: Props) {
  return (
    <div className="card-elevated px-4 py-3 bg-gradient-to-br from-slate-50 via-white to-slate-100/60">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700 shrink-0">
          <Filter className="h-4 w-4" aria-hidden="true" />
        </span>

        <FilterField label="Chu kỳ">
          <Select
            value={String(value.year)}
            onValueChange={(v) => onChange({ ...value, year: Number(v) })}
          >
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CYCLE_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Năm {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="So sánh">
          <Select
            value={String(value.compareYear)}
            onValueChange={(v) => onChange({ ...value, compareYear: Number(v) })}
          >
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPARE_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Năm {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Loại hình">
          <Select
            value={value.kind}
            onValueChange={(v) => onChange({ ...value, kind: v })}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Ngành hàng">
          <Select
            value={value.sector}
            onValueChange={(v) => onChange({ ...value, sector: v })}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTOR_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Thị trường">
          <Select
            value={value.market}
            onValueChange={(v) => onChange({ ...value, market: v })}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKET_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <div className="ml-auto shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onExport} className="h-9 gap-1.5">
            <Download className="h-4 w-4" aria-hidden="true" />
            Xuất PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
        {label}
      </label>
      {children}
    </div>
  );
}
