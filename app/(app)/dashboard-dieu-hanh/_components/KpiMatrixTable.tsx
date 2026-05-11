'use client';

import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { GroupBarChart } from './GroupBarChart';
import { ImpactSection } from './ImpactSection';
import {
  KPI_GROUPS,
  KPI_ROWS,
  type KpiGroupKey,
  type KpiRow,
} from '../_data/mock-kpi';

type GroupAccent = {
  ring: string;
  text: string;
  bg: string;
  chip: string;
};

const DEFAULT_ACCENT: GroupAccent = {
  ring: 'ring-slate-200',
  text: 'text-slate-700',
  bg: 'bg-slate-50',
  chip: 'bg-slate-100 text-slate-800',
};

const GROUP_ACCENT: Record<string, GroupAccent> = {
  indigo: {
    ring: 'ring-indigo-200',
    text: 'text-indigo-700',
    bg: 'bg-indigo-50/60',
    chip: 'bg-indigo-100 text-indigo-800',
  },
  emerald: {
    ring: 'ring-emerald-200',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50/60',
    chip: 'bg-emerald-100 text-emerald-800',
  },
  amber: {
    ring: 'ring-amber-200',
    text: 'text-amber-700',
    bg: 'bg-amber-50/60',
    chip: 'bg-amber-100 text-amber-800',
  },
  sky: {
    ring: 'ring-sky-200',
    text: 'text-sky-700',
    bg: 'bg-sky-50/60',
    chip: 'bg-sky-100 text-sky-800',
  },
  violet: {
    ring: 'ring-violet-200',
    text: 'text-violet-700',
    bg: 'bg-violet-50/60',
    chip: 'bg-violet-100 text-violet-800',
  },
  slate: DEFAULT_ACCENT,
};

// Highlight quan trọng nhất nhóm — hiện trên hàng có icon trophy
const GROUP_HIGHLIGHT: Partial<Record<KpiGroupKey, string>> = {
  C: 'C-03', // ROI: GD/1đ NSNN — chỉ tiêu cốt lõi đánh giá hiệu quả NSNN
};

type Props = {
  onSelectKpi: (kpiId: string) => void;
};

export function KpiMatrixTable({ onSelectKpi }: Props) {
  const rowsByGroup = useMemo(() => {
    const map = new Map<KpiGroupKey, KpiRow[]>();
    for (const r of KPI_ROWS) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return map;
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      {KPI_GROUPS.map((group) => {
        const rows = rowsByGroup.get(group.key) ?? [];
        const accent = GROUP_ACCENT[group.accent] ?? DEFAULT_ACCENT;
        const withAchievement = rows.filter((r) => r.achievement != null);
        const groupAvgAchievement =
          withAchievement.reduce((sum, r) => sum + (r.achievement ?? 0), 0) /
          Math.max(withAchievement.length, 1);

        const isImpact = group.key === 'E';

        return (
          <section
            key={group.key}
            className="card-elevated overflow-hidden bg-white"
          >
            <header
              className={cn(
                'flex items-center gap-3 px-5 py-3 border-b border-slate-100',
                accent.bg,
              )}
            >
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ring-1',
                  accent.chip,
                  accent.ring,
                )}
              >
                {group.key}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className={cn('text-sm font-bold leading-tight', accent.text)}>
                  {group.title}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {group.description}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span className="text-slate-500">{rows.length} chỉ tiêu</span>
                {isImpact ? (
                  <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 ring-1 ring-violet-200 text-[11px] font-semibold">
                    Đo lường xu hướng
                  </span>
                ) : (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">% đạt TB</span>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-sm font-bold tabular-nums ring-1',
                        groupAvgAchievement >= 100
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : groupAvgAchievement >= 70
                          ? 'bg-amber-50 text-amber-700 ring-amber-200'
                          : 'bg-red-50 text-red-700 ring-red-200',
                      )}
                    >
                      {Math.round(groupAvgAchievement)}%
                    </span>
                  </>
                )}
              </div>
            </header>

            {isImpact ? (
              <ImpactSection onSelectKpi={onSelectKpi} />
            ) : (
              <GroupBarChart
                rows={rows}
                onSelectKpi={onSelectKpi}
                highlightId={GROUP_HIGHLIGHT[group.key]}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
