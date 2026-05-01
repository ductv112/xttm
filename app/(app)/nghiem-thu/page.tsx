// /nghiem-thu — BQL hàng đợi nghiệm thu + thanh lý.
// 2 trạng thái: PENDING (chờ lập biên bản) | AWAITING_LIQUIDATION (chờ thanh lý HĐ).
// Click row → /de-an/[id]#nghiem-thu.

import { redirect } from 'next/navigation';
import { PackageCheck } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listAcceptanceQueue } from './_actions/list';
import { AcceptanceQueueTable } from './_components/AcceptanceQueueTable';

export const metadata = { title: 'Nghiệm thu chờ xử lý' };

export default async function NghiemThuPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (role !== 'BANQL' && role !== 'ADMIN') {
    redirect(defaultLandingPath(role));
  }
  if (!(await canFromDB(role, 'nghiem-thu', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const rows = await listAcceptanceQueue();
  const pendingCount = rows.filter((r) => r.state === 'PENDING').length;
  const liquidationCount = rows.filter(
    (r) => r.state === 'AWAITING_LIQUIDATION',
  ).length;
  const overdueCount = rows.filter((r) => r.daysWaiting >= 14).length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <PackageCheck
              className="h-6 w-6 text-blue-600"
              aria-hidden="true"
            />
            Nghiệm thu chờ xử lý
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Đề án đã có báo cáo kết quả được duyệt — Ban quản lý lập biên bản
            nghiệm thu, sau đó thanh lý hợp đồng. Click vào dòng để xem chi
            tiết và xử lý từng bước.
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-3">
          <StatPill
            label="Chờ biên bản"
            value={pendingCount}
            tone="amber"
          />
          <StatPill
            label="Chờ thanh lý"
            value={liquidationCount}
            tone="blue"
          />
          {overdueCount > 0 ? (
            <StatPill label="Quá 14 ngày" value={overdueCount} tone="red" />
          ) : null}
        </div>
      </header>

      <AcceptanceQueueTable rows={rows} />
    </main>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'blue' | 'red';
}) {
  const map: Record<typeof tone, string> = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div
      className={`min-w-[120px] rounded-md border px-4 py-2 text-center ${map[tone]}`}
    >
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
