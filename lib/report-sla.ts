// Phase 9 (M5) — SLA helper cho báo cáo kết quả.
// REPORT-07: cảnh báo 15 ngày sau hoạt động kết thúc mà chưa nộp báo cáo.

import { prisma } from './prisma';
import { getSLAThresholds } from './system-config';

export type ReportOverdueWarning = {
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  endDate: Date;
  daysOverdue: number;
};

/**
 * Find projects that have ended (timeRange.end + plannedEndAt) more than
 * SLA.REPORT_DAYS days ago AND have no SUBMITTED/APPROVED Report yet.
 */
export async function listOverdueReportWarnings(): Promise<
  ReportOverdueWarning[]
> {
  const sla = await getSLAThresholds();
  const reportDays = sla.REPORT_DAYS ?? 15;

  const threshold = new Date(Date.now() - reportDays * 86_400_000);

  // Find projects with plannedEndAt before threshold and status IN_PROGRESS or COMPLETED
  const projects = await prisma.project.findMany({
    where: {
      status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      plannedEndAt: { not: null, lte: threshold },
    },
    select: {
      id: true,
      code: true,
      name: true,
      plannedEndAt: true,
      organization: { select: { name: true } },
    },
  });

  if (projects.length === 0) return [];

  // Filter out those with SUBMITTED/APPROVED reports
  const projectIds = projects.map((p) => p.id);
  const submittedReports = await prisma.report.findMany({
    where: {
      projectId: { in: projectIds },
      status: { in: ['SUBMITTED', 'APPROVED'] },
    },
    select: { projectId: true },
  });
  const submittedSet = new Set(submittedReports.map((r) => r.projectId));

  const now = Date.now();
  const warnings: ReportOverdueWarning[] = [];
  for (const p of projects) {
    if (submittedSet.has(p.id)) continue;
    if (!p.plannedEndAt) continue;
    const daysOverdue = Math.floor(
      (now - p.plannedEndAt.getTime()) / 86_400_000,
    );
    warnings.push({
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      organizationName: p.organization.name,
      endDate: p.plannedEndAt,
      daysOverdue,
    });
  }

  return warnings.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Check single project: returns SLA warning if applicable, else null.
 */
export async function checkProjectReportSLA(
  projectId: string,
): Promise<ReportOverdueWarning | null> {
  const sla = await getSLAThresholds();
  const reportDays = sla.REPORT_DAYS ?? 15;
  const threshold = new Date(Date.now() - reportDays * 86_400_000);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      name: true,
      plannedEndAt: true,
      status: true,
      organization: { select: { name: true } },
    },
  });
  if (!project) return null;
  if (!project.plannedEndAt || project.plannedEndAt > threshold) return null;
  if (!['IN_PROGRESS', 'COMPLETED'].includes(project.status)) return null;

  const submitted = await prisma.report.findFirst({
    where: {
      projectId,
      status: { in: ['SUBMITTED', 'APPROVED'] },
    },
    select: { id: true },
  });
  if (submitted) return null;

  const daysOverdue = Math.floor(
    (Date.now() - project.plannedEndAt.getTime()) / 86_400_000,
  );
  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    organizationName: project.organization.name,
    endDate: project.plannedEndAt,
    daysOverdue,
  };
}
