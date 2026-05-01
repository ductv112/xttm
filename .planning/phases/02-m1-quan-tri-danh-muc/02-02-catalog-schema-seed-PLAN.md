---
phase: 02-m1-quan-tri-danh-muc
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/seed.ts
  - prisma/seed/catalogs.ts
  - lib/catalog-types.ts
autonomous: true
requirements: [CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08]
tags: [prisma, schema-extension, catalog, seed, vietnamese-data]

must_haves:
  truths:
    - "8 bảng catalog Prisma đầy đủ tồn tại trong DB sau `npm run db:push`: ProjectKind, IndustrySector, Market, PromotionType, Country, OrgUnit, ScoringCriterion, DocumentTemplate"
    - "Mỗi bảng có ít nhất 8 records (loại đề án 8, ngành hàng 20, thị trường 15, loại hình 8, quốc gia 30, đơn vị 12, tiêu chí 15, mẫu văn bản 6) sau `npm run db:seed`"
    - "Seed idempotent: chạy 2 lần liên tiếp không nhân bản record (counts không tăng)"
    - "Mỗi catalog có cột `searchKey` diacritics-removed cho search Vietnamese, `isActive` boolean default true cho soft-deactivate, `displayOrder` int cho sort UI"
    - "ScoringCriterion có cột `weight` (Float 1-100), `appliesToKinds` (JSON string các project kind áp dụng), `parentId` (self-relation cho hierarchy)"
    - "DocumentTemplate có cột `category` (CONG_VAN_MOI/TO_TRINH/QUYET_DINH/HOP_DONG/BIEN_BAN_NGHIEM_THU/THANH_LY), `bodyHtml` (Tiptap HTML output), `variables` (JSON array of placeholder names)"
    - "lib/catalog-types.ts export discriminated unions cho CatalogKind + helper getCatalogConfig(kind) trả tên VN + Prisma model name + columns"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "8 catalog models append vào schema hiện có (KHÔNG động vào 14 models đã lock)"
      contains: "model ProjectKind\nmodel IndustrySector\nmodel Market\nmodel PromotionType\nmodel Country\nmodel OrgUnit\nmodel ScoringCriterion\nmodel DocumentTemplate"
    - path: "prisma/seed/catalogs.ts"
      provides: "seedCatalogs() function gọi từ prisma/seed.ts entry, idempotent qua upsert"
      exports: ["seedCatalogs"]
    - path: "prisma/seed.ts"
      provides: "Updated entry point gọi seedOrganizations + seedUsers + seedCatalogs theo dependency order"
      contains: "seedCatalogs"
    - path: "lib/catalog-types.ts"
      provides: "Type-safe catalog discriminated union + per-kind config (label, model, columns, special fields)"
      exports: ["CatalogKind", "CATALOG_KINDS", "getCatalogConfig", "CatalogConfig"]
  key_links:
    - from: "prisma/seed.ts"
      to: "prisma/seed/catalogs.ts"
      via: "import seedCatalogs"
      pattern: "import.*seedCatalogs.*from.*catalogs"
    - from: "prisma/seed/catalogs.ts"
      to: "lib/vi-search.ts removeDiacritics"
      via: "compute searchKey on insert"
      pattern: "removeDiacritics"
    - from: "ScoringCriterion model"
      to: "ProjectKind model"
      via: "appliesToKinds JSON of ProjectKind.code values"
      pattern: "appliesToKinds"
---

<objective>
Mở rộng Prisma schema thêm 8 catalog models và seed dữ liệu thật để mọi phase nghiệp vụ phía sau có dropdown options hợp lệ. Schema lock M0 đã scaffold 14 models cốt lõi (User/Project/Cycle/...); Phase 2 thêm 8 master data tables và đầy đủ seed records realistic theo CAT-01..08.

Purpose: Phase 3 (Chu kỳ chương trình) cần `ScoringCriterion` để cấu hình tiêu chí thẩm định; Phase 5 (Đề án) cần `ProjectKind` + `IndustrySector` + `Market` + `Country` cho form khai báo; Phase 7 cần `DocumentTemplate` cho tờ trình; mọi phase cần `OrgUnit` cho dropdown đơn vị mời. Seed data với tên Vietnamese thật là điều kiện để Plan 06 catalog editor có gì để hiển thị.

