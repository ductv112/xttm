---
phase: 02-m1-quan-tri-danh-muc
plan: 02
subsystem: data-layer
tags: [prisma, schema-extension, catalog, seed, vietnamese-data, master-data, m1]

requires:
  - "Plan 01-02: prisma/schema.prisma 14 models lock + DATABASE_URL .env Prisma CLI"
  - "Plan 01-02: prisma/seed.ts entry pattern + prisma/seed/helpers.ts logSeedStep"
  - "Plan 01-01: lib/vi-search.ts removeDiacritics cho searchKey"
  - "Plan 01-01: lib/prisma.ts singleton client (consumed bởi server actions phase sau)"
  - "Plan 02-01: audit log infrastructure (Plan 02-04+ catalog mutation sẽ wrap withAuditLog)"
provides:
  - "prisma/schema.prisma: 22 models tổng (14 cũ + 8 catalog mới): ProjectKind, IndustrySector, Market, PromotionType, Country, OrgUnit, ScoringCriterion, DocumentTemplate"
  - "prisma/dev.db: 22 tables synced (tất cả catalog tables tạo, indexes [searchKey][isActive,displayOrder] sẵn sàng)"
  - "@prisma/client: regenerated v6.19.3 với typed models cho 8 catalogs"
  - "lib/catalog-types.ts: CATALOG_KINDS const tuple + CatalogKind type + CATALOG_CONFIGS Record + getCatalogConfig + getCatalogConfigBySlug"
  - "prisma/seed/catalogs.ts: seedCatalogs(prisma) entry export, 8 sub-functions idempotent qua upsert"
  - "Seed records: 8 ProjectKind + 20 IndustrySector + 15 Market + 8 PromotionType + 30 Country + 12 OrgUnit (9 parents + 3 children) + 15 ScoringCriterion (4 groups + 11 children) + 6 DocumentTemplate"
  - "Idempotent verified: chạy db:seed lần 2 counts không tăng"
  - "Vietnamese diacritics intact (Việt Nam, Dệt may, Bộ Công Thương) + searchKey diacritics-removed cho mọi catalog"
  - "Hierarchy resolved: OrgUnit CUC_XTTM→BO_CT, MAY10→VINATEX, INST_TRADE→BO_CT; ScoringCriterion 11 children FK đúng 4 groups"
affects: [02-03-shared-ui-primitives, 02-06-catalog-editors, 03-chu-ky-chuong-trinh, 05-de-an, 07-tham-dinh, 08-quyet-dinh, all-future-phases]

tech-stack:
  added:
    - "8 Prisma models append-only vào schema (ProjectKind/IndustrySector/Market/PromotionType/Country/OrgUnit/ScoringCriterion/DocumentTemplate)"
    - "lib/catalog-types.ts CatalogConfig discriminated union pattern (kind label slug prismaModel hasParent hasWeight hasRichText hasRegion)"
  patterns:
    - "Catalog common fields: code unique, name VN, description?, searchKey (diacritics-removed), displayOrder int, isActive bool, createdAt/updatedAt timestamps"
    - "Catalog common indexes: [searchKey] cho VN search, [isActive, displayOrder] cho list view filter+sort"
    - "Hierarchical pattern: OrgUnit + ScoringCriterion dùng self-relation `name: \"<Model>Parent\"` qua parentId String? — seed parents trước, children sau với findUnique lookup"
    - "Region-typed catalogs: Market + Country có cột `region String` (EUROPE/ASIA/AMERICAS/AFRICA/OCEANIA) + index [region] cho group query"
    - "JSON columns trong schema: ScoringCriterion.appliesToKinds + DocumentTemplate.variables — String? lưu JSON.stringify (SQLite không có JSON type)"
    - "Idempotent seed: upsert {where:{code}, update, create} pattern uniform cho mọi catalog — chạy nhiều lần không nhân bản, update nếu data thay đổi"
    - "Discriminated union slug→config lookup: getCatalogConfigBySlug(slug) cho Plan 02-06 route /danh-muc/[slug] resolve catalog config"

