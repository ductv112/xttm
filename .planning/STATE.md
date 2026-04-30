---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-04-wizard-5-buoc — wizard /chuong-trinh/new đầy đủ 5 bước với Zustand persist + RHF + Zod superRefine + Stepper + autosave + final submit createCycle/transitionCycle; CYCLE-01..04 covered; [Rule 1] fix Plan 03-03 server-action non-async exports
last_updated: "2026-04-30T21:02:01.934Z"
last_activity: 2026-04-30
progress:
  total_phases: 11
  completed_phases: 2
  total_plans: 20
  completed_plans: 17
  percent: 85
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30)

**Core value:** Demo end-to-end mượt và đẹp luồng "Vòng đời đề án" (M2-M3): từ Ban quản lý khởi tạo Chu kỳ Chương trình → Đơn vị chủ trì khai báo & nộp đề án → Tiếp nhận & kiểm tra → Hội đồng thẩm định chấm điểm → Ban quản lý lập tờ trình & nhập quyết định phê duyệt.
**Current focus:** Phase 3 — M2.1 Chu kỳ Chương trình XTTM (HERO)

## Current Position

Phase: 3 (M2.1 Chu kỳ Chương trình XTTM (HERO)) — EXECUTING
Plan: 5 of 7
Status: Ready to execute
Last activity: 2026-04-30

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 13
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6 | - | - |
| 2 | 7 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-m0-bootstrap-h-t-ng P01 | 11m | 3 tasks | 38 files |
| Phase 01-m0-bootstrap-h-t-ng P02 | 4m | 3 tasks | 7 files |
| Phase 01-m0-bootstrap-h-t-ng P06 | 7m | 3 tasks | 12 files |
| Phase 01-m0-bootstrap-h-t-ng P03 | 4m | 3 tasks | 10 files |
| Phase 01-m0-bootstrap-h-t-ng P04 | 4m | 3 tasks | 27 files |
| Phase 01-m0-bootstrap-h-t-ng P05 | 5m | 3 tasks | 11 files |
| Phase 02-m1-quan-tri-danh-muc P01 | 8m | 3 tasks | 14 files |
| Phase 02-m1-quan-tri-danh-muc P02 | 5m | 2 tasks | 4 files |
| Phase 02-m1-quan-tri-danh-muc P03 | 9m | 3 tasks | 16 files |
| Phase 02-m1-quan-tri-danh-muc P04 | 22m | 3 tasks | 18 files |
| Phase 02-m1-quan-tri-danh-muc P05 | 11m | 3 tasks | 18 files |
| Phase 02-m1-quan-tri-danh-muc P06 | 12m | 3 tasks | 12 files |
| Phase 02-m1-quan-tri-danh-muc P07 | 10m | 3 tasks | 13 files |
| Phase 03-m2.1-chu-kỳ-chương-trình-xttm P01 | 6m | 3 tasks | 11 files |
| Phase 03-m2.1-chu-kỳ-chương-trình-xttm P02 | 4m | 2 tasks | 7 files |
| Phase 03-m2.1-chu-kỳ-chương-trình-xttm P03 | 8m | 4 tasks | 11 files |
| Phase 03-m2.1-chu-kỳ-chương-trình-xttm P04 | 13m | 4 tasks | 10 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Initial: Hero flow = M2-M3 (Vòng đời đề án), mọi tradeoff ưu tiên độ mượt + chiều sâu nghiệp vụ của hero
- Initial: Stack chốt — Next.js 15 + Tailwind v4 + shadcn/ui + Prisma/SQLite + NextAuth Credentials
- Initial: 8 tài khoản hardcoded, 1 chu kỳ chương trình / năm (unique year), đề án 2 năm = 2 records có parentProjectId
- Roadmap: 11 phase ánh xạ M0-M7 (M2 tách 2.1/2.2/2.3/2.4); 4 HERO phase (3, 5, 7, 10) cần ngân sách polish cao hơn
- Roadmap: Mọi phase có UI work — đây là UI prototype POC
- [Phase 01-m0-bootstrap-h-t-ng]: TERMS dictionary 21 keys lock tại lib/constants.ts (PITFALLS R2) — đề án≠dự án, thẩm định≠kiểm tra; mọi phase sau import TERMS, không hardcode label
- [Phase 01-m0-bootstrap-h-t-ng]: RBAC default-deny matrix (lib/permissions.ts): MATRIX[res]?.[act]?.includes(role) ?? false; 18 resources × 8 actions; getMenuItems(role) render menu động
- [Phase 01-m0-bootstrap-h-t-ng]: Plain TS state machine cho 6 entity (programCycle 7-state với gia hạn, project 16-state, orgProfile/scoreSheet/contract/report) — KHÔNG XState (overkill)
- [Phase 01-m0-bootstrap-h-t-ng]: xlsx@0.18.5 thay 0.20.x (SheetJS chuyển sang CDN riêng, npm registry chỉ có đến 0.18.5)
- [Phase 01-m0-bootstrap-h-t-ng]: Bootstrap manual thay create-next-app vì dir uppercase XTTM vi phạm npm naming; components.json + globals.css tạo manual với shadcn new-york + slate preset
- [Phase 01-m0-bootstrap-h-t-ng]: Schema lock 14 models tại M0 (User/Role/Permission/Organization/OrganizationProfile/ProgramCycle/Project với parentProjectId/EvaluationCouncil/ScoreSheet/Contract/Report/Attachment/AuditLog) — tránh schema thrashing Phase 2-3 (PITFALLS §4.1 §4.2)
- [Phase 01-m0-bootstrap-h-t-ng]: String thay Prisma enum cho status — debug-friendly + swap-friendly khi migrate Postgres; RBAC + state machine ở lib/permissions.ts + lib/workflows authoritative
- [Phase 01-m0-bootstrap-h-t-ng]: Tạo .env riêng cho Prisma CLI (Prisma không đọc .env.local); duplicate DATABASE_URL trong cả .env (CLI) và .env.local (Next.js runtime); cả 2 gitignored
- [Phase 01-m0-bootstrap-h-t-ng]: Bcrypt cost 10 (~80ms/hash, seed 8 users 640ms) + bcryptjs Windows-compatible — POC standard cho password hashing (T-02-01 mitigated)
- [Phase 01-m0-bootstrap-h-t-ng]: Seed idempotent qua prisma.X.upsert pattern + count assertions (≥8 users / ≥5 orgs); orgs first (FK), users next; bcrypt hash trong helpers.ts shared
- [Phase 01-m0-bootstrap-h-t-ng]: Font source: Google Fonts upstream GitHub repo (raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/) — bvn-typeface và bettergui mirrors trả 404; Google Fonts repo canonical source luôn available; script giữ 3 fallback URLs cho resilience
- [Phase 01-m0-bootstrap-h-t-ng]: lib/pdf/render.ts giữ extension .ts (per plan interface contract) — dùng React.createElement thay vì JSX để TypeScript compile thành công
- [Phase 01-m0-bootstrap-h-t-ng]: OfficialDocument.tsx thêm 'import * as React from react' — tsx CLI smoke test dùng classic JSX transform cần React in scope; Next.js production build dùng modern transform OK
- [Phase 01-m0-bootstrap-h-t-ng]: PDF Buffer wrap thành Uint8Array trước khi pass NextResponse — Web Response constructor không accept Node Buffer trực tiếp (TypeScript error)
- [Phase 01-m0-bootstrap-h-t-ng]: R1 PDF Vietnamese CRITICAL pitfall MITIGATED programmatic level — Be Vietnam Pro static TTF (TrueType magic 0x00010000) Regular/Bold/Italic register thành công, render PDF 36KB %PDF- valid; manual UAT visual verification (Chrome/Adobe Reader) pending user
- [Phase 01-m0-bootstrap-h-t-ng]: Auth.js v5 split-config pattern: auth.config.ts edge-safe (callbacks không DB) + lib/auth.ts Node (Credentials + bcrypt + prisma) — middleware Edge bundle KHÔNG pull bcrypt/prisma
- [Phase 01-m0-bootstrap-h-t-ng]: Generic auth error 'Tên đăng nhập hoặc mật khẩu chưa đúng' lock cho cả user-not-found và password-mismatch (T-03-05); user-not-found path run dummy bcrypt.compare để mitigate timing attack
- [Phase 01-m0-bootstrap-h-t-ng]: Server action loginAction lookup role qua prisma TRƯỚC signIn, signIn(redirect:false), redirect role-based qua defaultLandingPath — control flow tự manual không dùng raw callbackUrl (T-03-04)
- [Phase 01-m0-bootstrap-h-t-ng]: JWT session strategy 7d (maxAge 60*60*24*7); jwt callback chỉ inject role lần đầu khi user truthy (initial sign-in); session callback đọc role từ token không từ client (T-03-06)
- [Phase 01-m0-bootstrap-h-t-ng]: Rule 1 fix lib/constants.ts ORG_NAMES.LEFASO em-dash → hyphen để khớp seed DB value (Plan 02 seeded with hyphen, Plan 01 typo)
- [Phase 01-m0-bootstrap-h-t-ng]: AppSidebar là RSC + SidebarMenuItem inner client — server-side render menu theo role, client-side check active state qua usePathname
- [Phase 01-m0-bootstrap-h-t-ng]: (app)/layout.tsx defense-in-depth redirect — middleware Plan 03 + layout fallback đều check session, layer 2 chống matcher config drift
- [Phase 01-m0-bootstrap-h-t-ng]: Sidebar inset variant + collapsible icon (UI-SPEC lock) — w-64 expanded / w-16 icon-only mode với tooltip side-popup; Lucide icon dynamic registry kebab→Pascal cho menu config dạng string
- [Phase 01-m0-bootstrap-h-t-ng]: AppProviders minimal cho M0 (chỉ QueryProvider) — KHÔNG add ThemeProvider vì light mode hardcode UI-SPEC, KHÔNG add LocaleProvider vì date-fns/vi import trực tiếp Plan 01
- [Phase 01-m0-bootstrap-h-t-ng]: Plan 05: Login UI split 60/40 + LoginForm useActionState + Dashboard + 404/500 hero pages tiếng Việt no-stack-trace + UAT checklist 8 tài khoản — Phase 1 complete
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-01: withAuditLog<TArgs,TReturn> generic wrapper với fire-and-forget logAudit (void promise, không block business latency); dynamic import @/lib/auth + next/headers tránh circular dep; diffObjects skip SYSTEM_FIELDS (updatedAt/createdAt/searchKey/currentVersion) — convention cho mọi mutation Phase 2-9 phải import từ @/lib/audit
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-01: Trang /nhat-ky URL search params bookmarkable filter (6 fields: userId/resources/actions/from/to/keyword) + RBAC defense-in-depth 3 layers (middleware + RSC redirect + server action throw); CSV UTF-8 BOM cap 5000 rows + không export userAgent (T-02-01-03 mitigation); pagination 50/page (virtualization defer Plan 02-03 shared-ui-primitives)
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-01 [Rule 3]: đổi sidebar menu /audit-log → /nhat-ky trong lib/permissions.ts ALL_MENU_ITEMS + thêm '/nhat-ky' vào lib/breadcrumbs.ts BREADCRUMB_LABELS (giữ '/audit-log' backward compat) — plan locks Vietnamese-friendly slug nhất quán với /tham-dinh /phe-duyet /hop-dong
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-02: Append-only schema 8 catalog models (ProjectKind/IndustrySector/Market/PromotionType/Country/OrgUnit/ScoringCriterion/DocumentTemplate) — không sửa 14 models lock M0; common pattern code+name+searchKey+displayOrder+isActive+timestamps + indexes [searchKey][isActive,displayOrder] cho Plan 02-06 reuse 1 template
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-02: Self-relation hierarchy qua named relation — OrgUnit('OrgUnitParent') + ScoringCriterion('ScoringCriterionParent'); seed parents trước children với findUnique parentId resolution; ScoringCriterion 4 groups + 11 children = 15 records (gộp 'Bằng chứng số liệu' vào 'Phương pháp' để đạt spec); appliesToKinds JSON 8 ProjectKind codes (explicit thay wildcard)
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-02: lib/catalog-types.ts CATALOG_CONFIGS 4 flags (hasParent/hasWeight/hasRichText/hasRegion) drive Plan 02-06 catalog editor render dynamic; getCatalogConfigBySlug cho route /danh-muc/[slug] resolve; OrgUnit độc lập với Organization (master data lookup vs operational entity tách biệt); Country.code ISO alpha-3 cho Phase 8 thương vụ alert
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-03: Tiptap v3 thay v2 (registry shift) + immediatelyRender:false bắt buộc cho Next 15 RSC
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-03: DataTable generic <TData> server-side state (manualPagination/Sorting/Filtering=true) — auto checkbox column khi rowSelection enabled, EmptyState slot accept JSX or config object
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-03: CSV-injection escape (T-02-03-03) automatic trong toCSV — cell với formula prefix (=/+/-/@/tab/cr) tự prefix apostrophe
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-03: useConfirmDialog imperative hook bên cạnh ConfirmDialog component — Plan 02-04 reset password sẽ dùng imperative await confirm() flow
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-04: 'use server' module convention — non-async exports phải tách sibling module (vd password-utils.ts cho generateTempPassword); withAuditLog captureAfter explicit field whitelist redact passwordHash/raw password; 3-layer self privilege guard (server throw + bulk filter-out-self + UI disable)
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-04: Excel export base64 (RSC ↔ client serialization friendly) thay vì Buffer pass-through; client decode atob → Uint8Array → Blob → URL.createObjectURL → anchor download — pattern reuse cho Phase tiếp theo có xuất file (CSV đã có lib/csv, Excel via xlsx package)
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-04: ResetPasswordDialog 2-step + prevent-close khi show-password (onPointerDownOutside/onEscapeKeyDown e.preventDefault) — UX critical force user copy temp password 12-char trước khi đóng; T-02-04-04 mitigation tempPassword chỉ trả về client 1 lần, audit captureAfter chỉ {passwordReset:true} flag
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-05: lib/permissions-db.ts canFromDB() DB-backed RBAC với 30s TTL cache + invalidatePermissionsCache() sau mutations + fallback static MATRIX nếu DB lỗi/empty — Phase 3+ tuỳ context dùng can() static (95%, fast) hoặc canFromDB (admin override áp dụng ngay)
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-05: Matrix grid 18 accordion sections × 7+ × 8 mini-tables (1008 cells split → 56-cell groups, manageable scrolling); MatrixCell optimistic UI useMutation onMutate flip + onError rollback + 600ms red flash; ADMIN bảo vệ 2 lớp UI disable + server throw (T-02-05-02)
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-05: Revoke = upsert {granted: false} không delete row (giữ history + explicit deny semantics); custom role create check Object.values(ROLES) clash + Prisma @unique defense in depth; deleteCustomRole refuse khi userCount > 0 (T-02-05-09)
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-05: Tabs/Accordion/Textarea shadcn primitives viết tay theo radix-ui meta-package pattern (consistent với existing Dialog wrap style) thay vì npx shadcn add — radix-ui meta-package ^1.4.3 đã expose primitives, no npm install
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-06: Config-driven UI template — 1 CatalogPage + CatalogTable + CatalogEditSheet xử lý 8 catalogs khác nhau qua CATALOG_CONFIGS lookup + flags (hasParent/hasWeight/hasRichText) drive conditional render; trade-off lose per-kind type safety qua dynamic prisma dispatch (prisma as any)[config.prismaModel] nhưng DRY 8x reuse
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-06: Soft-delete primary qua Switch toggle inline (Plan 02-02 DECISION) + hard-delete chỉ khi 0 FK refs; per-kind FK count via Project.kind/industrySectorId/promotionTypeId/marketIds JSON contains/countryIds + children check cho hierarchical (org-unit/scoring-criterion); throw VN message yêu cầu deactivate khi refCount > 0
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-06: T-02-06-04 DocumentTemplate preview qua iframe sandbox="" srcDoc thay dangerouslySetInnerHTML — defense-in-depth XSS isolate (Tiptap StarterKit ko expose script nodes nhưng admin có thể paste HTML); T-02-06-05 substitutePreview dùng split().join() thay regex để tránh injection từ admin-defined variable names; 17 mock values constant lookup
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-07: SystemConfig key-value JSON store (key='sla.params'|'email.template.{KEY}'|'sms.template.{KEY}') với 30s TTL in-memory cache + fallback constants (T-02-07-06 accept POC scope); 9 default rows seed idempotent (1 SLA + 5 email + 3 SMS); honorific enum 5 values (KINH_GUI_QUY_DON_VI/QUY_ONG/QUY_BA/KINH_CHAO_ANH_CHI/TRAN_TRONG_KINH_GUI) với Vietnamese formal labels
- [Phase 02-m1-quan-tri-danh-muc]: Plan 02-07: 3 server actions (updateSLAConfig + updateEmailTemplate + updateSmsTemplate) với withAuditLog wrapper + key whitelist Zod schema (T-02-07-02 mass-assignment guard cho email/SMS template keys); iframe sandbox='' email preview (T-02-07-04 reuse Plan 02-06); split().join() substitution thay regex (T-02-07-08); textarea char count realtime aria-live cho SMS với 160 hard limit
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: TRANSITIONS table lock trong lib/workflows/programCycle.ts — mọi server action Phase 3+ MUST consult canTransitionCycle/validateGuards (PITFALLS R3 mitigation)
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: lib/notifications.ts là pure data layer — KHÔNG check RBAC/audit; server actions Plan 03-03 wrap; recipientOrgIds.length validate 1..50 (T-03-01-04)
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: Cycle 2026 dùng daysAgo(28)/daysFromNow(12) RELATIVE dates (PITFALLS R5); seed VASEP+VCCI vào organizations (5→7) cho 5-org realistic CYCLE-13 demo
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: Plan 03-02 — Use @xyflow/react v12 (latest stable 12.10.2) over reactflow v11; SSR mounted gate pattern over next/dynamic; visual nodes non-interactive (draggable/selectable false) — only click reachable triggers transition
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: Plan 03-02 — StatCard 5-tone variants locked (default/success/warning/danger/info) cho mọi phase tái dùng; VALUE_TONE map cho text color emphasis của value
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: ProgramCycle.description stash trong configJson — không add column mới, giữ schema lean (Plan 03-03 deviation)
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: transitionCycle reject CLOSED→OPEN với VN message bắt UI dùng extendCycle (Gia hạn) — force ghi reason vào configJson.extensions[]
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: Rate limit Map<cycleId, lastSentAt> in-memory 5 phút cho sendInvitation — production multi-instance sẽ replace với Redis pub/sub
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: Plan 03-04: [Rule 1] 'use server' modules require all exports to be async functions — moved Plan 03-03 Zod schemas (createCycleSchema/updateCycleSchema/transitionInputSchema/extendInputSchema/sendInvitationInputSchema/uploadCongVanMetadataSchema) from 'export const' to internal const xxxInternal; removed barrel re-exports; fix latent bug uncovered when Plan 03-04 became first client consumer
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: Plan 03-04: Wizard pattern locked cho Plan 5 (M2.3 đề án 6 bước) reuse — Zustand persist localStorage + RHF per-step + Zod superRefine cross-validation + forwardRef validateAndCommit() + hydration gate via useWizardHasHydrated() (subscribe onFinishHydration); date revival via onRehydrateStorage callback
- [Phase 03-m2.1-chu-kỳ-chương-trình-xttm]: Plan 03-04: Step 3 dùng cùng pool ScoringCriterion catalog cho cả chấm điểm sơ bộ + thẩm định — Phase 2 chỉ seed 1 catalog tieu-chi-cham-diem 15 records (no scope partition); admin có thể split scope sau qua /danh-muc nếu cần

