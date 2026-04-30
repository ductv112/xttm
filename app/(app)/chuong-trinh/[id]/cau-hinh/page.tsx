// /chuong-trinh/[id]/cau-hinh — tab Cấu hình kỳ.
// RSC: load cycle + catalog options (scoring criteria + organizations + email templates)
// then render CauHinhKyForm. Permission canEdit pre-computed for form gating (CYCLE-12).

import { notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/constants';

import { getCycleDetail } from '../../_actions/get-detail';
import { CauHinhKyForm } from '../_components/CauHinhKyForm';

async function loadCatalogOptions() {
  const [scoringCriteria, organizations, emailTemplates] = await Promise.all([
    prisma.scoringCriterion.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, weight: true },
    }),
    prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.documentTemplate.findMany({
      where: { isActive: true, category: 'CONG_VAN_MOI' },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);
  return { scoringCriteria, organizations, emailTemplates };
}

export default async function CauHinhTabPage({
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

  const { scoringCriteria, organizations, emailTemplates } = await loadCatalogOptions();

  return (
    <CauHinhKyForm
      cycle={cycle}
      scoringCriteriaOptions={scoringCriteria}
      organizationOptions={organizations}
      emailTemplateOptions={emailTemplates}
      canEdit={canEdit}
    />
  );
}
