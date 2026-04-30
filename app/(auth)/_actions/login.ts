'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/constants';

const LoginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập').max(64),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(128),
});

export type LoginState = {
  error?: string;
  fieldErrors?: { username?: string[]; password?: string[] };
};

const GENERIC_AUTH_ERROR = 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại';

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    username: formData.get('username'),
    password: formData.get('password'),
  };
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let landingPath = '/dashboard';
  try {
    // Look up role BEFORE signIn to compute landing path; signIn(redirect:false) returns void on success
    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: { role: true, isActive: true },
    });
    if (user?.isActive) {
      landingPath = defaultLandingPath(user.role as Role);
    }

    await signIn('credentials', {
      username: parsed.data.username,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Auth.js v5 wraps Credentials authorize() errors in AuthError.cause.err
      const causeErr = (error.cause as { err?: Error } | undefined)?.err;
      const message = causeErr?.message ?? GENERIC_AUTH_ERROR;
      return { error: message };
    }
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return { error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau ít phút' };
  }

  redirect(landingPath);
}
