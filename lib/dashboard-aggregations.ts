// Dashboard data aggregations — Phase 10 Plan 10-01.
// Pure data layer, server-side only. Aggregates Project / Contract / Report / Notification
// metrics for HERO Dashboard (DASH-01..12 + ALERT-05 SLA detection).
//
// All queries scoped by year (Project.year + ProgramCycle.year).
// Role-aware filtering: DONVI sees only their org's projects;
// other roles see all (BANQL/CHUYENVIEN/HOIDONG/LANHDAO/ADMIN/TAICHINH).

import { prisma } from '@/lib/prisma';
import { getSLAThresholds } from '@/lib/system-config';
import { ROLES, type Role } from '@/lib/constants';
import { daysAgo, daysFromNow } from '@/lib/date';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type DashboardStats = {
  projectCount: number;
  registeredProjectCount: number;
  approvedProjectCount: number;
  inProgressProjectCount: number;
  registeredBudget: number;
  approvedBudget: number;
  signedBudget: number;
  disbursedBudget: number;
  orgCount: number;
  orgApprovedCount: number;
  completionPercent: number;
  completedProjects: number;
};

export type AlertBudgetVarianceItem = {
  projectId: string;
  code: string;
  name: string;
  registered: number;
  approved: number;
  variance: number;
  organizationName: string;
};

export type AlertContractDelayItem = {
  projectId: string;
  code: string;
  name: string;
  daysOverdue: number;
  approvedDate: Date | null;
  organizationName: string;
};

export type AlertReportOverdueItem = {
  projectId: string;
  code: string;
  name: string;
  daysOverdue: number;
  endDate: Date | null;
  organizationName: string;
};

export type AlertConsulateItem = {
  projectId: string;
  code: string;
  name: string;
  daysToEvent: number;
  startDate: Date | null;
  countryName: string | null;
  organizationName: string;
};

export type ChartByKindItem = {
  kind: string;
  kindLabel: string;
  count: number;
};

export type ChartByBudgetStatusItem = {
  status: string;
  amount: number;
  label: string;
};

export type DashboardSummary = {
  year: number;
  stats: DashboardStats;
  alertBudgetVariance: AlertBudgetVarianceItem[];
  alertContractDelay: AlertContractDelayItem[];
  alertReportOverdue: AlertReportOverdueItem[];
  alertConsulate: AlertConsulateItem[];
  chartByKind: ChartByKindItem[];
  chartByBudgetStatus: ChartByBudgetStatusItem[];
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Build org-scope filter for Project queries.
 * DONVI sees only their org; other roles see all.
 */
function projectOrgFilter(role: Role, orgId: string | null) {
  if (role === ROLES.DONVI && orgId) {
    return { organizationId: orgId };
  }
  return {};
}

const PROJECT_KIND_LABELS: Record<string, string> = {
  EXPORT_EXHIBITION: 'Hội chợ XK',
  INTL_CONFERENCE: 'Hội nghị QT',
  DOMESTIC_FAIR: 'Hội chợ trong nước',
  TRADE_DELEGATION_OUT: 'Đoàn ra',
  TRADE_DELEGATION_IN: 'Đoàn vào',
  TRADE_INFO_EXPORT: 'Thông tin XK',
  TRADE_INFO_DOMESTIC: 'Thông tin TN',
  TRAINING: 'Đào tạo',
  OTHER: 'Khác',
};

function getProjectKindLabel(kind: string): string {
  return PROJECT_KIND_LABELS[kind] ?? kind;
}

// International project kinds — used to filter consulate alert.
const INTERNATIONAL_KINDS = new Set([
  'EXPORT_EXHIBITION',
  'INTL_CONFERENCE',
  'TRADE_DELEGATION_OUT',
  'TRADE_DELEGATION_IN',
]);

type GeneralInfoTimeRange = {
  start?: string | null;
  end?: string | null;
};

type GeneralInfoShape = {
  countryIds?: string[];
  timeRange?: GeneralInfoTimeRange;
};

function safeParseGeneralInfo(json: string | null): GeneralInfoShape {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      return parsed as GeneralInfoShape;
    }
    return {};
  } catch {
    return {};
  }
}

