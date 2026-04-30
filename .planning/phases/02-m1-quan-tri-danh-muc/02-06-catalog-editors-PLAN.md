---
phase: 02-m1-quan-tri-danh-muc
plan: 06
type: execute
wave: 2
depends_on: [01, 02, 03]
files_modified:
  - app/(app)/danh-muc/page.tsx
  - app/(app)/danh-muc/[slug]/page.tsx
  - app/(app)/danh-muc/[slug]/_components/CatalogPage.tsx
  - app/(app)/danh-muc/[slug]/_components/CatalogTable.tsx
  - app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx
  - app/(app)/danh-muc/[slug]/_components/ScoringCriterionForm.tsx
  - app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx
  - app/(app)/danh-muc/[slug]/_actions/list.ts
  - app/(app)/danh-muc/[slug]/_actions/upsert.ts
  - app/(app)/danh-muc/[slug]/_actions/toggle.ts
  - app/(app)/danh-muc/[slug]/_actions/delete.ts
  - app/(app)/danh-muc/[slug]/_actions/schemas.ts
autonomous: true
requirements: [CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08]
tags: [catalog, crud, sheet-drawer, soft-delete, tiptap-template, hierarchy]

must_haves:
  truths:
    - "Trang index `/danh-muc` hiển thị 8 cards (1 per catalog) với link tới `/danh-muc/{slug}`"
    - "Slugs khớp Plan 02-02 lib/catalog-types.ts: loai-de-an, nganh-hang, thi-truong, loai-hinh-xttm, quoc-gia, don-vi, tieu-chi-cham-diem, mau-van-ban"
    - "Trang catalog `/danh-muc/{slug}` dùng shared CatalogPage template (config-driven theo CatalogKind) — render DataTable với cột chung (Mã, Tên, Mô tả, Trạng thái, Thao tác) + cột đặc biệt theo kind"
    - "Click 'Thêm mới' hoặc row 'Chỉnh sửa' → mở Sheet drawer bên phải với form fields phù hợp catalog kind"
    - "Switch column 'Đang hoạt động' inline toggle đổi `isActive` qua server action — không cho hard delete catalog có FK reference (Plan 02-02 DECISION soft delete)"
    - "ScoringCriterion form: code, name, description, weight (number 1-100), parentId (Combobox cha — null = root group), appliesToKinds (MultiSelect 8 ProjectKind codes)"
    - "DocumentTemplate form: code, name, category (Select 6 categories), variables (tag input), bodyHtml (RichTextEditor với VariableMenu insert {{tenChuongTrinh}})"
    - "Country form: code (alpha-3), name, region (Select 5 regions), hasTradeOffice (Switch)"
    - "OrgUnit form: code, name, type (Select 6 types), parentId (Combobox)"
    - "Mọi mutation ghi audit log với resource='danh-muc' và metadata.catalogKind"
    - "Search debounced 300ms theo searchKey + Filter Switch isActive"
  artifacts:
    - path: "app/(app)/danh-muc/page.tsx"
      provides: "Index page với 8 catalog cards"
    - path: "app/(app)/danh-muc/[slug]/page.tsx"
      provides: "Dynamic route render CatalogPage by slug"
    - path: "app/(app)/danh-muc/[slug]/_components/CatalogPage.tsx"
      provides: "Shared template — config-driven CRUD UI cho mọi catalog kind"
    - path: "app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx"
      provides: "Sheet drawer với form switching theo kind"
    - path: "app/(app)/danh-muc/[slug]/_components/ScoringCriterionForm.tsx"
      provides: "Form đặc biệt cho CAT-07 với weight + parent + appliesToKinds"
    - path: "app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx"
      provides: "Form đặc biệt cho CAT-08 với category + Tiptap editor + VariableMenu"
    - path: "app/(app)/danh-muc/[slug]/_actions/upsert.ts"
      exports: ["upsertCatalogItem"]
    - path: "app/(app)/danh-muc/[slug]/_actions/toggle.ts"
      exports: ["toggleCatalogItem"]
    - path: "app/(app)/danh-muc/[slug]/_actions/delete.ts"
      exports: ["deleteCatalogItem"]
  key_links:
    - from: "app/(app)/danh-muc/[slug]/page.tsx"
      to: "lib/catalog-types.ts CATALOG_CONFIGS"
      via: "lookup config by slug → get prismaModel + label + special fields"
      pattern: "CATALOG_CONFIGS\\|getCatalogConfig"
    - from: "app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx"
      to: "components/shared/RichTextEditor.tsx"
      via: "Tiptap editor với variables prop"
      pattern: "RichTextEditor"
    - from: "app/(app)/danh-muc/[slug]/_actions/upsert.ts"
      to: "lib/audit.ts withAuditLog"
      via: "wrap upsert"
      pattern: "withAuditLog"
