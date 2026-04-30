'use server';

// updateSLAConfig — Plan 02-07 (CONFIG-01)
// T-02-07-01: auth + can(role, 'cau-hinh', 'update') ADMIN only
// T-02-07-03: Zod bounded ranges (1-365 / 1-180 / regex MM-DD)
// withAuditLog: capture before/after diff for /nhat-ky resource='cau-hinh'

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { withAuditLog } from '@/lib/audit';
import { invalidateConfigCache } from '@/lib/system-config';

import { slaParamsSchema, type SLAParamsInput } from './schemas';

export type UpdateSLAResult = {
  key: 'sla.params';
  before: SLAParamsInput | null;
  after: SLAParamsInput;
};

async function updateSLAConfigImpl(
  input: SLAParamsInput,
): Promise<UpdateSLAResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'cau-hinh', 'update')) {
    throw new Error('Bạn không có quyền cập nhật cấu hình hệ thống');
  }

  const parsed = slaParamsSchema.parse(input);

  const existing = await prisma.systemConfig.findUnique({
    where: { key: 'sla.params' },
  });
  let before: SLAParamsInput | null = null;
  if (existing) {
    try {
      before = JSON.parse(existing.valueJson) as SLAParamsInput;
    } catch {
      before = null;
    }
  }

  const valueJson = JSON.stringify(parsed);
  await prisma.systemConfig.upsert({
    where: { key: 'sla.params' },
    update: {
      valueJson,
      updatedById: session.user.id,
      label: 'Tham số cảnh báo SLA',
    },
    create: {
      key: 'sla.params',
      valueJson,
      category: 'SLA',
      label: 'Tham số cảnh báo SLA',
      updatedById: session.user.id,
    },
  });

  invalidateConfigCache();
  revalidatePath('/cau-hinh');

  return { key: 'sla.params', before, after: parsed };
}

export const updateSLAConfig = withAuditLog<
  [SLAParamsInput],
  UpdateSLAResult
>(
  {
    action: 'UPDATE',
    resource: 'cau-hinh',
    resourceIdFromResult: () => 'sla.params',
    captureBefore: async () => {
      const existing = await prisma.systemConfig.findUnique({
        where: { key: 'sla.params' },
      });
      if (!existing) return null;
      try {
        return { key: 'sla.params', value: JSON.parse(existing.valueJson) };
      } catch {
        return null;
      }
    },
    captureAfter: (result) => ({ key: result.key, value: result.after }),
  },
  updateSLAConfigImpl,
);
