'use client';

import * as React from 'react';
import { ChevronDown, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';

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
  const usernameInput = document.getElementById('username') as HTMLInputElement | null;
  const passwordInput = document.getElementById('password') as HTMLInputElement | null;
  if (!usernameInput || !passwordInput) {
    toast.error('Không tìm thấy form đăng nhập');
    return;
  }

  // Use native input setter so React picks up the change
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
  toast.success(`Đã điền tài khoản: ${account.role}`, {
    description: `${account.username} • ${account.org}`,
    duration: 2000,
  });
}

export function DemoAccountsHelper() {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="mt-6 rounded-lg border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-200/60 p-1.5">
            <Users className="h-4 w-4 text-amber-800" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-amber-900">
              Tài khoản demo (POC)
            </span>
            <span className="text-xs text-amber-800/80">
              Click để điền nhanh thông tin đăng nhập
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-amber-800 transition-transform',
            open ? 'rotate-180' : '',
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="border-t border-amber-200/70 max-h-[320px] overflow-y-auto">
          <ul className="divide-y divide-amber-100">
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.username}>
                <button
                  type="button"
                  onClick={() => fillLoginForm(acc)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50 focus-visible:outline-none focus-visible:bg-amber-50 transition-colors group"
                  title={`Click để đăng nhập với ${acc.role}`}
                >
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ring-1 shrink-0',
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
                  <Copy
                    className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
