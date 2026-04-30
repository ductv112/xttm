// Create user — server-side RBAC + load orgs, then render client form.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { can, defaultLandingPath } from '@/lib/permissions';
import { type Role } from '@/lib/constants';
import { listOrganizationsForSelect } from '../_actions/list';
import { CreateUserClient } from './_client';

export const metadata = { title: 'Tạo người dùng mới' };

export default async function CreateUserPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'create')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  const orgs = await listOrganizationsForSelect();

  return <CreateUserClient orgs={orgs} />;
}
