'use server';

// listAssignmentBoard — return both queues for /phan-cong drag-drop board:
//   1. unassignedProjects: Project.status=ASSIGNED và assignedReviewerId=null (chờ phân công)
//   2. inReviewProjects: Project.status=IN_REVIEW (đã có chuyên viên, đang kiểm tra)
//   3. staff: list CHUYENVIEN users với current load count (số đề án đang IN_REVIEW assigned cho họ)

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { ROLES, type Role } from '@/lib/constants';

export type StaffWithLoad = {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  loadCount: number; // số đề án đang IN_REVIEW
  totalAssigned: number; // tất cả đề án đang được giao (IN_REVIEW + SUPPLEMENT_REQUIRED + RESUBMITTED + ASSIGNED có gán)
};

export type AssignmentProject = {
  id: string;
  code: string;
  name: string;
  kind: string;
  status: string;
  organizationName: string;
  programCycleYear: number;
  submittedAt: Date | null;
  receivedAt: Date | null;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  totalBudget: number | null;
};

export type AssignmentBoardData = {
  unassignedProjects: AssignmentProject[];
  assignedProjects: AssignmentProject[]; // những hồ sơ đã có chuyên viên (IN_REVIEW + RESUBMITTED + SUPPLEMENT_REQUIRED + ASSIGNED có gán)
  staff: StaffWithLoad[];
};

export async function listAssignmentBoard(): Promise<AssignmentBoardData> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tiep-nhan', 'assign'))) {
    throw new Error('Bạn không có quyền phân công hồ sơ');
  }

  // 1. Unassigned queue: ASSIGNED status without reviewer
  const unassigned = await prisma.project.findMany({
    where: {
      status: 'ASSIGNED',
      assignedReviewerId: null,
      deletedAt: null,
    },
    orderBy: [{ receivedAt: 'asc' }, { submittedAt: 'asc' }],
    include: {
      organization: { select: { name: true } },
      programCycle: { select: { year: true } },
    },
  });

  // 2. Already assigned (in-review or pending action)
  const assigned = await prisma.project.findMany({
    where: {
      status: { in: ['IN_REVIEW', 'SUPPLEMENT_REQUIRED', 'RESUBMITTED', 'ASSIGNED'] },
      assignedReviewerId: { not: null },
      deletedAt: null,
    },
    orderBy: [{ status: 'asc' }, { receivedAt: 'asc' }],
    include: {
      organization: { select: { name: true } },
      programCycle: { select: { year: true } },
    },
  });

  // Resolve reviewer names in batch
  const reviewerIds = Array.from(
    new Set(
      [...assigned]
        .map((p) => p.assignedReviewerId)
        .filter((x): x is string => Boolean(x)),
    ),
  );
  const reviewers = reviewerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const reviewerNameById = new Map(reviewers.map((r) => [r.id, r.fullName]));

  const mapProject = (p: (typeof unassigned)[number]): AssignmentProject => {
    let totalBudget: number | null = null;
    if (p.budgetJson) {
      try {
        const parsed = JSON.parse(p.budgetJson);
        if (parsed && typeof parsed.total === 'number') totalBudget = parsed.total;
      } catch {
        totalBudget = null;
      }
    }
    if (totalBudget === null && typeof p.proposedBudget === 'number') {
      totalBudget = p.proposedBudget;
    }
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      kind: p.kind,
      status: p.status,
      organizationName: p.organization.name,
      programCycleYear: p.programCycle.year,
      submittedAt: p.submittedAt,
      receivedAt: p.receivedAt,
      assignedToUserId: p.assignedReviewerId,
      assignedToUserName: p.assignedReviewerId
        ? reviewerNameById.get(p.assignedReviewerId) ?? null
        : null,
      totalBudget,
    };
  };

  // 3. Staff with load
  const staffUsers = await prisma.user.findMany({
    where: { role: ROLES.CHUYENVIEN, isActive: true },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
    },
    orderBy: { fullName: 'asc' },
  });

  // Count loads per staff (in-review = primary load metric)
  const loadByStaff = new Map<string, { inReview: number; total: number }>();
  for (const p of assigned) {
    if (!p.assignedReviewerId) continue;
    const existing = loadByStaff.get(p.assignedReviewerId) ?? {
      inReview: 0,
      total: 0,
    };
    if (p.status === 'IN_REVIEW') existing.inReview += 1;
    existing.total += 1;
    loadByStaff.set(p.assignedReviewerId, existing);
  }

  const staff: StaffWithLoad[] = staffUsers.map((u) => {
    const load = loadByStaff.get(u.id) ?? { inReview: 0, total: 0 };
    return {
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      loadCount: load.inReview,
      totalAssigned: load.total,
    };
  });

  return {
    unassignedProjects: unassigned.map(mapProject),
    assignedProjects: assigned.map(mapProject),
    staff,
  };
}
