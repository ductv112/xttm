---
phase: 10-m6-dashboard-cảnh-báo
plan: 01
subsystem: ui
tags: [dashboard, recharts, notifications, sla, xlsx, react-pdf, inbox]

requires:
  - phase: 03-m2.1-chu-kỳ-chương-trình-xttm
    provides: lib/notifications.ts (sendCycleInvitation + dispatch model)
  - phase: 02-m1-quan-tri-danh-muc
    provides: SystemConfig SLA thresholds + lib/system-config.ts cached helpers
  - phase: 09-m5-báo-cáo-nghiệm-thu-tài-chính
    provides: Report + AcceptanceRecord + FinancialRecord schema (DISBURSED/SETTLED status)
  - phase: 07-m3-thẩm-định-phê-duyệt
    provides: ApprovalDecision.decisionDate + approvedItemsJson (used cho contract-delay alert)
provides:
  - HERO Dashboard cho lãnh đạo (4 stats + 4 alert widgets + 2 charts + filter + export)
  - lib/dashboard-aggregations.ts — pure data layer aggregating metrics/alerts/charts
  - Notification inbox primitives (createNotification + listMyNotifications + markRead + markAllRead + getUnreadCount)
  - NotificationBell topbar component với polling 60s + dropdown 10 mới nhất
  - /thong-bao inbox page với type/date/unread filter
  - Excel + PDF dashboard summary export (xlsx 6 sheets + react-pdf 1-page)
  - 6 new NotificationType: NEW_PROJECT, ASSIGNED, SUPPLEMENT_REQUEST, APPROVAL_RESULT, SLA_WARNING, GENERAL
affects: [11-polish-uat, future-realtime-websocket-phase]

tech-stack:
  added: []
  patterns:
    - "URL-search-params filter (year=, type=, unreadOnly=, from=, to=) source-of-truth — reuses Phase 3 ALL_YEARS_VALUE pattern"
    - "Polling 60s cho unread count badge (no websocket per <deferred>)"
    - "Server-side aggregation in single getDashboardSummary() call — RSC renders, charts hydrate client-side via Recharts ResponsiveContainer"
    - "Base64 buffer pattern cho server-action file generation (xlsx + react-pdf) — client decodes Blob → URL → anchor download"

key-files:
  created:
    - lib/dashboard-aggregations.ts
    - lib/pdf/templates/DashboardSummary.tsx
    - app/(app)/dashboard/_actions/get-summary.ts
    - app/(app)/dashboard/_actions/export-excel.ts
    - app/(app)/dashboard/_actions/export-pdf.ts
    - app/(app)/dashboard/_components/DashboardStatsRow.tsx
    - app/(app)/dashboard/_components/AlertWidgetCard.tsx
    - app/(app)/dashboard/_components/AlertsRow.tsx
    - app/(app)/dashboard/_components/ChartByKind.tsx
    - app/(app)/dashboard/_components/ChartByBudgetStatus.tsx
    - app/(app)/dashboard/_components/DashboardFilterBar.tsx
    - app/(app)/thong-bao/page.tsx
    - app/(app)/thong-bao/_actions/list.ts
    - app/(app)/thong-bao/_components/NotificationFilterBar.tsx
    - app/(app)/thong-bao/_components/NotificationList.tsx
    - components/layout/NotificationBell.tsx
    - prisma/seed/inbox-notifications.ts
  modified:
    - app/(app)/dashboard/page.tsx (placeholder → full HERO dashboard)
    - components/layout/AppTopbar.tsx (Bell placeholder → NotificationBell)
    - lib/notifications.ts (extend với inbox helpers)
    - lib/notification-types.ts (extend với 6 phase-10 types)
    - lib/pdf/render.ts (add renderDashboardSummaryPdf wrapper)
    - app/(app)/de-an/_actions/submit.ts (CYCLE_OPENED → NEW_PROJECT)
    - app/(app)/kiem-tra/_actions/request-supplement.ts (CYCLE_OPENED → SUPPLEMENT_REQUEST)
    - app/(app)/phan-cong/_actions/assign.ts (add notification dispatch cho chuyên viên)
    - prisma/seed.ts (wire seedInboxNotifications)

