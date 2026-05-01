'use client';

import * as React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { StatCardProps, StatCardTone } from './types';

const ICON_TONE: Record<StatCardTone, string> = {
  default: 'text-slate-500',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  info: 'text-blue-700',
};

const VALUE_TONE: Record<StatCardTone, string> = {
  default: 'text-slate-900',
  success: 'text-emerald-800',
  warning: 'text-amber-800',
  danger: 'text-red-800',
  info: 'text-blue-800',
};

const BORDER_TONE: Record<StatCardTone, string> = {
  default: 'border-l-slate-400',
  success: 'border-l-emerald-600',
  warning: 'border-l-amber-500',
  danger: 'border-l-red-600',
  info: 'border-l-blue-700',
};

const DECOR_TONE: Record<StatCardTone, string> = {
  default: 'text-slate-400',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-blue-600',
};

// Tone-matched gradient backgrounds — saturated for stronger visual presence
const GRADIENT_TONE: Record<StatCardTone, string> = {
  default:
    'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100/70',
  success:
    'bg-gradient-to-br from-emerald-50 via-white to-emerald-200/60',
  warning:
    'bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-200/60',
  danger: 'bg-gradient-to-br from-red-50 via-white to-red-200/60',
  info: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-200/60',
};

/**
 * StatCard — render label + value + optional icon/trend/subtitle.
 *
 * National Pride 2026 styling: white card, soft radial gradient, decorative
 * background icon (top-right, opacity-6%, rotates+scales on hover), left
 * accent border tinted by tone, lift on hover.
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
      ? 'text-emerald-600'
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
        'group card-elevated relative overflow-hidden p-6 border-l-4 h-full min-h-[160px] flex flex-col',
        BORDER_TONE[tone],
        GRADIENT_TONE[tone],
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            'card-decorative-icon h-24 w-24',
            DECOR_TONE[tone],
          )}
          aria-hidden="true"
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-4 flex-1">
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p
            className={cn(
              'text-3xl font-bold mt-2 break-words tracking-tight',
              VALUE_TONE[tone],
            )}
          >
            {formattedValue}
          </p>
          {subtitle ? (
            <p className="text-sm text-slate-500 mt-auto pt-2">{subtitle}</p>
          ) : null}
          {trend ? (
            <div className={cn('flex items-center gap-1 mt-2', trendIconClass)}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-sm">{trend.label}</span>
            </div>
          ) : null}
        </div>

        {Icon ? (
          <div className="shrink-0 relative z-10">
            <Icon
              className={cn('h-9 w-9', ICON_TONE[tone])}
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StatCard;
