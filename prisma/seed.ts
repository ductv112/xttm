import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users';
import { seedOrganizations } from './seed/organizations';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding XTTMQG database...');
  console.time('seed');

  // Order matters: orgs first (users FK organizationId), users next.
  await seedOrganizations(prisma);
  await seedUsers(prisma);

  // Smoke verify counts
  const userCount = await prisma.user.count();
  const orgCount = await prisma.organization.count();
  console.log(`📊 Total users: ${userCount}, organizations: ${orgCount}`);

  if (userCount < 8) throw new Error(`Expected 8 users, got ${userCount}`);
  if (orgCount < 5) throw new Error(`Expected ≥5 organizations, got ${orgCount}`);

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
