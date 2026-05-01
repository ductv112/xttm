// /bao-cao — BQL hàng đợi báo cáo kết quả chờ duyệt (status SUBMITTED).
// RBAC: BANQL/ADMIN. Click row → /de-an/[id]#bao-cao mở tab xử lý.

import { redirect } from 'next/navigation';
import { FileCheck2 } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listReportsForReview } from './_actions/list';
import { ReportReviewQueueTable } from './_components/ReportReviewQueueTable';

export const metadata = { title: 'Báo cáo chờ duyệt' };

export default async function BaoCaoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (role !== 'BANQL' && role !== 'ADMIN') {
    redirect(defaultLandingPath(role));
  }
  if (!(await canFromDB(role, 'bao-cao', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const rows = await listReportsForReview();
  const overdueCount = rows.filter((r) => r.daysWaiting >= 7).length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <FileCheck2 className="h-6 w-6 text-blue-600" aria-hidden="true" />
            Báo cáo kết quả chờ duyệt
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Đơn vị chủ trì đã nộp báo cáo kết quả triển khai đề án. Click vào
            dòng để xem chi tiết và quyết định duyệt hoặc trả bổ sung.
          </p>
        </div>

        <div className="flex flex-shrink-0 gap-3">
          <StatPill label="Đang chờ" value={rows.length} tone="blue" />
          {overdueCount > 0 ? (
            <StatPill label="Quá 7 ngày" value={overdueCount} tone="red" />
          ) : null}
        </div>
      </header>

      <ReportReviewQueueTable rows={rows} />
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
  tone: 'blue' | 'red';
}) {
  const map: Record<typeof tone, string> = {
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