---

<objective>
Build CRUD UI cho 8 catalogs với config-driven template (1 component xử lý 8 catalogs khác nhau) reuse shared DataTable + Sheet drawer pattern. ScoringCriterion và DocumentTemplate có form đặc biệt riêng (weight + parent hierarchy; Tiptap với VariableMenu).

Purpose: CAT-01..08 là master data cho mọi phase nghiệp vụ. Plan 02-02 đã seed data đầy đủ; plan này cho admin tạo/sửa/deactivate catalog item qua UI. Approach config-driven (không phải copy paste 8 lần): 1 CatalogPage template + 2 special form variants (ScoringCriterion, DocumentTemplate).

Output: 1 index page + 1 dynamic [slug] page + 1 shared CatalogPage + 3 form components + 4 server actions + 1 schemas.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
@prisma/schema.prisma
@lib/catalog-types.ts
@lib/permissions.ts
@lib/audit.ts
@components/shared/data-table/DataTable.tsx
@components/shared/RichTextEditor.tsx
@components/shared/MultiSelect.tsx
@components/shared/ConfirmDialog.tsx
@components/shared/EmptyState.tsx
@components/ui/sheet.tsx

<interfaces>
From Plan 02-02 (lib/catalog-types.ts):
```typescript
export const CATALOG_KINDS = ['project-kind','industry-sector','market','promotion-type','country','org-unit','scoring-criterion','document-template'] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];
export type CatalogConfig = {
  kind, label, labelPlural, slug, prismaModel, requirementId,
  hasParent, hasWeight, hasRichText
};
export const CATALOG_CONFIGS: Record<CatalogKind, CatalogConfig>;
export function getCatalogConfig(kind: CatalogKind): CatalogConfig;
```

From prisma/schema.prisma (Plan 02-02 added 8 catalog models):
```prisma
model ProjectKind { id, code (unique), name, description?, searchKey, displayOrder, isActive, createdAt, updatedAt, @@index([searchKey]), @@index([isActive, displayOrder]) }
model IndustrySector { ... same pattern }
model Market { ...same + region, nameEn? }
model PromotionType { ...same }
model Country { ...same + region, hasTradeOffice }
model OrgUnit { ...same + type, parentId, parent: OrgUnit? @relation("OrgUnitParent", fields:[parentId], references:[id]) }
model ScoringCriterion { ...same + weight (Float), appliesToKinds (String JSON), parentId, parent: ScoringCriterion? @relation("ScoringCriterionParent") }
model DocumentTemplate { ...same + category, bodyHtml (String), variables (String JSON) }
```

From Plan 02-03 shared components: DataTable, Sheet, RichTextEditor, MultiSelect, ConfirmDialog, EmptyState
From Plan 02-01: withAuditLog
From lib/permissions.ts: can(role, 'danh-muc', action)
</interfaces>

<ui_design_contract>
REUSE Phase 1 UI-SPEC + Plan 02-03.

