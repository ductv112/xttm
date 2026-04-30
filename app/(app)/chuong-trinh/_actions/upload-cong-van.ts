'use server';

// uploadCongVan — CYCLE-07 upload công văn ban hành PDF + Attachment metadata + link tới ProgramCycle.
// Triple validation (T-03-03-03): file.type === application/pdf, size ≤ 10MB, magic byte 0x25504446 ("%PDF-").
// Path safety (T-03-03-05): storedFileName = randomUUID() + .pdf — original filename only stored in DB.
// cycleId is sanity-checked via Zod min length to mitigate path traversal in dirPath.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, sep, posix } from 'node:path';
import { randomUUID } from 'node:crypto';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { withAuditLog } from '@/lib/audit';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

// Allow only safe cuid/cuid2-like ids (alphanum + - + _) — defense-in-depth even though
// caller normally passes a Prisma-generated cuid.
const cycleIdSchema = z
  .string()
  .min(1, 'Mã chu kỳ không hợp lệ')
  .max(64, 'Mã chu kỳ không hợp lệ')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Mã chu kỳ không hợp lệ');

// Internal schema (NOT exported — 'use server' module rule).
const uploadCongVanMetadataSchemaInternal = z.object({
  signedNumber: z
    .string({ message: 'Vui lòng nhập số công văn' })
    .trim()
    .min(1, 'Số công văn không được để trống')
    .max(100, 'Số công văn tối đa 100 ký tự'),
  signedDate: z
    .date({ message: 'Vui lòng chọn ngày ký công văn' })
    .refine((d) => d.getTime() <= Date.now(), 'Ngày ký phải nhỏ hơn hoặc bằng ngày hôm nay'),
  signedByName: z
    .string({ message: 'Vui lòng nhập họ tên người ký' })
    .trim()
    .min(2, 'Họ tên người ký tối thiểu 2 ký tự')
    .max(200, 'Họ tên người ký tối đa 200 ký tự'),
  signedByTitle: z
    .string({ message: 'Vui lòng nhập chức vụ người ký' })
    .trim()
    .min(2, 'Chức vụ tối thiểu 2 ký tự')
    .max(200, 'Chức vụ tối đa 200 ký tự'),
});

export type UploadCongVanResult = {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  signedNumber: string;
};

function parseDateField(raw: FormDataEntryValue | null): Date | null {
  if (!raw || typeof raw !== 'string') return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function uploadCongVanImpl(
  cycleId: string,
  formData: FormData,
): Promise<UploadCongVanResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!(await canFromDB(session.user.role, 'chuong-trinh', 'update'))) {
    throw new Error('Bạn không có quyền tải lên công văn');
  }

  // Validate cycleId for path safety
  const cycleIdParse = cycleIdSchema.safeParse(cycleId);
  if (!cycleIdParse.success) {
    throw new Error('Mã chu kỳ không hợp lệ');
  }
  const safeCycleId = cycleIdParse.data;

  // Confirm cycle exists
  const cycle = await prisma.programCycle.findUnique({ where: { id: safeCycleId } });
  if (!cycle) {
    throw new Error('Không tìm thấy chu kỳ chương trình');
  }

  // Extract file
  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') {
    throw new Error('Vui lòng chọn tệp công văn');
  }
  const file = fileEntry as File;

  // MIME check
  if (file.type !== 'application/pdf') {
    throw new Error('Chỉ chấp nhận tệp định dạng PDF');
  }
  // Size check
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Tệp vượt quá kích thước cho phép 10MB');
  }
  if (file.size === 0) {
    throw new Error('Tệp không hợp lệ — kích thước rỗng');
  }

  // Read bytes + magic byte check
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < PDF_MAGIC.length || !buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    throw new Error('Tệp không hợp lệ — không phải PDF thực');
  }

  // Validate metadata
  const metadataInput = {
    signedNumber: (formData.get('signedNumber') as string | null) ?? '',
    signedDate: parseDateField(formData.get('signedDate')),
    signedByName: (formData.get('signedByName') as string | null) ?? '',
    signedByTitle: (formData.get('signedByTitle') as string | null) ?? '',
  };
  const metaResult = uploadCongVanMetadataSchemaInternal.safeParse(metadataInput);
  if (!metaResult.success) {
    const first = metaResult.error.issues[0];
    throw new Error('Dữ liệu không hợp lệ: ' + (first?.message ?? 'lỗi không xác định'));
  }
  const meta = metaResult.data;

  // Build paths — UUID filename, NEVER use original (T-03-03-05)
  const storedFileName = `${randomUUID()}.pdf`;
  const dirPathFs = join(process.cwd(), 'storage', 'uploads', 'cong-van', safeCycleId);
  await mkdir(dirPathFs, { recursive: true });
  const filePathFs = join(dirPathFs, storedFileName);
  await writeFile(filePathFs, buffer);

  // Public/portable fileUrl uses POSIX separators
  const fileUrl = posix.join('storage', 'uploads', 'cong-van', safeCycleId, storedFileName);

  // Transactional create Attachment + link cycle
  const created = await prisma.$transaction(async (tx) => {
    const attachment = await tx.attachment.create({
      data: {
        entityType: 'ProgramCycle',
        entityId: safeCycleId,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: 'application/pdf',
        signedNumber: meta.signedNumber,
        signedDate: meta.signedDate,
        signedByName: meta.signedByName,
        signedByTitle: meta.signedByTitle,
        uploadedById: session.user.id,
      },
    });
    await tx.programCycle.update({
      where: { id: safeCycleId },
      data: { invitationLetterAttachmentId: attachment.id },
    });
    return attachment;
  });

  revalidatePath('/chuong-trinh/' + safeCycleId);

  // sep is referenced to keep import working on win32 path conventions if needed downstream
  void sep;

  return {
    attachmentId: created.id,
    fileName: file.name,
    fileUrl,
    signedNumber: meta.signedNumber,
  };
}

export const uploadCongVan = withAuditLog<[string, FormData], UploadCongVanResult>(
  {
    action: 'UPLOAD',
    resource: 'chuong-trinh',
    resourceIdFromArgs: ([cycleId]) => cycleId,
    captureAfter: (r) => ({
      attachmentId: r.attachmentId,
      fileName: r.fileName,
      signedNumber: r.signedNumber,
    }),
  },
  uploadCongVanImpl,
);
