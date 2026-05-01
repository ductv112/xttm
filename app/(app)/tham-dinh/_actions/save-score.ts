'use server';

// saveEvaluationScore — hội đồng thành viên lưu phiếu chấm thẩm định.
// Find or create ScoreSheet (kind=EVALUATION, councilId, reviewerId, projectId).
// Compute weighted total. Status=DRAFT.
// Audit: EVALUATION_SAVE_SCORE × tham-dinh.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';

export type EvaluationScoreEntry = {
  criterionId: string;
  score: number;
  comment?: string;
};

export type SaveEvaluationScoreInput = {
  projectId: string;
  scores: EvaluationScoreEntry[];
  comment?: string;
  conflictOfInterest?: boolean;
};

export type SaveEvaluationScoreResult = {
  id: string;
  totalScore: number;
  status: 'DRAFT' | 'SUBMITTED';
  conflictOfInterest: boolean;
  scoresCount: number;
  updatedAt: Date;
};

async function saveEvaluationScoreImpl(
  input: SaveEvaluationScoreInput,
): Promise<SaveEvaluationScoreResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const userId = session.user.id;

  // Find council assignment for this user + project
  const assignment = await prisma.projectCouncilAssignment.findFirst({
    where: { projectId: input.projectId },
    include: {
      council: { select: { id: true, lockStatus: true } },
    },
  });
  if (!assignment) {
    throw new Error('Đề án chưa được phân công vào hội đồng nào');
  }
  if (assignment.council.lockStatus === 'LOCKED') {
    throw new Error('Hội đồng đã bị khóa — không thể lưu phiếu chấm');
  }

  const member = await prisma.councilMember.findUnique({
    where: {
      councilId_userId: {
        councilId: assignment.councilId,
        userId,
      },
    },
  });
  if (!member) {
    throw new Error(
      'Bạn không phải thành viên của hội đồng được phân công đề án này',
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true, kind: true, status: true, deletedAt: true },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.status !== 'EVALUATING') {
    throw new Error(
      `Đề án đang ở trạng thái ${project.status} — chỉ chấm điểm được khi đang thẩm định`,
    );
  }

  // Sanitize scores against catalog
  const criteria = await prisma.scoringCriterion.findMany({
    where: { isActive: true },
    select: { id: true, weight: true, parentId: true },
  });
  const criterionMap = new Map(criteria.map((c) => [c.id, c]));

  const sanitized = input.scores
    .filter((s) => criterionMap.has(s.criterionId))
    .map((s) => ({
      criterionId: s.criterionId,
      score: Math.max(0, Math.min(10, Number(s.score) || 0)),
      comment:
        typeof s.comment === 'string' ? s.comment.slice(0, 500) : undefined,
    }));

  let total = 0;
  for (const entry of sanitized) {
    const c = criterionMap.get(entry.criterionId);
    if (!c) continue;
    if (c.parentId === null) continue; // skip group rollup
    total += (entry.score / 10) * c.weight;
  }
  total = Math.round(total * 100) / 100;

  const coi = Boolean(input.conflictOfInterest);
  if (coi) total = 0; // COI = no contribution to aggregate

  const existing = await prisma.scoreSheet.findFirst({
    where: {
      projectId: input.projectId,
      reviewerId: userId,
      kind: 'EVALUATION',
    },
    select: { id: true, status: true },
  });

  if (existing && existing.status === 'SUBMITTED') {
    throw new Error('Phiếu chấm đã được nộp — không thể chỉnh sửa');
  }

  let result;
  if (existing) {
    result = await prisma.scoreSheet.update({
      where: { id: existing.id },
      data: {
        scoresJson: coi ? null : JSON.stringify(sanitized),
        totalScore: total,
        comment: input.comment ?? null,
        status: 'DRAFT',
        conflictOfInterest: coi,
        councilId: assignment.councilId,
      },
      select: {
        id: true,
        totalScore: true,
        status: true,
        conflictOfInterest: true,
        updatedAt: true,
      },
    });
  } else {
    result = await prisma.scoreSheet.create({
      data: {
        projectId: input.projectId,
        reviewerId: userId,
        councilId: assignment.councilId,
        kind: 'EVALUATION',
        status: 'DRAFT',
        scoresJson: coi ? null : JSON.stringify(sanitized),
        totalScore: total,
        comment: input.comment ?? null,
        conflictOfInterest: coi,
      },
      select: {
        id: true,
        totalScore: true,
        status: true,
        conflictOfInterest: true,
        updatedAt: true,
      },
    });
  }

  revalidatePath(`/tham-dinh/${input.projectId}`);
  revalidatePath('/tham-dinh');
  revalidatePath(`/hoi-dong/${assignment.councilId}`);

  return {
    id: result.id,
    totalScore: result.totalScore ?? 0,
    status: result.status as 'DRAFT' | 'SUBMITTED',
    conflictOfInterest: result.conflictOfInterest,
    scoresCount: sanitized.length,
    updatedAt: result.updatedAt,
  };
}

export const saveEvaluationScore = withAuditLog<
  [SaveEvaluationScoreInput],
  SaveEvaluationScoreResult
>(
  {
    action: 'UPDATE',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([input]) => input.projectId,
    captureAfter: (r) => ({
      sheetId: r.id,
      totalScore: r.totalScore,
      status: r.status,
      conflictOfInterest: r.conflictOfInterest,
      scoresCount: r.scoresCount,
      kind: 'EVALUATION_SAVE_SCORE',
    }),
    metadata: { reason: 'Hội đồng thành viên lưu phiếu chấm thẩm định' },
  },
  saveEvaluationScoreImpl,
);
