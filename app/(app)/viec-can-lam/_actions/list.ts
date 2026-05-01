'use server';

// listMyTodos — hàng đợi việc cần làm cho DONVI:
//   1. Đề án nháp / cần bổ sung hồ sơ (status DRAFT, SUPPLEMENT_REQUIRED)
//   2. Báo cáo cần lập / nháp / trả bổ sung (project IN_PROGRESS|COMPLETED)
//   3. Điều chỉnh đang chờ phản hồi từ BQL (amendment status PENDING)
// Filter theo organizationId của user.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/constants';
import { ROLES } from '@/lib/constants';

export type TodoType =
  | 'PROJECT_DRAFT'
  | 'PROJECT_SUPPLEMENT'
  | 'REPORT_NEEDED'
  | 'REPORT_DRAFT'
  | 'REPORT_RETURNED'
  | 'AMENDMENT_PENDING';

export type TodoRow = {
  id: string;
  type: TodoType;
  projectId: string;
  projectCode: string;
  projectName: string;
  programCycleYear: number;
  description: string;
  href: string;
  daysWaiting: number;
  createdAt: Date;
};

export async function listMyTodos(): Promise<TodoRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (role !== ROLES.DONVI) {
    throw new Error('Chỉ Đơn vị chủ trì mới có hàng đợi việc cần làm');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    return [];
  }

  const now = Date.now();
  const todos: TodoRow[] = [];

  // 1. Đề án cần hoàn thiện (DRAFT) hoặc bổ sung hồ sơ (SUPPLEMENT_REQUIRED)
  const draftProjects = await prisma.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: ['DRAFT', 'SUPPLEMENT_REQUIRED'] },
      deletedAt: null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      updatedAt: true,
      supplementRequestReason: true,
      programCycle: { select: { year: true } },
    },
  });
  for (const p of draftProjects) {
    const isDraft = p.status === 'DRAFT';
    const description = isDraft
      ? 'Đề án đang ở dạng nháp — hoàn thiện và nộp hồ sơ.'
      : p.supplementRequestReason
        ? `Ban quản lý yêu cầu bổ sung: ${p.supplementRequestReason.slice(0, 120)}`
        : 'Ban quản lý yêu cầu bổ sung hồ sơ — chỉnh sửa và nộp lại.';
    todos.push({
      id: `proj-${p.id}`,
      type: isDraft ? 'PROJECT_DRAFT' : 'PROJECT_SUPPLEMENT',
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      programCycleYear: p.programCycle.year,
      description,
      href: `/de-an/${p.id}`,
      daysWaiting: Math.max(
        0,
        Math.floor((now - p.updatedAt.getTime()) / 86_400_000),
      ),
      createdAt: p.updatedAt,
    });
  }

  // 2. Báo cáo cần lập / hoàn thiện cho đề án IN_PROGRESS / COMPLETED
  const activeProjects = await prisma.project.findMany({
    where: {
      organizationId: orgId,
      status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      deletedAt: null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      updatedAt: true,
      programCycle: { select: { year: true } },
    },
  });
  for (const p of activeProjects) {
    const report = await prisma.report.findFirst({
      where: { projectId: p.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!report) {
      todos.push({
        id: `rep-needed-${p.id}`,
        type: 'REPORT_NEEDED',
        projectId: p.id,
        projectCode: p.code,
        projectName: p.name,
        programCycleYear: p.programCycle.year,
        description: 'Đề án đã triển khai — cần lập và nộp báo cáo kết quả.',
        href: `/de-an/${p.id}#bao-cao`,
        daysWaiting: Math.max(
          0,
          Math.floor((now - p.updatedAt.getTime()) / 86_400_000),
        ),
        createdAt: p.updatedAt,
      });
    } else if (report.status === 'DRAFT') {
      todos.push({
        id: `rep-draft-${report.id}`,
        type: 'REPORT_DRAFT',
        projectId: p.id,
        projectCode: p.code,
        projectName: p.name,
        programCycleYear: p.programCycle.year,
        description: 'Báo cáo đang ở dạng nháp — hoàn thiện và nộp.',
        href: `/de-an/${p.id}#bao-cao`,
        daysWaiting: Math.max(
          0,
          Math.floor((now - report.updatedAt.getTime()) / 86_400_000),
        ),
        createdAt: report.updatedAt,
      });
    } else if (report.status === 'RETURNED') {
      const description = report.reviewComments
        ? `Ban quản lý trả bổ sung: ${report.reviewComments.slice(0, 120)}`
        : 'Ban quản lý trả bổ sung báo cáo — chỉnh sửa và nộp lại.';
      todos.push({
        id: `rep-returned-${report.id}`,
        type: 'REPORT_RETURNED',
        projectId: p.id,
        projectCode: p.code,
        projectName: p.name,
        programCycleYear: p.programCycle.year,
        description,
        href: `/de-an/${p.id}#bao-cao`,
        daysWaiting: report.reviewedAt
          ? Math.max(
              0,
              Math.floor((now - report.reviewedAt.getTime()) / 86_400_000),
            )
          : 0,
        createdAt: report.reviewedAt ?? report.updatedAt,
      });
    }
    // SUBMITTED → đang chờ BQL duyệt; APPROVED → done. Không hiển thị.
  }

  // 3. Điều chỉnh đang chờ phản hồi (status PENDING)
  const pendingAmendments = await prisma.projectAmendment.findMany({
    where: {
      project: { organizationId: orgId },
      status: 'PENDING',
    },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          programCycle: { select: { year: true } },
        },
      },
    },
  });
  for (const a of pendingAmendments) {
    const description = a.isCritical
      ? 'Yêu cầu điều chỉnh trọng yếu — đang chờ Ban quản lý chuyển hội đồng thẩm định lại.'
      : 'Yêu cầu điều chỉnh nhỏ — đang chờ Ban quản lý phê duyệt.';
    todos.push({
      id: `amend-${a.id}`,
      type: 'AMENDMENT_PENDING',
      projectId: a.project.id,
      projectCode: a.project.code,
      projectName: a.project.name,
      programCycleYear: a.project.programCycle.year,
      description,
      href: `/de-an/${a.project.id}#dieu-chinh`,
      daysWaiting: Math.max(
        0,
        Math.floor((now - a.createdAt.getTime()) / 86_400_000),
      ),
      createdAt: a.createdAt,
    });
  }

  // Sort: oldest pending first (priority), tie-break by type
  todos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return todos;
}
