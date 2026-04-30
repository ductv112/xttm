'use client';

import * as React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { StatCardProps, StatCardTone } from './types';

const ICON_TONE: Record<StatCardTone, string> = {
  default: 'text-slate-400',
  success: 'text-green-600',
  warning: 'text-amber-500',
  danger: 'text-red-600',
  info: 'text-blue-700',
};

const VALUE_TONE: Record<StatCardTone, string> = {
  default: 'text-slate-900',
  success: 'text-green-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  info: 'text-blue-700',
};

/**
 * StatCard — render label + value + optional icon/trend/subtitle.
 *
 * Dùng cho 4-card grid trên Tab Tổng quan (Plan 03-06):
 *   số đề án, tổng kinh phí, đơn vị mời, ngày còn lại.
 *
 * Caller responsibility: format number (use formatVNDCompact / formatNumber)
 * trước khi pass — StatCard chỉ auto-format raw number qua formatNumber làm
 * convenience fallback.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  subtitle,
  trend,
  className,
}: StatCardProps) {
  const formattedValue = typeof value === 'number' ? formatNumber(value) : value;

  const trendIconClass =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
        ? 'text-red-600'
        : 'text-slate-500';

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-6 flex items-start justify-between gap-4',
        className,
      )}
    >
      <div className="flex flex-col min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        <p className={cn('text-2xl font-bold mt-2 break-words', VALUE_TONE[tone])}>
          {formattedValue}
        </p>
        {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        {trend ? (
          <div className={cn('flex items-center gap-1 mt-2', trendIconClass)}>
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-sm">{trend.label}</span>
          </div>
        ) : null}
      </div>

      {Icon ? (
        <div className="shrink-0">
          <Icon className={cn('h-8 w-8', ICON_TONE[tone])} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}

export default StatCard;
