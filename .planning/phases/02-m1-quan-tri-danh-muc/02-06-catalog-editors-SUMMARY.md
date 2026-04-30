---
phase: 02-m1-quan-tri-danh-muc
plan: 06
subsystem: ui
tags: [catalog, crud, sheet-drawer, soft-delete, tiptap-template, hierarchy, config-driven]

# Dependency graph
requires:
  - phase: 02-m1-quan-tri-danh-muc
    provides: 02-01 audit log withAuditLog wrapper, 02-02 8 catalog Prisma models + CATALOG_CONFIGS, 02-03 shared DataTable + RichTextEditor + MultiSelect + ConfirmDialog primitives, 02-05 RBAC danh-muc/{read,create,update,delete} matrix
provides:
  - 8 catalog editor pages (/danh-muc index + /danh-muc/[slug]) — config-driven 1 template render mọi CatalogKind
  - Server actions config-driven CRUD (listCatalogItems, getCatalogItem, getCatalogCounts, upsertCatalogItem, toggleCatalogItem, deleteCatalogItem) với FK protection + audit log + Zod per-kind dispatch
  - Shared CatalogPage template (search debounced 300ms + isActive filter + DataTable + Sheet drawer)
  - CatalogTable với common + special columns per kind (Khu vực, Có thương vụ, Loại, Đơn vị cha, Trọng số, Tiêu chí cha, Loại văn bản, Biến)
  - 3 form variants: SimpleCatalogFields (6 simple kinds), ScoringCriterionForm (CAT-07 weight + parent + appliesToKinds), DocumentTemplateForm (CAT-08 category + Tiptap + VariableMenu + sandbox iframe preview)
  - Soft-delete via inline Switch toggle (Plan 02-02 DECISION) + hard-delete với FK reference protection
affects: [phase-3, phase-4, phase-5, phase-6, phase-7, phase-8]  # mọi phase nghiệp vụ tiêu thụ catalogs này

# Tech tracking
tech-stack:
  added: []  # tất cả libraries đã có từ Plan 02-01..05
  patterns:
    - "Config-driven UI template — 1 component CatalogPage + CatalogTable + CatalogEditSheet xử lý 8 catalogs khác nhau qua CATALOG_CONFIGS lookup; trade-off lose per-kind type safety nhưng DRY 8x reuse"
    - "Dynamic Prisma model dispatch: (prisma as unknown as Record<string, T>)[config.prismaModel] — explicit cast tại call site, type loss intentional"
    - "JSON field handling — appliesToKinds (ScoringCriterion) + variables (DocumentTemplate) stringify/parse với try/catch fallback empty array (T-02-06-06)"
    - "Sheet drawer pattern: 600px default, 800px cho document-template + scoring-criterion (form phức tạp); RHF + zodResolver(SCHEMA_BY_KIND[kind])"
    - "Sandbox iframe preview cho admin-authored HTML (T-02-06-04 mitigation): srcDoc + sandbox=\"\" → scripts không exec, isolated từ parent context"
    - "Variable substitution dùng split().join() thay regex (T-02-06-05) — admin-defined variable names không tin tưởng evaluate dạng regex pattern"

key-files:
  created:
    - app/(app)/danh-muc/page.tsx (110 LOC) — Index 8 cards với count + activeCount
    - app/(app)/danh-muc/[slug]/page.tsx (90 LOC) — Dynamic route với getCatalogConfigBySlug + notFound() guard
    - app/(app)/danh-muc/[slug]/_components/CatalogPage.tsx (170 LOC) — Shared template
    - app/(app)/danh-muc/[slug]/_components/CatalogTable.tsx (380 LOC) — DataTable wrap với config-driven columns
    - app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx (570 LOC) — Sheet drawer + form switching + SimpleCatalogFields
    - app/(app)/danh-muc/[slug]/_components/ScoringCriterionForm.tsx (290 LOC) — CAT-07 special form
    - app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx (430 LOC) — CAT-08 special form với iframe preview
    - app/(app)/danh-muc/[slug]/_actions/schemas.ts (190 LOC) — 8 Zod schemas + SCHEMA_BY_KIND map + REGION_LABELS + ORG_UNIT_TYPE_LABELS + DOC_TEMPLATE_CATEGORY_LABELS
    - app/(app)/danh-muc/[slug]/_actions/list.ts (250 LOC) — listCatalogItems + getCatalogItem + getCatalogCounts
    - app/(app)/danh-muc/[slug]/_actions/upsert.ts (180 LOC) — withAuditLog wrap, T-02-06-02 explicit data construction
    - app/(app)/danh-muc/[slug]/_actions/toggle.ts (95 LOC) — Soft-delete toggle với before/after diff
    - app/(app)/danh-muc/[slug]/_actions/delete.ts (155 LOC) — Hard-delete với T-02-06-03 FK protection
  modified: []

