// /chuong-trinh/[id]/cong-van — tab Công văn.
// RSC: load cycle (with attachment), pre-compute canEdit. Render CongVanUploadTab.

import { notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

import { getCycleDetail } from '../../_actions/get-detail';
import { CongVanUploadTab } from '../_components/CongVanUploadTab';

export default async function CongVanTabPage({
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

  return <CongVanUploadTab cycle={cycle} canEdit={canEdit} />;
}
