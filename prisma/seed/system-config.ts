// SystemConfig seed — Plan 02-07
// Idempotent upsert: 1 SLA params row + 5 email templates + 3 SMS templates = 9 rows total.
// Patterns:
//   - sla.params → JSON of SLA_THRESHOLDS shape
//   - email.template.{KEY} → JSON {subject, honorific, bodyHtml}
//   - sms.template.{KEY} → JSON {body}
// Phase 3+ read these via lib/system-config.ts cached helpers.

import type { PrismaClient } from '@prisma/client';
import { SLA_THRESHOLDS } from '../../lib/constants';
import { logSeedStep } from './helpers';

// -----------------------------------------------------------------------------
// Email templates — 5 defaults
// -----------------------------------------------------------------------------

type EmailTemplate = {
  subject: string;
  honorific: string;
  bodyHtml: string;
};

const EMAIL_DEFAULTS: Record<string, EmailTemplate> = {
  INVITE_REGISTRATION: {
    subject: 'Mời tham gia Chương trình XTTM Quốc gia năm {{namKy}}',
    honorific: 'KINH_GUI_QUY_DON_VI',
    bodyHtml: [
      '<p>{{honorific}},</p>',
      '<p>Cục Xúc tiến Thương mại — Bộ Công Thương trân trọng thông báo:</p>',
      '<p>Chương trình Xúc tiến Thương mại Quốc gia năm {{namKy}} chính thức mở cổng nhận đăng ký đề án từ ngày {{ngayMo}} đến hết ngày {{hanNopDeAn}}.</p>',
      '<p>Kính đề nghị Quý đơn vị nghiên cứu và lập đề án đăng ký theo các tiêu chí và biểu mẫu đã được công bố tại Cổng thông tin Cục Xúc tiến Thương mại.</p>',
      '<p>Mọi vướng mắc trong quá trình đăng ký, đề nghị Quý đơn vị liên hệ Ban quản lý Chương trình XTTM để được hướng dẫn.</p>',
      '<p>Trân trọng,<br>Cục Xúc tiến Thương mại</p>',
    ].join('\n'),
  },
  APPROVAL_RESULT: {
    subject: 'Thông báo kết quả phê duyệt đề án {{tenDeAn}}',
    honorific: 'KINH_GUI_QUY_DON_VI',
    bodyHtml: [
      '<p>{{honorific}},</p>',
      '<p>Căn cứ Quyết định số {{soQuyetDinh}} ngày {{ngayKy}} của {{nguoiKy}}, Cục Xúc tiến Thương mại trân trọng thông báo kết quả phê duyệt đối với đề án <strong>{{tenDeAn}}</strong> do {{tenDonVi}} đề xuất.</p>',
      '<p>Đề nghị Quý đơn vị phối hợp với Ban quản lý Chương trình XTTM hoàn tất các thủ tục ký kết hợp đồng và triển khai thực hiện theo đúng nội dung được phê duyệt.</p>',
      '<p>Trân trọng,<br>Cục Xúc tiến Thương mại</p>',
    ].join('\n'),
  },
  SUPPLEMENT_REQUIRED: {
    subject: 'Yêu cầu bổ sung hồ sơ đề án {{tenDeAn}}',
    honorific: 'KINH_GUI_QUY_DON_VI',
    bodyHtml: [
      '<p>{{honorific}},</p>',
      '<p>Sau khi xem xét hồ sơ đề án <strong>{{tenDeAn}}</strong> do {{tenDonVi}} đề xuất, Ban quản lý Chương trình XTTM nhận thấy hồ sơ cần được bổ sung, hoàn thiện thêm một số nội dung trước khi đưa vào thẩm định chính thức.</p>',
      '<p>Đề nghị Quý đơn vị rà soát và bổ sung hồ sơ theo nội dung yêu cầu và nộp lại trên Cổng thông tin trước ngày {{hanNopDeAn}}.</p>',
      '<p>Trân trọng,<br>Cục Xúc tiến Thương mại</p>',
    ].join('\n'),
  },
  SLA_WARNING: {
    subject: 'Cảnh báo: {{loaiCanhBao}} đối với đề án {{tenDeAn}}',
    honorific: 'KINH_GUI_QUY_DON_VI',
    bodyHtml: [
      '<p>{{honorific}},</p>',
      '<p>Hệ thống ghi nhận đề án <strong>{{tenDeAn}}</strong> đang ở mức cảnh báo: <em>{{loaiCanhBao}}</em> (ngày phát sinh: {{ngayCanhBao}}).</p>',
      '<p>Đề nghị Quý đơn vị khẩn trương hoàn tất nghĩa vụ liên quan để bảo đảm tiến độ Chương trình. Trường hợp đã hoàn thành, đề nghị cập nhật trạng thái trên hệ thống.</p>',
      '<p>Trân trọng,<br>Cục Xúc tiến Thương mại</p>',
    ].join('\n'),
  },
  CONTRACT_REMINDER: {
    subject: 'Nhắc ký hợp đồng thực hiện đề án {{tenDeAn}}',
    honorific: 'KINH_GUI_QUY_DON_VI',
    bodyHtml: [
      '<p>{{honorific}},</p>',
      '<p>Căn cứ Quyết định phê duyệt số {{soQuyetDinh}} ngày {{ngayKy}}, đề án <strong>{{tenDeAn}}</strong> đã được phê duyệt nhưng chưa hoàn tất thủ tục ký hợp đồng số {{soHopDong}}.</p>',
      '<p>Đề nghị Quý đơn vị liên hệ Ban quản lý Chương trình XTTM để hoàn tất việc ký kết hợp đồng theo đúng quy định, tránh ảnh hưởng đến tiến độ giải ngân và triển khai.</p>',
      '<p>Trân trọng,<br>Cục Xúc tiến Thương mại</p>',
    ].join('\n'),
  },
};

