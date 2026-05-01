// Seed mock inbox notifications cho mock users — Phase 10 Plan 10-01.
// Cover all 6 phase-10 types (NEW_PROJECT, ASSIGNED, SUPPLEMENT_REQUEST,
// APPROVAL_RESULT, SLA_WARNING, GENERAL) + mix read/unread.
//
// Idempotent: skip if user has any USER-recipientType dispatch already.

import { PrismaClient } from '@prisma/client';
import { daysAgo } from '../../lib/date';
import { logSeedStep } from './helpers';

type NotifSpec = {
  type: string;
  subject: string;
  content: string;
  sentDaysAgo: number;
  read: boolean;
  projectCode?: string;
};

// 16-18 mock notifications spread across users + types + read states.
const TEMPLATES_BY_USERNAME: Record<string, NotifSpec[]> = {
  banql: [
    {
      type: 'NEW_PROJECT',
      subject: 'Đề án mới từ XTTM-2026-005',
      content:
        '<p>Có đề án mới được nộp: <strong>Tham gia Hội chợ Quốc tế Texworld 2026 tại Paris</strong> (mã XTTM-2026-005).</p>',
      sentDaysAgo: 2,
      read: false,
      projectCode: 'XTTM-2026-005',
    },
    {
      type: 'NEW_PROJECT',
      subject: 'Đề án mới từ XTTM-2026-004',
      content:
        '<p>Có đề án mới được nộp: <strong>Đoàn ra xúc tiến thương mại tại Hoa Kỳ</strong> (mã XTTM-2026-004).</p>',
      sentDaysAgo: 5,
      read: false,
    },
    {
      type: 'SLA_WARNING',
      subject: 'Cảnh báo: 1 hợp đồng quá hạn ký 60 ngày',
      content:
        '<p>Có 1 đề án đã được phê duyệt hơn 60 ngày nhưng vẫn chưa ký hợp đồng. Vui lòng theo dõi và đôn đốc đơn vị chủ trì.</p>',
      sentDaysAgo: 1,
      read: false,
    },
    {
      type: 'SLA_WARNING',
      subject: 'Cảnh báo: 1 báo cáo quá hạn 18 ngày',
      content:
        '<p>Có 1 đề án đã kết thúc hoạt động hơn 15 ngày nhưng đơn vị chủ trì chưa nộp báo cáo tổng hợp.</p>',
      sentDaysAgo: 3,
      read: true,
    },
    {
      type: 'GENERAL',
      subject: 'Lịch họp Hội đồng thẩm định đợt 2/2026',
      content:
        '<p>Cuộc họp Hội đồng thẩm định đợt 2 năm 2026 sẽ diễn ra vào 14h ngày 15/05/2026 tại phòng họp lớn Cục XTTM.</p>',
      sentDaysAgo: 7,
      read: true,
    },
  ],
  chuyenvien: [
    {
      type: 'ASSIGNED',
      subject: 'Bạn được phân công kiểm tra: XTTM-2026-005',
      content:
        '<p>Bạn được phân công kiểm tra hồ sơ đề án: <strong>Tham gia Hội chợ Quốc tế Texworld 2026 tại Paris</strong> (mã XTTM-2026-005).</p><p>Vui lòng truy cập trang Kiểm tra hồ sơ để bắt đầu công việc.</p>',
      sentDaysAgo: 1,
      read: false,
    },
    {
      type: 'ASSIGNED',
      subject: 'Bạn được phân công kiểm tra: XTTM-2026-004',
      content:
        '<p>Bạn được phân công kiểm tra hồ sơ đề án: <strong>Đoàn ra xúc tiến thương mại tại Hoa Kỳ</strong> (mã XTTM-2026-004).</p>',
      sentDaysAgo: 4,
      read: true,
    },
    {
      type: 'GENERAL',
      subject: 'Thông tin: Quy trình kiểm tra hồ sơ cập nhật',
      content:
        '<p>Bộ tiêu chí kiểm tra hồ sơ đã được cập nhật. Vui lòng tham khảo tài liệu mới nhất tại trang Danh mục.</p>',
      sentDaysAgo: 10,
      read: true,
    },
  ],
  donvi1: [
    {
      type: 'SUPPLEMENT_REQUEST',
      subject: 'Yêu cầu bổ sung hồ sơ: XTTM-2026-002',
      content:
        '<p>Hồ sơ <strong>Triển lãm Da giày Quốc tế lần thứ 24</strong> (XTTM-2026-002) cần được bổ sung.</p><p><strong>Nội dung yêu cầu:</strong></p><blockquote>Vui lòng bổ sung hồ sơ năng lực đơn vị, danh sách doanh nghiệp tham gia, và kế hoạch chi tiết về địa điểm tổ chức.</blockquote>',
      sentDaysAgo: 6,
      read: false,
    },
    {
      type: 'APPROVAL_RESULT',
      subject: 'Kết quả phê duyệt đề án XTTM-2026-001',
      content:
        '<p>Đề án <strong>Hội chợ XK ngành Da giày 2026</strong> (XTTM-2026-001) đã được phê duyệt với kinh phí 1.800.000.000 đồng.</p><p>Vui lòng tiến hành ký hợp đồng trong vòng 60 ngày kể từ ngày phê duyệt.</p>',
      sentDaysAgo: 14,
      read: true,
    },
    {
      type: 'GENERAL',
      subject: 'Hướng dẫn: Quy trình triển khai đề án sau ký HĐ',
      content:
        '<p>Sau khi ký hợp đồng, vui lòng liên hệ Thương vụ Việt Nam tại nước sở tại trước thời điểm sự kiện ít nhất 30 ngày để đảm bảo công tác hỗ trợ ngoại giao.</p>',
      sentDaysAgo: 12,
      read: true,
    },
  ],
  donvi2: [
    {
      type: 'APPROVAL_RESULT',
      subject: 'Kết quả phê duyệt đề án XTTM-2026-003',
      content:
        '<p>Đề án <strong>Hội nghị Quốc tế Dệt may 2026</strong> (XTTM-2026-003) đã được phê duyệt.</p>',
      sentDaysAgo: 10,
      read: false,
    },
    {
      type: 'SUPPLEMENT_REQUEST',
      subject: 'Yêu cầu bổ sung: dự toán chi tiết',
      content:
        '<p>Đề án dự toán cần bổ sung chi tiết các khoản mục về thuê gian hàng, in ấn brochure, và chi phí đoàn doanh nghiệp đi cùng.</p>',
      sentDaysAgo: 8,
      read: true,
    },
    {
      type: 'GENERAL',
      subject: 'Thông báo về cổng đăng ký 2026',
      content:
        '<p>Cổng đăng ký đề án XTTM năm 2026 đã mở. Hạn nộp hồ sơ: 30/05/2026.</p>',
      sentDaysAgo: 27,
      read: true,
    },
  ],
  hoidong: [
    {
      type: 'GENERAL',
      subject: 'Lịch họp Hội đồng thẩm định đợt 2/2026',
      content:
        '<p>Cuộc họp Hội đồng thẩm định đợt 2 năm 2026 sẽ diễn ra vào 14h ngày 15/05/2026.</p>',
      sentDaysAgo: 7,
      read: false,
    },
    {
      type: 'GENERAL',
      subject: 'Đã có 12 đề án chờ thẩm định',
      content:
        '<p>Có 12 đề án đã chuyển sang trạng thái thẩm định. Vui lòng đăng nhập để chấm điểm.</p>',
      sentDaysAgo: 5,
      read: true,
    },
  ],
  taichinh: [
    {
      type: 'GENERAL',
      subject: 'Yêu cầu xử lý 3 hồ sơ tạm ứng mới',
      content:
        '<p>Có 3 hồ sơ tạm ứng đã được Ban quản lý phê duyệt và chờ Tài chính chi trả.</p>',
      sentDaysAgo: 2,
      read: false,
    },
    {
      type: 'GENERAL',
      subject: 'Báo cáo tài chính tháng đã được duyệt',
      content:
        '<p>Báo cáo tài chính tháng 04/2026 đã được Lãnh đạo Cục phê duyệt.</p>',
      sentDaysAgo: 9,
      read: true,
    },
  ],
  lanhdao: [
    {
      type: 'GENERAL',
      subject: 'Tờ trình mới chờ phê duyệt',
      content:
        '<p>Có 1 tờ trình mới của Cục XTTM gửi Bộ về việc phê duyệt 5 đề án XTTM năm 2026.</p>',
      sentDaysAgo: 3,
      read: false,
    },
    {
      type: 'SLA_WARNING',
      subject: 'Cảnh báo: 1 đề án quốc tế chưa liên hệ thương vụ',
      content:
        '<p>Có 1 đề án quốc tế còn dưới 30 ngày tới sự kiện nhưng chưa liên hệ Thương vụ Việt Nam tại nước sở tại.</p>',
      sentDaysAgo: 1,
      read: false,
    },
  ],
};

