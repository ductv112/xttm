'use server';

// getOrCreateMyProfile — auto-provision OrganizationProfile cho đơn vị chủ trì khi
// login lần đầu. CONTEXT.md: "khi user role=DONVI login lần đầu, hệ thống tự tạo
// OrganizationProfile DRAFT từ Organization gốc".
//
// RBAC: chỉ user có organizationId được gọi (cross-tenant T-04-01-04 mitigated).
// Idempotent — findUnique → create-if-missing.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseCapabilities,
  parseContacts,
  parseLegalInfo,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

import type { OrgProfileDocument, OrgProfileWithDocuments } from './types';

function mapDocument(att: {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  signedNumber: string | null;
  createdAt: Date;
  uploader: { fullName: string } | null;
}): OrgProfileDocument {
  return {
    id: att.id,
    fileName: att.fileName,
    fileUrl: att.fileUrl,
    fileSize: att.fileSize,
    mimeType: att.mimeType,
    category: att.signedNumber, // repurposed: stores category code (GIAY_DKKD/DIEU_LE/QUYET_DINH/KHAC)
    uploadedAt: att.createdAt,
    uploaderName: att.uploader?.fullName ?? null,
  };
}

/**
 * Fetch (or create on first call) OrganizationProfile for the logged-in DONVI user.
 *
 * Throws Vietnamese error if session missing organizationId (e.g. ADMIN/BANQL
 * users invoking by mistake).
 */
export async function getOrCreateMyProfile(): Promise<OrgProfileWithDocuments> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error(
      'Tài khoản của bạn chưa được gán đơn vị — không thể tạo hồ sơ tổ chức',
    );
  }

  // 1. Try to fetch existing profile
  let profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
    include: {
      organization: {
        select: { id: true, code: true, name: true, taxCode: true, address: true, email: true, phone: true },
      },
    },
  });

  // 2. Create on first access — seed from Organization base record
  if (!profile) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new Error('Không tìm thấy đơn vị tổ chức gắn với tài khoản');
    }
    const seedLegalInfo = JSON.stringify({
      taxCode: org.taxCode ?? '',
      address: org.address ?? '',
      representativeName: '',
      representativeTitle: '',
      businessType: org.type,
      businessField: '',
    });
    profile = await prisma.organizationProfile.create({
      data: {
        organizationId: orgId,
        status: 'DRAFT',
        legalInfoJson: seedLegalInfo,
        capabilitiesJson: JSON.stringify({ description: '', achievements: '', pastProjects: [] }),
        contactsJson: JSON.stringify([]),
      },
      include: {
        organization: {
          select: { id: true, code: true, name: true, taxCode: true, address: true, email: true, phone: true },
        },
      },
    });
  }

  // 3. Fetch documents (Attachment polymorphic with entityType=OrganizationProfile)
  const documents = await prisma.attachment.findMany({
    where: { entityType: 'OrganizationProfile', entityId: profile.id },
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { fullName: true } },
    },
  });

  // 4. Resolve approvedBy name (if approved)
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
    organizationName: profile.organization.name,
    organizationCode: profile.organization.code,
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
    documents: documents.map(mapDocument),
  };
}