### Pending Todos

None yet.

### Blockers/Concerns

- **R1 PDF Vietnamese (CRITICAL):** Phase 1 phải có PDF spike sớm (font Be Vietnam Pro static + smoke test chuỗi đầy đủ dấu) để tránh fail demo Phase 7
- **R2 Terminology lock (CRITICAL):** Phase 1 phải lock `lib/constants.ts` TERMS dictionary ("đề án" ≠ "dự án", "thẩm định" ≠ "kiểm tra") trước mọi phase nghiệp vụ
- **R5 Relative dates (CRITICAL):** Phase 1 phải có `daysAgo(n)/daysFromNow(n)` helper; mock data Phase 11 phải cover mọi SLA scenarios (28/55/12 ngày)
- **Research flags:** Phase 3, 5, 7, 8, 10 cần `/gsd-research-phase` deep research khi vào planning (đã ghi nhận trong research/SUMMARY.md)

## Session Continuity

Last session: 2026-04-30T21:02:01.929Z
Stopped at: Completed 03-04-wizard-5-buoc — wizard /chuong-trinh/new đầy đủ 5 bước với Zustand persist + RHF + Zod superRefine + Stepper + autosave + final submit createCycle/transitionCycle; CYCLE-01..04 covered; [Rule 1] fix Plan 03-03 server-action non-async exports
Resume file: None
