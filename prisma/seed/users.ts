import { PrismaClient } from '@prisma/client';
import { HARDCODED_USERS } from '../../lib/constants';
import { hashPassword, logSeedStep } from './helpers';

export async function seedUsers(prisma: PrismaClient) {
  for (const user of HARDCODED_USERS) {
    const passwordHash = await hashPassword(user.password);
    const organization = user.orgCode
      ? await prisma.organization.findUnique({ where: { code: user.orgCode } })
      : null;

    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: true,
        organizationId: organization?.id ?? null,
      },
      create: {
        username: user.username,
        passwordHash,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: true,
        organizationId: organization?.id ?? null,
      },
    });
  }
  logSeedStep('Users', HARDCODED_USERS.length);
}
