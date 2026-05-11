'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Info,
  Minus,
  Target,
  TrendingUp,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { KPI_GROUPS, KPI_ROWS } from '../_data/mock-kpi';

type Props = {
  kpiId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function KpiDrillDownSheet({ kpiId, onOpenChange }: Props) {
  const kpi = kpiId ? KPI_ROWS.find((r) => r.id === kpiId) : null;
  const group = kpi ? KPI_GROUPS.find((g) => g.key === kpi.group) : null;

  return (
    <Sheet open={!!kpi} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] overflow-y-auto p-0"
      >
        {kpi && group && (
          <div className="flex flex-col">
            {/* Header */}
            <SheetHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-700 text-white text-[10px] font-bold">
                  {group.key}
                </span>
                <span>{group.title}</span>
              </div>
              <SheetTitle className="text-lg leading-tight text-slate-900 mt-2">
                {kpi.name}
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-600">
                {kpi.description}
              </SheetDescription>
            </SheetHeader>

            <div className="p-6 space-y-6">
              {/* Big number */}
              <div className="grid grid-cols-3 gap-3">
                <BigStat
                  label="Thực tế kỳ này"
                  value={kpi.actualDisplay}
                  unit={kpi.unit}
                  tone="primary"
                />
                <BigStat
                  label="Mục tiêu"
                  value={kpi.targetDisplay}
                  unit={kpi.unit}
                  tone="neutral"
                />
                <BigStat
                  label="% đạt"
                  value={
                    kpi.achievement != null ? `${kpi.achievement}%` : '—'
                  }
                  unit=""
                  tone={
                    kpi.achievement == null
                      ? 'neutral'
                      : kpi.achievement >= 100
                      ? 'good'
                      : kpi.achievement >= 70
                      ? 'warn'
                      : 'bad'
                  }
                />
              </div>

              {/* Insight box */}
              {kpi.insight && (
                <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/60 p-3">
                  <Info className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-blue-900">{kpi.insight}</p>
                </div>
              )}

              {/* Trend chart 5 năm */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Xu hướng 5 chu kỳ gần nhất
                  </h4>
                  <DeltaPill
                    label={kpi.deltaDisplay}
                    direction={kpi.deltaDirection}
                    inverse={kpi.inverse}
                  />
                </div>
                <div style={{ height: 180 }} className="rounded-md border border-slate-100 bg-slate-50/40 p-2">
                  <ResponsiveContainer>
                    <LineChart
                      data={kpi.sparkline.map((v, i) => ({
                        label: `Năm ${2022 + i}`,
                        value: v,
                      }))}
                      margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                        formatter={(v) => [`${v} ${kpi.unit}`, kpi.name]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#1d4ed8"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#1d4ed8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div className="rounded-md bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-500">Kỳ trước</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {kpi.previousDisplay} {kpi.unit}
                    </span>
                  </div>
                  <div className="rounded-md bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-500">Thay đổi</span>
                    <span
                      className={cn(
                        'font-semibold',
                        kpi.deltaDirection === 'up'
                          ? kpi.inverse
                            ? 'text-red-700'
                            : 'text-emerald-700'
                          : kpi.deltaDirection === 'down'
                          ? kpi.inverse
                            ? 'text-emerald-700'
                            : 'text-red-700'
                          : 'text-slate-600',
                      )}
                    >
                      {kpi.deltaDisplay}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              {kpi.breakdown && kpi.breakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Phân tích lát cắt
                  </h4>
                  <div style={{ height: 200 }} className="rounded-md border border-slate-100 bg-slate-50/40 p-2">
                    <ResponsiveContainer>
                      <BarChart
                        data={kpi.breakdown}
                        layout="vertical"
                        margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tick={{ fontSize: 11, fill: '#475569' }}
                          width={130}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          formatter={(v) => [`${v}`, kpi.unit]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {kpi.breakdown.map((_, i) => (
                            <Cell
                              key={i}
                              fill={['#1d4ed8', '#059669', '#9333ea', '#d97706', '#0ea5e9'][i % 5]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Top contributors */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                  Top đề án đóng góp lớn nhất
                </h4>
                <ul className="space-y-2">
                  {kpi.topProjects.map((p, idx) => (
                    <li
                      key={p.code}
                      className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 hover:bg-blue-50/30 transition-colors"
                    >
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold shrink-0',
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                            : idx === 1
                            ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-300'
                            : 'bg-orange-100 text-orange-800 ring-1 ring-orange-300',
                        )}
                      >
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-500">{p.code}</span>
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">{p.unit}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                          {p.value.toLocaleString('vi-VN')}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            {p.valueUnit}
                          </span>
                        </div>
                        {p.share > 0 && (
                          <div className="text-[11px] text-slate-500">
                            chiếm {p.share.toFixed(1)}% tổng
                          </div>
                        )}
                        <a
                          href={`/de-an?code=${p.code}`}
                          className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-700 hover:text-blue-900"
                        >
                          Xem đề án <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function BigStat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: 'primary' | 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const toneClasses = {
    primary: 'bg-blue-50 ring-blue-200 text-blue-900',
    good: 'bg-emerald-50 ring-emerald-200 text-emerald-900',
    warn: 'bg-amber-50 ring-amber-200 text-amber-900',
    bad: 'bg-red-50 ring-red-200 text-red-900',
    neutral: 'bg-slate-50 ring-slate-200 text-slate-900',
  }[tone];

  return (
    <div className={cn('rounded-md ring-1 p-3', toneClasses)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1 tabular-nums">{value}</p>
      {unit && <p className="text-[11px] opacity-70 mt-0.5">{unit}</p>}
    </div>
  );
}

function DeltaPill({
  label,
  direction,
  inverse,
}: {
  label: string;
  direction: 'up' | 'down' | 'flat';
  inverse?: boolean;
}) {
  const positive =
    (direction === 'up' && !inverse) || (direction === 'down' && inverse);
  const negative =
    (direction === 'up' && inverse) || (direction === 'down' && !inverse);
  const Icon =
    direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ring-1',
        positive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : negative
          ? 'bg-red-50 text-red-700 ring-red-200'
          : 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
