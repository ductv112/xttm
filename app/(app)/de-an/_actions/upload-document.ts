'use server';

// uploadProjectDocument — đơn vị upload tài liệu đính kèm cho đề án.
// PROJ-09 + PROJ-10 (categories: Kế hoạch / Năng lực / Bằng chứng / Khác).
// Path safety (T-05-01-04): UUID filename + path.resolve guard, never use original name.
// MIME + magic byte (defense-in-depth):
//   PDF: %PDF-          (0x25504446)
//   JPG: 0xFFD8FF
//   PNG: 0x89PNG        (0x89504E47)
//   DOC: 0xD0CF11E0     (legacy compound binary)
//   DOCX/XLSX: PK..     (zip header 0x504B0304) — server can't fully verify but accepts
//
// Limits: 10MB / file, 20 files / project (PROJ-10).

import { revalidatePath } from 'next/cache';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_DOCS_PER_PROJECT = 20;

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const JPG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const DOC_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]); // legacy .doc/.xls
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // .docx/.xlsx (OOXML)

const DOCUMENT_CATEGORIES = ['PLAN', 'CAPABILITY', 'EVIDENCE', 'OTHER'] as const;
const categorySchema = z.enum(DOCUMENT_CATEGORIES, {
  message: 'Vui lòng chọn loại tài liệu hợp lệ',
});

type MimeMeta = { ext: string; magic: Buffer | null; checkMagic: boolean };

const ACCEPTED_MIMES: Record<string, MimeMeta> = {
  'application/pdf': { ext: 'pdf', magic: PDF_MAGIC, checkMagic: true },
  'image/jpeg': { ext: 'jpg', magic: JPG_MAGIC, checkMagic: true },
  'image/png': { ext: 'png', magic: PNG_MAGIC, checkMagic: true },
  'application/msword': { ext: 'doc', magic: DOC_MAGIC, checkMagic: true },
  'application/vnd.ms-excel': { ext: 'xls', magic: DOC_MAGIC, checkMagic: true },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: 'docx',
    magic: ZIP_MAGIC,
    checkMagic: true,
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    ext: 'xlsx',
    magic: ZIP_MAGIC,
    checkMagic: true,
  },
};

const projectIdSchema = z
  .string()
  .min(1, 'Mã đề án không hợp lệ')
  .max(64, 'Mã đề án không hợp lệ')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Mã đề án không hợp lệ');

export type UploadProjectDocumentResult = {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  category: string;
};

