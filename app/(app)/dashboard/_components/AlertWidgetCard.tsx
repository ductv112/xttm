// AlertWidgetCard — generic alert widget with icon + count + top items + drill-down.
// Tone-coded border + icon + decorative bg icon. Used cho 4 widgets: budget
// variance, contract delay, report overdue, consulate.

import { ArrowRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type AlertTone = 'danger' | 'warning' | 'info';

type AlertItem = {
  code: string;
  name: string;
  detail: string;
  href?: string;
};

type Props = {
  title: string;
  icon: LucideIcon;
  tone: AlertTone;
  count: number;
  items: AlertItem[];
  drillDownHref: string;
  emptyText?: string;
};

const TONE_STYLES: Record<
  AlertTone,
  {
    border: string;
    iconBg: string;
    iconColor: string;
    badge: string;
    decor: string;
  }
> = {
  danger: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
    decor: 'text-red-500',
  },
  warning: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800',
    decor: 'text-amber-500',
  },
  info: {
    border: 'border-l-blue-600',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    decor: 'text-blue-600',
  },
};

export function AlertWidgetCard({
  title,
  icon: Icon,
  tone,
  count,
  items,
  drillDownHref,
  emptyText = 'Không có cảnh báo',
}: Props) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        'group card-elevated relative overflow-hidden border-l-4 p-5 flex flex-col h-full',
        styles.border,
      )}
    >
      <Icon
        className={cn(
          'card-decorative-icon h-24 w-24',
          styles.decor,
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('p-2 rounded-md', styles.iconBg, styles.iconColor)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {title}
            </h3>
            <span
              className={cn(
                'inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                styles.badge,
              )}
            >
              {count} cảnh báo
            </span>
          </div>
        </div>
      </div>

      <ul className="relative mt-4 flex-1 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500 italic py-2">{emptyText}</li>
        ) : (
          items.slice(0, 3).map((item, idx) => (
            <li key={`${item.code}-${idx}`} className="text-sm">
              {item.href ? (
                <Link
                  href={item.href}
                  className="block px-2 py-1.5 -mx-2 rounded hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-slate-500 shrink-0">
                      {item.code}
                    </span>
                    <span className="font-medium text-slate-900 truncate flex-1">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {item.detail}
                  </div>
                </Link>
              ) : (
                <div className="px-2 py-1.5 -mx-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-slate-500 shrink-0">
                      {item.code}
                    </span>
                    <span className="font-medium text-slate-900 truncate flex-1">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {item.detail}
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      <Link
        href={drillDownHref}
        className="relative mt-4 pt-3 border-t border-slate-100 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        Xem tất cả
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
