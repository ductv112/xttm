import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { type Role } from '@/lib/constants';
import { AppBreadcrumb } from './AppBreadcrumb';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';

type Props = {
  user: {
    id: string;
    fullName: string;
    role: Role;
    organizationName: string | null;
  };
};

export function AppTopbar({ user }: Props) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b-2 border-primary/20 bg-gradient-to-r from-white via-blue-50/30 to-white backdrop-blur supports-[backdrop-filter]:from-white/85 supports-[backdrop-filter]:via-blue-50/40 supports-[backdrop-filter]:to-white/85 px-4 md:px-6 shadow-[0_1px_0_0_rgb(30_58_138_/_0.04)]"
    >
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger
          className="md:hidden"
          aria-label="Mở rộng thanh điều hướng"
        />
        <AppBreadcrumb />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <NotificationBell />
        <Separator orientation="vertical" className="h-6" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
