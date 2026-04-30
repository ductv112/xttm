// Seed 2 mock dispatch histories cho cycle 2025 + cycle 2026.
// Cycle 2025 lịch sử: 1 invitation, 5 dispatches all READ
// Cycle 2026 hiện tại: 1 invitation, 5 dispatches mix (3 READ + 2 SENT)
//
// Idempotent qua check existing notification by { programCycleId, subject } trước khi insert.

import { PrismaClient } from '@prisma/client';
import { daysAgo } from '../../lib/date';
import { logSeedStep } from './helpers';

const INVITED_CODES = ['VITAS', 'LEFASO', 'VINATEX', 'VASEP', 'VCCI'] as const;
type OrgCode = (typeof INVITED_CODES)[number];

const CYCLE_2025_HONORIFIC = `<p>Kính gửi Quý đơn vị,</p>
<p>Cục Xúc tiến Thương mại (Bộ Công Thương) trân trọng kính mời Quý đơn vị tham gia đăng ký đề án thuộc Chương trình cấp Quốc gia về Xúc tiến Thương mại năm 2025.</p>
<p>Hạn nộp hồ sơ: 30/5/2025. Hồ sơ nộp qua Hệ thống XTTMQG.</p>
<p>Trân trọng,<br/>Cục Xúc tiến Thương mại</p>`;

const CYCLE_2026_HONORIFIC = `<p>Kính gửi Quý đơn vị,</p>
<p>Cục Xúc tiến Thương mại (Bộ Công Thương) trân trọng kính mời Quý đơn vị tham gia đăng ký đề án thuộc Chương trình cấp Quốc gia về Xúc tiến Thương mại năm 2026.</p>
<p>Hạn nộp hồ sơ: 30/5/2026. Hồ sơ nộp qua Hệ thống XTTMQG. Trường hợp cần hỗ trợ, vui lòng liên hệ Cục XTTM.</p>
<p>Trân trọng,<br/>Cục Xúc tiến Thương mại</p>`;

async function resolveOrgIdMap(
  prisma: PrismaClient,
): Promise<Record<OrgCode, string>> {
  const orgs = await prisma.organization.findMany({
    where: { code: { in: [...INVITED_CODES] } },
    select: { id: true, code: true },
  });
  const map: Partial<Record<OrgCode, string>> = {};
  for (const o of orgs) map[o.code as OrgCode] = o.id;
  for (const c of INVITED_CODES) {
    if (!map[c]) {
      throw new Error(`[seedCycleNotifications] Missing organization with code ${c}`);
    }
  }
  return map as Record<OrgCode, string>;
}

export async function seedCycleNotifications(
  prisma: PrismaClient,
  cycleIds: { cycle2025Id: string; cycle2026Id: string },
  banqlUserId: string,
): Promise<{ notifications: number; dispatches: number }> {
  const orgIdMap = await resolveOrgIdMap(prisma);

  // ===========================================================================
  // Cycle 2025 historical invitation — all 5 READ
  // ===========================================================================
  const subject2025 = 'Mời tham gia Chương trình XTTM Quốc gia 2025';
  let notif2025 = await prisma.notification.findFirst({
    where: { programCycleId: cycleIds.cycle2025Id, subject: subject2025 },
  });
  if (!notif2025) {
    notif2025 = await prisma.notification.create({
      data: {
        programCycleId: cycleIds.cycle2025Id,
        type: 'CYCLE_INVITATION',
        subject: subject2025,
        content: CYCLE_2025_HONORIFIC,
        recipientType: 'ORGANIZATION',
        createdById: banqlUserId,
        createdAt: new Date(2025, 2, 2), // 2/3/2025
      },
    });
    const sentAt2025 = new Date(2025, 2, 2, 9, 30);
    const readAt2025 = new Date(2025, 2, 2, 14, 15);
    await prisma.notificationDispatch.createMany({
      data: INVITED_CODES.map((code) => ({
        notificationId: notif2025!.id,
        recipientOrgId: orgIdMap[code],
        status: 'READ',
        sentAt: sentAt2025,
        readAt: readAt2025,
      })),
    });
  }

  // ===========================================================================
  // Cycle 2026 current invitation — 3 READ (LEFASO/VITAS/VINATEX) + 2 SENT (VASEP/VCCI)
  // ===========================================================================
  const subject2026 = 'Mời tham gia Chương trình XTTM Quốc gia 2026 — Hạn nộp 30/05/2026';
  let notif2026 = await prisma.notification.findFirst({
    where: { programCycleId: cycleIds.cycle2026Id, subject: subject2026 },
  });
  if (!notif2026) {
    notif2026 = await prisma.notification.create({
      data: {
        programCycleId: cycleIds.cycle2026Id,
        type: 'CYCLE_INVITATION',
        subject: subject2026,
        content: CYCLE_2026_HONORIFIC,
        recipientType: 'ORGANIZATION',
        createdById: banqlUserId,
        createdAt: daysAgo(27),
      },
    });
    const sentAt2026 = daysAgo(27);
    const readDispatches: Array<{ code: OrgCode; readAt: Date }> = [
      { code: 'LEFASO', readAt: daysAgo(26) },
      { code: 'VITAS', readAt: daysAgo(25) },
      { code: 'VINATEX', readAt: daysAgo(20) },
    ];
    const sentOnly: OrgCode[] = ['VASEP', 'VCCI'];

    await prisma.notificationDispatch.createMany({
      data: [
        ...readDispatches.map(({ code, readAt }) => ({
          notificationId: notif2026!.id,
          recipientOrgId: orgIdMap[code],
          status: 'READ' as const,
          sentAt: sentAt2026,
          readAt,
        })),
        ...sentOnly.map((code) => ({
          notificationId: notif2026!.id,
          recipientOrgId: orgIdMap[code],
          status: 'SENT' as const,
          sentAt: sentAt2026,
          readAt: null,
        })),
      ],
    });
  }

  const totalNotif = await prisma.notification.count({
    where: {
      programCycleId: { in: [cycleIds.cycle2025Id, cycleIds.cycle2026Id] },
    },
  });
  const totalDispatch = await prisma.notificationDispatch.count({
    where: {
      notification: {
        programCycleId: { in: [cycleIds.cycle2025Id, cycleIds.cycle2026Id] },
      },
    },
  });

  logSeedStep(`CycleNotifications (${totalNotif} notif / ${totalDispatch} dispatches)`, totalNotif);

  return { notifications: totalNotif, dispatches: totalDispatch };
}