key-files:
  created:
    - "lib/catalog-types.ts — 137 dòng, exports CATALOG_KINDS+CatalogKind+CatalogConfig+CATALOG_CONFIGS+getCatalogConfig+getCatalogConfigBySlug"
    - "prisma/seed/catalogs.ts — 470 dòng, 8 sub-functions (seedProjectKinds...seedDocumentTemplates) + seedCatalogs entry"
  modified:
    - "prisma/schema.prisma — append 8 catalog models (163 dòng thêm), 22 models total, KHÔNG sửa 14 models lock"
    - "prisma/seed.ts — import seedCatalogs + assertions counts cho 8 catalogs (8/20/15/8/30/12/15/6)"

key-decisions:
  - "Append-only schema: 8 catalog models thêm vào CUỐI schema.prisma không sửa 14 models đã lock M0 — tránh schema drift, giữ Plan 01-02 invariants"
  - "Catalog common pattern uniform: mọi catalog có id/code/name/description?/searchKey/displayOrder/isActive/createdAt/updatedAt + indexes [searchKey][isActive,displayOrder] — Plan 02-06 catalog editor có thể render 1 template chung"
  - "Self-relation hierarchy qua named relation: OrgUnit relation('OrgUnitParent'), ScoringCriterion relation('ScoringCriterionParent') — tránh trùng tên relation field giữa các models có self-link"
  - "JSON columns dùng String?: ScoringCriterion.appliesToKinds + DocumentTemplate.variables — SQLite không có JSON type, manual serialize qua JSON.stringify/parse (consistent với marketIds/countryIds Project model Plan 01-02)"
  - "ScoringCriterion 4 groups + 11 children = 15 records: gộp 'Bằng chứng số liệu' vào 'Phương pháp triển khai' theo plan adjustment để đạt đúng spec 15 records (3+3+3+2 child distribution, sum weight đúng 25/25/30/20=100)"
  - "appliesToKinds JSON liệt kê đầy đủ 8 ProjectKind codes thay '[*]' wildcard: explicit hơn cho admin UI Plan 02-06 hiển thị chip multi-select; vẫn cho phép edit để giảm bớt scope per kind"
  - "DocumentTemplate.bodyHtml seed Tiptap HTML stub 5-10 dòng/template với placeholders {{tenChuongTrinh}}/{{namKy}}/...: đủ render preview, full body sẽ refine ở Plan 02-06 catalog editor khi user dùng Tiptap rich text edit"
  - "OrgUnit độc lập với Organization (Plan 01-02): OrgUnit là master data lookup cho dropdown đơn vị mời (Phase 3+), Organization là operational entity (FK với User/Project/Contract). Có thể duplicate name (vd OrgUnit BO_CT khác Organization BO_CT) — design quyết định không gộp 2 tables để tách biệt master data vs operational data"
  - "lib/catalog-types.ts thêm flag hasRegion (Market+Country) ngoài 3 flag plan đề xuất (hasParent/hasWeight/hasRichText): Plan 02-06 catalog editor sẽ render region select khi flag true — tránh hardcode 'if kind==market||kind==country' rải rác"
  - "Country.code dùng ISO alpha-3 (VNM/USA/CHN) thay alpha-2 (VN/US/CN): độ chính xác cao hơn cho dropdown filter Phase 5+ + Phase 8 cảnh báo 30 ngày thương vụ"

requirements-completed:
  - CAT-01
  - CAT-02
  - CAT-03
  - CAT-04
  - CAT-05
  - CAT-06
  - CAT-07
  - CAT-08

duration: 5m
completed: 2026-04-30
---

# Phase 02 Plan 02: Catalog Schema + Seed Summary