Output: 1 schema file extended (8 models append), 1 seed file (`prisma/seed/catalogs.ts`), 1 types file (`lib/catalog-types.ts`), entry point seed.ts updated.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md
@.planning/research/SUMMARY.md
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-02-prisma-schema-seed-SUMMARY.md
@CLAUDE.md
@prisma/schema.prisma
@prisma/seed.ts
@prisma/seed/organizations.ts
@prisma/seed/users.ts
@prisma/seed/helpers.ts
@lib/vi-search.ts

<interfaces>
From prisma/schema.prisma (already exists, append-only):
```prisma
// 14 models đã lock — KHÔNG SỬA: User, Role, Permission, RolePermission,
// Organization, OrganizationProfile, ProgramCycle, Project, EvaluationCouncil,
// ScoreSheet, Contract, Report, Attachment, AuditLog
```

From prisma/seed.ts (Plan 01-02):
```typescript
async function main() {
  await seedOrganizations();
  await seedUsers();
  // ADD: await seedCatalogs();
}
```

From prisma/seed/helpers.ts (Plan 01-02):
```typescript
export async function hashPassword(plain: string): Promise<string>;
export function logSeedStep(name: string, count: number): void;
```

From lib/vi-search.ts:
```typescript
export function removeDiacritics(s: string): string;
```
</interfaces>

<vietnamese_data_specs>
Mock data Vietnamese realistic — exact records to seed (per CONTEXT.md decisions + CLAUDE.md mock data realistic standard).

### CAT-01 ProjectKind (8 records)
| code | name (VN) | description |
|------|-----------|-------------|
| EXPORT_EXHIBITION | Triển lãm xuất khẩu | Triển lãm/hội chợ tại nước ngoài quảng bá hàng Việt |
| INTL_CONFERENCE | Hội nghị quốc tế | Hội nghị/diễn đàn quốc tế về xúc tiến thương mại |
| DOMESTIC_FAIR | Hội chợ trong nước | Hội chợ thương mại tổ chức tại Việt Nam |
| TRADE_DELEGATION_OUT | Đoàn giao thương ra nước ngoài | Đoàn doanh nghiệp Việt đi khảo sát thị trường |
| TRADE_DELEGATION_IN | Đoàn giao thương vào Việt Nam | Đón đoàn nước ngoài vào tìm hiểu hàng Việt |
| TRADE_INFO_EXPORT | Thông tin TM tuyên truyền xuất khẩu | Truyền thông quảng bá hàng Việt ra nước ngoài |
| TRADE_INFO_DOMESTIC | Tuyên truyền trong nước | Tuyên truyền tiêu dùng hàng Việt tại Việt Nam |
| TRAINING | Đào tạo | Đào tạo kỹ năng XTTM cho doanh nghiệp |

### CAT-02 IndustrySector (20 records)
| code | name |
|------|------|
| TEXTILE | Dệt may |
| FOOTWEAR | Da giày |
| WOOD | Gỗ và sản phẩm gỗ |
| SEAFOOD | Thủy sản |
| AGRICULTURE | Nông sản |
| COFFEE | Cà phê |
| RUBBER | Cao su |
| RICE | Gạo |
| STEEL | Sắt thép |
| ELECTRONICS | Điện tử |
| HANDICRAFT | Thủ công mỹ nghệ |
| CASHEW | Hạt điều |
| PEPPER | Hồ tiêu |
| FRUITS | Rau quả |
| TEA | Chè |
| GARMENT | May mặc |
| LEATHER | Da và sản phẩm da |
| MECHANICAL | Cơ khí |
| PLASTIC | Nhựa |
| FOOD_PROCESSING | Chế biến thực phẩm |

### CAT-03 Market (15 records — region-grouped)
| code | name | region |
|------|------|--------|
| EU | Liên minh châu Âu | EUROPE |
| US | Hoa Kỳ | AMERICAS |
| CHINA | Trung Quốc | ASIA |
| JAPAN | Nhật Bản | ASIA |
| KOREA | Hàn Quốc | ASIA |
| ASEAN | ASEAN | ASIA |
| MIDDLE_EAST | Trung Đông | ASIA |
| INDIA | Ấn Độ | ASIA |
| AUSTRALIA | Úc - New Zealand | OCEANIA |
| RUSSIA | Liên bang Nga | EUROPE |
| AFRICA | Châu Phi | AFRICA |
| LATAM | Mỹ Latinh | AMERICAS |
| UK | Anh Quốc | EUROPE |
| CANADA | Canada | AMERICAS |
| BRAZIL | Brazil | AMERICAS |