// -----------------------------------------------------------------------------
// Main entry — aggregate everything in one server-side call
// -----------------------------------------------------------------------------

export async function getDashboardSummary(
  year: number,
  role: Role,
  orgId: string | null,
): Promise<DashboardSummary> {
  const sla = await getSLAThresholds();
  const orgFilter = projectOrgFilter(role, orgId);

  // -------------------------------------------------------------------------
  // 1. Stats (4 cards)
  // -------------------------------------------------------------------------
  const projects = await prisma.project.findMany({
    where: {
      year,
      deletedAt: null,
      ...orgFilter,
    },
    select: {
      id: true,
      code: true,
      name: true,
      kind: true,
      status: true,
      proposedBudget: true,
      approvedBudget: true,
      organizationId: true,
      generalInfoJson: true,
      plannedStartAt: true,
      plannedEndAt: true,
      contactedConsulate: true,
      organization: { select: { name: true } },
      contract: {
        select: {
          id: true,
          totalValue: true,
          status: true,
          signedDate: true,
        },
      },
    },
  });

  // Decision dates for ApprovalDecision lookup (contract delay alert)
  const projectIds = projects.map((p) => p.id);

  const projectCount = projects.length;
  const registeredProjectCount = projects.filter(
    (p) => p.status !== 'DRAFT' && p.status !== 'CANCELLED',
  ).length;
  const approvedProjectCount = projects.filter(
    (p) =>
      p.status === 'APPROVED' ||
      p.status === 'IN_PROGRESS' ||
      p.status === 'COMPLETED',
  ).length;
  const inProgressProjectCount = projects.filter(
    (p) => p.status === 'IN_PROGRESS',
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === 'COMPLETED',
  ).length;

  const registeredBudget = projects.reduce(
    (sum, p) => sum + (p.proposedBudget ?? 0),
    0,
  );
  const approvedBudget = projects.reduce(
    (sum, p) => sum + (p.approvedBudget ?? 0),
    0,
  );
  const signedBudget = projects.reduce(
    (sum, p) =>
      sum +
      (p.contract && p.contract.status !== 'DRAFT'
        ? (p.contract.totalValue ?? 0)
        : 0),
    0,
  );

  // Disbursed budget = sum of FinancialRecord.amount where status DISBURSED|SETTLED
  const disbursedAgg = await prisma.financialRecord.aggregate({
    _sum: { amount: true },
    where: {
      projectId: { in: projectIds.length > 0 ? projectIds : ['__none__'] },
      status: { in: ['DISBURSED', 'SETTLED'] },
    },
  });
  const disbursedBudget = disbursedAgg._sum.amount ?? 0;

  // Org count: distinct orgs with at least 1 project this year
  const distinctOrgIds = new Set(projects.map((p) => p.organizationId));
  const orgCount = distinctOrgIds.size;
  const orgApprovedAgg = await prisma.organizationProfile.count({
    where: { status: 'APPROVED' },
  });
  const orgApprovedCount = orgApprovedAgg;

  const completionPercent =
    registeredProjectCount > 0
      ? Math.round((completedProjects / registeredProjectCount) * 100)
      : 0;

  // -------------------------------------------------------------------------
  // 2. Alert: Budget variance (approvedBudget > registeredBudget)
  // -------------------------------------------------------------------------
  const alertBudgetVariance: AlertBudgetVarianceItem[] = projects
    .filter(
      (p) =>
        p.approvedBudget != null &&
        p.proposedBudget != null &&
        p.approvedBudget > p.proposedBudget,
    )
    .map((p) => ({
      projectId: p.id,
      code: p.code,
      name: p.name,
      registered: p.proposedBudget ?? 0,
      approved: p.approvedBudget ?? 0,
      variance: (p.approvedBudget ?? 0) - (p.proposedBudget ?? 0),
      organizationName: p.organization.name,
    }))
    .sort((a, b) => b.variance - a.variance);

  // -------------------------------------------------------------------------
  // 3. Alert: Contract delay (APPROVED > 60d ago, contract DRAFT or missing)
  // -------------------------------------------------------------------------
  const contractAlertCutoff = daysAgo(sla.CONTRACT_DAYS);
  // Look up ApprovalDecision dates for these projects
  const approvedSubmissions = await prisma.submissionDraft.findMany({
    where: {
      decision: { isNot: null },
    },
    include: {
      decision: {
        select: {
          decisionDate: true,
          approvedItemsJson: true,
        },
      },
    },
  });

  // Build map: projectId → earliest decisionDate
  const projectDecisionDate = new Map<string, Date>();
  for (const sub of approvedSubmissions) {
    if (!sub.decision) continue;
    let approvedItems: Array<{ projectId: string }> = [];
    try {
      const parsed = JSON.parse(sub.decision.approvedItemsJson);
      if (Array.isArray(parsed)) approvedItems = parsed;
    } catch {
      continue;
    }
    for (const item of approvedItems) {
      const existing = projectDecisionDate.get(item.projectId);
      if (!existing || sub.decision.decisionDate < existing) {
        projectDecisionDate.set(item.projectId, sub.decision.decisionDate);
      }
    }
  }

  const alertContractDelay: AlertContractDelayItem[] = projects
    .filter((p) => {
      if (
        p.status !== 'APPROVED' &&
        p.status !== 'IN_PROGRESS' &&
        p.status !== 'COMPLETED'
      ) {
        return false;
      }
      // Contract must be DRAFT or missing — i.e. not yet SIGNED
      if (p.contract && p.contract.status !== 'DRAFT') return false;
      const decisionDate = projectDecisionDate.get(p.id);
      if (!decisionDate) return false;
      return decisionDate < contractAlertCutoff;
    })
    .map((p) => {
      const decisionDate = projectDecisionDate.get(p.id) ?? null;
      const daysOverdue = decisionDate
        ? Math.floor(
            (Date.now() - decisionDate.getTime()) / 86_400_000,
          ) - sla.CONTRACT_DAYS
        : 0;
      return {
        projectId: p.id,
        code: p.code,
        name: p.name,
        daysOverdue,
        approvedDate: decisionDate,
        organizationName: p.organization.name,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // -------------------------------------------------------------------------
  // 4. Alert: Report overdue (event ended > 15d, report not SUBMITTED/APPROVED)
  // -------------------------------------------------------------------------
  const reportCutoff = daysAgo(sla.REPORT_DAYS);
  // Get reports for these projects
  const reports = await prisma.report.findMany({
    where: {
      projectId: { in: projectIds.length > 0 ? projectIds : ['__none__'] },
    },
    select: {
      projectId: true,
      status: true,
    },
  });
  const projectReportStatus = new Map<string, string[]>();
  for (const r of reports) {
    const arr = projectReportStatus.get(r.projectId) ?? [];
    arr.push(r.status);
    projectReportStatus.set(r.projectId, arr);
  }

  const alertReportOverdue: AlertReportOverdueItem[] = projects
    .filter((p) => {
      // Project must be IN_PROGRESS or have ended planned event
      if (p.status !== 'IN_PROGRESS' && p.status !== 'APPROVED') return false;
      if (!p.plannedEndAt) return false;
      if (p.plannedEndAt > reportCutoff) return false;
      // Report not yet SUBMITTED/APPROVED
      const statuses = projectReportStatus.get(p.id) ?? [];
      if (statuses.some((s) => s === 'SUBMITTED' || s === 'APPROVED'))
        return false;
      return true;
    })
    .map((p) => {
      const endDate = p.plannedEndAt!;
      const daysOverdue =
        Math.floor((Date.now() - endDate.getTime()) / 86_400_000) -
        sla.REPORT_DAYS;
      return {
        projectId: p.id,
        code: p.code,
        name: p.name,
        daysOverdue,
        endDate,
        organizationName: p.organization.name,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // -------------------------------------------------------------------------
  // 5. Alert: International event consulate not contacted (< 30d to event)
  // -------------------------------------------------------------------------
  const consulateCutoff = daysFromNow(sla.CONSULATE_DAYS);

  // Country lookup for friendly names
  const countryRows = await prisma.country.findMany({
    select: { id: true, name: true },
  });
  const countryMap = new Map(countryRows.map((c) => [c.id, c.name] as const));

  const alertConsulate: AlertConsulateItem[] = projects
    .filter((p) => {
      if (!INTERNATIONAL_KINDS.has(p.kind)) return false;
      if (p.contactedConsulate) return false;
      if (
        p.status !== 'APPROVED' &&
        p.status !== 'IN_PROGRESS' &&
        p.status !== 'EVALUATING'
      ) {
        return false;
      }
      const start = p.plannedStartAt;
      if (!start) return false;
      // Within consulate window: start is in the future and < 30d away
      if (start < new Date()) return false;
      if (start > consulateCutoff) return false;
      return true;
    })
    .map((p) => {
      const startDate = p.plannedStartAt!;
      const daysToEvent = Math.ceil(
        (startDate.getTime() - Date.now()) / 86_400_000,
      );
      const generalInfo = safeParseGeneralInfo(p.generalInfoJson);
      const firstCountryId = generalInfo.countryIds?.[0];
      const countryName = firstCountryId
        ? (countryMap.get(firstCountryId) ?? null)
        : null;
      return {
        projectId: p.id,
        code: p.code,
        name: p.name,
        daysToEvent,
        startDate,
        countryName,
        organizationName: p.organization.name,
      };
    })
    .sort((a, b) => a.daysToEvent - b.daysToEvent);

  // -------------------------------------------------------------------------
  // 6. Chart: Projects by kind
  // -------------------------------------------------------------------------
  const kindCounts = new Map<string, number>();
  for (const p of projects) {
    kindCounts.set(p.kind, (kindCounts.get(p.kind) ?? 0) + 1);
  }
  const chartByKind: ChartByKindItem[] = Array.from(kindCounts.entries())
    .map(([kind, count]) => ({
      kind,
      kindLabel: getProjectKindLabel(kind),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // -------------------------------------------------------------------------
  // 7. Chart: Budget by status (registered vs approved vs signed vs disbursed)
  // -------------------------------------------------------------------------
  const chartByBudgetStatus: ChartByBudgetStatusItem[] = [
    { status: 'registered', amount: registeredBudget, label: 'Đăng ký' },
    { status: 'approved', amount: approvedBudget, label: 'Phê duyệt' },
    { status: 'signed', amount: signedBudget, label: 'Hợp đồng' },
    { status: 'disbursed', amount: disbursedBudget, label: 'Giải ngân' },
  ];

  // -------------------------------------------------------------------------
  return {
    year,
    stats: {
      projectCount,
      registeredProjectCount,
      approvedProjectCount,
      inProgressProjectCount,
      registeredBudget,
      approvedBudget,
      signedBudget,
      disbursedBudget,
      orgCount,
      orgApprovedCount,
      completionPercent,
      completedProjects,
    },
    alertBudgetVariance,
    alertContractDelay,
    alertReportOverdue,
    alertConsulate,
    chartByKind,
    chartByBudgetStatus,
  };
}

// -----------------------------------------------------------------------------
// Helper: list available years (for filter dropdown)
// -----------------------------------------------------------------------------

export async function listDashboardYears(): Promise<number[]> {
  const cycles = await prisma.programCycle.findMany({
    select: { year: true },
    orderBy: { year: 'desc' },
  });
  const years = cycles.map((c) => c.year);
  if (years.length === 0) {
    return [new Date().getFullYear()];
  }
  return years;
}