key-decisions:
  - "Config-driven approach (1 template + 2 special forms) thay 8 trang riêng biệt — dùng CATALOG_CONFIGS flags (hasParent/hasWeight/hasRichText) drive render"
  - "Dynamic Prisma model dispatch qua (prisma as any)[config.prismaModel] — chấp nhận type loss tại boundary, get type safety lại sau Zod parse + explicit data construction"
  - "Soft-delete primary path qua Switch toggle inline; hard-delete chỉ khi 0 FK refs + 0 children (hierarchical) — VN error message yêu cầu deactivate"
  - "Tiptap preview qua iframe sandbox=\"\" srcDoc thay vì dangerouslySetInnerHTML — defense-in-depth mặc dù Tiptap StarterKit không expose script nodes (T-02-06-04)"
  - "Variable substitution dùng String.split().join() thay regex để tránh regex injection từ admin-defined variable names (T-02-06-05)"
  - "Code field disabled khi edit (immutable post-create) — convention nhất quán với UserForm Plan 02-04"
  - "ScoringCriterion parent dropdown chỉ list root nodes (parent=null) — Phase 2 chỉ hỗ trợ 2-level hierarchy; deeper nesting defer Phase 7"
  - "Mock values 17 keys cho DocumentTemplate preview (tenChuongTrinh, namKy, soToTrinh, ...) — match Plan 02-02 seed placeholders, constant lookup không tin tưởng admin input"

patterns-established:
  - "Config-driven CRUD: lib/catalog-types.ts CATALOG_CONFIGS + flags drive 1 server action per concern (list/upsert/toggle/delete) thay vì 8x duplication"
  - "Sheet drawer 600/800px responsive theo kind complexity"
  - "Sandbox iframe preview cho admin-authored HTML (Phase 7 PDF render sẽ áp dụng cùng pattern + DOMPurify cho production)"
  - "Audit-wrapped server actions với captureBefore/captureAfter cho mọi catalog mutation"
  - "FK protection per-kind via Project model lookup: kind→Project.kind, industry-sector→industrySectorId, market/country→JSON contains, hierarchical kinds→children check"

requirements-completed: [CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08]

# Metrics
duration: 12min
completed: 2026-04-30
---

# Phase 2 Plan 6: Catalog Editors Summary

**8 catalog CRUD pages config-driven via CATALOG_CONFIGS lookup — shared CatalogPage template + ScoringCriterion form (weight + appliesToKinds) + DocumentTemplate form (Tiptap + sandbox iframe preview)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-30T19:18:53Z
- **Completed:** 2026-04-30T19:30:36Z
- **Tasks:** 3
- **Files created:** 12

## Accomplishments

- 8 catalog routes accessible (/danh-muc + /danh-muc/{loai-de-an,nganh-hang,thi-truong,loai-hinh-xttm,quoc-gia,don-vi,tieu-chi-cham-diem,mau-van-ban}) với reverse lookup qua getCatalogConfigBySlug + notFound() guard
- Server actions config-driven CRUD đầy đủ với RBAC danh-muc/{read,create,update,delete} + audit log via withAuditLog + FK protection (T-02-06-03)
- Inline Switch toggle isActive (soft-delete primary path) + DropdownMenu Edit/Xóa (hard-delete với FK + children guard)
- ScoringCriterion CAT-07 form: weight 0-100 step 0.5 + parent Combobox (root nodes only) + MultiSelect appliesToKinds (ProjectKind options driven from listCatalogItems)
- DocumentTemplate CAT-08 form: category Select 6 + variables tag input với regex validation + Tabs Soạn thảo/Xem trước; Tiptap RichTextEditor với VariableMenu insert {{tenBien}} + iframe sandbox preview với 17 mock values
- Tất cả mutations ghi audit log resource='danh-muc' với metadata.\_kind cho phân loại Phase tiếp theo

