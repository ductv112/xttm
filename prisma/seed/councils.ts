// Phase 7 (M3) seed — 1 EvaluationCouncil for cycle 2026 + 3 CouncilMember +
// 2 ProjectCouncilAssignment + 2 ScoreSheet (1 DRAFT chair, 1 SUBMITTED phó).
//
// Strategy:
// - Use existing 'hoidong' user as Chủ tịch.
// - Generate 2 mock HOIDONG users (phó + ủy viên) with realistic Vietnamese names + bcrypt hash.
// - Pick 2 projects status=VALID|EVALUATING từ cycle 2026 to assign.
// - Set those projects to status=EVALUATING (transition VALID→EVALUATING).
// - Idempotent: upsert by stable keys.

import type { PrismaClient } from '@prisma/client';

import { hashPassword, logSeedStep } from './helpers';

const MOCK_USERS = [
  {
    username: 'hoidong2',
    password: 'Hd2@123',
    fullName: 'PGS.TS. Lương Văn Khoa',
    email: 'hoidong2@xttm.gov.vn',
    role: 'HOIDONG',
  },
  {
    username: 'hoidong3',
    password: 'Hd3@123',
    fullName: 'TS. Mai Thị Hồng Phượng',
    email: 'hoidong3@xttm.gov.vn',
    role: 'HOIDONG',
  },
] as const;

export async function seedCouncils(prisma: PrismaClient): Promise<void> {
  // Resolve cycle 2026
  const cycle2026 = await prisma.programCycle.findUnique({
    where: { year: 2026 },
    select: { id: true },
  });
  if (!cycle2026) {
    console.warn('[seedCouncils] cycle 2026 not found — skip');
    return;
  }

  // Resolve hoidong existing user (chủ tịch)
  const chair = await prisma.user.findUnique({
    where: { username: 'hoidong' },
    select: { id: true },
  });
  const banql = await prisma.user.findUnique({
    where: { username: 'banql' },
    select: { id: true },
  });
  if (!chair) {
    console.warn('[seedCouncils] user hoidong not found — skip');
    return;
  }

  // Resolve org for mock users (Cục XTTM)
  const cucXttm = await prisma.organization.findUnique({
    where: { code: 'CUC_XTTM' },
    select: { id: true },
  });

  // Upsert mock users
  const mockUsers: Array<{ id: string; username: string }> = [];
  for (const u of MOCK_USERS) {
    const passwordHash = await hashPassword(u.password);
    const upserted = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: true,
        organizationId: cucXttm?.id ?? null,
      },
      create: {
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: true,
        organizationId: cucXttm?.id ?? null,
      },
      select: { id: true, username: true },
    });
    mockUsers.push(upserted);
  }
  const phoUser = mockUsers.find((u) => u.username === 'hoidong2');
  const uyVienUser = mockUsers.find((u) => u.username === 'hoidong3');

  // Upsert council — find by exact name (no @unique on programCycleId+term yet)
  const COUNCIL_NAME =
    'Hội đồng Thẩm định Chương trình XTTM Quốc gia 2026 — Kỳ 1';
  let council = await prisma.evaluationCouncil.findFirst({
    where: { programCycleId: cycle2026.id, name: COUNCIL_NAME },
  });
  if (council) {
    council = await prisma.evaluationCouncil.update({
      where: { id: council.id },
      data: {
        term: 'Lần 1',
        lockStatus: 'OPEN',
        status: 'OPEN',
        createdById: banql?.id ?? null,
      },
    });
  } else {
    council = await prisma.evaluationCouncil.create({
      data: {
        programCycleId: cycle2026.id,
        name: COUNCIL_NAME,
        term: 'Lần 1',
        lockStatus: 'OPEN',
        status: 'OPEN',
        openAt: new Date(),
        createdById: banql?.id ?? null,
      },
    });
  }

  // Upsert members
  const memberSpecs: Array<{ userId: string; role: string }> = [];
  memberSpecs.push({ userId: chair.id, role: 'CHU_TICH' });
  if (phoUser) memberSpecs.push({ userId: phoUser.id, role: 'PHO' });
  if (uyVienUser) memberSpecs.push({ userId: uyVienUser.id, role: 'UY_VIEN' });

  for (const m of memberSpecs) {
    await prisma.councilMember.upsert({
      where: {
        councilId_userId: { councilId: council.id, userId: m.userId },
      },
      update: { role: m.role },
      create: {
        councilId: council.id,
        userId: m.userId,
        role: m.role,
      },
    });
  }

  // Pick 2 projects to assign — prefer VALID, then EVALUATING, in cycle 2026
  const candidates = await prisma.project.findMany({
    where: {
      programCycleId: cycle2026.id,
      status: { in: ['VALID', 'EVALUATING'] },
      deletedAt: null,
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    take: 2,
    select: { id: true, status: true, code: true, name: true },
  });
  if (candidates.length < 2) {
    console.warn(
      `[seedCouncils] expected ≥2 VALID/EVALUATING projects, found ${candidates.length} — proceed with available`,
    );
  }

  for (const p of candidates) {
    await prisma.projectCouncilAssignment.upsert({
      where: {
        councilId_projectId: { councilId: council.id, projectId: p.id },
      },
      update: {},
      create: {
        councilId: council.id,
        projectId: p.id,
      },
    });
    if (p.status === 'VALID') {
      await prisma.project.update({
        where: { id: p.id },
        data: { status: 'EVALUATING' },
      });
    }
  }

  // Score sheets — load criteria for weight calc
  const criteria = await prisma.scoringCriterion.findMany({
    where: { isActive: true },
    select: { id: true, code: true, weight: true, parentId: true },
  });

  // Create 1 DRAFT score sheet from chair on first project
  if (candidates[0]) {
    await upsertScoreSheet({
      prisma,
      councilId: council.id,
      projectId: candidates[0].id,
      reviewerId: chair.id,
      status: 'DRAFT',
      conflictOfInterest: false,
      criteria,
      // Sample partial scores
      sampleScores: [
        { criterionCode: 'CRIT_FIT_DIRECTION', score: 8.5, comment: 'Phù hợp định hướng XTTMQG.' },
        { criterionCode: 'CRIT_FIT_INDUSTRY', score: 9.0 },
        { criterionCode: 'CRIT_FIT_REGION', score: 8.5 },
        { criterionCode: 'CRIT_FEAS_CAPACITY', score: 9.0 },
        { criterionCode: 'CRIT_FEAS_FINANCE', score: 8.0 },
      ],
      overallComment:
        'Đề án có chất lượng cao, đơn vị có kinh nghiệm tổ chức triển lãm quốc tế. Cần bổ sung phương án dự phòng.',
    });
  }

  // Create 1 SUBMITTED score sheet from phó (hoidong2) on second project (or first if only 1)
  const targetProject = candidates[1] ?? candidates[0];
  if (targetProject && phoUser) {
    await upsertScoreSheet({
      prisma,
      councilId: council.id,
      projectId: targetProject.id,
      reviewerId: phoUser.id,
      status: 'SUBMITTED',
      conflictOfInterest: false,
      criteria,
      sampleScores: [
        { criterionCode: 'CRIT_FIT_DIRECTION', score: 9.0 },
        { criterionCode: 'CRIT_FIT_INDUSTRY', score: 9.5 },
        { criterionCode: 'CRIT_FIT_REGION', score: 8.5 },
        { criterionCode: 'CRIT_FEAS_CAPACITY', score: 8.5, comment: 'Đơn vị có năng lực tổ chức.' },
        { criterionCode: 'CRIT_FEAS_FINANCE', score: 7.5 },
        { criterionCode: 'CRIT_FEAS_TIMELINE', score: 8.0 },
        { criterionCode: 'CRIT_IMPACT_ECONOMIC', score: 8.5, comment: 'KPI rõ ràng, kỳ vọng giá trị xuất khẩu hợp lý.' },
        { criterionCode: 'CRIT_IMPACT_PARTICIPATION', score: 8.0 },
        { criterionCode: 'CRIT_IMPACT_SPREAD', score: 7.5 },
        { criterionCode: 'CRIT_QUALITY_OBJECTIVE', score: 8.5 },
        { criterionCode: 'CRIT_QUALITY_METHOD', score: 8.0 },
      ],
      overallComment:
        'Đề án đáp ứng tốt yêu cầu thẩm định. Đơn vị chủ trì có kinh nghiệm, kế hoạch rõ ràng, KPI hợp lý. Đề nghị Hội đồng phê duyệt.',
      submittedAt: new Date(),
    });
  }

  logSeedStep(
    `EvaluationCouncil(${memberSpecs.length} members, ${candidates.length} assignments)`,
    1,
  );
}

