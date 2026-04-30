'use server';

// finalizeScore — chuyên viên nộp phiếu chấm sơ bộ (DRAFT → SUBMITTED).
// Guard: tất cả tiêu chí leaf phải được chấm (score > 0 — nếu 0 phải có note).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';

export type FinalizeScoreResult = {
  id: string;
  totalScore: number;
  status: 'SUBMITTED';
  submittedAt: Date;
};

async function finalizeScoreImpl(
  projectId: string,
): Promise<FinalizeScoreResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      assignedReviewerId: true,
      status: true,
      kind: true,
      deletedAt: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.assignedReviewerId !== session.user.id) {
    throw new Error('Bạn không phải chuyên viên được giao chấm điểm hồ sơ này');
  }
  if (project.status !== 'VALID') {
    throw new Error('Chỉ nộp phiếu chấm khi hồ sơ đang hợp lệ');
  }

  const sheet = await prisma.scoreSheet.findFirst({
    where: {
      projectId: project.id,
      reviewerId: session.user.id,
      kind: 'PRELIMINARY',
    },
  });
  if (!sheet) {
    throw new Error('Chưa có phiếu chấm — vui lòng lưu nháp trước khi nộp');
  }
  if (sheet.status === 'SUBMITTED') {
    return {
      id: sheet.id,
      totalScore: sheet.totalScore ?? 0,
      status: 'SUBMITTED',
      submittedAt: sheet.submittedAt ?? new Date(),
    };
  }

  // Validate: tất cả leaf criteria phải có entry
  const criteria = await prisma.scoringCriterion.findMany({
    where: { isActive: true, parentId: { not: null } },
    select: { id: true, name: true, appliesToKinds: true },
  });
  const applicableLeafIds = criteria
    .filter((c) => {
      if (!c.appliesToKinds) return true;
      try {
        const arr = JSON.parse(c.appliesToKinds);
        if (!Array.isArray(arr) || arr.length === 0) return true;
        return arr.includes(project.kind);
      } catch {
        return true;
      }
    })
    .map((c) => c.id);

  let scoredIds: string[] = [];
  if (sheet.scoresJson) {
    try {
      const parsed = JSON.parse(sheet.scoresJson);
      if (Array.isArray(parsed)) {
        scoredIds = parsed.map((e: { criterionId?: string }) => e.criterionId ?? '').filter(Boolean);
      }
    } catch {
      scoredIds = [];
    }
  }
  const missing = applicableLeafIds.filter((id) => !scoredIds.includes(id));
  if (missing.length > 0) {
    throw new Error(
      `Còn ${missing.length}/${applicableLeafIds.length} tiêu chí chưa chấm. Vui lòng hoàn thành tất cả tiêu chí trước khi nộp.`,
    );
  }

  const now = new Date();
  const updated = await prisma.scoreSheet.update({
    where: { id: sheet.id },
    data: { status: 'SUBMITTED', submittedAt: now },
    select: { id: true, totalScore: true, submittedAt: true },
  });

  revalidatePath(`/cham-diem-so-bo/${project.id}`);
  revalidatePath('/cham-diem-so-bo');

  return {
    id: updated.id,
    totalScore: updated.totalScore ?? 0,
    status: 'SUBMITTED',
    submittedAt: updated.submittedAt ?? now,
  };
}

export const finalizeScore = withAuditLog<[string], FinalizeScoreResult>(
  {
    action: 'SUBMIT',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      sheetId: r.id,
      totalScore: r.totalScore,
      status: r.status,
      submittedAt: r.submittedAt,
    }),
    metadata: { reason: 'Chuyên viên nộp phiếu chấm sơ bộ' },
  },
  finalizeScoreImpl,
);
