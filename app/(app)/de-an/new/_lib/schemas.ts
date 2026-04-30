// Zod validation schemas — 1 schema per step + combined full schema for final submit.
// Plan 05-02. Reuse server-side schemas where possible (de-an/_actions/types.ts),
// but client schemas operate on the full client shape (Step1Data..Step6Data) and
// add UX-friendly Vietnamese error messages.
//
// All error messages tiếng Việt. Cross-step refines (eg. proposedTotalReference >= total)
// done at schema-level via superRefine.

import { z } from 'zod';

import {
  generalInfoSchema,
  objectivesSchema,
  planRowInternal,
  budgetRowInternal,
  pmContactSchema,
} from '@/app/(app)/de-an/_actions/types';

const cuid = z.string().min(1, 'ID không hợp lệ').max(64);
const uuid = z.string().min(1, 'ID không hợp lệ').max(64);

// =============================================================================
// STEP 1 — Thông tin chung (PROJ-05)
// =============================================================================

export const Step1Schema = z
  .object({
    name: z
      .string({ message: 'Vui lòng nhập tên đề án' })
      .trim()
      .min(5, 'Tên đề án tối thiểu 5 ký tự')
      .max(500, 'Tên đề án tối đa 500 ký tự'),
    kind: z
      .string({ message: 'Vui lòng chọn loại đề án' })
      .trim()
      .min(1, 'Vui lòng chọn loại đề án'),
    industrySectorIds: z
      .array(cuid)
      .min(1, 'Vui lòng chọn ít nhất 1 ngành hàng')
      .max(10, 'Tối đa 10 ngành hàng'),
    marketIds: z.array(cuid).max(20, 'Tối đa 20 thị trường').default([]),
    countryIds: z.array(cuid).max(50, 'Tối đa 50 quốc gia').default([]),
    promotionTypeIds: z.array(cuid).max(20, 'Tối đa 20 loại hình').default([]),
    timeRange: z
      .object({
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).nullable().optional(),
      })
      .nullable()
      .optional(),
    isTwoYear: z.boolean().default(false),
    nextYear: z
      .number()
      .int('Năm phải là số nguyên')
      .min(2020, 'Năm tối thiểu 2020')
      .max(2050, 'Năm tối đa 2050')
      .nullable()
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.isTwoYear && (val.nextYear == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nextYear'],
        message: 'Vui lòng nhập năm tiếp theo cho đề án 2 năm',
      });
    }
    if (val.timeRange?.start && val.timeRange?.end) {
      const s = new Date(val.timeRange.start);
      const e = new Date(val.timeRange.end);
      if (
        !Number.isNaN(s.getTime()) &&
        !Number.isNaN(e.getTime()) &&
        e <= s
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeRange', 'end'],
          message: 'Ngày kết thúc phải sau ngày bắt đầu',
        });
      }
    }
  });

export type Step1Input = z.infer<typeof Step1Schema>;

// =============================================================================
// STEP 2 — Mục tiêu, nội dung, kế hoạch (PROJ-06)
// =============================================================================

const MIN_OBJECTIVE_PRINTABLE = 100;
const MIN_CONTENT_PRINTABLE = 200;

function stripHtmlPrintableLength(html: string | undefined | null): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

export const Step2PlanRowSchema = z.object({
  id: uuid,
  task: z
    .string({ message: 'Vui lòng nhập hạng mục công việc' })
    .trim()
    .min(1, 'Hạng mục công việc bắt buộc')
    .max(500, 'Hạng mục tối đa 500 ký tự'),
  deliverable: z.string().max(500).default(''),
  dueDate: z.string().nullable().optional(),
  owner: z.string().max(200).default(''),
});

export const Step2Schema = z.object({
  objective: z
    .string()
    .max(20_000, 'Mục tiêu quá dài')
    .refine(
      (v) => stripHtmlPrintableLength(v) >= MIN_OBJECTIVE_PRINTABLE,
      `Mục tiêu tối thiểu ${MIN_OBJECTIVE_PRINTABLE} ký tự`,
    ),
  content: z
    .string()
    .max(50_000, 'Nội dung quá dài')
    .refine(
      (v) => stripHtmlPrintableLength(v) >= MIN_CONTENT_PRINTABLE,
      `Nội dung tối thiểu ${MIN_CONTENT_PRINTABLE} ký tự`,
    ),
  planRows: z
    .array(Step2PlanRowSchema)
    .min(1, 'Vui lòng khai báo ít nhất 1 dòng kế hoạch chi tiết')
    .max(50, 'Tối đa 50 dòng kế hoạch'),
});

