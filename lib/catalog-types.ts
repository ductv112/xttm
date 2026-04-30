/**
 * Catalog discriminated union + per-kind config.
 * Phục vụ Plan 02-06 (catalog editors) — 1 page template render được 8 catalogs.
 *
 * Mỗi CatalogKind map tới:
 * - label VN (hiển thị tab/breadcrumb)
 * - slug URL (route /danh-muc/[slug])
 * - prismaModel (camelCase Prisma client method, vd "projectKind")
 * - requirementId (CAT-01..08 từ REQUIREMENTS.md)
 * - flags special fields: hasParent (OrgUnit/ScoringCriterion), hasWeight (ScoringCriterion),
 *   hasRichText (DocumentTemplate)
 */

export const CATALOG_KINDS = [
  'project-kind',
  'industry-sector',
  'market',
  'promotion-type',
  'country',
  'org-unit',
  'scoring-criterion',
  'document-template',
] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];

export type CatalogConfig = {
  kind: CatalogKind;
  label: string; // "Loại đề án"
  labelPlural: string; // VN không phân biệt số nhiều — same as label by default
  slug: string; // URL slug "loai-de-an"
  prismaModel: string; // Prisma client method name "projectKind"
  requirementId: string; // "CAT-01"
  hasParent: boolean; // OrgUnit + ScoringCriterion = true
  hasWeight: boolean; // ScoringCriterion only
  hasRichText: boolean; // DocumentTemplate only
  hasRegion: boolean; // Market + Country
};

export const CATALOG_CONFIGS: Record<CatalogKind, CatalogConfig> = {
  'project-kind': {
    kind: 'project-kind',
    label: 'Loại đề án',
    labelPlural: 'Loại đề án',
    slug: 'loai-de-an',
    prismaModel: 'projectKind',
    requirementId: 'CAT-01',
    hasParent: false,
    hasWeight: false,
    hasRichText: false,
    hasRegion: false,
  },
  'industry-sector': {
    kind: 'industry-sector',
    label: 'Ngành hàng',
    labelPlural: 'Ngành hàng',
    slug: 'nganh-hang',
    prismaModel: 'industrySector',
    requirementId: 'CAT-02',
    hasParent: false,
    hasWeight: false,
    hasRichText: false,
    hasRegion: false,
  },
  market: {
    kind: 'market',
    label: 'Thị trường',
    labelPlural: 'Thị trường',
    slug: 'thi-truong',
    prismaModel: 'market',
    requirementId: 'CAT-03',
    hasParent: false,
    hasWeight: false,
    hasRichText: false,
    hasRegion: true,
  },
  'promotion-type': {
    kind: 'promotion-type',
    label: 'Loại hình XTTM',
    labelPlural: 'Loại hình XTTM',
    slug: 'loai-hinh-xttm',
    prismaModel: 'promotionType',
    requirementId: 'CAT-04',
    hasParent: false,
    hasWeight: false,
    hasRichText: false,
    hasRegion: false,
  },
  country: {
    kind: 'country',
    label: 'Quốc gia',
    labelPlural: 'Quốc gia',
    slug: 'quoc-gia',
    prismaModel: 'country',
    requirementId: 'CAT-05',
    hasParent: false,
    hasWeight: false,
    hasRichText: false,
    hasRegion: true,
  },
  'org-unit': {
    kind: 'org-unit',
    label: 'Đơn vị',
    labelPlural: 'Đơn vị',
    slug: 'don-vi',
    prismaModel: 'orgUnit',
    requirementId: 'CAT-06',
    hasParent: true,
    hasWeight: false,
    hasRichText: false,
    hasRegion: false,
  },
  'scoring-criterion': {
    kind: 'scoring-criterion',
    label: 'Tiêu chí chấm điểm',
    labelPlural: 'Tiêu chí chấm điểm',
    slug: 'tieu-chi-cham-diem',
    prismaModel: 'scoringCriterion',
    requirementId: 'CAT-07',
    hasParent: true,
    hasWeight: true,
    hasRichText: false,
    hasRegion: false,
  },
  'document-template': {
    kind: 'document-template',
    label: 'Mẫu văn bản',
    labelPlural: 'Mẫu văn bản',
    slug: 'mau-van-ban',
    prismaModel: 'documentTemplate',
    requirementId: 'CAT-08',
    hasParent: false,
    hasWeight: false,
    hasRichText: true,
    hasRegion: false,
  },
};

export function getCatalogConfig(kind: CatalogKind): CatalogConfig {
  return CATALOG_CONFIGS[kind];
}

/**
 * Resolve catalog config by URL slug.
 * Returns undefined nếu slug không tồn tại — caller phải handle 404.
 */
export function getCatalogConfigBySlug(slug: string): CatalogConfig | undefined {
  return Object.values(CATALOG_CONFIGS).find((cfg) => cfg.slug === slug);
}
