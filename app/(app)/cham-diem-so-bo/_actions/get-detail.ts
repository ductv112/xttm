'use server';

// getScoringDetail — load hồ sơ + ScoreSheet PRELIMINARY của chuyên viên.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseBudget,
  parseGeneralInfo,
  parseObjectives,
  parsePlan,
} from '@/lib/workflows/project';

export type ScoringCriterionTree = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weight: number;
  parentId: string | null;
  appliesToKinds: string[];
  children: ScoringCriterionTree[];
};

export type ScoreEntry = {
  criterionId: string;
  score: number; // 0-10 thang điểm
  comment?: string;
};

export type ScoringDetail = {
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
  };
  scoreSheet: {
    id: string | null;
    status: 'DRAFT' | 'SUBMITTED';
    scores: ScoreEntry[];
    totalScore: number | null;
    comment: string | null;
    submittedAt: Date | null;
  };
  criteria: ScoringCriterionTree[];
  isAssignedReviewer: boolean;
};

export async function getScoringDetail(
  projectId: string,
): Promise<ScoringDetail | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: { select: { name: true } },
      programCycle: { select: { year: true } },
    },
  });
  if (!project || project.deletedAt) return null;
  if (project.status !== 'VALID') {
    // Outside the scoring phase
    return null;
  }

  const isAssignedReviewer = project.assignedReviewerId === session.user.id;
  if (!isAssignedReviewer) {
    return null;
  }

  // Load criteria — only those applying to this kind
  const criteriaRows = await prisma.scoringCriterion.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  // Filter by kind if appliesToKinds is set
  const filtered = criteriaRows.filter((c) => {
    if (!c.appliesToKinds) return true;
    try {
      const arr = JSON.parse(c.appliesToKinds);
      if (!Array.isArray(arr)) return true;
      if (arr.length === 0) return true;
      return arr.includes(project.kind);
    } catch {
      return true;
    }
  });

  // Build tree (group → children)
  const byId = new Map<string, ScoringCriterionTree>();
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
  const roots: ScoringCriterionTree[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Load existing ScoreSheet (PRELIMINARY) for current reviewer
  const existing = await prisma.scoreSheet.findFirst({
    where: {
      projectId: project.id,
      reviewerId: session.user.id,
      kind: 'PRELIMINARY',
    },
  });

  let scores: ScoreEntry[] = [];
  if (existing?.scoresJson) {
    try {
      const parsed = JSON.parse(existing.scoresJson);
      if (Array.isArray(parsed)) {
        scores = parsed.filter(
          (e: unknown): e is ScoreEntry =>
            typeof e === 'object' &&
            e !== null &&
            typeof (e as ScoreEntry).criterionId === 'string' &&
            typeof (e as ScoreEntry).score === 'number',
        );
      }
    } catch {
      scores = [];
    }
  }

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
    },
    scoreSheet: {
      id: existing?.id ?? null,
      status: (existing?.status as 'DRAFT' | 'SUBMITTED') ?? 'DRAFT',
      scores,
      totalScore: existing?.totalScore ?? null,
      comment: existing?.comment ?? null,
      submittedAt: existing?.submittedAt ?? null,
    },
    criteria: roots,
    isAssignedReviewer,
  };
}

function safeParseArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
