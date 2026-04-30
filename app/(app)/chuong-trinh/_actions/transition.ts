'use server';

// transitionCycle — authoritative state machine transition.
// PITFALLS R3 mitigation: validates canTransitionCycle + validateGuards BEFORE update.
// CLOSED → OPEN re-open is delegated to extendCycle (caller must use Gia hạn flow).

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import {
  CYCLE_STATUS_LABELS,
  PROGRAM_CYCLE_STATUSES,
  canTransitionCycle,
  validateGuards,
  type ProgramCycleStatus,
} from '@/lib/workflows/programCycle';

const STATUS_ENUM = z.enum(
  PROGRAM_CYCLE_STATUSES as readonly string[] as readonly [string, ...string[]],
);

export const transitionInputSchema = z.object({
  cycleId: z.string().min(1, 'Mã chu kỳ không hợp lệ'),
  target: STATUS_ENUM,
  reason: z.string().trim().max(1000, 'Lý do tối đa 1000 ký tự').optional(),
});

export type TransitionInput = z.input<typeof transitionInputSchema>;

export type TransitionResult = {
  id: string;
  fromStatus: ProgramCycleStatus;
  toStatus: ProgramCycleStatus;
};

async function transitionCycleImpl(input: TransitionInput): Promise<TransitionResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'update'))) {
    throw new Error('Bạn không có quyền chuyển trạng thái chu kỳ chương trình');
  }

  const result = transitionInputSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error('Dữ liệu không hợp lệ: ' + (first?.message ?? 'lỗi không xác định'));
  }
  const { cycleId, target } = result.data;
  const targetStatus = target as ProgramCycleStatus;

  const cycle = await prisma.programCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    throw new Error('Không tìm thấy chu kỳ chương trình');
  }

  const fromStatus = cycle.status as ProgramCycleStatus;

  // Special case: re-open via this action is rejected — caller must use extendCycle (Gia hạn)
  if (
    fromStatus === 'CLOSED_REGISTRATION' &&
    targetStatus === 'OPEN_REGISTRATION'
  ) {
    throw new Error('Vui lòng dùng chức năng Gia hạn để mở lại cổng đăng ký');
  }

  // Authoritative transition table check
  if (!canTransitionCycle(fromStatus, targetStatus)) {
    throw new Error(
      `Không thể chuyển từ "${CYCLE_STATUS_LABELS[fromStatus]}" sang "${CYCLE_STATUS_LABELS[targetStatus]}"`,
    );
  }

  // Domain guards (vd: phải có công văn ban hành trước khi mở cổng)
  const guard = validateGuards(
    {
      status: fromStatus,
      invitationLetterAttachmentId: cycle.invitationLetterAttachmentId,
      registrationOpenAt: cycle.registrationOpenAt,
      registrationCloseAt: cycle.registrationCloseAt,
      totalBudget: cycle.totalBudget,
    },
    targetStatus,
  );
  if (!guard.ok) {
    throw new Error(guard.reason ?? 'Không thể chuyển trạng thái — vui lòng kiểm tra cấu hình');
  }

  await prisma.programCycle.update({
    where: { id: cycleId },
    data: { status: targetStatus },
  });

  revalidatePath('/chuong-trinh');
  revalidatePath('/chuong-trinh/' + cycleId);

  return { id: cycleId, fromStatus, toStatus: targetStatus };
}

export const transitionCycle = withAuditLog<[TransitionInput], TransitionResult>(
  {
    action: 'TRANSITION',
    resource: 'chuong-trinh',
    resourceIdFromArgs: ([input]) => input?.cycleId ?? null,
    captureBefore: async ([input]) => {
      if (!input?.cycleId) return null;
      const c = await prisma.programCycle.findUnique({
        where: { id: input.cycleId },
        select: { id: true, status: true },
      });
      return c ? { status: c.status } : null;
    },
    captureAfter: (r, [input]) => ({
      from: r.fromStatus,
      to: r.toStatus,
      reason: input?.reason ?? null,
    }),
  },
  transitionCycleImpl,
);
