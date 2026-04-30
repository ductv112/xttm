import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { type Role } from '@/lib/constants';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';

export type AppUser = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  organizationId: string | null;
  organizationName: string | null;
};

type Props = {
  user: AppUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppTopbar user={user} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-6"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
