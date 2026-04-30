'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Download,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCES,
  AUDIT_RESOURCE_LABELS,
  type AuditAction,
  type AuditResource,
} from '@/lib/audit-types';
import { HARDCODED_USERS, ROLE_LABELS, type Role } from '@/lib/constants';
import { exportAuditLogsCSV } from '../_actions/export';
import type { AuditFilter } from '../_actions/types';

// HARDCODED_USERS as combobox source until Plan 02-04 ships loadUsers server action.
// Each user.id matches DB seed cuid (resolved in server filter via `username`-derived match).
// For now, filter combobox passes username → server expands; simpler: pass null until
// loadUsers ready. Plan 02-04 TODO: replace with server-side loadUsers.
type UserOption = { id: string; label: string; username: string };

const USER_OPTIONS: UserOption[] = HARDCODED_USERS.map((u) => ({
  id: u.username, // placeholder — Plan 02-04 will replace with real DB id
  username: u.username,
  label: `${u.fullName} · ${ROLE_LABELS[u.role as Role]}`,
}));

export function AuditLogFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Local state mirrors URL — committed to URL on "Áp dụng"
  const [userId, setUserId] = React.useState<string>(sp.get('userId') ?? '');
  const [resources, setResources] = React.useState<AuditResource[]>(
    parseList<AuditResource>(sp.get('resources'), AUDIT_RESOURCES),
  );
  const [actions, setActions] = React.useState<AuditAction[]>(
    parseList<AuditAction>(sp.get('actions'), AUDIT_ACTIONS),
  );
  const [from, setFrom] = React.useState<Date | undefined>(parseDate(sp.get('from')));
  const [to, setTo] = React.useState<Date | undefined>(parseDate(sp.get('to')));
  const [keyword, setKeyword] = React.useState<string>(sp.get('q') ?? '');
  const [exporting, setExporting] = React.useState(false);

  // Sync local state if URL changes externally (eg back/forward navigation)
  React.useEffect(() => {
    setUserId(sp.get('userId') ?? '');
    setResources(parseList<AuditResource>(sp.get('resources'), AUDIT_RESOURCES));
    setActions(parseList<AuditAction>(sp.get('actions'), AUDIT_ACTIONS));
    setFrom(parseDate(sp.get('from')));
    setTo(parseDate(sp.get('to')));
    setKeyword(sp.get('q') ?? '');
  }, [sp]);

  function commit() {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (resources.length > 0) params.set('resources', resources.join(','));
    if (actions.length > 0) params.set('actions', actions.join(','));
    if (from) params.set('from', toISODate(from));
    if (to) params.set('to', toISODate(to));
    if (keyword.trim()) params.set('q', keyword.trim());
    params.delete('page'); // reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    setUserId('');
    setResources([]);
    setActions([]);
    setFrom(undefined);
    setTo(undefined);
    setKeyword('');
    router.push(pathname);
  }

  function buildFilter(): AuditFilter {
    return {
      userId: userId || undefined,
      resources: resources.length > 0 ? resources : undefined,
      actions: actions.length > 0 ? actions : undefined,
      from: from ? toISODate(from) : undefined,
      to: to ? toISODate(to) : undefined,
      keyword: keyword.trim() || undefined,
    };
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { filename, csv, count } = await exportAuditLogsCSV(buildFilter());
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${count.toLocaleString('vi-VN')} bản ghi`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xuất CSV thất bại';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4">
      {/* User combobox */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Người dùng</Label>
        <UserCombobox value={userId} onChange={setUserId} options={USER_OPTIONS} />
      </div>

      {/* Resource multi-select */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Phân hệ</Label>
        <MultiSelect
          placeholder="Tất cả phân hệ"
          values={resources}
          onChange={(v) => setResources(v as AuditResource[])}
          options={AUDIT_RESOURCES.map((r) => ({
            value: r,
            label: AUDIT_RESOURCE_LABELS[r],
          }))}
        />
      </div>

      {/* Action multi-select */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Hành động</Label>
        <MultiSelect
          placeholder="Tất cả hành động"
          values={actions}
          onChange={(v) => setActions(v as AuditAction[])}
          options={AUDIT_ACTIONS.map((a) => ({
            value: a,
            label: AUDIT_ACTION_LABELS[a],
          }))}
        />
      </div>

      {/* Date range */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Từ ngày</Label>
        <DatePicker value={from} onChange={setFrom} placeholder="Từ ngày" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Đến ngày</Label>
        <DatePicker value={to} onChange={setTo} placeholder="Đến ngày" />
      </div>

      {/* Keyword */}
      <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
        <Label htmlFor="audit-keyword" className="text-sm">
          Từ khóa
        </Label>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="audit-keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên người dùng hoặc ID đối tượng"
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-end gap-2">
        <Button onClick={commit} variant="default">
          Áp dụng
        </Button>
        <Button onClick={reset} variant="ghost">
          <RotateCcw className="h-4 w-4 mr-1" />
          Xóa bộ lọc
        </Button>
      </div>

      <Button
        onClick={handleExport}
        variant="outline"
        className="ml-auto"
        disabled={exporting}
      >
        <Download className="h-4 w-4 mr-1" />
        {exporting ? 'Đang xuất...' : 'Xuất CSV'}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (will refactor to shared in Plan 02-03)
// ---------------------------------------------------------------------------

function UserCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: UserOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[220px] justify-between font-normal"
        >
          <span className="truncate">
            {selected ? selected.label : 'Tất cả người dùng'}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm người dùng..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === '' ? 'opacity-100' : 'opacity-0',
                  )}
                />
                Tất cả người dùng
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === o.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function MultiSelect({
  values,
  onChange,
  options,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);

  function toggle(v: string) {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[220px] justify-between font-normal"
        >
          {values.length === 0 ? (
            <span className="truncate text-slate-500">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1 max-w-[170px] overflow-hidden">
              <Badge variant="secondary" className="font-normal">
                {values.length} đã chọn
              </Badge>
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm..." />
          <CommandList>
            <CommandEmpty>Không có lựa chọn</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => toggle(o.value)}
                >
                  <Checkbox
                    checked={values.includes(o.value)}
                    className="mr-2"
                    aria-hidden
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {values.length > 0 && (
              <div className="border-t p-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onChange([])}
                >
                  <X className="h-3 w-3 mr-1" />
                  Bỏ chọn tất cả
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[160px] justify-start font-normal',
            !value && 'text-slate-500',
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {value ? format(value, 'dd/MM/yyyy', { locale: vi }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const set = new Set(allowed as readonly string[]);
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => set.has(s));
}

function parseDate(raw: string | null): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}
