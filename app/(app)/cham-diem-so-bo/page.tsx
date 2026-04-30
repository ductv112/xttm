// /cham-diem-so-bo — chuyên viên list các hồ sơ VALID chờ chấm điểm sơ bộ.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listValidProjects } from './_actions/list-valid';
import { ScoringQueueTable } from './_components/ScoringQueueTable';

export const metadata = { title: 'Chấm điểm sơ bộ' };

export default async function ChamDiemSoBoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const rows = await listValidProjects();

  const draftCount = rows.filter((r) => r.scoreSheetStatus === 'DRAFT').length;
  const submittedCount = rows.filter(
    (r) => r.scoreSheetStatus === 'SUBMITTED',
  ).length;
  const todoCount = rows.filter((r) => r.scoreSheetStatus === null).length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Chấm điểm sơ bộ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sau khi xác nhận hồ sơ hợp lệ, chuyên viên kiểm tra chấm điểm sơ bộ
            theo bộ tiêu chí của chu kỳ chương trình. Phiếu chấm sẽ được gửi tới
            Hội đồng thẩm định ở giai đoạn sau.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatPill label="Chưa chấm" value={todoCount} tone="slate" />
          <StatPill label="Đang chấm" value={draftCount} tone="amber" />
          <StatPill label="Đã nộp" value={submittedCount} tone="green" />
        </div>
      </header>

      <ScoringQueueTable rows={rows} />
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
  tone: 'slate' | 'amber' | 'green';
}) {
  const map: Record<typeof tone, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
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
