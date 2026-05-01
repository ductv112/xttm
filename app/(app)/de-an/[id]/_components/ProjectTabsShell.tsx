'use client';

// ProjectTabsShell — Client tab shell render 6 tabs nội dung của /de-an/[id].
// Plan 05-03 single-page tabs (not sub-routes per plan: "simpler").
// Default tab = Tổng quan; URL hash kept in sync để bookmarkable

import * as React from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import type { ProjectDetail } from '../../_actions/get-detail';
import type { ProjectTimelineEntry } from './ProjectStatusTimeline';
import { TongQuanTab } from './TongQuanTab';
import { KeHoachTab } from './KeHoachTab';
import { DuToanTab } from './DuToanTab';
import { TaiLieuTab } from './TaiLieuTab';
import { LichSuTab } from './LichSuTab';
import { NhatKyTab } from './NhatKyTab';
import { ImplementationTab } from './ImplementationTab';
import { AmendmentTab } from './AmendmentTab';
import { BaoCaoTab } from './BaoCaoTab';
import { NghiemThuTab } from './NghiemThuTab';
import { TaiChinhTab } from './TaiChinhTab';
import type { ProjectReportSummary } from '../_actions/report-actions';
import type { AcceptanceSummary } from '../_actions/acceptance-actions';
import type { FinancialRecordRow } from '../../../tai-chinh/_actions/list';

const TAB_VALUES = [
  'tong-quan',
  'ke-hoach',
  'du-toan',
  'tai-lieu',
  'trien-khai',
  'bao-cao',
  'nghiem-thu',
  'tai-chinh',
  'dieu-chinh',
  'lich-su',
  'nhat-ky',
] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(value: string): value is TabValue {
  return (TAB_VALUES as readonly string[]).includes(value);
}

export type ProjectTabsShellProps = {
  project: ProjectDetail;
  catalogs: {
    industrySectors: ReadonlyArray<{ id: string; name: string }>;
    markets: ReadonlyArray<{ id: string; name: string }>;
    countries: ReadonlyArray<{ id: string; name: string }>;
    promotionTypes: ReadonlyArray<{ id: string; name: string }>;
  };
  timeline: ReadonlyArray<ProjectTimelineEntry>;
  auditEntries: ReadonlyArray<{
    id: string;
    createdAt: Date;
    userFullName: string;
    actionLabel: string;
    summary: string;
  }>;
  isOwner: boolean;
  canManageImpl: boolean;
  canApproveAmendment: boolean;
  canReviewReport: boolean;
  canManageAcceptance: boolean;
  canManageFinance: boolean;
  amendments: ReadonlyArray<{
    id: string;
    amendmentType: string;
    isCritical: boolean;
    status: string;
    reason: string;
    createdAt: Date;
    requestedByName: string | null;
    decisionNumber: string | null;
    decisionDate: Date | null;
  }>;
  report: ProjectReportSummary | null;
  acceptance: AcceptanceSummary | null;
  financialRecords: ReadonlyArray<FinancialRecordRow>;
  reportSlaWarning: { daysOverdue: number; endDate: Date } | null;
};

export function ProjectTabsShell({
  project,
  catalogs,
  timeline,
  auditEntries,
  isOwner,
  canManageImpl,
  canApproveAmendment,
  canReviewReport,
  canManageAcceptance,
  canManageFinance,
  amendments,
  report,
  acceptance,
  financialRecords,
  reportSlaWarning,
}: ProjectTabsShellProps) {
  // Hash-driven default tab (bookmark friendly): /de-an/[id]#ke-hoach loads Kế hoạch
  const [tab, setTab] = React.useState<TabValue>('tong-quan');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && isTabValue(hash)) {
      setTab(hash);
    }
  }, []);

  const handleChange = (value: string) => {
    if (isTabValue(value)) {
      setTab(value);
      if (typeof window !== 'undefined') {
        // Update hash without scroll
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}#${value}`,
        );
      }
    }
  };

  return (
    <Tabs value={tab} onValueChange={handleChange} className="w-full">
      <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="tong-quan">Tổng quan</TabsTrigger>
        <TabsTrigger value="ke-hoach">Kế hoạch</TabsTrigger>
        <TabsTrigger value="du-toan">Dự toán</TabsTrigger>
        <TabsTrigger value="tai-lieu">
          Tài liệu ({project.documents.length})
        </TabsTrigger>
        <TabsTrigger value="trien-khai">
          Triển khai
          {project.contactedConsulate ? ' ✓' : ''}
        </TabsTrigger>
        <TabsTrigger value="bao-cao">
          Báo cáo
          {report?.status === 'APPROVED' ? ' ✓' : ''}
          {report?.status === 'SUBMITTED' ? ' …' : ''}
          {reportSlaWarning ? ' ⚠' : ''}
        </TabsTrigger>
        <TabsTrigger value="nghiem-thu">
          Nghiệm thu
          {acceptance ? ' ✓' : ''}
        </TabsTrigger>
        <TabsTrigger value="tai-chinh">
          Tài chính ({financialRecords.length})
        </TabsTrigger>
        <TabsTrigger value="dieu-chinh">
          Điều chỉnh ({amendments.length})
        </TabsTrigger>
        <TabsTrigger value="lich-su">
          Lịch sử ({project.versions.length})
        </TabsTrigger>
        <TabsTrigger value="nhat-ky">Nhật ký</TabsTrigger>
      </TabsList>

      <TabsContent value="tong-quan">
        <TongQuanTab
          project={project}
          catalogs={catalogs}
          timeline={timeline}
        />
      </TabsContent>
      <TabsContent value="ke-hoach">
        <KeHoachTab project={project} />
      </TabsContent>
      <TabsContent value="du-toan">
        <DuToanTab project={project} />
      </TabsContent>
      <TabsContent value="tai-lieu">
        <TaiLieuTab project={project} />
      </TabsContent>
      <TabsContent value="trien-khai">
        <ImplementationTab
          project={project}
          isOwner={isOwner}
          canManage={canManageImpl}
        />
      </TabsContent>
      <TabsContent value="bao-cao">
        <BaoCaoTab
          project={project}
          initialReport={report}
          isOwner={isOwner}
          canReview={canReviewReport}
          reportSlaWarning={reportSlaWarning}
        />
      </TabsContent>
      <TabsContent value="nghiem-thu">
        <NghiemThuTab
          project={project}
          report={report}
          initialAcceptance={acceptance}
          isOwner={isOwner}
          canManage={canManageAcceptance}
        />
      </TabsContent>
      <TabsContent value="tai-chinh">
        <TaiChinhTab
          records={financialRecords}
          canManageFinance={canManageFinance}
        />
      </TabsContent>
      <TabsContent value="dieu-chinh">
        <AmendmentTab
          project={project}
          amendments={amendments}
          isOwner={isOwner}
          canApprove={canApproveAmendment}
        />
      </TabsContent>
      <TabsContent value="lich-su">
        <LichSuTab project={project} />
      </TabsContent>
      <TabsContent value="nhat-ky">
        <NhatKyTab entries={auditEntries} />
      </TabsContent>
    </Tabs>
  );
}

export default ProjectTabsShell;
