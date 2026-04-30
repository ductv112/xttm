'use server';

// listMyAssignedProjects — list hồ sơ chuyên viên đang được giao kiểm tra.
// Filter: assignedReviewerId === session.user.id, status in [IN_REVIEW, SUPPLEMENT_REQUIRED, RESUBMITTED, VALID, REJECTED].
// VALID/REJECTED giữ trong list để chuyên viên thấy lịch sử và chuyển sang chấm điểm sơ bộ.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';
import { parseChecklist, computeChecklistPassRatio } from '@/lib/intake-checklist';

export type MyReviewProjectRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  status: string;
  organizationName: string;
  programCycleYear: number;
  receivedAt: Date | null;
  assignedAt: Date | null;
  totalBudget: number | null;
  daysReviewing: number;
  checklistProgress: { passed: number; total: number; ratio: number };
  isOverdue: boolean; // > 7 ngày kể từ assignedAt
};

const SLA_REVIEW_DAYS = 7;

export async function listMyAssignedProjects(): Promise<MyReviewProjectRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    throw new Error('Bạn không có quyền xem danh sách hồ sơ kiểm tra');
  }

  const rows = await prisma.project.findMany({
    where: {
      assignedReviewerId: session.user.id,
      status: {
        in: [
          'IN_REVIEW',
          'SUPPLEMENT_REQUIRED',
          'RESUBMITTED',
          'VALID',
          'REJECTED',
        ],
      },
      deletedAt: null,
    },
    orderBy: [{ status: 'asc' }, { assignedAt: 'asc' }],
    include: {
      organization: { select: { name: true } },
      programCycle: { select: { year: true } },
    },
  });

  const now = Date.now();
  return rows.map((p) => {
    let totalBudget: number | null = null;
    if (p.budgetJson) {
      try {
        const parsed = JSON.parse(p.budgetJson);
        if (parsed && typeof parsed.total === 'number') totalBudget = parsed.total;
      } catch {
        totalBudget = null;
      }
    }
    if (totalBudget === null && typeof p.proposedBudget === 'number') {
      totalBudget = p.proposedBudget;
    }
    const checklist = parseChecklist(p.checklistJson);
    const progress = computeChecklistPassRatio(checklist);
    const daysReviewing = p.assignedAt
      ? Math.max(0, Math.floor((now - p.assignedAt.getTime()) / 86_400_000))
      : 0;
    const isOverdue =
      p.status === 'IN_REVIEW' &&
      daysReviewing > SLA_REVIEW_DAYS;

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      kind: p.kind,
      status: p.status,
      organizationName: p.organization.name,
      programCycleYear: p.programCycle.year,
      receivedAt: p.receivedAt,
      assignedAt: p.assignedAt,
      totalBudget,
      daysReviewing,
      checklistProgress: progress,
      isOverdue,
    };
  });
}
