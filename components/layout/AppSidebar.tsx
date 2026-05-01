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
      <SidebarHeader className="border-b border-sidebar-border/60 bg-sidebar">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 min-w-0"
            aria-label="Trang chủ XTTMQG"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-500 text-slate-900 text-sm font-bold shrink-0 shadow-sm ring-1 ring-amber-300/40">
              X
            </span>
            <span className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-base font-bold tracking-tight text-white truncate leading-none">
                XTTMQG
              </span>
              <span className="text-[10px] font-medium text-amber-300/80 truncate mt-0.5">
                Cục Xúc tiến Thương mại
              </span>
            </span>
          </Link>
          <SidebarTrigger
            aria-label="Thu gọn / mở rộng thanh điều hướng"
            className="text-amber-300/80 hover:text-amber-300 hover:bg-sidebar-accent shrink-0"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        {MENU_GROUP_ORDER.map((group) => {
          const groupItems = itemsByGroup[group];
          if (groupItems.length === 0) return null;
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-300/70">
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
