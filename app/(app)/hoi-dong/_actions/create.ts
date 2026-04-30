'use server';

// createCouncil — BQL tạo hội đồng thẩm định mới trong chu kỳ active.
// Audit: COUNCIL_CREATE × 'tham-dinh'.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import type { Role } from '@/lib/constants';

export type CreateCouncilInput = {
  name: string;
  term: string; // 'Lần 1' | 'Lần 2' | ...
  programCycleId?: string; // optional override; defaults to active cycle
};

export type CreateCouncilResult = {
  id: string;
  name: string;
  term: string;
};

async function createCouncilImpl(
  input: CreateCouncilInput,
): Promise<CreateCouncilResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'create'))) {
    throw new Error('Bạn không có quyền tạo hội đồng thẩm định');
  }

  const name = input.name?.trim();
  const term = input.term?.trim();
  if (!name || name.length < 5) {
    throw new Error('Tên hội đồng tối thiểu 5 ký tự');
  }
  if (!term || term.length < 2) {
    throw new Error('Vui lòng nhập kỳ thẩm định (vd: Lần 1)');
  }

  let cycleId = input.programCycleId;
  if (!cycleId) {
    const activeCycle = await prisma.programCycle.findFirst({
      where: {
        status: {
          in: ['EVALUATING', 'CLOSED_REGISTRATION', 'OPEN_REGISTRATION'],
        },
      },
      orderBy: { year: 'desc' },
      select: { id: true },
    });
    if (!activeCycle) {
      throw new Error(
        'Không có chu kỳ chương trình đang mở/thẩm định để tạo hội đồng',
      );
    }
    cycleId = activeCycle.id;
  } else {
    const cycle = await prisma.programCycle.findUnique({
      where: { id: cycleId },
      select: { id: true },
    });
    if (!cycle) {
      throw new Error('Không tìm thấy chu kỳ chương trình');
    }
  }

  const created = await prisma.evaluationCouncil.create({
    data: {
      programCycleId: cycleId,
      name,
      term,
      status: 'OPEN',
      lockStatus: 'OPEN',
      openAt: new Date(),
      createdById: session.user.id,
    },
    select: { id: true, name: true, term: true },
  });

  revalidatePath('/hoi-dong');
  return created;
}

export const createCouncil = withAuditLog<
  [CreateCouncilInput],
  CreateCouncilResult
>(
  {
    action: 'CREATE',
    resource: 'tham-dinh',
    resourceIdFromResult: (r) => r.id,
    captureAfter: (r) => ({ id: r.id, name: r.name, term: r.term }),
    metadata: { reason: 'BQL tạo hội đồng thẩm định' },
  },
  createCouncilImpl,
);