key-decisions:
  - "Polling 30-60s thay websocket cho unread count — acceptable cho POC scope per CONTEXT.md <deferred>"
  - "Single getDashboardSummary() entry-point trả full summary trong 1 RSC call — đơn giản hóa drill-down vs sub-queries per widget"
  - "Excel export = 6 sheets (Tổng quan + 4 cảnh báo + Đề án theo loại); PDF export = 1-page A4 portrait via react-pdf reuse Be Vietnam Pro font đã đăng ký"
  - "DONVI role chỉ thấy đề án của org mình (server-side filter projectOrgFilter); BANQL/CHUYENVIEN/HOIDONG/LANHDAO/ADMIN/TAICHINH thấy tất cả"
  - "Drill-down URL params dùng query string (year=, status=, overdue=true, etc.) — không tạo special routes; tận dụng existing list pages CycleFilterBar pattern"
  - "Notification trigger pattern: action wrap với try/catch swallow để dispatch failure không break business action — same pattern Phase 3 sendCycleInvitation"
  - "createNotification public API trong lib/notifications.ts wraps Notification + N NotificationDispatch trong 1 transaction — strict-typed CreateNotificationInput chấp nhận userIds OR orgIds"

patterns-established:
  - "Dashboard widget pattern: AlertWidgetCard reusable component (icon + tone + count + top-3 items + drill-down URL) — Phase 11 future widgets reuse"
  - "PDF dashboard summary template pattern: A4 portrait + StatCard grid + Section II/III/etc. — reuse cho future executive reports"
  - "Inbox notification pattern: NotificationDispatch.recipientUserId scoped query với markRead ownership check (T-10-01-01 cross-tenant mitigation) — Phase 11 future inbox extensions reuse"
  - "Mock SLA detection at dashboard render time (no cron) — CONTEXT.md decision; on-demand recompute từ Project queries thay daily background job"

requirements-completed:
  - DASH-01
  - DASH-02
  - DASH-03
  - DASH-04
  - DASH-05
  - DASH-06
  - DASH-07
  - DASH-08
  - DASH-09
  - DASH-10
  - DASH-11
  - DASH-12
  - ALERT-01
  - ALERT-02
  - ALERT-03
  - ALERT-04
  - ALERT-05
  - ALERT-06
  - ALERT-07
  - ALERT-08

duration: 13min
completed: 2026-05-01
---

# Phase 10 Plan 01: Dashboard HERO + Notification System Summary

**HERO Dashboard cho lãnh đạo (4 stats + 4 alert widgets + 2 Recharts) + complete notification inbox với NotificationBell topbar polling + /thong-bao page; SLA detection on-demand từ Project/Contract/Report queries; Excel 6-sheet + PDF 1-page export.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-05-01T02:34:11Z
- **Completed:** 2026-05-01T02:47:23Z
- **Tasks:** 4
- **Files created:** 17
- **Files modified:** 8

## Accomplishments

- HERO Dashboard `/dashboard` thay thế placeholder với 4 stat cards (đề án, kinh phí, đơn vị, tiến độ), 4 alert widgets (sai lệch ngân sách, chậm ký HĐ, báo cáo trễ, chưa liên hệ thương vụ), 2 Recharts (đề án theo loại + kinh phí theo trạng thái), year filter dropdown, Excel + PDF export
- Notification inbox infrastructure: `lib/notifications.ts` extended với createNotification + listMyNotifications + markRead + markAllRead + getUnreadCount; 6 new NotificationType cho phase 10
- `/thong-bao` route với NotificationFilterBar (type/date/unread filter URL-driven) + NotificationList (markRead on click + navigate to entity)
- `NotificationBell` component trong AppTopbar: dropdown 10 mới nhất, badge unread count, polling 60s
- Notification triggers: assignProject thêm dispatch cho chuyên viên; submitProject + requestSupplement đổi từ CYCLE_OPENED placeholder sang đúng type
- 20 mock inbox notifications seeded across 7 mock users covering all 6 types + read/unread mix

## Task Commits

