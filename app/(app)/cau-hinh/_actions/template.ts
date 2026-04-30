'use server';

// Email + SMS template update server actions — Plan 02-07 (CONFIG-02)
// T-02-07-01: auth + RBAC ADMIN only
// T-02-07-02: Whitelist key (5 email + 3 SMS) via emailKeySchema/smsKeySchema
// T-02-07-04 / T-02-07-08: Body validated via Zod; sanitization at render time (Phase 3+)
// withAuditLog: per-template before/after diff

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { withAuditLog } from '@/lib/audit';
import {
  invalidateConfigCache,
  EMAIL_TEMPLATE_LABELS,
  SMS_TEMPLATE_LABELS,
  type EmailTemplateKey,
  type SmsTemplateKey,
} from '@/lib/system-config';

import {
  emailTemplateSchema,
  smsTemplateSchema,
  emailKeySchema,
  smsKeySchema,
  type EmailTemplateInput,
  type SmsTemplateInput,
} from './schemas';

// -----------------------------------------------------------------------------
// updateEmailTemplate
// -----------------------------------------------------------------------------

export type UpdateEmailTemplateResult = {
  key: EmailTemplateKey;
  before: EmailTemplateInput | null;
  after: EmailTemplateInput;
};

async function updateEmailTemplateImpl(
  rawKey: string,
  input: EmailTemplateInput,
): Promise<UpdateEmailTemplateResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'cau-hinh', 'update')) {
    throw new Error('Bạn không có quyền cập nhật mẫu email');
  }

  // T-02-07-02 — whitelist key (mass assignment guard)
  const key = emailKeySchema.parse(rawKey);
  const parsed = emailTemplateSchema.parse(input);

  const dbKey = `email.template.${key}`;
  const existing = await prisma.systemConfig.findUnique({ where: { key: dbKey } });
  let before: EmailTemplateInput | null = null;
  if (existing) {
    try {
      before = JSON.parse(existing.valueJson) as EmailTemplateInput;
    } catch {
      before = null;
    }
  }

  const valueJson = JSON.stringify(parsed);
  await prisma.systemConfig.upsert({
    where: { key: dbKey },
    update: {
      valueJson,
      updatedById: session.user.id,
      label: EMAIL_TEMPLATE_LABELS[key],
    },
    create: {
      key: dbKey,
      valueJson,
      category: 'EMAIL',
      label: EMAIL_TEMPLATE_LABELS[key],
      updatedById: session.user.id,
    },
  });

  invalidateConfigCache();
  revalidatePath('/cau-hinh');

  return { key, before, after: parsed };
}

export const updateEmailTemplate = withAuditLog<
  [string, EmailTemplateInput],
  UpdateEmailTemplateResult
>(
  {
    action: 'UPDATE',
    resource: 'cau-hinh',
    resourceIdFromResult: (r) => `email.template.${r.key}`,
    captureBefore: async ([rawKey]) => {
      // Validate raw key — capture only if valid (else return null and let impl throw)
      const parsedKey = emailKeySchema.safeParse(rawKey);
      if (!parsedKey.success) return null;
      const dbKey = `email.template.${parsedKey.data}`;
      const existing = await prisma.systemConfig.findUnique({
        where: { key: dbKey },
      });
      if (!existing) return null;
      try {
        return { key: dbKey, value: JSON.parse(existing.valueJson) };
      } catch {
        return null;
      }
    },
    captureAfter: (result) => ({
      key: `email.template.${result.key}`,
      value: result.after,
    }),
  },
  updateEmailTemplateImpl,
);

// -----------------------------------------------------------------------------
// updateSmsTemplate
// -----------------------------------------------------------------------------

export type UpdateSmsTemplateResult = {
  key: SmsTemplateKey;
  before: SmsTemplateInput | null;
  after: SmsTemplateInput;
};

async function updateSmsTemplateImpl(
  rawKey: string,
  input: SmsTemplateInput,
): Promise<UpdateSmsTemplateResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  if (!can(session.user.role as Role, 'cau-hinh', 'update')) {
    throw new Error('Bạn không có quyền cập nhật mẫu SMS');
  }

  // T-02-07-02 — whitelist key
  const key = smsKeySchema.parse(rawKey);
  const parsed = smsTemplateSchema.parse(input);

  const dbKey = `sms.template.${key}`;
  const existing = await prisma.systemConfig.findUnique({ where: { key: dbKey } });
  let before: SmsTemplateInput | null = null;
  if (existing) {
    try {
      before = JSON.parse(existing.valueJson) as SmsTemplateInput;
    } catch {
      before = null;
    }
  }

  const valueJson = JSON.stringify(parsed);
  await prisma.systemConfig.upsert({
    where: { key: dbKey },
    update: {
      valueJson,
      updatedById: session.user.id,
      label: SMS_TEMPLATE_LABELS[key],
    },
    create: {
      key: dbKey,
      valueJson,
      category: 'SMS',
      label: SMS_TEMPLATE_LABELS[key],
      updatedById: session.user.id,
    },
  });

  invalidateConfigCache();
  revalidatePath('/cau-hinh');

  return { key, before, after: parsed };
}

export const updateSmsTemplate = withAuditLog<
  [string, SmsTemplateInput],
  UpdateSmsTemplateResult
>(
  {
    action: 'UPDATE',
    resource: 'cau-hinh',
    resourceIdFromResult: (r) => `sms.template.${r.key}`,
    captureBefore: async ([rawKey]) => {
      const parsedKey = smsKeySchema.safeParse(rawKey);
      if (!parsedKey.success) return null;
      const dbKey = `sms.template.${parsedKey.data}`;
      const existing = await prisma.systemConfig.findUnique({
        where: { key: dbKey },
      });
      if (!existing) return null;
      try {
        return { key: dbKey, value: JSON.parse(existing.valueJson) };
      } catch {
        return null;
      }
    },
    captureAfter: (result) => ({
      key: `sms.template.${result.key}`,
      value: result.after,
    }),
  },
  updateSmsTemplateImpl,
);
