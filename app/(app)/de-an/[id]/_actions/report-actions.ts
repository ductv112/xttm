'use server';

// Phase 9 (M5) Plan 09-01 Task 1.
// Server actions cho Báo cáo kết quả đề án trên /de-an/[id].
// REPORT-01..07: tạo + nộp + review + trả bổ sung + cảnh báo SLA 15 ngày.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { REPORT_AUDIT_TYPES } from '@/lib/audit-types';
import {
  canTransitionReport,
  type ReportStatus,
  type QuantitativeRow,
  DEFAULT_QUANTITATIVE_ROWS,
} from '@/lib/workflows/report';
import type { Role } from '@/lib/constants';

export type ReportActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };

// =============================================================================
// saveReportDraft — đơn vị lưu nháp báo cáo
// =============================================================================

export type SaveReportDraftInput = {
  projectId: string;
  reportId?: string; // truyền nếu update existing
  title?: string;
  quantitativeRows: QuantitativeRow[];
  qualitativeHtml: string;
  attendingCompaniesCount: number | null;
};

export async function saveReportDraft(
  input: SaveReportDraftInput,
): Promise<ReportActionResult<{ reportId: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'bao-cao', 'create'))) {
    return { ok: false, error: 'Bạn không có quyền tạo báo cáo' };
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      name: true,
      code: true,
    },
  });
  if (!project) return { ok: false, error: 'Không tìm thấy đề án' };

  // Cross-tenant guard: DONVI chỉ được lập báo cáo cho đề án của mình
  const isOwn =
    role === 'DONVI' &&
    project.organizationId === session.user.organizationId;
  if (!isOwn && role !== 'BANQL' && role !== 'ADMIN') {
    return { ok: false, error: 'Bạn không có quyền tạo báo cáo cho đề án này' };
  }

  // Đề án phải đang IN_PROGRESS hoặc COMPLETED để báo cáo
  if (!['IN_PROGRESS', 'COMPLETED', 'APPROVED'].includes(project.status)) {
    return {
      ok: false,
      error: 'Chỉ tạo báo cáo cho đề án đang triển khai hoặc đã hoàn thành',
    };
  }

  const quantitativeJson = JSON.stringify({
    rows: input.quantitativeRows ?? [],
  });

  let reportId = input.reportId;
  if (reportId) {
    const existing = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, projectId: true, status: true },
    });
    if (!existing) return { ok: false, error: 'Không tìm thấy báo cáo' };
    if (existing.projectId !== input.projectId) {
      return { ok: false, error: 'Báo cáo không thuộc đề án này' };
    }
    if (existing.status === 'APPROVED') {
      return { ok: false, error: 'Báo cáo đã được duyệt — không sửa được' };
    }
    await prisma.report.update({
      where: { id: reportId },
      data: {
        title:
          input.title ?? `Báo cáo kết quả đề án ${project.code}`,
        quantitativeJson,
        qualitativeHtml: input.qualitativeHtml,
        attendingCompaniesCount: input.attendingCompaniesCount,
        // RETURNED → nếu đang sửa thì giữ RETURNED đến khi submit lại
        status: existing.status === 'SUBMITTED' ? 'DRAFT' : existing.status,
      },
    });
  } else {
    const created = await prisma.report.create({
      data: {
        projectId: input.projectId,
        title:
          input.title ?? `Báo cáo kết quả đề án ${project.code}`,
        reportType: 'FINAL',
        quantitativeJson,
        qualitativeHtml: input.qualitativeHtml,
        attendingCompaniesCount: input.attendingCompaniesCount,
        status: 'DRAFT',
      },
    });
    reportId = created.id;
  }

  void logAudit(
    {
      ...REPORT_AUDIT_TYPES.REPORT_SAVE_DRAFT,
      resourceId: reportId,
      after: {
        reportId,
        projectId: input.projectId,
      },
      metadata: { projectCode: project.code },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${input.projectId}`);
  return { ok: true, data: { reportId } };
}

// =============================================================================
// submitReport — đơn vị nộp báo cáo
// =============================================================================

export async function submitReport(
  reportId: string,
): Promise<ReportActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'bao-cao', 'submit'))) {
    return { ok: false, error: 'Bạn không có quyền nộp báo cáo' };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          organizationId: true,
        },
      },
    },
  });
  if (!report) return { ok: false, error: 'Không tìm thấy báo cáo' };

  const isOwn =
    role === 'DONVI' &&
    report.project.organizationId === session.user.organizationId;
  if (!isOwn && role !== 'BANQL' && role !== 'ADMIN') {
    return { ok: false, error: 'Bạn không có quyền nộp báo cáo này' };
  }

  const currentStatus = report.status as ReportStatus;
  if (!canTransitionReport(currentStatus, 'SUBMITTED')) {
    return {
      ok: false,
      error: `Không thể nộp báo cáo ở trạng thái ${currentStatus}`,
    };
  }

  // Validate: phải có ít nhất 1 dòng chỉ tiêu định lượng và qualitativeHtml >= 50 ký tự
  const qHtml = report.qualitativeHtml ?? '';
  const qStripped = qHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (qStripped.length < 50) {
    return {
      ok: false,
      error: 'Nội dung định tính phải tối thiểu 50 ký tự',
    };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });

  void logAudit(
    {
      ...REPORT_AUDIT_TYPES.REPORT_SUBMIT,
      resourceId: reportId,
      before: { status: currentStatus },
      after: { status: 'SUBMITTED', transition: 'Nộp báo cáo' },
      metadata: { projectCode: report.project.code },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${report.project.id}`);
  return { ok: true };
}

