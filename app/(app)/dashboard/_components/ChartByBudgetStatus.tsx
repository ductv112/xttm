'use client';

// ChartByBudgetStatus — Multi-stage budget bar chart (registered → approved → signed → disbursed).
// Color progression: light blue → blue → indigo → emerald to convey "đang thực hiện" → "đã giải ngân".

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatVNDCompact } from '@/lib/format';
import type { ChartByBudgetStatusItem } from '@/lib/dashboard-aggregations';

const STATUS_COLORS: Record<string, string> = {
  registered: '#93c5fd', // blue-300 — sơ khai (đăng ký)
  approved: '#3b82f6', // blue-500 — đã quyết định (phê duyệt)
  signed: '#1d4ed8', // blue-700 — đã cam kết (ký HĐ — đang thực hiện)
  disbursed: '#10b981', // emerald-500 — hoàn tất (đã giải ngân)
};

const STATUS_LEGEND: Array<{ key: string; label: string; color: string }> = [
  { key: 'registered', label: 'Đăng ký', color: STATUS_COLORS.registered! },
  { key: 'approved', label: 'Phê duyệt', color: STATUS_COLORS.approved! },
  { key: 'signed', label: 'Đang thực hiện', color: STATUS_COLORS.signed! },
  { key: 'disbursed', label: 'Đã giải ngân', color: STATUS_COLORS.disbursed! },
];

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

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {STATUS_LEGEND.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-4" style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 28, right: 12, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#334155' }}
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
              cursor={{ fill: '#f1f5f9' }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={56}>
              {data.map((d, idx) => (
                <Cell
                  key={idx}
                  fill={STATUS_COLORS[d.status] ?? '#64748b'}
                />
              ))}
              <LabelList
                dataKey="amount"
                position="top"
                formatter={(value) => formatVNDCompact(Number(value) || 0)}
                style={{ fontSize: 12, fontWeight: 600, fill: '#1e293b' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
