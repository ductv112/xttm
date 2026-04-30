# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30)

**Core value:** Demo end-to-end mượt và đẹp luồng "Vòng đời đề án" (M2-M3): từ Ban quản lý khởi tạo Chu kỳ Chương trình → Đơn vị chủ trì khai báo & nộp đề án → Tiếp nhận & kiểm tra → Hội đồng thẩm định chấm điểm → Ban quản lý lập tờ trình & nhập quyết định phê duyệt.
**Current focus:** Phase 1 — M0 Bootstrap & Hạ tầng

## Current Position

Phase: 1 of 11 (M0 Bootstrap & Hạ tầng)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-04-30 — ROADMAP.md created with 11 phases mapping 193/193 v1 requirements

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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Initial: Hero flow = M2-M3 (Vòng đời đề án), mọi tradeoff ưu tiên độ mượt + chiều sâu nghiệp vụ của hero
- Initial: Stack chốt — Next.js 15 + Tailwind v4 + shadcn/ui + Prisma/SQLite + NextAuth Credentials
- Initial: 8 tài khoản hardcoded, 1 chu kỳ chương trình / năm (unique year), đề án 2 năm = 2 records có parentProjectId
- Roadmap: 11 phase ánh xạ M0-M7 (M2 tách 2.1/2.2/2.3/2.4); 4 HERO phase (3, 5, 7, 10) cần ngân sách polish cao hơn
- Roadmap: Mọi phase có UI work — đây là UI prototype POC

### Pending Todos

None yet.

### Blockers/Concerns

- **R1 PDF Vietnamese (CRITICAL):** Phase 1 phải có PDF spike sớm (font Be Vietnam Pro static + smoke test chuỗi đầy đủ dấu) để tránh fail demo Phase 7
- **R2 Terminology lock (CRITICAL):** Phase 1 phải lock `lib/constants.ts` TERMS dictionary ("đề án" ≠ "dự án", "thẩm định" ≠ "kiểm tra") trước mọi phase nghiệp vụ
- **R5 Relative dates (CRITICAL):** Phase 1 phải có `daysAgo(n)/daysFromNow(n)` helper; mock data Phase 11 phải cover mọi SLA scenarios (28/55/12 ngày)
- **Research flags:** Phase 3, 5, 7, 8, 10 cần `/gsd-research-phase` deep research khi vào planning (đã ghi nhận trong research/SUMMARY.md)

## Session Continuity

Last session: 2026-04-30
Stopped at: ROADMAP.md + STATE.md initialized; REQUIREMENTS.md traceability updated; ready to start Phase 1 planning
Resume file: None
