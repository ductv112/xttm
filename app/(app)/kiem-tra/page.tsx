// /kiem-tra — Chuyên viên kiểm tra hồ sơ (entity-aware list).
// RBAC: 'tiep-nhan:read'. Filter assignedReviewerId === session.user.id.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listMyAssignedProjects } from './_actions/list-mine';
import { ReviewQueueTable } from './_components/ReviewQueueTable';

export const metadata = { title: 'Kiểm tra hồ sơ' };

export default async function KiemTraPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const rows = await listMyAssignedProjects();

  const inReviewCount = rows.filter((r) => r.status === 'IN_REVIEW').length;
  const supplementCount = rows.filter(
    (r) => r.status === 'SUPPLEMENT_REQUIRED',
  ).length;
  const validCount = rows.filter((r) => r.status === 'VALID').length;
  const overdueCount = rows.filter((r) => r.isOverdue).length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Kiểm tra hồ sơ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Danh sách hồ sơ đề án được giao cho bạn kiểm tra hành chính. Click
            vào dòng để xem chi tiết và đánh dấu checklist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatPill
            label="Đang kiểm tra"
            value={inReviewCount}
            tone="blue"
          />
          <StatPill
            label="Đợi bổ sung"
            value={supplementCount}
            tone="amber"
          />
          <StatPill label="Hợp lệ" value={validCount} tone="green" />
          {overdueCount > 0 ? (
            <StatPill label="Quá hạn" value={overdueCount} tone="red" />
          ) : null}
        </div>
      </header>

      <ReviewQueueTable rows={rows} />
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
  tone: 'blue' | 'amber' | 'green' | 'red';
}) {
  const map: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
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
