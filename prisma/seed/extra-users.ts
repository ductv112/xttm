// Demo enrichment seed — 2 thêm chuyenvien users (chuyenvien2, chuyenvien3) để
// phân công đa dạng. Mật khẩu Cv@123 (hash bcrypt). Idempotent.
//
// hoidong2 + hoidong3 được tạo trong councils.ts.

import type { PrismaClient } from '@prisma/client';

import { hashPassword, logSeedStep } from './helpers';

const EXTRA_USERS = [
  {
    username: 'chuyenvien2',
    password: 'Cv@123',
    fullName: 'Phạm Hồng Quân',
    email: 'chuyenvien2@xttm.gov.vn',
    role: 'CHUYENVIEN',
    orgCode: 'CUC_XTTM',
  },
  {
    username: 'chuyenvien3',
    password: 'Cv@123',
    fullName: 'Đinh Thị Thu Hương',
    email: 'chuyenvien3@xttm.gov.vn',
    role: 'CHUYENVIEN',
    orgCode: 'CUC_XTTM',
  },
] as const;

export async function seedExtraUsers(prisma: PrismaClient): Promise<void> {
  for (const u of EXTRA_USERS) {
    const passwordHash = await hashPassword(u.password);
    const org = await prisma.organization.findUnique({
      where: { code: u.orgCode },
      select: { id: true },
    });
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: true,
        organizationId: org?.id ?? null,
      },
      create: {
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: true,
        organizationId: org?.id ?? null,
      },
    });
  }
  logSeedStep('Extra users (chuyenvien2/3)', EXTRA_USERS.length);
}
