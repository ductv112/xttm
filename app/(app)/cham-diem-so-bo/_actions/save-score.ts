'use server';

// saveScore — chuyên viên lưu/cập nhật phiếu chấm sơ bộ.
// Find or create ScoreSheet (kind=PRELIMINARY, reviewerId=session.user.id, projectId=...).
// Compute totalScore weighted. Status=DRAFT.
// Audit UPDATE × 'tham-dinh'.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';

export type SaveScoreInput = {
  projectId: string;
  scores: { criterionId: string; score: number; comment?: string }[];
  comment?: string; // overall comment
};

export type SaveScoreResult = {
  id: string;
  totalScore: number;
  status: 'DRAFT' | 'SUBMITTED';
  scoresCount: number;
  updatedAt: Date;
};

async function saveScoreImpl(
  input: SaveScoreInput,
): Promise<SaveScoreResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: {
      id: true,
      kind: true,
      status: true,
      assignedReviewerId: true,
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
    throw new Error(
      'Chỉ chấm điểm sơ bộ được khi hồ sơ đã được xác nhận hợp lệ',
    );
  }

  // Sanitize: only accept criteria that exist + have weight; clamp score 0..10
  const criteria = await prisma.scoringCriterion.findMany({
    where: { isActive: true },
    select: { id: true, weight: true, appliesToKinds: true, parentId: true },
  });
  const criterionMap = new Map(criteria.map((c) => [c.id, c]));

  const sanitized = input.scores
    .filter((s) => criterionMap.has(s.criterionId))
    .map((s) => ({
      criterionId: s.criterionId,
      score: Math.max(0, Math.min(10, Number(s.score) || 0)),
      comment: typeof s.comment === 'string' ? s.comment.slice(0, 500) : undefined,
    }));

  // Compute weighted total: only LEAF criteria (parentId !== null) carry weight
  // weight scale 100. score scale 0-10. weighted = (score / 10) * weight = score * weight / 10
  // total = sum of weighted leaf entries
  let total = 0;
  for (const entry of sanitized) {
    const c = criterionMap.get(entry.criterionId);
    if (!c) continue;
    if (c.parentId === null) continue; // skip group rollup entries
    total += (entry.score / 10) * c.weight;
  }
  total = Math.round(total * 100) / 100;

  // Find existing or create
  const existing = await prisma.scoreSheet.findFirst({
    where: {
      projectId: project.id,
      reviewerId: session.user.id,
      kind: 'PRELIMINARY',
    },
    select: { id: true, status: true },
  });

  if (existing && existing.status === 'SUBMITTED') {
    throw new Error('Phiếu chấm đã được nộp — không thể chỉnh sửa');
  }

  const now = new Date();
  let result;
  if (existing) {
    result = await prisma.scoreSheet.update({
      where: { id: existing.id },
      data: {
        scoresJson: JSON.stringify(sanitized),
        totalScore: total,
        comment: input.comment ?? null,
        status: 'DRAFT',
      },
      select: {
        id: true,
        totalScore: true,
        status: true,
        updatedAt: true,
      },
    });
  } else {
    result = await prisma.scoreSheet.create({
      data: {
        projectId: project.id,
        reviewerId: session.user.id,
        kind: 'PRELIMINARY',
        status: 'DRAFT',
        scoresJson: JSON.stringify(sanitized),
        totalScore: total,
        comment: input.comment ?? null,
      },
      select: {
        id: true,
        totalScore: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  revalidatePath(`/cham-diem-so-bo/${project.id}`);
  revalidatePath('/cham-diem-so-bo');

  void now; // silence unused warning if any
  return {
    id: result.id,
    totalScore: result.totalScore ?? 0,
    status: result.status as 'DRAFT' | 'SUBMITTED',
    scoresCount: sanitized.length,
    updatedAt: result.updatedAt,
  };
}

export const saveScore = withAuditLog<[SaveScoreInput], SaveScoreResult>(
  {
    action: 'UPDATE',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([input]) => input.projectId,
    captureAfter: (r) => ({
      sheetId: r.id,
      totalScore: r.totalScore,
      status: r.status,
      scoresCount: r.scoresCount,
    }),
    metadata: { reason: 'Chuyên viên lưu phiếu chấm sơ bộ' },
  },
  saveScoreImpl,
);
