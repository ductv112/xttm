import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users';
import { seedOrganizations } from './seed/organizations';
import { seedCatalogs } from './seed/catalogs';
import { seedPermissions } from './seed/permissions';
import { seedSystemConfig } from './seed/system-config';
import { seedProgramCycles } from './seed/program-cycles';
import { seedCycleNotifications } from './seed/notifications';
import { seedOrgProfiles } from './seed/orgProfiles';

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
