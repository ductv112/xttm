'use server';

// saveImplementationPlan — Phase 8 Plan 08-01 Task 3.
// Lưu kế hoạch triển khai (milestones, staff, schedule).
// RBAC: DONVI sửa đề án của mình; BANQL có quyền update toàn bộ.
//
// Pure types + parsers extracted to lib/implementation.ts (Next.js 'use server'
// constraint: only async functions can be exported from server action files).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { IMPL_AUDIT_TYPES } from '@/lib/audit-types';
import type { Role } from '@/lib/constants';
import {
  parseImplementationJson,
  type ImplementationData,
  type ImplementationMilestone,
} from '@/lib/implementation';

export type SaveImplPlanResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveImplementationPlan(
  projectId: string,
  data: ImplementationData,
): Promise<SaveImplPlanResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }
  const role = session.user.role as Role;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      implementationJson: true,
    },
  });
  if (!project) return { ok: false, error: 'Không tìm thấy đề án' };

  // RBAC: DONVI must own the project; BANQL/CHUYENVIEN need 'trien-khai:update'
  // ADMIN bypass: full data access — admin can update any project's impl plan
  const isAdmin = role === 'ADMIN';
  const isOwn =
    role === 'DONVI' &&
    project.organizationId === session.user.organizationId;
  const canUpdateAny = await canFromDB(role, 'trien-khai', 'update');
  if (!isAdmin && !isOwn && !canUpdateAny) {
    return {
      ok: false,
      error: 'Bạn không có quyền chỉnh sửa kế hoạch triển khai',
    };
  }

  // Sanitize: clamp progress 0-100
  const sanitized: ImplementationData = {
    milestones: data.milestones.map((m) => ({
      ...m,
      progress: Math.max(0, Math.min(100, Number(m.progress) || 0)),
    })),
    staff: data.staff,
    schedule: data.schedule,
  };

  await prisma.project.update({
    where: { id: projectId },
    data: { implementationJson: JSON.stringify(sanitized) },
  });

  void logAudit(
    {
      ...IMPL_AUDIT_TYPES.IMPL_UPDATE_PLAN,
      resourceId: projectId,
      before: parseImplementationJson(project.implementationJson),
      after: sanitized,
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${projectId}`);
  return { ok: true };
}

// =============================================================================
// updateMilestoneProgress — single milestone progress update
// =============================================================================

export async function updateMilestoneProgress(
  projectId: string,
  milestoneId: string,
  progress: number,
  status: ImplementationMilestone['status'],
  note: string,
): Promise<SaveImplPlanResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      organizationId: true,
      implementationJson: true,
    },
  });
  if (!project) return { ok: false, error: 'Không tìm thấy đề án' };

  const role = session.user.role as Role;
  // ADMIN bypass: full data access — admin can update progress on any project
  const isAdmin = role === 'ADMIN';
  const isOwn =
    role === 'DONVI' &&
    project.organizationId === session.user.organizationId;
  const canUpdateAny = await canFromDB(role, 'trien-khai', 'update');
  if (!isAdmin && !isOwn && !canUpdateAny) {
    return { ok: false, error: 'Không có quyền cập nhật tiến độ' };
  }

  const data = parseImplementationJson(project.implementationJson);
  const idx = data.milestones.findIndex((m) => m.id === milestoneId);
  if (idx === -1) return { ok: false, error: 'Không tìm thấy mốc công việc' };

  const existing = data.milestones[idx] as ImplementationMilestone;
  const before: ImplementationMilestone = { ...existing };
  data.milestones[idx] = {
    ...existing,
    progress: Math.max(0, Math.min(100, progress)),
    status,
    note,
  };

  await prisma.project.update({
    where: { id: projectId },
    data: { implementationJson: JSON.stringify(data) },
  });

  void logAudit(
    {
      ...IMPL_AUDIT_TYPES.IMPL_UPDATE_PROGRESS,
      resourceId: projectId,
      before: { milestone: before },
      after: { milestone: data.milestones[idx] },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${projectId}`);
  return { ok: true };
}
