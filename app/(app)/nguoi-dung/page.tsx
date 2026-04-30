// User management list page — admin-only RSC.
// Defense-in-depth RBAC: middleware + RSC redirect + server action throw.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { auth } from '@/lib/auth';
import { can, defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { listUsers, listOrganizationsForSelect } from './_actions/list';
import type { ListUsersFilter } from './_actions/schemas';
import { UserFilterBar } from './_components/UserFilterBar';
import { UserTable } from './_components/UserTable';

export const metadata = { title: 'Quản lý người dùng' };

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  roles?: string;
  orgs?: string;
  status?: string;
  page?: string;
}>;

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'read')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  const sp = await searchParams;

  const filter: ListUsersFilter = {
    keyword: sp.q || undefined,
    roles: sp.roles ? sp.roles.split(',').filter(Boolean) : undefined,
    organizationIds: sp.orgs ? sp.orgs.split(',').filter(Boolean) : undefined,
    status:
      sp.status === 'active' || sp.status === 'locked' ? sp.status : 'all',
  };

  const pageIndex = Math.max(0, Number(sp.page ?? '0') || 0);

  const [initial, orgs] = await Promise.all([
    listUsers(filter, pageIndex, PAGE_SIZE),
    listOrganizationsForSelect(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý tài khoản và phân quyền cho 7 vai trò trong hệ thống
          </p>
        </div>
        <Button asChild>
          <Link href="/nguoi-dung/new">
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Tạo người dùng
          </Link>
        </Button>
      </header>

      <UserFilterBar orgs={orgs} />

      <UserTable
        initialFilter={filter}
        initialPageIndex={pageIndex}
        initialData={initial}
        orgs={orgs}
        currentUserId={session.user.id}
      />
    </div>
  );
}
