'use client';

import {
  Wallet,
  Rocket,
  Handshake,
  TrendingUp,
  Users,
  Star,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { HeroKpi, KpiTone } from '../_data/mock-kpi';

const ICON_MAP: Record<HeroKpi['icon'], LucideIcon> = {
  wallet: Wallet,
  rocket: Rocket,
  handshake: Handshake,
  'trending-up': TrendingUp,
  users: Users,
  star: Star,
};

const BORDER_TONE: Record<KpiTone, string> = {
  default: 'border-l-slate-400',
  success: 'border-l-emerald-600',
  warning: 'border-l-amber-500',
  danger: 'border-l-red-600',
  info: 'border-l-blue-700',
};

const ICON_TONE: Record<KpiTone, string> = {
  default: 'text-slate-600',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  info: 'text-blue-700',
};

const VALUE_TONE: Record<KpiTone, string> = {
  default: 'text-slate-900',
  success: 'text-emerald-800',
  warning: 'text-amber-800',
  danger: 'text-red-800',
  info: 'text-blue-800',
};

const DECOR_TONE: Record<KpiTone, string> = {
  default: 'text-slate-400',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-blue-600',
};

const GRADIENT_TONE: Record<KpiTone, string> = {
  default: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100/70',
  success: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-200/60',
  warning: 'bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-200/60',
  danger: 'bg-gradient-to-br from-red-50 via-white to-red-200/60',
  info: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-200/60',
};

const DELTA_COLOR: Record<HeroKpi['direction'], string> = {
  up: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
  down: 'text-red-700 bg-red-50 ring-red-200',
  flat: 'text-slate-600 bg-slate-50 ring-slate-200',
};

type Props = {
  items: HeroKpi[];
  onSelect: (kpiId: string) => void;
};

export function HeroKpiRow({ items, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {items.map((kpi) => {
        const Icon = ICON_MAP[kpi.icon];
        return (
          <button
            key={kpi.id}
            type="button"
            onClick={() => onSelect(kpi.linkedKpiId)}
            aria-label={`Xem chi tiết ${kpi.label}`}
            className={cn(
              'group card-elevated relative overflow-hidden p-5 border-l-4',
              'min-h-[170px] flex flex-col text-left',
              'transition-transform hover:-translate-y-0.5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 rounded-lg',
              BORDER_TONE[kpi.tone],
              GRADIENT_TONE[kpi.tone],
            )}
          >
            <Icon
              className={cn('card-decorative-icon h-14 w-14', DECOR_TONE[kpi.tone])}
              aria-hidden="true"
              strokeWidth={1.5}
            />
            <div className="relative flex items-start justify-between gap-3 flex-1">
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {kpi.label}
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold mt-2 break-words tracking-tight',
                    VALUE_TONE[kpi.tone],
                  )}
                >
                  {kpi.value}
                </p>
                <p className="text-xs font-medium text-slate-700 mt-2 leading-relaxed">
                  {kpi.subtitle}
                </p>
                <span
                  className={cn(
                    'inline-flex items-center mt-3 self-start px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1',
                    DELTA_COLOR[kpi.direction],
                  )}
                >
                  {kpi.delta}
                </span>
              </div>
              <div className="shrink-0 relative z-10">
                <Icon className={cn('h-8 w-8', ICON_TONE[kpi.tone])} aria-hidden="true" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
