'use server';

// copyFromPrevious — clone an APPROVED+ previous-year project as a NEW DRAFT.
// PROJ-13.
// Behavior:
//   - Read source project (verify ownership)
//   - Find/use the active OPEN_REGISTRATION program cycle as the target cycle
//   - Create new DRAFT with prefilled name + " (sao chép)" suffix, kind, generalInfo
//     (without timeRange — that's specific to the year), objectives, plan, budget
//   - DO NOT copy: parentProjectId, submittedAt, status, version
//
// User then can edit name + year + nội dung specific in the wizard.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  parseBudget,
  parseGeneralInfo,
  parseObjectives,
  parsePlan,
} from '@/lib/workflows/project';
import { removeDiacritics } from '@/lib/vi-search';

export type CopyFromPreviousResult = {
  id: string;
  code: string;
  name: string;
};

async function copyFromPreviousImpl(
  sourceProjectId: string,
): Promise<CopyFromPreviousResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  // Source must be owner + APPROVED+
  const source = await prisma.project.findUnique({
    where: { id: sourceProjectId },
  });
  if (!source || source.deletedAt) {
    throw new Error('Không tìm thấy đề án nguồn');
  }
  if (source.organizationId !== orgId) {
    throw new Error('Bạn không có quyền sao chép đề án này');
  }
  const eligible = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'];
  if (!eligible.includes(source.status)) {
    throw new Error(
      'Chỉ được sao chép từ đề án đã được phê duyệt hoặc nghiệm thu',
    );
  }

  // Target cycle = active OPEN_REGISTRATION
  const activeCycle = await prisma.programCycle.findFirst({
    where: { status: 'OPEN_REGISTRATION' },
    orderBy: { year: 'desc' },
  });
  if (!activeCycle) {
    throw new Error('Hiện không có chu kỳ chương trình nào đang mở đăng ký');
  }

  // Org profile gating
  const orgProfile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
    select: { status: true },
  });
  if (!orgProfile || orgProfile.status !== 'APPROVED') {
    throw new Error('Hồ sơ đơn vị chưa được phê duyệt');
  }

  // Strip year-specific data from generalInfo (timeRange is year-specific)
  const sourceGeneralInfo = parseGeneralInfo(source.generalInfoJson);
  const newGeneralInfo = {
    ...sourceGeneralInfo,
    timeRange: null,
    isTwoYear: false,
    nextYear: null,
  };

  const objectives = parseObjectives(source.objectivesJson);
  const plan = parsePlan(source.planJson);
  const budget = parseBudget(source.budgetJson);

  const newName = `${source.name} (sao chép)`;
  // Generate new code using activeCycle.year
  const count = await prisma.project.count({ where: { year: activeCycle.year } });
  const code = `XTTM-${activeCycle.year}-${(count + 1).toString().padStart(3, '0')}`;

  const created = await prisma.project.create({
    data: {
      code,
      name: newName,
      year: activeCycle.year,
      kind: source.kind,
      status: 'DRAFT',
      programCycleId: activeCycle.id,
      organizationId: orgId,
      generalInfoJson: JSON.stringify(newGeneralInfo),
      objectivesJson: JSON.stringify(objectives),
      planJson: JSON.stringify(plan),
      budgetJson: JSON.stringify(budget),
      pmContactId: source.pmContactId,
      proposedBudget: typeof budget.total === 'number' ? budget.total : null,
      searchKey: removeDiacritics(`${newName} ${source.kind}`),
      createdById: session.user.id,
    },
    select: { id: true, code: true, name: true },
  });

  revalidatePath('/de-an');
  revalidatePath(`/de-an/${created.id}`);

  return created;
}

export const copyFromPrevious = withAuditLog<[string], CopyFromPreviousResult>(
  {
    action: 'CREATE',
    resource: 'de-an',
    resourceIdFromResult: (r) => r?.id ?? null,
    captureAfter: (r) => ({ code: r.code, name: r.name, copiedFromProjectId: 'see-args' }),
  },
  copyFromPreviousImpl,
);