### CAT-04 PromotionType (8 records — loại hình XTTM)
| code | name |
|------|------|
| TRADE_FAIR | Hội chợ - triển lãm |
| BUSINESS_MATCHING | Kết nối giao thương |
| MARKET_RESEARCH | Nghiên cứu thị trường |
| BRAND_PROMOTION | Quảng bá thương hiệu |
| EXPORT_PROMOTION | Xúc tiến xuất khẩu |
| INVESTMENT_PROMOTION | Xúc tiến đầu tư |
| TRADE_TRAINING | Đào tạo XTTM |
| TRADE_COMMUNICATION | Truyền thông XTTM |

### CAT-05 Country (30 records ISO-3166)
Format: code (alpha-3 ISO), name (VN), region, hasTradeOffice (boolean — Có thương vụ Việt tại đó?)
- VNM Việt Nam ASIA false
- USA Hoa Kỳ AMERICAS true
- CHN Trung Quốc ASIA true
- JPN Nhật Bản ASIA true
- KOR Hàn Quốc ASIA true
- DEU Đức EUROPE true
- FRA Pháp EUROPE true
- GBR Vương quốc Anh EUROPE true
- ITA Italia EUROPE true
- ESP Tây Ban Nha EUROPE true
- NLD Hà Lan EUROPE true
- BEL Bỉ EUROPE false
- RUS Liên bang Nga EUROPE true
- IND Ấn Độ ASIA true
- IDN Indonesia ASIA true
- THA Thái Lan ASIA true
- MYS Malaysia ASIA true
- SGP Singapore ASIA true
- PHL Philippines ASIA false
- AUS Úc OCEANIA true
- NZL New Zealand OCEANIA false
- CAN Canada AMERICAS true
- MEX Mexico AMERICAS false
- BRA Brazil AMERICAS true
- ARG Argentina AMERICAS false
- ARE UAE ASIA true
- SAU Ả Rập Xê Út ASIA true
- ZAF Nam Phi AFRICA true
- EGY Ai Cập AFRICA true
- TUR Thổ Nhĩ Kỳ ASIA true

### CAT-06 OrgUnit (12 records — danh mục đơn vị, type-grouped)
| code | name | type | parentCode |
|------|------|------|-----------|
| BO_CT | Bộ Công Thương | MINISTRY | null |
| CUC_XTTM | Cục Xúc tiến Thương mại | DEPARTMENT | BO_CT |
| VITAS | Hiệp hội Dệt may Việt Nam | ASSOCIATION | null |
| LEFASO | Hiệp hội Da giày - Túi xách Việt Nam | ASSOCIATION | null |
| VINATEX | Tập đoàn Dệt May Việt Nam | ENTERPRISE | null |
| VASEP | Hiệp hội Chế biến và Xuất khẩu Thủy sản Việt Nam | ASSOCIATION | null |
| VCCI | Liên đoàn Thương mại và Công nghiệp Việt Nam | ASSOCIATION | null |
| VIFOREST | Hiệp hội Gỗ và Lâm sản Việt Nam | ASSOCIATION | null |
| VICOFA | Hiệp hội Cà phê - Ca cao Việt Nam | ASSOCIATION | null |
| VFA | Hiệp hội Lương thực Việt Nam | ASSOCIATION | null |
| MAY10 | Tổng Công ty May 10 | ENTERPRISE | VINATEX |
| INST_TRADE | Viện Nghiên cứu Thương mại | RESEARCH_INSTITUTE | BO_CT |

Note: 5 đầu (BO_CT/CUC_XTTM/VITAS/LEFASO/VINATEX) đã trong Organization seed Plan 01-02 — OrgUnit table riêng cho danh mục lookup, có thể duplicate name (không FK với Organization). Decision: OrgUnit là master data dropdown chọn invited unit cho Phase 3, độc lập với Organization (table operational).

### CAT-07 ScoringCriterion (15 records — bộ tiêu chí thẩm định)
Hierarchy 2 cấp (parent group + child criterion). Tổng weight cấp con = 100.

Group 1: TÍNH PHÙ HỢP (parentId = null, weight = 25)
- Phù hợp định hướng XTTMQG (weight 10)
- Phù hợp ngành hàng ưu tiên (weight 8)
- Phù hợp địa bàn ưu tiên (weight 7)