Each task was committed atomically:

1. **Task 1: Dashboard data aggregations + export actions** — `2fb947c` (feat)
2. **Task 2: Dashboard UI — 4 stats + 4 alerts + 2 charts + filter + export** — `c954a5c` (feat)
3. **Task 3a: Notification triggers cho submit + assign + supplement** — `a0afdaa` (feat)
4. **Task 3b: NotificationBell topbar + /thong-bao inbox** — `b7ef5cb` (feat)
5. **Task 4: Seed notifications for mock users** — `7da23ec` (feat)

## Files Created/Modified

### Created

- `lib/dashboard-aggregations.ts` — getDashboardSummary aggregating projects/budgets/4 alerts/2 charts cho 1 year + role-aware filtering
- `lib/pdf/templates/DashboardSummary.tsx` — A4 portrait PDF template với StatCard grid + alert lists + project-by-kind table
- `app/(app)/dashboard/_actions/get-summary.ts` — Server action wrap getDashboardSummary với auth + canFromDB
- `app/(app)/dashboard/_actions/export-excel.ts` — Excel export 6 sheets với base64 return
- `app/(app)/dashboard/_actions/export-pdf.ts` — PDF export reuse renderDashboardSummaryPdf
- `app/(app)/dashboard/_components/DashboardStatsRow.tsx` — 4 stat cards với drill-down hover affordance
- `app/(app)/dashboard/_components/AlertWidgetCard.tsx` — generic widget (icon/tone/count/top-3/drill-down)
- `app/(app)/dashboard/_components/AlertsRow.tsx` — 4 alert widgets composition
- `app/(app)/dashboard/_components/ChartByKind.tsx` — Recharts BarChart đề án theo loại
- `app/(app)/dashboard/_components/ChartByBudgetStatus.tsx` — Recharts BarChart 4-stage budget
- `app/(app)/dashboard/_components/DashboardFilterBar.tsx` — year select + Excel/PDF buttons (client)
- `app/(app)/thong-bao/page.tsx` — Inbox page list với filter
- `app/(app)/thong-bao/_actions/list.ts` — Server actions: listMyInbox, getMyUnreadCount, markRead, markAllRead
- `app/(app)/thong-bao/_components/NotificationFilterBar.tsx` — type/date/unread URL-driven filter
- `app/(app)/thong-bao/_components/NotificationList.tsx` — list with markRead on click + navigate to entity
- `components/layout/NotificationBell.tsx` — topbar bell với polling + dropdown
- `prisma/seed/inbox-notifications.ts` — 20 mock notifications across 7 users

### Modified

- `app/(app)/dashboard/page.tsx` — placeholder → full HERO render
- `components/layout/AppTopbar.tsx` — Bell button → `<NotificationBell />`
- `lib/notifications.ts` — add createNotification + inbox helpers
- `lib/notification-types.ts` — add 6 phase-10 types với labels
- `lib/pdf/render.ts` — add renderDashboardSummaryPdf wrapper
- `app/(app)/de-an/_actions/submit.ts` — type NEW_PROJECT
- `app/(app)/kiem-tra/_actions/request-supplement.ts` — type SUPPLEMENT_REQUEST
- `app/(app)/phan-cong/_actions/assign.ts` — thêm notification dispatch + select name
- `prisma/seed.ts` — wire seedInboxNotifications

## Decisions Made

