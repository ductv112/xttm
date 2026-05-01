// /dieu-chinh — Phase 8 Plan 08-01 Task 4.
// BQL danh sách yêu cầu điều chỉnh + xử lý.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Pencil, ChevronRight } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  AMENDMENT_TYPE_LABELS,
  AMENDMENT_STATUS_LABELS,
  AMENDMENT_STATUS_BADGE,
  type AmendmentStatus,
  type AmendmentType,
} from '@/lib/amendment-rules';
import { formatDate, formatDateTime } from '@/lib/format';

import { listAmendments } from './_actions/list';

export const metadata = { title: 'Điều chỉnh đề án' };

export default async function DieuChinhListPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'de-an', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const rows = await listAmendments();
  const stats = {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'PENDING').length,
    approved: rows.filter((r) => r.status === 'APPROVED').length,
    rejected: rows.filter((r) => r.status === 'REJECTED').length,
    routed: rows.filter((r) => r.status === 'RESUBMIT_EVALUATION').length,
  };

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Pencil
              className="h-6 w-6 text-blue-600"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-semibold text-slate-900">
              Điều chỉnh đề án
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Quản lý các yêu cầu điều chỉnh đề án theo Điều 13 NĐ 28/2018/NĐ-CP.
            Loại NHỎ: BQL phê duyệt nội bộ. Loại TRỌNG YẾU: chuyển hội đồng
            thẩm định lại.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill label="Tổng" value={stats.total} tone="slate" />
          <StatPill label="Chờ xử lý" value={stats.pending} tone="amber" />
          <StatPill label="Đã duyệt" value={stats.approved} tone="emerald" />
          <StatPill label="Đã từ chối" value={stats.rejected} tone="red" />
          <StatPill label="Thẩm định lại" value={stats.routed} tone="blue" />
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-2">
          <EmptyState
            icon="file-x"
            heading="Chưa có yêu cầu điều chỉnh"
            description="Khi đơn vị chủ trì gửi yêu cầu điều chỉnh, danh sách sẽ hiển thị tại đây."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const status = r.status as AmendmentStatus;
            const type = r.amendmentType as AmendmentType;
            return (
              <li
                key={r.id}
                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
              >
                <Link href={`/dieu-chinh/${r.id}`} className="block">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            r.isCritical
                              ? 'border-red-200 bg-red-50 text-red-800'
                              : 'border-blue-200 bg-blue-50 text-blue-800'
                          }
                        >
                          {r.isCritical ? '⚠ TRỌNG YẾU' : 'Loại nhỏ'}
                        </Badge>
                        <span className="font-medium text-slate-900">
                          {AMENDMENT_TYPE_LABELS[type] ?? r.amendmentType}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            AMENDMENT_STATUS_BADGE[status] ??
                            'bg-slate-100 text-slate-800'
                          }
                        >
                          {AMENDMENT_STATUS_LABELS[status] ?? r.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-mono text-blue-700">
                          {r.projectCode}
                        </span>{' '}
                        — {r.projectName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {r.organizationName} ·{' '}
                        {formatDateTime(r.createdAt)}
                        {r.requestedByName ? ` · ${r.requestedByName}` : ''}
                        {r.decisionNumber ? (
                          <>
                            {' '}
                            · QĐ{' '}
                            <span className="font-mono">
                              {r.decisionNumber}
                            </span>
                            {r.decisionDate
                              ? ` ngày ${formatDate(r.decisionDate)}`
                              : ''}
                          </>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {r.reason}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-5 w-5 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
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
  tone: 'slate' | 'blue' | 'amber' | 'emerald' | 'red';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}
    >
      {label}: <strong>{value}</strong>
    </span>
  );
}
