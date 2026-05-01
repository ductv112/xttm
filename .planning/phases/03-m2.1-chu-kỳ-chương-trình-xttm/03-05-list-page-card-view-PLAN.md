---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 05
type: execute
wave: 3
depends_on: [01, 02, 03]
files_modified:
  - app/(app)/chuong-trinh/page.tsx
  - app/(app)/chuong-trinh/_components/CycleListGrid.tsx
  - app/(app)/chuong-trinh/_components/CycleCard.tsx
  - app/(app)/chuong-trinh/_components/CycleFilterBar.tsx
  - app/(app)/chuong-trinh/_components/CycleListEmptyState.tsx
autonomous: true
requirements:
  - CYCLE-15
tags: [list-view, card-grid, filter, rbac, vietnamese-ui]
user_setup: []

must_haves:
  truths:
    - "/chuong-trinh route render card grid 3 columns desktop / 1 column mobile các năm"
    - "Mỗi card hiển thị: năm (display nổi bật), tên, status badge, totalBudget (formatVND compact), invitedOrgCount, daysRemaining countdown (nếu OPEN), button 'Xem chi tiết'"
    - "Filter bar: dropdown năm + multi-select status + sort year desc"
    - "Top right có button 'Tạo chu kỳ mới' (chỉ BQL/Admin có quyền create)"
    - "Empty state khi 0 cycles: illustration + 'Chưa có chu kỳ chương trình nào' + CTA"
  artifacts:
    - path: "app/(app)/chuong-trinh/page.tsx"
      provides: "RSC list page với RBAC + filter parsing + initial data fetch"
      min_lines: 60
    - path: "app/(app)/chuong-trinh/_components/CycleCard.tsx"
      provides: "Card hiển thị 1 cycle với status badge + countdown + stats"
      exports: ["CycleCard"]
      min_lines: 100
    - path: "app/(app)/chuong-trinh/_components/CycleFilterBar.tsx"
      provides: "Filter year + status với URL search params source-of-truth"
      exports: ["CycleFilterBar"]
      min_lines: 80
  key_links:
    - from: "app/(app)/chuong-trinh/page.tsx"
      to: "app/(app)/chuong-trinh/_actions/list"
      via: "listCycles fetch initial server-side"
      pattern: "listCycles"
    - from: "app/(app)/chuong-trinh/_components/CycleCard.tsx"
      to: "components/shared/StatusBadge"
      via: "render cycle.status"
      pattern: "StatusBadge"
    - from: "app/(app)/chuong-trinh/_components/CycleCard.tsx"
      to: "lib/format"
      via: "formatVNDCompact + formatDate"
      pattern: "formatVND"
---

<objective>
Trang danh sách chu kỳ chương trình `/chuong-trinh` với card view 3 cols desktop, filter year + status, "Tạo chu kỳ mới" CTA cho BQL/Admin, link tới detail page. Single requirement CYCLE-15 covered fully.

Purpose:
- Landing page sau login cho BANQL role (defaultLandingPath qua lib/permissions): hiển thị tổng quan cycle các năm
- Wave 3 chạy parallel với Plan 03-04 (wizard) và Plan 03-06 (detail) — independent files
- Card layout per CONTEXT.md decisions: countdown widget cho OPEN cycle, stats inline (số đề án 0 cho Phase 3 vì Project entity Phase 5)

Output: 1 RSC page + 4 client components (Card, FilterBar, Grid, EmptyState); ~400 LOC tổng.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-CONTEXT.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@components/shared/StatusBadge.tsx
@components/shared/EmptyState.tsx
@components/shared/MultiSelect.tsx
@lib/format.ts
@lib/workflows/programCycle.ts
@lib/permissions.ts
@lib/auth.ts

<interfaces>
From Plan 03-03 server actions:
- listCycles(filter): Promise of CycleListItem[]
- CycleListItem: { id, year, name, status, totalBudget, registrationOpenAt, registrationCloseAt, supplementDeadline, createdAt, projectCount, invitedOrgCount, daysRemaining }

From Plan 03-01:
- ProgramCycleStatus + CYCLE_STATUS_LABELS + CYCLE_STATUS_BADGE_THEME

From Phase 1+2:
- StatusBadge (entity='PROGRAM_CYCLE')
- EmptyState ({icon, heading, description, action})
- MultiSelect
- formatVND, formatVNDCompact, formatDate from @/lib/format

