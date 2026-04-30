---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 05
subsystem: program-cycle-list-view
tags: [list-view, card-grid, filter, url-driven, rbac, vietnamese-ui]
requirements: [CYCLE-15]
dependency_graph:
  requires:
    - "app/(app)/chuong-trinh/_actions/list (Plan 03-03) — listCycles + CycleListItem type"
    - "lib/workflows/programCycle (Plan 03-01) — PROGRAM_CYCLE_STATUSES + CYCLE_STATUS_LABELS + ProgramCycleStatus"
    - "components/shared/StatusBadge (Phase 2) — entity='PROGRAM_CYCLE'"
    - "components/shared/EmptyState (Phase 2) — icon=layout-dashboard"
    - "components/shared/MultiSelect (Phase 2) — status filter"
    - "components/ui/select (Phase 1) — year filter"
    - "lib/format — formatDate + formatVNDCompact"
    - "lib/permissions-db — canFromDB triple RBAC"
    - "lib/auth — auth() session"
  provides:
    - "/chuong-trinh route — landing page card grid (BANQL/ADMIN/DONVI/HOIDONG/LANHDAO read-able)"
    - "URL-driven filter pattern (CycleFilterBar) — bookmarkable + browser nav friendly cho Plan 5+ list views reuse"
    - "CycleCard component — countdown + progress bar pattern reusable cho Plan 03-06 detail Tab Tổng quan statistics"
  affects:
    - "Plan 03-06 detail page — card click navigates /chuong-trinh/[id]"
    - "Plan 03-04 wizard — 'Tạo chu kỳ mới' CTA entry point"
    - "Plan 5+ (M2.3 đề án list) — URL search params filter pattern reuse"
tech-stack:
  added: []
  patterns:
    - "Next 15 async searchParams Promise<...> — page.tsx awaits both auth() + searchParams + parallel listCycles + loadYearOptions"
    - "Triple RBAC defense-in-depth: page.tsx auth → page.tsx canFromDB read → listCycles internal canFromDB (line 1-3 của _actions/list.ts) — prevents URL-direct-hit bypass"
    - "URL search params source-of-truth: useSearchParams reads (no local state mirror) → updateUrl helper rebuilds URLSearchParams from current sp + patch → router.push → server re-renders"
    - "Sentinel ALL_YEARS_VALUE='__all__' for shadcn Select 'Tất cả' option (Radix Select không cho phép empty string value) → updateUrl deletes year param khi sentinel selected"
    - "Status validation defense-in-depth: parseStatuses (page.tsx) + onChange filter (CycleFilterBar) both filter qua STATUS_SET — URL injection ?status=DROP_TABLE just yields empty array"
    - "Year options loaded distinct desc từ prisma với fallback range 2024..currentYear+1 nếu DB empty — gives user dropdown context khi chưa seed"
    - "CycleCard countdown logic theo cycle.status với amber-600 khi daysRemaining ≤ 7 (visual urgency) + progress bar style.width=pct% + role='progressbar' + aria-valuenow=pct"
    - "RSC + 'use client' boundary: page.tsx + CycleListGrid + CycleListEmptyState are RSC (no client interactivity); CycleCard + CycleFilterBar are 'use client' (Link href interpolation + useRouter respectively)"
key-files:
  created:
    - "app/(app)/chuong-trinh/page.tsx"
    - "app/(app)/chuong-trinh/_components/CycleCard.tsx"
    - "app/(app)/chuong-trinh/_components/CycleListGrid.tsx"
    - "app/(app)/chuong-trinh/_components/CycleFilterBar.tsx"
    - "app/(app)/chuong-trinh/_components/CycleListEmptyState.tsx"
  modified: []
key-decisions:
  - "ALL_YEARS_VALUE sentinel '__all__' chosen vì Radix Select disallows empty-string value (would throw 'A <Select.Item /> must have a value prop that is not an empty string')"
  - "Year fallback range 2024..currentYear+1 (descending) khi prisma distinct trả về empty — POC dev convenience; production sau seed sẽ luôn có data"
  - "Countdown amber threshold ≤ 7 days (visual urgency cue) — chosen vs plan suggestion 'amber if ≤7' confirmed; days > 7 stays text-slate-900 default"
  - "Progress bar uses Math.round((elapsed/total)*100) clamped 0..100 via Math.min/max — handles edge cases khi Date.now() < open (negative → 0%) hoặc > close (over → 100%)"
  - "CycleListGrid kept RSC (no 'use client') — no event handlers; CycleCard absorbs Link click; performance win cho server-rendered card grids"
  - "Triple RBAC layer 3 (listCycles internal canFromDB) deemed necessary defense-in-depth despite page.tsx redirect — server actions invoked directly from custom client code would otherwise bypass page guard"
