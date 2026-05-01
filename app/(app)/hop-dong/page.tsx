// /hop-dong — Phase 8 Plan 08-01 Task 2.
// Danh sách hợp đồng + đề án sẵn sàng ký + cảnh báo SLA 60 ngày.

import { redirect } from 'next/navigation';
import { FileSignature } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import {
  listContracts,
  listOverdueContractWarnings,
  listApprovedProjectsWithoutContract,
} from './_actions/list';
import { ContractList } from './_components/ContractList';
import { OverdueWarnings } from './_components/OverdueWarnings';
import { AwaitingContractList } from './_components/AwaitingContractList';

export const metadata = { title: 'Hợp đồng' };

export default async function HopDongListPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'read'))) {
    redirect(defaultLandingPath(role));
  }

  const [contracts, overdueWarnings, awaitingContracts] = await Promise.all([
    listContracts(),
    listOverdueContractWarnings(),
    listApprovedProjectsWithoutContract(),
  ]);

  // Compute year list from existing contracts
  const yearSet = new Set<number>();
  for (const c of contracts) {
    const m = c.contractNo.match(/^XTTM\/(\d{4})\//);
    if (m) yearSet.add(Number(m[1]));
  }
  const years = [...yearSet].sort((a, b) => b - a);

  // Stats
  const stats = {
    total: contracts.length,
    draft: contracts.filter((c) => c.status === 'DRAFT').length,
    signed: contracts.filter((c) => c.status === 'SIGNED').length,
    inProgress: contracts.filter((c) => c.status === 'IN_PROGRESS').length,
    completed: contracts.filter(
      (c) => c.status === 'COMPLETED' || c.status === 'LIQUIDATED',
    ).length,
  };

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature
              className="h-6 w-6 text-blue-600"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-semibold text-slate-900">Hợp đồng</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Quản lý hợp đồng triển khai đề án XTTM. Hợp đồng được sinh từ đề án
            đã phê duyệt với số HĐ tự động format <code>XTTM/YYYY/NNN</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill label="Tổng" value={stats.total} tone="slate" />
          <StatPill label="Bản nháp" value={stats.draft} tone="slate" />
          <StatPill label="Đã ký" value={stats.signed} tone="blue" />
          <StatPill
            label="Đang triển khai"
            value={stats.inProgress}
            tone="amber"
          />
          <StatPill
            label="Đã nghiệm thu"
            value={stats.completed}
            tone="emerald"
          />
        </div>
      </header>

      <div className="space-y-4">
        {overdueWarnings.length > 0 ? (
          <OverdueWarnings warnings={overdueWarnings} />
        ) : null}

        {awaitingContracts.length > 0 ? (
          <AwaitingContractList projects={awaitingContracts} />
        ) : null}

        <ContractList rows={contracts} years={years} />
      </div>
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
  tone: 'slate' | 'blue' | 'amber' | 'emerald';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}
    >
      {label}: <strong>{value}</strong>
    </span>
  );
}
