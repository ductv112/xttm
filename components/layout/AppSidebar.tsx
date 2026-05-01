import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  getMenuItems,
  MENU_GROUP_ORDER,
  MENU_GROUP_LABELS,
  type MenuGroup,
} from '@/lib/permissions';
import { type Role } from '@/lib/constants';
import { SidebarMenuItem } from './SidebarMenuItem';

type Props = {
  user: {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationName: string | null;
  };
};

export function AppSidebar({ user }: Props) {
  const items = getMenuItems(user.role);

  // Group items by `group` field, preserving original ordering inside group.
  const itemsByGroup = MENU_GROUP_ORDER.reduce<
    Record<MenuGroup, typeof items>
  >(
    (acc, group) => {
      acc[group] = items.filter((i) => i.group === group);
      return acc;
    },
    {
      TONG_QUAN: [],
      NGHIEP_VU: [],
      BAO_CAO_AUDIT: [],
      QUAN_TRI: [],
    },
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 min-w-0"
            aria-label="Trang chủ XTTMQG"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold shrink-0">
              X
            </span>
            <span className="text-base font-bold tracking-tight text-primary truncate group-data-[collapsible=icon]:hidden">
              XTTMQG
            </span>
          </Link>
          <SidebarTrigger
            aria-label="Thu gọn / mở rộng thanh điều hướng"
            className="text-slate-500 hover:text-primary hover:bg-slate-100 shrink-0"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {MENU_GROUP_ORDER.map((group) => {
          const groupItems = itemsByGroup[group];
          if (groupItems.length === 0) return null;
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {MENU_GROUP_LABELS[group]}
              </SidebarGroupLabel>
              <SidebarMenu>
                {groupItems.map((item) => (
                  <SidebarMenuItem key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
