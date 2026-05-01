// /de-an/[id] — Trang chi tiết đề án (Plan 05-03).
// RSC: auth() + getProjectDetail (built-in cross-tenant guard) + load catalogs +
// timeline (audit log filtered TRANSITION/SUBMIT) + recent audit entries → ProjectTabsShell.
//
// RBAC chain (defense-in-depth):
//   1. auth() — redirect /login nếu chưa đăng nhập
//   2. getProjectDetail() returns null khi không có quyền (cross-tenant) → notFound() 404
//   3. isOwner check (session.organizationId === project.organizationId) gates owner-only actions
//
// T-05-03-01 (high): cross-tenant access mitigated by getProjectDetail null-on-deny
// T-05-03-03 (medium): notFound() returns 404 page (no stack trace leak)

import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  AUDIT_ACTION_LABELS,
  type AuditAction,
} from '@/lib/audit-types';
import {
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@/lib/workflows/project';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

import { getProjectDetail } from '../_actions/get-detail';
import { getReportForProject } from './_actions/report-actions';
import { getAcceptanceForProject } from './_actions/acceptance-actions';
import { listProjectFinancialRecords } from '../../tai-chinh/_actions/list';
import { checkProjectReportSLA } from '@/lib/report-sla';
import { ProjectDetailHeader } from './_components/ProjectDetailHeader';
import { ProjectTabsShell } from './_components/ProjectTabsShell';
import type { ProjectTimelineEntry } from './_components/ProjectStatusTimeline';

export const metadata = { title: 'Chi tiết đề án' };

type CatalogRow = { id: string; name: string };

async function loadCatalogs(): Promise<{
  industrySectors: CatalogRow[];
  markets: CatalogRow[];
  countries: CatalogRow[];
  promotionTypes: CatalogRow[];
}> {
  const [industrySectors, markets, countries, promotionTypes] = await Promise.all([
    prisma.industrySector.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.market.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.country.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.promotionType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    }),
  ]);
  return { industrySectors, markets, countries, promotionTypes };
}

/**
 * Build status timeline from audit log entries (TRANSITION/SUBMIT actions on de-an
 * resource scoped by projectId). Each entry produces a ProjectTimelineEntry.
 */
async function loadStatusTimeline(
  projectId: string,
  currentStatus: ProjectStatus,
  createdAt: Date,
): Promise<ProjectTimelineEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: {
      resource: 'de-an',
      resourceId: projectId,
      action: { in: ['SUBMIT', 'TRANSITION', 'APPROVE', 'REJECT', 'ASSIGN'] },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { fullName: true } },
    },
  });

  const entries: ProjectTimelineEntry[] = [];
  // Initial DRAFT entry — Project được tạo
  entries.push({
    id: `${projectId}-init`,
    status: 'DRAFT',
    at: createdAt,
    byName: null,
    label: 'Khởi tạo đề án',
  });

  for (const r of rows) {
    let entryStatus: ProjectStatus = currentStatus;
    let label = AUDIT_ACTION_LABELS[r.action as AuditAction] ?? r.action;

    // Try parse diffJson to extract target status
    if (r.diffJson) {
      try {
        const parsed = JSON.parse(r.diffJson);
        const after = parsed?.after as
          | { status?: string; transition?: string }
          | undefined;
        if (after?.status && typeof after.status === 'string') {
          entryStatus = after.status as ProjectStatus;
        }
        if (after?.transition && typeof after.transition === 'string') {
          label = after.transition;
        }
      } catch {
        // ignore parse errors
      }
    }

    if (r.action === 'SUBMIT') {
      label = 'Nộp đề án';
    } else if (r.action === 'TRANSITION') {
      label = `Chuyển trạng thái → ${PROJECT_STATUS_LABELS[entryStatus]}`;
    } else if (r.action === 'ASSIGN') {
      label = 'Phân công kiểm tra';
    } else if (r.action === 'APPROVE') {
      label = 'Phê duyệt';
    } else if (r.action === 'REJECT') {
      label = 'Từ chối';
    }

    entries.push({
      id: r.id,
      status: entryStatus,
      at: r.createdAt,
      byName: r.user?.fullName ?? null,
      label,
    });
  }

  return entries;
}

