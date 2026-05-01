'use server';

// exportDashboardPdf — generates PDF summary report cho dashboard.
// Returns base64 buffer for client decode + download.

import { format as formatDate } from 'date-fns';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';
import { type Role } from '@/lib/constants';
import { formatVNDCompact } from '@/lib/format';
import { renderDashboardSummaryPdf } from '@/lib/pdf/render';
import { getDashboardSummary } from '@/lib/dashboard-aggregations';
import type { DashboardPdfAlert } from '@/lib/pdf/templates/DashboardSummary';

export type ExportDashboardPdfResult = {
  filename: string;
  base64: string;
};

async function exportDashboardPdfImpl(
  year: number,
): Promise<ExportDashboardPdfResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'dashboard', 'read'))) {
    throw new Error('Bạn không có quyền xuất báo cáo dashboard');
  }
  const summary = await getDashboardSummary(
    year,
    role,
    session.user.organizationId,
  );

  const budgetVariance: DashboardPdfAlert[] = summary.alertBudgetVariance.map(
    (a) => ({
      code: a.code,
      name: a.name,
      detail: `Đăng ký ${formatVNDCompact(a.registered)} → Phê duyệt ${formatVNDCompact(a.approved)}`,
    }),
  );
  const contractDelay: DashboardPdfAlert[] = summary.alertContractDelay.map(
    (a) => ({
      code: a.code,
      name: a.name,
      detail: `Quá hạn ${a.daysOverdue} ngày`,
    }),
  );
  const reportOverdue: DashboardPdfAlert[] = summary.alertReportOverdue.map(
    (a) => ({
      code: a.code,
      name: a.name,
      detail: `Quá hạn ${a.daysOverdue} ngày`,
    }),
  );
  const consulate: DashboardPdfAlert[] = summary.alertConsulate.map((a) => ({
    code: a.code,
    name: a.name,
    detail: `Còn ${a.daysToEvent} ngày${a.countryName ? ` — ${a.countryName}` : ''}`,
  }));

  const buf = await renderDashboardSummaryPdf({
    year,
    exportedBy: session.user.fullName ?? session.user.username,
    exportedAt: new Date(),
    stats: summary.stats,
    alertBudgetVariance: budgetVariance,
    alertContractDelay: contractDelay,
    alertReportOverdue: reportOverdue,
    alertConsulate: consulate,
    chartByKind: summary.chartByKind.map((k) => ({
      kindLabel: k.kindLabel,
      count: k.count,
    })),
  });
  const base64 = buf.toString('base64');
  const filename = `dashboard-xttmqg-${year}-${formatDate(
    new Date(),
    'yyyyMMdd-HHmmss',
  )}.pdf`;

  return { filename, base64 };
}

export const exportDashboardPdf = withAuditLog<
  [number],
  ExportDashboardPdfResult
>(
  {
    action: 'EXPORT',
    resource: 'dashboard',
    captureAfter: (r, [year]) => ({ filename: r.filename, year }),
  },
  exportDashboardPdfImpl,
);