// =============================================================================
// reviewReport — BQL duyệt báo cáo (status → APPROVED)
// =============================================================================

export async function reviewReport(
  reportId: string,
  comments: string | null,
): Promise<ReportActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (role !== 'BANQL' && role !== 'ADMIN') {
    return { ok: false, error: 'Bạn không có quyền duyệt báo cáo' };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { project: { select: { id: true, code: true } } },
  });
  if (!report) return { ok: false, error: 'Không tìm thấy báo cáo' };

  const currentStatus = report.status as ReportStatus;
  if (!canTransitionReport(currentStatus, 'APPROVED')) {
    return {
      ok: false,
      error: `Không thể duyệt báo cáo ở trạng thái ${currentStatus}`,
    };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'APPROVED',
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewComments: comments,
    },
  });

  void logAudit(
    {
      ...REPORT_AUDIT_TYPES.REPORT_REVIEW,
      resourceId: reportId,
      before: { status: currentStatus },
      after: { status: 'APPROVED', transition: 'Duyệt báo cáo' },
      metadata: {
        projectCode: report.project.code,
        comments: comments?.slice(0, 200),
      },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${report.project.id}`);
  return { ok: true };
}

// =============================================================================
// returnReport — BQL trả bổ sung (status → RETURNED)
// =============================================================================

export async function returnReport(
  reportId: string,
  comments: string,
): Promise<ReportActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Yêu cầu đăng nhập' };
  const role = session.user.role as Role;
  if (role !== 'BANQL' && role !== 'ADMIN') {
    return { ok: false, error: 'Bạn không có quyền trả bổ sung báo cáo' };
  }
  if (!comments || comments.trim().length < 10) {
    return {
      ok: false,
      error: 'Vui lòng ghi rõ lý do trả bổ sung (≥10 ký tự)',
    };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { project: { select: { id: true, code: true } } },
  });
  if (!report) return { ok: false, error: 'Không tìm thấy báo cáo' };

  const currentStatus = report.status as ReportStatus;
  if (!canTransitionReport(currentStatus, 'RETURNED')) {
    return {
      ok: false,
      error: `Không thể trả bổ sung ở trạng thái ${currentStatus}`,
    };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'RETURNED',
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewComments: comments.trim(),
    },
  });

  void logAudit(
    {
      ...REPORT_AUDIT_TYPES.REPORT_RETURN,
      resourceId: reportId,
      before: { status: currentStatus },
      after: {
        status: 'RETURNED',
        transition: 'Trả bổ sung báo cáo',
      },
      metadata: {
        projectCode: report.project.code,
        comments: comments.slice(0, 200),
      },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${report.project.id}`);
  return { ok: true };
}

// =============================================================================
// getReport — fetch báo cáo cho project (1:N nhưng demo chỉ 1 final report)
// =============================================================================

export type ProjectReportSummary = {
  id: string;
  status: ReportStatus;
  title: string;
  quantitativeRows: QuantitativeRow[];
  qualitativeHtml: string;
  attendingCompaniesCount: number | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewerName: string | null;
  reviewComments: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getReportForProject(
  projectId: string,
): Promise<ProjectReportSummary | null> {
  const session = await auth();
  if (!session?.user) return null;

  const report = await prisma.report.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  if (!report) return null;

  let reviewerName: string | null = null;
  if (report.reviewedById) {
    const r = await prisma.user.findUnique({
      where: { id: report.reviewedById },
      select: { fullName: true },
    });
    reviewerName = r?.fullName ?? null;
  }

  let rows: QuantitativeRow[] = [];
  if (report.quantitativeJson) {
    try {
      const parsed = JSON.parse(report.quantitativeJson);
      if (parsed && Array.isArray(parsed.rows)) {
        rows = parsed.rows as QuantitativeRow[];
      }
    } catch {
      rows = [];
    }
  }
  if (rows.length === 0) rows = DEFAULT_QUANTITATIVE_ROWS;

  return {
    id: report.id,
    status: report.status as ReportStatus,
    title: report.title,
    quantitativeRows: rows,
    qualitativeHtml: report.qualitativeHtml ?? '',
    attendingCompaniesCount: report.attendingCompaniesCount,
    submittedAt: report.submittedAt,
    reviewedAt: report.reviewedAt,
    reviewerName,
    reviewComments: report.reviewComments,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
