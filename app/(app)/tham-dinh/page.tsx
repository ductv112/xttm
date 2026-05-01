// /tham-dinh — list các đề án Hội đồng thành viên được giao chấm.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Gavel,
  Lock,
  ShieldAlert,
  TimerReset,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatVNDCompact } from '@/lib/format';

import { listAssignedProjects } from './_actions/list-assigned';
import { COUNCIL_MEMBER_ROLE_LABELS } from '../hoi-dong/_actions/member-types';
import type { CouncilMemberRole } from '../hoi-dong/_actions/member-types';

export const metadata = { title: 'Thẩm định đề án' };

export default async function ThamDinhPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const rows = await listAssignedProjects();

  const todoCount = rows.filter((r) => r.scoreSheetStatus === null).length;
  const draftCount = rows.filter(
    (r) => r.scoreSheetStatus === 'DRAFT',
  ).length;
  const submittedCount = rows.filter(
    (r) => r.scoreSheetStatus === 'SUBMITTED',
  ).length;

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Thẩm định đề án
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Danh sách các đề án bạn được phân công thẩm định trong các hội đồng
            đang hoạt động. Click vào đề án để chấm điểm theo bộ tiêu chí.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatPill label="Chưa chấm" value={todoCount} tone="slate" />
          <StatPill label="Đang chấm" value={draftCount} tone="amber" />
          <StatPill label="Đã nộp" value={submittedCount} tone="emerald" />
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-2">
          <EmptyState
            icon="inbox"
            heading="Chưa có đề án nào được phân công"
            description="Bạn chưa thuộc hội đồng nào, hoặc Ban quản lý chưa phân công đề án vào hội đồng của bạn. Vui lòng quay lại sau."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.projectId}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-medium text-slate-500">
                      {r.projectCode}
                    </span>
                    <StatusBadge status={r.projectStatus} entity="PROJECT" />
                    {r.scoreSheetStatus === 'SUBMITTED' ? (
                      r.scoreSheetConflictOfInterest ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          <ShieldAlert
                            className="mr-1 h-3 w-3"
                            aria-hidden="true"
                          />
                          Đã từ chối (COI)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          <CheckCircle2
                            className="mr-1 h-3 w-3"
                            aria-hidden="true"
                          />
                          Đã nộp ({r.scoreSheetTotalScore?.toFixed(2) ?? '0.00'})
                        </Badge>
                      )
                    ) : r.scoreSheetStatus === 'DRAFT' ? (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700"
                      >
                        <TimerReset
                          className="mr-1 h-3 w-3"
                          aria-hidden="true"
                        />
                        Đang chấm
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-slate-700"
                      >
                        <ClipboardList
                          className="mr-1 h-3 w-3"
                          aria-hidden="true"
                        />
                        Chưa chấm
                      </Badge>
                    )}
                    {r.councilLockStatus === 'LOCKED' ? (
                      <Badge
                        variant="outline"
                        className="border-slate-300 bg-slate-100 text-slate-700"
                      >
                        <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
                        Hội đồng đã khóa
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900">
                    {r.projectName}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Đơn vị: <strong>{r.organizationName}</strong> · Hội đồng:{' '}
                    <strong>{r.councilName}</strong> · Vai trò:{' '}
                    {COUNCIL_MEMBER_ROLE_LABELS[
                      r.memberRole as CouncilMemberRole
                    ] ?? r.memberRole}
                    {r.proposedBudget ? (
                      <>
                        {' '}
                        · Dự toán:{' '}
                        <strong>{formatVNDCompact(r.proposedBudget)}</strong>
                      </>
                    ) : null}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/tham-dinh/${r.projectId}`}>
                    {r.scoreSheetStatus === 'SUBMITTED'
                      ? 'Xem phiếu chấm'
                      : r.scoreSheetStatus === 'DRAFT'
                        ? 'Tiếp tục chấm'
                        : 'Bắt đầu chấm'}
                    <ChevronRight
                      className="ml-1 h-3 w-3"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
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
  tone: 'slate' | 'amber' | 'emerald';
}) {
  const map: Record<typeof tone, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
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
