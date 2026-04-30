'use server';

// updateUser — admin-only, with diff via captureBefore. Username/password not editable here.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import { withAuditLog } from '@/lib/audit';
import { ROLES, type Role } from '@/lib/constants';
import { updateUserSchema, type UpdateUserInput } from './schemas';
import type { UserListRow } from './list';

async function updateUserImpl(
  id: string,
  input: UpdateUserInput,
): Promise<UserListRow> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'update')) {
    throw new Error('Bạn không có quyền cập nhật người dùng');
  }

  const parsed = updateUserSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Không tìm thấy người dùng');
  }

  // T-02-04-02 — privilege escalation guard:
  // - Only ADMIN can promote anyone to ADMIN
  // - Cannot change own role (would lock self out of admin panel)
  if (
    parsed.role === ROLES.ADMIN &&
    session.user.role !== ROLES.ADMIN
  ) {
    throw new Error('Chỉ Quản trị viên mới có thể gán vai trò Quản trị viên');
  }
  if (id === session.user.id && parsed.role !== existing.role) {
    throw new Error('Không thể tự thay đổi vai trò của chính mình');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      fullName: parsed.fullName,
      email: parsed.email && parsed.email.length > 0 ? parsed.email : null,
      phone: parsed.phone && parsed.phone.length > 0 ? parsed.phone : null,
      role: parsed.role,
      organizationId:
        parsed.organizationId && parsed.organizationId.length > 0
          ? parsed.organizationId
          : null,
      isActive: parsed.isActive ?? existing.isActive,
    },
    include: {
      organization: { select: { id: true, name: true, code: true } },
    },
  });

  revalidatePath('/nguoi-dung');
  revalidatePath(`/nguoi-dung/${id}/edit`);

  return {
    id: updated.id,
    username: updated.username,
    fullName: updated.fullName,
    email: updated.email,
    phone: updated.phone,
    role: updated.role,
    isActive: updated.isActive,
    organizationId: updated.organizationId,
    organization: updated.organization
      ? {
          id: updated.organization.id,
          name: updated.organization.name,
          code: updated.organization.code,
        }
      : null,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

// Plain user shape (no passwordHash) for diff — we don't want hash bytes in audit log.
function redact(user: {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  organizationId: string | null;
}): Record<string, unknown> {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    organizationId: user.organizationId,
  };
}

export const updateUser = withAuditLog<[string, UpdateUserInput], UserListRow>(
  {
    action: 'UPDATE',
    resource: 'nguoi-dung',
    resourceIdFromArgs: ([id]) => id,
    captureBefore: async ([id]) => {
      const u = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          organizationId: true,
        },
      });
      return u ? redact(u) : null;
    },
    captureAfter: (user) =>
      redact({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        organizationId: user.organizationId,
      }),
  },
  updateUserImpl,
);
