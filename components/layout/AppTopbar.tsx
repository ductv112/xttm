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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
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