Group 2: TÍNH KHẢ THI (weight 25)
- Năng lực đơn vị chủ trì (weight 10)
- Tính khả thi tài chính (weight 8)
- Tính khả thi tiến độ (weight 7)

Group 3: HIỆU QUẢ DỰ KIẾN (weight 30)
- Hiệu quả kinh tế (weight 12)
- Số doanh nghiệp tham gia (weight 10)
- Tác động lan tỏa (weight 8)

Group 4: CHẤT LƯỢNG ĐỀ XUẤT (weight 20)
- Mục tiêu rõ ràng đo lường được (weight 8)
- Phương pháp triển khai phù hợp (weight 7)
- Bằng chứng số liệu (weight 5)

→ 4 group + 12 child criterion = 16 records but spec said 15; merge "Tác động lan tỏa" + "Hiệu quả kinh tế" overlap → final 15: 4 groups + 11 children. Adjust: drop "Bằng chứng số liệu" (gộp vào "Phương pháp"). Final 15.

`appliesToKinds`: tất cả 15 áp dụng cho tất cả 8 ProjectKind (set `["*"]` hoặc list 8 codes — quyết định: list 8 codes for explicit).

### CAT-08 DocumentTemplate (6 records — mẫu văn bản)
| code | name | category | variables |
|------|------|----------|-----------|
| MOI_DK | Công văn mời đăng ký đề án | CONG_VAN_MOI | tenChuongTrinh, namKy, hanNopDeAn, tenDonVi, ngayKy |
| TO_TRINH_PD | Tờ trình phê duyệt đề án | TO_TRINH | namKy, soToTrinh, ngayLap, danhSachDeAn, tongKinhPhi |
| QD_PD | Quyết định phê duyệt đề án | QUYET_DINH | soQuyetDinh, ngayKy, nguoiKy, tenChuongTrinh, namKy, danhSachDeAn |
| HD_TH | Hợp đồng thực hiện đề án | HOP_DONG | soHopDong, ngayKy, tenDonVi, tenDeAn, kinhPhi, thoiHan |
| BB_NT | Biên bản nghiệm thu đề án | BIEN_BAN_NGHIEM_THU | soBienBan, ngayLap, tenDeAn, tenDonVi, ketQua |
| TL_HD | Hợp đồng thanh lý | THANH_LY | soThanhLy, ngayKy, soHopDongGoc, tenDonVi |

