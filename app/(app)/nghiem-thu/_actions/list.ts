'use server';

// listAcceptanceQueue — danh sách đề án chờ BQL nghiệm thu / thanh lý.
// 2 trạng thái:
//   - PENDING: report đã APPROVED, chưa lập biên bản nghiệm thu
//   - AWAITING_LIQUIDATION: đã có biên bản, chưa thanh lý hợp đồng
// RBAC: BANQL/ADMIN.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type AcceptanceQueueState = 'PENDING' | 'AWAITING_LIQUIDATION';

export type AcceptanceQueueRow = {
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  programCycleYear: number;
  reportApprovedAt: Date | null;
  daysWaiting: number;
  state: AcceptanceQueueState;
  acceptanceResult: 'PASS' | 'PARTIAL' | 'FAIL' | null;
  acceptanceRecordNumber: string | null;
  acceptanceDate: Date | null;
};

export async function listAcceptanceQueue(): Promise<AcceptanceQueueRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (role !== 'BANQL' && role !== 'ADMIN') {
    throw new Error('Chỉ Ban quản lý mới truy cập được hàng đợi nghiệm thu');
  }
  if (!(await canFromDB(role, 'nghiem-thu', 'read'))) {
    throw new Error('Bạn không có quyền truy cập hàng đợi nghiệm thu');
  }

  const reports = await prisma.report.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ reviewedAt: 'asc' }, { createdAt: 'asc' }],
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
      acceptanceRecord: {
        select: {
          id: true,
          recordNumber: true,
          recordDate: true,
          result: true,
          liquidationDate: true,
        },
      },
    },
  });

  const now = Date.now();
  const out: AcceptanceQueueRow[] = [];
  for (const r of reports) {
    const ar = r.acceptanceRecord;
    let state: AcceptanceQueueState;
    if (!ar) {
      state = 'PENDING';
    } else if (!ar.liquidationDate) {
      state = 'AWAITING_LIQUIDATION';
    } else {
      // Đã thanh lý xong → không còn trong hàng đợi
      continue;
    }

    const reference = ar?.recordDate ?? r.reviewedAt ?? r.submittedAt;
    const daysWaiting = reference
      ? Math.max(0, Math.floor((now - reference.getTime()) / 86_400_000))
      : 0;

    out.push({
      projectId: r.project.id,
      projectCode: r.project.code,
      projectName: r.project.name,
      organizationName: r.project.organization.name,
      programCycleYear: r.project.programCycle.year,
      reportApprovedAt: r.reviewedAt,
      daysWaiting,
      state,
      acceptanceResult:
        (ar?.result as 'PASS' | 'PARTIAL' | 'FAIL' | undefined) ?? null,
      acceptanceRecordNumber: ar?.recordNumber ?? null,
      acceptanceDate: ar?.recordDate ?? null,
    });
  }
  return out;
}
