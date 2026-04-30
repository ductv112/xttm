'use server';

// uploadProfileDocument — đơn vị upload tài liệu pháp lý (PDF/JPG/PNG, ≤10MB, ≤10 docs).
// Path safety (T-04-01-02): UUID filename + path.resolve guard, never use original name on FS.
// MIME + magic byte (defense-in-depth):
//   PDF: 0x25504446 ("%PDF-")
//   JPG: 0xFFD8FF
//   PNG: 0x89504E47 ("\x89PNG")
// Categories: GIAY_DKKD | DIEU_LE | QUYET_DINH | KHAC (stored in Attachment.signedNumber column).

import { revalidatePath } from 'next/cache';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_DOCS_PER_PROFILE = 10;

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const JPG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const DOCUMENT_CATEGORIES = ['GIAY_DKKD', 'DIEU_LE', 'QUYET_DINH', 'KHAC'] as const;
const categorySchema = z.enum(DOCUMENT_CATEGORIES, {
  message: 'Vui lòng chọn loại tài liệu hợp lệ',
});

const ACCEPTED_MIMES: Record<string, { ext: string; magic: Buffer }> = {
  'application/pdf': { ext: 'pdf', magic: PDF_MAGIC },
  'image/jpeg': { ext: 'jpg', magic: JPG_MAGIC },
  'image/png': { ext: 'png', magic: PNG_MAGIC },
};

// Allow only safe id pattern (cuid alphanum + - _) — defense in depth though
// our caller passes Prisma cuid.
const orgIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Mã đơn vị không hợp lệ');

export type UploadProfileDocumentResult = {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  category: string;
};

async function uploadProfileDocumentImpl(
  formData: FormData,
): Promise<UploadProfileDocumentResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }
  const orgIdParse = orgIdSchema.safeParse(orgId);
  if (!orgIdParse.success) {
    throw new Error('Mã đơn vị không hợp lệ');
  }
  const safeOrgId = orgIdParse.data;

  // Profile must exist + status guard (DRAFT or REJECTED only)
  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: safeOrgId },
  });
  if (!profile) {
    throw new Error('Hồ sơ chưa được khởi tạo — vui lòng tải lại trang');
  }
  if (profile.status === 'SUBMITTED') {
    throw new Error('Hồ sơ đang chờ phê duyệt — không thể tải thêm tài liệu');
  }

  // Document quota
  const existingCount = await prisma.attachment.count({
    where: { entityType: 'OrganizationProfile', entityId: profile.id },
  });
  if (existingCount >= MAX_DOCS_PER_PROFILE) {
    throw new Error(
      `Đã đạt giới hạn ${MAX_DOCS_PER_PROFILE} tài liệu/hồ sơ. Vui lòng xóa bớt trước khi tải thêm.`,
    );
  }

  // Parse form
  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') {
    throw new Error('Vui lòng chọn tệp tài liệu');
  }
  const file = fileEntry as File;
  const categoryRaw = formData.get('category');
  const categoryParse = categorySchema.safeParse(categoryRaw);
  if (!categoryParse.success) {
    throw new Error(categoryParse.error.issues[0]?.message ?? 'Loại tài liệu không hợp lệ');
  }
  const category = categoryParse.data;

  // MIME check
  const mimeMeta = ACCEPTED_MIMES[file.type];
  if (!mimeMeta) {
    throw new Error('Chỉ chấp nhận tệp PDF, JPG hoặc PNG');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Tệp vượt quá kích thước cho phép 10MB');
  }
  if (file.size === 0) {
    throw new Error('Tệp không hợp lệ — kích thước rỗng');
  }

  // Magic byte check
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (
    buffer.length < mimeMeta.magic.length ||
    !buffer.subarray(0, mimeMeta.magic.length).equals(mimeMeta.magic)
  ) {
    throw new Error('Tệp không hợp lệ — định dạng tệp không khớp với phần mở rộng');
  }

  // Build paths — UUID filename, never use original (T-04-01-02)
  const storedFileName = `${randomUUID()}.${mimeMeta.ext}`;
  const dirPathFs = join(process.cwd(), 'storage', 'uploads', 'org-profile', safeOrgId);
  await mkdir(dirPathFs, { recursive: true });
  const filePathFs = join(dirPathFs, storedFileName);
  await writeFile(filePathFs, buffer);

  const fileUrl = posix.join('storage', 'uploads', 'org-profile', safeOrgId, storedFileName);

  const attachment = await prisma.attachment.create({
    data: {
      entityType: 'OrganizationProfile',
      entityId: profile.id,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      signedNumber: category, // repurposed column to carry category code
      uploadedById: session.user.id,
    },
  });

  revalidatePath('/don-vi-cua-toi');

  return {
    attachmentId: attachment.id,
    fileName: file.name,
    fileUrl,
    category,
  };
}

export const uploadProfileDocument = withAuditLog<
  [FormData],
  UploadProfileDocumentResult
>(
  {
    action: 'UPLOAD',
    resource: 'don-vi-chu-tri',
    resourceIdFromResult: (r) => r?.attachmentId ?? null,
    captureAfter: (r) => ({
      attachmentId: r.attachmentId,
      fileName: r.fileName,
      category: r.category,
    }),
  },
  uploadProfileDocumentImpl,
);

// =============================================================================
// Delete document
// =============================================================================

const attachmentIdSchema = z
  .string()
  .min(1, 'Mã tài liệu không hợp lệ')
  .max(64, 'Mã tài liệu không hợp lệ')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Mã tài liệu không hợp lệ');

export type DeleteProfileDocumentResult = {
  attachmentId: string;
};

async function deleteProfileDocumentImpl(
  attachmentId: string,
): Promise<DeleteProfileDocumentResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const idParse = attachmentIdSchema.safeParse(attachmentId);
  if (!idParse.success) {
    throw new Error(idParse.error.issues[0]?.message ?? 'Mã tài liệu không hợp lệ');
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: idParse.data },
  });
  if (!attachment) {
    throw new Error('Không tìm thấy tài liệu');
  }
  if (attachment.entityType !== 'OrganizationProfile') {
    throw new Error('Loại tài liệu không hợp lệ cho thao tác này');
  }

  // Cross-tenant guard: attachment.entityId === profile.id of caller's org
  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
  });
  if (!profile || profile.id !== attachment.entityId) {
    throw new Error('Bạn không có quyền xóa tài liệu này');
  }
  if (profile.status === 'SUBMITTED') {
    throw new Error('Hồ sơ đang chờ phê duyệt — không thể xóa tài liệu');
  }

  await prisma.attachment.delete({ where: { id: idParse.data } });

  revalidatePath('/don-vi-cua-toi');

  return { attachmentId: idParse.data };
}

export const deleteProfileDocument = withAuditLog<
  [string],
  DeleteProfileDocumentResult
>(
  {
    action: 'DELETE',
    resource: 'don-vi-chu-tri',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({ attachmentId: r.attachmentId }),
  },
  deleteProfileDocumentImpl,
);
