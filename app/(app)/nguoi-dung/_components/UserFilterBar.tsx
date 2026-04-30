'use client';

// User filter bar — search debounce 300ms, MultiSelect roles + orgs, Select status.
// State synced with URL search params.

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FileSpreadsheet, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/shared/MultiSelect';
import { ROLE_LABELS, ROLES, type Role } from '@/lib/constants';
import { exportUsersExcel } from '../_actions/export';
import type { ListUsersFilter } from '../_actions/schemas';
import type { OrgOption } from '../_actions/list';

const DEBOUNCE_MS = 300;

const ROLE_OPTIONS = (Object.values(ROLES) as Role[]).map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Đã khóa' },
] as const;

type Props = {
  orgs: OrgOption[];
};

export function UserFilterBar({ orgs }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Local state mirrors URL — search debounced auto-pushes; selects commit immediately
  const [keyword, setKeyword] = React.useState<string>(sp.get('q') ?? '');
  const [roles, setRoles] = React.useState<string[]>(
    parseList(sp.get('roles')),
  );
  const [organizationIds, setOrganizationIds] = React.useState<string[]>(
    parseList(sp.get('orgs')),
  );
  const [status, setStatus] = React.useState<string>(sp.get('status') ?? 'all');
  const [exporting, setExporting] = React.useState(false);

  // Sync local state when URL changes externally (eg back/forward)
  React.useEffect(() => {
    setKeyword(sp.get('q') ?? '');
    setRoles(parseList(sp.get('roles')));
    setOrganizationIds(parseList(sp.get('orgs')));
    setStatus(sp.get('status') ?? 'all');
  }, [sp]);

  const orgOptions = React.useMemo(
    () => orgs.map((o) => ({ value: o.id, label: o.name })),
    [orgs],
  );

  // Debounced commit on keyword change
  const lastKeyword = React.useRef<string>(sp.get('q') ?? '');
  React.useEffect(() => {
    if (keyword === lastKeyword.current) return;
    const timer = setTimeout(() => {
      lastKeyword.current = keyword;
      pushQuery({
        q: keyword,
        roles,
        orgs: organizationIds,
        status,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Immediate commit when selects change
  const handleRolesChange = (vals: string[]) => {
    setRoles(vals);
    pushQuery({ q: keyword, roles: vals, orgs: organizationIds, status });
  };
  const handleOrgsChange = (vals: string[]) => {
    setOrganizationIds(vals);
    pushQuery({ q: keyword, roles, orgs: vals, status });
  };
  const handleStatusChange = (val: string) => {
    setStatus(val);
    pushQuery({ q: keyword, roles, orgs: organizationIds, status: val });
  };

  function pushQuery(next: {
    q: string;
    roles: string[];
    orgs: string[];
    status: string;
  }) {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set('q', next.q.trim());
    if (next.roles.length > 0) params.set('roles', next.roles.join(','));
    if (next.orgs.length > 0) params.set('orgs', next.orgs.join(','));
    if (next.status && next.status !== 'all') params.set('status', next.status);
    // Reset pagination when filters change
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleReset() {
    setKeyword('');
    setRoles([]);
    setOrganizationIds([]);
    setStatus('all');
    lastKeyword.current = '';
    router.push(pathname);
  }

  function buildFilter(): ListUsersFilter {
    return {
      keyword: keyword.trim() || undefined,
      roles: roles.length > 0 ? roles : undefined,
      organizationIds: organizationIds.length > 0 ? organizationIds : undefined,
      status:
        status === 'active' || status === 'locked' ? status : 'all',
    };
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { filename, base64, count } = await exportUsersExcel(buildFilter());
      // Decode base64 → Uint8Array → Blob → download
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
      toast.success(`Đã xuất ${count.toLocaleString('vi-VN')} bản ghi`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xuất Excel thất bại';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4">
      {/* Search keyword */}
      <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
        <Label htmlFor="user-keyword" className="text-sm">
          Tìm kiếm
        </Label>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="user-keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo họ tên, email, tên đăng nhập..."
            className="pl-8"
          />
        </div>
      </div>

      {/* Role multi-select */}
      <div className="flex w-[220px] flex-col gap-1.5">
        <Label className="text-sm">Vai trò</Label>
        <MultiSelect
          placeholder="Tất cả vai trò"
          values={roles}
          onChange={handleRolesChange}
          options={ROLE_OPTIONS}
          triggerWidth="w-[220px]"
        />
      </div>

      {/* Organization multi-select */}
      <div className="flex w-[240px] flex-col gap-1.5">
        <Label className="text-sm">Đơn vị</Label>
        <MultiSelect
          placeholder="Tất cả đơn vị"
          values={organizationIds}
          onChange={handleOrgsChange}
          options={orgOptions}
          triggerWidth="w-[240px]"
        />
      </div>

      {/* Status select */}
      <div className="flex w-[180px] flex-col gap-1.5">
        <Label className="text-sm">Trạng thái</Label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset + Export buttons */}
      <div className="flex items-end gap-2">
        <Button onClick={handleReset} variant="ghost" type="button">
          <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
          Xóa bộ lọc
        </Button>
      </div>

      <Button
        onClick={handleExport}
        variant="outline"
        type="button"
        disabled={exporting}
        className="ml-auto"
      >
        <FileSpreadsheet className="mr-1 h-4 w-4" aria-hidden="true" />
        {exporting ? 'Đang xuất...' : 'Xuất Excel'}
      </Button>
    </div>
  );
}

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
