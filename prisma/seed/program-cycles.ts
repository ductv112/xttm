// Seed 3 ProgramCycles for Phase 3 HERO demo:
//   - 2025: COMPLETED (lịch sử) — fixed dates trong năm 2025
//   - 2026: OPEN_REGISTRATION (HERO demo) — RELATIVE dates via daysAgo / daysFromNow
//                                              (PITFALLS R5 mitigation: tránh hardcoded date)
//   - 2027: DRAFT (chuẩn bị tương lai) — minimal config
//
// Cycle 2026 cũng tạo 1 Attachment kiểu công văn ban hành với metadata đầy đủ
// (signedNumber/signedDate/signedByName/signedByTitle) + link qua invitationLetterAttachmentId.

import { PrismaClient } from '@prisma/client';
import { daysAgo, daysFromNow } from '../../lib/date';
import { logSeedStep } from './helpers';

export type SeededCycleIds = {
  cycle2025Id: string;
  cycle2026Id: string;
  cycle2027Id: string;
};

async function resolveOrgIds(
  prisma: PrismaClient,
  codes: readonly string[],
): Promise<string[]> {
  const orgs = await prisma.organization.findMany({
    where: { code: { in: [...codes] } },
    select: { id: true, code: true },
  });
  return codes
    .map((c) => orgs.find((o) => o.code === c)?.id)
    .filter((id): id is string => Boolean(id));
}

const INVITED_ORG_CODES = ['VITAS', 'LEFASO', 'VINATEX', 'VASEP', 'VCCI'] as const;

export async function seedProgramCycles(
  prisma: PrismaClient,
): Promise<SeededCycleIds> {
  const banqlUser = await prisma.user.findUnique({
    where: { username: 'banql' },
  });
  if (!banqlUser) {
    throw new Error(
      '[seedProgramCycles] User "banql" chưa tồn tại — phải seed users trước (Phase 1 prerequisite)',
    );
  }

  const invitedOrgIds = await resolveOrgIds(prisma, INVITED_ORG_CODES);
  if (invitedOrgIds.length !== INVITED_ORG_CODES.length) {
    throw new Error(
      `[seedProgramCycles] Thiếu organizations cho codes ${INVITED_ORG_CODES.join(',')} — chỉ resolve ${invitedOrgIds.length}/${INVITED_ORG_CODES.length}`,
    );
  }
  const invitedJson = JSON.stringify(invitedOrgIds);

  // ---------------------------------------------------------------------------
  // Cycle 2025 — COMPLETED (lịch sử)
  // ---------------------------------------------------------------------------
  const cycle2025 = await prisma.programCycle.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      name: 'Chương trình XTTM Quốc gia 2025',
      status: 'COMPLETED',
      totalBudget: 85_000_000_000, // 85 tỷ VND
      registrationOpenAt: new Date(2025, 2, 1), // 1/3/2025
      registrationCloseAt: new Date(2025, 4, 30), // 30/5/2025
      supplementDeadline: new Date(2025, 5, 10),
      evaluationStartAt: new Date(2025, 5, 15),
      evaluationEndAt: new Date(2025, 6, 30),
      approvalDeadline: new Date(2025, 7, 15),
      invitedOrganizations: invitedJson,
      createdById: banqlUser.id,
    },
  });

  // ---------------------------------------------------------------------------
  // Cycle 2026 — OPEN_REGISTRATION (HERO demo cycle, relative dates)
  // PITFALLS R5: dùng daysAgo / daysFromNow để banner luôn realistic
  //   registrationOpenAt = 28 ngày trước (đã mở 28 ngày)
  //   registrationCloseAt = 12 ngày tới (banner "còn 12 ngày")
  // ---------------------------------------------------------------------------
  const cycle2026 = await prisma.programCycle.upsert({
    where: { year: 2026 },
    update: {},
    create: {
      year: 2026,
      name: 'Chương trình XTTM Quốc gia 2026',
      status: 'OPEN_REGISTRATION',
      totalBudget: 95_000_000_000, // 95 tỷ VND
      registrationOpenAt: daysAgo(28),
      registrationCloseAt: daysFromNow(12),
      supplementDeadline: daysFromNow(20),
      evaluationStartAt: daysFromNow(15),
      evaluationEndAt: daysFromNow(45),
      approvalDeadline: daysFromNow(60),
      invitedOrganizations: invitedJson,
      createdById: banqlUser.id,
    },
  });

  // Attachment công văn ban hành cho cycle 2026 — 1 record (idempotent: chỉ tạo nếu chưa có)
  let cycle2026Attachment = await prisma.attachment.findFirst({
    where: {
      entityType: 'ProgramCycle',
      entityId: cycle2026.id,
      signedNumber: '1234/CV-XTTM',
    },
  });
  if (!cycle2026Attachment) {
    cycle2026Attachment = await prisma.attachment.create({
      data: {
        entityType: 'ProgramCycle',
        entityId: cycle2026.id,
        fileName: 'cong-van-moi-2026.pdf',
        fileUrl: 'storage/uploads/cong-van/cycle-2026-mock.pdf',
        fileSize: 245_678,
        mimeType: 'application/pdf',
        signedNumber: '1234/CV-XTTM',
        signedDate: daysAgo(35),
        signedByName: 'Bùi Xuân Hồng',
        signedByTitle: 'Cục trưởng Cục XTTM',
        uploadedById: banqlUser.id,
      },
    });
    await prisma.programCycle.update({
      where: { id: cycle2026.id },
      data: { invitationLetterAttachmentId: cycle2026Attachment.id },
    });
  }

  // ---------------------------------------------------------------------------
  // Cycle 2027 — DRAFT (chuẩn bị tương lai, minimal config)
  // ---------------------------------------------------------------------------
  const cycle2027 = await prisma.programCycle.upsert({
    where: { year: 2027 },
    update: {},
    create: {
      year: 2027,
      name: 'Chương trình XTTM Quốc gia 2027',
      status: 'DRAFT',
      totalBudget: null,
      registrationOpenAt: null,
      registrationCloseAt: null,
      supplementDeadline: null,
      evaluationStartAt: null,
      evaluationEndAt: null,
      approvalDeadline: null,
      invitedOrganizations: null,
      createdById: banqlUser.id,
    },
  });

  logSeedStep('ProgramCycles (2025/2026/2027)', 3);

  return {
    cycle2025Id: cycle2025.id,
    cycle2026Id: cycle2026.id,
    cycle2027Id: cycle2027.id,
  };
}
