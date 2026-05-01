'use client';

// ChartByKind — Bar chart of project counts by ProjectKind.

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

import type { ChartByKindItem } from '@/lib/dashboard-aggregations';

const COLORS = [
  '#1d4ed8',
  '#0d9488',
  '#9333ea',
  '#db2777',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
  '#ef4444',
  '#64748b',
];

type Props = {
  data: ChartByKindItem[];
};

export function ChartByKind({ data }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Đề án theo loại hình
      </h3>
      <p className="text-xs text-slate-500 mt-0.5">
        Phân bố đề án trong năm theo loại hoạt động XTTM
      </p>
      <div className="mt-4" style={{ width: '100%', height: 280 }}>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            Chưa có dữ liệu để hiển thị
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="kindLabel"
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                }}
                formatter={(value) => [`${Number(value)} đề án`, 'Số lượng']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
