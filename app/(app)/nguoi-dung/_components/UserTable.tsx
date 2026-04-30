'use client';

// User DataTable — wraps shared DataTable with TanStack Query, row actions, bulk actions.

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Lock,
  MoreVertical,
  Pencil,
  ShieldCheck,
  Unlock,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DataTable,
  type ColumnDef,
  type RowSelectionState,
  type BulkAction,
} from '@/components/shared/data-table';
import {
  ConfirmDialog,
  useConfirmDialog,
} from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/constants';
import {
  listUsers,
  type ListUsersResult,
  type UserListRow,
  type OrgOption,
} from '../_actions/list';
import {
  bulkChangeRole,
  bulkLockUsers,
  bulkUnlockUsers,
  lockUser,
  unlockUser,
} from '../_actions/lock';
import type { ListUsersFilter } from '../_actions/schemas';
import { ResetPasswordDialog } from './ResetPasswordDialog';

const PAGE_SIZE = 20;

type Props = {
  initialFilter: ListUsersFilter;
  initialPageIndex: number;
  initialData: ListUsersResult;
  orgs: OrgOption[];
  currentUserId: string;
};

export function UserTable({
  initialFilter,
  initialPageIndex,
  initialData,
  currentUserId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qc = useQueryClient();

  const pageIndex = Math.max(0, Number(sp.get('page') ?? '0') || 0);

  const filter: ListUsersFilter = React.useMemo(
    () => ({
      keyword: sp.get('q') || undefined,
      roles: parseList(sp.get('roles')),
      organizationIds: parseList(sp.get('orgs')),
      status:
        sp.get('status') === 'active' || sp.get('status') === 'locked'
          ? (sp.get('status') as 'active' | 'locked')
          : 'all',
    }),
    [sp],
  );

  const isInitial =
    pageIndex === initialPageIndex &&
    JSON.stringify(filter) === JSON.stringify(initialFilter);

  const { data, isFetching, isError, error } = useQuery<ListUsersResult>({
    queryKey: ['users', filter, pageIndex],
    queryFn: () => listUsers(filter, pageIndex, PAGE_SIZE),
    placeholderData: keepPreviousData,
    initialData: isInitial ? initialData : undefined,
    staleTime: 15_000,
  });

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [resetTarget, setResetTarget] = React.useState<UserListRow | null>(null);
  const { confirm, dialog: confirmDialogElement } = useConfirmDialog();

  const handlePageChange = React.useCallback(
    (next: number) => {
      const params = new URLSearchParams(sp.toString());
      if (next <= 0) params.delete('page');
      else params.set('page', String(next));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, sp],
  );

  const invalidateUsers = React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['users'] });
  }, [qc]);

  const handleLock = React.useCallback(
    async (row: UserListRow) => {
      const ok = await confirm({
        title: 'Khóa tài khoản',
        description: `Khóa tài khoản "${row.fullName}" (@${row.username})? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.`,
        confirmLabel: 'Khóa',
        variant: 'destructive',
      });
      if (!ok) return;
      try {
        await lockUser(row.id);
        toast.success(`Đã khóa tài khoản ${row.fullName}`);
        invalidateUsers();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Khóa tài khoản thất bại');
      }
    },
    [confirm, invalidateUsers],
  );

  const handleUnlock = React.useCallback(
    async (row: UserListRow) => {
      try {
        await unlockUser(row.id);
        toast.success(`Đã mở khóa tài khoản ${row.fullName}`);
        invalidateUsers();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Mở khóa thất bại');
      }
    },
    [invalidateUsers],
  );

  const columns = React.useMemo<ColumnDef<UserListRow, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Người dùng',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900">
              {row.original.fullName}
            </div>
            <div className="text-xs text-slate-500">@{row.original.username}</div>
          </div>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.email ?? '—'}
          </span>
        ),
      },
      {
        id: 'role',
        header: 'Vai trò',
        cell: ({ row }) => {
          const role = row.original.role as Role;
          const label = ROLE_LABELS[role] ?? role;
          const isAdmin = role === ROLES.ADMIN;
          return (
            <Badge
              variant="outline"
              className={cn(
                'font-normal',
                isAdmin
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700',
              )}
            >
              {label}
            </Badge>
          );
        },
      },
      {
        id: 'organization',
        header: 'Đơn vị',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.organization?.name ?? '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          if (row.original.isActive) {
            return (
              <Badge className="border-green-200 bg-green-100 font-normal text-green-800 hover:bg-green-100">
                Đang hoạt động
              </Badge>
            );
          }
          return (
            <Badge className="border-red-200 bg-red-100 font-normal text-red-800 hover:bg-red-100">
              Đã khóa
            </Badge>
          );
        },
      },
      {
        id: 'createdAt',
        header: 'Ngày tạo',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <UserRowActions
            row={row.original}
            currentUserId={currentUserId}
            onEdit={() => router.push(`/nguoi-dung/${row.original.id}/edit`)}
            onResetPassword={() => setResetTarget(row.original)}
            onLock={() => handleLock(row.original)}
            onUnlock={() => handleUnlock(row.original)}
          />
        ),
      },
    ],
    [router, currentUserId, handleLock, handleUnlock],
  );

  const bulkActions = React.useMemo<BulkAction<UserListRow>[]>(() => {
    return [
      {
        id: 'lock',
        label: 'Khóa',
        icon: <Lock className="h-4 w-4" aria-hidden="true" />,
        variant: 'destructive',
        requireConfirm: {
          title: 'Khóa tài khoản đã chọn',
          description:
            'Các tài khoản được chọn sẽ bị khóa và không thể đăng nhập. Tài khoản của bạn sẽ tự động được loại trừ.',
          confirmLabel: 'Khóa',
        },
        onClick: async (selected) => {
          try {
            const ids = selected.map((s) => s.id);
            const result = await bulkLockUsers(ids);
            const skippedSelf = result.skipped.length > 0;
            const successCount = result.succeeded.length;
            const failCount = result.failed.length;
            if (successCount > 0) {
              toast.success(
                `Đã khóa ${successCount} tài khoản${skippedSelf ? ' (bỏ qua tài khoản của bạn)' : ''}`,
              );
            } else if (skippedSelf && failCount === 0) {
              toast.info('Không thể khóa tài khoản của chính mình');
            }
            if (failCount > 0) {
              toast.error(`${failCount} tài khoản không thể khóa`);
            }
            setRowSelection({});
            invalidateUsers();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Khóa hàng loạt thất bại');
          }
        },
      },
      {
        id: 'unlock',
        label: 'Mở khóa',
        icon: <Unlock className="h-4 w-4" aria-hidden="true" />,
        requireConfirm: {
          title: 'Mở khóa tài khoản đã chọn',
          description:
            'Các tài khoản được chọn sẽ được kích hoạt lại và có thể đăng nhập.',
          confirmLabel: 'Mở khóa',
        },
        onClick: async (selected) => {
          try {
            const ids = selected.map((s) => s.id);
            const result = await bulkUnlockUsers(ids);
            const successCount = result.succeeded.length;
            const failCount = result.failed.length;
            if (successCount > 0) {
              toast.success(`Đã mở khóa ${successCount} tài khoản`);
            }
            if (failCount > 0) {
              toast.error(`${failCount} tài khoản không thể mở khóa`);
            }
            setRowSelection({});
            invalidateUsers();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Mở khóa hàng loạt thất bại');
          }
        },
      },
      {
        id: 'change-role',
        label: 'Đổi vai trò',
        icon: <UserCog className="h-4 w-4" aria-hidden="true" />,
        // No requireConfirm — popover collects role then commits
        onClick: async () => {
          // No-op: handled by custom toolbar slot below via BulkChangeRolePopover
          // Placeholder kept so DataTable shows the action button.
        },
      },
    ];
  }, [invalidateUsers]);

  // Custom rendering: replace the "Đổi vai trò" action with a popover trigger
  // for clean UX. We achieve this by rendering a parallel sticky toolbar above
  // the table when there is a selection, OR we use bulk actions as-is and
  // intercept the click via a separate component. For simplicity, we expose
  // a sticky inline toolbar with the role popover when selection > 0.
  const selectedIds = React.useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection],
  );

  const handleBulkChangeRole = React.useCallback(
    async (newRole: string) => {
      try {
        const result = await bulkChangeRole(selectedIds, newRole);
        const successCount = result.succeeded.length;
        const skippedSelf = result.skipped.length > 0;
        const failCount = result.failed.length;
        if (successCount > 0) {
          toast.success(
            `Đã đổi vai trò cho ${successCount} tài khoản${skippedSelf ? ' (bỏ qua tài khoản của bạn)' : ''}`,
          );
        } else if (skippedSelf && failCount === 0) {
          toast.info('Không thể đổi vai trò của chính mình');
        }
        if (failCount > 0) {
          toast.error(`${failCount} tài khoản không thể đổi vai trò`);
        }
        setRowSelection({});
        invalidateUsers();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Đổi vai trò hàng loạt thất bại',
        );
      }
    },
    [selectedIds, invalidateUsers],
  );

  // Inject a "Đổi vai trò" popover as the third bulk action's onClick replacement
  // by overriding it just-in-time using the closure above
  const bulkActionsWithRoleHandler = React.useMemo<BulkAction<UserListRow>[]>(
    () =>
      bulkActions.map((a) =>
        a.id === 'change-role'
          ? {
              ...a,
              // Render inside button — we use a custom "popover wrapping" via
              // custom onClick that opens the popover programmatically. The
              // simpler approach: since shared bulk action toolbar doesn't
              // support custom render slots, we render a parallel popover next
              // to the bulk toolbar instead. So this onClick stays a no-op,
              // but we keep label/icon for visual consistency.
              onClick: async () => {
                // The popover trigger is rendered separately below
                // (see BulkChangeRoleFloatingPopover). Click on this bulk
                // action button is a fallback that does nothing — UX is
                // primary via the floating popover trigger.
              },
            }
          : a,
      ),
    [bulkActions],
  );

  if (isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">
          Đã xảy ra lỗi khi tải danh sách:{' '}
          {error instanceof Error ? error.message : 'Vui lòng thử lại'}
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable<UserListRow>
        columns={columns}
        data={data?.rows ?? []}
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={(next) => handlePageChange(next)}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
        isLoading={isFetching && !data}
        bulkActions={bulkActionsWithRoleHandler}
        emptyState={{
          icon: 'users',
          heading: 'Chưa có người dùng',
          description: 'Tạo người dùng đầu tiên để bắt đầu',
          action: { label: 'Tạo người dùng', href: '/nguoi-dung/new' },
        }}
      />

      {/* Floating role-change popover — appears alongside the bulk toolbar */}
      {selectedIds.length > 0 ? (
        <BulkChangeRoleFloatingPopover onPick={handleBulkChangeRole} />
      ) : null}

      {confirmDialogElement}

      <ResetPasswordDialog
        open={resetTarget !== null}
        onOpenChange={(o) => !o && setResetTarget(null)}
        userId={resetTarget?.id ?? null}
        userFullName={resetTarget?.fullName}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Per-row actions dropdown
// ---------------------------------------------------------------------------

type UserRowActionsProps = {
  row: UserListRow;
  currentUserId: string;
  onEdit: () => void;
  onResetPassword: () => void;
  onLock: () => void;
  onUnlock: () => void;
};

function UserRowActions({
  row,
  currentUserId,
  onEdit,
  onResetPassword,
  onLock,
  onUnlock,
}: UserRowActionsProps) {
  const isSelf = row.id === currentUserId;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Hành động cho ${row.fullName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
          Chỉnh sửa
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onResetPassword}>
          <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
          Reset mật khẩu
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {row.isActive ? (
          <DropdownMenuItem
            onSelect={onLock}
            disabled={isSelf}
            className="text-red-600 focus:text-red-700"
          >
            <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
            Khóa tài khoản
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onUnlock}>
            <Unlock className="mr-2 h-4 w-4" aria-hidden="true" />
            Mở khóa tài khoản
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Bulk role change floating popover
// ---------------------------------------------------------------------------

function BulkChangeRoleFloatingPopover({
  onPick,
}: {
  onPick: (role: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<string>('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleApply = () => {
    if (!role) {
      return;
    }
    setOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    await onPick(role);
    setConfirmOpen(false);
    setRole('');
  };

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2"
        // Position above the DataTableBulkActions toolbar (z-50 in shared)
        // Trick: small offset to avoid overlap, with click-through except on trigger
      >
        <div className="pointer-events-auto -translate-y-14">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white shadow-md"
              >
                <ShieldCheck className="mr-1 h-4 w-4" aria-hidden="true" />
                Đổi vai trò
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[260px]">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Chọn vai trò mới
                  </p>
                  <p className="text-xs text-slate-500">
                    Áp dụng cho tất cả tài khoản đang chọn
                  </p>
                </div>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Chọn vai trò --" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.values(ROLES) as Role[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApply}
                    disabled={!role}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận đổi vai trò"
        description={`Đổi vai trò của các tài khoản được chọn sang "${ROLE_LABELS[role as Role] ?? role}"? Tài khoản của bạn sẽ tự động được loại trừ.`}
        confirmLabel="Đổi vai trò"
        onConfirm={handleConfirm}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseList(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return arr.length === 0 ? undefined : arr;
}