`bodyHtml`: Tiptap HTML content stub với `<p>{{tenChuongTrinh}}</p>` placeholders — đầy đủ template body sẽ refine trong Plan 02-06 (catalog editor) khi user edit. Seed cho phép có nội dung mẫu để render preview.
</vietnamese_data_specs>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Append 8 catalog models vào prisma/schema.prisma + db push</name>
  <files>prisma/schema.prisma</files>
  <read_first>
    - prisma/schema.prisma toàn bộ (xem cấu trúc 14 models hiện có, indexes pattern, naming convention)
    - .planning/phases/01-m0-bootstrap-h-t-ng/01-02-prisma-schema-seed-SUMMARY.md (key-decisions: String thay enum, Float thay Decimal, searchKey pattern)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (Tiêu chí form đặc biệt, Mẫu văn bản editor)
  </read_first>
  <action>
    Append 8 models VÀO CUỐI prisma/schema.prisma (KHÔNG sửa 14 models hiện có). Thêm comment block `// CATALOGS — M1 (Phase 2 plan 02)` ở header section.

    Mỗi model có pattern chung:
    - `id String @id @default(cuid())`
    - `code String @unique` — slug-style mã (vd "EXPORT_EXHIBITION", "VITAS")
    - `name String` — tên hiển thị tiếng Việt
    - `description String?`
    - `searchKey String @default("")` — diacritics-removed
    - `displayOrder Int @default(0)` — sort UI
    - `isActive Boolean @default(true)` — soft deactivate
    - `createdAt DateTime @default(now())`
    - `updatedAt DateTime @updatedAt`
    - `@@index([searchKey])` cho VN search
    - `@@index([isActive, displayOrder])` cho list view filter+sort

    **Special fields per model:**
    - `Market`: thêm `region String` (EUROPE/ASIA/AMERICAS/AFRICA/OCEANIA), `nameEn String?`
    - `Country`: thêm `region String`, `hasTradeOffice Boolean @default(false)`, `code String @unique` là ISO alpha-3
    - `OrgUnit`: thêm `type String` (MINISTRY/DEPARTMENT/ASSOCIATION/ENTERPRISE/RESEARCH_INSTITUTE/OTHER), `parentId String?` self-relation `name: "OrgUnitParent"`
    - `ScoringCriterion`: thêm `weight Float @default(0)`, `appliesToKinds String? // JSON array of ProjectKind.code`, `parentId String?` self-relation `name: "ScoringCriterionParent"` (cho group/child hierarchy)
    - `DocumentTemplate`: thêm `category String` (CONG_VAN_MOI/TO_TRINH/QUYET_DINH/HOP_DONG/BIEN_BAN_NGHIEM_THU/THANH_LY), `bodyHtml String` (Tiptap output), `variables String? // JSON array of placeholder names`
    - `ProjectKind`, `IndustrySector`, `PromotionType`: chỉ pattern chung, không special fields

    Sau khi append: chạy `npx prisma format` để format → `npx prisma db push` để sync DB → `npx prisma generate` để regen client.

    Note: `db push --accept-data-loss=false` (không xóa data Plan 01-02 đã seed). Mới thêm tables không xóa data.
  </action>
  <acceptance_criteria>
    - `grep -c "^model " prisma/schema.prisma` returns 22 (14 cũ + 8 mới)
    - `grep -E "^model (ProjectKind|IndustrySector|Market|PromotionType|Country|OrgUnit|ScoringCriterion|DocumentTemplate)" prisma/schema.prisma` returns 8 lines
    - `npx prisma format` exit 0 (schema valid)
    - `npx prisma db push --accept-data-loss=false` exit 0
    - `npx prisma generate` exit 0
    - Sau db push: `node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); Promise.all(['projectKind','industrySector','market','promotionType','country','orgUnit','scoringCriterion','documentTemplate'].map(m => p[m].count())).then(c => console.log(c)).finally(()=>p.\\$disconnect())"` returns 8 zeros (tables exist, empty)
    - User+Organization counts vẫn 8/5 (không mất data Plan 01-02)
  </acceptance_criteria>
  <verify>
    <automated>npx prisma format && npx prisma db push --accept-data-loss=false && npx prisma generate</automated>
  </verify>
  <done>22 models trong schema (14 + 8), DB synced, Prisma Client regenerated với 8 catalog typed models, data cũ Plan 01-02 không mất.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Seed 8 catalogs với Vietnamese realistic data + lib/catalog-types.ts</name>
  <files>prisma/seed/catalogs.ts, prisma/seed.ts, lib/catalog-types.ts</files>
  <read_first>
    - prisma/seed.ts (entry point hiện có)
    - prisma/seed/organizations.ts (seed pattern reference: array → map → upsert)
    - prisma/seed/users.ts (idempotent upsert example)
    - lib/vi-search.ts (removeDiacritics)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (CAT decisions — Tiêu chí weight/parent, DocumentTemplate variables)
    - This plan's <vietnamese_data_specs> section (8 catalog data tables)
  </read_first>
  <action>
    **`lib/catalog-types.ts`** — type-safe catalog discriminated union:
    ```typescript
    export const CATALOG_KINDS = [
      'project-kind', 'industry-sector', 'market', 'promotion-type',
      'country', 'org-unit', 'scoring-criterion', 'document-template'
    ] as const;
    export type CatalogKind = (typeof CATALOG_KINDS)[number];

    export type CatalogConfig = {
      kind: CatalogKind;
      label: string;          // "Loại đề án"
      labelPlural: string;    // "Loại đề án" (VN không phân biệt số nhiều)
      slug: string;           // URL slug "loai-de-an"
      prismaModel: string;    // "projectKind" (camelCase as Prisma client method)
      requirementId: string;  // "CAT-01"
      hasParent: boolean;     // OrgUnit + ScoringCriterion = true
      hasWeight: boolean;     // ScoringCriterion only
      hasRichText: boolean;   // DocumentTemplate only
    };

    export const CATALOG_CONFIGS: Record<CatalogKind, CatalogConfig> = {
      'project-kind': { kind:'project-kind', label:'Loại đề án', labelPlural:'Loại đề án',
        slug:'loai-de-an', prismaModel:'projectKind', requirementId:'CAT-01',
        hasParent:false, hasWeight:false, hasRichText:false },
      // ... 7 more entries — COMPLETE all 8 with exact values
    };

    export function getCatalogConfig(kind: CatalogKind): CatalogConfig {
      return CATALOG_CONFIGS[kind];
    }
    ```
    Slug map (URL):
    - project-kind → loai-de-an
    - industry-sector → nganh-hang
    - market → thi-truong
    - promotion-type → loai-hinh-xttm
    - country → quoc-gia
    - org-unit → don-vi
    - scoring-criterion → tieu-chi-cham-diem
    - document-template → mau-van-ban

    **`prisma/seed/catalogs.ts`** — 1 file với 8 sub-functions:
    ```typescript
    import { prisma } from '../../lib/prisma';
    import { removeDiacritics } from '../../lib/vi-search';
    import { logSeedStep } from './helpers';

    async function seedProjectKinds() {
      const data = [/* 8 records từ vietnamese_data_specs */];
      for (const [i, item] of data.entries()) {
        await prisma.projectKind.upsert({
          where: { code: item.code },
          update: { ...item, searchKey: removeDiacritics(item.name + ' ' + item.code), displayOrder: i },
          create: { ...item, searchKey: removeDiacritics(item.name + ' ' + item.code), displayOrder: i, isActive: true },
        });
      }
      const count = await prisma.projectKind.count();
      logSeedStep('ProjectKind', count);
    }
    // ... 7 more sub-functions
    export async function seedCatalogs() {
      await seedProjectKinds();
      await seedIndustrySectors();
      await seedMarkets();
      await seedPromotionTypes();
      await seedCountries();
      await seedOrgUnits();
      await seedScoringCriteria(); // parents first, then children with parentId resolved via lookup
      await seedDocumentTemplates();
    }
    ```

    Seed records đầy đủ theo `<vietnamese_data_specs>` block:
    - 8 ProjectKind (CAT-01)
    - 20 IndustrySector (CAT-02)
    - 15 Market (CAT-03) với region
    - 8 PromotionType (CAT-04)
    - 30 Country (CAT-05) ISO codes + region + hasTradeOffice
    - 12 OrgUnit (CAT-06) với type + parentId resolution (BO_CT seeded first, sau đó CUC_XTTM với parentId=lookup BO_CT.id; tương tự MAY10 → VINATEX)
    - 15 ScoringCriterion (CAT-07): seed 4 group parent records first (parentId=null), sau đó 11 children với parentId resolved qua `findUnique({where:{code}})`. `appliesToKinds: JSON.stringify(['EXPORT_EXHIBITION','INTL_CONFERENCE',...all 8 codes])` cho mỗi record.
    - 6 DocumentTemplate (CAT-08): bodyHtml stub `<h2>{{tenChuongTrinh}}</h2><p>Mời Quý đơn vị tham gia chương trình {{tenChuongTrinh}} năm {{namKy}}...</p>` (5-10 dòng/template), variables là JSON array tên placeholder.

    **`prisma/seed.ts`** — update entry point:
    ```typescript
    import { seedOrganizations } from './seed/organizations';
    import { seedUsers } from './seed/users';
    import { seedCatalogs } from './seed/catalogs'; // NEW

    async function main() {
      console.time('seed');
      await seedOrganizations();
      await seedUsers();
      await seedCatalogs(); // NEW — after orgs/users (no FK dep but keep order)
      console.timeEnd('seed');
    }
    ```

    Idempotent: chạy `npm run db:seed` 2 lần → counts bằng nhau (8/20/15/8/30/12/15/6).
  </action>
  <acceptance_criteria>
    - File `lib/catalog-types.ts` exports đúng 4 names: `CATALOG_KINDS`, `CatalogKind`, `CATALOG_CONFIGS`, `getCatalogConfig` (`grep "^export" lib/catalog-types.ts | wc -l` ≥ 4)
    - File `prisma/seed/catalogs.ts` exports `seedCatalogs` (`grep "^export.*seedCatalogs" prisma/seed/catalogs.ts` returns 1)
    - File `prisma/seed.ts` import seedCatalogs (`grep "seedCatalogs" prisma/seed.ts` returns ≥2 matches: import + call)
    - `npm run db:seed` exit 0, log shows: `ProjectKind 8`, `IndustrySector 20`, `Market 15`, `PromotionType 8`, `Country 30`, `OrgUnit 12`, `ScoringCriterion 15`, `DocumentTemplate 6`
    - `npm run db:seed` chạy lần 2 idempotent: counts unchanged (verify via `node -e "..."` count query)
    - SQLite query: `prisma.scoringCriterion.findMany({where:{parentId:null}})` returns 4 rows (4 group cha)
    - SQLite query: `prisma.scoringCriterion.findMany({where:{parentId:{not:null}}})` returns 11 rows
    - `prisma.country.findFirst({where:{code:'VNM'}})` returns record with `name='Việt Nam'`
    - `npx tsc --noEmit` exit 0
  </acceptance_criteria>
  <verify>
    <automated>npm run db:seed && npx tsc --noEmit</automated>
  </verify>
  <done>8 catalogs seeded với đúng counts, idempotent, có Vietnamese diacritics chính xác trong DB, lib/catalog-types.ts type-safe config cho Plan 06 reuse.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Build-time → DB | Seed script runs at dev/CI time với DATABASE_URL từ .env; trust boundary chỉ giữa CI runner và file system |
