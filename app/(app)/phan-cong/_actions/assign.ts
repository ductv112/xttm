'use server';

// assignProject — LĐ BQL phân công chuyên viên kiểm tra hồ sơ.
// Logic:
//   - Source state phải là ASSIGNED (vừa BQL tiếp nhận) hoặc đã ASSIGNED + có reviewer cũ (tái phân công).
//   - Set Project.assignedReviewerId + assignedAt + assignedById = session.user.id
//   - Transition ASSIGNED → IN_REVIEW (chuyên viên nhận, bắt đầu kiểm tra)
//   - Audit ASSIGN × 'tiep-nhan'.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionProject,
  type ProjectStatus,
} from '@/lib/workflows/project';
import { ROLES, type Role } from '@/lib/constants';

export type AssignProjectResult = {
  id: string;
  code: string;
  status: ProjectStatus;
  assignedToUserId: string;
  assignedAt: Date;
};

async function assignProjectImpl(
  projectId: string,
  staffUserId: string,
): Promise<AssignProjectResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tiep-nhan', 'assign'))) {
    throw new Error('Bạn không có quyền phân công hồ sơ');
  }

  // Self-assign guard (T-06-01-03): LĐ không tự phân công cho chính mình
  if (staffUserId === session.user.id) {
    throw new Error('Không thể tự phân công cho chính mình');
  }

  // Verify staff exists and is active CHUYENVIEN
  const staff = await prisma.user.findUnique({
    where: { id: staffUserId },
    select: { id: true, role: true, isActive: true, fullName: true },
  });
  if (!staff || !staff.isActive) {
    throw new Error('Chuyên viên không tồn tại hoặc đã bị khóa');
  }
  if (staff.role !== ROLES.CHUYENVIEN) {
    throw new Error('Chỉ có thể phân công cho người dùng vai trò Chuyên viên');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      status: true,
      assignedReviewerId: true,
      deletedAt: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }

  // Allow assign từ ASSIGNED (initial) hoặc IN_REVIEW (tái phân công)
  if (project.status !== 'ASSIGNED' && project.status !== 'IN_REVIEW') {
    throw new Error(
      'Chỉ có thể phân công hồ sơ ở trạng thái "Đã phân công" hoặc "Đang kiểm tra"',
    );
  }

  // If currently ASSIGNED → transition to IN_REVIEW
  // If currently IN_REVIEW (reassign) → keep status IN_REVIEW, just update reviewer
  let nextStatus: ProjectStatus = project.status as ProjectStatus;
  if (project.status === 'ASSIGNED') {
    if (!canTransitionProject('ASSIGNED', 'IN_REVIEW')) {
      throw new Error('Chuyển trạng thái không được phép');
    }
    nextStatus = 'IN_REVIEW';
  }

  const now = new Date();
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: nextStatus,
      assignedReviewerId: staff.id,
      assignedAt: now,
      assignedById: session.user.id,
    },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      assignedReviewerId: true,
      assignedAt: true,
    },
  });

  // Mock notification: dispatch to assigned chuyên viên
  try {
    const notification = await prisma.notification.create({
      data: {
        projectId: updated.id,
        type: 'ASSIGNED',
        subject: `Bạn được phân công kiểm tra: ${updated.code}`,
        content: `<p>Bạn được phân công kiểm tra hồ sơ đề án: <strong>${updated.name}</strong> (mã ${updated.code}).</p><p>Vui lòng truy cập trang Kiểm tra hồ sơ để bắt đầu công việc.</p>`,
        recipientType: 'USER',
        createdById: session.user.id,
      },
    });
    await prisma.notificationDispatch.create({
      data: {
        notificationId: notification.id,
        recipientUserId: staff.id,
        status: 'SENT',
      },
    });
  } catch (err) {
    console.error('[assignProject] notification dispatch failed:', err);
  }

  revalidatePath('/phan-cong');
  revalidatePath('/kiem-tra');
  revalidatePath(`/de-an/${project.id}`);
  revalidatePath('/tiep-nhan');

  return {
    id: updated.id,
    code: updated.code,
    status: updated.status as ProjectStatus,
    assignedToUserId: updated.assignedReviewerId!,
    assignedAt: updated.assignedAt ?? now,
  };
}

export const assignProject = withAuditLog<
  [string, string],
  AssignProjectResult
>(
  {
    action: 'ASSIGN',
    resource: 'tiep-nhan',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      status: r.status,
      assignedToUserId: r.assignedToUserId,
      assignedAt: r.assignedAt,
    }),
    metadata: { reason: 'LĐ BQL phân công chuyên viên kiểm tra' },
  },
  assignProjectImpl,
);
