'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
  value: string;
  label: string;
};

export type MultiSelectProps = {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  /** Trigger button label khi không chọn gì. Default: "Chọn..." */
  placeholder?: string;
  /** Search input placeholder. Default: "Tìm kiếm..." */
  searchPlaceholder?: string;
  /** Empty list message. Default: "Không tìm thấy kết quả" */
  emptyText?: string;
  /** Số badge tối đa hiển thị inline dưới trigger. 0 = không hiển thị. Default: 0 */
  maxBadgesShown?: number;
  /** Disable input */
  disabled?: boolean;
  className?: string;
  /** Width của trigger button (Tailwind class). Default: "w-full" */
  triggerWidth?: string;
  /** ID for label association */
  id?: string;
};

/**
 * Multi-select combobox với checkbox + counter badge.
 *
 * - Trigger button: `<label> (count)` khi có selection, else placeholder
 * - Popover content: Command với search + checkbox-style items
 * - Optional inline badges below trigger với X-removable (khi maxBadgesShown > 0)
 */
export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = 'Chọn...',
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy kết quả',
  maxBadgesShown = 0,
  disabled,
  className,
  triggerWidth = 'w-full',
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedSet = React.useMemo(() => new Set(values), [values]);

  const triggerLabel =
    values.length === 0 ? placeholder : `${placeholder} (${values.length})`;

  const handleToggle = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  const handleClear = () => {
    onChange([]);
  };

  const visibleBadges =
    maxBadgesShown > 0
      ? values
          .map((v) => options.find((o) => o.value === v))
          .filter((o): o is MultiSelectOption => Boolean(o))
          .slice(0, maxBadgesShown)
      : [];
  const hiddenBadgeCount = Math.max(0, values.length - visibleBadges.length);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            id={id}
            className={cn('justify-between font-normal', triggerWidth)}
          >
            <span className={cn(values.length === 0 && 'text-muted-foreground')}>
              {triggerLabel}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] min-w-[240px] p-0"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const checked = selectedSet.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleToggle(option.value)}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300',
                          checked
                            ? 'bg-blue-700 text-white'
                            : 'bg-white text-transparent'
                        )}
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {values.length > 0 ? (
                <div className="border-t border-slate-200 p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-sm"
                    onClick={handleClear}
                  >
                    Xóa tất cả lựa chọn
                  </Button>
                </div>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {visibleBadges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {visibleBadges.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span>{option.label}</span>
              <button
                type="button"
                onClick={() => handleRemove(option.value)}
                className="rounded-full p-0.5 hover:bg-slate-300"
                aria-label={`Xóa ${option.label}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
          {hiddenBadgeCount > 0 ? (
            <Badge variant="outline">+{hiddenBadgeCount}</Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default MultiSelect;