async function uploadProjectDocumentImpl(
  formData: FormData,
): Promise<UploadProjectDocumentResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }

  const projectIdRaw = formData.get('projectId');
  if (typeof projectIdRaw !== 'string') {
    throw new Error('Thiếu mã đề án');
  }
  const projectIdParse = projectIdSchema.safeParse(projectIdRaw);
  if (!projectIdParse.success) {
    throw new Error(
      projectIdParse.error.issues[0]?.message ?? 'Mã đề án không hợp lệ',
    );
  }
  const projectId = projectIdParse.data;

  // Verify project ownership + editable status
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      deletedAt: true,
    },
  });
  if (!project || project.deletedAt) {
    throw new Error('Không tìm thấy đề án');
  }
  if (project.organizationId !== orgId) {
    throw new Error('Bạn không có quyền tải tài liệu cho đề án này');
  }
  // Allow upload only when DRAFT/SUPPLEMENT_REQUIRED (đang khai báo / đang bổ sung)
  if (
    project.status !== 'DRAFT' &&
    project.status !== 'SUPPLEMENT_REQUIRED' &&
    project.status !== 'TENTATIVE'
  ) {
    throw new Error(
      'Đề án ở trạng thái này không thể tải thêm tài liệu (chỉ cho phép khi DRAFT hoặc đang bổ sung)',
    );
  }

  // Quota check
  const existingCount = await prisma.attachment.count({
    where: { entityType: 'Project', entityId: project.id },
  });
  if (existingCount >= MAX_DOCS_PER_PROJECT) {
    throw new Error(
      `Đã đạt giới hạn ${MAX_DOCS_PER_PROJECT} tài liệu/đề án. Vui lòng xóa bớt trước khi tải thêm.`,
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
    throw new Error(
      categoryParse.error.issues[0]?.message ?? 'Loại tài liệu không hợp lệ',
    );
  }
  const category = categoryParse.data;

  // MIME check
  const mimeMeta = ACCEPTED_MIMES[file.type];
  if (!mimeMeta) {
    throw new Error('Chỉ chấp nhận tệp PDF, DOC, DOCX, XLSX, JPG hoặc PNG');
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
  if (mimeMeta.checkMagic && mimeMeta.magic) {
    if (
      buffer.length < mimeMeta.magic.length ||
      !buffer.subarray(0, mimeMeta.magic.length).equals(mimeMeta.magic)
    ) {
      throw new Error(
        'Tệp không hợp lệ — định dạng tệp không khớp với phần mở rộng',
      );
    }
  }

  // Build paths — UUID filename, never use original (T-05-01-04)
  const storedFileName = `${randomUUID()}.${mimeMeta.ext}`;
  const dirPathFs = join(
    process.cwd(),
    'storage',
    'uploads',
    'de-an',
    project.id,
  );
  await mkdir(dirPathFs, { recursive: true });
  const filePathFs = join(dirPathFs, storedFileName);
  await writeFile(filePathFs, buffer);

  const fileUrl = posix.join(
    'storage',
    'uploads',
    'de-an',
    project.id,
    storedFileName,
  );

  const attachment = await prisma.attachment.create({
    data: {
      entityType: 'Project',
      entityId: project.id,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      signedNumber: category, // repurposed column to carry category code
      uploadedById: session.user.id,
    },
  });

  revalidatePath(`/de-an/${project.id}`);

  return {
    attachmentId: attachment.id,
    fileName: file.name,
    fileUrl,
    category,
  };
}

export const uploadProjectDocument = withAuditLog<
  [FormData],
  UploadProjectDocumentResult
>(
  {
    action: 'UPLOAD',
    resource: 'de-an',
    resourceIdFromResult: (r) => r?.attachmentId ?? null,
    captureAfter: (r) => ({
      attachmentId: r.attachmentId,
      fileName: r.fileName,
      category: r.category,
    }),
  },
  uploadProjectDocumentImpl,
);

// =============================================================================
// Delete document
// =============================================================================

const attachmentIdSchema = z
  .string()
  .min(1, 'Mã tài liệu không hợp lệ')
  .max(64, 'Mã tài liệu không hợp lệ')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Mã tài liệu không hợp lệ');

export type DeleteProjectDocumentResult = { attachmentId: string };

async function deleteProjectDocumentImpl(
  attachmentId: string,
): Promise<DeleteProjectDocumentResult> {
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
    throw new Error(
      idParse.error.issues[0]?.message ?? 'Mã tài liệu không hợp lệ',
    );
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: idParse.data },
  });
  if (!attachment) {
    throw new Error('Không tìm thấy tài liệu');
  }
  if (attachment.entityType !== 'Project') {
    throw new Error('Loại tài liệu không hợp lệ cho thao tác này');
  }

  const project = await prisma.project.findUnique({
    where: { id: attachment.entityId },
    select: { organizationId: true, status: true },
  });
  if (!project || project.organizationId !== orgId) {
    throw new Error('Bạn không có quyền xóa tài liệu này');
  }
  if (
    project.status !== 'DRAFT' &&
    project.status !== 'SUPPLEMENT_REQUIRED' &&
    project.status !== 'TENTATIVE'
  ) {
    throw new Error('Đề án ở trạng thái này không thể xóa tài liệu');
  }

  await prisma.attachment.delete({ where: { id: idParse.data } });

  revalidatePath(`/de-an/${attachment.entityId}`);

  return { attachmentId: idParse.data };
}

export const deleteProjectDocument = withAuditLog<
  [string],
  DeleteProjectDocumentResult
>(
  {
    action: 'DELETE',
    resource: 'de-an',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({ attachmentId: r.attachmentId }),
  },
  deleteProjectDocumentImpl,
);
