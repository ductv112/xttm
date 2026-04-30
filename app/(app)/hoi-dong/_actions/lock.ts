'use server';

// lockCouncil / unlockCouncil — BQL kết thúc (hoặc mở lại) hội đồng.
// Khi LOCKED: không add member, không assign project, không nhận thêm phiếu chấm.
// Audit: COUNCIL_LOCK / COUNCIL_UNLOCK (action TRANSITION × tham-dinh).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import type { Role } from '@/lib/constants';

export type LockCouncilResult = {
  id: string;
  lockStatus: 'OPEN' | 'LOCKED';
  closeAt: Date | null;
};

async function lockCouncilImpl(councilId: string): Promise<LockCouncilResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'create'))) {
    throw new Error('Bạn không có quyền khóa hội đồng');
  }

  const council = await prisma.evaluationCouncil.findUnique({
    where: { id: councilId },
    include: {
      _count: {
        select: { assignments: true, members: true },
      },
    },
  });
  if (!council) {
    throw new Error('Không tìm thấy hội đồng');
  }
  if (council.lockStatus === 'LOCKED') {
    return {
      id: council.id,
      lockStatus: 'LOCKED',
      closeAt: council.closeAt,
    };
  }
  if (council._count.members === 0) {
    throw new Error('Hội đồng chưa có thành viên — không thể khóa');
  }
  if (council._count.assignments === 0) {
    throw new Error('Hội đồng chưa có đề án — không thể khóa');
  }

  // Validate: tất cả phiếu của thành viên đều đã SUBMITTED hoặc đã có ScoreSheet
  // POC simplified: chỉ require ít nhất 1 SUBMITTED scoresheet để cho phép lock
  const submittedCount = await prisma.scoreSheet.count({
    where: { councilId, kind: 'EVALUATION', status: 'SUBMITTED' },
  });
  if (submittedCount === 0) {
    throw new Error(
      'Chưa có phiếu chấm nào được nộp — không thể khóa hội đồng',
    );
  }

  const now = new Date();
  const updated = await prisma.evaluationCouncil.update({
    where: { id: councilId },
    data: {
      lockStatus: 'LOCKED',
      status: 'CLOSED',
      closeAt: now,
    },
    select: { id: true, lockStatus: true, closeAt: true },
  });

  revalidatePath(`/hoi-dong/${councilId}`);
  revalidatePath('/hoi-dong');
  revalidatePath('/tham-dinh');

  return {
    id: updated.id,
    lockStatus: updated.lockStatus as 'LOCKED',
    closeAt: updated.closeAt,
  };
}

export const lockCouncil = withAuditLog<[string], LockCouncilResult>(
  {
    action: 'TRANSITION',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      councilId: r.id,
      lockStatus: r.lockStatus,
      closeAt: r.closeAt,
      kind: 'LOCK',
    }),
    metadata: { reason: 'BQL khóa hội đồng — hoàn tất thẩm định' },
  },
  lockCouncilImpl,
);

// ---------------------------------------------------------------------------

async function unlockCouncilImpl(
  councilId: string,
): Promise<LockCouncilResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'create'))) {
    throw new Error('Bạn không có quyền mở lại hội đồng');
  }

  const updated = await prisma.evaluationCouncil.update({
    where: { id: councilId },
    data: { lockStatus: 'OPEN', status: 'OPEN' },
    select: { id: true, lockStatus: true, closeAt: true },
  });
  revalidatePath(`/hoi-dong/${councilId}`);
  revalidatePath('/hoi-dong');
  return {
    id: updated.id,
    lockStatus: updated.lockStatus as 'OPEN',
    closeAt: updated.closeAt,
  };
}

export const unlockCouncil = withAuditLog<[string], LockCouncilResult>(
  {
    action: 'TRANSITION',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      councilId: r.id,
      lockStatus: r.lockStatus,
      kind: 'UNLOCK',
    }),
    metadata: { reason: 'BQL mở lại hội đồng để chỉnh sửa' },
  },
  unlockCouncilImpl,
);