| Future server actions → catalog tables | Plan 02-06 sẽ build CRUD UI; risk validation gaps trong update/delete |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-02-01 | T (Tampering — schema drift) | prisma/schema.prisma | mitigate | `npx prisma format` + `prisma db push --accept-data-loss=false` ở task 1 — fail fast nếu schema invalid hoặc migration drop data |
| T-02-02-02 | I (Info disclosure — country list) | Country seed hasTradeOffice | accept | POC public data, ISO 3166 chuẩn quốc tế; hasTradeOffice là metadata phục vụ alert 30 ngày Phase 8 — không phải bí mật |
| T-02-02-03 | E (Privilege escalation) | seed runs với DATABASE_URL admin | accept | Seed chỉ run dev/build context (POC scope); production sẽ có separate migration role — defer Phase 11 |
| T-02-02-04 | T (Catalog code clash) | code unique constraint | mitigate | `@unique` constraint trên `code` cho mọi 8 catalog model — Prisma sẽ throw nếu seed duplicate; upsert pattern handle gracefully |
| T-02-02-05 | I (XSS in DocumentTemplate.bodyHtml) | seeded HTML template | mitigate | Template body chứa Tiptap HTML có khả năng XSS nếu render qua `dangerouslySetInnerHTML`; Plan 02-06 + 03 phải sanitize qua DOMPurify hoặc render qua iframe sandbox khi preview; seed này chỉ chứa HTML controlled |
| T-02-02-06 | T (FK integrity OrgUnit.parentId) | seed order | mitigate | Seed parents (BO_CT, VINATEX) trước children (CUC_XTTM, MAY10); resolution qua `findUnique` lookup, throw nếu parent missing |
| T-02-02-07 | T (Weight sum validation) | ScoringCriterion 4 groups + 11 children | accept | POC scope không enforce sum=100 ở DB level; UI Plan 02-06 sẽ hiển thị tổng weight realtime để admin tự verify; Phase 7 thẩm định sẽ tự động normalize |
</threat_model>

