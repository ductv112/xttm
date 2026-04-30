'use server';

// Lock/unlock + bulk actions + bulk role change. Admin-only, audit-logged per record.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import { ROLES, type Role } from '@/lib/constants';

const MAX_BULK_IDS = 100; // T-02-04-07 — bulk OOM mitigation

const ROLE_VALUES = new Set(Object.values(ROLES) as string[]);

// ---------------------------------------------------------------------------
// Single record lock/unlock
// ---------------------------------------------------------------------------

async function lockUserImpl(id: string): Promise<{ id: string; isActive: boolean }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền khóa tài khoản');
  }

  // T-02-04-08 — cannot lock self
  if (id === session.user.id) {
    throw new Error('Không thể tự khóa tài khoản của chính mình');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, isActive: true },
  });
  revalidatePath('/nguoi-dung');
  return updated;
}

export const lockUser = withAuditLog<[string], { id: string; isActive: boolean }>(
  {
    action: 'UPDATE',
    resource: 'nguoi-dung',
    resourceIdFromArgs: ([id]) => id,
    captureBefore: async ([id]) =>
      prisma.user.findUnique({
        where: { id },
        select: { isActive: true, fullName: true, username: true },
      }),
    captureAfter: (result) => ({
      isActive: result.isActive,
      lockedAt: new Date().toISOString(),
    }),
  },
  lockUserImpl,
);

async function unlockUserImpl(id: string): Promise<{ id: string; isActive: boolean }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền mở khóa tài khoản');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: { id: true, isActive: true },
  });
  revalidatePath('/nguoi-dung');
  return updated;
}

export const unlockUser = withAuditLog<[string], { id: string; isActive: boolean }>(
  {
    action: 'UPDATE',
    resource: 'nguoi-dung',
    resourceIdFromArgs: ([id]) => id,
    captureBefore: async ([id]) =>
      prisma.user.findUnique({
        where: { id },
        select: { isActive: true, fullName: true, username: true },
      }),
    captureAfter: (result) => ({
      isActive: result.isActive,
      unlockedAt: new Date().toISOString(),
    }),
  },
  unlockUserImpl,
);

// ---------------------------------------------------------------------------
// Bulk actions — filter out self id, audit each via single wrapper call
// (per-record audit happens because we wrap individual ops via Promise.all)
// ---------------------------------------------------------------------------

export type BulkResult = {
  succeeded: string[];
  skipped: string[]; // ids skipped (eg current user)
  failed: { id: string; error: string }[];
};

async function bulkLockUsersImpl(ids: string[]): Promise<BulkResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền khóa tài khoản');
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một tài khoản');
  }
  if (ids.length > MAX_BULK_IDS) {
    throw new Error(`Mỗi lần chỉ thao tác tối đa ${MAX_BULK_IDS} tài khoản`);
  }

  const succeeded: string[] = [];
  const skipped: string[] = [];
  const failed: BulkResult['failed'] = [];

  // T-02-04-08 — filter out current user
  const targetIds = ids.filter((id) => {
    if (id === session.user.id) {
      skipped.push(id);
      return false;
    }
    return true;
  });

  for (const id of targetIds) {
    try {
      // Call wrapped lockUser so each lock has its own audit entry
      await lockUser(id);
      succeeded.push(id);
    } catch (err) {
      failed.push({
        id,
        error: err instanceof Error ? err.message : 'Lỗi không xác định',
      });
    }
  }

  revalidatePath('/nguoi-dung');
  return { succeeded, skipped, failed };
}

export const bulkLockUsers = bulkLockUsersImpl;

async function bulkUnlockUsersImpl(ids: string[]): Promise<BulkResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền mở khóa tài khoản');
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một tài khoản');
  }
  if (ids.length > MAX_BULK_IDS) {
    throw new Error(`Mỗi lần chỉ thao tác tối đa ${MAX_BULK_IDS} tài khoản`);
  }

  const succeeded: string[] = [];
  const skipped: string[] = [];
  const failed: BulkResult['failed'] = [];

  for (const id of ids) {
    try {
      await unlockUser(id);
      succeeded.push(id);
    } catch (err) {
      failed.push({
        id,
        error: err instanceof Error ? err.message : 'Lỗi không xác định',
      });
    }
  }

  revalidatePath('/nguoi-dung');
  return { succeeded, skipped, failed };
}

export const bulkUnlockUsers = bulkUnlockUsersImpl;

// ---------------------------------------------------------------------------
// Bulk role change — security-sensitive (T-02-04-02)
// ---------------------------------------------------------------------------

async function changeRoleSingleImpl(
  id: string,
  newRole: string,
): Promise<{ id: string; role: string }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền thay đổi vai trò');
  }
  if (!ROLE_VALUES.has(newRole)) {
    throw new Error('Vai trò không hợp lệ');
  }

  // T-02-04-02 — only ADMIN can promote to ADMIN
  if (newRole === ROLES.ADMIN && session.user.role !== ROLES.ADMIN) {
    throw new Error('Chỉ Quản trị viên mới có thể gán vai trò Quản trị viên');
  }
  // Cannot change own role
  if (id === session.user.id) {
    throw new Error('Không thể tự thay đổi vai trò của chính mình');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: newRole },
    select: { id: true, role: true },
  });
  return updated;
}

const changeRoleSingle = withAuditLog<[string, string], { id: string; role: string }>(
  {
    action: 'UPDATE',
    resource: 'nguoi-dung',
    resourceIdFromArgs: ([id]) => id,
    captureBefore: async ([id]) =>
      prisma.user.findUnique({
        where: { id },
        select: { role: true, fullName: true, username: true },
      }),
    captureAfter: (result) => ({ role: result.role }),
  },
  changeRoleSingleImpl,
);

export async function bulkChangeRole(
  ids: string[],
  newRole: string,
): Promise<BulkResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền thay đổi vai trò');
  }
  if (!ROLE_VALUES.has(newRole)) {
    throw new Error('Vai trò không hợp lệ');
  }
  if (newRole === ROLES.ADMIN && session.user.role !== ROLES.ADMIN) {
    throw new Error('Chỉ Quản trị viên mới có thể gán vai trò Quản trị viên');
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một tài khoản');
  }
  if (ids.length > MAX_BULK_IDS) {
    throw new Error(`Mỗi lần chỉ thao tác tối đa ${MAX_BULK_IDS} tài khoản`);
  }

  const succeeded: string[] = [];
  const skipped: string[] = [];
  const failed: BulkResult['failed'] = [];

  // Filter out self
  const targetIds = ids.filter((id) => {
    if (id === session.user.id) {
      skipped.push(id);
      return false;
    }
    return true;
  });

  for (const id of targetIds) {
    try {
      await changeRoleSingle(id, newRole);
      succeeded.push(id);
    } catch (err) {
      failed.push({
        id,
        error: err instanceof Error ? err.message : 'Lỗi không xác định',
      });
    }
  }

  revalidatePath('/nguoi-dung');
  return { succeeded, skipped, failed };
}
