// AlertsRow — 4 alert widgets in a responsive grid.
// Client component — lucide icons cannot cross RSC boundary.
'use client';

import { TrendingUp, FileWarning, Clock, Globe2 } from 'lucide-react';

import { formatVNDCompact } from '@/lib/format';
import { formatDate } from '@/lib/format';
import type { DashboardSummary } from '@/lib/dashboard-aggregations';
import { AlertWidgetCard } from './AlertWidgetCard';

type Props = {
  summary: DashboardSummary;
};

export function AlertsRow({ summary }: Props) {
  const year = summary.year;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <AlertWidgetCard
        title="Sai lệch ngân sách"
        icon={TrendingUp}
        tone="warning"
        count={summary.alertBudgetVariance.length}
        items={summary.alertBudgetVariance.map((a) => ({
          code: a.code,
          name: a.name,
          detail: `${formatVNDCompact(a.registered)} → ${formatVNDCompact(a.approved)} (+${formatVNDCompact(a.variance)})`,
          href: `/de-an/${a.projectId}`,
        }))}
        drillDownHref={`/de-an?budgetVariance=true&year=${year}`}
        emptyText="Không có đề án sai lệch ngân sách"
      />

      <AlertWidgetCard
        title="Chậm ký hợp đồng (>60 ngày)"
        icon={FileWarning}
        tone="danger"
        count={summary.alertContractDelay.length}
        items={summary.alertContractDelay.map((a) => ({
          code: a.code,
          name: a.name,
          detail: `Quá hạn ${a.daysOverdue} ngày${
            a.approvedDate ? ` · Duyệt ${formatDate(a.approvedDate)}` : ''
          }`,
          href: `/hop-dong?projectId=${a.projectId}`,
        }))}
        drillDownHref="/hop-dong?status=DRAFT&overdue=true"
        emptyText="Tất cả hợp đồng đúng tiến độ"
      />

      <AlertWidgetCard
        title="Báo cáo trễ hạn (>15 ngày)"
        icon={Clock}
        tone="danger"
        count={summary.alertReportOverdue.length}
        items={summary.alertReportOverdue.map((a) => ({
          code: a.code,
          name: a.name,
          detail: `Quá hạn ${a.daysOverdue} ngày${
            a.endDate ? ` · Kết thúc ${formatDate(a.endDate)}` : ''
          }`,
          href: `/bao-cao?projectId=${a.projectId}`,
        }))}
        drillDownHref={`/de-an?reportOverdue=true&year=${year}`}
        emptyText="Tất cả báo cáo đúng hạn"
      />

      <AlertWidgetCard
        title="Đề án quốc tế chưa liên hệ thương vụ"
        icon={Globe2}
        tone="warning"
        count={summary.alertConsulate.length}
        items={summary.alertConsulate.map((a) => ({
          code: a.code,
          name: a.name,
          detail: `Còn ${a.daysToEvent} ngày${
            a.countryName ? ` · ${a.countryName}` : ''
          }${a.startDate ? ` · ${formatDate(a.startDate)}` : ''}`,
          href: `/trien-khai/${a.projectId}`,
        }))}
        drillDownHref={`/de-an?consulatePending=true&year=${year}`}
        emptyText="Tất cả đề án quốc tế đã liên hệ thương vụ"
      />
    </div>
  );
}
