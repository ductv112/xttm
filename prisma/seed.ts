import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users';
import { seedOrganizations } from './seed/organizations';
import { seedCatalogs } from './seed/catalogs';
import { seedPermissions } from './seed/permissions';
import { seedSystemConfig } from './seed/system-config';
import { seedProgramCycles } from './seed/program-cycles';
import { seedCycleNotifications } from './seed/notifications';
import { seedOrgProfiles } from './seed/orgProfiles';
import { seedProjects } from './seed/projects';
import { seedCouncils } from './seed/councils';
import { seedContractsAndAmendments } from './seed/contracts-and-amendments';
import { seedReportsAcceptanceFinance } from './seed/reports-acceptance-finance';
import { seedInboxNotifications } from './seed/inbox-notifications';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding XTTMQG database...');
  console.time('seed');

  // Order matters: orgs first (users FK organizationId), users next, catalogs +
  // permissions last (no FK dep on User/Organization).
  await seedOrganizations(prisma);
  await seedUsers(prisma);
  await seedCatalogs(prisma);
  await seedPermissions(prisma);
  await seedSystemConfig(prisma);

  // Phase 3 (M2.1) HERO data: 3 program cycles + invitation history
  const cycleIds = await seedProgramCycles(prisma);
  const banqlUser = await prisma.user.findUnique({ where: { username: 'banql' } });
  if (banqlUser) {
    await seedCycleNotifications(
      prisma,
      { cycle2025Id: cycleIds.cycle2025Id, cycle2026Id: cycleIds.cycle2026Id },
      banqlUser.id,
    );
  }

  // Phase 4 (M2.2) data: 5 OrganizationProfile cover all 4 statuses
  await seedOrgProfiles(prisma);

  // Phase 5 (M2.3) HERO data: 6 Projects covering diverse states + đề án 2 năm
  await seedProjects(prisma);

  // Phase 7 (M3) HERO data: 1 EvaluationCouncil + 3 members + 2 assignments + 2 EVALUATION ScoreSheets
  await seedCouncils(prisma);

  // Phase 8 (M4) data: contracts + impl tracking + amendments
  await seedContractsAndAmendments(prisma);

  // Phase 9 (M5) data: reports + acceptance + financial records
  await seedReportsAcceptanceFinance(prisma);

  // Phase 10 (M6) data: inbox notifications cho mock users
  await seedInboxNotifications(prisma);

  // Smoke verify counts
  const userCount = await prisma.user.count();
  const orgCount = await prisma.organization.count();
  const catalogCounts = {
    projectKind: await prisma.projectKind.count(),
    industrySector: await prisma.industrySector.count(),
    market: await prisma.market.count(),
    promotionType: await prisma.promotionType.count(),
    country: await prisma.country.count(),
    orgUnit: await prisma.orgUnit.count(),
    scoringCriterion: await prisma.scoringCriterion.count(),
    documentTemplate: await prisma.documentTemplate.count(),
  };
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();
  const grantCount = await prisma.rolePermission.count({
    where: { granted: true },
  });
  const systemConfigCount = await prisma.systemConfig.count();
  const orgProfileCount = await prisma.organizationProfile.count();
  const orgProfilesByStatus = await prisma.organizationProfile.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const projectCount = await prisma.project.count();
  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const twoYearChildCount = await prisma.project.count({
    where: { parentProjectId: { not: null } },
  });
  console.log(`📊 Total users: ${userCount}, organizations: ${orgCount}`);
  console.log(`📊 Catalogs:`, catalogCounts);
  console.log(
    `📊 RBAC: roles=${roleCount}, permissions=${permissionCount}, grants=${grantCount}`,
  );
  console.log(`📊 SystemConfig: ${systemConfigCount} (1 SLA + 5 email + 3 SMS = 9)`);
  console.log(
    `📊 OrganizationProfile: ${orgProfileCount} (status mix: ${orgProfilesByStatus
      .map((r) => `${r.status}=${r._count._all}`)
      .join(', ')})`,
  );
  console.log(
    `📊 Project: ${projectCount} (status mix: ${projectsByStatus
      .map((r) => `${r.status}=${r._count._all}`)
      .join(', ')}, đề án 2 năm child=${twoYearChildCount})`,
  );

  if (userCount < 8) throw new Error(`Expected 8 users, got ${userCount}`);
  if (roleCount !== 7)
    throw new Error(`Expected 7 system roles, got ${roleCount}`);
  if (permissionCount !== 144)
    throw new Error(
      `Expected 144 permissions (18 resources × 8 actions), got ${permissionCount}`,
    );
  if (grantCount < 50)
    throw new Error(
      `Expected ≥50 RolePermission grants from MATRIX, got ${grantCount}`,
    );
  if (orgCount < 5) throw new Error(`Expected ≥5 organizations, got ${orgCount}`);
  if (catalogCounts.projectKind !== 8)
    throw new Error(`Expected 8 ProjectKind, got ${catalogCounts.projectKind}`);
  if (catalogCounts.industrySector !== 20)
    throw new Error(`Expected 20 IndustrySector, got ${catalogCounts.industrySector}`);
  if (catalogCounts.market !== 15) throw new Error(`Expected 15 Market, got ${catalogCounts.market}`);
  if (catalogCounts.promotionType !== 8)
    throw new Error(`Expected 8 PromotionType, got ${catalogCounts.promotionType}`);
  if (catalogCounts.country !== 30)
    throw new Error(`Expected 30 Country, got ${catalogCounts.country}`);
  if (catalogCounts.orgUnit !== 12)
    throw new Error(`Expected 12 OrgUnit, got ${catalogCounts.orgUnit}`);
  if (catalogCounts.scoringCriterion !== 15)
    throw new Error(`Expected 15 ScoringCriterion, got ${catalogCounts.scoringCriterion}`);
  if (catalogCounts.documentTemplate !== 6)
    throw new Error(`Expected 6 DocumentTemplate, got ${catalogCounts.documentTemplate}`);
  if (systemConfigCount !== 9)
    throw new Error(
      `Expected 9 SystemConfig (1 SLA + 5 email + 3 SMS), got ${systemConfigCount}`,
    );
  if (orgProfileCount < 5)
    throw new Error(`Expected ≥5 OrganizationProfile, got ${orgProfileCount}`);
  const statusCounts = Object.fromEntries(
    orgProfilesByStatus.map((r) => [r.status, r._count._all] as const),
  );
  if ((statusCounts.APPROVED ?? 0) < 1)
    throw new Error('Expected ≥1 APPROVED OrganizationProfile');
  if ((statusCounts.SUBMITTED ?? 0) < 1)
    throw new Error('Expected ≥1 SUBMITTED OrganizationProfile');
  if ((statusCounts.REJECTED ?? 0) < 1)
    throw new Error('Expected ≥1 REJECTED OrganizationProfile');
  if ((statusCounts.DRAFT ?? 0) < 2)
    throw new Error('Expected ≥2 DRAFT OrganizationProfile');

  if (projectCount < 11)
    throw new Error(`Expected ≥11 Project, got ${projectCount}`);
  const projectStatusCounts = Object.fromEntries(
    projectsByStatus.map((r) => [r.status, r._count._all] as const),
  );
  if ((projectStatusCounts.APPROVED ?? 0) < 1)
    throw new Error('Expected ≥1 APPROVED Project');
  if ((projectStatusCounts.SUBMITTED ?? 0) < 2)
    throw new Error('Expected ≥2 SUBMITTED Project');
  if ((projectStatusCounts.DRAFT ?? 0) < 1)
    throw new Error('Expected ≥1 DRAFT Project');
  if ((projectStatusCounts.IN_REVIEW ?? 0) < 1)
    throw new Error('Expected ≥1 IN_REVIEW Project');
  if ((projectStatusCounts.TENTATIVE ?? 0) < 1)
    throw new Error('Expected ≥1 TENTATIVE Project');
  // Phase 6 (M2.4) intake states
  if ((projectStatusCounts.ASSIGNED ?? 0) < 1)
    throw new Error('Expected ≥1 ASSIGNED Project (Phase 6 demo)');
  if ((projectStatusCounts.VALID ?? 0) < 1)
    throw new Error('Expected ≥1 VALID Project (Phase 6 demo)');
  if ((projectStatusCounts.SUPPLEMENT_REQUIRED ?? 0) < 1)
    throw new Error('Expected ≥1 SUPPLEMENT_REQUIRED Project (Phase 6 demo)');
  if (twoYearChildCount < 1)
    throw new Error('Expected ≥1 đề án 2 năm child (parentProjectId set)');

  // Verify ScoreSheet PRELIMINARY records (Phase 6)
  const preliminaryScoreSheets = await prisma.scoreSheet.count({
    where: { kind: 'PRELIMINARY' },
  });
  if (preliminaryScoreSheets < 1)
    throw new Error(
      'Expected ≥1 PRELIMINARY ScoreSheet (Phase 6 demo state)',
    );
  console.log(
    `📊 PRELIMINARY ScoreSheet: ${preliminaryScoreSheets} record(s)`,
  );

  // Phase 7 (M3) — verify EvaluationCouncil + members + assignments + EVALUATION sheets
  const councilCount = await prisma.evaluationCouncil.count();
  const memberCount = await prisma.councilMember.count();
  const assignmentCount = await prisma.projectCouncilAssignment.count();
  const evaluationSheets = await prisma.scoreSheet.count({
    where: { kind: 'EVALUATION' },
  });
  if (councilCount < 1)
    throw new Error('Expected ≥1 EvaluationCouncil (Phase 7 demo state)');
  if (memberCount < 3)
    throw new Error(
      `Expected ≥3 CouncilMember (Chu tịch + Phó + Ủy viên), got ${memberCount}`,
    );
  if (assignmentCount < 2)
    throw new Error(
      `Expected ≥2 ProjectCouncilAssignment, got ${assignmentCount}`,
    );
  if (evaluationSheets < 2)
    throw new Error(
      `Expected ≥2 EVALUATION ScoreSheet (1 DRAFT chair + 1 SUBMITTED phó), got ${evaluationSheets}`,
    );
  console.log(
    `📊 Phase 7: councils=${councilCount}, members=${memberCount}, assignments=${assignmentCount}, EVALUATION sheets=${evaluationSheets}`,
  );

  // Phase 8 (M4) — verify Contract + ProjectAmendment seeded
  const contractCount = await prisma.contract.count();
  const amendmentCount = await prisma.projectAmendment.count();
  const contractsByStatus = await prisma.contract.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const amendmentsByStatus = await prisma.projectAmendment.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  if (contractCount < 3)
    throw new Error(`Expected ≥3 Contract, got ${contractCount}`);
  if (amendmentCount < 3)
    throw new Error(`Expected ≥3 ProjectAmendment, got ${amendmentCount}`);
  const cStatusMap = Object.fromEntries(
    contractsByStatus.map((r) => [r.status, r._count._all] as const),
  );
  // Phase 9 may transition 1 contract to LIQUIDATED, so allow LIQUIDATED in count.
  if (
    !(
      ((cStatusMap.DRAFT ?? 0) +
        (cStatusMap.SIGNED ?? 0) +
        (cStatusMap.IN_PROGRESS ?? 0) +
        (cStatusMap.LIQUIDATED ?? 0)) >=
      3
    )
  )
    throw new Error(
      'Expected ≥3 Contract covering DRAFT/SIGNED/IN_PROGRESS/LIQUIDATED',
    );
  console.log(
    `📊 Phase 8: contracts=${contractCount} (${contractsByStatus
      .map((r) => `${r.status}=${r._count._all}`)
      .join(', ')}), amendments=${amendmentCount} (${amendmentsByStatus
      .map((r) => `${r.status}=${r._count._all}`)
      .join(', ')})`,
  );

  // Phase 9 (M5) — verify Reports + AcceptanceRecords + FinancialRecords
  const reportCount = await prisma.report.count();
  const reportsByStatus = await prisma.report.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const acceptanceCount = await prisma.acceptanceRecord.count();
  const acceptanceByResult = await prisma.acceptanceRecord.groupBy({
    by: ['result'],
    _count: { _all: true },
  });
  const financialCount = await prisma.financialRecord.count();
  const financialByType = await prisma.financialRecord.groupBy({
    by: ['recordType'],
    _count: { _all: true },
  });
  if (reportCount < 2)
    throw new Error(`Expected ≥2 Report (Phase 9), got ${reportCount}`);
  if (acceptanceCount < 2)
    throw new Error(
      `Expected ≥2 AcceptanceRecord (Phase 9), got ${acceptanceCount}`,
    );
  if (financialCount < 3)
    throw new Error(
      `Expected ≥3 FinancialRecord (Phase 9), got ${financialCount}`,
    );
  console.log(
    `📊 Phase 9: reports=${reportCount} (${reportsByStatus
      .map((r) => `${r.status}=${r._count._all}`)
      .join(', ')}), acceptance=${acceptanceCount} (${acceptanceByResult
      .map((r) => `${r.result}=${r._count._all}`)
      .join(', ')}), financial=${financialCount} (${financialByType
      .map((r) => `${r.recordType}=${r._count._all}`)
      .join(', ')})`,
  );

  console.timeEnd('seed');
  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
