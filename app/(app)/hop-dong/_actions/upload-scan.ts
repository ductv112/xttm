'use server';

// uploadContractScan — Phase 8 Plan 08-01 Task 2.
// Upload bản scan PDF hợp đồng đã ký. Mock: lưu file URL vào Contract.scanFileUrl
// + tạo Attachment record. Per CLAUDE.md POC pattern dùng public/mock-files.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { CONTRACT_AUDIT_TYPES } from '@/lib/audit-types';
import type { Role } from '@/lib/constants';

export type UploadScanInput = {
  fileName: string;
  fileUrl: string; // path or url
  fileSize?: number;
  mimeType?: string;
};

export type UploadScanResult =
  | { ok: true; attachmentId: string }
  | { ok: false; error: string };

export async function uploadContractScan(
  contractId: string,
  input: UploadScanInput,
): Promise<UploadScanResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'update'))) {
    return { ok: false, error: 'Bạn không có quyền upload bản scan' };
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) return { ok: false, error: 'Không tìm thấy hợp đồng' };

  const attachment = await prisma.attachment.create({
    data: {
      entityType: 'Contract',
      entityId: contractId,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize ?? null,
      mimeType: input.mimeType ?? 'application/pdf',
      uploadedById: session.user.id,
    },
  });

  await prisma.contract.update({
    where: { id: contractId },
    data: { scanFileUrl: input.fileUrl },
  });

  void logAudit(
    {
      ...CONTRACT_AUDIT_TYPES.CONTRACT_UPLOAD_SCAN,
      resourceId: contractId,
      after: {
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        attachmentId: attachment.id,
      },
    },
    session.user.id,
  );

  revalidatePath(`/hop-dong/${contractId}`);
  return { ok: true, attachmentId: attachment.id };
}
