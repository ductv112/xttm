'use server';

// confirmConsulateContact — Phase 8 Plan 08-01 Task 3.
// Đánh dấu đã liên hệ Thương vụ ĐSQ — IMPL-08 cảnh báo 30 ngày.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { IMPL_AUDIT_TYPES } from '@/lib/audit-types';
import type { Role } from '@/lib/constants';

export type ConsulateContactInput = {
  countryName: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactDate: string; // ISO
  note: string;
};

export type ConsulateContactResult =
  | { ok: true }
  | { ok: false; error: string };

export async function confirmConsulateContact(
  projectId: string,
  input: ConsulateContactInput,
): Promise<ConsulateContactResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      organizationId: true,
      contactedConsulate: true,
      consulateContactJson: true,
    },
  });
  if (!project) return { ok: false, error: 'Không tìm thấy đề án' };

  const role = session.user.role as Role;
  const isOwn =
    role === 'DONVI' &&
    project.organizationId === session.user.organizationId;
  const canUpdate = await canFromDB(role, 'trien-khai', 'update');
  if (!isOwn && !canUpdate) {
    return { ok: false, error: 'Không có quyền cập nhật' };
  }

  if (
    !input.countryName.trim() ||
    !input.contactName.trim() ||
    !input.contactDate
  ) {
    return {
      ok: false,
      error: 'Thiếu thông tin: tên quốc gia, người liên hệ, ngày liên hệ',
    };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      contactedConsulate: true,
      consulateContactJson: JSON.stringify(input),
    },
  });

  void logAudit(
    {
      ...IMPL_AUDIT_TYPES.IMPL_CONTACT_CONSULATE,
      resourceId: projectId,
      before: {
        contactedConsulate: project.contactedConsulate,
      },
      after: {
        contactedConsulate: true,
        contact: input,
      },
    },
    session.user.id,
  );

  revalidatePath(`/de-an/${projectId}`);
  return { ok: true };
}

export function parseConsulateContactJson(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsulateContactInput;
  } catch {
    return null;
  }
}
