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

type IconComponent = React.ComponentType<{ className?: string }>;

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
          'gap-2',
          isActive &&
            'bg-blue-50 text-blue-700 border-l-2 border-l-blue-700 font-semibold',
        )}
      >
        <Link href={item.href}>
          <Icon className="h-4 w-4" />
          <span className="text-sm">{item.label}</span>
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