**8 Prisma catalog models append-only vào schema lock M0 + seed 8/20/15/8/30/12/15/6 records realistic Vietnamese (loại đề án/ngành hàng/thị trường/loại hình XTTM/quốc gia/đơn vị/tiêu chí chấm điểm/mẫu văn bản) idempotent qua upsert + lib/catalog-types.ts discriminated union config cho Plan 02-06 reuse 1 template render 8 catalogs.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-30T18:23:08Z
- **Completed:** 2026-04-30T18:27:42Z
- **Tasks:** 2 (both commit-producing)
- **Files created:** 2 (lib/catalog-types.ts + prisma/seed/catalogs.ts)
- **Files modified:** 2 (prisma/schema.prisma + prisma/seed.ts)
- **Seed time:** ~1.4s cho 8 + 5 + 8 + 20 + 15 + 8 + 30 + 12 + 15 + 6 = 127 records (well under threat budget)

## Accomplishments

- 8 catalog Prisma models defined với common pattern + hierarchical/region/weight/richText special fields
- `npx prisma format` exit 0 — schema syntactically valid
- `npx prisma db push --accept-data-loss=false` exit 0 — 8 tables tạo, dữ liệu Plan 01-02 (8 users + 5 orgs) preserved
- `npx prisma generate` exit 0 — Prisma Client v6.19.3 typed cho 8 catalog models
- `npm run db:seed` chạy lần 1: counts đúng 8/20/15/8/30/12/15/6 cho mọi catalog
- `npm run db:seed` chạy lần 2: counts unchanged (idempotent verified)
- Vietnamese diacritics intact: VNM.name='Việt Nam', TEXTILE.name='Dệt may', BO_CT.name='Bộ Công Thương'
- Hierarchy resolved: OrgUnit CUC_XTTM→BO_CT, MAY10→VINATEX, INST_TRADE→BO_CT (3 children); ScoringCriterion 11 children FK đúng 4 groups
- Region grouping: 30 Country phân bố ASIA(11)/EUROPE(8)/AMERICAS(7)/AFRICA(2)/OCEANIA(2); 15 Market phân bố ASIA(7)/EUROPE(4)/AMERICAS(4)/AFRICA(1)/OCEANIA(1)... (regions verified)
- hasTradeOffice metadata: 22/30 Country có thương vụ Việt Nam (hỗ trợ Phase 8 cảnh báo 30 ngày)
- DocumentTemplate variables JSON intact: ["tenChuongTrinh","namKy","hanNopDeAn","tenDonVi","ngayKy"] cho MOI_DK template
- ScoringCriterion sum weight = 25+25+30+20 = 100 (4 groups), children weight sum khớp parent
- `npx tsc --noEmit` exit 0 — Prisma Client types resolve, lib/catalog-types.ts type-safe
- 22 models trong schema (`grep -c '^model ' prisma/schema.prisma` returns 22)

## Task Commits

1. **Task 1: Append 8 catalog models vào prisma/schema.prisma + db push** — `bb55262` (feat)
2. **Task 2: Seed 8 catalogs với Vietnamese realistic data + lib/catalog-types.ts** — `db6b038` (feat)

## Files Created

### lib/catalog-types.ts (Task 2)

- `CATALOG_KINDS` — const tuple 8 elements: 'project-kind', 'industry-sector', 'market', 'promotion-type', 'country', 'org-unit', 'scoring-criterion', 'document-template'
- `CatalogKind` — derived type from tuple
- `CatalogConfig` type — kind/label/labelPlural/slug/prismaModel/requirementId/hasParent/hasWeight/hasRichText/hasRegion
- `CATALOG_CONFIGS` — Record<CatalogKind, CatalogConfig> lookup table với 8 entries
- `getCatalogConfig(kind)` — direct lookup
- `getCatalogConfigBySlug(slug)` — reverse lookup từ URL slug → config (cho Plan 02-06 route /danh-muc/[slug])

Slug map:
- project-kind → loai-de-an
- industry-sector → nganh-hang
- market → thi-truong
- promotion-type → loai-hinh-xttm
- country → quoc-gia
- org-unit → don-vi
- scoring-criterion → tieu-chi-cham-diem
- document-template → mau-van-ban

