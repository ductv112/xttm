'use server';

// submitEvaluationScore — hội đồng thành viên nộp phiếu chấm thẩm định.
// Validate: tất cả tiêu chí leaf phải được chấm (trừ trường hợp COI).
// Audit: EVALUATION_SUBMIT_SCORE × tham-dinh.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';

export type SubmitEvaluationScoreResult = {
  id: string;
  totalScore: number;
  status: 'SUBMITTED';
  conflictOfInterest: boolean;
  submittedAt: Date;
};

async function submitEvaluationScoreImpl(
  projectId: string,
): Promise<SubmitEvaluationScoreResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const userId = session.user.id;

  const sheet = await prisma.scoreSheet.findFirst({
    where: { projectId, reviewerId: userId, kind: 'EVALUATION' },
  });
  if (!sheet) {
    throw new Error(
      'Chưa có phiếu chấm — vui lòng lưu nháp trước khi nộp',
    );
  }
  if (sheet.status === 'SUBMITTED') {
    return {
      id: sheet.id,
      totalScore: sheet.totalScore ?? 0,
      status: 'SUBMITTED',
      conflictOfInterest: sheet.conflictOfInterest,
      submittedAt: sheet.submittedAt ?? new Date(),
    };
  }
  if (!sheet.councilId) {
    throw new Error('Phiếu chấm thiếu thông tin hội đồng');
  }

  // Verify council not locked
  const council = await prisma.evaluationCouncil.findUnique({
    where: { id: sheet.councilId },
    select: { lockStatus: true },
  });
  if (council?.lockStatus === 'LOCKED') {
    throw new Error('Hội đồng đã bị khóa — không thể nộp thêm phiếu');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { kind: true, status: true },
  });
  if (!project) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.status !== 'EVALUATING') {
    throw new Error('Đề án không còn ở trạng thái thẩm định');
  }

  if (!sheet.conflictOfInterest) {
    // Validate completeness — only when not COI
    const criteria = await prisma.scoringCriterion.findMany({
      where: { isActive: true, parentId: { not: null } },
      select: { id: true, appliesToKinds: true },
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
          scoredIds = parsed
            .map((e: { criterionId?: string }) => e.criterionId ?? '')
            .filter(Boolean);
        }
      } catch {
        scoredIds = [];
      }
    }
    const missing = applicableLeafIds.filter((id) => !scoredIds.includes(id));
    if (missing.length > 0) {
      throw new Error(
        `Còn ${missing.length}/${applicableLeafIds.length} tiêu chí chưa chấm. Vui lòng hoàn thành trước khi nộp.`,
      );
    }
  }

  const now = new Date();
  const updated = await prisma.scoreSheet.update({
    where: { id: sheet.id },
    data: { status: 'SUBMITTED', submittedAt: now },
    select: {
      id: true,
      totalScore: true,
      submittedAt: true,
      conflictOfInterest: true,
    },
  });

  revalidatePath(`/tham-dinh/${projectId}`);
  revalidatePath('/tham-dinh');
  revalidatePath(`/hoi-dong/${sheet.councilId}`);

  return {
    id: updated.id,
    totalScore: updated.totalScore ?? 0,
    status: 'SUBMITTED',
    conflictOfInterest: updated.conflictOfInterest,
    submittedAt: updated.submittedAt ?? now,
  };
}

export const submitEvaluationScore = withAuditLog<
  [string],
  SubmitEvaluationScoreResult
>(
  {
    action: 'SUBMIT',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({
      sheetId: r.id,
      totalScore: r.totalScore,
      status: r.status,
      submittedAt: r.submittedAt,
      conflictOfInterest: r.conflictOfInterest,
      kind: 'EVALUATION_SUBMIT_SCORE',
    }),
    metadata: { reason: 'Hội đồng thành viên nộp phiếu chấm thẩm định' },
  },
  submitEvaluationScoreImpl,
);
