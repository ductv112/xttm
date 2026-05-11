'use client';

import { ArrowUpRight, ArrowDownRight, Info, Minus } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/lib/utils';
import { KPI_ROWS, type KpiRow } from '../_data/mock-kpi';

type Props = {
  onSelectKpi: (kpiId: string) => void;
};

export function ImpactSection({ onSelectKpi }: Props) {
  const rows = KPI_ROWS.filter((r) => r.group === 'E');

  const compareData = rows.map((r) => ({
    id: r.id,
    label: shortLabel(r.name),
    current: r.actual,
    previous: r.previous,
    delta: r.actual - r.previous,
    direction: r.deltaDirection,
    deltaDisplay: r.deltaDisplay,
  }));

  const breakdownRow = rows.find((r) => r.id === 'E-03');
  const breakdown = breakdownRow?.breakdown ?? [];

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-5 gap-px bg-slate-100">
      {/* Main: Comparison bar chart 3 chỉ tiêu */}
      <div className="2xl:col-span-3 bg-white p-5">
        <div className="flex items-start gap-2 mb-2">
          <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-xs text-slate-500 leading-snug">
            Các chỉ tiêu tác động phản ánh chuyển biến của DN sau đề án —
            <span className="font-semibold"> không có mục tiêu định lượng</span>,
            đánh giá theo xu hướng so kỳ trước (số liệu 3-6 tháng sau đề án).
          </p>
        </div>

        <div style={{ height: 280 }} className="mt-3">
          <ResponsiveContainer>
            <BarChart
              data={compareData}
              layout="vertical"
              margin={{ top: 8, right: 80, bottom: 0, left: 8 }}
              barGap={4}
              barCategoryGap="22%"
              onClick={(state) => {
                const idx = state?.activeTooltipIndex;
                if (typeof idx === 'number' && compareData[idx]) {
                  onSelectKpi(compareData[idx].id);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 'dataMax + 8']}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 12, fill: '#334155' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                width={170}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                formatter={(v, name) => [`${v}%`, name === 'current' ? 'Kỳ này' : 'Kỳ trước']}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                formatter={(v) => (v === 'current' ? 'Kỳ này (2026)' : 'Kỳ trước (2025)')}
              />
              <Bar
                dataKey="previous"
                name="previous"
                fill="#cbd5e1"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="previous"
                  position="right"
                  formatter={(v: unknown) => `${v}%`}
                  style={{ fontSize: 11, fill: '#64748b' }}
                />
              </Bar>
              <Bar
                dataKey="current"
                name="current"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
                cursor="pointer"
              >
                {compareData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.direction === 'up' ? '#7c3aed' : d.direction === 'down' ? '#dc2626' : '#64748b'}
                  />
                ))}
                <LabelList
                  dataKey="current"
                  position="right"
                  formatter={(v: unknown) => `${v}%`}
                  style={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Delta chips below chart */}
        <ul className="grid grid-cols-3 gap-2 mt-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelectKpi(r.id)}
                className="w-full text-left rounded-md border border-slate-200 bg-slate-50/60 hover:bg-blue-50/40 transition-colors px-2.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold line-clamp-1">
                  {shortLabel(r.name)}
                </p>
                <div className="flex items-baseline justify-between gap-1 mt-1">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {r.actualDisplay}
                  </span>
                  <DeltaChip direction={r.deltaDirection} text={r.deltaDisplay} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Side: Breakdown năng lực DN (E-03) */}
      <div className="2xl:col-span-2 bg-white p-5">
        <h4 className="text-sm font-bold text-slate-800 leading-tight">
          Năng lực DN được cải thiện
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
          % DN tự đánh giá có cải thiện theo từng phương diện
        </p>

        <div className="space-y-3">
          {breakdown.map((b, i) => {
            const colors = ['#1d4ed8', '#059669', '#9333ea', '#d97706'];
            const color = colors[i % colors.length];
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium truncate pr-2">
                    {b.label}
                  </span>
                  <span className="font-bold tabular-nums text-slate-900 shrink-0">
                    {b.value}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${b.value}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSelectKpi('E-03')}
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
        >
          Xem chi tiết & top đề án →
        </button>
      </div>
    </div>
  );
}

function shortLabel(name: string): string {
  return name
    .replace('Tăng trưởng ', '')
    .replace(' sau đề án', '')
    .replace('% DN cải thiện ', 'Năng lực ')
    .replace('năng lực TB', 'TB');
}

function DeltaChip({
  direction,
  text,
}: {
  direction: 'up' | 'down' | 'flat';
  text: string;
}) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const color =
    direction === 'up'
      ? 'text-emerald-700 bg-emerald-50 ring-emerald-200'
      : direction === 'down'
      ? 'text-red-700 bg-red-50 ring-red-200'
      : 'text-slate-600 bg-slate-50 ring-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 shrink-0',
        color,
      )}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {text}
    </span>
  );
}