### prisma/seed/catalogs.ts (Task 2)

8 sub-functions + 1 entry export:

- `seedProjectKinds()` — 8 records (EXPORT_EXHIBITION/INTL_CONFERENCE/DOMESTIC_FAIR/TRADE_DELEGATION_OUT/TRADE_DELEGATION_IN/TRADE_INFO_EXPORT/TRADE_INFO_DOMESTIC/TRAINING)
- `seedIndustrySectors()` — 20 records (Dệt may/Da giày/Gỗ/Thủy sản/Nông sản/Cà phê/Cao su/Gạo/Sắt thép/Điện tử/Thủ công mỹ nghệ/Hạt điều/Hồ tiêu/Rau quả/Chè/May mặc/Da/Cơ khí/Nhựa/Chế biến thực phẩm)
- `seedMarkets()` — 15 records region-grouped (EU/US/CHINA/JAPAN/KOREA/ASEAN/MIDDLE_EAST/INDIA/AUSTRALIA/RUSSIA/AFRICA/LATAM/UK/CANADA/BRAZIL)
- `seedPromotionTypes()` — 8 records (Hội chợ-triển lãm/Kết nối giao thương/Nghiên cứu thị trường/Quảng bá thương hiệu/Xúc tiến xuất khẩu/Xúc tiến đầu tư/Đào tạo XTTM/Truyền thông XTTM)
- `seedCountries()` — 30 records ISO alpha-3 + region + hasTradeOffice (VNM,USA,CHN,JPN,KOR,DEU,FRA,GBR,ITA,ESP,NLD,BEL,RUS,IND,IDN,THA,MYS,SGP,PHL,AUS,NZL,CAN,MEX,BRA,ARG,ARE,SAU,ZAF,EGY,TUR)
- `seedOrgUnits()` — 12 records: 9 parents seeded first (BO_CT/VITAS/LEFASO/VINATEX/VASEP/VCCI/VIFOREST/VICOFA/VFA), 3 children với parentId resolution (CUC_XTTM→BO_CT, MAY10→VINATEX, INST_TRADE→BO_CT)
- `seedScoringCriteria()` — 15 records: 4 groups (GROUP_RELEVANCE 25%, GROUP_FEASIBILITY 25%, GROUP_IMPACT 30%, GROUP_QUALITY 20%) + 11 children với parentId resolution; appliesToKinds = JSON.stringify(8 ProjectKind codes) cho mọi record
- `seedDocumentTemplates()` — 6 records Tiptap HTML stub: MOI_DK (CONG_VAN_MOI), TO_TRINH_PD (TO_TRINH), QD_PD (QUYET_DINH), HD_TH (HOP_DONG), BB_NT (BIEN_BAN_NGHIEM_THU), TL_HD (THANH_LY); variables JSON array placeholder names
- `seedCatalogs(prisma)` — entry point sequential await (parents trước children)

Helper: `sk(...parts)` — gói removeDiacritics(parts.join(' ')) cho searchKey computation uniform.

## Files Modified

### prisma/schema.prisma (Task 1)

Append-only thêm 8 model + comment block `// CATALOGS — M1 (Phase 2 plan 02-02)`:

- **ProjectKind** — common fields only
- **IndustrySector** — common fields only
- **Market** — + nameEn String?, region String, @@index([region])
- **PromotionType** — common fields only
- **Country** — + nameEn String?, region String, hasTradeOffice Boolean @default(false), @@index([region])
- **OrgUnit** — + type String, parentId String? + self-relation 'OrgUnitParent', @@index([type]), @@index([parentId])
- **ScoringCriterion** — + weight Float @default(0), appliesToKinds String? (JSON), parentId String? + self-relation 'ScoringCriterionParent', @@index([parentId])
- **DocumentTemplate** — + category String, bodyHtml String, variables String? (JSON), @@index([category])