## Task Commits

Each task was committed atomically:

1. **Task 1: Server actions + schemas** — `bdcbc92` (feat)
2. **Task 2: Index page + dynamic [slug] page + CatalogPage template + CatalogTable** — `a46fcc0` (feat)
3. **Task 3: CatalogEditSheet + ScoringCriterionForm + DocumentTemplateForm** — `55d2c75` (feat)

**Plan metadata:** to be added on final commit

## Files Created

### Server Actions (5 files, ~870 LOC)

- `app/(app)/danh-muc/[slug]/_actions/schemas.ts` — 8 Zod schemas + SCHEMA_BY_KIND dispatch + REGION_VALUES/LABELS + ORG_UNIT_TYPES/LABELS + DOC_TEMPLATE_CATEGORIES/LABELS
- `app/(app)/danh-muc/[slug]/_actions/list.ts` — `listCatalogItems`, `getCatalogItem`, `getCatalogCounts` với dynamic prisma dispatch + JSON parse fallback
- `app/(app)/danh-muc/[slug]/_actions/upsert.ts` — `upsertCatalogItem` audit-wrapped, explicit data construction, parent cycle guard
- `app/(app)/danh-muc/[slug]/_actions/toggle.ts` — `toggleCatalogItem` soft-delete với captureBefore/After diff
- `app/(app)/danh-muc/[slug]/_actions/delete.ts` — `deleteCatalogItem` với FK protection per kind + children check

### Pages (2 files, ~200 LOC)

- `app/(app)/danh-muc/page.tsx` — Index 8 cards với icon + count
- `app/(app)/danh-muc/[slug]/page.tsx` — Dynamic route với breadcrumb + RSC pre-fetch

### Components (5 files, ~1840 LOC)

- `app/(app)/danh-muc/[slug]/_components/CatalogPage.tsx` — Shared template (debounced search + Sheet open state)
- `app/(app)/danh-muc/[slug]/_components/CatalogTable.tsx` — DataTable wrap với config-driven columns + inline Switch + dropdown actions
- `app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx` — Sheet drawer 600/800px + RHF + zodResolver + SimpleCatalogFields cho 6 simple kinds
- `app/(app)/danh-muc/[slug]/_components/ScoringCriterionForm.tsx` — CAT-07 form
- `app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx` — CAT-08 form với Tiptap + iframe preview

## Decisions Made

- **Config-driven approach:** 1 template (CatalogPage + CatalogTable + CatalogEditSheet) + 2 special form variants (ScoringCriterionForm + DocumentTemplateForm) thay 8 trang duplication. CATALOG_CONFIGS flags (hasParent/hasWeight/hasRichText) drive conditional rendering.
- **Dynamic Prisma dispatch:** `(prisma as unknown as Record<string, T>)[config.prismaModel]` — chấp nhận type loss tại boundary, regain type safety qua Zod parse + explicit `data` construction trong upsert.
- **Soft-delete primary, hard-delete with guard:** Switch toggle inline (isActive=false) là primary deactivation path; hard delete chỉ khi `prisma.project.count({where: {kind: itemCode}}) === 0` + children check cho hierarchical kinds; throw VN error message với refCount.
- **Sandbox iframe preview (T-02-06-04):** `<iframe sandbox="" srcDoc={...} />` cho DocumentTemplate preview — defense-in-depth mặc dù Tiptap StarterKit không expose `<script>`. Empty sandbox attribute = no permissions (no script, no same-origin, no forms).
- **Variable substitution split/join (T-02-06-05):** `out.split('{{key}}').join(value)` thay vì `replace(regex, value)` — admin-defined variable names không evaluate as regex pattern, tránh injection (vd `(.*)`).
- **Code field immutable post-create:** UI disabled khi edit (consistent với UserForm Plan 02-04 username pattern). Đảm bảo FK refs trong Project.kind/industrySectorId luôn stable.
- **ScoringCriterion parent restriction:** Dropdown chỉ list root nodes (filter `!r.parentId && r.id !== currentItemId`) — Phase 2 hỗ trợ 2-level (group → criterion). Deep cycle detection + multi-level defer Phase 11.
- **17 mock values cho preview:** Constant `MOCK_VALUES` lookup, fallback `[${key}]` cho biến chưa định nghĩa. Match seed Plan 02-02 placeholders.

