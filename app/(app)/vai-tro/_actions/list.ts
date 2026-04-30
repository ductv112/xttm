'use server';

// listRoles + listMatrix — RBAC-checked reads cho /vai-tro page.
// listRoles: tab "Danh sách vai trò" — count user + count grants per role
// listMatrix: tab "Ma trận phân quyền" — full grant set cho 7+ roles × 18×8 cells

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { ROLE_LABELS } from '@/lib/constants';

export type RoleSummary = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  grantCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PermissionRow = {
  id: string;
  code: string; // "resource:action"
  resource: string;
  action: string;
  name: string;
};

export type MatrixData = {
  roles: Array<{
    id: string;
    code: string;
    name: string;
    isSystem: boolean;
  }>;
  permissions: PermissionRow[];
  // grants[roleCode] = array của permission codes ("resource:action") đã granted
  grants: Record<string, string[]>;
};

export async function listRoles(): Promise<RoleSummary[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'read')) {
    throw new Error('Bạn không có quyền truy cập danh sách vai trò');
  }

  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: 'desc' }, { code: 'asc' }],
    include: {
      _count: { select: { permissions: { where: { granted: true } } } },
    },
  });

  // Count users assigned to each role code
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: { _all: true },
  });
  const userCountMap = new Map<string, number>(
    userCounts.map((row) => [row.role, row._count._all]),
  );

  return roles.map<RoleSummary>((r) => ({
    id: r.id,
    code: r.code,
    name:
      r.isSystem && (ROLE_LABELS as Record<string, string>)[r.code]
        ? (ROLE_LABELS as Record<string, string>)[r.code]!
        : r.name,
    description: r.description,
    isSystem: r.isSystem,
    userCount: userCountMap.get(r.code) ?? 0,
    grantCount: r._count.permissions,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function listMatrix(): Promise<MatrixData> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'vai-tro', 'read')) {
    throw new Error('Bạn không có quyền truy cập ma trận phân quyền');
  }

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { code: 'asc' }],
      include: {
        permissions: {
          where: { granted: true },
          select: { permission: { select: { code: true } } },
        },
      },
    }),
    prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    }),
  ]);

  const grants: Record<string, string[]> = {};
  for (const role of roles) {
    grants[role.code] = role.permissions.map((rp) => rp.permission.code);
  }

  return {
    roles: roles.map((r) => ({
      id: r.id,
      code: r.code,
      name:
        r.isSystem && (ROLE_LABELS as Record<string, string>)[r.code]
          ? (ROLE_LABELS as Record<string, string>)[r.code]!
          : r.name,
      isSystem: r.isSystem,
    })),
    permissions: permissions.map((p) => ({
      id: p.id,
      code: p.code,
      resource: p.resource,
      action: p.action,
      name: p.name,
    })),
    grants,
  };
}
