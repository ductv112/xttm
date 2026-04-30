// Zod schemas for 8 catalog kinds — pure schemas, importable từ client.
// KHÔNG có 'use server' directive ở đây để client component có thể import.
// Per-kind schema map (SCHEMA_BY_KIND) drives upsertCatalogItem validation.

import { z } from 'zod';
import type { CatalogKind } from '@/lib/catalog-types';

// ---------------------------------------------------------------------------
// Common base — tất cả 8 catalogs share these fields
// ---------------------------------------------------------------------------

const codeField = z
  .string({ message: 'Vui lòng nhập mã' })
  .trim()
  .min(1, 'Vui lòng nhập mã')
  .max(50, 'Mã tối đa 50 ký tự')
  .regex(/^[A-Z0-9_-]+$/, 'Mã chỉ chứa chữ in hoa, số, gạch dưới, gạch ngang');

const nameField = z
  .string({ message: 'Vui lòng nhập tên' })
  .trim()
  .min(1, 'Vui lòng nhập tên')
  .max(200, 'Tên tối đa 200 ký tự');

const descriptionField = z
  .string()
  .trim()
  .max(1000, 'Mô tả tối đa 1000 ký tự')
  .optional()
  .nullable()
  .or(z.literal(''));

const displayOrderField = z.coerce
  .number({ message: 'Thứ tự hiển thị phải là số' })
  .int('Thứ tự phải là số nguyên')
  .min(0, 'Thứ tự không được âm')
  .default(0);

const isActiveField = z.boolean().default(true);

const baseFields = {
  code: codeField,
  name: nameField,
  description: descriptionField,
  displayOrder: displayOrderField,
  isActive: isActiveField,
};

// ---------------------------------------------------------------------------
// Region enum — Market + Country
// ---------------------------------------------------------------------------

export const REGION_VALUES = [
  'EUROPE',
  'ASIA',
  'AMERICAS',
  'AFRICA',
  'OCEANIA',
] as const;

export const REGION_LABELS: Record<(typeof REGION_VALUES)[number], string> = {
  EUROPE: 'Châu Âu',
  ASIA: 'Châu Á',
  AMERICAS: 'Châu Mỹ',
  AFRICA: 'Châu Phi',
  OCEANIA: 'Châu Đại Dương',
};

const regionField = z.enum(REGION_VALUES, {
  message: 'Vui lòng chọn khu vực',
});

// ---------------------------------------------------------------------------
// OrgUnit type enum
// ---------------------------------------------------------------------------

export const ORG_UNIT_TYPES = [
  'MINISTRY',
  'DEPARTMENT',
  'ASSOCIATION',
  'ENTERPRISE',
  'RESEARCH_INSTITUTE',
  'OTHER',
] as const;

export const ORG_UNIT_TYPE_LABELS: Record<(typeof ORG_UNIT_TYPES)[number], string> = {
  MINISTRY: 'Bộ',
  DEPARTMENT: 'Cục/Vụ',
  ASSOCIATION: 'Hiệp hội',
  ENTERPRISE: 'Doanh nghiệp',
  RESEARCH_INSTITUTE: 'Viện nghiên cứu',
  OTHER: 'Khác',
};

// ---------------------------------------------------------------------------
// DocumentTemplate category enum
// ---------------------------------------------------------------------------

export const DOC_TEMPLATE_CATEGORIES = [
  'CONG_VAN_MOI',
  'TO_TRINH',
  'QUYET_DINH',
  'HOP_DONG',
  'BIEN_BAN_NGHIEM_THU',
  'THANH_LY',
] as const;

export const DOC_TEMPLATE_CATEGORY_LABELS: Record<
  (typeof DOC_TEMPLATE_CATEGORIES)[number],
  string
> = {
  CONG_VAN_MOI: 'Công văn mời',
  TO_TRINH: 'Tờ trình',
  QUYET_DINH: 'Quyết định',
  HOP_DONG: 'Hợp đồng',
  BIEN_BAN_NGHIEM_THU: 'Biên bản nghiệm thu',
  THANH_LY: 'Thanh lý',
};

