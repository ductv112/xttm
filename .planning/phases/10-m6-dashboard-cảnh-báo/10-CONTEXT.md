# Phase 10: M6 Dashboard & Cảnh báo (HERO Lãnh đạo) - Context

**Gathered:** 2026-05-01

<domain>
HERO cho lãnh đạo. Screen đầu tiên lãnh đạo nhìn — wow factor mạnh nhất.

**In scope (20 reqs):** DASH-01..12 + ALERT-01..08
</domain>

<decisions>
### Dashboard tổng quan (DASH-01..12)
- Route /dashboard (đã có placeholder, replace với dashboard thật)
- Layout: 4 stat cards + 4 cảnh báo widgets + 2 charts row + drill-down
- Filter năm dropdown (default current year)

**Stat cards (4):**
- Số đề án năm: `[X] đề án — Y đăng ký, Z duyệt, W đang triển khai`
- Tổng kinh phí năm: `[X tỷ VND] — Y đăng ký, Z duyệt, W giải ngân`
- Đơn vị tham gia: `[X] đơn vị — Y đã có hồ sơ APPROVED`
- Tiến độ chung: `[X%] hoàn thành — sparkline` (% completed projects out of total)

**4 cảnh báo widgets (DASH-02..05):**
- Sai lệch ngân sách: list projects approvedBudget > registeredBudget
- Chậm ký HĐ (60d): list projects APPROVED > 60 ngày chưa SIGNED contract
- Vi phạm hạn báo cáo (15d): list projects events ended > 15d chưa SUBMITTED report
- Đề án quốc tế chưa liên hệ thương vụ (30d): list projects international < 30d to event AND !contactedConsulate

Mỗi widget: icon + count + 3 dòng top items + button "Xem tất cả →" (drill-down to filtered list)

**Charts (DASH-08..10):**
- Bar chart "Đề án theo loại" (Recharts) — count per kind
- Multi-series chart "Kinh phí theo trạng thái" — đăng ký vs phê duyệt vs hợp đồng vs giải ngân (stacked bar hoặc multi-line)

**Drill-down (DASH-07):**
- Click widget → /chuong-trinh, /de-an, /hop-dong với filter URL params highlighted
- 3-click chain: card → list filtered → record detail

**Export (DASH-11..12):**
- Button "Xuất Excel" / "Xuất PDF" trên dashboard → download summary report
- Import (DASH-12 stretched, có thể skip cho POC)

### Notification system (ALERT-01..08)
- Schema: Notification + NotificationDispatch (đã có từ Phase 3)
- ALERT-01 server-side trigger: khi project SUBMITTED → notify BQL
- ALERT-02: khi assigned → notify chuyên viên
- ALERT-03: khi requestSupplement → notify đơn vị
- ALERT-04: khi approval decision → notify đơn vị (đã có Phase 7)
- ALERT-05 SLA cron: daily check → notify SLA-violating projects (mock — use server-side check on dashboard load instead of cron)
- ALERT-06: Inbox topbar bell với unread count badge
- ALERT-07: /thong-bao page lịch sử thông báo cá nhân với filter
- ALERT-08: mock-only, không gửi real email/SMS

### Claude's Discretion
- Card layout (responsive grid)
- Chart colors
- Drill-down UX details
- Mock notifications: tạo 10-15 entries cho user hiện tại
</decisions>

<canonical_refs>
- prisma/schema.prisma — Notification, NotificationDispatch (đã có từ Phase 3)
- lib/system-config.ts — SLA thresholds
- lib/audit.ts
- components/shared/* — DataTable, EmptyState
- /api/pdf/* — reuse PDF infrastructure
- CLAUDE.md
</canonical_refs>

<deferred>
- Real-time websocket — out of scope (use polling 30s)
- Advanced filtering charts — defer
- Custom dashboard per role — Phase 11 polish
- Export Word — out of scope (PDF + Excel đủ)
</deferred>
