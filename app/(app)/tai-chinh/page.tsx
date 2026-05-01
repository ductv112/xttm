// /tai-chinh — Phase 9 Plan 09-01 Task 3.
// Module quản lý hồ sơ tài chính cho TAICHINH role: tạm ứng/thanh toán/quyết toán.

import { redirect } from 'next/navigation';
import { Wallet } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { formatVND } from '@/lib/format';

import {
  listFinancialRecords,
  listEligibleProjectsForFinance,
} from './_actions/list';
import { FinancialRecordTable } from './_components/FinancialRecordTable';
import { CreateRecordDialogs } from './_components/CreateRecordDialogs';
import { FinanceSummaryChart } from './_components/FinanceSummaryChart';

export const metadata = { title: 'Tài chính' };

export default async function TaiChinhListPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tai-chinh', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const [records, eligibleProjects, canCreate] = await Promise.all([
    listFinancialRecords(),
    listEligibleProjectsForFinance(),
    canFromDB(role, 'tai-chinh', 'create'),
  ]);

  // Aggregate by type
  const totalsByType = {
    ADVANCE: { count: 0, amount: 0 },
    PAYMENT: { count: 0, amount: 0 },
    SETTLEMENT: { count: 0, amount: 0 },
  };
  let totalDisbursed = 0;
  for (const r of records) {
    totalsByType[r.recordType].count += 1;
    totalsByType[r.recordType].amount += r.amount;
    if (r.status === 'DISBURSED' || r.status === 'SETTLED') {
      totalDisbursed += r.amount;
    }
  }

  // Group by year for chart
  const yearlyMap = new Map<
    number,
    { ADVANCE: number; PAYMENT: number; SETTLEMENT: number }
  >();
  for (const r of records) {
    const year = (r.transactionDate ?? r.createdAt).getFullYear();
    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, { ADVANCE: 0, PAYMENT: 0, SETTLEMENT: 0 });
    }
    if (r.status === 'DISBURSED' || r.status === 'SETTLED') {
      yearlyMap.get(year)![r.recordType] += r.amount;
    }
  }
  const yearlyData = [...yearlyMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, sums]) => ({
      year: year.toString(),
      ...sums,
    }));

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Tài chính
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Quản lý hồ sơ tạm ứng, thanh toán, quyết toán đề án XTTM. State
            machine: <code className="text-xs">DRAFT → SUBMITTED → APPROVED → DISBURSED → SETTLED</code>.
          </p>
        </div>
        {canCreate ? (
          <CreateRecordDialogs eligibleProjects={eligibleProjects} />
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryPill
          label="Tổng hồ sơ"
          value={records.length.toString()}
          tone="slate"
        />
        <SummaryPill
          label="Tạm ứng"
          value={`${totalsByType.ADVANCE.count} · ${formatVND(totalsByType.ADVANCE.amount)}`}
          tone="blue"
        />
        <SummaryPill
          label="Thanh toán"
          value={`${totalsByType.PAYMENT.count} · ${formatVND(totalsByType.PAYMENT.amount)}`}
          tone="emerald"
        />
        <SummaryPill
          label="Đã giải ngân"
          value={formatVND(totalDisbursed)}
          tone="amber"
        />
      </div>

      {yearlyData.length > 0 ? (
        <div className="mt-6">
          <FinanceSummaryChart data={yearlyData} />
        </div>
      ) : null}

      <div className="mt-6">
        <FinancialRecordTable rows={records} />
      </div>
    </main>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'slate' | 'blue' | 'emerald' | 'amber';
}) {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-50',
    blue: 'border-blue-200 bg-blue-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
  }[tone];
  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
