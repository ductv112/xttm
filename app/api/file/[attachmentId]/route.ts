// /api/file/[attachmentId] — auth-gated file serve from storage/uploads/.
// Plan 03-06 CYCLE-07 supporting infra. Threat model T-03-06-01 (info disclosure) +
// T-03-06-02 (path traversal) mitigations:
//   - auth() session check throws 401 if no user
//   - Attachment record loaded; entity-specific RBAC check (Phase 3 = ProgramCycle → 'chuong-trinh':'read')
//   - File path resolved against cwd + 'storage/uploads/'; verified path stays within base via prefix check
//   - Reads file via fs.readFile then returns ArrayBuffer Response with Content-Type from attachment.mimeType
//
// Edge cases:
//   - attachment row missing → 404 with VN message
//   - attachmentId fails Zod (alphanum + - + _) → 400
//   - File missing on disk → 404 'Tệp không tồn tại trên hệ thống'
//   - fileUrl contains traversal sequence → 400 'Đường dẫn tệp không hợp lệ'

import { NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

const attachmentIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/);

function resolveResourceForEntity(entityType: string): string | null {
  switch (entityType) {
    case 'ProgramCycle':
      return 'chuong-trinh';
    // Phase 4+ entity types added here
    default:
      return null;
  }
}

function vnError(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return vnError('Yêu cầu đăng nhập', 401);
  }

  const { attachmentId } = await context.params;
  const idCheck = attachmentIdSchema.safeParse(attachmentId);
  if (!idCheck.success) {
    return vnError('Mã tệp không hợp lệ', 400);
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: idCheck.data },
  });
  if (!attachment) {
    return vnError('Không tìm thấy tệp', 404);
  }

  // Entity-specific RBAC: only ProgramCycle handled in Phase 3.
  // Phase 4+ extends switch in resolveResourceForEntity.
  const resource = resolveResourceForEntity(attachment.entityType);
  if (!resource) {
    return vnError('Không hỗ trợ loại tệp này', 403);
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, resource as never, 'read'))) {
    return vnError('Bạn không có quyền xem tệp này', 403);
  }

  // Path safety (T-03-06-02): resolve against cwd + storage/uploads;
  // require resolved path to start with the base dir.
  const baseDir = path.join(process.cwd(), 'storage', 'uploads');

  // attachment.fileUrl đã được upload action lưu dạng "storage/uploads/.../uuid.pdf"
  // (POSIX style) — we strip the leading "storage/uploads/" để build path tương đối, sau đó
  // resolve against baseDir để chặn traversal.
  let relPart = attachment.fileUrl;
  // Reject obvious path traversal upfront
  if (relPart.includes('..')) {
    return vnError('Đường dẫn tệp không hợp lệ', 400);
  }
  // Normalize separators
  relPart = relPart.replace(/\\/g, '/');
  // Strip "storage/uploads/" prefix if present
  const prefix = 'storage/uploads/';
  if (relPart.startsWith(prefix)) {
    relPart = relPart.slice(prefix.length);
  }

  const absPath = path.resolve(baseDir, relPart);
  const baseDirNormalized = path.resolve(baseDir);
  if (
    absPath !== baseDirNormalized &&
    !absPath.startsWith(baseDirNormalized + path.sep)
  ) {
    return vnError('Đường dẫn tệp không hợp lệ', 400);
  }

  // Verify file exists
  try {
    await stat(absPath);
  } catch {
    return vnError('Tệp không tồn tại trên hệ thống', 404);
  }

  // Read + serve
  const buffer = await readFile(absPath);
  const ab = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;

  // Encode filename for Content-Disposition (RFC 5987 fallback)
  const safeFileName = encodeURIComponent(attachment.fileName);

  return new NextResponse(ab, {
    status: 200,
    headers: {
      'Content-Type': attachment.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename*=UTF-8''${safeFileName}`,
      'Content-Length': String(buffer.byteLength),
      'Cache-Control': 'private, no-store',
    },
  });
}
