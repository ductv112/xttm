'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import type { AuditAction, AuditResource } from '@/lib/audit-types';
import type { AuditFilter, AuditListResult, AuditLogRow } from './types';

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

/**
 * List audit log entries with filtering + pagination.
 * RBAC: requires 'audit-log:read' (admin + lãnh đạo per lib/permissions.ts).
 */
export async function listAuditLogs(
  filter: AuditFilter = {},
  pageIndex: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<AuditListResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'audit-log', 'read')) {
    throw new Error('Bạn không có quyền truy cập nhật ký');
  }

  const safePageIndex = Math.max(0, Math.floor(pageIndex));
  const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize)));

  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: safePageIndex * safePageSize,
      take: safePageSize,
      include: {
        user: {
          select: { fullName: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const mapped: AuditLogRow[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    userId: r.userId,
    userFullName: r.user?.fullName ?? '(không rõ)',
    userRole: r.user?.role ?? '',
    action: r.action as AuditAction,
    resource: r.resource as AuditResource,
    resourceId: r.resourceId,
    diffJson: r.diffJson,
    ip: r.ip,
    userAgent: r.userAgent,
  }));

  return { rows: mapped, total };
}

/**
 * Build prisma where clause from filter. Exported (named export type-only safe)
 * for re-use by export action — DRY.
 */
export async function buildAuditWhere(filter: AuditFilter) {
  return buildWhere(filter);
}

function buildWhere(filter: AuditFilter) {
  const where: Record<string, unknown> = {};

  if (filter.userId) {
    where.userId = filter.userId;
  }
  if (filter.resources && filter.resources.length > 0) {
    where.resource = { in: filter.resources };
  }
  if (filter.actions && filter.actions.length > 0) {
    where.action = { in: filter.actions };
  }
  if (filter.from || filter.to) {
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (filter.from) createdAt.gte = new Date(filter.from);
    if (filter.to) {
      const to = new Date(filter.to);
      // If user passes plain YYYY-MM-DD, expand to end-of-day to make filter inclusive
      if (filter.to.length <= 10) {
        to.setHours(23, 59, 59, 999);
      }
      createdAt.lte = to;
    }
    where.createdAt = createdAt;
  }
  if (filter.keyword && filter.keyword.trim().length > 0) {
    const kw = filter.keyword.trim();
    where.OR = [
      { user: { fullName: { contains: kw } } },
      { resourceId: { contains: kw } },
    ];
  }

  return where;
}
