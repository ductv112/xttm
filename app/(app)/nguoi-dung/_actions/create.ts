'use server';

// createUser — admin-only, bcrypt hash password, audit log via withAuditLog.

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import { ROLES, type Role } from '@/lib/constants';
import { createUserSchema, type CreateUserInput } from './schemas';
import type { UserListRow } from './list';

const BCRYPT_COST = 10;

async function createUserImpl(input: CreateUserInput): Promise<UserListRow> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'create')) {
    throw new Error('Bạn không có quyền tạo người dùng');
  }

  // Zod parse — strips unknown fields (T-02-04-03 mass-assignment mitigation)
  const parsed = createUserSchema.parse(input);

  // T-02-04-02 — privilege escalation guard: only ADMIN can create another ADMIN.
  // Currently RBAC matrix only allows ADMIN to create users, so this is layered.
  if (parsed.role === ROLES.ADMIN && session.user.role !== ROLES.ADMIN) {
    throw new Error('Chỉ Quản trị viên mới có thể tạo tài khoản Quản trị viên');
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.username },
  });
  if (existing) {
    throw new Error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác');
  }

  const passwordHash = await bcrypt.hash(parsed.password, BCRYPT_COST);

  // Explicit field whitelist — DO NOT spread `parsed` to avoid mass assignment
  const created = await prisma.user.create({
    data: {
      fullName: parsed.fullName,
      username: parsed.username,
      email: parsed.email && parsed.email.length > 0 ? parsed.email : null,
      phone: parsed.phone && parsed.phone.length > 0 ? parsed.phone : null,
      passwordHash,
      role: parsed.role,
      organizationId:
        parsed.organizationId && parsed.organizationId.length > 0
          ? parsed.organizationId
          : null,
      isActive: parsed.isActive ?? true,
    },
    include: {
      organization: { select: { id: true, name: true, code: true } },
    },
  });

  revalidatePath('/nguoi-dung');

  return {
    id: created.id,
    username: created.username,
    fullName: created.fullName,
    email: created.email,
    phone: created.phone,
    role: created.role,
    isActive: created.isActive,
    organizationId: created.organizationId,
    organization: created.organization
      ? {
          id: created.organization.id,
          name: created.organization.name,
          code: created.organization.code,
        }
      : null,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

// Wrap with audit log — captureAfter strips passwordHash from log payload.
export const createUser = withAuditLog<[CreateUserInput], UserListRow>(
  {
    action: 'CREATE',
    resource: 'nguoi-dung',
    resourceIdFromResult: (user) => user?.id ?? null,
    captureAfter: (user) => ({
      // Redact any password field so raw password / hash never lands in audit log
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      organizationId: user.organizationId,
      password: '[redacted]',
    }),
  },
  createUserImpl,
);
