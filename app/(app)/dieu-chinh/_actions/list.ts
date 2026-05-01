'use server';

// listAmendments — Phase 8 Plan 08-01 Task 4.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type AmendmentListRow = {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  organizationName: string;
  amendmentType: string;
  isCritical: boolean;
  status: string;
  reason: string;
  createdAt: Date;
  requestedByName: string | null;
  decisionNumber: string | null;
  decisionDate: Date | null;
};

export async function listAmendments(filter?: {
  status?: string;
  scope?: 'critical' | 'normal' | 'all';
}): Promise<AmendmentListRow[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'de-an', 'read'))) return [];

  const where: Record<string, unknown> = {};
  if (filter?.status) where.status = filter.status;
  if (filter?.scope === 'critical') where.isCritical = true;
  if (filter?.scope === 'normal') where.isCritical = false;

  // RBAC scope: DONVI only own org
  if (role === 'DONVI' && session.user.organizationId) {
    where.project = { organizationId: session.user.organizationId };
  }

  const rows = await prisma.projectAmendment.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          organization: { select: { name: true } },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  // Resolve requester names
  const userIds = [...new Set(rows.map((r) => r.requestedById).filter(Boolean))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u.fullName]));

  return rows.map((r) => ({
    id: r.id,
    projectId: r.project.id,
    projectCode: r.project.code,
    projectName: r.project.name,
    organizationName: r.project.organization.name,
    amendmentType: r.amendmentType,
    isCritical: r.isCritical,
    status: r.status,
    reason: r.reason,
    createdAt: r.createdAt,
    requestedByName: userById.get(r.requestedById) ?? null,
    decisionNumber: r.decisionNumber,
    decisionDate: r.decisionDate,
  }));
}

// =============================================================================
// getAmendmentDetail
// =============================================================================

export type AmendmentDetail = AmendmentListRow & {
  oldValue: unknown;
  newValue: unknown;
  reviewerComment: string | null;
  reviewedAt: Date | null;
  reviewedByName: string | null;
};

export async function getAmendmentDetail(
  id: string,
): Promise<AmendmentDetail | null> {
  const session = await auth();
  if (!session?.user) throw new Error('Yêu cầu đăng nhập');
  const role = session.user.role as Role;

  const a = await prisma.projectAmendment.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
    },
  });
  if (!a) return null;

  // RBAC scope
  // ADMIN bypass: full data access — admin can view any amendment
  if (
    role === 'DONVI' &&
    a.project.organizationId !== session.user.organizationId
  ) {
    return null;
  }
  const canRead = role === 'ADMIN' || (await canFromDB(role, 'de-an', 'read'));
  if (!canRead) return null;

  const userIds = [a.requestedById, a.reviewedById].filter(
    (x): x is string => Boolean(x),
  );
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u.fullName]));

  let oldValue: unknown = null;
  let newValue: unknown = null;
  try {
    oldValue = a.oldValueJson ? JSON.parse(a.oldValueJson) : null;
  } catch {
    oldValue = a.oldValueJson;
  }
  try {
    newValue = a.newValueJson ? JSON.parse(a.newValueJson) : null;
  } catch {
    newValue = a.newValueJson;
  }

  return {
    id: a.id,
    projectId: a.project.id,
    projectCode: a.project.code,
    projectName: a.project.name,
    organizationName: a.project.organization.name,
    amendmentType: a.amendmentType,
    isCritical: a.isCritical,
    status: a.status,
    reason: a.reason,
    createdAt: a.createdAt,
    requestedByName: userById.get(a.requestedById) ?? null,
    decisionNumber: a.decisionNumber,
    decisionDate: a.decisionDate,
    oldValue,
    newValue,
    reviewerComment: a.reviewerComment,
    reviewedAt: a.reviewedAt,
    reviewedByName: a.reviewedById
      ? userById.get(a.reviewedById) ?? null
      : null,
  };
}