From Phase 1 design system:
- text-2xl font-semibold cho page heading
- bg-white border border-slate-200 rounded-lg cho card
- Grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: page.tsx + CycleListEmptyState</name>
  <files>app/(app)/chuong-trinh/page.tsx, app/(app)/chuong-trinh/_components/CycleListEmptyState.tsx</files>
  <behavior>
    - page.tsx RSC: searchParams: { year?: string; status?: string } via Promise<...> Next 15 async
    - Defense-in-depth RBAC: const session = await auth(); if !session redirect /login; const role; if !await canFromDB(role,'chuong-trinh','read') redirect defaultLandingPath
    - Parse year as number if numeric; statuses as CSV array
    - Fetch via listCycles({ year: parsedYear, statuses: parsedStatuses })
    - canCreate = await canFromDB(role, 'chuong-trinh', 'create')
    - Render <main className="container mx-auto py-8 max-w-7xl"> with header section: <div className="flex items-start justify-between mb-8"> + h1 "Chu kỳ chương trình XTTM" text-2xl font-semibold + subtitle "Quản lý các đợt chương trình XTTM Quốc gia theo năm" text-sm text-slate-600 mt-1; right side: {canCreate && <Button asChild><Link href="/chuong-trinh/new"><Plus icon /> Tạo chu kỳ mới</Link></Button>}
    - Then <CycleFilterBar /> client component (URL-driven)
    - Then conditional: cycles.length === 0 ? <CycleListEmptyState canCreate={canCreate} /> : <CycleListGrid cycles={cycles} />
    - CycleListEmptyState.tsx: 'use client', wrap <EmptyState icon="layout-dashboard" heading="Chưa có chu kỳ chương trình nào" description="Khởi tạo chu kỳ chương trình XTTM Quốc gia đầu tiên để bắt đầu vòng đời đề án" action={canCreate ? {label:'Tạo chu kỳ mới', href:'/chuong-trinh/new'} : undefined} />
  </behavior>
  <action>
    1. Create page.tsx với Next 15 async searchParams pattern + RBAC layers
    2. Create CycleListEmptyState
    3. tsc + build verify
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "console.log('page:',require('fs').existsSync('app/(app)/chuong-trinh/page.tsx'));console.log('empty:',require('fs').existsSync('app/(app)/chuong-trinh/_components/CycleListEmptyState.tsx'))"</automated>
  </verify>
  <done>
    - 2 files exist
    - tsc pass
    - page.tsx có triple RBAC + Next 15 searchParams Promise pattern
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: CycleCard + CycleListGrid components</name>
  <files>app/(app)/chuong-trinh/_components/CycleCard.tsx, app/(app)/chuong-trinh/_components/CycleListGrid.tsx</files>
  <behavior>
    - CycleCard.tsx: 'use client'
    - Props: cycle: CycleListItem
    - Layout: <Link href={`/chuong-trinh/${cycle.id}`} className="block group"> wrap <div className="rounded-lg border border-slate-200 bg-white p-6 transition hover:border-blue-700 hover:shadow-md">
    - Header row: flex justify-between items-start
      - Left: <div className="text-4xl font-bold text-blue-700">{cycle.year}</div> + <div className="text-sm text-slate-600 mt-1">{cycle.name}</div>
      - Right: <StatusBadge status={cycle.status} entity="PROGRAM_CYCLE" />
    - Stats row mt-6 grid grid-cols-2 gap-4:
      - "Tổng kinh phí" / formatVNDCompact(cycle.totalBudget ?? 0) — text-base font-semibold
      - "Đề án đăng ký" / cycle.projectCount + ' đề án' — Phase 3 display 0; Phase 5 sẽ có thực
      - "Đơn vị mời" / cycle.invitedOrgCount + ' đơn vị'
      - "Hạn còn lại" / countdown logic
    - Countdown logic: if cycle.status === 'OPEN_REGISTRATION' && cycle.daysRemaining != null → display "{n} ngày" with color text-amber-500 nếu n ≤ 7 else text-slate-900; if cycle.status === 'COMPLETED' → "Đã hoàn thành" text-slate-500; if DRAFT/READY → "Chưa mở cổng"; if CLOSED_REGISTRATION → "Đã đóng cổng"
    - Progress bar (footer): if registrationOpenAt + registrationCloseAt set, render thin horizontal bar showing % time elapsed
      - Calc: total = closeAt.getTime() - openAt.getTime(); elapsed = Math.min(total, Math.max(0, Date.now() - openAt.getTime())); pct = Math.round((elapsed/total)*100)
      - <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{width: pct+'%'}} /></div>
      - Below: text-sm text-slate-500 "{formatDate(openAt)} → {formatDate(closeAt)}"
    - Footer: <div className="mt-4 flex items-center justify-end text-sm text-blue-700 group-hover:underline">Xem chi tiết <ChevronRight icon /></div>
    - CycleListGrid.tsx: 'use client' (or RSC if no client interactivity — make RSC for performance)
    - Props: cycles: CycleListItem[]
    - Render <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6"> + map cycles to <CycleCard key={cycle.id} cycle={cycle} />
  </behavior>
  <action>
    1. Create CycleCard với full layout
    2. Create CycleListGrid simple wrapper
    3. tsc + build verify
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['CycleCard','CycleListGrid'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/_components/'+f+'.tsx')))"</automated>
  </verify>
  <done>
    - 2 files exist với typed props
    - CycleCard render countdown + progress bar + status badge + stats grid
    - tsc pass
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: CycleFilterBar với URL search params source-of-truth</name>
  <files>app/(app)/chuong-trinh/_components/CycleFilterBar.tsx</files>
  <behavior>
    - 'use client', useRouter + useSearchParams + usePathname
    - Layout: <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
    - Field 1: Year dropdown (Select): label "Năm", options "Tất cả" + dynamic years (load via prop or hardcode 2024-2030 range), commit on change → router.push qua updateUrl helper
    - Field 2: Status MultiSelect: label "Trạng thái", options từ CYCLE_STATUS_LABELS (7 entries with VN labels), commit on apply (MultiSelect imported has its own apply pattern from Phase 2)
    - Reset button: "Xóa bộ lọc" — clear all sp params, router.push pathname only
    - URL format: ?year=2026&status=OPEN_REGISTRATION,CLOSED_REGISTRATION
    - useEffect or sync local state with URL on mount via useSearchParams
    - Year options: pass as prop yearOptions: number[] from page.tsx (page does prisma.programCycle.findMany select:{year} distinct, sort desc) — or hardcode 2024-2030 as fallback for empty DB
    - Helper updateUrl(patch: { year?: number | null; statuses?: ProgramCycleStatus[] | null }): builds new URLSearchParams from current sp + patch, push qua router.push(pathname + '?' + sp.toString())
    - Use shadcn Select cho year (single) + MultiSelect cho status; both styled với h-10 w-40 / w-64 respectively
  </behavior>
  <action>
    1. Update page.tsx (from Task 1) to load yearOptions distinct + pass via prop
    2. Create CycleFilterBar
    3. tsc + build
    4. Smoke: visit /chuong-trinh → click year filter 2026 → expect URL ?year=2026 + grid filtered
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "console.log('FilterBar:',require('fs').existsSync('app/(app)/chuong-trinh/_components/CycleFilterBar.tsx'))" &amp;&amp; npm run build 2&gt;&amp;1 | tail -10</automated>
  </verify>
  <done>
    - CycleFilterBar exists với URL-driven state
    - npm run build pass
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL search params → server | Untrusted; parsed/coerced as number/array, validated via listCycles Zod (filter is permissive — any year value tolerable; statuses validated via enum) |
| RSC → client component | Trusted serialization (CycleListItem dates/numbers serialized as JSON strings → revive in client) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-05-01 | E (Elevation) | DONVI / TAICHINH role accesses /chuong-trinh | mitigate | Permissions matrix has DONVI/HOIDONG/LANHDAO read access (per lib/permissions.ts existing); page RSC checks canFromDB('chuong-trinh','read') line 1 |
| T-03-05-02 | I (Info disclosure) | Cards expose totalBudget to all roles with read | accept | Total budget is public-domain info for cycle stakeholders (POC scope) |
| T-03-05-03 | T (Tampering) | URL ?year=99999 injected | accept | listCycles Prisma where.year accepts any int; no exception; results just empty |
</threat_model>

<verification>
- All 5 files exist (page + 4 components)
- npx tsc --noEmit pass
- npm run build pass; route /chuong-trinh compiles
- Visual smoke (manual): visit /chuong-trinh as banql → see 3 cards (2025 COMPLETED, 2026 OPEN với progress bar showing ~70% elapsed + countdown 12 days, 2027 DRAFT)
</verification>

<success_criteria>
1. /chuong-trinh route render card grid 3 columns với 3 seeded cycles
2. CycleCard hiển thị year (4xl bold blue), status badge, totalBudget compact, countdown days remaining (amber if ≤7), progress bar
3. Filter bar hoạt động qua URL search params (bookmarkable, browser nav friendly)
4. "Tạo chu kỳ mới" button chỉ hiển thị cho BQL/Admin (canCreate)
5. EmptyState khi không có cycle (rare edge case)
6. Click card → navigate /chuong-trinh/[id] (Plan 03-06 sẽ render — nếu chưa xong, expect placeholder)
</success_criteria>

<output>
After completion, create `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-05-SUMMARY.md` theo template.
</output>
