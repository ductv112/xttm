'use client';

// Phase 11-01 Task 3 — Cmd+K role switcher cho dev/demo.
// Trigger: Cmd+K (Mac) / Ctrl+K (Windows) global keyboard listener.
// Hiển thị: 8 mock accounts với vai trò + đơn vị, search filter.
// Chọn → switchRoleAction (server) → signOut + signIn → redirect landing page.
//
// Visibility gate: chỉ render trong dev (NODE_ENV !== 'production') hoặc với
// `?demo=1` URL param (production demo box). Mount trong AppShell.

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Shield,
  Briefcase,
  ClipboardCheck,
  Gavel,
  Building2,
  Wallet,
  Crown,
  type LucideIcon,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { HARDCODED_USERS, ORG_NAMES, ROLE_LABELS, type Role } from '@/lib/constants';
import { switchRoleAction } from './_actions/switch-role';

const ROLE_ICONS: Record<Role, LucideIcon> = {
  ADMIN: Shield,
  BANQL: Briefcase,
  CHUYENVIEN: ClipboardCheck,
  HOIDONG: Gavel,
  DONVI: Building2,
  TAICHINH: Wallet,
  LANHDAO: Crown,
};

type Props = {
  /** Username hiện tại — dùng để mark selected & filter (không hiển thị self). */
  currentUsername: string;
};

export function RoleSwitcherCmdK({ currentUsername }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  // Visibility gate: dev mode hoặc ?demo=1
  const isDev = process.env.NODE_ENV !== 'production';
  const isDemoMode = searchParams?.get('demo') === '1';
  const enabled = isDev || isDemoMode;

  // Global keyboard listener
  React.useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent): void => {
      const isCmdK =
        (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (isCmdK) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  if (!enabled) return null;

  const handleSelect = (username: string): void => {
    if (username === currentUsername) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      try {
        const result = await switchRoleAction(username);
        // result chỉ trả về khi error (success → redirect throws)
        if (result && result.ok === false) {
          toast.error(result.error);
        }
      } catch (error) {
        // NEXT_REDIRECT bubbles up — Next.js handles
        if (
          error instanceof Error &&
          (error.message.startsWith('NEXT_REDIRECT') ||
            error.message === 'NEXT_REDIRECT')
        ) {
          // expected — let Next handle
          setOpen(false);
          return;
        }
        toast.error('Không thể chuyển vai trò. Vui lòng thử lại.');
      } finally {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Chuyển vai trò (Demo)"
        description="Chọn một tài khoản để đăng nhập nhanh — chỉ dùng cho demo."
      >
        <CommandInput placeholder="Tìm theo tên, vai trò, đơn vị..." />
        <CommandList>
          <CommandEmpty>Không tìm thấy tài khoản.</CommandEmpty>
          <CommandGroup heading="Tài khoản demo (Cmd+K để mở)">
            {HARDCODED_USERS.map((user) => {
              const Icon = ROLE_ICONS[user.role as Role];
              const orgName = user.orgCode
                ? ORG_NAMES[user.orgCode as keyof typeof ORG_NAMES]
                : '—';
              const isCurrent = user.username === currentUsername;
              const searchValue = `${user.username} ${user.fullName} ${ROLE_LABELS[user.role as Role]} ${orgName}`;
              return (
                <CommandItem
                  key={user.username}
                  value={searchValue}
                  onSelect={() => handleSelect(user.username)}
                  disabled={pending || isCurrent}
                  className="flex items-center gap-3"
                >
                  <Icon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {user.fullName}
                      </span>
                      {isCurrent ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Đang đăng nhập
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {ROLE_LABELS[user.role as Role]} · {orgName}
                    </div>
                  </div>
                  <CommandShortcut>{user.username}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Lưu ý">
            <div className="px-2 py-3 text-xs text-slate-500">
              <p>
                <strong className="text-slate-700">Phím tắt:</strong> Cmd+K (Mac)
                hoặc Ctrl+K (Windows) mọi lúc để mở/đóng.
              </p>
              <p className="mt-1">
                <strong className="text-slate-700">Bảo mật:</strong> tính năng
                chỉ hoạt động trong môi trường dev hoặc với <code>?demo=1</code>.
              </p>
            </div>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default RoleSwitcherCmdK;
