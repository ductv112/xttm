'use server';

// markValid — Chuyên viên xác nhận hồ sơ hợp lệ. IN_REVIEW → VALID.
// Guard: ≥80% checklist items checked (✓ hoặc N/A) trên tổng items required.
// Set passedFormalCheck=true.
// Audit TRANSITION × 'tiep-nhan'.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  canTransitionProject,
  type ProjectStatus,
} from '@/lib/workflows/project';
import {
  parseChecklist,
  computeChecklistPassRatio,
  CHECKLIST_PASS_THRESHOLD,
} from '@/lib/intake-checklist';

export type MarkValidResult = {
  id: string;
  code: string;
  status: ProjectStatus;
  passRatio: number;
  passedFormalCheck: boolean;
};

async function markValidImpl(projectId: string): Promise<MarkValidResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      status: true,
      assignedReviewerId: true,
      checklistJson: true,
      deletedAt: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.assignedReviewerId !== session.user.id) {
    throw new Error('Bạn không phải chuyên viên được giao kiểm tra hồ sơ này');
  }
  if (project.status !== 'IN_REVIEW') {
    throw new Error(
      'Chỉ có thể xác nhận hợp lệ khi hồ sơ đang ở trạng thái "Đang kiểm tra"',
    );
  }
  if (!canTransitionProject(project.status as ProjectStatus, 'VALID')) {
    throw new Error('Chuyển trạng thái không được phép');
  }

  // T-06-01-02: server-side checklist threshold
  const checklist = parseChecklist(project.checklistJson);
  const progress = computeChecklistPassRatio(checklist);
  if (progress.ratio < CHECKLIST_PASS_THRESHOLD) {
    throw new Error(
      `Chưa đủ ${Math.round(CHECKLIST_PASS_THRESHOLD * 100)}% checklist được xác nhận (hiện ${progress.passed}/${progress.total} = ${Math.round(progress.ratio * 100)}%). Vui lòng hoàn thành checklist trước khi xác nhận hợp lệ.`,
    );
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: 'VALID',
      passedFormalCheck: true,
    },
    select: { id: true, code: true, status: true, passedFormalCheck: true },
  });

  revalidatePath(`/kiem-tra/${project.id}`);
  revalidatePath('/kiem-tra');
  revalidatePath('/cham-diem-so-bo');
  revalidatePath(`/de-an/${project.id}`);

  return {
    id: updated.id,
    code: updated.code,
    status: updated.status as ProjectStatus,
    passRatio: progress.ratio,
    passedFormalCheck: updated.passedFormalCheck,
  };
}

export const markValid = withAuditLog<[string], MarkValidResult>(
  {
    action: 'TRANSITION',
    resource: 'tiep-nhan',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      status: r.status,
      transition: 'IN_REVIEW→VALID',
      passRatio: r.passRatio,
      passedFormalCheck: r.passedFormalCheck,
    }),
    metadata: { reason: 'Chuyên viên xác nhận hồ sơ hợp lệ' },
  },
  markValidImpl,
);
