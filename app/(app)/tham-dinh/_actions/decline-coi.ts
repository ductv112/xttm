'use server';

// declineCOI — hội đồng thành viên từ chối thẩm định do xung đột lợi ích.
// Marks ScoreSheet conflictOfInterest=true, comment=reason, status=SUBMITTED, totalScore=0.
// Phiếu COI không tham gia tính điểm trung bình.
// Audit: EVALUATION_DECLINE_COI × tham-dinh.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';

export type DeclineCOIInput = {
  projectId: string;
  reason: string;
};

export type DeclineCOIResult = {
  id: string;
  status: 'SUBMITTED';
  conflictOfInterest: true;
  submittedAt: Date;
};

async function declineCOIImpl(
  input: DeclineCOIInput,
): Promise<DeclineCOIResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const userId = session.user.id;

  const reason = input.reason?.trim();
  if (!reason || reason.length < 10) {
    throw new Error(
      'Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự) để ghi nhận xung đột lợi ích',
    );
  }

  const assignment = await prisma.projectCouncilAssignment.findFirst({
    where: { projectId: input.projectId },
    include: { council: { select: { id: true, lockStatus: true } } },
  });
  if (!assignment) {
    throw new Error('Đề án chưa được phân công vào hội đồng nào');
  }
  if (assignment.council.lockStatus === 'LOCKED') {
    throw new Error('Hội đồng đã bị khóa — không thể từ chối nữa');
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
    throw new Error('Bạn không phải thành viên của hội đồng được phân công');
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true, status: true, deletedAt: true },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.status !== 'EVALUATING') {
    throw new Error('Đề án không còn ở trạng thái thẩm định');
  }

  const existing = await prisma.scoreSheet.findFirst({
    where: {
      projectId: input.projectId,
      reviewerId: userId,
      kind: 'EVALUATION',
    },
  });
  if (existing && existing.status === 'SUBMITTED') {
    throw new Error('Phiếu chấm đã được nộp — không thể đổi sang COI');
  }

  const now = new Date();
  const updated = existing
    ? await prisma.scoreSheet.update({
        where: { id: existing.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: now,
          conflictOfInterest: true,
          totalScore: 0,
          scoresJson: null,
          comment: reason,
          councilId: assignment.councilId,
        },
        select: { id: true, submittedAt: true },
      })
    : await prisma.scoreSheet.create({
        data: {
          projectId: input.projectId,
          reviewerId: userId,
          councilId: assignment.councilId,
          kind: 'EVALUATION',
          status: 'SUBMITTED',
          submittedAt: now,
          conflictOfInterest: true,
          totalScore: 0,
          comment: reason,
        },
        select: { id: true, submittedAt: true },
      });

  revalidatePath(`/tham-dinh/${input.projectId}`);
  revalidatePath('/tham-dinh');
  revalidatePath(`/hoi-dong/${assignment.councilId}`);

  return {
    id: updated.id,
    status: 'SUBMITTED',
    conflictOfInterest: true,
    submittedAt: updated.submittedAt ?? now,
  };
}

export const declineCOI = withAuditLog<[DeclineCOIInput], DeclineCOIResult>(
  {
    action: 'REJECT',
    resource: 'tham-dinh',
    resourceIdFromArgs: ([input]) => input.projectId,
    captureAfter: (r) => ({
      sheetId: r.id,
      status: r.status,
      conflictOfInterest: r.conflictOfInterest,
      submittedAt: r.submittedAt,
      kind: 'EVALUATION_DECLINE_COI',
    }),
    metadata: { reason: 'Hội đồng thành viên từ chối thẩm định do COI' },
  },
  declineCOIImpl,
);
