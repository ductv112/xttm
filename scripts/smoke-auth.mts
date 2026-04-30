/**
 * Smoke test 8 hardcoded accounts (Plan 02 seeded) — verify bcrypt password compare + role + org mapping.
 *
 * Usage: npx tsx scripts/smoke-auth.mts
 * Expected: 8 lines starting with `✓`, exit code 0.
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Use dynamic import to dodge tsx ESM named-export edge case for .ts files.
const constantsModule = await import('../lib/constants');
const HARDCODED_USERS = constantsModule.HARDCODED_USERS;
const ORG_NAMES = constantsModule.ORG_NAMES;
type OrgCode = keyof typeof ORG_NAMES;

const prisma = new PrismaClient();

async function main(): Promise<number> {
  let allPass = true;

  for (const user of HARDCODED_USERS) {
    const dbUser = await prisma.user.findUnique({
      where: { username: user.username },
      include: { organization: { select: { name: true } } },
    });

    if (!dbUser) {
      console.error(`✗ ${user.username.padEnd(12)} USER NOT FOUND in DB`);
      allPass = false;
      continue;
    }

    const ok = await bcrypt.compare(user.password, dbUser.passwordHash);
    const orgName = dbUser.organization?.name ?? '(no org)';
    const expectedOrg = user.orgCode ? ORG_NAMES[user.orgCode as OrgCode] : '(no org)';

    if (!ok) {
      console.error(`✗ ${user.username.padEnd(12)} bcrypt.compare FAILED`);
      allPass = false;
      continue;
    }

    if (dbUser.role !== user.role) {
      console.error(
        `✗ ${user.username.padEnd(12)} role mismatch: expected=${user.role} actual=${dbUser.role}`,
      );
      allPass = false;
      continue;
    }

    if (orgName !== expectedOrg) {
      console.error(
        `✗ ${user.username.padEnd(12)} org mismatch: expected="${expectedOrg}" actual="${orgName}"`,
      );
      allPass = false;
      continue;
    }

    console.log(
      `✓ ${user.username.padEnd(12)} role=${dbUser.role.padEnd(11)} org=${orgName}`,
    );
  }

  await prisma.$disconnect();
  return allPass ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('[smoke-auth] fatal error:', err);
    process.exit(1);
  });
