'use server';

// listValidProjects — chuyên viên list các hồ sơ VALID assigned to me (sẵn sàng chấm điểm sơ bộ).
// Mỗi project có ScoreSheet (kind=PRELIMINARY) → status DRAFT/SUBMITTED hoặc null nếu chưa bắt đầu.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type ValidProjectRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  organizationName: string;
  programCycleYear: number;
  totalBudget: number | null;
  validatedAt: Date | null; // updatedAt khi vào VALID — proxy
  scoreSheetStatus: 'DRAFT' | 'SUBMITTED' | null;
  totalScore: number | null;
};

export async function listValidProjects(): Promise<ValidProjectRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  // Chấm điểm sơ bộ thuộc resource 'tham-dinh' nhưng action='score' chỉ HOIDONG có.
  // Cho POC, dùng 'tiep-nhan:read' guard (chuyên viên kiểm tra) — server-side đảm bảo
  // chỉ assigned reviewer mới chấm được hồ sơ của mình.
  if (!(await canFromDB(role, 'tiep-nhan', 'read'))) {
    throw new Error('Bạn không có quyền chấm điểm sơ bộ');
  }

  const rows = await prisma.project.findMany({
    where: {
      assignedReviewerId: session.user.id,
      status: 'VALID',
      passedFormalCheck: true,
      deletedAt: null,
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      organization: { select: { name: true } },
      programCycle: { select: { year: true } },
      scoreSheets: {
        where: {
          kind: 'PRELIMINARY',
          reviewerId: session.user.id,
        },
        select: { id: true, status: true, totalScore: true },
        take: 1,
      },
    },
  });

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
    const sheet = p.scoreSheets[0];
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      kind: p.kind,
      organizationName: p.organization.name,
      programCycleYear: p.programCycle.year,
      totalBudget,
      validatedAt: p.updatedAt,
      scoreSheetStatus: (sheet?.status as 'DRAFT' | 'SUBMITTED' | undefined) ?? null,
      totalScore: sheet?.totalScore ?? null,
    };
  });
}
