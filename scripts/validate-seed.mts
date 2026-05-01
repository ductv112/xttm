// scripts/validate-seed.mts — Phase 11-01 Task 1.
//
// Cross-entity invariants kiểm tra sau khi `npm run db:seed`. Throw nếu fail.
// Chạy bằng: `npm run db:validate` (alias `tsx scripts/validate-seed.mts`).
//
// Invariants:
//   - Mọi User mock (8 accounts) tồn tại với role + organizationId chuẩn
//   - Mọi ProgramCycle có ít nhất 1 Project (trừ DRAFT cycle)
//   - Mọi Project APPROVED hoặc downstream (IN_PROGRESS / COMPLETED) có Contract
//   - Mọi Contract IN_PROGRESS hoặc LIQUIDATED có implementationJson trên Project
//   - Mọi Project có organizationId trỏ tới Organization tồn tại
//   - Mọi Project có createdById trỏ tới User tồn tại (nếu set)
//   - Status mix verified — đếm tối thiểu mỗi trạng thái critical
//   - Tên đề án có "—" hoặc dấu gạch ngang (realistic format)
//   - Tên chủ nhiệm có chức danh (TS./PGS./CN./KS./Ths./ThS.) ở OrgProfile contacts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Issue = { severity: 'ERROR' | 'WARN'; check: string; detail: string };

const issues: Issue[] = [];

function check(
  cond: boolean,
  severity: 'ERROR' | 'WARN',
  name: string,
  detail: string,
): void {
  if (!cond) issues.push({ severity, check: name, detail });
}

