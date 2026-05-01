'use client';

// ChartByBudgetStatus — Multi-stage budget bar chart (registered → approved → signed → disbursed).

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatVNDCompact } from '@/lib/format';
import type { ChartByBudgetStatusItem } from '@/lib/dashboard-aggregations';

const STATUS_COLORS: Record<string, string> = {
  registered: '#0ea5e9',
  approved: '#1d4ed8',
  signed: '#0d9488',
  disbursed: '#10b981',
};

type Props = {
  data: ChartByBudgetStatusItem[];
};

export function ChartByBudgetStatus({ data }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Kinh phí theo trạng thái
      </h3>
      <p className="text-xs text-slate-500 mt-0.5">
        Đăng ký → Phê duyệt → Ký HĐ → Giải ngân
      </p>
      <div className="mt-4" style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#475569' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#475569' }}
              tickFormatter={(v) => formatVNDCompact(Number(v) || 0)}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
              }}
              formatter={(value) => [
                formatVNDCompact(Number(value) || 0),
                'Số tiền',
              ]}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {data.map((d, idx) => (
                <Cell
                  key={idx}
                  fill={STATUS_COLORS[d.status] ?? '#64748b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
