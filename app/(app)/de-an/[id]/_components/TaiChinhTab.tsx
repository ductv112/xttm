'use client';

// TaiChinhTab — Phase 9 Plan 09-01 Task 2.
// Tab "Tài chính" trên /de-an/[id] — readonly summary cho đơn vị, có quick actions.

import * as React from 'react';
import Link from 'next/link';
import { Wallet, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatVND, formatDate } from '@/lib/format';
import {
  FINANCIAL_TYPE_LABELS,
  FINANCIAL_STATUS_LABELS,
  FINANCIAL_STATUS_BADGE,
} from '@/lib/workflows/financial';
import type { FinancialRecordRow } from '../../../tai-chinh/_actions/list';

export function TaiChinhTab({
  records,
  canManageFinance,
}: {
  records: ReadonlyArray<FinancialRecordRow>;
  canManageFinance: boolean;
}) {
  const totals = React.useMemo(() => {
    const result = {
      ADVANCE: 0,
      PAYMENT: 0,
      SETTLEMENT: 0,
      total: 0,
    };
    for (const r of records) {
      if (r.status === 'DISBURSED' || r.status === 'SETTLED') {
        result[r.recordType] += r.amount;
        result.total += r.amount;
      }
    }
    return result;
  }, [records]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900">
            Tài chính đề án
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Tóm tắt hồ sơ tạm ứng, thanh toán, quyết toán liên quan đến đề án.
          Thao tác chi tiết tại module{' '}
          <Link
            href="/tai-chinh"
            className="text-blue-700 hover:underline"
          >
            Tài chính
          </Link>
          .
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          label="Tạm ứng đã chi"
          value={formatVND(totals.ADVANCE)}
          tone="blue"
        />
        <SummaryCard
          label="Thanh toán đã chi"
          value={formatVND(totals.PAYMENT)}
          tone="emerald"
        />
        <SummaryCard
          label="Quyết toán"
          value={formatVND(totals.SETTLEMENT)}
          tone="slate"
        />
        <SummaryCard
          label="Tổng đã giải ngân"
          value={formatVND(totals.total)}
          tone="amber"
        />
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <EmptyState
          icon="file-x"
          heading="Chưa có hồ sơ tài chính"
          description={
            canManageFinance
              ? 'Tạo hồ sơ tạm ứng/thanh toán/quyết toán tại module Tài chính.'
              : 'Đơn vị tài chính chưa lập hồ sơ cho đề án này.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-800"
                    >
                      {FINANCIAL_TYPE_LABELS[r.recordType]}
                    </Badge>
                    <span className="font-mono text-sm text-slate-700">
                      {r.recordNumber ?? '(chưa cấp số)'}
                    </span>
                    <Badge
                      variant="outline"
                      className={FINANCIAL_STATUS_BADGE[r.status]}
                    >
                      {FINANCIAL_STATUS_LABELS[r.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatVND(r.amount)}
                  </p>
                  <div className="mt-1 text-xs text-slate-500">
                    Tạo {formatDate(r.createdAt)}
                    {r.disbursedAt
                      ? ` · Chi ${formatDate(r.disbursedAt)}`
                      : ''}
                    {r.contractNo
                      ? ` · HĐ ${r.contractNo}`
                      : ''}
                  </div>
                  {r.notes ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {r.notes}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/tai-chinh/${r.id}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
                >
                  Xem
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'slate' | 'amber';
}) {
  const toneClasses = {
    blue: 'border-blue-200 bg-blue-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    slate: 'border-slate-200 bg-slate-50',
    amber: 'border-amber-200 bg-amber-50',
  };
  return (
    <div className={`rounded-md border p-3 ${toneClasses[tone]}`}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
