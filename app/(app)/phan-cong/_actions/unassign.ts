'use server';

// unassignProject — LĐ BQL thu hồi hồ sơ đã phân công về hàng đợi (INTAKE-04).
// Logic:
//   - Project phải đang IN_REVIEW (chưa qua VALID/SUPPLEMENT_REQUIRED).
//   - Clear assignedReviewerId + assignedAt + assignedById.
//   - Transition IN_REVIEW → ASSIGNED (về lại hàng đợi).
//   - Audit ASSIGN × 'tiep-nhan' với metadata { unassign: true }.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import type { ProjectStatus } from '@/lib/workflows/project';
import type { Role } from '@/lib/constants';

export type UnassignProjectResult = {
  id: string;
  code: string;
  status: ProjectStatus;
};

async function unassignProjectImpl(
  projectId: string,
): Promise<UnassignProjectResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tiep-nhan', 'assign'))) {
    throw new Error('Bạn không có quyền thu hồi phân công');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      status: true,
      assignedReviewerId: true,
      deletedAt: true,
      checklistJson: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.status !== 'IN_REVIEW' || !project.assignedReviewerId) {
    throw new Error(
      'Chỉ có thể thu hồi hồ sơ đang được kiểm tra bởi chuyên viên',
    );
  }

  // Note: checklist progress được giữ nguyên — khi tái phân công chuyên viên mới sẽ thấy.
  // Nếu LĐ muốn xóa checklist phải thao tác riêng.

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: 'ASSIGNED',
      assignedReviewerId: null,
      assignedAt: null,
      assignedById: null,
    },
    select: { id: true, code: true, status: true },
  });

  revalidatePath('/phan-cong');
  revalidatePath('/kiem-tra');
  revalidatePath(`/de-an/${project.id}`);

  return {
    id: updated.id,
    code: updated.code,
    status: updated.status as ProjectStatus,
  };
}

export const unassignProject = withAuditLog<[string], UnassignProjectResult>(
  {
    action: 'ASSIGN',
    resource: 'tiep-nhan',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      status: r.status,
      transition: 'IN_REVIEW→ASSIGNED',
      unassign: true,
    }),
    metadata: { reason: 'LĐ BQL thu hồi hồ sơ về hàng đợi phân công' },
  },
  unassignProjectImpl,
);
