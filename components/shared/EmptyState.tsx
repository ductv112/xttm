'use client';

import * as React from 'react';
import {
  Inbox,
  History,
  FileX,
  Users,
  List,
  Shield,
  Settings,
  LayoutDashboard,
  Search,
  PackageX,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Whitelist of icons usable trong EmptyState.
 *
 * Bundle bloat mitigation (T-02-03-06): chỉ expose 10 icons mà admin pages
 * cần — không cho component caller pull arbitrary lucide icons để giữ
 * tree-shake dễ dự đoán.
 */
const ICON_MAP = {
  inbox: Inbox,
  history: History,
  'file-x': FileX,
  users: Users,
  list: List,
  shield: Shield,
  settings: Settings,
  'layout-dashboard': LayoutDashboard,
  search: Search,
  'package-x': PackageX,
} satisfies Record<string, LucideIcon>;

export type EmptyStateIcon = keyof typeof ICON_MAP;

export type EmptyStateAction = {
  label: string;
  /** Provide either onClick or href, not both */
  onClick?: () => void;
  href?: string;
};

export type EmptyStateProps = {
  icon: EmptyStateIcon;
  heading: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
};

/**
 * Empty state placeholder component theo UI-SPEC §"Empty State Pattern".
 *
 * Layout: vertical centered stack với icon 48px slate-400, heading semibold,
 * description body slate-600 max-w-md, optional CTA button.
 */
export function EmptyState({
  icon,
  heading,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = ICON_MAP[icon];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 text-center',
        className
      )}
      data-slot="empty-state"
    >
      <Icon className="h-12 w-12 text-slate-400" aria-hidden="true" />
      <h3 className="text-base font-semibold text-slate-900">{heading}</h3>
      {description ? (
        <p className="max-w-md text-sm text-slate-600">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-4">
          {action.href ? (
            <Button asChild variant="default">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button variant="default" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;
