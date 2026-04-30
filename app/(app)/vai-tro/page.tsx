// Vai trò & Phân quyền — admin-only RSC.
// Defense-in-depth RBAC: middleware + RSC redirect + server action throw.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { can, defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listRoles, listMatrix } from './_actions/list';
import { VaiTroPageShell } from './_components/VaiTroPageShell';

export const metadata = { title: 'Vai trò & Phân quyền' };

export default async function VaiTroPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'read')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  const [roles, matrix] = await Promise.all([listRoles(), listMatrix()]);

  return <VaiTroPageShell initialRoles={roles} initialMatrix={matrix} />;
}