<verification>
- `npx prisma format` exit 0
- `npx prisma db push --accept-data-loss=false` exit 0
- `npm run db:seed` exit 0 với log đúng counts (8/20/15/8/30/12/15/6)
- `npm run db:seed` chạy lần 2 không tăng counts (idempotent)
- `npx tsc --noEmit` exit 0
- `npx prisma studio` mở trên localhost:5555 → xem 8 tables mới có đủ records
- Verify spot-check Vietnamese: `Country VNM.name === 'Việt Nam'`, `IndustrySector TEXTILE.name === 'Dệt may'`
- Verify hierarchy: `OrgUnit CUC_XTTM.parentId === OrgUnit BO_CT.id`
- Verify hierarchy: `ScoringCriterion children.length === 11`, `parents.length === 4`
- Plan 01-02 data preserved: User.count=8, Organization.count=5
</verification>

<success_criteria>
- CAT-01..08: Mọi catalog có data realistic Vietnamese đủ để Plan 02-06 build CRUD UI và mọi phase sau dropdown có options
- Idempotent seed cho dev workflow tốt (db:reset → db:push → db:seed chạy đi chạy lại không lỗi)
- lib/catalog-types.ts cho Plan 02-06 dùng làm config-driven catalog page (DRY — 1 component template render 8 catalogs)
- Reachability: Plan 02-06 (catalog editors) sẽ tạo `/danh-muc/[slug]` route — slug values từ CATALOG_CONFIGS đã định nghĩa task 2
</success_criteria>

<output>
Sau khi complete tạo `.planning/phases/02-m1-quan-tri-danh-muc/02-02-catalog-schema-seed-SUMMARY.md`
</output>
