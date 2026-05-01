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
          'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
          isActive &&
            'bg-primary/8 text-primary font-semibold hover:bg-primary/10 hover:text-primary',
          isActive &&
            "before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-primary",
        )}
      >
        <Link href={item.href}>
          <Icon
            className={cn(
              'h-5 w-5 shrink-0 transition-colors',
              isActive ? 'text-primary' : 'text-slate-500',
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
