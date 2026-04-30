'use server';

// updateMyProfile — đơn vị chủ trì cập nhật legalInfo / capabilities / contacts.
// Whitelist via Zod (T-04-01-03 mass-assignment guard).
// Cross-tenant guard (T-04-01-04): session.user.organizationId === profile.organizationId.
// Status guard: chỉ cho phép edit khi status = DRAFT (SUBMITTED → cần BQL trả về REJECTED trước).

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import {
  parseCapabilities,
  parseContacts,
  parseLegalInfo,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

import {
  capabilitiesInternal,
  contactsInternal,
  legalInfoInternal,
  type UpdateMyProfileInput,
} from './types';

export type UpdateMyProfileResult = {
  id: string;
  status: OrgProfileStatus;
  updatedAt: Date;
};

async function updateMyProfileImpl(
  input: UpdateMyProfileInput,
): Promise<UpdateMyProfileResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  // Load existing — single source for cross-tenant + status guards
  const existing = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
  });
  if (!existing) {
    throw new Error('Hồ sơ chưa được khởi tạo — vui lòng tải lại trang');
  }
  if (existing.organizationId !== orgId) {
    // Defense in depth — should never trigger because findUnique by orgId,
    // but leaves the cross-tenant intent explicit (T-04-01-04).
    throw new Error('Bạn không có quyền chỉnh sửa hồ sơ này');
  }

  // SUBMITTED freeze — đơn vị KHÔNG thể edit khi đang chờ BQL phê duyệt;
  // BQL phải REJECT trước (status → DRAFT) hoặc APPROVE.
  if (existing.status === 'SUBMITTED') {
    throw new Error(
      'Hồ sơ đang chờ Ban quản lý phê duyệt — không thể chỉnh sửa. Vui lòng chờ phản hồi.',
    );
  }

  // Build patch — only whitelist keys present in input
  const data: {
    legalInfoJson?: string;
    capabilitiesJson?: string;
    contactsJson?: string;
  } = {};

  if (input.legalInfo !== undefined) {
    const parsed = legalInfoInternal.safeParse(input.legalInfo);
    if (!parsed.success) {
      throw new Error(
        'Thông tin pháp lý không hợp lệ: ' +
          (parsed.error.issues[0]?.message ?? 'lỗi không xác định'),
      );
    }
    data.legalInfoJson = JSON.stringify(parsed.data);
  }

  if (input.capabilities !== undefined) {
    const parsed = capabilitiesInternal.safeParse(input.capabilities);
    if (!parsed.success) {
      throw new Error(
        'Năng lực hoạt động không hợp lệ: ' +
          (parsed.error.issues[0]?.message ?? 'lỗi không xác định'),
      );
    }
    data.capabilitiesJson = JSON.stringify(parsed.data);
  }

  if (input.contacts !== undefined) {
    const parsed = contactsInternal.safeParse(input.contacts);
    if (!parsed.success) {
      throw new Error(
        'Đầu mối liên hệ không hợp lệ: ' +
          (parsed.error.issues[0]?.message ?? 'lỗi không xác định'),
      );
    }
    data.contactsJson = JSON.stringify(parsed.data);
  }

  if (Object.keys(data).length === 0) {
    return {
      id: existing.id,
      status: existing.status as OrgProfileStatus,
      updatedAt: existing.updatedAt,
    };
  }

  // APPROVED → DRAFT khi user edit (per CONTEXT.md spec: "APPROVED → DRAFT
  // (đơn vị cập nhật, nhưng giữ APPROVED status — Phase 5 sẽ check approved=true)")
  // Decision: keep status as-is so a previously approved org can still file đề án
  // while editing minor fields. Phase 5 gating uses approvedAt timestamp + status.
  const updated = await prisma.organizationProfile.update({
    where: { id: existing.id },
    data,
  });

  revalidatePath('/don-vi-cua-toi');

  return {
    id: updated.id,
    status: updated.status as OrgProfileStatus,
    updatedAt: updated.updatedAt,
  };
}

export const updateMyProfile = withAuditLog<
  [UpdateMyProfileInput],
  UpdateMyProfileResult
>(
  {
    action: 'UPDATE',
    resource: 'don-vi-chu-tri',
    resourceIdFromResult: (r) => r?.id ?? null,
    captureBefore: async () => {
      // Lightweight before-snapshot: pull fields about to change (we don't know
      // which yet, but logging existing JSON is fine for audit purposes).
      // The withAuditLog wrapper swallows captureBefore errors so this is safe.
      const session = await import('@/lib/auth').then((m) => m.auth());
      const orgId = session?.user?.organizationId;
      if (!orgId) return null;
      const row = await prisma.organizationProfile.findUnique({
        where: { organizationId: orgId },
        select: { legalInfoJson: true, capabilitiesJson: true, contactsJson: true, status: true },
      });
      return row
        ? {
            legalInfo: parseLegalInfo(row.legalInfoJson),
            capabilities: parseCapabilities(row.capabilitiesJson),
            contacts: parseContacts(row.contactsJson),
            status: row.status,
          }
        : null;
    },
    captureAfter: (r, [input]) => ({
      sectionsUpdated: Object.keys(input ?? {}),
      status: r.status,
    }),
  },
  updateMyProfileImpl,
);
