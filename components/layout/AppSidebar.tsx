import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { getMenuItems } from '@/lib/permissions';
import { ROLE_LABELS, type Role } from '@/lib/constants';
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
  const businessItems = items.filter((i) => i.section === 'NGHIEP_VU');
  const adminItems = items.filter((i) => i.section === 'QUAN_TRI');

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-2"
          aria-label="Trang chủ XTTMQG"
        >
          <span className="text-lg font-bold text-blue-700">XTTMQG</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {businessItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Nghiệp vụ</SidebarGroupLabel>
            <SidebarMenu>
              {businessItems.map((item) => (
                <SidebarMenuItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-slate-500">
          <div className="font-semibold text-slate-700 truncate">
            {user.fullName}
          </div>
          <div className="truncate text-slate-500">
            {ROLE_LABELS[user.role]}
            {user.organizationName ? ` · ${user.organizationName}` : ''}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
