// /hop-dong/[id] — Phase 8 Plan 08-01 Task 2.

import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

import { getContractDetail } from '../_actions/get-detail';
import { ContractDetailHeader } from './_components/ContractDetailHeader';
import { ContractTabsShell } from './_components/ContractTabsShell';

export const metadata = { title: 'Chi tiết hợp đồng' };

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  const { id } = await params;
  const contract = await getContractDetail(id);
  if (!contract) notFound();

  const canUpdate = await canFromDB(role, 'hop-dong', 'update');

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <ContractDetailHeader contract={contract} canUpdate={canUpdate} />
      <div className="mt-6">
        <ContractTabsShell contract={contract} canUpdate={canUpdate} />
      </div>
    </main>
  );
}
