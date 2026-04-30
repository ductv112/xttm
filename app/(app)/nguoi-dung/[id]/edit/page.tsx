// Edit user — server-side RBAC + fetch user + orgs, then render client form.

import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { can, defaultLandingPath } from '@/lib/permissions';
import { type Role } from '@/lib/constants';
import {
  getUserById,
  listOrganizationsForSelect,
} from '../../_actions/list';
import { EditUserClient } from './_client';

export const metadata = { title: 'Chỉnh sửa người dùng' };

type Params = Promise<{ id: string }>;

export default async function EditUserPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  const { id } = await params;
  const [user, orgs] = await Promise.all([
    getUserById(id),
    listOrganizationsForSelect(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <EditUserClient
      user={user}
      orgs={orgs}
      isSelf={user.id === session.user.id}
    />
  );
}