## Deviations from Plan

None - plan executed exactly as written.

3 minor adaptations applied trong khuôn khổ plan instructions:

1. **CatalogEditSheet placeholder stub trong Task 2** — Plan task 2 references `CatalogEditSheet` từ CatalogPage, nhưng full implementation thuộc Task 3. Approach: tạo placeholder stub trong Task 2 commit (a46fcc0) để build pass; full Sheet drawer + form switching commit Task 3 (55d2c75). Net result identical với plan intent.

2. **TypeScript zodResolver cast** — Zod 4 `ZodType<unknown>` mismatch với RHF generic `ZodType<FieldValues>`; resolved bằng explicit cast `SCHEMA_BY_KIND[kind] as unknown as Parameters<typeof zodResolver>[0]`. Required vì SCHEMA_BY_KIND là discriminated union — RHF chỉ accept 1 schema type tại runtime.

3. **Lint warning preemptive fix** — `ConfirmDialog` import trong CatalogTable.tsx unused (dùng useConfirmDialog hook only). Removed trong cùng Task 2 commit.

## Issues Encountered

- TypeScript error `Object is possibly 'undefined'` ở delete.ts khi call `prismaModel.count()` cho children check — fixed bằng intermediate variable + explicit null check (config.hasParent guarantees model exists, but type system không suy luận được qua dynamic dispatch).

## Next Phase Readiness

- **Phase 3 (M2.1 Chu kỳ chương trình):** ProgramCycle form sẽ tham chiếu DocumentTemplate (mẫu công văn mời, mẫu email) — Plan 02-06 đã build CRUD UI để admin tự cấu hình mẫu trước khi BQL tạo chu kỳ.
- **Phase 5 (M2.3 Đề án HERO):** Project form sẽ load ProjectKind/IndustrySector/PromotionType/Market/Country dropdowns từ catalog — listCatalogItems hooks sẵn sàng reuse.
- **Phase 7 (M3 Thẩm định HERO):** ScoreSheet form sẽ load ScoringCriterion với weight + filter theo ProjectKind qua appliesToKinds JSON match.
- **Phase 6 (M2.4 Phê duyệt):** Tờ trình sinh từ DocumentTemplate.bodyHtml + Phase 7 PDF render — preview iframe sandbox pattern + DOMPurify khi render production sẽ là next step.

## Verification

- ✅ `npx tsc --noEmit` exit 0
- ✅ `npm run build` exit 0 (route /danh-muc 166B + /danh-muc/[slug] 6.75kB First Load JS)
- ✅ All 12 files exist on disk
- ✅ All 3 commits in git log (bdcbc92, a46fcc0, 55d2c75)
- ✅ withAuditLog wrap count: upsert(2) + toggle(2) + delete(2) = 6
- ✅ RBAC `can(...'danh-muc'...)` count across actions: list(3) + upsert(2) + toggle(2) + delete(2) = 9
- ✅ FK protection delete.ts: 10 occurrences "đang được sử dụng | deactivate | FK"
- ✅ JSON.stringify/parse: list(3) + upsert(2) = 5
- ✅ ScoringCriterionForm: weight + appliesToKinds + parentId = 11 occurrences
- ✅ DocumentTemplateForm: iframe + sandbox + preview = 14 occurrences
- ✅ MultiSelect in ScoringCriterionForm: 3 occurrences
- ✅ RichTextEditor in DocumentTemplateForm: 2 occurrences

## Self-Check: PASSED

All 12 created files verified to exist. All 3 task commits verified in git log. Build + typecheck pass. All grep-based acceptance criteria from plan met or exceeded.

---
*Phase: 02-m1-quan-tri-danh-muc*
*Completed: 2026-04-30*
