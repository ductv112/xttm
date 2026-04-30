---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-02-catalog-schema-seed — 8 catalogs seeded (8/20/15/8/30/12/15/6), lib/catalog-types.ts ready cho Plan 02-06
last_updated: "2026-04-30T18:30:35.804Z"
last_activity: 2026-04-30
progress:
  total_phases: 11
  completed_phases: 1
  total_plans: 13
  completed_plans: 8
  percent: 62
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30)

**Core value:** Demo end-to-end mượt và đẹp luồng "Vòng đời đề án" (M2-M3): từ Ban quản lý khởi tạo Chu kỳ Chương trình → Đơn vị chủ trì khai báo & nộp đề án → Tiếp nhận & kiểm tra → Hội đồng thẩm định chấm điểm → Ban quản lý lập tờ trình & nhập quyết định phê duyệt.
**Current focus:** Phase 2 — M1 Quản trị & Danh mục

## Current Position

Phase: 2 (M1 Quản trị & Danh mục) — EXECUTING
Plan: 3 of 7
Status: Ready to execute
Last activity: 2026-04-30

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6 | - | - |

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

### Pending Todos

None yet.

### Blockers/Concerns

- **R1 PDF Vietnamese (CRITICAL):** Phase 1 phải có PDF spike sớm (font Be Vietnam Pro static + smoke test chuỗi đầy đủ dấu) để tránh fail demo Phase 7
- **R2 Terminology lock (CRITICAL):** Phase 1 phải lock `lib/constants.ts` TERMS dictionary ("đề án" ≠ "dự án", "thẩm định" ≠ "kiểm tra") trước mọi phase nghiệp vụ
- **R5 Relative dates (CRITICAL):** Phase 1 phải có `daysAgo(n)/daysFromNow(n)` helper; mock data Phase 11 phải cover mọi SLA scenarios (28/55/12 ngày)
- **Research flags:** Phase 3, 5, 7, 8, 10 cần `/gsd-research-phase` deep research khi vào planning (đã ghi nhận trong research/SUMMARY.md)

## Session Continuity

Last session: 2026-04-30T18:30:20.262Z
Stopped at: Completed 02-02-catalog-schema-seed — 8 catalogs seeded (8/20/15/8/30/12/15/6), lib/catalog-types.ts ready cho Plan 02-06
Resume file: None
