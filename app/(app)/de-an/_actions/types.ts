// Phase 5 (M2.3) — Project wizard server-action input types + Zod schemas.
//
// Convention from Phase 3 (Plan 03-04 fix): 'use server' modules require all
// EXPORTED bindings to be async functions. So Zod schemas are kept INTERNAL
// to this module (consumed by save-draft / submit / etc.) and we only export
// types here. This file is NOT 'use server' — it's a regular shared types module.

import { z } from 'zod';

// =============================================================================
// Step 1 — Thông tin chung
// =============================================================================

const cuid = z.string().min(1, 'ID không hợp lệ').max(64);

export const generalInfoInternal = z
  .object({
    industrySectorIds: z
      .array(cuid)
      .min(1, 'Vui lòng chọn ít nhất 1 ngành hàng')
      .max(10, 'Tối đa 10 ngành hàng'),
    marketIds: z.array(cuid).default([]),
    countryIds: z.array(cuid).default([]),
    promotionTypeIds: z.array(cuid).default([]),
    timeRange: z
      .object({
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).nullable().optional(),
      })
      .nullable()
      .optional(),
    isTwoYear: z.boolean().default(false),
    nextYear: z.number().int().min(2020).max(2050).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.isTwoYear && !val.nextYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nextYear'],
        message: 'Vui lòng nhập năm tiếp theo cho đề án 2 năm',
      });
    }
  });

export type GeneralInfoInput = z.infer<typeof generalInfoInternal>;

// =============================================================================
// Step 2 — Mục tiêu, nội dung
// =============================================================================

export const objectivesInternal = z.object({
  objective: z.string().max(20_000, 'Mục tiêu quá dài').default(''),
  content: z.string().max(50_000, 'Nội dung quá dài').default(''),
});
export type ObjectivesInput = z.infer<typeof objectivesInternal>;

// =============================================================================
// Step 2b — Kế hoạch chi tiết
// =============================================================================

export const planRowInternal = z.object({
  id: z.string().optional(),
  task: z.string().trim().min(1, 'Hạng mục công việc bắt buộc').max(500),
  deliverable: z.string().max(500).optional().default(''),
  dueDate: z.string().nullable().optional(),
  owner: z.string().max(200).optional().default(''),
});
export const planInternal = z.object({
  rows: z.array(planRowInternal).default([]),
});
export type PlanInput = z.infer<typeof planInternal>;
export type PlanRowInput = z.infer<typeof planRowInternal>;

// =============================================================================
// Step 3 — Dự toán kinh phí
// =============================================================================

export const budgetRowInternal = z.object({
  id: z.string().optional(),
  item: z.string().trim().min(1, 'Tên hạng mục bắt buộc').max(500),
  unit: z.string().max(50).optional().default(''),
  quantity: z.number().nonnegative().default(0),
  unitPrice: z.number().nonnegative().default(0),
  amount: z.number().nonnegative().default(0),
  source: z.enum(['STATE', 'SELF']).default('STATE'),
  note: z.string().max(500).optional().default(''),
});
export const budgetInternal = z.object({
  rows: z.array(budgetRowInternal).default([]),
  totalState: z.number().nonnegative().default(0),
  totalSelf: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
});
export type BudgetInput = z.infer<typeof budgetInternal>;
export type BudgetRowInput = z.infer<typeof budgetRowInternal>;

// =============================================================================
// Step 4 — Chủ nhiệm đề án (selection of OrganizationProfile.contacts)
// =============================================================================

export const pmContactInternal = z.object({
  pmContactId: cuid,
});
export type PmContactInput = z.infer<typeof pmContactInternal>;

// =============================================================================
// Step 5 — Tài liệu (uploaded via separate FormData action)
// =============================================================================

export const documentInternal = z.object({
  attachmentId: cuid,
  category: z.enum(['PLAN', 'CAPABILITY', 'EVIDENCE', 'OTHER']).default('OTHER'),
});
export type DocumentInput = z.infer<typeof documentInternal>;

// =============================================================================
// Save-draft full payload — all 6 steps combined
// =============================================================================

export const saveDraftInternal = z
  .object({
    projectId: cuid.optional(), // omit on first save (creates new draft)
    name: z.string().trim().min(1, 'Tên đề án bắt buộc').max(500),
    kind: z.string().trim().min(1, 'Loại đề án bắt buộc').max(50),
    year: z.number().int().min(2020).max(2050),
    programCycleId: cuid,
    generalInfo: generalInfoInternal.optional(),
    objectives: objectivesInternal.optional(),
    plan: planInternal.optional(),
    budget: budgetInternal.optional(),
    pmContactId: cuid.nullable().optional(),
  })
  .strict();
export type SaveDraftInput = z.infer<typeof saveDraftInternal>;

// =============================================================================
// Re-export internal schemas for use by sibling action modules.
// These are NOT exported as 'export const' from a 'use server' file (this file
// is plain TS) — sibling 'use server' modules import these directly.
// =============================================================================

export {
  generalInfoInternal as generalInfoSchema,
  objectivesInternal as objectivesSchema,
  planInternal as planSchema,
  budgetInternal as budgetSchema,
  pmContactInternal as pmContactSchema,
  documentInternal as documentSchema,
  saveDraftInternal as saveDraftSchema,
};