// =============================================================================

async function upsertScoreSheet(opts: {
  prisma: PrismaClient;
  councilId: string;
  projectId: string;
  reviewerId: string;
  status: 'DRAFT' | 'SUBMITTED';
  conflictOfInterest: boolean;
  criteria: Array<{ id: string; code: string; weight: number; parentId: string | null }>;
  sampleScores: Array<{ criterionCode: string; score: number; comment?: string }>;
  overallComment: string;
  submittedAt?: Date;
}) {
  const { prisma, councilId, projectId, reviewerId, status, conflictOfInterest } =
    opts;

  const criterionByCode = new Map(opts.criteria.map((c) => [c.code, c]));

  // Build sanitized + compute weighted total
  const sanitized: Array<{ criterionId: string; score: number; comment?: string }> = [];
  for (const s of opts.sampleScores) {
    const c = criterionByCode.get(s.criterionCode);
    if (!c) continue;
    sanitized.push({
      criterionId: c.id,
      score: Math.max(0, Math.min(10, s.score)),
      comment: s.comment,
    });
  }
  let totalScore = 0;
  for (const entry of sanitized) {
    const c = opts.criteria.find((x) => x.id === entry.criterionId);
    if (!c) continue;
    if (c.parentId === null) continue; // skip group rollup
    totalScore += (entry.score / 10) * c.weight;
  }
  totalScore = Math.round(totalScore * 100) / 100;

  const existing = await prisma.scoreSheet.findFirst({
    where: { projectId, reviewerId, kind: 'EVALUATION' },
  });
  const submittedAt =
    status === 'SUBMITTED'
      ? opts.submittedAt ?? new Date()
      : null;
  if (existing) {
    await prisma.scoreSheet.update({
      where: { id: existing.id },
      data: {
        councilId,
        scoresJson: conflictOfInterest ? null : JSON.stringify(sanitized),
        totalScore: conflictOfInterest ? 0 : totalScore,
        comment: opts.overallComment,
        status,
        conflictOfInterest,
        submittedAt,
      },
    });
  } else {
    await prisma.scoreSheet.create({
      data: {
        councilId,
        projectId,
        reviewerId,
        kind: 'EVALUATION',
        scoresJson: conflictOfInterest ? null : JSON.stringify(sanitized),
        totalScore: conflictOfInterest ? 0 : totalScore,
        comment: opts.overallComment,
        status,
        conflictOfInterest,
        submittedAt,
      },
    });
  }
}
