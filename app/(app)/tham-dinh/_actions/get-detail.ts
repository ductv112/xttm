'use server';

// getEvaluationDetail — load đề án + ScoreSheet EVALUATION của thành viên hội đồng.
// Returns null khi không có quyền (cross-COI mitigation T-07-01-01).

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseBudget,
  parseGeneralInfo,
  parseObjectives,
  parsePlan,
} from '@/lib/workflows/project';

export type EvaluationCriterionTree = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weight: number;
  parentId: string | null;
  appliesToKinds: string[];
  children: EvaluationCriterionTree[];
};

export type EvaluationScoreEntry = {
  criterionId: string;
  score: number;
  comment?: string;
};

export type EvaluationDetail = {
  project: {
    id: string;
    code: string;
    name: string;
    kind: string;
    status: string;
    organizationName: string;
    programCycleYear: number;
    objectives: ReturnType<typeof parseObjectives>;
    generalInfo: ReturnType<typeof parseGeneralInfo>;
    plan: ReturnType<typeof parsePlan>;
    budget: ReturnType<typeof parseBudget>;
    pmContactId: string | null;
    proposedBudget: number | null;
    pmSnapshot: {
      name: string;
      title: string;
      role: string;
      email: string;
      phone: string;
    } | null;
  };
  council: {
    id: string;
    name: string;
    term: string;
    lockStatus: 'OPEN' | 'LOCKED';
  };
  member: {
    role: string;
  };
  scoreSheet: {
    id: string | null;
    status: 'DRAFT' | 'SUBMITTED';
    scores: EvaluationScoreEntry[];
    totalScore: number | null;
    comment: string | null;
    conflictOfInterest: boolean;
    submittedAt: Date | null;
  };
  criteria: EvaluationCriterionTree[];
  catalogs: {
    industrySectors: Array<{ id: string; name: string }>;
    markets: Array<{ id: string; name: string }>;
    countries: Array<{ id: string; name: string }>;
    promotionTypes: Array<{ id: string; name: string }>;
  };
};

function safeParseArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function getEvaluationDetail(
  projectId: string,
): Promise<EvaluationDetail | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const userId = session.user.id;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: { select: { name: true, id: true } },
      programCycle: { select: { year: true } },
    },
  });
  if (!project || project.deletedAt) return null;

  // Find council assignment + verify member
  const assignment = await prisma.projectCouncilAssignment.findFirst({
    where: { projectId },
    include: {
      council: {
        include: {
          members: { where: { userId } },
        },
      },
    },
  });
  if (!assignment) return null;
  const member = assignment.council.members[0];
  if (!member) return null; // Cross-COI guard

  // Resolve PM contact snapshot from organization profile
  let pmSnapshot: EvaluationDetail['project']['pmSnapshot'] = null;
  if (project.pmContactId) {
    const profile = await prisma.organizationProfile.findUnique({
      where: { organizationId: project.organization.id },
      select: { contactsJson: true },
    });
    if (profile?.contactsJson) {
      try {
        const arr = JSON.parse(profile.contactsJson);
        if (Array.isArray(arr)) {
          const c = arr.find(
            (x: { id?: string }) => x?.id === project.pmContactId,
          );
          if (c) {
            pmSnapshot = {
              name: c.name ?? '',
              title: c.title ?? '',
              role: c.role ?? '',
              email: c.email ?? '',
              phone: c.phone ?? '',
            };
          }
        }
      } catch {
        pmSnapshot = null;
      }
    }
  }

  // Load criteria for project's kind
  const criteriaRows = await prisma.scoringCriterion.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
  const filtered = criteriaRows.filter((c) => {
    if (!c.appliesToKinds) return true;
    try {
      const arr = JSON.parse(c.appliesToKinds);
      if (!Array.isArray(arr) || arr.length === 0) return true;
      return arr.includes(project.kind);
    } catch {
      return true;
    }
  });

  const byId = new Map<string, EvaluationCriterionTree>();
  for (const c of filtered) {
    byId.set(c.id, {
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      weight: c.weight,
      parentId: c.parentId,
      appliesToKinds: c.appliesToKinds ? safeParseArray(c.appliesToKinds) : [],
      children: [],
    });
  }
  const roots: EvaluationCriterionTree[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // ScoreSheet for this user
  const existing = await prisma.scoreSheet.findFirst({
    where: { projectId, reviewerId: userId, kind: 'EVALUATION' },
  });

  let scores: EvaluationScoreEntry[] = [];
  if (existing?.scoresJson) {
    try {
      const parsed = JSON.parse(existing.scoresJson);
      if (Array.isArray(parsed)) {
        scores = parsed.filter(
          (e: unknown): e is EvaluationScoreEntry =>
            typeof e === 'object' &&
            e !== null &&
            typeof (e as EvaluationScoreEntry).criterionId === 'string' &&
            typeof (e as EvaluationScoreEntry).score === 'number',
        );
      }
    } catch {
      scores = [];
    }
  }

  // Catalogs (resolve name lookups)
  const [industrySectors, markets, countries, promotionTypes] =
    await Promise.all([
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

  return {
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      kind: project.kind,
      status: project.status,
      organizationName: project.organization.name,
      programCycleYear: project.programCycle.year,
      objectives: parseObjectives(project.objectivesJson),
      generalInfo: parseGeneralInfo(project.generalInfoJson),
      plan: parsePlan(project.planJson),
      budget: parseBudget(project.budgetJson),
      pmContactId: project.pmContactId,
      proposedBudget: project.proposedBudget,
      pmSnapshot,
    },
    council: {
      id: assignment.council.id,
      name: assignment.council.name,
      term: assignment.council.term,
      lockStatus:
        (assignment.council.lockStatus as 'OPEN' | 'LOCKED') ?? 'OPEN',
    },
    member: { role: member.role },
    scoreSheet: {
      id: existing?.id ?? null,
      status: (existing?.status as 'DRAFT' | 'SUBMITTED') ?? 'DRAFT',
      scores,
      totalScore: existing?.totalScore ?? null,
      comment: existing?.comment ?? null,
      conflictOfInterest: existing?.conflictOfInterest ?? false,
      submittedAt: existing?.submittedAt ?? null,
    },
    criteria: roots,
    catalogs: { industrySectors, markets, countries, promotionTypes },
  };
}
