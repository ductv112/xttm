// OverdueWarnings — Phase 8 Plan 08-01 Task 2.
// Banner đỏ: đề án đã có quyết định >60 ngày mà chưa SIGNED hợp đồng.

import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';

import { formatDate } from '@/lib/format';
import type { OverdueContractWarning } from '../_actions/list';

export function OverdueWarnings({
  warnings,
}: {
  warnings: OverdueContractWarning[];
}) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">
            Cảnh báo SLA hợp đồng — quá hạn 60 ngày
          </h3>
          <p className="mt-1 text-sm text-red-800">
            <strong>{warnings.length}</strong> đề án đã được Bộ Công Thương phê
            duyệt nhưng chưa ký hợp đồng quá 60 ngày. Cần khẩn trương xử lý.
          </p>
          <ul className="mt-3 space-y-2">
            {warnings.map((w) => (
              <li
                key={w.projectId}
                className="rounded border border-red-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/de-an/${w.projectId}`}
                      className="font-mono text-sm font-semibold text-blue-700 hover:underline"
                    >
                      {w.projectCode}
                    </Link>
                    <div className="text-sm font-medium text-slate-900">
                      {w.projectName}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      {w.organizationName} · QĐ{' '}
                      <span className="font-mono">{w.decisionNumber}</span> ngày{' '}
                      {formatDate(w.decisionDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-800">
                      Quá hạn {w.daysOverdue} ngày
                    </span>
                    <Link
                      href={`/de-an/${w.projectId}#hop-dong`}
                      className="text-blue-700 hover:text-blue-900"
                      aria-label="Đến chi tiết đề án"
                    >
                      <ChevronRight
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
