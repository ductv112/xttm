---
phase: 10-m6-dashboard-cảnh-báo
plan: 01
title: Dashboard HERO Lãnh đạo + Notification system + SLA alerts
wave: 1
autonomous: yes
depends_on: []
requirements: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11, DASH-12, ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05, ALERT-06, ALERT-07, ALERT-08]
---

<objective>
HERO Dashboard cho lãnh đạo + complete notification system. 20 reqs (DASH-01..12 + ALERT-01..08).
</objective>

<threat_model>
- T-10-01-01 (medium): Cross-tenant trong widgets — server-side filter theo role
- T-10-01-02 (low): Notification spam — rate limit per user per type
</threat_model>

<task n="1" id="10-01-01" type="dashboard-data-aggregation">
<read_first>
- prisma/schema.prisma
- lib/system-config.ts (SLA thresholds)
- app/(app)/dashboard/page.tsx (current placeholder)
</read_first>

<action>
Create dashboard data layer:

1. lib/dashboard-aggregations.ts:
```
export async function getDashboardSummary(year: number, role: string) {
  // Returns: {
  //   stats: { projectCount, registeredBudget, approvedBudget, signedBudget, disbursedBudget, orgCount, completionPercent },
  //   alertBudgetVariance: [{projectId, name, registered, approved}],
  //   alertContractDelay: [{projectId, name, daysOverdue}],
  //   alertReportOverdue: [{projectId, name, daysOverdue}],
  //   alertConsulate: [{projectId, name, daysToEvent, country}],
  //   chartByKind: [{kind, count}],
  //   chartByBudgetStatus: [{status, amount}],
  // }
}
```

2. app/(app)/dashboard/_actions/get-summary.ts: server action wrap of getDashboardSummary
3. app/(app)/dashboard/_actions/export-excel.ts: action returns Excel buffer
4. app/(app)/dashboard/_actions/export-pdf.ts: action returns PDF buffer (use lib/pdf)

Run npx tsc --noEmit exit 0.
Commit: `feat(10-01): dashboard data aggregations + export actions`
</action>
</task>

<task n="2" id="10-01-02" type="dashboard-ui">
<action>
Replace app/(app)/dashboard/page.tsx with full dashboard:

Layout grid:
- Row 1: 4 stat cards (StatCard component reused)
- Row 2: 4 alert widget cards
- Row 3: 2 charts (50/50)
- Top right: year filter dropdown + "Xuất Excel" + "Xuất PDF" buttons

Components:
- _components/AlertWidgetCard.tsx: icon + count + top 3 items list + "Xem tất cả" link with drill-down URL params
- _components/ChartByKind.tsx: Recharts BarChart (đề án count by ProjectKind)
- _components/ChartByBudgetStatus.tsx: Recharts ComposedChart (multi-series budget)
- _components/DashboardFilterBar.tsx: year select + export buttons
- _components/DashboardStatsRow.tsx: 4 stat cards layout

Drill-down URLs:
- /chuong-trinh?year=2026 (from cycle stat)
- /de-an?status=APPROVED&year=2026 (from project stat)
- /hop-dong?status=DRAFT&overdue=true (from contract delay alert)
- /de-an?reportOverdue=true (from report overdue alert)
- /de-an?consulatePending=true (from consulate alert)

Server-side render với getDashboardSummary, hydrate client charts.

Commit: `feat(10-01): dashboard UI — 4 stats + 4 alerts + 2 charts + filter + export`
</action>
</task>

<task n="3" id="10-01-03" type="notification-inbox">
<action>
1. lib/notifications.ts: extend với functions:
   - createNotification(type, content, recipients[])
   - listMyNotifications({ unreadOnly, type, dateRange })
   - markRead(notificationId)
   - markAllRead()
   - getUnreadCount()

2. Trigger points (server actions adding notification creation):
   - app/(app)/de-an/_actions/submit.ts → notify BQL "Có đề án mới: [tên]"
   - app/(app)/phan-cong/_actions/assign.ts → notify chuyên viên "Bạn được phân công kiểm tra: [tên]"
   - app/(app)/kiem-tra/_actions/request-supplement.ts → notify đơn vị "Yêu cầu bổ sung hồ sơ: [tên]"
   - (ALERT-04 already in Phase 7 notifyResults)

3. Topbar bell badge:
   - Update components/layout/AppTopbar.tsx: add NotificationBell with unread count badge
   - Click → dropdown showing top 10 recent notifications + "Xem tất cả" link

4. /thong-bao route:
   - page.tsx: list with filter (type, unread, date range), mark read on click
   - _components/NotificationList.tsx
   - _components/NotificationFilterBar.tsx

5. SLA daily check (mock cron via dashboard load):
   - On dashboard load, server-side detect SLA violations and createNotification if not already notified within 24h
   - Or simpler: compute SLA from queries on dashboard render — show in alert widgets (existing) — don't double-send notifications

Commits:
- `feat(10-01): notification triggers cho submit + assign + supplement`
- `feat(10-01): NotificationBell topbar + /thong-bao inbox`
</action>
</task>

<task n="4" id="10-01-04" type="seed">
<action>
Update seed: create 15-20 notifications cho mock users covering all types (NEW_PROJECT, ASSIGNED, SUPPLEMENT_REQUEST, APPROVAL_RESULT, SLA_WARNING). Mix read/unread.

Commit: `feat(10-01): seed notifications for mock users`
</action>
</task>

<verification>
npm run build exit 0. Update STATE.md, ROADMAP.md, REQUIREMENTS.md mark 20 reqs complete. Phase 10 HERO done.
</verification>
