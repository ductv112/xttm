'use server';

// extendCycle — CYCLE-10 gia hạn (CLOSED_REGISTRATION → OPEN_REGISTRATION).
// Records reason + newDeadline + appends extension entry into configJson.extensions[].
// audit log captures diff including reason metadata.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import type { ProgramCycleStatus } from '@/lib/workflows/programCycle';

// Internal schema (NOT exported — 'use server' module rule).
const extendInputSchemaInternal = z.object({
  cycleId: z.string().min(1, 'Mã chu kỳ không hợp lệ'),
  reason: z
    .string({ message: 'Vui lòng nhập lý do gia hạn' })
    .trim()
    .min(10, 'Lý do gia hạn tối thiểu 10 ký tự')
    .max(1000, 'Lý do gia hạn tối đa 1000 ký tự'),
  newDeadline: z
    .date({ message: 'Vui lòng chọn ngày hạn mới' })
    .refine((d) => d.getTime() > Date.now(), 'Ngày hạn mới phải sau hôm nay'),
});

export type ExtendInput = z.input<typeof extendInputSchemaInternal>;

export type ExtendResult = {
  id: string;
  newDeadline: Date;
  fromStatus: ProgramCycleStatus;
  toStatus: ProgramCycleStatus;
  autoNotify: boolean;
};

function safeParseConfig(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function getExtensions(config: Record<string, unknown>): Array<Record<string, unknown>> {
  const v = config.extensions;
  return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
}

async function extendCycleImpl(input: ExtendInput): Promise<ExtendResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'update'))) {
    throw new Error('Bạn không có quyền gia hạn chu kỳ chương trình');
  }

  const result = extendInputSchemaInternal.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error('Dữ liệu không hợp lệ: ' + (first?.message ?? 'lỗi không xác định'));
  }
  const { cycleId, reason, newDeadline } = result.data;

  const cycle = await prisma.programCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    throw new Error('Không tìm thấy chu kỳ chương trình');
  }

  if (cycle.status !== 'CLOSED_REGISTRATION') {
    throw new Error('Chỉ có thể gia hạn chu kỳ đã đóng cổng đăng ký');
  }

  // Append extension history entry into configJson
  const config = safeParseConfig(cycle.configJson);
  const extensions = getExtensions(config);
  extensions.push({
    date: new Date().toISOString(),
    reason,
    oldCloseAt: cycle.registrationCloseAt?.toISOString() ?? null,
    newCloseAt: newDeadline.toISOString(),
    extendedById: session.user.id,
  });
  const newConfigJson = JSON.stringify({ ...config, extensions });

  // Determine autoNotify hint — true if any invited orgs already configured
  const invitedOrgs = (() => {
    if (!cycle.invitedOrganizations) return [];
    try {
      const v = JSON.parse(cycle.invitedOrganizations);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  })();
  const autoNotify = invitedOrgs.length > 0;

  await prisma.programCycle.update({
    where: { id: cycleId },
    data: {
      status: 'OPEN_REGISTRATION',
      registrationCloseAt: newDeadline,
      configJson: newConfigJson,
    },
  });

  revalidatePath('/chuong-trinh');
  revalidatePath('/chuong-trinh/' + cycleId);

  return {
    id: cycleId,
    newDeadline,
    fromStatus: 'CLOSED_REGISTRATION',
    toStatus: 'OPEN_REGISTRATION',
    autoNotify,
  };
}

export const extendCycle = withAuditLog<[ExtendInput], ExtendResult>(
  {
    action: 'EXTEND',
    resource: 'chuong-trinh',
    resourceIdFromArgs: ([input]) => input?.cycleId ?? null,
    captureBefore: async ([input]) => {
      if (!input?.cycleId) return null;
      const c = await prisma.programCycle.findUnique({
        where: { id: input.cycleId },
        select: { status: true, registrationCloseAt: true },
      });
      return c ? { status: c.status, registrationCloseAt: c.registrationCloseAt } : null;
    },
    captureAfter: (r, [input]) => ({
      status: r.toStatus,
      registrationCloseAt: r.newDeadline,
      extendReason: input?.reason ?? null,
    }),
  },
  extendCycleImpl,
);