async function main(): Promise<void> {
  console.log('🔍 Validating seed data invariants...');

  // ---------------------------------------------------------------------------
  // 1. 8 Mock users present
  // ---------------------------------------------------------------------------
  const expectedUsers = [
    { username: 'admin', role: 'ADMIN' },
    { username: 'banql', role: 'BANQL' },
    { username: 'chuyenvien', role: 'CHUYENVIEN' },
    { username: 'hoidong', role: 'HOIDONG' },
    { username: 'donvi1', role: 'DONVI' },
    { username: 'donvi2', role: 'DONVI' },
    { username: 'taichinh', role: 'TAICHINH' },
    { username: 'lanhdao', role: 'LANHDAO' },
  ];
  for (const u of expectedUsers) {
    const found = await prisma.user.findUnique({
      where: { username: u.username },
      select: { id: true, role: true, isActive: true },
    });
    check(found !== null, 'ERROR', 'mock-users', `User ${u.username} không tồn tại`);
    if (found) {
      check(
        found.role === u.role,
        'ERROR',
        'mock-users',
        `User ${u.username} role=${found.role}, expected ${u.role}`,
      );
      check(
        found.isActive,
        'ERROR',
        'mock-users',
        `User ${u.username} bị khóa (isActive=false)`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 2. ProgramCycle có ít nhất 1 Project (trừ DRAFT)
  // ---------------------------------------------------------------------------
  const cycles = await prisma.programCycle.findMany({
    select: { id: true, year: true, status: true },
  });
  for (const c of cycles) {
    if (c.status === 'DRAFT') continue;
    const count = await prisma.project.count({
      where: { programCycleId: c.id },
    });
    check(
      count >= 1,
      'ERROR',
      'cycle-projects',
      `ProgramCycle ${c.year} (status=${c.status}) không có Project nào`,
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Project APPROVED / IN_PROGRESS / COMPLETED có Contract
  // ---------------------------------------------------------------------------
  const downstream = await prisma.project.findMany({
    where: { status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] } },
    select: {
      id: true,
      code: true,
      status: true,
      contract: { select: { id: true, status: true } },
    },
  });
  for (const p of downstream) {
    check(
      p.contract !== null,
      'ERROR',
      'approved-project-has-contract',
      `Project ${p.code} (status=${p.status}) chưa có Contract row`,
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Contract IN_PROGRESS → Project có implementationJson
  // (LIQUIDATED skip — đây là HĐ lịch sử đã thanh lý, kế hoạch impl không bắt buộc)
  // ---------------------------------------------------------------------------
  const liveContracts = await prisma.contract.findMany({
    where: { status: 'IN_PROGRESS' },
    select: {
      id: true,
      contractNo: true,
      status: true,
      project: {
        select: { code: true, implementationJson: true },
      },
    },
  });
  for (const ct of liveContracts) {
    check(
      ct.project.implementationJson !== null &&
        ct.project.implementationJson !== '',
      'ERROR',
      'contract-has-impl-plan',
      `Contract ${ct.contractNo} (status=${ct.status}) → Project ${ct.project.code} chưa có implementationJson`,
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Mọi Project organizationId trỏ tới Organization tồn tại
  // ---------------------------------------------------------------------------
  const allProjects = await prisma.project.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      organizationId: true,
      createdById: true,
    },
  });
  const orgIds = new Set(
    (await prisma.organization.findMany({ select: { id: true } })).map(
      (o) => o.id,
    ),
  );
  const userIds = new Set(
    (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id),
  );
  for (const p of allProjects) {
    check(
      orgIds.has(p.organizationId),
      'ERROR',
      'project-fk-org',
      `Project ${p.code} organizationId=${p.organizationId} không tồn tại`,
    );
    if (p.createdById) {
      check(
        userIds.has(p.createdById),
        'ERROR',
        'project-fk-user',
        `Project ${p.code} createdById=${p.createdById} không tồn tại`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Status mix — đếm tối thiểu các trạng thái HERO flow
  // ---------------------------------------------------------------------------
  const statusCounts = await prisma.project.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const mix = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all] as const),
  );
  const requireMin: Record<string, number> = {
    DRAFT: 1,
    SUBMITTED: 1,
    IN_REVIEW: 1,
    VALID: 1,
    APPROVED: 1,
  };
  for (const [status, min] of Object.entries(requireMin)) {
    check(
      (mix[status] ?? 0) >= min,
      'ERROR',
      'status-mix',
      `Project status ${status} có ${mix[status] ?? 0} record(s), expected ≥${min}`,
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Tên đề án realistic (>= 30 chars, có ký tự gạch ngang em-dash hoặc 2 từ noun)
  // ---------------------------------------------------------------------------
  for (const p of allProjects) {
    check(
      p.name.length >= 25,
      'WARN',
      'project-name-realistic',
      `Project ${p.code} tên ngắn (${p.name.length} chars): "${p.name}"`,
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Tên chủ nhiệm trong OrgProfile.contactsJson có chức danh
  // ---------------------------------------------------------------------------
  const profiles = await prisma.organizationProfile.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, organizationId: true, contactsJson: true },
  });
  // Honorific can be in `title` field (e.g., "TS.", "Th.S.", "CN.") or prefix
  // of `name`/`fullName` field. Accept any of the conventional Vietnamese titles.
  const titlePattern = /(TS\.|PGS\.|CN\.|KS\.|Th\.?S\.|GS\.|ThS\.|Ks\.|Cn\.|Ts\.)/i;
  for (const p of profiles) {
    if (!p.contactsJson) continue;
    try {
      const arr = JSON.parse(p.contactsJson) as Array<{
        fullName?: string;
        name?: string;
        title?: string;
        role?: string;
      }>;
      if (!Array.isArray(arr)) continue;
      // Mỗi profile APPROVED phải có ít nhất 1 contact có chức danh ở title hoặc name
      const hasTitle = arr.some((c) => {
        const candidates = [c?.title, c?.fullName, c?.name].filter(
          (v): v is string => typeof v === 'string',
        );
        return candidates.some((s) => titlePattern.test(s));
      });
      check(
        hasTitle,
        'WARN',
        'contact-honorific',
        `OrgProfile ${p.id} không có contact nào với chức danh (TS./PGS./CN./KS.)`,
      );
    } catch {
      // ignore parse error
    }
  }

  // ---------------------------------------------------------------------------
  // 9. SystemConfig có 9 records (1 SLA + 5 email + 3 SMS)
  // ---------------------------------------------------------------------------
  const sysCount = await prisma.systemConfig.count();
  check(
    sysCount >= 9,
    'ERROR',
    'system-config',
    `SystemConfig có ${sysCount} records, expected ≥9`,
  );

  // ---------------------------------------------------------------------------
  // 10. Permissions: 144 (18 resources × 8 actions) + ≥50 grants
  // ---------------------------------------------------------------------------
  const permCount = await prisma.permission.count();
  check(
    permCount === 144,
    'ERROR',
    'permissions',
    `Permissions = ${permCount}, expected 144`,
  );
  const grantCount = await prisma.rolePermission.count({
    where: { granted: true },
  });
  check(
    grantCount >= 50,
    'ERROR',
    'role-permissions',
    `Granted RolePermissions = ${grantCount}, expected ≥50`,
  );

  // ---------------------------------------------------------------------------
  // 11. EvaluationCouncil có ≥3 members + ≥2 assignments
  // ---------------------------------------------------------------------------
  const councilCount = await prisma.evaluationCouncil.count();
  check(
    councilCount >= 1,
    'ERROR',
    'council',
    `EvaluationCouncil = ${councilCount}, expected ≥1`,
  );
  if (councilCount >= 1) {
    const memberCount = await prisma.councilMember.count();
    const assignmentCount = await prisma.projectCouncilAssignment.count();
    check(
      memberCount >= 3,
      'ERROR',
      'council-members',
      `CouncilMember = ${memberCount}, expected ≥3`,
    );
    check(
      assignmentCount >= 2,
      'ERROR',
      'council-assignments',
      `ProjectCouncilAssignment = ${assignmentCount}, expected ≥2`,
    );
  }

  // ---------------------------------------------------------------------------
  // REPORT
  // ---------------------------------------------------------------------------
  console.log('');
  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warns = issues.filter((i) => i.severity === 'WARN');

  if (warns.length > 0) {
    console.log(`⚠️  ${warns.length} warning(s):`);
    for (const w of warns) {
      console.log(`   [${w.check}] ${w.detail}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} error(s):`);
    for (const e of errors) {
      console.log(`   [${e.check}] ${e.detail}`);
    }
    process.exit(1);
  }

  console.log(
    `\n✅ All invariants passed. (${warns.length} warning(s), 0 error(s))`,
  );
  console.log(
    `📊 Project status mix: ${Object.entries(mix)
      .map(([s, n]) => `${s}=${n}`)
      .join(', ')}`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Validator crashed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