metrics:
  duration: "4m"
  completed_date: "2026-04-30"
  tasks_completed: 3
  files_created: 5
  files_modified: 0
  commits: 3
---

# Phase 3 Plan 05: List Page Card View /chuong-trinh Summary

**One-liner:** /chuong-trinh card grid 3-col responsive landing page với triple-RBAC, Next 15 async searchParams (year + status CSV), URL-driven CycleFilterBar (Select năm + MultiSelect 7 trạng thái), CycleCard year-4xl + StatusBadge + 2x2 stats grid + countdown (amber ≤7 ngày) + progress bar timeline + "Xem chi tiết" footer, EmptyState fallback với canCreate-aware CTA — ~510 LOC across 5 files.

## Tasks Executed

### Task 1: page.tsx + CycleListEmptyState
**Commit:** 13c3ef2

Created the RSC list page entry + empty state wrapper:
- `page.tsx` (138 lines): RSC với triple RBAC (auth() redirect /login → canFromDB('chuong-trinh','read') redirect defaultLandingPath → listCycles internal check). Next 15 async searchParams Promise pattern; `parseYear` (Number.isInteger guard) + `parseStatuses` (CSV split + STATUS_SET validation). Parallel fetch via `Promise.all([listCycles, loadYearOptions])`. `loadYearOptions` does `prisma.programCycle.findMany({ select:{year}, distinct:['year'], orderBy:{year:'desc'} })` với fallback range `currentYear+1..2024` khi empty. Header section: h1 text-2xl font-semibold + subtitle text-sm slate-600 + conditional "Tạo chu kỳ mới" CTA Button asChild Link with Plus icon (gated by `canFromDB(role,'chuong-trinh','create')`). Conditional render `cycles.length === 0 ? <CycleListEmptyState> : <CycleListGrid>`. `metadata = { title: 'Chu kỳ chương trình XTTM' }`.
- `CycleListEmptyState.tsx` (28 lines): 'use client' wrapper around shared EmptyState — icon='layout-dashboard', heading "Chưa có chu kỳ chương trình nào", description Vietnamese long-form, action conditional theo canCreate prop ({ label:'Tạo chu kỳ mới', href:'/chuong-trinh/new' } hoặc undefined).
- Stub `CycleFilterBar` + `CycleListGrid` để tsc pass; full impl Tasks 2/3.

### Task 2: CycleCard + CycleListGrid
**Commit:** 4d237f8

Card component with full visual treatment + grid wrapper:
- `CycleCard.tsx` (159 lines): 'use client' với Link wrapper (focus-visible:ring-2 blue-700) full card clickable. Header flex justify-between: left = year text-4xl font-bold text-blue-700 leading-none + name text-sm slate-600 line-clamp-2; right = StatusBadge entity='PROGRAM_CYCLE'. Stats `<dl>` grid grid-cols-2 gap-4 với 4 cells (Tổng kinh phí formatVNDCompact ?? 'Chưa cấu hình' / Đề án đăng ký projectCount đề án / Đơn vị mời invitedOrgCount đơn vị / Hạn còn lại countdown). `resolveCountdown(cycle)`: switch theo status — OPEN_REGISTRATION với daysRemaining null → "Chưa cấu hình hạn" slate-500 / `${days} ngày` (amber-600 nếu ≤7, slate-900 default), CLOSED_REGISTRATION → "Đã đóng cổng" amber-700, COMPLETED → "Đã hoàn thành" slate-500, APPROVED → "Đã phê duyệt" emerald-700, EVALUATING → "Đang thẩm định" blue-700, DRAFT/READY default → "Chưa mở cổng" slate-500. `computeProgress`: `total = close - open; elapsed = clamp(0, total, Date.now() - open); pct = round(elapsed/total*100)`. Progress bar h-2 rounded-full bg-slate-100 với inner div bg-blue-700 + role='progressbar' + aria-valuenow + label `formatDate(open) → formatDate(close)`. Footer "Xem chi tiết" + ChevronRight + group-hover:underline.
- `CycleListGrid.tsx` (21 lines): RSC wrapper (no 'use client') — `<div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">` map cycles → CycleCard.

### Task 3: CycleFilterBar URL-driven
**Commit:** bcf5286

