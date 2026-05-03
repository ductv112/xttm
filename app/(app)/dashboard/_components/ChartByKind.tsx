'use client';

// ChartByKind — Donut chart hiển thị phân bố đề án theo loại hình.
// Layout: donut chart bên trái + legend chi tiết bên phải (loại / số lượng / %).
// Center of donut shows total count for quick read.

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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
  // Sort descending by count so largest slice is rendered first
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Đề án theo loại hình
      </h3>
      <p className="text-xs text-slate-500 mt-0.5">
        Phân bố đề án trong năm theo loại hoạt động XTTM
      </p>

      {sorted.length === 0 ? (
        <div className="mt-4 flex h-[260px] items-center justify-center text-sm text-slate-500">
          Chưa có dữ liệu để hiển thị
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 items-center gap-4 md:grid-cols-5">
          {/* Donut chart */}
          <div className="relative md:col-span-2" style={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={sorted}
                  dataKey="count"
                  nameKey="kindLabel"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={102}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={({ percent }) =>
                    percent !== undefined && percent >= 0.05
                      ? `${Math.round(percent * 100)}%`
                      : ''
                  }
                  labelLine={false}
                >
                  {sorted.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                  }}
                  formatter={(value, name) => {
                    const n = Number(value) || 0;
                    const pct =
                      total > 0 ? Math.round((n / total) * 100) : 0;
                    return [`${n} đề án (${pct}%)`, String(name)];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label — total count */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {total}
              </span>
              <span className="text-xs font-medium text-slate-500">
                đề án
              </span>
            </div>
          </div>

          {/* Legend list */}
          <ul className="space-y-2 md:col-span-3">
            {sorted.map((item, idx) => {
              const pct =
                total > 0 ? Math.round((item.count / total) * 100) : 0;
              const color = COLORS[idx % COLORS.length];
              return (
                <li
                  key={item.kind}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="block h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-medium text-slate-800">
                      {item.kindLabel}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {item.count}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">
                      ({pct}%)
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
