import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users';
import { seedOrganizations } from './seed/organizations';
import { seedCatalogs } from './seed/catalogs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding XTTMQG database...');
  console.time('seed');

  // Order matters: orgs first (users FK organizationId), users next, catalogs last (no FK dep).
  await seedOrganizations(prisma);
  await seedUsers(prisma);
  await seedCatalogs(prisma);

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
  console.log(`📊 Total users: ${userCount}, organizations: ${orgCount}`);
  console.log(`📊 Catalogs:`, catalogCounts);

  if (userCount < 8) throw new Error(`Expected 8 users, got ${userCount}`);
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
