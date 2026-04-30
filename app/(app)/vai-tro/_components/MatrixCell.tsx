'use client';

// Single permission cell. Optimistic UI: tick checkbox → flip ngay → server
// action grant/revoke async; nếu fail → rollback + toast error.
//
// Disabled khi:
// - roleCode === 'ADMIN' (T-02-05-02 — admin bị bảo vệ ngay UI level)
// - mutation đang in-flight (prevent double-click)

import * as React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/constants';

import { grantPermission } from '../_actions/grant';
import type { GrantPermissionInput } from '../_actions/schemas';

export type MatrixActionKey =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'submit'
  | 'approve'
  | 'assign'
  | 'score';

export type MatrixCellProps = {
  roleCode: string;
  resource: string;
  action: MatrixActionKey;
  granted: boolean;
};

export function MatrixCell({
  roleCode,
  resource,
  action,
  granted,
}: MatrixCellProps) {
  const queryClient = useQueryClient();

  // Local optimistic state — flip ngay khi click; reset từ prop nếu invalidation
  // mang state mới về (đã commit DB).
  const [optimisticGranted, setOptimisticGranted] = React.useState(granted);
  const [errorFlash, setErrorFlash] = React.useState(false);
  React.useEffect(() => {
    setOptimisticGranted(granted);
  }, [granted]);

  const isAdmin = roleCode === ROLES.ADMIN;

  const mutation = useMutation({
    mutationFn: async (input: GrantPermissionInput) => grantPermission(input),
    onMutate: async (input) => {
      // Optimistic flip
      setOptimisticGranted(input.granted);
      return { previous: granted };
    },
    onError: (err, _input, ctx) => {
      // Rollback
      setOptimisticGranted(ctx?.previous ?? granted);
      setErrorFlash(true);
      window.setTimeout(() => setErrorFlash(false), 600);
      const message = err instanceof Error ? err.message : 'Thao tác thất bại';
      toast.error(message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['matrix'] });
    },
  });

  const handleClick = () => {
    if (mutation.isPending || isAdmin) return;
    const next = !optimisticGranted;
    mutation.mutate({ roleCode, resource, action, granted: next });
  };

  const title = isAdmin
    ? 'Quản trị viên hệ thống luôn có toàn quyền'
    : optimisticGranted
      ? 'Đã cấp — bấm để thu hồi'
      : 'Chưa cấp — bấm để cấp';

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={optimisticGranted}
      disabled={isAdmin || mutation.isPending}
      onClick={handleClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
        optimisticGranted
          ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'border-slate-200 bg-white text-slate-300 hover:bg-slate-50',
        mutation.isPending && 'animate-pulse',
        errorFlash && 'border-red-500 ring-2 ring-red-200',
        isAdmin && 'cursor-not-allowed opacity-70',
      )}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : optimisticGranted ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <X className="h-3 w-3 opacity-30" aria-hidden="true" />
      )}
    </button>
  );
}
