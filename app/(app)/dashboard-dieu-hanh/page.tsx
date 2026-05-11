import { redirect } from 'next/navigation';
import { Gauge } from 'lucide-react';

import { auth } from '@/lib/auth';
import { ROLES, type Role } from '@/lib/constants';

import { DashboardClient } from './_components/DashboardClient';

export const metadata = { title: 'Dashboard điều hành' };

const ALLOWED_ROLES: Role[] = [ROLES.ADMIN, ROLES.BANQL, ROLES.LANHDAO];

export default async function DashboardDieuHanhPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role as Role;
  if (!ALLOWED_ROLES.includes(role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white px-6 py-4 shadow-md relative overflow-hidden">
        <Gauge
          className="absolute -right-4 -bottom-6 h-28 w-28 text-amber-300/10"
          strokeWidth={1}
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-300/40 text-amber-300 shrink-0">
              <Gauge className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
                Dashboard điều hành
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                Tổng hợp chỉ tiêu Kết quả & Hiệu quả XTTM
              </h1>
            </div>
          </div>
          <div className="flex items-baseline gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-slate-400">
                Chu kỳ
              </p>
              <p className="text-2xl font-bold text-amber-300 leading-tight">2026</p>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Cập nhật 11/05/2026
            </span>
          </div>
        </div>
      </div>

      <DashboardClient />
    </div>
  );
}