export type Step2Input = z.infer<typeof Step2Schema>;

// =============================================================================
// STEP 3 — Dự toán kinh phí (PROJ-07)
// =============================================================================

export const Step3BudgetRowSchema = z.object({
  id: uuid,
  item: z
    .string({ message: 'Vui lòng nhập tên hạng mục' })
    .trim()
    .min(1, 'Tên hạng mục bắt buộc')
    .max(500, 'Tên hạng mục tối đa 500 ký tự'),
  unit: z.string().max(50).default(''),
  quantity: z.number().nonnegative('Số lượng phải >= 0').default(0),
  unitPrice: z.number().nonnegative('Đơn giá phải >= 0').default(0),
  amount: z.number().nonnegative('Thành tiền phải >= 0').default(0),
  source: z.enum(['STATE', 'SELF']).default('STATE'),
  note: z.string().max(500).default(''),
});

export const Step3Schema = z
  .object({
    rows: z
      .array(Step3BudgetRowSchema)
      .min(1, 'Vui lòng khai báo ít nhất 1 dòng dự toán kinh phí')
      .max(100, 'Tối đa 100 dòng dự toán'),
    totalState: z.number().nonnegative().default(0),
    totalSelf: z.number().nonnegative().default(0),
    total: z.number().nonnegative().default(0),
    proposedTotalReference: z
      .number()
      .nonnegative('Ngân sách tham chiếu phải >= 0')
      .nullable()
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.total <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['total'],
        message: 'Tổng dự toán kinh phí phải lớn hơn 0',
      });
    }
    if (
      typeof val.proposedTotalReference === 'number' &&
      val.proposedTotalReference > 0 &&
      val.proposedTotalReference < val.total
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proposedTotalReference'],
        message:
          'Ngân sách tổng tham chiếu không được nhỏ hơn tổng dự toán',
      });
    }
  });

export type Step3Input = z.infer<typeof Step3Schema>;

// =============================================================================
// STEP 4 — Chủ nhiệm đề án (PROJ-08)
// =============================================================================

export const Step4Schema = z.object({
  pmContactId: cuid.refine((v) => v.length > 0, {
    message: 'Vui lòng chọn chủ nhiệm đề án',
  }),
});

export type Step4Input = z.infer<typeof Step4Schema>;

// =============================================================================
// STEP 5 — Tài liệu đính kèm (PROJ-09 / PROJ-10)
// =============================================================================

export const Step5DocumentEntrySchema = z.object({
  attachmentId: cuid,
  fileName: z.string().min(1).max(500),
  category: z.enum(['PLAN', 'CAPABILITY', 'EVIDENCE', 'OTHER']),
  fileSize: z.number().nullable().optional(),
  fileUrl: z.string(),
  uploadedAt: z.string(),
});

export const Step5Schema = z.object({
  // Documents are managed via server actions (upload-document.ts) — wizard
  // tracks the list for review. Empty allowed at draft stage; submit-time
  // guard is at step 6 review.
  documents: z.array(Step5DocumentEntrySchema).max(20, 'Tối đa 20 tài liệu'),
});

export type Step5Input = z.infer<typeof Step5Schema>;

// =============================================================================
// STEP 6 — Xem lại & Cam đoan (PROJ-11)
// =============================================================================

export const Step6Schema = z.object({
  declarationConfirmed: z.literal(true, {
    message:
      'Bạn cần cam đoan thông tin đúng sự thật trước khi nộp đề án',
  }),
});

export type Step6Input = z.infer<typeof Step6Schema>;

// =============================================================================
// COMBINED — final submit verification
// =============================================================================

export const ProjectWizardFullSchema = z.object({
  step1: Step1Schema,
  step2: Step2Schema,
  step3: Step3Schema,
  step4: Step4Schema,
  step5: Step5Schema,
  step6: Step6Schema,
});

export type ProjectWizardFullInput = z.infer<typeof ProjectWizardFullSchema>;

// =============================================================================
// Re-export server-side schemas for cross-validation parity (used by reviewer/test)
// =============================================================================

export {
  generalInfoSchema as serverGeneralInfoSchema,
  objectivesSchema as serverObjectivesSchema,
  planRowInternal as serverPlanRowSchema,
  budgetRowInternal as serverBudgetRowSchema,
  pmContactSchema as serverPmContactSchema,
};
