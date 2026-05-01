'use client';

import * as React from 'react';
import { Copy, KeyRound, LogIn, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type DemoAccount = {
  username: string;
  password: string;
  role: string;
  org: string;
  badge: string;
  badgeTone: 'navy' | 'amber' | 'emerald' | 'slate';
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'admin',
    password: 'Admin@123',
    role: 'Quản trị viên',
    org: 'Toàn quyền hệ thống',
    badge: 'ADMIN',
    badgeTone: 'navy',
  },
  {
    username: 'banql',
    password: 'Banql@123',
    role: 'Ban quản lý CT XTTM',
    org: 'Cục Xúc tiến Thương mại',
    badge: 'BANQL',
    badgeTone: 'navy',
  },
  {
    username: 'chuyenvien',
    password: 'Cv@123',
    role: 'Chuyên viên kiểm tra',
    org: 'Cục Xúc tiến Thương mại',
    badge: 'CHUYÊN VIÊN',
    badgeTone: 'emerald',
  },
  {
    username: 'hoidong',
    password: 'Hd@123',
    role: 'Hội đồng thẩm định',
    org: 'Hội đồng năm hiện tại',
    badge: 'HỘI ĐỒNG',
    badgeTone: 'amber',
  },
  {
    username: 'donvi1',
    password: 'Donvi@123',
    role: 'Đơn vị chủ trì',
    org: 'Hiệp hội Da giày VN (LEFASO)',
    badge: 'ĐƠN VỊ',
    badgeTone: 'slate',
  },
  {
    username: 'donvi2',
    password: 'Donvi@123',
    role: 'Đơn vị chủ trì',
    org: 'Hiệp hội Dệt may VN (VITAS)',
    badge: 'ĐƠN VỊ',
    badgeTone: 'slate',
  },
  {
    username: 'taichinh',
    password: 'Tc@123',
    role: 'Tài chính',
    org: 'Cục Xúc tiến Thương mại',
    badge: 'TÀI CHÍNH',
    badgeTone: 'emerald',
  },
  {
    username: 'lanhdao',
    password: 'Ld@123',
    role: 'Lãnh đạo',
    org: 'Bộ Công Thương',
    badge: 'LÃNH ĐẠO',
    badgeTone: 'amber',
  },
];

const BADGE_TONES: Record<DemoAccount['badgeTone'], string> = {
  navy: 'bg-blue-100 text-blue-800 ring-blue-200',
  amber: 'bg-amber-100 text-amber-900 ring-amber-200',
  emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

function fillLoginForm(account: DemoAccount) {
  const usernameInput = document.getElementById(
    'username',
  ) as HTMLInputElement | null;
  const passwordInput = document.getElementById(
    'password',
  ) as HTMLInputElement | null;
  if (!usernameInput || !passwordInput) {
    toast.error('Không tìm thấy form đăng nhập');
    return false;
  }

  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  if (setter) {
    setter.call(usernameInput, account.username);
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(passwordInput, account.password);
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    usernameInput.value = account.username;
    passwordInput.value = account.password;
  }

  usernameInput.focus();
  return true;
}

async function copyAccountToClipboard(account: DemoAccount) {
  const text = `${account.username} / ${account.password}`;
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào clipboard', {
      description: text,
      duration: 2000,
    });
  } catch {
    toast.error('Không thể sao chép — vui lòng nhập tay');
  }
}

export function DemoAccountsHelper() {
  const [open, setOpen] = React.useState(false);

  const handleFill = (account: DemoAccount) => {
    const ok = fillLoginForm(account);
    if (ok) {
      toast.success(`Đã điền tài khoản: ${account.role}`, {
        description: `${account.username} • ${account.org}`,
        duration: 2000,
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full mt-3 border-amber-300 bg-amber-50/60 text-amber-900 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-400"
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          Xem tài khoản demo (POC)
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="border-b border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-6">
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Users className="h-5 w-5" aria-hidden="true" />
            Tài khoản demo POC
          </DialogTitle>
          <DialogDescription className="text-amber-800/80">
            Hệ thống có 8 tài khoản hardcoded cho demo. Click{' '}
            <strong>&quot;Điền form&quot;</strong> để đăng nhập nhanh, hoặc{' '}
            <strong>&quot;Sao chép&quot;</strong> để copy thông tin vào
            clipboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-slate-100">
            {DEMO_ACCOUNTS.map((acc) => (
              <li
                key={acc.username}
                className="flex items-center gap-3 px-6 py-3 hover:bg-amber-50/50 transition-colors"
              >
                <span
                  className={cn(
                    'inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ring-1 shrink-0 min-w-[88px]',
                    BADGE_TONES[acc.badgeTone],
                  )}
                >
                  {acc.badge}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-900 font-mono">
                      {acc.username}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      / {acc.password}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {acc.role} · {acc.org}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAccountToClipboard(acc)}
                    className="h-8 px-2 text-slate-600 hover:text-slate-900"
                    title="Sao chép username / password"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs">Sao chép</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleFill(acc)}
                    className="h-8 px-2 bg-blue-700 hover:bg-blue-800 text-white"
                    title="Điền vào form đăng nhập"
                  >
                    <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs">Điền form</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/60">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <KeyRound className="h-3 w-3" aria-hidden="true" />
            Mật khẩu đã hash bcrypt cost 10. Tài khoản demo này sẽ bị xóa khi
            triển khai production.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
