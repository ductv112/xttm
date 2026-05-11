'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Trophy } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { KpiRow } from '../_data/mock-kpi';

type Props = {
  rows: KpiRow[];
  onSelectKpi: (id: string) => void;
  highlightId?: string;
};

type ChartDatum = {
  id: string;
  name: string;
  actualPct: number;
  previousPct: number;
  actualDisplay: string;
  previousDisplay: string;
  targetDisplay: string;
  unit: string;
  fullName: string;
  inverse: boolean;
  isHighlight: boolean;
  toneColor: string;
  topCode: string | null;
};

const TONE_COLORS = {
  good: '#10b981',
  warn: '#f59e0b',
  bad: '#ef4444',
  neutral: '#64748b',
};

function shortName(name: string): string {
  return name
    .replace('Số doanh nghiệp tham gia', 'Số DN tham gia')
    .replace('Số DNNVV trong tổng', 'Trong đó: DNNVV')
    .replace('Số quốc gia/thị trường tiếp cận', 'Quốc gia tiếp cận')
    .replace('Tổng giá trị hợp đồng', 'Giá trị HĐ ký')
    .replace('Số biên bản ghi nhớ (MOU)', 'Số MOU phát sinh')
    .replace('Giá trị xuất khẩu phát sinh', 'Giá trị XK phát sinh')
    .replace('Kinh phí NSNN đã giải ngân', 'NSNN đã giải ngân')
    .replace('Tỷ lệ giải ngân TB', 'Tỷ lệ giải ngân TB')
    .replace('ROI: Giá trị giao dịch / 1đ NSNN', '★ ROI: GD/1đ NS')
    .replace('ROI: Giá trị XK phát sinh / 1đ NSNN', 'ROI: XK/1đ NS')
    .replace('Chi phí TB / hợp đồng ký', 'CP/hợp đồng ký')
    .replace('Tỷ lệ huy động nguồn ngoài NS', 'Huy động ngoài NS')
    .replace('Số thị trường XK mới mở', 'Thị trường mới')
    .replace('Số nhà NK/phân phối mới', 'Đối tác NK/PP mới')
    .replace('% DN duy trì giao dịch sau đề án', 'DN duy trì GD')
    .replace('Hài lòng DN tham gia', 'Hài lòng DN')
    .replace('Hài lòng buyer nước ngoài', 'Hài lòng buyer NN')
    .replace('Tính bền vững (TB 4 tiêu chí)', 'Tính bền vững')
    .replace('% đề án phù hợp ≥ 3/4 chính sách', 'Phù hợp chính sách');
}

function toneOf(
  achievement: number | null,
  inverse?: boolean,
  direction?: 'up' | 'down' | 'flat',
): keyof typeof TONE_COLORS {
  if (achievement == null) {
    if (inverse && direction === 'down') return 'good';
    if (inverse && direction === 'up') return 'bad';
    return 'neutral';
  }
  if (achievement >= 100) return 'good';
  if (achievement >= 70) return 'warn';
  return 'bad';
}

/**
 * Tính % đạt mục tiêu cho cả chỉ tiêu thông thường và inverse.
 * - Thông thường: actual / target × 100
 * - Inverse (lower-is-better, vd Chi phí/HĐ): target / actual × 100
 *   → kết quả ≥100% nghĩa là "đạt" (actual ≤ target)
 */
function achievementPct(
  actual: number,
  target: number,
  inverse: boolean,
): number {
  if (!target) return 0;
  if (inverse) {
    if (!actual) return 0;
    return Math.round((target / actual) * 100);
  }
  return Math.round((actual / target) * 100);
}

