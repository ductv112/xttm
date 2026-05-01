'use client';

// FinanceSummaryChart — Phase 9 Plan 09-01 Task 3.
// Bar chart tổng hợp tạm ứng/thanh toán/quyết toán theo năm (Recharts).

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatVNDCompact } from '@/lib/format';

export type FinanceYearlyDatum = {
  year: string;
  ADVANCE: number;
  PAYMENT: number;
  SETTLEMENT: number;
};

export function FinanceSummaryChart({
  data,
}: {
  data: FinanceYearlyDatum[];
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Tổng hợp giải ngân theo năm
      </h3>
      <p className="text-xs text-slate-500">
        Bao gồm các hồ sơ ở trạng thái đã chi (DISBURSED/SETTLED).
      </p>
      <div className="mt-4" style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatVNDCompact(Number(v) || 0)}
            />
            <Tooltip
              formatter={(value) =>
                formatVNDCompact(Number(value) || 0) as string
              }
              labelFormatter={(label) => `Năm ${label}`}
            />
            <Legend />
            <Bar
              dataKey="ADVANCE"
              name="Tạm ứng"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="PAYMENT"
              name="Thanh toán"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="SETTLEMENT"
              name="Quyết toán"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