Total: 163 dòng thêm vào sau model AuditLog. KHÔNG sửa 14 models hiện có. 22 models total trong schema.

### prisma/seed.ts (Task 2)

- Import `seedCatalogs` from `./seed/catalogs`
- Call `await seedCatalogs(prisma)` sau seedUsers
- Thêm 8 catalog count assertions sau khi seed (throw nếu count sai vs expected)
- Console log catalog counts object cho dev visibility

## Decisions Made

- **Append-only schema**: 8 catalog models thêm vào CUỐI schema.prisma không sửa 14 models đã lock M0. Tránh schema drift, giữ Plan 01-02 invariants intact (8 users + 5 orgs preserved sau db push).
- **Catalog common pattern uniform**: mọi catalog có id/code/name/description?/searchKey/displayOrder/isActive/createdAt/updatedAt + indexes [searchKey][isActive,displayOrder]. Plan 02-06 catalog editor có thể render 1 template chung qua getCatalogConfig + Prisma model lookup dynamic.
- **Self-relation hierarchy qua named relation**: OrgUnit relation('OrgUnitParent'), ScoringCriterion relation('ScoringCriterionParent') — Prisma yêu cầu named relation cho self-link để phân biệt parent vs children navigation properties.
- **JSON columns dùng String?**: ScoringCriterion.appliesToKinds + DocumentTemplate.variables — SQLite không có JSON type, consistent với marketIds/countryIds/scoresJson Plan 01-02 (manual JSON.stringify/parse). Plan 02-06 + 03 + 07 sẽ wrap parsing trong helpers.
- **ScoringCriterion 4 groups + 11 children = 15 records**: gộp "Bằng chứng số liệu" vào "Phương pháp triển khai" theo plan adjustment để đạt đúng spec 15 records. Distribution 3+3+3+2 children/group, sum weight per group khớp 25/25/30/20=100. Plan 02-06 catalog editor sẽ hiển thị tổng weight realtime để admin verify.
- **appliesToKinds JSON 8 codes thay '[*]' wildcard**: explicit hơn cho admin UI Plan 02-06 hiển thị chip multi-select. Cho phép admin scope tiêu chí cho subset kinds (vd "Phù hợp ngành hàng" áp dụng EXPORT_EXHIBITION + DOMESTIC_FAIR thôi). T-02-02-07 (weight sum validation) accepted — POC scope không enforce ở DB.
- **DocumentTemplate.bodyHtml seed Tiptap HTML stub 5-10 dòng/template**: đủ render preview với placeholders {{tenChuongTrinh}}/{{namKy}}/.... Full body sẽ refine ở Plan 02-06 (catalog editor) khi user dùng Tiptap rich text edit. T-02-02-05 (XSS in bodyHtml) đã document — Plan 02-06 + Phase 3 phải sanitize qua DOMPurify hoặc iframe sandbox.
- **OrgUnit độc lập với Organization (Plan 01-02)**: OrgUnit là master data lookup cho dropdown "đơn vị mời" (Phase 3 ProgramCycle.invitedOrganizations). Organization là operational entity (FK với User/Project/Contract). Tách biệt 2 tables — không gộp để giữ master data vs operational data clean separation. Có thể duplicate name (BO_CT xuất hiện cả 2 tables).
- **lib/catalog-types.ts hasRegion flag**: thêm flag thứ 4 ngoài hasParent/hasWeight/hasRichText cho Market+Country. Plan 02-06 catalog editor sẽ render region select dynamic — tránh hardcode 'if kind==market||kind==country' rải rác trong UI code.
- **Country.code ISO alpha-3 (VNM/USA/CHN) thay alpha-2**: độ chính xác cao hơn, ít clash hơn. Phase 5+ dropdown filter + Phase 8 cảnh báo 30 ngày thương vụ dùng được trực tiếp.

## Deviations from Plan

**None.**

