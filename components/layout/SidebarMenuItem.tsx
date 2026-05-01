'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import {
  SidebarMenuButton,
  SidebarMenuItem as ShadSidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/lib/permissions';

type Props = { item: MenuItem };

type IconComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

export function SidebarMenuItem({ item }: Props) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + '/');
  const iconRegistry = Icons as unknown as Record<string, IconComponent>;
  const Icon: IconComponent = iconRegistry[toPascal(item.icon)] ?? Icons.Circle;

  return (
    <ShadSidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className={cn(
          'relative h-auto gap-3 px-3 py-2.5 text-sm transition-colors duration-150',
          // Resting state — light slate text on navy background
          'text-slate-200 hover:bg-sidebar-accent hover:text-white',
          // Active — GOLD accent (amber-500) with navy text
          isActive &&
            'bg-amber-500 text-slate-900 font-semibold shadow-sm hover:bg-amber-500 hover:text-slate-900',
          isActive &&
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-r before:bg-amber-300",
        )}
      >
        <Link href={item.href}>
          <Icon
            className={cn(
              'h-5 w-5 shrink-0 transition-colors',
              isActive
                ? 'text-slate-900'
                : 'text-amber-300/70 group-hover/menu-item:text-amber-300',
            )}
            strokeWidth={2}
          />
          <span className="truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </ShadSidebarMenuItem>
  );
}

function toPascal(kebab: string): string {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}
