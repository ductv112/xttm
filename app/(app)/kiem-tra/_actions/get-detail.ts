'use server';

// getReviewProjectDetail — load hồ sơ chuyên viên đang kiểm tra với entity-aware guard.
// T-06-01-01 (high): Chuyên viên ONLY thấy hồ sơ session.user.id === assignedReviewerId,
// trừ khi role có 'tiep-nhan:read' (BANQL/ADMIN — view-all role).

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { ROLES, type Role } from '@/lib/constants';
import {
  parseBudget,
  parseGeneralInfo,
  parseObjectives,
  parsePlan,
  type ProjectStatus,
} from '@/lib/workflows/project';
import {
  CHECKLIST_ITEMS,
  parseChecklist,
  computeChecklistPassRatio,
  CHECKLIST_PASS_THRESHOLD,
} from '@/lib/intake-checklist';

export type ReviewProjectDetail = {
  id: string;
  code: string;
  name: string;
  kind: string;
  status: ProjectStatus;
  organizationId: string;
  organizationName: string;
  programCycleYear: number;
  generalInfo: ReturnType<typeof parseGeneralInfo>;
  objectives: ReturnType<typeof parseObjectives>;
  plan: ReturnType<typeof parsePlan>;
  budget: ReturnType<typeof parseBudget>;
  pmContactId: string | null;
  receivedAt: Date | null;
  assignedAt: Date | null;
  assignedReviewerId: string | null;
  assignedReviewerName: string | null;
  supplementRequestReason: string | null;
  formalRejectionReason: string | null;
  passedFormalCheck: boolean;
  checklist: ReturnType<typeof parseChecklist>;
  checklistProgress: ReturnType<typeof computeChecklistPassRatio>;
  passThreshold: number;
  // Static checklist definition for the form
  checklistDefinition: typeof CHECKLIST_ITEMS;
};

export async function getReviewProjectDetail(
  projectId: string,
): Promise<ReviewProjectDetail | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: { select: { name: true } },
      programCycle: { select: { year: true } },
    },
  });
  if (!project || project.deletedAt) return null;

  // Authorization (T-06-01-01):
  //   - Assigned reviewer always sees own project
  //   - Roles with view-all (BANQL/ADMIN read tiep-nhan) — also see
  //   - Else null (no leak)
  const isAssignedReviewer =
    project.assignedReviewerId === session.user.id;
  const canViewAll =
    role === ROLES.ADMIN ||
    role === ROLES.BANQL ||
    role === ROLES.LANHDAO ||
    (await canFromDB(role, 'tiep-nhan', 'update'));
  if (!isAssignedReviewer && !canViewAll) {
    return null;
  }

  // Resolve reviewer name
  let assignedReviewerName: string | null = null;
  if (project.assignedReviewerId) {
    const reviewer = await prisma.user.findUnique({
      where: { id: project.assignedReviewerId },
      select: { fullName: true },
    });
    assignedReviewerName = reviewer?.fullName ?? null;
  }

  const checklist = parseChecklist(project.checklistJson);
  const checklistProgress = computeChecklistPassRatio(checklist);

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    kind: project.kind,
    status: project.status as ProjectStatus,
    organizationId: project.organizationId,
    organizationName: project.organization.name,
    programCycleYear: project.programCycle.year,
    generalInfo: parseGeneralInfo(project.generalInfoJson),
    objectives: parseObjectives(project.objectivesJson),
    plan: parsePlan(project.planJson),
    budget: parseBudget(project.budgetJson),
    pmContactId: project.pmContactId,
    receivedAt: project.receivedAt,
    assignedAt: project.assignedAt,
    assignedReviewerId: project.assignedReviewerId,
    assignedReviewerName,
    supplementRequestReason: project.supplementRequestReason,
    formalRejectionReason: project.formalRejectionReason,
    passedFormalCheck: project.passedFormalCheck,
    checklist,
    checklistProgress,
    passThreshold: CHECKLIST_PASS_THRESHOLD,
    checklistDefinition: CHECKLIST_ITEMS,
  };
}
