// /chuong-trinh/[id]/don-vi-moi — tab Đơn vị mời + thông báo.
// RSC: load cycle + all organizations (for MultiSelect picker), pre-compute canEdit.

import { notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/constants';

import { getCycleDetail } from '../../_actions/get-detail';
import { DonViMoiManager } from '../_components/DonViMoiManager';

export default async function DonViMoiTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let cycle;
  try {
    cycle = await getCycleDetail(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const role = (session?.user?.role ?? '') as Role;
  const canEdit = await canFromDB(role, 'chuong-trinh', 'update');

  const allOrganizations = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  return (
    <DonViMoiManager
      cycle={cycle}
      allOrganizations={allOrganizations}
      canEdit={canEdit}
    />
  );
}
