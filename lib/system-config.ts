// System config helpers — Plan 02-07
// Cached reads (30s TTL) cho:
//   - getSLAThresholds() — SLA params (CONFIG-01)
//   - getEmailTemplate(key) — 5 email templates (CONFIG-02)
//   - getSmsTemplate(key) — 3 SMS templates (CONFIG-02)
//   - getSystemConfig() — aggregate snapshot
//   - invalidateConfigCache() — call sau mutation
// Phase 3+ consume khi compute alert dates / compose notifications.
// Fallback to hardcoded SLA_THRESHOLDS nếu DB read fails (graceful degradation).

import { prisma } from './prisma';
import { SLA_THRESHOLDS } from './constants';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type SLAParams = {
  CONTRACT_DAYS: number;
  REPORT_DAYS: number;
  CONSULATE_DAYS: number;
  REGISTRATION_DEADLINE_MMDD: string;
};

export type EmailTemplate = {
  subject: string;
  honorific: string;
  bodyHtml: string;
};

export type SmsTemplate = {
  body: string;
};

export type SystemConfigSnapshot = {
  sla: SLAParams;
  emailTemplates: Record<string, EmailTemplate>;
  smsTemplates: Record<string, SmsTemplate>;
};

// -----------------------------------------------------------------------------
// Honorific enum + labels (consumed bởi UI form + downstream render)
// -----------------------------------------------------------------------------

export const HONORIFIC_OPTIONS = [
  'KINH_GUI_QUY_DON_VI',
  'KINH_GUI_QUY_ONG',
  'KINH_GUI_QUY_BA',
  'KINH_CHAO_ANH_CHI',
  'TRAN_TRONG_KINH_GUI',
] as const;

export type HonorificKey = (typeof HONORIFIC_OPTIONS)[number];

export const HONORIFIC_LABELS: Record<HonorificKey, string> = {
  KINH_GUI_QUY_DON_VI: 'Kính gửi Quý đơn vị',
  KINH_GUI_QUY_ONG: 'Kính gửi Quý ông',
  KINH_GUI_QUY_BA: 'Kính gửi Quý bà',
  KINH_CHAO_ANH_CHI: 'Kính chào Anh/Chị',
  TRAN_TRONG_KINH_GUI: 'Trân trọng kính gửi',
};

// -----------------------------------------------------------------------------
// Allowed template keys — whitelist defense (T-02-07-02 mass assignment)
// -----------------------------------------------------------------------------

export const EMAIL_TEMPLATE_KEYS = [
  'INVITE_REGISTRATION',
  'APPROVAL_RESULT',
  'SUPPLEMENT_REQUIRED',
  'SLA_WARNING',
  'CONTRACT_REMINDER',
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  INVITE_REGISTRATION: 'Mời đăng ký đề án',
  APPROVAL_RESULT: 'Kết quả phê duyệt',
  SUPPLEMENT_REQUIRED: 'Yêu cầu bổ sung hồ sơ',
  SLA_WARNING: 'Cảnh báo SLA',
  CONTRACT_REMINDER: 'Nhắc ký hợp đồng',
};

export const SMS_TEMPLATE_KEYS = [
  'INVITE_REGISTRATION',
  'SLA_WARNING',
  'APPROVAL_RESULT',
] as const;

export type SmsTemplateKey = (typeof SMS_TEMPLATE_KEYS)[number];

export const SMS_TEMPLATE_LABELS: Record<SmsTemplateKey, string> = {
  INVITE_REGISTRATION: 'Mời đăng ký (SMS)',
  SLA_WARNING: 'Cảnh báo SLA (SMS)',
  APPROVAL_RESULT: 'Kết quả phê duyệt (SMS)',
};

// -----------------------------------------------------------------------------
// In-memory cache (per-process, 30s TTL)
// T-02-07-06 accepted: production cần Redis pub/sub; POC scope OK.
// -----------------------------------------------------------------------------

type Cache = {
  sla?: SLAParams;
  email?: Record<string, EmailTemplate>;
  sms?: Record<string, SmsTemplate>;
  loadedAt?: number;
};

const cache: Cache = {};
const TTL_MS = 30_000;

function isFresh(): boolean {
  return cache.loadedAt !== undefined && Date.now() - cache.loadedAt < TTL_MS;
}

async function loadAll(): Promise<void> {
  try {
    const rows = await prisma.systemConfig.findMany({
      where: { category: { in: ['SLA', 'EMAIL', 'SMS'] } },
    });

    const email: Record<string, EmailTemplate> = {};
    const sms: Record<string, SmsTemplate> = {};
    let sla: SLAParams = { ...SLA_THRESHOLDS };

    for (const row of rows) {
      try {
        const value = JSON.parse(row.valueJson);
        if (row.key === 'sla.params') {
          sla = { ...SLA_THRESHOLDS, ...value };
        } else if (row.key.startsWith('email.template.')) {
          const k = row.key.slice('email.template.'.length);
          email[k] = value as EmailTemplate;
        } else if (row.key.startsWith('sms.template.')) {
          const k = row.key.slice('sms.template.'.length);
          sms[k] = value as SmsTemplate;
        }
      } catch (parseErr) {
        console.error(
          `[system-config] invalid JSON for key=${row.key}, skipping`,
          parseErr,
        );
      }
    }

    cache.sla = sla;
    cache.email = email;
    cache.sms = sms;
    cache.loadedAt = Date.now();
  } catch (err) {
    // Fallback: keep whatever cache we had, otherwise constants
    console.error('[system-config] loadAll failed, using fallback', err);
    if (!cache.sla) cache.sla = { ...SLA_THRESHOLDS };
    if (!cache.email) cache.email = {};
    if (!cache.sms) cache.sms = {};
    cache.loadedAt = Date.now();
  }
}

async function ensureFresh(): Promise<void> {
  if (isFresh()) return;
  await loadAll();
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export async function getSLAThresholds(): Promise<SLAParams> {
  await ensureFresh();
  return cache.sla ?? { ...SLA_THRESHOLDS };
}

export async function getEmailTemplate(
  key: string,
): Promise<EmailTemplate | null> {
  await ensureFresh();
  return cache.email?.[key] ?? null;
}

export async function getSmsTemplate(
  key: string,
): Promise<SmsTemplate | null> {
  await ensureFresh();
  return cache.sms?.[key] ?? null;
}

export async function getSystemConfig(): Promise<SystemConfigSnapshot> {
  await ensureFresh();
  return {
    sla: cache.sla ?? { ...SLA_THRESHOLDS },
    emailTemplates: cache.email ?? {},
    smsTemplates: cache.sms ?? {},
  };
}

export function invalidateConfigCache(): void {
  cache.sla = undefined;
  cache.email = undefined;
  cache.sms = undefined;
  cache.loadedAt = undefined;
}