- **Polling 60s thay websocket** cho NotificationBell unread count — POC scope, real-time defer per CONTEXT.md
- **Server-aggregation single entry-point** `getDashboardSummary()` trả full summary trong 1 RSC call — pattern: RSC renders stats + alerts + charts data, client charts hydrate via ResponsiveContainer
- **Drill-down qua URL search params** (`/de-an?budgetVariance=true&year=2026`) — không tạo special routes, tận dụng existing list pages
- **Mock SLA detection at render time** — CONTEXT.md `<deferred>` quy định: không cron, compute từ queries trên dashboard load
- **Role-aware data scoping** — DONVI thấy chỉ org mình (T-10-01-01 mitigation), implemented trong projectOrgFilter() helper
- **Recharts 3.x Tooltip formatter** — value param now `ValueType | undefined`, dùng `Number(value) || 0` thay vì `value: number` type hint
- **PDF dashboard template** — A4 portrait reusing Be Vietnam Pro font đã đăng ký từ Phase 1; 1-page với 3 sections (chỉ số chính / cảnh báo / đề án theo loại)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Recharts 3.x Tooltip formatter type signature mismatch**
- **Found during:** Task 2 (Charts UI)
- **Issue:** `formatter={(value: number) => [...]}` failed TS2322 — Recharts 3.0 typing has `value: ValueType | undefined`
- **Fix:** Removed explicit `number` type, used `Number(value) || 0` inside formatter; removed unused `labelFormatter`
- **Files modified:** `app/(app)/dashboard/_components/ChartByKind.tsx`, `app/(app)/dashboard/_components/ChartByBudgetStatus.tsx`
- **Verification:** `npm run typecheck` exit 0
- **Committed in:** c954a5c (Task 2 commit)

**2. [Rule 1 - Bug] Wrong import path for formatDate in DashboardSummary template**
- **Found during:** Task 1 (PDF template creation)
- **Issue:** Initial import `from '../../date'` — but `formatDate` lives in `lib/format.ts`, not `lib/date.ts`
- **Fix:** Consolidated import: `import { formatVNDCompact, formatDate } from '../../format'`
- **Files modified:** `lib/pdf/templates/DashboardSummary.tsx`
- **Verification:** `npm run typecheck` exit 0
- **Committed in:** 2fb947c (Task 1 commit)

**3. [Rule 2 - Missing Critical] assignProject server action missing notification dispatch**
- **Found during:** Task 3 (Notification triggers)
- **Issue:** Plan task 3 step 2 listed `phan-cong/_actions/assign.ts → notify chuyên viên` but existing implementation didn't dispatch notification (only logged audit + transitioned project)
- **Fix:** Added try/catch notification.create + notificationDispatch.create cho assigned chuyên viên (recipientUserId=staff.id, type='ASSIGNED'); also added `name` to update select để build notification subject
- **Files modified:** `app/(app)/phan-cong/_actions/assign.ts`
- **Verification:** Seeded notifications include ASSIGNED entries; build passes
- **Committed in:** a0afdaa (Task 3 commit)

**4. [Rule 1 - Bug] Removed unused `Download` lucide-react import**
- **Found during:** Task 2 (DashboardFilterBar)
- **Issue:** Initially imported `Download` icon then unused (replaced với specific FileSpreadsheet/FileText icons), would trigger ESLint unused-imports rule
- **Fix:** Removed import + dead-code span
- **Files modified:** `app/(app)/dashboard/_components/DashboardFilterBar.tsx`
- **Committed in:** c954a5c (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (3 bugs / 1 missing critical)
**Impact on plan:** All fixes essential for build correctness + plan fidelity. No scope creep — Plan task 3 explicitly required notification trigger trên assign.

## Issues Encountered

None — verification (`npm run typecheck` + `npm run build`) passed first try after auto-fixes; seed ran to completion với 20 inbox notifications.

## User Setup Required

None — all functionality runs locally; mock auth + mock notifications.

## Next Phase Readiness

- Phase 11 (polish/UAT) ready với HERO Dashboard delivered + complete inbox + all 20 reqs covered
- Future enhancement candidates:
  - Realtime websocket cho NotificationBell (currently polling 60s)
  - Per-role custom dashboard layouts (currently single layout — DONVI scope filter only)
  - Word export bổ sung Excel + PDF (defer per CONTEXT.md)
  - Daily SLA cron job (currently on-demand at render — works for demo, may not scale)

---
*Phase: 10-m6-dashboard-cảnh-báo*
*Completed: 2026-05-01*

## Self-Check: PASSED

- 10/10 key files exist on disk
- 5/5 task commits exist in git history (2fb947c, c954a5c, a0afdaa, b7ef5cb, 7da23ec)
- npm run typecheck: exit 0
- npm run build: exit 0
- npm run db:seed: exit 0 (20 inbox notifications seeded)
