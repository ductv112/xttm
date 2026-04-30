'use server';

// grantPermission / revokePermission server actions.
//
// RBAC: chỉ user có can(role,'vai-tro','update') (ADMIN per static MATRIX) gọi được.
// Audit: mỗi grant/revoke tạo 1 AuditLog entry với before/after diff.
// Cache: invalidate sau mỗi mutation để canFromDB phản ánh thay đổi ngay.
// Sidebar: revalidatePath('/') để menu re-render khi role permission đổi.
//
// Critical guard: ADMIN role không được revoke (T-02-05-02 privilege escalation).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import { invalidatePermissionsCache } from '@/lib/permissions-db';
import { ROLES, type Role } from '@/lib/constants';
import {
  grantPermissionSchema,
  type GrantPermissionInput,
} from './schemas';

export type GrantPermissionResult = {
  roleCode: string;
  resource: string;
  action: string;
  granted: boolean;
};

async function grantPermissionImpl(
  input: GrantPermissionInput,
): Promise<GrantPermissionResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'update')) {
    throw new Error('Bạn không có quyền chỉnh sửa ma trận phân quyền');
  }

  const parsed = grantPermissionSchema.parse(input);

  // T-02-05-02: ADMIN role là backbone — không cho revoke bất kỳ permission nào
  // Check trước khi resolve role/permission để fail fast
  if (parsed.roleCode === ROLES.ADMIN && !parsed.granted) {
    throw new Error(
      'Không thể thu hồi quyền của vai trò Quản trị viên hệ thống',
    );
  }

  const role = await prisma.role.findUnique({
    where: { code: parsed.roleCode },
  });
  if (!role) {
    throw new Error(`Vai trò "${parsed.roleCode}" không tồn tại`);
  }

  const permissionCode = `${parsed.resource}:${parsed.action}`;
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode },
  });
  if (!permission) {
    throw new Error(`Quyền "${permissionCode}" không tồn tại`);
  }

  if (parsed.granted) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: { granted: true },
      create: {
        roleId: role.id,
        permissionId: permission.id,
        granted: true,
      },
    });
  } else {
    // Revoke: set granted=false thay vì delete để giữ history; on re-grant
    // upsert update lại true. Nếu chưa có row thì create mới với granted=false
    // (RolePermission row mới đại diện "explicit deny").
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: { granted: false },
      create: {
        roleId: role.id,
        permissionId: permission.id,
        granted: false,
      },
    });
  }

  // Invalidate cache cho canFromDB pick up new state on next call
  invalidatePermissionsCache();

  // Sidebar re-fetch (getMenuItems sẽ check can() static; khi Phase 3+ chuyển
  // sang canFromDB, sidebar sẽ thấy thay đổi). Revalidate '/' invalidates
  // (app)/layout.tsx render để menu RSC fetch lại session role permissions.
  revalidatePath('/vai-tro');
  revalidatePath('/');

  return {
    roleCode: parsed.roleCode,
    resource: parsed.resource,
    action: parsed.action,
    granted: parsed.granted,
  };
}

export const grantPermission = withAuditLog<
  [GrantPermissionInput],
  GrantPermissionResult
>(
  {
    action: 'UPDATE',
    resource: 'vai-tro',
    resourceIdFromArgs: ([input]) => input.roleCode,
    captureBefore: async ([input]) => {
      // Capture current granted state for diff
      const role = await prisma.role.findUnique({
        where: { code: input.roleCode },
        select: { id: true, code: true, name: true },
      });
      if (!role) return null;
      const permission = await prisma.permission.findUnique({
        where: { code: `${input.resource}:${input.action}` },
      });
      if (!permission) return null;
      const current = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
      });
      return {
        role: role.code,
        resource: input.resource,
        action: input.action,
        granted: current?.granted ?? false,
      };
    },
    captureAfter: (result) => ({
      role: result.roleCode,
      resource: result.resource,
      action: result.action,
      granted: result.granted,
    }),
  },
  grantPermissionImpl,
);

/**
 * Convenience wrapper — explicit revoke action. Calls grantPermission with
 * granted=false. ADMIN guard kicks in inside grantPermissionImpl.
 */
export async function revokePermission(
  input: Omit<GrantPermissionInput, 'granted'>,
): Promise<GrantPermissionResult> {
  return grantPermission({ ...input, granted: false });
}
