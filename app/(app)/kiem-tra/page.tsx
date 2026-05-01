// /kiem-tra — Chuyên viên: hàng đợi việc kiểm tra hành chính + chấm điểm sơ bộ.
// 2 tab gộp lại (trước đây là /kiem-tra + /cham-diem-so-bo riêng):
//   - Kiểm tra hành chính: status IN_REVIEW/SUPPLEMENT_REQUIRED/VALID (giai đoạn checklist).
//   - Chấm điểm sơ bộ: status VALID (giai đoạn cho điểm theo bộ tiêu chí).
// Cả 2 đều filter assignedReviewerId === session.user.id.
// RBAC: 'tiep-nhan:read'.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listMyAssignedProjects } from './_actions/list-mine';
import { listValidProjects } from '../cham-diem-so-bo/_actions/list-valid';
import { KiemTraTabs } from './_components/KiemTraTabs';

export const metadata = { title: 'Kiểm tra & chấm điểm sơ bộ' };

export default async function KiemTraPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const [reviewRows, scoringRows] = await Promise.all([
    listMyAssignedProjects(),
    listValidProjects(),
  ]);

  const inReviewCount = reviewRows.filter((r) => r.status === 'IN_REVIEW')
    .length;
  const supplementCount = reviewRows.filter(
    (r) => r.status === 'SUPPLEMENT_REQUIRED',
  ).length;
  const validCount = reviewRows.filter((r) => r.status === 'VALID').length;
  const overdueCount = reviewRows.filter((r) => r.isOverdue).length;
  const scoringTodoCount = scoringRows.filter(
    (r) => r.scoreSheetStatus === null,
  ).length;
  const scoringDraftCount = scoringRows.filter(
    (r) => r.scoreSheetStatus === 'DRAFT',
  ).length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Kiểm tra & chấm điểm sơ bộ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Hàng đợi đề án được giao cho bạn — kiểm tra hành chính trước, sau
            đó chấm điểm sơ bộ theo bộ tiêu chí của chu kỳ chương trình.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatPill label="Đang kiểm tra" value={inReviewCount} tone="blue" />
          <StatPill label="Đợi bổ sung" value={supplementCount} tone="amber" />
          <StatPill label="Hợp lệ" value={validCount} tone="green" />
          <StatPill
            label="Cần chấm điểm"
            value={scoringTodoCount + scoringDraftCount}
            tone="violet"
          />
          {overdueCount > 0 ? (
            <StatPill label="Quá hạn" value={overdueCount} tone="red" />
          ) : null}
        </div>
      </header>

      <KiemTraTabs reviewRows={reviewRows} scoringRows={scoringRows} />
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
  tone: 'blue' | 'amber' | 'green' | 'red' | 'violet';
}) {
  const map: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
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