Filter bar with URL as single source of truth:
- `CycleFilterBar.tsx` (164 lines): 'use client' với useRouter + usePathname + useSearchParams (Next 15 navigation). URL format `?year=2026&status=OPEN_REGISTRATION,CLOSED_REGISTRATION`. Read state directly from `searchParams.get('year' / 'status')` (no local state). `currentYear` resolves to `ALL_YEARS_VALUE='__all__'` sentinel khi missing/invalid (Radix Select disallows empty-string). `currentStatuses` parses CSV qua `useMemo(...statusParam)` với STATUS_SET filter (defense-in-depth invalid status injection). `updateUrl({year?, statuses?})` helper rebuilds URLSearchParams from current sp; null/sentinel/empty array → `sp.delete`; commit via `router.push(qs ? pathname+'?'+qs : pathname)`. Layout: `<div mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4>` với 2 fields (Năm shadcn Select w-40 + Trạng thái MultiSelect w-64) + conditional "Xóa bộ lọc" Button ghost+X icon ml-auto self-end khi `hasActiveFilters`. STATUS_OPTIONS map từ PROGRAM_CYCLE_STATUSES + CYCLE_STATUS_LABELS (7 VN labels).

## Verification Snapshot

| Check | Result |
|-------|--------|
| All 5 files exist | PASS — page.tsx, CycleCard, CycleListGrid, CycleFilterBar, CycleListEmptyState |
| `npx tsc --noEmit` | PASS (exit 0) after each task |
| `npm run build` | PASS — `/chuong-trinh` route compiled at 6.93 kB / 215 kB First Load |
| Min lines page.tsx ≥ 60 | PASS (138 lines) |
| Min lines CycleCard.tsx ≥ 100 | PASS (159 lines) |
| Min lines CycleFilterBar.tsx ≥ 80 | PASS (164 lines) |
| Triple RBAC layers in page.tsx | PASS (auth() + canFromDB + listCycles internal) |
| Next 15 async searchParams | PASS (`Promise<CycleListSearchParams>` + `await searchParams`) |
| URL-driven filter (no useState mirror) | PASS — useSearchParams.get reads, router.push commits |

## Deviations from Plan

None — plan executed exactly as written. Minor polish additions documented as decisions:

- Added `Math.min/Math.max` clamping in `computeProgress` for robustness (handles cycle Date.now() before open or after close)
- Added `aria-label` and `role="progressbar"` on progress bar for a11y compliance (CLAUDE.md §8.2 accessibility requirement)
- Added `focus-visible:ring-2` on CycleCard Link wrapper for keyboard navigation (CLAUDE.md §8.2)
- Used `Promise.all` for parallel `listCycles + loadYearOptions` fetch (small perf win, follows existing page.tsx patterns)
- Added 'Chưa cấu hình' fallback display khi `cycle.totalBudget == null` (instead of crashing on formatVNDCompact(null))

### Authentication Gates
None — page-level RBAC redirects unauthorized roles to `defaultLandingPath(role)`; no session/auth interruption flow occurred.

## Threat Surface Scan

No new network surface. Threat model T-03-05-01..03 mitigations all in place:
- T-03-05-01 (E): canFromDB('chuong-trinh','read') gates page; permissions matrix already grants ADMIN/BANQL/DONVI/HOIDONG/LANHDAO read access (verified in `lib/permissions.ts:56-61`)
- T-03-05-02 (I): totalBudget visibility accepted (POC scope)
- T-03-05-03 (T): URL ?year=99999 / ?status=DROP yield empty results — `parseYear` Number.isInteger guard + `parseStatuses` STATUS_SET filter + Prisma `where.year` int constraint (no exception)

## Self-Check: PASSED

**Created files (5):**
- FOUND: app/(app)/chuong-trinh/page.tsx (138 lines)
- FOUND: app/(app)/chuong-trinh/_components/CycleCard.tsx (159 lines)
- FOUND: app/(app)/chuong-trinh/_components/CycleListGrid.tsx (21 lines)
- FOUND: app/(app)/chuong-trinh/_components/CycleFilterBar.tsx (164 lines)
- FOUND: app/(app)/chuong-trinh/_components/CycleListEmptyState.tsx (28 lines)

**Commits:**
- FOUND: 13c3ef2 — Task 1 page.tsx + CycleListEmptyState (+ Bar/Grid stubs)
- FOUND: 4d237f8 — Task 2 CycleCard + CycleListGrid
- FOUND: bcf5286 — Task 3 CycleFilterBar URL-driven

Manual UAT (visual smoke as banql role on `/chuong-trinh`) deferred to next dev session — automated verification (build + tsc + grep) all pass.