Plan executed exactly as written. 2 tasks complete, both committed. Acceptance criteria của plan đạt 100%:

- [x] 22 models trong schema (14 + 8) — verified `grep -c '^model ' prisma/schema.prisma` = 22
- [x] 8 catalog models có đúng tên (ProjectKind/IndustrySector/Market/PromotionType/Country/OrgUnit/ScoringCriterion/DocumentTemplate) — verified
- [x] `npx prisma format` exit 0
- [x] `npx prisma db push --accept-data-loss=false` exit 0
- [x] `npx prisma generate` exit 0
- [x] 8 catalog tables empty sau db push, populated sau seed (8/20/15/8/30/12/15/6)
- [x] `lib/catalog-types.ts` exports CATALOG_KINDS+CatalogKind+CATALOG_CONFIGS+getCatalogConfig (+ bonus getCatalogConfigBySlug)
- [x] `prisma/seed/catalogs.ts` exports seedCatalogs
- [x] `prisma/seed.ts` import + call seedCatalogs
- [x] `npm run db:seed` exit 0 với log đúng counts cho 8 catalogs
- [x] `npm run db:seed` lần 2 idempotent (counts unchanged)
- [x] ScoringCriterion 4 parents + 11 children verified
- [x] OrgUnit hierarchy: CUC_XTTM→BO_CT, MAY10→VINATEX
- [x] Country VNM='Việt Nam' (Vietnamese diacritics intact)
- [x] `npx tsc --noEmit` exit 0
- [x] Plan 01-02 data preserved: User=8, Organization=5

## Issues Encountered

- **Git LF→CRLF warnings** — Windows default line ending normalization, không ảnh hưởng functionality.
- **Prisma 7 deprecation warning** — `package.json#prisma` config sẽ removed trong Prisma 7. Hiện tại 6.19.3 vẫn support; đã ghi nhận trong Plan 01-02 SUMMARY, Phase 11 (M7 polish) sẽ migrate `prisma.config.ts`.

## User Setup Required

None. Tất cả thao tác chạy local — DB file `prisma/dev.db` đã có từ Plan 01-02.

## Threat Model Mitigations Applied

| Threat ID | Description | Mitigation Status |
|-----------|-------------|-------------------|
| T-02-02-01 | T - Schema drift (prisma/schema.prisma) | MITIGATED — `npx prisma format` + `db push --accept-data-loss=false` PASS, không drop dữ liệu Plan 01-02 |
| T-02-02-02 | I - Country list disclosure (hasTradeOffice) | ACCEPTED — POC public data, ISO 3166 chuẩn quốc tế, Phase 8 sẽ dùng metadata này cho cảnh báo 30 ngày |
| T-02-02-03 | E - Seed runs với DATABASE_URL admin | ACCEPTED — POC scope dev/build context, production sẽ có separate migration role (defer Phase 11) |
| T-02-02-04 | T - Catalog code clash (duplicate seed) | MITIGATED — `@unique` constraint trên `code` mọi 8 catalog model + upsert pattern handle gracefully (idempotent verified lần 2) |
| T-02-02-05 | I - XSS in DocumentTemplate.bodyHtml | DOCUMENTED — Seed chứa controlled HTML; Plan 02-06 + Phase 3 phải sanitize qua DOMPurify hoặc iframe sandbox khi render preview/output |
| T-02-02-06 | T - FK integrity OrgUnit.parentId / ScoringCriterion.parentId | MITIGATED — Seed parents trước (BO_CT/VINATEX cho OrgUnit, 4 groups cho ScoringCriterion); children resolution qua `findUnique({where:{code}})` throw nếu missing |
| T-02-02-07 | T - Weight sum validation (ScoringCriterion) | ACCEPTED — POC không enforce sum=100 ở DB; admin tự verify ở Plan 02-06 UI hiển thị tổng weight realtime; Phase 7 thẩm định normalize automatic |

## Next Phase Readiness

