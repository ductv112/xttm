// Zod validation schemas — 1 schema per step + combined full schema for final submit.
// Plan 03-04 CYCLE-01/02/03/04 mitigation: chặn next bước khi step có lỗi.
//
// All error messages tiếng Việt. Dates allowed null/undefined nhưng cross-refines
// chỉ kiểm tra khi cả 2 dates set.

import { z } from 'zod';

// =============================================================================
// STEP 1 — Thông tin chung (CYCLE-01)
// =============================================================================

const currentYear = new Date().getFullYear();

export const Step1Schema = z.object({
  year: z
    .number({ message: 'Vui lòng nhập năm chu kỳ' })
    .int('Năm phải là số nguyên')
    .min(2020, 'Năm tối thiểu 2020')
    .max(2050, 'Năm tối đa 2050')
    .refine((v) => v >= currentYear, {
      message: 'Năm chu kỳ phải từ năm hiện tại trở đi',
    }),
  name: z
    .string({ message: 'Vui lòng nhập tên chu kỳ' })
    .trim()
    .min(5, 'Tên tối thiểu 5 ký tự')
    .max(200, 'Tên tối đa 200 ký tự'),
  description: z
    .string()
    .trim()
    .max(2000, 'Mô tả tối đa 2000 ký tự')
    .optional()
    .nullable(),
  totalBudget: z
    .number({ message: 'Ngân sách phải là số' })
    .nonnegative('Ngân sách không thể âm')
    .max(1_000_000_000_000_000, 'Ngân sách quá lớn')
    .optional()
    .nullable(),
});

export type Step1Input = z.infer<typeof Step1Schema>;

// =============================================================================
// STEP 2 — Mốc thời gian (CYCLE-02)
// =============================================================================

const optionalDate = z
  .union([z.date(), z.null(), z.undefined()])
  .optional()
  .transform((v) => v ?? null);

export const Step2Schema = z
  .object({
    registrationOpenAt: optionalDate,
    registrationCloseAt: optionalDate,
    supplementDeadline: optionalDate,
    evaluationStartAt: optionalDate,
    evaluationEndAt: optionalDate,
    approvalDeadline: optionalDate,
  })
  .superRefine((val, ctx) => {
    if (
      val.registrationOpenAt &&
      val.registrationCloseAt &&
      val.registrationCloseAt <= val.registrationOpenAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationCloseAt'],
        message: 'Hạn nộp phải sau ngày mở cổng',
      });
    }
    if (
      val.registrationCloseAt &&
      val.supplementDeadline &&
      val.supplementDeadline <= val.registrationCloseAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplementDeadline'],
        message: 'Hạn bổ sung phải sau hạn nộp',
      });
    }
    if (
      val.registrationCloseAt &&
      val.evaluationStartAt &&
      val.evaluationStartAt <= val.registrationCloseAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evaluationStartAt'],
        message: 'Ngày bắt đầu thẩm định phải sau hạn nộp',
      });
    }
    if (
      val.evaluationStartAt &&
      val.evaluationEndAt &&
      val.evaluationEndAt <= val.evaluationStartAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evaluationEndAt'],
        message: 'Ngày kết thúc thẩm định phải sau ngày bắt đầu',
      });
    }
    if (
      val.evaluationEndAt &&
      val.approvalDeadline &&
      val.approvalDeadline <= val.evaluationEndAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['approvalDeadline'],
        message: 'Hạn phê duyệt phải sau ngày kết thúc thẩm định',
      });
    }
  });

export type Step2Input = z.infer<typeof Step2Schema>;

// =============================================================================
// STEP 3 — Cấu hình tiêu chí (CYCLE-03)
// =============================================================================

const cuid = z
  .string()
  .min(1, 'ID không hợp lệ')
  .max(64, 'ID không hợp lệ');

export const Step3Schema = z.object({
  scoringCriteriaIds: z
    .array(cuid)
    .min(1, 'Vui lòng chọn ít nhất 1 tiêu chí chấm điểm sơ bộ')
    .max(20, 'Tối đa 20 tiêu chí chấm điểm sơ bộ'),
  evaluationCriteriaIds: z
    .array(cuid)
    .min(1, 'Vui lòng chọn ít nhất 1 tiêu chí thẩm định')
    .max(20, 'Tối đa 20 tiêu chí thẩm định'),
});

export type Step3Input = z.infer<typeof Step3Schema>;

// =============================================================================
// STEP 4 — Đơn vị mời (CYCLE-04)
// =============================================================================

export const Step4Schema = z.object({
  invitedOrganizationIds: z
    .array(cuid)
    .min(1, 'Vui lòng chọn ít nhất 1 đơn vị mời')
    .max(50, 'Tối đa 50 đơn vị mời'),
  emailTemplateIds: z
    .array(cuid)
    .max(10, 'Tối đa 10 mẫu công văn / email')
    .default([]),
});

export type Step4Input = z.infer<typeof Step4Schema>;

// =============================================================================
// COMBINED — final submit verification
// =============================================================================

export const CycleWizardFullSchema = z.object({
  step1: Step1Schema,
  step2: Step2Schema,
  step3: Step3Schema,
  step4: Step4Schema,
});

export type CycleWizardFullInput = z.infer<typeof CycleWizardFullSchema>;