### Index page `/danh-muc`:
- Heading "Danh mục hệ thống" + description "8 danh mục cấu hình quy chuẩn cho toàn bộ nghiệp vụ"
- Grid 4 cột (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`)
- Mỗi card: icon + title + description (1 dòng) + stat "{n} mục" + Link
- Icon mapping (lucide):
  - Loại đề án: `folder-tree`
  - Ngành hàng: `tags`
  - Thị trường: `globe-2`
  - Loại hình XTTM: `briefcase`
  - Quốc gia: `flag`
  - Đơn vị: `building-2`
  - Tiêu chí chấm điểm: `clipboard-check`
  - Mẫu văn bản: `file-text`

### `/danh-muc/{slug}` Catalog page (template):
- Breadcrumb: Trang chủ → Danh mục → {label}
- Heading {labelPlural} + description
- Right: button "Thêm mới"
- Filter bar: search Input ("Tìm theo mã hoặc tên...") + Select isActive ("Tất cả/Đang hoạt động/Đã ngừng")
- DataTable common columns:
  - Mã (`code`) — text-sm font-mono
  - Tên (`name`) — text-sm font-semibold
  - Mô tả (`description`) — truncate text-sm text-slate-600 max-w-md
  - Trạng thái — Switch inline (toggle isActive)
  - Hành động — DropdownMenu: "Chỉnh sửa", "Xóa" (chỉ enabled nếu isActive=false hoặc no FK ref)
- Special columns per kind:
  - Market: + Khu vực
  - Country: + Khu vực + "Có thương vụ" (lucide:check)
  - OrgUnit: + Loại + Đơn vị cha
  - ScoringCriterion: + Trọng số (Badge với % bg) + Tiêu chí cha
  - DocumentTemplate: + Loại văn bản (Badge color theo category) + "{n} biến"
- Empty state per catalog với icon từ index mapping

### Sheet drawer (CatalogEditSheet):
- shadcn Sheet side="right" `w-[600px]` for simple, `w-[800px]` for ScoringCriterion/DocumentTemplate
- Header: "Thêm {label}" / "Chỉnh sửa {label}: {name}"
- Body: form scrollable
- Footer: 2 buttons "Hủy" + "Lưu" (variant default)
- ESC closes after confirm if dirty

### Tone:
- Header "Đang hoạt động" / "Đã ngừng"
- Confirm xóa: "Bạn có chắc chắn muốn xóa {label} '{name}'? Thao tác này không thể hoàn tác."
- "Vui lòng nhập mã" (validation), "Mã đã tồn tại" (unique check)
- "Mục này đang được sử dụng bởi {n} đề án — vui lòng deactivate thay vì xóa" (FK ref guard)
</ui_design_contract>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Server actions + schemas — config-driven CRUD cho 8 catalogs</name>
  <files>app/(app)/danh-muc/[slug]/_actions/schemas.ts, app/(app)/danh-muc/[slug]/_actions/list.ts, app/(app)/danh-muc/[slug]/_actions/upsert.ts, app/(app)/danh-muc/[slug]/_actions/toggle.ts, app/(app)/danh-muc/[slug]/_actions/delete.ts</files>
  <read_first>
    - lib/catalog-types.ts (CATALOG_CONFIGS map slug→prismaModel)
    - prisma/schema.prisma 8 catalog models
    - lib/audit.ts withAuditLog
    - lib/vi-search.ts removeDiacritics
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (catalog decisions: soft delete via isActive, FK protection, search debounce, Sheet drawer)
  </read_first>
  <action>
    **Strategy:** Sử dụng `Prisma.ModelName` dynamically qua `prisma[config.prismaModel]` (typed as `any` cho 1 lookup, sau đó cast về union type). Trade-off: lose type safety per-catalog nhưng DRY 1 server action thay 8.

    **`schemas.ts`** (pure Zod):
    ```typescript
    const baseFields = {
      code: z.string().regex(/^[A-Z0-9_-]+$/, 'Mã chỉ chữ in hoa, số, gạch dưới').min(1).max(50),
      name: z.string().min(1, 'Vui lòng nhập tên').max(200),
      description: z.string().max(1000).optional().nullable(),
      displayOrder: z.coerce.number().int().min(0).default(0),
      isActive: z.boolean().default(true),
    };
    export const projectKindSchema = z.object({...baseFields});
    export const industrySectorSchema = z.object({...baseFields});
    export const marketSchema = z.object({
      ...baseFields,
      region: z.enum(['EUROPE','ASIA','AMERICAS','AFRICA','OCEANIA']),
      nameEn: z.string().optional().nullable(),
    });
    export const promotionTypeSchema = z.object({...baseFields});
    export const countrySchema = z.object({
      ...baseFields,
      code: z.string().length(3, 'Mã ISO alpha-3 phải đúng 3 ký tự').regex(/^[A-Z]{3}$/),
      region: z.enum(['EUROPE','ASIA','AMERICAS','AFRICA','OCEANIA']),
      hasTradeOffice: z.boolean().default(false),
    });
    export const orgUnitSchema = z.object({
      ...baseFields,
      type: z.enum(['MINISTRY','DEPARTMENT','ASSOCIATION','ENTERPRISE','RESEARCH_INSTITUTE','OTHER']),
      parentId: z.string().optional().nullable(),
    });
    export const scoringCriterionSchema = z.object({
      ...baseFields,
      weight: z.coerce.number().min(0).max(100, 'Trọng số 0-100'),
      parentId: z.string().optional().nullable(),
      appliesToKinds: z.array(z.string()).default([]), // ProjectKind codes
    });
    export const documentTemplateSchema = z.object({
      ...baseFields,
      category: z.enum(['CONG_VAN_MOI','TO_TRINH','QUYET_DINH','HOP_DONG','BIEN_BAN_NGHIEM_THU','THANH_LY']),
      bodyHtml: z.string().min(1, 'Vui lòng nhập nội dung mẫu'),
      variables: z.array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]+$/)).default([]),
    });
    
    export const SCHEMA_BY_KIND: Record<CatalogKind, z.ZodSchema> = {
      'project-kind': projectKindSchema,
      'industry-sector': industrySectorSchema,
      'market': marketSchema,
      'promotion-type': promotionTypeSchema,
      'country': countrySchema,
      'org-unit': orgUnitSchema,
      'scoring-criterion': scoringCriterionSchema,
      'document-template': documentTemplateSchema,
    };
    ```

    **`list.ts`** — `'use server'`:
    ```typescript
    export async function listCatalogItems(kind: CatalogKind, filter: {keyword?:string; isActive?:'all'|'active'|'inactive'}, pageIndex=0, pageSize=50) {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      if (!can(session.user.role, 'danh-muc', 'read')) throw new Error('Bạn không có quyền');
      const config = getCatalogConfig(kind);
      const where: any = {};
      if (filter.keyword) {
        const kw = removeDiacritics(filter.keyword);
        where.searchKey = { contains: kw };
      }
      if (filter.isActive === 'active') where.isActive = true;
      if (filter.isActive === 'inactive') where.isActive = false;
      const include: any = {};
      if (config.hasParent) include.parent = { select: { id: true, code: true, name: true }};
      const model = (prisma as any)[config.prismaModel];
      const [rows, total] = await Promise.all([
        model.findMany({ where, include, orderBy: [{displayOrder:'asc'},{name:'asc'}], skip: pageIndex*pageSize, take: pageSize }),
        model.count({where}),
      ]);
      // Parse JSON fields cho ScoringCriterion (appliesToKinds) và DocumentTemplate (variables)
      const parsed = rows.map((r:any) => ({
        ...r,
        appliesToKinds: r.appliesToKinds ? JSON.parse(r.appliesToKinds) : undefined,
        variables: r.variables ? JSON.parse(r.variables) : undefined,
      }));
      return { rows: parsed, total };
    }
    ```

    **`upsert.ts`** — `'use server'`:
    ```typescript
    async function upsertImpl(kind: CatalogKind, id: string | null, input: unknown) {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      const action = id ? 'update' : 'create';
      if (!can(session.user.role, 'danh-muc', action as Action)) throw new Error('Bạn không có quyền');
      const config = getCatalogConfig(kind);
      const schema = SCHEMA_BY_KIND[kind];
      const parsed = schema.parse(input) as any;
      // Compute searchKey
      const searchKey = removeDiacritics([parsed.name, parsed.code, parsed.description].filter(Boolean).join(' '));
      // Stringify JSON fields
      const data: any = { ...parsed, searchKey };
      if (kind === 'scoring-criterion') data.appliesToKinds = JSON.stringify(parsed.appliesToKinds || []);
      if (kind === 'document-template') data.variables = JSON.stringify(parsed.variables || []);
      const model = (prisma as any)[config.prismaModel];
      const result = id
        ? await model.update({where:{id}, data})
        : await model.create({data});
      revalidatePath(`/danh-muc/${kind}`);
      return result;
    }
    export const upsertCatalogItem = withAuditLog(
      { action: 'UPDATE', resource: 'danh-muc',
        resourceIdFromResult: r => r.id,
        captureAfter: (r, [kind, id]) => ({...r, _kind: kind, _isCreate: !id}) },
      upsertImpl
    );
    ```

    **`toggle.ts`** — `'use server'`:
    `toggleCatalogItem(kind, id, isActive)`:
    - RBAC `can(role,'danh-muc','update')`
    - `model.update({where:{id}, data:{isActive}})`
    - revalidatePath
    - Wrapped withAuditLog action='UPDATE' resource='danh-muc'

    **`delete.ts`** — `'use server'`:
    `deleteCatalogItem(kind, id)`:
    - RBAC `can(role,'danh-muc','delete')`
    - **FK protection**: check số reference trước khi xóa cứng. Map per kind:
      - `project-kind` → `prisma.project.count({where:{kind: item.code}})` — nếu >0 throw
      - `industry-sector` → `prisma.project.count({where:{industrySectorId: id}})` — nếu >0 throw
      - `org-unit`, `country`, etc tương tự
      - `scoring-criterion`, `document-template`: chưa có ref Phase 2 → cho xóa
    - Nếu safe: `model.delete({where:{id}})`
    - Nếu không: throw "Mục này đang được sử dụng bởi {n} đề án/hợp đồng — vui lòng ngừng hoạt động (deactivate) thay vì xóa"
    - Wrapped withAuditLog action='DELETE'
  </action>
  <acceptance_criteria>
    - 5 files tạo
    - `grep "withAuditLog" app/(app)/danh-muc/\\[slug\\]/_actions/*.ts | wc -l` ≥ 3
    - `grep "can(.*'danh-muc'" app/(app)/danh-muc/\\[slug\\]/_actions/*.ts | wc -l` ≥ 4 (mọi action RBAC)
    - `grep "FK\\|đang được sử dụng\\|vui lòng ngừng hoạt động" app/(app)/danh-muc/\\[slug\\]/_actions/delete.ts` returns ≥1
    - `grep "removeDiacritics\\|searchKey" app/(app)/danh-muc/\\[slug\\]/_actions/upsert.ts` returns ≥2
    - `grep "JSON.stringify\\|JSON.parse" app/(app)/danh-muc/\\[slug\\]/_actions/*.ts` returns ≥3 (handle JSON fields)
    - `npx tsc --noEmit` exit 0
    - Smoke: `tsx -e` test create + update + toggle + delete cho 1 ProjectKind dummy → success; FK protection: tạo dummy Project ref ProjectKind → delete throw error.
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && grep -c "withAuditLog" "app/(app)/danh-muc/[slug]/_actions/upsert.ts" "app/(app)/danh-muc/[slug]/_actions/toggle.ts" "app/(app)/danh-muc/[slug]/_actions/delete.ts"</automated>
  </verify>
  <done>4 server actions config-driven, 8 Zod schemas per kind, FK protection cho delete, JSON serialize cho appliesToKinds/variables, RBAC + audit wrap.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Index page + dynamic [slug] page + shared CatalogPage template + CatalogTable</name>
  <files>app/(app)/danh-muc/page.tsx, app/(app)/danh-muc/[slug]/page.tsx, app/(app)/danh-muc/[slug]/_components/CatalogPage.tsx, app/(app)/danh-muc/[slug]/_components/CatalogTable.tsx</files>
  <read_first>
    - lib/catalog-types.ts CATALOG_CONFIGS
    - components/shared/data-table/DataTable.tsx (Plan 02-03)
    - components/shared/EmptyState.tsx, ConfirmDialog.tsx
    - app/(app)/danh-muc/[slug]/_actions/list.ts, toggle.ts, delete.ts (Task 1)
    - app/(app)/nguoi-dung/_components/UserTable.tsx (reference pattern)
  </read_first>
  <action>
    **`/danh-muc/page.tsx`** — Server Component:
    - auth + can('danh-muc','read') redirect nếu fail
    - Pre-fetch 8 catalog counts qua server action `getCatalogCounts()` (tạo helper inline trong list.ts hoặc page.tsx)
    - Heading "Danh mục hệ thống" + description
    - Grid 4 cột với 8 cards. Mỗi card:
      ```tsx
      <Link href={`/danh-muc/${slug}`}>
        <Card className="hover:border-blue-700 hover:shadow-md transition">
          <CardHeader><Icon size={32} className="text-blue-700" /></CardHeader>
          <CardContent>
            <h3 className="text-base font-semibold">{label}</h3>
            <p className="text-sm text-slate-600">{description}</p>
            <p className="text-sm font-semibold text-blue-700 mt-3">{count} mục</p>
          </CardContent>
        </Card>
      </Link>
      ```

    **`/danh-muc/[slug]/page.tsx`** — Server Component dynamic:
    - `params: Promise<{slug:string}>` (Next 15 async params)
    - Validate slug → find CatalogKind từ CATALOG_CONFIGS (slug→kind reverse lookup); nếu không match → notFound()
    - auth + can('danh-muc','read')
    - Pre-fetch initial data `listCatalogItems(kind, {}, 0, 50)`
    - Render `<CatalogPage kind={kind} initialData={data} />`

    **`CatalogPage.tsx`** — `'use client'`, shared template:
    Props: `{ kind: CatalogKind; initialData: {rows, total} }`
    - useState filter: `{keyword: '', isActive: 'all'}`
    - useState pageIndex
    - useState selectedItem (for edit) | null (cho create)
    - useState sheetOpen
    - useQuery(['catalog', kind, filter, pageIndex]) → listCatalogItems
    - Layout:
      - Breadcrumb (auto from BREADCRUMB_LABELS Plan 01)
      - Heading {config.label} + description
      - Right: `<Button onClick={() => {setSelectedItem(null); setSheetOpen(true)}}>Thêm {config.label.toLowerCase()}</Button>`
      - Filter bar: Input search (debounced 300ms) + Select isActive
      - `<CatalogTable kind={kind} data={data.rows} total={data.total} ... onEdit={item => {setSelectedItem(item); setSheetOpen(true)}} />`
      - `<CatalogEditSheet kind={kind} open={sheetOpen} onOpenChange={setSheetOpen} item={selectedItem} />`

    **`CatalogTable.tsx`** — `'use client'`, uses shared DataTable:
    - Build columns based on `kind` (config.hasParent, config.hasWeight, config.hasRichText):
      - Common: Mã, Tên, Mô tả
      - kind === 'market' || 'country': + Khu vực
      - kind === 'country': + "Có thương vụ" (lucide:check or empty)
      - kind === 'org-unit': + Loại (Badge), Đơn vị cha (parent.name or "—")
      - kind === 'scoring-criterion': + Trọng số (Badge), Tiêu chí cha
      - kind === 'document-template': + Loại văn bản (Badge), "{variables.length} biến"
      - All: Trạng thái (Switch inline → toggleCatalogItem mutation)
      - All: Hành động dropdown — Chỉnh sửa, Xóa (ConfirmDialog destructive)
    - Mutation hooks for toggle + delete với invalidate query
  </action>
  <acceptance_criteria>
    - 4 files tạo
    - `app/(app)/danh-muc/page.tsx` chứa 8 hard-coded card configs hoặc loops `CATALOG_KINDS.map(...)` (`grep "CATALOG_KINDS\\|CATALOG_CONFIGS" app/(app)/danh-muc/page.tsx` returns ≥1)
    - `grep "notFound()" app/(app)/danh-muc/\\[slug\\]/page.tsx` returns 1 (invalid slug guard)
    - `grep "getCatalogConfig\\|CATALOG_CONFIGS" app/(app)/danh-muc/\\[slug\\]/page.tsx app/(app)/danh-muc/\\[slug\\]/_components/CatalogPage.tsx` returns ≥2
    - `grep "from '@/components/shared/data-table" app/(app)/danh-muc/\\[slug\\]/_components/CatalogTable.tsx` returns 1
    - `npm run typecheck && npm run lint && npm run build` exit 0
    - Smoke: `npm run dev` → admin → /danh-muc → 8 cards; click "Loại đề án" → /danh-muc/loai-de-an → 8 records hiển thị; click "Thêm" → Sheet mở; filter search "triển lãm" → 1-2 results.
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npm run build</automated>
  </verify>
  <done>Index page 8 cards với count, dynamic [slug] route render config-driven CatalogPage template, CatalogTable common+special columns, inline Switch toggle isActive, dropdown actions.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: CatalogEditSheet với form switching + ScoringCriterionForm + DocumentTemplateForm</name>
  <files>app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx, app/(app)/danh-muc/[slug]/_components/ScoringCriterionForm.tsx, app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx</files>
  <read_first>
    - components/shared/RichTextEditor.tsx (Plan 02-03 — Tiptap với variables prop)
    - components/shared/MultiSelect.tsx
    - components/ui/sheet.tsx, form.tsx, select.tsx, switch.tsx, input.tsx, textarea.tsx
    - app/(app)/danh-muc/[slug]/_actions/upsert.ts, schemas.ts
    - app/(app)/danh-muc/[slug]/_components/CatalogPage.tsx (Task 2)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (DocumentTemplate decisions: Tiptap với placeholder list, preview tab)
  </read_first>
  <action>
    **`CatalogEditSheet.tsx`** — `'use client'`, shared:
    Props: `{ kind: CatalogKind; open: boolean; onOpenChange: (b:boolean)=>void; item: CatalogItem | null }`
    - shadcn Sheet side="right" `w-[600px]` default; nếu kind === 'document-template' or 'scoring-criterion' → `w-[800px]`
    - Header: "Thêm {config.label.toLowerCase()}" / "Chỉnh sửa {config.label}: {item.name}"
    - Body switch by kind:
      - simple kinds (project-kind, industry-sector, promotion-type, market, country, org-unit): inline form với `<Form>` RHF + Zod (using SCHEMA_BY_KIND[kind]) — fields:
        - Common: code (disabled khi edit), name, description (textarea), displayOrder (number)
        - market: + region (Select 5)
        - country: + region + hasTradeOffice (Switch)
        - org-unit: + type (Select 6), parentId (Combobox loading from list other OrgUnits)
      - kind === 'scoring-criterion': render `<ScoringCriterionForm form={form} />`
      - kind === 'document-template': render `<DocumentTemplateForm form={form} />`
    - Footer: "Hủy" + "Lưu"
    - onSubmit: `await upsertCatalogItem(kind, item?.id ?? null, values)` → toast.success → invalidate query → close sheet

    **`ScoringCriterionForm.tsx`** — `'use client'`:
    - Fields:
      - code, name, description (common)
      - weight: `<Input type="number" min={0} max={100} step={0.5} suffix="%" />` + helper "Trọng số trong tổng điểm thẩm định (0-100)"
      - parentId: `<Combobox>` loading từ `listCatalogItems('scoring-criterion', {isActive: 'active'}).then(d => d.rows.filter(r => !r.parentId))` → chỉ list parent groups (root nodes); allow null = "Tiêu chí gốc"
      - appliesToKinds: `<MultiSelect>` options từ `listCatalogItems('project-kind').rows.map(k => ({value: k.code, label: k.name}))` — admin chọn loại đề án nào áp dụng tiêu chí này
      - displayOrder
    - Real-time hint: "Nếu là tiêu chí cha, trọng số là tổng của các tiêu chí con bên dưới (gợi ý: 100% chia cho 4 nhóm = 25% mỗi nhóm)"

    **`DocumentTemplateForm.tsx`** — `'use client'`:
    - Fields:
      - code, name, description (common)
      - category: `<Select>` 6 options với labels:
        - CONG_VAN_MOI → "Công văn mời"
        - TO_TRINH → "Tờ trình"
        - QUYET_DINH → "Quyết định"
        - HOP_DONG → "Hợp đồng"
        - BIEN_BAN_NGHIEM_THU → "Biên bản nghiệm thu"
        - THANH_LY → "Thanh lý"
      - variables: `<TagInput>` (custom hoặc dùng MultiSelect creatable mode) — admin nhập từng tên biến (vd "tenChuongTrinh", "namKy"); khi insert vào editor thành `{{tenChuongTrinh}}`
      - bodyHtml: 2-tab Tabs: "Soạn thảo" và "Xem trước"
        - Soạn thảo: `<RichTextEditor value={form.watch('bodyHtml')} onChange={(v) => form.setValue('bodyHtml', v)} variables={watchedVariables.map(k => ({key: k, label: k, example: getMockValue(k)}))} placeholder="Soạn thảo nội dung mẫu với placeholder dạng {{tenBien}}..." />`
        - Xem trước: render bodyHtml với mock values substituted (vd `{{tenChuongTrinh}}` → "Chương trình XTTM Quốc gia 2026"). Render qua iframe sandbox để tránh XSS từ admin input (T-02-06-04).
    - Mock value lookup helper:
      ```typescript
      const MOCK_VALUES: Record<string, string> = {
        tenChuongTrinh: 'Chương trình XTTM Quốc gia 2026',
        namKy: '2026',
        hanNopDeAn: '30/05/2026',
        tenDonVi: 'Hiệp hội Dệt may Việt Nam',
        tenDeAn: 'Hội chợ Vietnam Expo 2026',
        soToTrinh: '12/TTr-XTTM',
        ngayKy: '15/04/2026',
        nguoiKy: 'TS. Nguyễn Văn A',
        // ...
      };
      function getMockValue(key: string) { return MOCK_VALUES[key] ?? `[${key}]`; }
      function preview(html: string, vars: string[]): string {
        let out = html;
        for (const v of vars) {
          out = out.split(`{{${v}}}`).join(getMockValue(v));
        }
        return out;
      }
      ```
  </action>
  <acceptance_criteria>
    - 3 files tạo, all `'use client'`
    - `grep "Sheet" app/(app)/danh-muc/\\[slug\\]/_components/CatalogEditSheet.tsx` returns ≥2
    - `grep "RichTextEditor" app/(app)/danh-muc/\\[slug\\]/_components/DocumentTemplateForm.tsx` returns ≥1
    - `grep "tenChuongTrinh\\|MOCK_VALUES" app/(app)/danh-muc/\\[slug\\]/_components/DocumentTemplateForm.tsx` returns ≥1
    - `grep "MultiSelect" app/(app)/danh-muc/\\[slug\\]/_components/ScoringCriterionForm.tsx` returns ≥1
    - `grep "weight\\|appliesToKinds\\|parentId" app/(app)/danh-muc/\\[slug\\]/_components/ScoringCriterionForm.tsx` returns ≥3
    - `grep "iframe\\|sandbox\\|preview" app/(app)/danh-muc/\\[slug\\]/_components/DocumentTemplateForm.tsx` returns ≥1 (XSS-safe preview)
    - `npm run typecheck && npm run lint && npm run build` exit 0
    - Smoke: dev → /danh-muc/tieu-chi-cham-diem → click row "Phù hợp định hướng XTTMQG" → Sheet mở với form prefilled weight=10, appliesToKinds=8 selected, parentId=Group 1 ID. Modify weight→12, save → success → list reflect.
    - Smoke: /danh-muc/mau-van-ban → click "Tờ trình phê duyệt đề án" → Sheet mở 800px → tab "Soạn thảo" Tiptap render bodyHtml; click "Chèn biến" → variable list popup → click "tenChuongTrinh" → `{{tenChuongTrinh}}` insert vào editor; tab "Xem trước" render với mock value substituted.
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
  </verify>
  <done>CatalogEditSheet generic + 2 special form variants (ScoringCriterion với weight/parent/appliesToKinds, DocumentTemplate với category/Tiptap/VariableMenu/preview iframe), Vietnamese tone formal.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Admin browser → catalog upsert | Admin nhập catalog data; risk validation gaps + JSON injection trong appliesToKinds/variables |
| DocumentTemplate.bodyHtml | Tiptap output HTML lưu DB → render Phase 7 PDF + email; risk XSS nếu render bằng dangerouslySetInnerHTML |
| FK protection on delete | Catalog FK ref bởi Project/Contract/etc; delete cứng → orphan records |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-06-01 | E (Authorization bypass) | Server actions | mitigate | First lines `auth()` + `can(role, 'danh-muc', action)`; chỉ ADMIN |
| T-02-06-02 | T (Mass assignment) | upsertCatalogItem | mitigate | Zod `.parse()` per kind via SCHEMA_BY_KIND; explicit `data` object construction; KHÔNG spread input raw |
| T-02-06-03 | T (FK orphan) | deleteCatalogItem | mitigate | Per-kind FK count check trước delete; throw VN message yêu cầu deactivate; hard delete chỉ khi 0 refs |
| T-02-06-04 | I (XSS via DocumentTemplate.bodyHtml preview) | DocumentTemplateForm preview | mitigate | Render trong iframe sandbox `<iframe sandbox="allow-same-origin" srcdoc={...} />` — script không exec; production phase 2 thêm DOMPurify khi render PDF |
| T-02-06-05 | T (Variable injection trong template) | preview substitution | mitigate | preview function dùng `split().join()` thay regex để tránh regex injection; mock values là constant từ code |
| T-02-06-06 | T (JSON parse error trong appliesToKinds/variables) | listCatalogItems | mitigate | try/catch JSON.parse với fallback empty array; log error cho dev |
| T-02-06-07 | I (ScoringCriterion weight sum exceed 100) | scoringCriterionSchema | accept | Zod chỉ check 0-100 per item; tổng không enforce DB level (PITFALLS pattern); UI hiển thị tổng hiện tại làm hint, admin tự verify; Phase 7 thẩm định auto-normalize |
| T-02-06-08 | E (Custom catalog category injected) | category enum | mitigate | Zod `.enum()` whitelist 6 categories; throw nếu input khác |
| T-02-06-09 | T (Parent self-reference cycle ScoringCriterion/OrgUnit) | parentId | mitigate | Server check: `if (parentId === id) throw 'Không thể tự đặt làm cha'`; cycle detection lazy (chỉ check direct cycle, deep cycle defer Phase 11) |
</threat_model>

<verification>
- `npm run typecheck && npm run lint && npm run build` exit 0
- Đăng nhập admin → /danh-muc → 8 cards với count đúng (8/20/15/8/30/12/15/6 từ Plan 02-02 seed)
- /danh-muc/loai-de-an → list 8 records, search "triển lãm" → 1 result
- Click "Thêm" → Sheet mở 600px → form RHF; submit invalid (empty name) → error VN "Vui lòng nhập tên"
- Edit ScoringCriterion: Sheet 800px → MultiSelect appliesToKinds với 8 ProjectKind options selected
- Edit DocumentTemplate "Tờ trình phê duyệt": tab Soạn thảo Tiptap; click variable menu insert {{soToTrinh}}; tab Xem trước preview với "12/TTr-XTTM" mock value
- Toggle isActive switch inline → audit log entry
- Try delete ProjectKind có FK ref (manually create dummy Project) → throw "Mục này đang được sử dụng bởi 1 đề án — vui lòng ngừng hoạt động thay vì xóa"
- DONVI/donvi1 đăng nhập → /danh-muc redirect (sidebar không show)
</verification>

<success_criteria>
- CAT-01..06 (6 simple catalogs): CRUD + Switch toggle + filter + search hoạt động
- CAT-07: ScoringCriterion form đặc biệt với weight + parent hierarchy + appliesToKinds MultiSelect
- CAT-08: DocumentTemplate form với category + Tiptap editor + VariableMenu insert + preview iframe sandbox
- Mọi mutation ghi audit log → kiểm chứng /nhat-ky
- Reachability: cards `/danh-muc` link tới `/danh-muc/{slug}` và slugs khớp Plan 02-02 CATALOG_CONFIGS
</success_criteria>

<output>
Sau khi complete tạo `.planning/phases/02-m1-quan-tri-danh-muc/02-06-catalog-editors-SUMMARY.md`
</output>
