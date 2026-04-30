// /tiep-nhan — BQL danh sách hồ sơ chờ tiếp nhận (status SUBMITTED/RESUBMITTED).
// RBAC: 'tiep-nhan' resource — BQL/CHUYENVIEN/ADMIN có read; nhưng chỉ BQL có update (receive).
// CHUYENVIEN landing page là /kiem-tra (nhưng vẫn được phép xem hàng đợi BQL).
//
// Filters từ URL searchParams (?q=&kind=&from=&to=) → list-action.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Inbox } from 'lucide-react';

import { listSubmittedProjects } from './_actions/list';
import { IntakeTable } from './_components/IntakeTable';
import { IntakeFilterBar } from './_components/IntakeFilterBar';

export const metadata = { title: 'Tiếp nhận hồ sơ' };

export default async function TiepNhanPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    kind?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const sp = await searchParams;
  const rows = await listSubmittedProjects({
    search: sp.q,
    kind: sp.kind,
    fromDate: sp.from,
    toDate: sp.to,
  });

  const submittedCount = rows.filter((r) => r.status === 'SUBMITTED').length;
  const resubmittedCount = rows.filter((r) => r.status === 'RESUBMITTED').length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Inbox className="h-6 w-6 text-blue-600" aria-hidden="true" />
            Tiếp nhận hồ sơ đề án
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ban quản lý CT XTTM tiếp nhận hồ sơ đề án mới nộp và nộp lại từ các
            đơn vị chủ trì. Sau khi tiếp nhận, hồ sơ sẽ được chuyển sang Lãnh
            đạo Ban quản lý để phân công chuyên viên kiểm tra.
          </p>
        </div>

        <div className="flex flex-shrink-0 gap-3">
          <StatPill label="Đã nộp" value={submittedCount} tone="blue" />
          <StatPill label="Nộp lại" value={resubmittedCount} tone="amber" />
        </div>
      </header>

      <div className="mb-4">
        <IntakeFilterBar />
      </div>

      <IntakeTable rows={rows} />
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
  tone: 'blue' | 'amber';
}) {
  const toneClasses =
    tone === 'blue'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <div
      className={`min-w-[120px] rounded-md border px-4 py-2 text-center ${toneClasses}`}
    >
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
