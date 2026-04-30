'use server';

// saveChecklist — chuyên viên cập nhật trạng thái checklist (autosave).
// Không thay đổi project.status.
// Guard: chỉ assigned reviewer được sửa, và chỉ khi status in [IN_REVIEW, RESUBMITTED].
// Audit UPDATE × 'tiep-nhan'.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  parseChecklist,
  sanitizeChecklistInput,
  type ChecklistEntry,
} from '@/lib/intake-checklist';

export type SaveChecklistInput = {
  projectId: string;
  items: { itemId: string; status: string; note?: string }[];
};

export type SaveChecklistResult = {
  id: string;
  savedItems: number;
  updatedAt: Date;
};

async function saveChecklistImpl(
  input: SaveChecklistInput,
): Promise<SaveChecklistResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: {
      id: true,
      status: true,
      assignedReviewerId: true,
      deletedAt: true,
      checklistJson: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.assignedReviewerId !== session.user.id) {
    throw new Error('Bạn không phải chuyên viên được giao kiểm tra hồ sơ này');
  }
  if (
    project.status !== 'IN_REVIEW' &&
    project.status !== 'RESUBMITTED'
  ) {
    throw new Error(
      'Chỉ có thể cập nhật checklist khi hồ sơ đang ở trạng thái "Đang kiểm tra" hoặc "Đã nộp lại"',
    );
  }

  const sanitized: ChecklistEntry[] = sanitizeChecklistInput(input.items);
  const now = new Date();
  const payload = {
    items: sanitized,
    updatedAt: now.toISOString(),
  };

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { checklistJson: JSON.stringify(payload) },
    select: { id: true, updatedAt: true },
  });

  revalidatePath(`/kiem-tra/${project.id}`);
  revalidatePath('/kiem-tra');

  return {
    id: updated.id,
    savedItems: sanitized.length,
    updatedAt: updated.updatedAt,
  };
}

export const saveChecklist = withAuditLog<
  [SaveChecklistInput],
  SaveChecklistResult
>(
  {
    action: 'UPDATE',
    resource: 'tiep-nhan',
    resourceIdFromArgs: ([input]) => input.projectId,
    captureAfter: (r) => ({ savedItems: r.savedItems, updatedAt: r.updatedAt }),
    metadata: { reason: 'Cập nhật checklist kiểm tra hồ sơ' },
  },
  saveChecklistImpl,
);

// Re-export parser for use in components
export { parseChecklist };
