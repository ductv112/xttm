// Dashboard HERO page — Phase 10 Plan 10-01.
// Server-side render with getDashboardSummary; charts hydrate client-side.

import { auth } from '@/lib/auth';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import {
  getDashboardSummary,
  listDashboardYears,
} from '@/lib/dashboard-aggregations';

import { DashboardStatsRow } from './_components/DashboardStatsRow';
import { AlertsRow } from './_components/AlertsRow';
import { ChartByKind } from './_components/ChartByKind';
import { ChartByBudgetStatus } from './_components/ChartByBudgetStatus';
import { DashboardFilterBar } from './_components/DashboardFilterBar';

export const metadata = { title: 'Trang chủ' };

type SearchParams = { [key: string]: string | string[] | undefined };

function parseYearParam(
  raw: string | string[] | undefined,
  fallback: number,
): number {
  if (typeof raw !== 'string') return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 2000 && n <= 2100) return n;
  return fallback;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const years = await listDashboardYears();
  const defaultYear = years[0] ?? new Date().getFullYear();
  const year = parseYearParam(params.year, defaultYear);

  const role = session.user.role as Role;
  const summary = await getDashboardSummary(
    year,
    role,
    session.user.organizationId,
  );

  const { fullName, organizationName } = session.user;
  const roleLabel = ROLE_LABELS[role];
  const roleLine = organizationName != null
    ? `${roleLabel} · ${organizationName}`
    : roleLabel;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Xin chào, {fullName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bạn đang đăng nhập với vai trò {roleLine}
          </p>
        </div>
        <DashboardFilterBar years={years} currentYear={year} />
      </div>

      <DashboardStatsRow stats={summary.stats} year={year} />

      <section aria-labelledby="alerts-heading" className="space-y-3">
        <h2
          id="alerts-heading"
          className="text-base font-semibold text-slate-900"
        >
          Cảnh báo & Hành động
        </h2>
        <AlertsRow summary={summary} />
      </section>

      <section aria-labelledby="charts-heading" className="space-y-3">
        <h2
          id="charts-heading"
          className="text-base font-semibold text-slate-900"
        >
          Phân tích
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartByKind data={summary.chartByKind} />
          <ChartByBudgetStatus data={summary.chartByBudgetStatus} />
        </div>
      </section>
    </div>
  );
}