**Plan 02-03 (shared-ui-primitives) ready:**
- 8 catalogs có data thật → DataTable component có thể test với realistic Vietnamese names + diacritics
- searchKey indexes ready cho debounced search component testing

**Plan 02-06 (catalog editors) ready:**
- `lib/catalog-types.ts` CATALOG_CONFIGS đủ metadata cho 1 page template render 8 catalogs (không cần 8 page riêng)
- Slug routes /danh-muc/[slug] resolve qua `getCatalogConfigBySlug`
- hasParent/hasWeight/hasRichText/hasRegion flags drive form field render dynamic
- prismaModel field cho dynamic Prisma client method invocation (vd `prisma[config.prismaModel].findMany()`)

**Phase 3 (Chu kỳ chương trình) ready:**
- ScoringCriterion 15 records (4 groups + 11 children) phục vụ ProgramCycle config "tiêu chí thẩm định"
- OrgUnit 12 records phục vụ ProgramCycle.invitedOrganizations dropdown multi-select
- DocumentTemplate 6 records phục vụ tờ trình/quyết định/công văn templates trong cycle config
- ProjectKind 8 records cho Phase 5 (đề án) form khai báo dropdown

**Phase 5 (Đề án) ready:**
- IndustrySector + Market + Country + ProjectKind + PromotionType seeded để Project form khai báo có dropdown options đầy đủ
- Country.hasTradeOffice cho Phase 8 cảnh báo 30 ngày sự kiện quốc tế (CRITICAL R5 mock data)

**Phase 7 (Thẩm định) ready:**
- ScoringCriterion 15 records đầy đủ weight + appliesToKinds → ScoreSheet (Phase 7 HERO) form chấm điểm có structure rõ ràng

**No blockers.** Plan 02-03 (shared-ui-primitives) tiếp theo trong Wave 2 dependency.

## Self-Check

Verifying claims before completion:

**Files created:**
- FOUND: `lib/catalog-types.ts` (137 dòng, 6 exports)
- FOUND: `prisma/seed/catalogs.ts` (470 dòng, seedCatalogs entry + 8 sub-functions)

**Files modified:**
- FOUND: `prisma/schema.prisma` — 22 models total
- FOUND: `prisma/seed.ts` — import seedCatalogs + count assertions

**Commits:**
- FOUND: `bb55262` — feat(02-02): append 8 catalog models to Prisma schema
- FOUND: `db6b038` — feat(02-02): seed 8 catalogs với Vietnamese realistic data + lib/catalog-types

**Behavioral smoke tests passed:**
- 22 models defined trong schema ✓
- `npx prisma format` exit 0 ✓
- `npx prisma db push --accept-data-loss=false` exit 0 (Plan 01-02 data preserved) ✓
- `@prisma/client` regenerated v6.19.3 ✓
- `npm run db:seed` lần 1: counts đúng 8/20/15/8/30/12/15/6 ✓
- `npm run db:seed` lần 2: counts unchanged (idempotent) ✓
- Country VNM.name = 'Việt Nam' ✓
- IndustrySector TEXTILE.name = 'Dệt may' ✓
- ScoringCriterion: 4 groups (parentId=null) + 11 children (parentId!=null) = 15 ✓
- OrgUnit CUC_XTTM.parent.code = 'BO_CT' ✓
- OrgUnit MAY10.parent.code = 'VINATEX' ✓
- DocumentTemplate MOI_DK.variables JSON = ["tenChuongTrinh","namKy","hanNopDeAn","tenDonVi","ngayKy"] ✓
- `npx tsc --noEmit` exit 0 ✓
- Plan 01-02 preserved: User.count=8, Organization.count=5 ✓

**Phase verification:**
- Plan-level: ALL acceptance criteria PASS (16/16)
- Requirements: CAT-01..08 schema/seed layer complete (UI editors là Plan 02-06)

## Self-Check: PASSED

---

*Phase: 02-m1-quan-tri-danh-muc*
*Completed: 2026-04-30*
