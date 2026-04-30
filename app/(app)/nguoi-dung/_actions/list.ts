'use server';

// listUsers — paginated, RBAC-checked. Used by user management page + Excel export action.

import type { Prisma } from '@prisma/client';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import type { ListUsersFilter } from './schemas';

const MAX_PAGE_SIZE = 5000; // upper cap (Excel export uses this)
const DEFAULT_PAGE_SIZE = 20;

export type UserOrgSummary = {
  id: string;
  name: string;
  code: string;
};

export type UserListRow = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  organizationId: string | null;
  organization: UserOrgSummary | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListUsersResult = {
  rows: UserListRow[];
  total: number;
};

export async function listUsers(
  filter: ListUsersFilter | undefined = undefined,
  pageIndex: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<ListUsersResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'read')) {
    throw new Error('Bạn không có quyền truy cập danh sách người dùng');
  }

  const safeFilter = filter ?? {};
  const safePageIndex = Math.max(0, Math.floor(pageIndex));
  const safePageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(pageSize)),
  );

  const where: Prisma.UserWhereInput = {};

  if (safeFilter.keyword && safeFilter.keyword.trim().length > 0) {
    const kw = safeFilter.keyword.trim();
    where.OR = [
      { fullName: { contains: kw } },
      { username: { contains: kw } },
      { email: { contains: kw } },
    ];
  }

  if (safeFilter.roles && safeFilter.roles.length > 0) {
    where.role = { in: safeFilter.roles };
  }

  if (safeFilter.organizationIds && safeFilter.organizationIds.length > 0) {
    where.organizationId = { in: safeFilter.organizationIds };
  }

  if (safeFilter.status === 'active') where.isActive = true;
  if (safeFilter.status === 'locked') where.isActive = false;

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: safePageIndex * safePageSize,
      take: safePageSize,
      include: {
        organization: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const mapped: UserListRow[] = rows.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    organizationId: u.organizationId,
    organization: u.organization
      ? {
          id: u.organization.id,
          name: u.organization.name,
          code: u.organization.code,
        }
      : null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return { rows: mapped, total };
}

// Helper used by edit page to fetch a single user (also RBAC-checked).
export async function getUserById(id: string): Promise<UserListRow | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'read')) {
    throw new Error('Bạn không có quyền truy cập thông tin người dùng');
  }

  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true, code: true } },
    },
  });
  if (!u) return null;

  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    organizationId: u.organizationId,
    organization: u.organization
      ? {
          id: u.organization.id,
          name: u.organization.name,
          code: u.organization.code,
        }
      : null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

// Helper for org dropdown in user form. RBAC: any signed-in user with read on
// nguoi-dung resource (admin only per matrix).
export type OrgOption = {
  id: string;
  name: string;
  code: string;
};

export async function listOrganizationsForSelect(): Promise<OrgOption[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'nguoi-dung', 'read')) {
    throw new Error('Bạn không có quyền truy cập danh sách đơn vị');
  }

  const orgs = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });
  return orgs;
}