export function GroupBarChart({ rows, onSelectKpi, highlightId }: Props) {
  const data: ChartDatum[] = rows.map((r) => {
    const inverse = !!r.inverse;
    const actualPct = inverse
      ? achievementPct(r.actual, r.target, true)
      : r.achievement ?? achievementPct(r.actual, r.target, false);
    const previousPct = inverse
      ? achievementPct(r.previous, r.target, true)
      : r.target
      ? Math.round((r.previous / r.target) * 100)
      : 0;
    const tone = toneOf(actualPct, inverse, r.deltaDirection);
    return {
      id: r.id,
      name: shortName(r.name),
      fullName: r.name,
      actualPct: Math.min(actualPct, 140),
      previousPct: Math.min(previousPct, 140),
      actualDisplay: r.actualDisplay,
      previousDisplay: r.previousDisplay,
      targetDisplay: r.targetDisplay,
      unit: r.unit,
      inverse,
      isHighlight: r.id === highlightId,
      toneColor: TONE_COLORS[tone],
      topCode: r.topProjects[0]?.code ?? null,
    };
  });

  const chartHeight = Math.max(220, 60 + rows.length * 56);

  return (
    <div className="bg-white p-5">
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 80, bottom: 8, left: 0 }}
            barGap={2}
            barCategoryGap="22%"
            onClick={(state) => {
              const idx = state?.activeTooltipIndex;
              if (typeof idx === 'number' && data[idx]) {
                onSelectKpi(data[idx].id);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 140]}
              ticks={[0, 25, 50, 75, 100, 125]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={(props) => <CategoryTick {...props} data={data} />}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              width={160}
              interval={0}
            />
            <ReferenceLine
              x={100}
              stroke="#0f172a"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{
                value: 'Mục tiêu',
                position: 'top',
                fontSize: 10,
                fill: '#0f172a',
                fontWeight: 600,
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
              content={<ChartTooltip />}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
              formatter={(v) =>
                v === 'previousPct' ? 'Kỳ trước' : 'Kỳ này'
              }
            />
            <Bar
              dataKey="previousPct"
              name="previousPct"
              fill="#cbd5e1"
              radius={[0, 3, 3, 0]}
              barSize={9}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="previousDisplay"
                position="right"
                style={{ fontSize: 10, fill: '#94a3b8' }}
              />
            </Bar>
            <Bar
              dataKey="actualPct"
              name="actualPct"
              radius={[0, 4, 4, 0]}
              barSize={14}
              isAnimationActive={false}
              cursor="pointer"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.toneColor} />
              ))}
              <LabelList
                dataKey="actualDisplay"
                position="right"
                style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend dưới chart cho rõ ràng */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600">
        <LegendItem className="bg-slate-300 h-2 w-3.5 rounded-sm" label="Kỳ trước" />
        <LegendItem className="bg-emerald-500 h-3 w-3.5 rounded-sm" label="Kỳ này — Đạt ≥100%" />
        <LegendItem className="bg-amber-500 h-3 w-3.5 rounded-sm" label="Khá 70-99%" />
        <LegendItem className="bg-red-500 h-3 w-3.5 rounded-sm" label="Thấp <70%" />
        <span className="inline-flex items-center gap-1">
          <span className="block w-0.5 h-3 bg-slate-900" aria-hidden="true" />
          <span>Mục tiêu (100%)</span>
        </span>
        <span className="text-slate-400 italic">
          (Click vào thanh để xem chi tiết)
        </span>
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('block', className)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

type CategoryTickProps = {
  x?: string | number;
  y?: string | number;
  payload?: { value?: string };
  data: ChartDatum[];
};

function CategoryTick({ x = 0, y = 0, payload, data }: CategoryTickProps) {
  const nx = typeof x === 'number' ? x : Number(x) || 0;
  const ny = typeof y === 'number' ? y : Number(y) || 0;
  const label = payload?.value ?? '';
  const datum = data.find((d) => d.name === label);
  if (!datum) {
    return (
      <text x={nx} y={ny} dy={4} textAnchor="end" fontSize={11} fill="#475569">
        {label}
      </text>
    );
  }
  return (
    <g transform={`translate(${nx},${ny})`}>
      {datum.isHighlight && (
        <foreignObject x={-158} y={-9} width={14} height={14}>
          <Trophy className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
        </foreignObject>
      )}
      <text
        x={-6}
        y={4}
        textAnchor="end"
        fontSize={11}
        fontWeight={datum.isHighlight ? 700 : 500}
        fill={datum.isHighlight ? '#92400e' : '#334155'}
      >
        {label}
      </text>
    </g>
  );
}

type TooltipDatum = {
  payload?: ChartDatum;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipDatum[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-md px-3 py-2 text-xs space-y-1.5 min-w-[220px]">
      <p className="font-semibold text-slate-900 leading-tight">{d.fullName}</p>
      <div className="flex items-center justify-between gap-3 text-slate-600">
        <span>Kỳ này</span>
        <span className="font-bold tabular-nums text-slate-900">
          {d.actualDisplay} <span className="text-[10px] font-normal text-slate-500">({d.actualPct}%)</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-slate-600">
        <span>Kỳ trước</span>
        <span className="tabular-nums">
          {d.previousDisplay} <span className="text-[10px] text-slate-400">({d.previousPct}%)</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-slate-600 border-t border-slate-100 pt-1">
        <span>Mục tiêu</span>
        <span className="tabular-nums">{d.targetDisplay}</span>
      </div>
      {d.topCode && (
        <div className="text-[10px] text-slate-500 pt-1">
          Top đề án: <span className="font-mono">{d.topCode}</span>
        </div>
      )}
      <p className="text-[10px] text-blue-700 pt-1">→ Click để xem chi tiết</p>
    </div>
  );
}