export async function seedInboxNotifications(
  prisma: PrismaClient,
): Promise<{ notifications: number; dispatches: number }> {
  // Look up users by username
  const users = await prisma.user.findMany({
    where: { username: { in: Object.keys(TEMPLATES_BY_USERNAME) } },
    select: { id: true, username: true },
  });
  const userIdByUsername = new Map(users.map((u) => [u.username, u.id]));

  // Lookup banql user as createdById fallback
  const banqlId = userIdByUsername.get('banql');
  if (!banqlId) {
    console.warn(
      '[seedInboxNotifications] banql user not found, skipping inbox seed',
    );
    return { notifications: 0, dispatches: 0 };
  }

  // Idempotent: count existing USER-targeted dispatches for these users.
  // If non-zero, skip — already seeded.
  const existingDispatchCount = await prisma.notificationDispatch.count({
    where: {
      recipientUserId: {
        in: users.map((u) => u.id),
      },
    },
  });
  if (existingDispatchCount >= 16) {
    logSeedStep(
      `InboxNotifications (skipped — already ${existingDispatchCount})`,
      0,
    );
    return { notifications: 0, dispatches: existingDispatchCount };
  }

  // Lookup project IDs by code (best-effort — not all templates reference projects)
  const allProjectCodes = new Set<string>();
  for (const specs of Object.values(TEMPLATES_BY_USERNAME)) {
    for (const s of specs) {
      if (s.projectCode) allProjectCodes.add(s.projectCode);
    }
  }
  const projects =
    allProjectCodes.size > 0
      ? await prisma.project.findMany({
          where: { code: { in: Array.from(allProjectCodes) } },
          select: { id: true, code: true },
        })
      : [];
  const projectIdByCode = new Map(projects.map((p) => [p.code, p.id]));

  let notifCount = 0;
  let dispatchCount = 0;

  for (const [username, specs] of Object.entries(TEMPLATES_BY_USERNAME)) {
    const userId = userIdByUsername.get(username);
    if (!userId) continue;

    for (const spec of specs) {
      const sentAt = daysAgo(spec.sentDaysAgo);
      const readAt = spec.read
        ? daysAgo(Math.max(0, spec.sentDaysAgo - 1))
        : null;
      const projectId = spec.projectCode
        ? (projectIdByCode.get(spec.projectCode) ?? null)
        : null;

      const notification = await prisma.notification.create({
        data: {
          type: spec.type,
          subject: spec.subject,
          content: spec.content,
          recipientType: 'USER',
          createdById: banqlId,
          createdAt: sentAt,
          projectId,
        },
      });
      notifCount++;

      await prisma.notificationDispatch.create({
        data: {
          notificationId: notification.id,
          recipientUserId: userId,
          status: spec.read ? 'READ' : 'SENT',
          sentAt,
          readAt,
        },
      });
      dispatchCount++;
    }
  }

  logSeedStep(
    `InboxNotifications (${notifCount} notif / ${dispatchCount} dispatches)`,
    notifCount,
  );

  return { notifications: notifCount, dispatches: dispatchCount };
}
