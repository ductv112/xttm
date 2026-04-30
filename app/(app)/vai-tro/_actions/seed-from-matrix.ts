'use server';

// seedPermissionsFromMatrix — admin-callable wrapper để re-sync DB grants từ
// static MATRIX (lib/permissions.ts). Useful khi admin lỡ chỉnh sai và muốn
// reset 7 system roles về MATRIX defaults.
//
// Behavior: same as prisma/seed/permissions.ts seedPermissions() — idempotent
// upsert. Custom roles và permissions không nằm trong MATRIX không bị xóa.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import { invalidatePermissionsCache } from '@/lib/permissions-db';
import { seedPermissions } from '../../../../prisma/seed/permissions';
import type { Role } from '@/lib/constants';

export type SeedFromMatrixResult = {
  roleCount: number;
  permissionCount: number;
  grantCount: number;
};

async function seedPermissionsFromMatrixImpl(): Promise<SeedFromMatrixResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'update')) {
    throw new Error('Bạn không có quyền đồng bộ ma trận phân quyền');
  }

  await seedPermissions(prisma);

  const [roleCount, permissionCount, grantCount] = await Promise.all([
    prisma.role.count(),
    prisma.permission.count(),
    prisma.rolePermission.count({ where: { granted: true } }),
  ]);

  invalidatePermissionsCache();
  revalidatePath('/vai-tro');
  revalidatePath('/');

  return { roleCount, permissionCount, grantCount };
}

export const seedPermissionsFromMatrix = withAuditLog<
  [],
  SeedFromMatrixResult
>(
  {
    action: 'UPDATE',
    resource: 'vai-tro',
    captureAfter: (result) => ({
      reSyncedFromMatrix: true,
      roleCount: result.roleCount,
      permissionCount: result.permissionCount,
      grantCount: result.grantCount,
    }),
    metadata: { source: 'static MATRIX (lib/permissions.ts)' },
  },
  seedPermissionsFromMatrixImpl,
);