// ---------------------------------------------------------------------------
// Per-kind schemas
// ---------------------------------------------------------------------------

export const projectKindSchema = z.object({ ...baseFields });
export const industrySectorSchema = z.object({ ...baseFields });
export const promotionTypeSchema = z.object({ ...baseFields });

export const marketSchema = z.object({
  ...baseFields,
  region: regionField,
  nameEn: z.string().trim().max(200).optional().nullable().or(z.literal('')),
});

export const countrySchema = z.object({
  ...baseFields,
  // ISO alpha-3 — exactly 3 uppercase letters (override generic codeField)
  code: z
    .string({ message: 'Vui lòng nhập mã ISO' })
    .trim()
    .length(3, 'Mã ISO alpha-3 phải có đúng 3 ký tự')
    .regex(/^[A-Z]{3}$/, 'Mã ISO chỉ chứa 3 chữ cái in hoa'),
  region: regionField,
  hasTradeOffice: z.boolean().default(false),
  nameEn: z.string().trim().max(200).optional().nullable().or(z.literal('')),
});

export const orgUnitSchema = z.object({
  ...baseFields,
  type: z.enum(ORG_UNIT_TYPES, { message: 'Vui lòng chọn loại đơn vị' }),
  parentId: z.string().optional().nullable().or(z.literal('')),
});

export const scoringCriterionSchema = z.object({
  ...baseFields,
  weight: z.coerce
    .number({ message: 'Trọng số phải là số' })
    .min(0, 'Trọng số tối thiểu 0')
    .max(100, 'Trọng số tối đa 100'),
  parentId: z.string().optional().nullable().or(z.literal('')),
  appliesToKinds: z.array(z.string()).default([]),
});

export const documentTemplateSchema = z.object({
  ...baseFields,
  category: z.enum(DOC_TEMPLATE_CATEGORIES, {
    message: 'Vui lòng chọn loại văn bản',
  }),
  bodyHtml: z
    .string({ message: 'Vui lòng nhập nội dung mẫu' })
    .min(1, 'Vui lòng nhập nội dung mẫu'),
  variables: z
    .array(
      z
        .string()
        .regex(
          /^[a-zA-Z][a-zA-Z0-9]*$/,
          'Tên biến chỉ chứa chữ cái và số, bắt đầu bằng chữ cái',
        ),
    )
    .default([]),
});

// ---------------------------------------------------------------------------
// Schema-by-kind dispatch map
// ---------------------------------------------------------------------------

export const SCHEMA_BY_KIND: Record<CatalogKind, z.ZodTypeAny> = {
  'project-kind': projectKindSchema,
  'industry-sector': industrySectorSchema,
  market: marketSchema,
  'promotion-type': promotionTypeSchema,
  country: countrySchema,
  'org-unit': orgUnitSchema,
  'scoring-criterion': scoringCriterionSchema,
  'document-template': documentTemplateSchema,
};

// ---------------------------------------------------------------------------
// Inferred input types — caller có thể type form values theo kind
// ---------------------------------------------------------------------------

export type ProjectKindInput = z.input<typeof projectKindSchema>;
export type IndustrySectorInput = z.input<typeof industrySectorSchema>;
export type MarketInput = z.input<typeof marketSchema>;
export type PromotionTypeInput = z.input<typeof promotionTypeSchema>;
export type CountryInput = z.input<typeof countrySchema>;
export type OrgUnitInput = z.input<typeof orgUnitSchema>;
export type ScoringCriterionInput = z.input<typeof scoringCriterionSchema>;
export type DocumentTemplateInput = z.input<typeof documentTemplateSchema>;

// ---------------------------------------------------------------------------
// List filter
// ---------------------------------------------------------------------------

export const listCatalogFilterSchema = z.object({
  keyword: z.string().optional(),
  isActive: z.enum(['all', 'active', 'inactive']).default('all').optional(),
});

export type ListCatalogFilterInput = z.input<typeof listCatalogFilterSchema>;
export type ListCatalogFilter = z.output<typeof listCatalogFilterSchema>;