const EMAIL_LABELS: Record<string, string> = {
  INVITE_REGISTRATION: 'Mời đăng ký đề án',
  APPROVAL_RESULT: 'Kết quả phê duyệt',
  SUPPLEMENT_REQUIRED: 'Yêu cầu bổ sung hồ sơ',
  SLA_WARNING: 'Cảnh báo SLA',
  CONTRACT_REMINDER: 'Nhắc ký hợp đồng',
};

// -----------------------------------------------------------------------------
// SMS templates — 3 defaults (no diacritics — branded SMS gateway convention)
// -----------------------------------------------------------------------------

const SMS_DEFAULTS: Record<string, string> = {
  INVITE_REGISTRATION:
    'Cuc XTTM moi Quy don vi dang ky de an XTTMQG nam {{namKy}}. Han nop: {{hanNopDeAn}}. Chi tiet tai cong thong tin Cuc XTTM.',
  SLA_WARNING:
    'Canh bao: De an {{tenDeAn}} dang chua hoan thanh nghia vu {{loaiCanhBao}}. Vui long lien he Cuc XTTM som.',
  APPROVAL_RESULT:
    'De an {{tenDeAn}} cua Quy don vi da duoc phe duyet. Vui long kiem tra email de xem chi tiet quyet dinh phe duyet.',
};

const SMS_LABELS: Record<string, string> = {
  INVITE_REGISTRATION: 'Mời đăng ký (SMS)',
  SLA_WARNING: 'Cảnh báo SLA (SMS)',
  APPROVAL_RESULT: 'Kết quả phê duyệt (SMS)',
};

// -----------------------------------------------------------------------------
// Seed function
// -----------------------------------------------------------------------------

export async function seedSystemConfig(prisma: PrismaClient): Promise<void> {
  // SLA params — 1 row
  const slaJson = JSON.stringify(SLA_THRESHOLDS);
  await prisma.systemConfig.upsert({
    where: { key: 'sla.params' },
    update: { valueJson: slaJson, label: 'Tham số cảnh báo SLA' },
    create: {
      key: 'sla.params',
      valueJson: slaJson,
      category: 'SLA',
      label: 'Tham số cảnh báo SLA',
    },
  });

  // Email templates — 5 rows
  for (const [k, v] of Object.entries(EMAIL_DEFAULTS)) {
    const valueJson = JSON.stringify(v);
    await prisma.systemConfig.upsert({
      where: { key: `email.template.${k}` },
      update: { valueJson, label: EMAIL_LABELS[k] ?? k },
      create: {
        key: `email.template.${k}`,
        valueJson,
        category: 'EMAIL',
        label: EMAIL_LABELS[k] ?? k,
      },
    });
  }

  // SMS templates — 3 rows
  for (const [k, body] of Object.entries(SMS_DEFAULTS)) {
    const valueJson = JSON.stringify({ body });
    await prisma.systemConfig.upsert({
      where: { key: `sms.template.${k}` },
      update: { valueJson, label: SMS_LABELS[k] ?? k },
      create: {
        key: `sms.template.${k}`,
        valueJson,
        category: 'SMS',
        label: SMS_LABELS[k] ?? k,
      },
    });
  }

  const total = await prisma.systemConfig.count();
  logSeedStep('SystemConfig', total);
}
