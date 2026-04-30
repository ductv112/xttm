---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 01-m0-bootstrap-h-t-ng plan 01 (repo init)
last_updated: "2026-04-30T16:44:54.961Z"
last_activity: 2026-04-30
progress:
  total_phases: 11
  completed_phases: 0
  total_plans: 6
  completed_plans: 1
  percent: 17
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30)

**Core value:** Demo end-to-end mượt và đẹp luồng "Vòng đời đề án" (M2-M3): từ Ban quản lý khởi tạo Chu kỳ Chương trình → Đơn vị chủ trì khai báo & nộp đề án → Tiếp nhận & kiểm tra → Hội đồng thẩm định chấm điểm → Ban quản lý lập tờ trình & nhập quyết định phê duyệt.
**Current focus:** Phase 1 — M0 Bootstrap & Hạ tầng

## Current Position

Phase: 1 (M0 Bootstrap & Hạ tầng) — EXECUTING
Plan: 2 of 6
Status: Ready to execute
Last activity: 2026-04-30

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-m0-bootstrap-h-t-ng P01 | 11m | 3 tasks | 38 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

- **R1 PDF Vietnamese (CRITICAL):** Phase 1 phải có PDF spike sớm (font Be Vietnam Pro static + smoke test chuỗi đầy đủ dấu) để tránh fail demo Phase 7
- **R2 Terminology lock (CRITICAL):** Phase 1 phải lock `lib/constants.ts` TERMS dictionary ("đề án" ≠ "dự án", "thẩm định" ≠ "kiểm tra") trước mọi phase nghiệp vụ
- **R5 Relative dates (CRITICAL):** Phase 1 phải có `daysAgo(n)/daysFromNow(n)` helper; mock data Phase 11 phải cover mọi SLA scenarios (28/55/12 ngày)
- **Research flags:** Phase 3, 5, 7, 8, 10 cần `/gsd-research-phase` deep research khi vào planning (đã ghi nhận trong research/SUMMARY.md)

## Session Continuity

Last session: 2026-04-30T16:44:54.958Z
Stopped at: Completed 01-m0-bootstrap-h-t-ng plan 01 (repo init)
Resume file: None
