// Zod schemas — Plan 02-07 system config server actions
// T-02-07-03: Bounded numeric ranges for SLA params (defensive cascade guard)
// T-02-07-05: Honorific enum whitelist (5 values)

import { z } from 'zod';
import {
  HONORIFIC_OPTIONS,
  EMAIL_TEMPLATE_KEYS,
  SMS_TEMPLATE_KEYS,
} from '@/lib/system-config';

export const slaParamsSchema = z.object({
  CONTRACT_DAYS: z.coerce
    .number({ message: 'Vui lòng nhập số' })
    .int('Số nguyên dương')
    .min(1, 'Tối thiểu 1 ngày')
    .max(365, 'Tối đa 365 ngày'),
  REPORT_DAYS: z.coerce
    .number({ message: 'Vui lòng nhập số' })
    .int('Số nguyên dương')
    .min(1, 'Tối thiểu 1 ngày')
    .max(180, 'Tối đa 180 ngày'),
  CONSULATE_DAYS: z.coerce
    .number({ message: 'Vui lòng nhập số' })
    .int('Số nguyên dương')
    .min(1, 'Tối thiểu 1 ngày')
    .max(180, 'Tối đa 180 ngày'),
  REGISTRATION_DEADLINE_MMDD: z
    .string()
    .regex(/^\d{2}-\d{2}$/, 'Định dạng MM-DD (vd 05-30)'),
});

export type SLAParamsInput = z.infer<typeof slaParamsSchema>;

export const emailTemplateSchema = z.object({
  subject: z
    .string()
    .min(1, 'Vui lòng nhập tiêu đề')
    .max(200, 'Tối đa 200 ký tự'),
  honorific: z.enum(HONORIFIC_OPTIONS, {
    message: 'Vui lòng chọn lời chào hợp lệ',
  }),
  bodyHtml: z.string().min(10, 'Nội dung quá ngắn'),
});

export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;

export const smsTemplateSchema = z.object({
  body: z
    .string()
    .min(1, 'Vui lòng nhập nội dung')
    .max(160, 'SMS tối đa 160 ký tự'),
});

export type SmsTemplateInput = z.infer<typeof smsTemplateSchema>;

// T-02-07-02: Whitelist key enums — re-export from lib/system-config
export const emailKeySchema = z.enum(EMAIL_TEMPLATE_KEYS, {
  message: 'Khóa mẫu email không hợp lệ',
});

export const smsKeySchema = z.enum(SMS_TEMPLATE_KEYS, {
  message: 'Khóa mẫu SMS không hợp lệ',
});
