'use server';

// listReportsForReview — danh sách báo cáo kết quả đề án status SUBMITTED chờ BANQL duyệt.
// RBAC: 'bao-cao:read' + role BANQL/ADMIN (queue chỉ dành cho người duyệt).

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type ReportReviewQueueRow = {
  reportId: string;
  reportTitle: string;
  status: 'SUBMITTED';
  submittedAt: Date | null;
  daysWaiting: number;
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  programCycleYear: number;
  attendingCompaniesCount: number | null;
};

export async function listReportsForReview(): Promise<ReportReviewQueueRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (role !== 'BANQL' && role !== 'ADMIN') {
    throw new Error('Chỉ Ban quản lý mới truy cập được hàng đợi báo cáo chờ duyệt');
  }
  if (!(await canFromDB(role, 'bao-cao', 'read'))) {
    throw new Error('Bạn không có quyền đọc báo cáo');
  }

  const reports = await prisma.report.findMany({
    where: { status: 'SUBMITTED' },
    orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          organization: { select: { name: true } },
          programCycle: { select: { year: true } },
        },
      },
    },
  });

  const now = Date.now();
  return reports.map((r) => {
    const daysWaiting = r.submittedAt
      ? Math.max(0, Math.floor((now - r.submittedAt.getTime()) / 86_400_000))
      : 0;
    return {
      reportId: r.id,
      reportTitle: r.title,
      status: 'SUBMITTED' as const,
      submittedAt: r.submittedAt,
      daysWaiting,
      projectId: r.project.id,
      projectCode: r.project.code,
      projectName: r.project.name,
      organizationName: r.project.organization.name,
      programCycleYear: r.project.programCycle.year,
      attendingCompaniesCount: r.attendingCompaniesCount,
    };
  });
}
