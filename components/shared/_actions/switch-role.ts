'use server';

// Phase 11-01 Task 3 — Demo / dev role switcher (Cmd+K).
// Server action: signOut() rồi signIn() bằng credentials hardcoded từ HARDCODED_USERS.
// SECURITY: chỉ cho phép username thuộc HARDCODED_USERS (mock accounts).
// CLIENT GATE: component RoleSwitcherCmdK chỉ mount trong dev mode hoặc với ?demo=1.
// Server-side cũng kiểm tra NODE_ENV / FORCE flag để chặn lạm dụng nếu deploy
// production accidentally — guard layer 2.

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { signIn, signOut } from '@/lib/auth';
import { HARDCODED_USERS, type Role } from '@/lib/constants';
import { defaultLandingPath } from '@/lib/permissions';

const InputSchema = z.object({
  username: z.string().min(1).max(64),
});

export type SwitchRoleResult =
  | { ok: true; redirectPath: string }
  | { ok: false; error: string };

const ALLOWED_USERS = HARDCODED_USERS.map((u) => u.username) as readonly string[];

export async function switchRoleAction(
  rawUsername: string,
): Promise<SwitchRoleResult> {
  // Layer 2 guard — server-side env check
  const isDev = process.env.NODE_ENV !== 'production';
  const allowDemo = process.env.NEXT_PUBLIC_ALLOW_DEMO_SWITCHER === '1';
  if (!isDev && !allowDemo) {
    return { ok: false, error: 'Tính năng chỉ khả dụng trong môi trường demo.' };
  }

  const parsed = InputSchema.safeParse({ username: rawUsername });
  if (!parsed.success) {
    return { ok: false, error: 'Tên đăng nhập không hợp lệ.' };
  }

  const username = parsed.data.username;
  if (!ALLOWED_USERS.includes(username)) {
    return {
      ok: false,
      error: `Tài khoản "${username}" không nằm trong danh sách demo.`,
    };
  }

  const account = HARDCODED_USERS.find((u) => u.username === username);
  if (!account) {
    return { ok: false, error: 'Không tìm thấy tài khoản.' };
  }

  // Sign out current session first
  try {
    await signOut({ redirect: false });
  } catch {
    // ignore — có thể không có session
  }

  // Sign in with hardcoded credentials
  try {
    await signIn('credentials', {
      username: account.username,
      password: account.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return {
      ok: false,
      error: 'Không thể chuyển vai trò. Vui lòng thử lại.',
    };
  }

  const landingPath = defaultLandingPath(account.role as Role);
  redirect(landingPath);
}