async function loadRecentAuditEntries(projectId: string): Promise<
  Array<{
    id: string;
    createdAt: Date;
    userFullName: string;
    actionLabel: string;
    summary: string;
  }>
> {
  const rows = await prisma.auditLog.findMany({
    where: { resource: 'de-an', resourceId: projectId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { fullName: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    userFullName: r.user?.fullName ?? '(không rõ)',
    actionLabel: AUDIT_ACTION_LABELS[r.action as AuditAction] ?? r.action,
    summary: summarizeDiff(r.diffJson),
  }));
}

function summarizeDiff(diffJson: string | null): string {
  if (!diffJson) return 'Không có chi tiết';
  try {
    const parsed = JSON.parse(diffJson);
    if (parsed && typeof parsed === 'object') {
      const after = (parsed as { after?: unknown }).after;
      if (after && typeof after === 'object') {
        const keys = Object.keys(after as Record<string, unknown>);
        if (keys.length === 0) return 'Cập nhật';
        return `Trường: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}`;
      }
    }
    return 'Cập nhật';
  } catch {
    return 'Cập nhật';
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;
  let project;
  try {
    project = await getProjectDetail(id);
  } catch {
    notFound();
  }
  if (!project) {
    notFound();
  }

  const isOwner =
    session.user.organizationId !== null &&
    session.user.organizationId === project.organizationId;

  const role = session.user.role as Role;
  const [
    catalogs,
    timeline,
    auditEntries,
    canManageImpl,
    canApproveAmendment,
    amendmentRows,
    canReviewReport,
    canManageAcceptance,
    canManageFinance,
    report,
    acceptance,
    financialRecords,
    reportSlaWarning,
  ] = await Promise.all([
    loadCatalogs(),
    loadStatusTimeline(project.id, project.status, project.createdAt),
    loadRecentAuditEntries(project.id),
    canFromDB(role, 'trien-khai', 'update'),
    canFromDB(role, 'de-an', 'approve'),
    loadAmendments(project.id),
    canFromDB(role, 'bao-cao', 'update'),
    canFromDB(role, 'nghiem-thu', 'create'),
    canFromDB(role, 'tai-chinh', 'create'),
    getReportForProject(project.id),
    getAcceptanceForProject(project.id),
    listProjectFinancialRecords(project.id),
    checkProjectReportSLA(project.id),
  ]);

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <ProjectDetailHeader project={project} isOwner={isOwner} />
      <div className="mt-6">
        <ProjectTabsShell
          project={project}
          catalogs={catalogs}
          timeline={timeline}
          auditEntries={auditEntries}
          isOwner={isOwner}
          canManageImpl={canManageImpl}
          canApproveAmendment={canApproveAmendment}
          canReviewReport={canReviewReport}
          canManageAcceptance={canManageAcceptance}
          canManageFinance={canManageFinance}
          amendments={amendmentRows}
          report={report}
          acceptance={acceptance}
          financialRecords={financialRecords}
          reportSlaWarning={
            reportSlaWarning
              ? {
                  daysOverdue: reportSlaWarning.daysOverdue,
                  endDate: reportSlaWarning.endDate,
                }
              : null
          }
        />
      </div>
    </div>
  );
}

async function loadAmendments(projectId: string) {
  const rows = await prisma.projectAmendment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  // Resolve requestedByName
  const userIds = [...new Set(rows.map((r) => r.requestedById).filter(Boolean))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u.fullName]));
  return rows.map((r) => ({
    id: r.id,
    amendmentType: r.amendmentType,
    isCritical: r.isCritical,
    status: r.status,
    reason: r.reason,
    createdAt: r.createdAt,
    requestedByName: userById.get(r.requestedById) ?? null,
    decisionNumber: r.decisionNumber,
    decisionDate: r.decisionDate,
  }));
}
