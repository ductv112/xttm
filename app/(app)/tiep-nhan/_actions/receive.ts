'use server';

// receiveProject — BQL tiếp nhận hồ sơ. SUBMITTED → ASSIGNED.
// (Tạm thời lưu trạng thái ASSIGNED nhưng chưa gán chuyên viên — workflow tiếp:
//  ASSIGNED + assignedToUserId=null → LĐ phân công ở /phan-cong → assignedToUserId=...
//  Khi phân công xong tự transition sang IN_REVIEW.)
// Bulk receive supported via receiveProjects(ids[]).
// Audit: TRANSITION × 'tiep-nhan'.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionProject,
  type ProjectStatus,
} from '@/lib/workflows/project';
import type { Role } from '@/lib/constants';

export type ReceiveProjectResult = {
  id: string;
  code: string;
  status: ProjectStatus;
  receivedAt: Date;
};

async function receiveProjectImpl(
  projectId: string,
): Promise<ReceiveProjectResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  // 'tiep-nhan' update is the receive operation
  if (!(await canFromDB(role, 'tiep-nhan', 'update'))) {
    throw new Error('Bạn không có quyền tiếp nhận hồ sơ');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      status: true,
      deletedAt: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }

  // Idempotency: nếu đã ASSIGNED rồi mà chưa có chuyên viên thì coi như đã tiếp nhận
  if (project.status === 'ASSIGNED') {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, code: true, status: true, receivedAt: true },
    });
    return {
      id: existing!.id,
      code: existing!.code,
      status: existing!.status as ProjectStatus,
      receivedAt: existing!.receivedAt ?? new Date(),
    };
  }

  if (
    project.status !== 'SUBMITTED' &&
    project.status !== 'RESUBMITTED'
  ) {
    throw new Error(
      'Chỉ có thể tiếp nhận đề án đang ở trạng thái "Đã nộp" hoặc "Đã nộp lại"',
    );
  }

  // RESUBMITTED → IN_REVIEW (chuyên viên đã được gán → xem lại trực tiếp)
  // SUBMITTED   → ASSIGNED (BQL tiếp nhận, chờ phân công)
  const targetStatus: ProjectStatus =
    project.status === 'RESUBMITTED' ? 'IN_REVIEW' : 'ASSIGNED';

  if (!canTransitionProject(project.status as ProjectStatus, targetStatus)) {
    throw new Error('Chuyển trạng thái không được phép');
  }

  const now = new Date();
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: targetStatus,
      receivedAt: now,
    },
    select: { id: true, code: true, status: true, receivedAt: true },
  });

  revalidatePath('/tiep-nhan');
  revalidatePath('/phan-cong');
  revalidatePath(`/de-an/${project.id}`);

  return {
    id: updated.id,
    code: updated.code,
    status: updated.status as ProjectStatus,
    receivedAt: updated.receivedAt ?? now,
  };
}

export const receiveProject = withAuditLog<[string], ReceiveProjectResult>(
  {
    action: 'TRANSITION',
    resource: 'tiep-nhan',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      status: r.status,
      transition: `→ ${r.status}`,
      receivedAt: r.receivedAt,
    }),
    metadata: { reason: 'BQL tiếp nhận hồ sơ' },
  },
  receiveProjectImpl,
);

/** Bulk wrapper — sequentially calls receiveProject. Returns per-id outcome. */
export async function receiveProjects(
  ids: string[],
): Promise<{ id: string; ok: boolean; error?: string }[]> {
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await receiveProject(id);
      results.push({ id, ok: true });
    } catch (e) {
      results.push({
        id,
        ok: false,
        error: e instanceof Error ? e.message : 'Lỗi không xác định',
      });
    }
  }
  return results;
}
