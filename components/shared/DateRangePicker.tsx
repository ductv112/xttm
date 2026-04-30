'use client';

import * as React from 'react';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type DateRangePickerProps = {
  from?: Date;
  to?: Date;
  onChange: (range: DateRange) => void;
  /** Trigger button placeholder. Default: "Chọn khoảng ngày" */
  placeholder?: string;
  /** Popover alignment. Default: "start" */
  align?: 'start' | 'end' | 'center';
  /** Disable input */
  disabled?: boolean;
  className?: string;
  triggerWidth?: string;
  id?: string;
};

type Preset = {
  id: string;
  label: string;
  build: () => DateRange;
};

const PRESETS: Preset[] = [
  {
    id: 'last-7',
    label: '7 ngày qua',
    build: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    id: 'last-30',
    label: '30 ngày qua',
    build: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    id: 'last-90',
    label: '90 ngày qua',
    build: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date()),
    }),
  },
  {
    id: 'this-month',
    label: 'Tháng này',
    build: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    id: 'this-quarter',
    label: 'Quý này',
    build: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date()),
    }),
  },
  {
    id: 'this-year',
    label: 'Năm nay',
    build: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

function formatRange(from?: Date, to?: Date, placeholder?: string): string {
  if (from && to) return `${formatDate(from)} → ${formatDate(to)}`;
  if (from) return `Từ ${formatDate(from)}`;
  if (to) return `Đến ${formatDate(to)}`;
  return placeholder ?? 'Chọn khoảng ngày';
}

/**
 * Date range picker với 2-month dual calendar + Vietnamese presets.
 *
 * - Trigger: `<lucide:calendar /> {formatted range}` button
 * - Popover layout: Quick presets (left) | Calendar mode="range" (right)
 * - Locale: date-fns vi
 * - Footer: "Xóa" + "Áp dụng"
 */
export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = 'Chọn khoảng ngày',
  align = 'start',
  disabled,
  className,
  triggerWidth = 'w-full',
  id,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Local pending state — applied via "Áp dụng" or auto-applied on preset click
  const [pendingFrom, setPendingFrom] = React.useState<Date | undefined>(from);
  const [pendingTo, setPendingTo] = React.useState<Date | undefined>(to);

  // Sync external props → local state when popover re-opens
  React.useEffect(() => {
    if (open) {
      setPendingFrom(from);
      setPendingTo(to);
    }
  }, [open, from, to]);

  const handlePreset = (preset: Preset) => {
    const range = preset.build();
    setPendingFrom(range.from);
    setPendingTo(range.to);
    onChange(range);
    setOpen(false);
  };

  const handleClear = () => {
    setPendingFrom(undefined);
    setPendingTo(undefined);
    onChange({ from: undefined, to: undefined });
    setOpen(false);
  };

  const handleApply = () => {
    onChange({ from: pendingFrom, to: pendingTo });
    setOpen(false);
  };

  const triggerLabel = formatRange(from, to, placeholder);
  const hasValue = Boolean(from || to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          id={id}
          className={cn(
            'justify-start font-normal',
            triggerWidth,
            !hasValue && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="flex w-auto flex-col gap-0 p-0 sm:flex-row"
      >
        {/* Presets sidebar */}
        <div className="flex flex-col gap-1 border-b border-slate-200 p-2 sm:border-b-0 sm:border-r sm:p-3">
          <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Nhanh
          </p>
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start font-normal"
              onClick={() => handlePreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Calendar */}
        <div className="flex flex-col">
          <Calendar
            mode="range"
            locale={vi}
            numberOfMonths={2}
            selected={{ from: pendingFrom, to: pendingTo }}
            onSelect={(range) => {
              setPendingFrom(range?.from);
              setPendingTo(range?.to);
            }}
            defaultMonth={pendingFrom ?? new Date()}
          />
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-3">
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Xóa
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleApply}
              disabled={!pendingFrom && !pendingTo}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
