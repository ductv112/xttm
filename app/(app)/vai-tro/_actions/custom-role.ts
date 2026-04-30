'use server';

// Custom role CRUD — admin tạo/sửa/xóa role ngoài 7 system roles seed.
//
// Threat mitigations:
// - T-02-05-03 role code clash: validate code không trùng system ROLES + Prisma @unique
// - T-02-05-09 delete role with assigned users: count users → throw nếu > 0
// - T-02-05-08 XSS via custom role name: React escape (no dangerouslySetInnerHTML)
//   + Zod max 100 chars defense-in-depth

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import { invalidatePermissionsCache } from '@/lib/permissions-db';
import { ROLES, type Role } from '@/lib/constants';
import {
  customRoleCreateSchema,
  customRoleUpdateSchema,
  type CustomRoleCreateInput,
  type CustomRoleUpdateInput,
} from './schemas';

const SYSTEM_ROLE_CODES = new Set<string>(Object.values(ROLES));

export type CustomRoleResult = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

async function createCustomRoleImpl(
  input: CustomRoleCreateInput,
): Promise<CustomRoleResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'create')) {
    throw new Error('Bạn không có quyền tạo vai trò mới');
  }

  const parsed = customRoleCreateSchema.parse(input);

  // T-02-05-03: prevent clash với 7 system roles
  if (SYSTEM_ROLE_CODES.has(parsed.code)) {
    throw new Error(
      `Mã "${parsed.code}" trùng với vai trò hệ thống. Vui lòng chọn mã khác.`,
    );
  }

  // Check unique code (defense in depth — Prisma @unique sẽ throw P2002 nhưng
  // user-friendly message tốt hơn)
  const existing = await prisma.role.findUnique({
    where: { code: parsed.code },
  });
  if (existing) {
    throw new Error(`Mã vai trò "${parsed.code}" đã tồn tại`);
  }

  const role = await prisma.role.create({
    data: {
      code: parsed.code,
      name: parsed.name,
      description: parsed.description?.trim() || null,
      isSystem: false,
    },
  });

  invalidatePermissionsCache();
  revalidatePath('/vai-tro');

  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
  };
}

export const createCustomRole = withAuditLog<
  [CustomRoleCreateInput],
  CustomRoleResult
>(
  {
    action: 'CREATE',
    resource: 'vai-tro',
    resourceIdFromResult: (result) => result.id,
    captureAfter: (result) => ({
      code: result.code,
      name: result.name,
      description: result.description,
    }),
  },
  createCustomRoleImpl,
);

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

async function updateCustomRoleImpl(
  id: string,
  input: CustomRoleUpdateInput,
): Promise<CustomRoleResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'update')) {
    throw new Error('Bạn không có quyền chỉnh sửa vai trò');
  }

  const parsed = customRoleUpdateSchema.parse(input);

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Vai trò không tồn tại');
  }

  // Không cho sửa system role (chỉ name/description; code immutable đã enforce schema)
  if (existing.isSystem) {
    throw new Error('Không thể chỉnh sửa vai trò hệ thống');
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description?.trim() || null,
    },
  });

  revalidatePath('/vai-tro');

  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
  };
}

export const updateCustomRole = withAuditLog<
  [string, CustomRoleUpdateInput],
  CustomRoleResult
>(
  {
    action: 'UPDATE',
    resource: 'vai-tro',
    resourceIdFromArgs: ([id]) => id,
    captureBefore: async ([id]) =>
      prisma.role.findUnique({
        where: { id },
        select: { code: true, name: true, description: true },
      }),
    captureAfter: (result) => ({
      code: result.code,
      name: result.name,
      description: result.description,
    }),
  },
  updateCustomRoleImpl,
);

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

async function deleteCustomRoleImpl(
  id: string,
): Promise<{ id: string; code: string }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'delete')) {
    throw new Error('Bạn không có quyền xóa vai trò');
  }

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Vai trò không tồn tại');
  }

  if (existing.isSystem) {
    throw new Error('Không thể xóa vai trò hệ thống');
  }

  // T-02-05-09: refuse delete khi còn user assigned
  const userCount = await prisma.user.count({
    where: { role: existing.code },
  });
  if (userCount > 0) {
    throw new Error(
      `Vai trò "${existing.name}" đang được gán cho ${userCount} người dùng. Vui lòng chuyển vai trò khác trước khi xóa.`,
    );
  }

  // RolePermission có onDelete: Cascade trong schema → tự động xóa grants
  await prisma.role.delete({ where: { id } });

  invalidatePermissionsCache();
  revalidatePath('/vai-tro');

  return { id: existing.id, code: existing.code };
}

export const deleteCustomRole = withAuditLog<
  [string],
  { id: string; code: string }
>(
  {
    action: 'DELETE',
    resource: 'vai-tro',
    resourceIdFromArgs: ([id]) => id,
    captureBefore: async ([id]) =>
      prisma.role.findUnique({
        where: { id },
        select: { code: true, name: true, description: true, isSystem: true },
      }),
    captureAfter: (result) => ({ deleted: true, code: result.code }),
  },
  deleteCustomRoleImpl,
);
