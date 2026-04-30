'use server';

// listOrgProfiles — BQL danh sách hồ sơ đơn vị chủ trì với filter status + search.
// RBAC: canFromDB(role, 'don-vi-chu-tri', 'read'). DONVI cũng được phép xem (theo
// permissions.ts MATRIX) nhưng route page sẽ giới hạn riêng cho BANQL/ADMIN.
//
// Search by org name with diacritics removal — leverages Organization.searchKey index
// (column populated by lib/vi-search removeDiacritics during seed).

import type { Prisma } from '@prisma/client';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { removeDiacritics } from '@/lib/vi-search';
import {
  parseCapabilities,
  parseContacts,
  parseLegalInfo,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

import type {
  OrgProfileListFilter,
  OrgProfileListItem,
} from '../../don-vi-cua-toi/_actions/types';

export async function listOrgProfiles(
  filter: OrgProfileListFilter | undefined = undefined,
): Promise<OrgProfileListItem[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'don-vi-chu-tri', 'read'))) {
    throw new Error('Bạn không có quyền xem danh sách hồ sơ đơn vị');
  }

  const where: Prisma.OrganizationProfileWhereInput = {};

  // Default = SUBMITTED (focus BQL inbox); 'ALL' shows mọi status; specific status filters that one
  if (!filter?.status || filter.status === 'ALL') {
    // No status filter — show all
  } else {
    where.status = filter.status;
  }

  if (filter?.search && filter.search.trim()) {
    const key = removeDiacritics(filter.search.trim().toLowerCase());
    where.organization = {
      searchKey: { contains: key },
    };
  }

  const rows = await prisma.organizationProfile.findMany({
    where,
    orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
    include: {
      organization: {
        select: { id: true, code: true, name: true, type: true },
      },
    },
  });

  // Aggregate document counts per profile
  const profileIds = rows.map((r) => r.id);
  const docCountsRaw = profileIds.length
    ? await prisma.attachment.groupBy({
        by: ['entityId'],
        where: { entityType: 'OrganizationProfile', entityId: { in: profileIds } },
        _count: { _all: true },
      })
    : [];
  const docCountByProfileId = new Map<string, number>();
  for (const r of docCountsRaw) docCountByProfileId.set(r.entityId, r._count._all);

  return rows.map<OrgProfileListItem>((row) => {
    const legal = parseLegalInfo(row.legalInfoJson);
    const contacts = parseContacts(row.contactsJson);
    return {
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organization.name,
      organizationCode: row.organization.code,
      organizationType: row.organization.type,
      status: row.status as OrgProfileStatus,
      taxCode: legal.taxCode ?? null,
      representativeName: legal.representativeName ?? null,
      contactCount: contacts.length,
      documentCount: docCountByProfileId.get(row.id) ?? 0,
      submittedAt: row.submittedAt,
      approvedAt: row.approvedAt,
      rejectionReason: row.rejectionReason,
      updatedAt: row.updatedAt,
    };
  });
}

// =============================================================================
// getOrgProfileDetail — full profile cho BQL drawer (readonly view)
// =============================================================================

export async function getOrgProfileDetail(profileId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'don-vi-chu-tri', 'read'))) {
    throw new Error('Bạn không có quyền xem hồ sơ đơn vị');
  }

  if (!profileId || typeof profileId !== 'string') {
    throw new Error('Mã hồ sơ không hợp lệ');
  }

  const profile = await prisma.organizationProfile.findUnique({
    where: { id: profileId },
    include: {
      organization: {
        select: { id: true, code: true, name: true, type: true, address: true, phone: true, email: true, website: true },
      },
    },
  });
  if (!profile) {
    throw new Error('Không tìm thấy hồ sơ đơn vị');
  }

  const documents = await prisma.attachment.findMany({
    where: { entityType: 'OrganizationProfile', entityId: profile.id },
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { fullName: true } } },
  });

  let approvedByName: string | null = null;
  if (profile.approvedById) {
    const approver = await prisma.user.findUnique({
      where: { id: profile.approvedById },
      select: { fullName: true },
    });
    approvedByName = approver?.fullName ?? null;
  }

  return {
    id: profile.id,
    organizationId: profile.organizationId,
    organization: profile.organization,
    status: profile.status as OrgProfileStatus,
    legalInfo: parseLegalInfo(profile.legalInfoJson),
    capabilities: parseCapabilities(profile.capabilitiesJson),
    contacts: parseContacts(profile.contactsJson),
    rejectionReason: profile.rejectionReason,
    submittedAt: profile.submittedAt,
    approvedAt: profile.approvedAt,
    approvedById: profile.approvedById,
    approvedByName,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    documents: documents.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      category: att.signedNumber, // repurposed: stores category code
      uploadedAt: att.createdAt,
      uploaderName: att.uploader?.fullName ?? null,
    })),
  };
}

export type OrgProfileDetail = Awaited<ReturnType<typeof getOrgProfileDetail>>;
