import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/constants';
import { authConfig } from '../auth.config';

const CredentialsSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập').max(64),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(128),
});

const GENERIC_AUTH_ERROR = 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại';
const INACTIVE_ERROR = 'Tài khoản này hiện đang bị khóa. Vui lòng liên hệ quản trị viên';

// Constant-time-ish dummy hash to mitigate timing attack on user-not-found path
const DUMMY_HASH = '$2a$10$' + 'A'.repeat(53);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = CredentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          throw new Error(GENERIC_AUTH_ERROR);
        }
        const { username, password } = parsed.data;

        try {
          const user = await prisma.user.findUnique({
            where: { username },
            include: { organization: { select: { id: true, name: true } } },
          });

          if (!user) {
            // Constant-time-ish: still run bcrypt compare to prevent timing-based user enumeration (T-03-05)
            await bcrypt.compare(password, DUMMY_HASH);
            throw new Error(GENERIC_AUTH_ERROR);
          }

          if (!user.isActive) {
            throw new Error(INACTIVE_ERROR);
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) {
            throw new Error(GENERIC_AUTH_ERROR);
          }

          return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role as Role,
            organizationId: user.organization?.id ?? null,
            organizationName: user.organization?.name ?? null,
          };
        } catch (error) {
          // Re-throw known auth errors with clean messages; mask unknown errors generically (T-03-10)
          if (error instanceof Error) {
            if (
              error.message === GENERIC_AUTH_ERROR ||
              error.message === INACTIVE_ERROR
            ) {
              throw error;
            }
            console.error('[auth.authorize] unexpected error:', error);
          }
          throw new Error(GENERIC_AUTH_ERROR);
        }
      },
    }),
  ],
});
