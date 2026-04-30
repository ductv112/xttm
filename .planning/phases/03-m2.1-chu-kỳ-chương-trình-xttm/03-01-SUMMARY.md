---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 01
subsystem: program-cycle-foundation
tags: [program-cycle, state-machine, schema, notification-mock, seed, hero-foundation]
requirements: [CYCLE-05]
dependency_graph:
  requires:
    - "@prisma/client (M0)"
    - "lib/date.ts daysAgo / daysFromNow (M0)"
    - "lib/audit.ts withAuditLog (Phase 2)"
    - "prisma/seed/organizations.ts (Phase 1)"
    - "prisma/seed/users.ts (Phase 1) — banql user"
  provides:
    - "lib/workflows/programCycle.ts authoritative state machine — ALLOWED_NEXT_STATES, validateGuards, canTransitionCycle, CYCLE_STATUS_BADGE_THEME"
    - "lib/notifications.ts mock dispatch helpers — sendCycleInvitation, listCycleDispatches, markDispatchRead, getCycleNotificationStats"
    - "lib/notification-types.ts — NotificationType (5 keys), DispatchStatus, RecipientType + VN labels"
    - "Notification + NotificationDispatch DB models (CYCLE-13 mock dispatch storage)"
    - "Attachment metadata công văn (signedNumber/signedDate/signedByName/signedByTitle)"
    - "ProgramCycle 3 fields mới: invitationLetterAttachmentId, supplementDeadline, configJson"
    - "DB seed: 3 cycles (2025/2026/2027) + 1 attachment + 2 notifications + 10 dispatches"
  affects:
    - "Plan 03-02 visual components — sẽ consume CYCLE_STATUS_BADGE_THEME, ALLOWED_NEXT_STATES"
    - "Plan 03-03 server actions — sẽ wrap canTransitionCycle/validateGuards trong transitionCycle action + sendCycleInvitation trong inviteAction"
    - "Plan 03-04 wizard — sẽ ghi configJson trong step 3-4"
    - "Plan 03-06 detail page tab Đơn vị mời + thông báo — sẽ consume getCycleNotificationStats"
tech-stack:
  added: []
  patterns:
    - "TRANSITIONS table = SOLE source of truth (PITFALLS R3 mitigation)"
    - "validateGuards layered on top transition table — domain rules return Vietnamese reasons"
    - "Mock dispatch tx pattern: 1 Notification + N Dispatches in $transaction"
    - "Seed dùng daysAgo/daysFromNow cho cycle hiện tại (PITFALLS R5)"
    - "Idempotent seed: upsert by year + findFirst by subject+programCycleId trước insert"
    - "Pure data layer (lib/notifications.ts) — RBAC + audit defer to caller server actions"
key-files:
  created:
    - "lib/notification-types.ts"
    - "lib/notifications.ts"
    - "prisma/seed/program-cycles.ts"
    - "prisma/seed/notifications.ts"
    - "storage/uploads/cong-van/.gitkeep"
  modified:
    - "prisma/schema.prisma"
    - "lib/workflows/programCycle.ts"
    - "prisma/seed.ts"
    - "prisma/seed/organizations.ts"
    - ".gitignore"
    - "storage/.gitignore"
key-decisions:
  - "TRANSITIONS table được lock trong programCycle.ts — mọi server action Phase 3+ MUST consult canTransitionCycle/validateGuards (PITFALLS R3 mitigation)"
  - "lib/notifications.ts là pure data layer — KHÔNG check RBAC, KHÔNG audit log; server actions Plan 03-03 sẽ wrap"
  - "Seed VASEP + VCCI vào prisma/seed/organizations.ts (orgs 5→7) để hỗ trợ 5 invited orgs cho CYCLE-13 demo realistic — Rule 3 deviation"
  - "validateGuards trả Vietnamese reason cụ thể (vd: 'Vui lòng upload công văn ban hành trước khi mở cổng') — UI hiển thị trực tiếp"
  - "Cycle 2026 dùng daysAgo(28)/daysFromNow(12) RELATIVE — banner luôn 'còn 12 ngày' realistic không stale"
  - ".gitignore exception !uploads/**/.gitkeep + sửa storage/.gitignore để track sub-dir gitkeep cho phép tổ chức storage by entity"
metrics:
  duration: "6m"
  completed_date: "2026-04-30"
  tasks_completed: 3
  files_created: 5
  files_modified: 6
  commits: 3
---

# Phase 3 Plan 01: Schema + State Machine + Mock Dispatch Foundation Summary

**One-liner:** Đặt nền móng dữ liệu + nghiệp vụ Phase 3 — schema Notification/Dispatch + Attachment metadata công văn, state machine 7-state ProgramCycle với validateGuards (PITFALLS R3), mock dispatch helpers, và seed 3 cycles realistic (2025 COMPLETED / 2026 OPEN_REGISTRATION với daysAgo(28)/daysFromNow(12) / 2027 DRAFT) + 10 dispatches mix READ/SENT.

## Tasks Executed

### Task 1: Schema Notification + Workflow State Machine + Notification Types

**Commit:** `51c8935`

- `prisma/schema.prisma`:
  - Append `Notification` model (id, programCycleId?, projectId?, type, subject, content, recipientType, createdById, createdAt + 3 indexes)
  - Append `NotificationDispatch` model (id, notificationId, recipientUserId?, recipientOrgId?, status default SENT, sentAt default now, readAt? + cascade onDelete + 4 indexes)
  - Extend `Attachment` với 4 fields công văn metadata: `signedNumber`, `signedDate`, `signedByName`, `signedByTitle`
  - Extend `ProgramCycle` với 3 fields: `invitationLetterAttachmentId` (FK to Attachment), `supplementDeadline`, `configJson` (JSON for Plan 03-04+ consume)
  - Back-relation `notifications: Notification[]` thêm vào ProgramCycle
- `npx prisma db push --skip-generate` + `npx prisma generate` thành công, DB sync sạch
- `lib/notification-types.ts` (new, 34 lines): `NOTIFICATION_TYPES` array + `NotificationType` (5 keys), `DISPATCH_STATUSES` (4) + `DispatchStatus`, `RECIPIENT_TYPES` (3) + `RecipientType`, plus 2 VN label maps
- `lib/workflows/programCycle.ts` REPLACE (160 lines):
  - Type `ProgramCycleStatus` (7 keys, kept backward compat)
  - `PROGRAM_CYCLE_STATUSES` const array
  - `TRANSITIONS` table EXACT match CONTEXT.md spec — DRAFT→READY, READY→{OPEN, DRAFT}, OPEN→CLOSED, CLOSED→{OPEN, EVALUATING}, EVALUATING→APPROVED, APPROVED→COMPLETED, COMPLETED→[]
  - `canTransitionCycle(from, to)` — uses TRANSITIONS as source of truth
  - `ALLOWED_NEXT_STATES(status)` — UI helper
  - `CYCLE_STATUS_LABELS` — VN labels
  - `CYCLE_STATUS_BADGE_THEME` (slate/blue/green/amber/emerald/slateDark)
  - `GuardResult` type + `CycleGuardSubject` type
  - `validateGuards(cycle, target)` — layered checks: transition table first; then DRAFT→READY needs registrationOpenAt+registrationCloseAt+totalBudget; READY→OPEN_REGISTRATION needs invitationLetterAttachmentId; returns Vietnamese reason
- Smoke test: 7/7 assertions pass

### Task 2: lib/notifications.ts Mock Dispatch Helpers

**Commit:** `f7bd399`

- `lib/notifications.ts` (new, 150 lines)
- Exports 4 functions + 4 types:
  - `sendCycleInvitation(input)` — `prisma.$transaction` wrap creating 1 Notification + N NotificationDispatches; validates `recipientOrgIds.length` 1..50 (T-03-01-04 mitigation); status=SENT, sentAt=now
  - `listCycleDispatches(cycleId, options)` — orderBy createdAt desc, take limit (default 20), include `_count.dispatches` + first dispatch `sentAt`
  - `markDispatchRead(dispatchId)` — idempotent status=READ + readAt=now (Phase 4 inbox UI consume)
  - `getCycleNotificationStats(cycleId)` — `groupBy` by status returning `{ totalNotifications, totalDispatches, readDispatches }`
- Pure data layer — NO RBAC check, NO audit log inside; caller server action Plan 03-03 will wrap
- Smoke test (with cycle 9999 cleanup): 8/8 assertions pass — including markDispatchRead transitions stats from `readDispatches=0` → `1`

### Task 3: Seed 3 Cycles + 2 Notifications + 10 Dispatches + Storage

**Commit:** `eeaf543`

- `prisma/seed/program-cycles.ts` (new):
  - Cycle 2025 — `COMPLETED`, totalBudget 85B VND, dates fixed in 2025 (1/3 → 30/5 reg, eval 15/6-30/7, approval 15/8)
  - Cycle 2026 — `OPEN_REGISTRATION`, totalBudget 95B VND, **RELATIVE dates** via `daysAgo(28)` (registrationOpenAt) + `daysFromNow(12)` (registrationCloseAt) + `daysFromNow(20)` supplement + `daysFromNow(15/45/60)` eval/approval — banner luôn realistic (PITFALLS R5)
  - Cycle 2026 thêm 1 `Attachment`: signedNumber `1234/CV-XTTM`, signedDate `daysAgo(35)`, signedByName `Bùi Xuân Hồng`, signedByTitle `Cục trưởng Cục XTTM`, fileUrl `storage/uploads/cong-van/cycle-2026-mock.pdf`, fileSize 245678; cycle.invitationLetterAttachmentId update sau khi tạo
  - Cycle 2027 — `DRAFT`, all date fields null
  - All upsert by `year` (idempotent)
- `prisma/seed/notifications.ts` (new):
  - Cycle 2025: 1 Notification subject `Mời tham gia Chương trình XTTM Quốc gia 2025`, contentHtml VN honorific 'Kính gửi Quý đơn vị,...', createdAt `2025-03-02`; 5 dispatches all status=`READ` với readAt 2025-03-02 14:15
  - Cycle 2026: 1 Notification subject `... — Hạn nộp 30/05/2026`, createdAt `daysAgo(27)`; 5 dispatches mix — 3 READ (LEFASO/VITAS/VINATEX với readAt staggered daysAgo(26/25/20)) + 2 SENT (VASEP/VCCI) chưa đọc
  - Idempotent: findFirst by `{programCycleId, subject}` trước insert
- `prisma/seed/organizations.ts`: thêm VASEP + VCCI (orgs 5→7) — Rule 3 deviation (cần đủ 5 invited orgs cho realistic CYCLE-13 demo)
- `prisma/seed.ts`: chain `seedProgramCycles` + `seedCycleNotifications` sau `seedSystemConfig`, before final smoke verify
- `storage/uploads/cong-van/.gitkeep` tracked
- `.gitignore` + `storage/.gitignore` exception `!uploads/**/.gitkeep`
- Re-run idempotent verified (2 lần seed, count remains 3/2/10)
- Verification: 13/13 assertions pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Thiếu organizations VASEP + VCCI cho 5-org invitation demo**
- **Found during:** Task 3 seed planning
- **Issue:** Plan yêu cầu 5 dispatches per cycle (VITAS/LEFASO/VINATEX/VASEP/VCCI) nhưng `prisma/seed/organizations.ts` chỉ seed 5 orgs gồm BO_CT + CUC_XTTM + 3 invited (VITAS, LEFASO, VINATEX). VASEP và VCCI tồn tại trong `lib/constants.ts ORG_CODES` và `ORG_NAMES` nhưng KHÔNG được seed → `resolveOrgIds` sẽ return 3/5 → seed crash hoặc 3 dispatches thay vì 5.
- **Fix:** Append 2 records (VASEP, VCCI) vào `SEED_ORGS` array với taxCode + address + email realistic, isInvited=true.
- **Files modified:** `prisma/seed/organizations.ts`
- **Commit:** `eeaf543`

**2. [Rule 2 - Critical] Sub-dir .gitkeep bị gitignore swallow**
- **Found during:** Task 3 verify gitkeep tracked
- **Issue:** Root `.gitignore` rule `storage/uploads/*` + nested `storage/.gitignore` rule `uploads/*` đều ignore mọi entries trong `uploads/`, exception `!storage/uploads/.gitkeep` chỉ match top-level. `storage/uploads/cong-van/.gitkeep` vẫn bị ignore → không thể commit + future devs sẽ thiếu directory structure.
- **Fix:** Append `!storage/uploads/*/` + `!storage/uploads/**/.gitkeep` vào `.gitignore`; same pattern `!uploads/*/` + `!uploads/**/.gitkeep` cho `storage/.gitignore`. Verify qua `git check-ignore -v` — gitkeep now matches negation rule.
- **Files modified:** `.gitignore`, `storage/.gitignore`
- **Commit:** `eeaf543`

## Authentication Gates

None — Task 1 schema migration (db push) ran without auth; Task 2 smoke test used existing seed user `banql`; Task 3 seed runs locally without auth (seed script not exposed via HTTP).

## Verification Results

| Verification | Expected | Actual | Pass |
|---|---|---|---|
| `model Notification ` in schema.prisma | hit | 1 | yes |
| `model NotificationDispatch` in schema.prisma | hit | 1 | yes |
| `invitationLetterAttachmentId` in schema.prisma | hit | 1 | yes |
| `lib/workflows/programCycle.ts` line count | ≥ 120 | 160 | yes |
| `lib/notifications.ts` exports | ≥ 4 | 8 (4 functions + 4 types) | yes |
| `lib/notifications.ts` line count | ≥ 60 | 150 | yes |
| `npx prisma db push` exit 0 | yes | yes | yes |
| `npx tsc --noEmit` exit 0 | yes | yes | yes |
| `npm run db:seed` first run exit 0 | yes | yes | yes |
| `npm run db:seed` second run idempotent | yes | yes (no errors) | yes |
| ProgramCycle count | 3 | 3 | yes |
| Years | 2025,2026,2027 | 2025,2026,2027 | yes |
| Cycle 2026 status | OPEN_REGISTRATION | OPEN_REGISTRATION | yes |
| Cycle 2025 status | COMPLETED | COMPLETED | yes |
| Cycle 2027 status | DRAFT | DRAFT | yes |
| Cycle 2026 has invitationLetterAttachmentId | not null | not null | yes |
| Notification count | 2 | 2 | yes |
| NotificationDispatch count | 10 | 10 | yes |
| Attachment.signedNumber | `1234/CV-XTTM` | matches | yes |
| Attachment.signedByName | `Bùi Xuân Hồng` | matches | yes |
| Cycle 2026 dispatches READ | 3 | 3 (LEFASO, VITAS, VINATEX) | yes |
| Cycle 2026 dispatches SENT | 2 | 2 (VASEP, VCCI) | yes |
| Cycle 2026 registrationOpenAt = ~28 days ago | true | true | yes |
| Cycle 2026 registrationCloseAt = ~12 days ahead | true | true | yes |
| Workflow smoke (canTransition + guards + theme) | 7/7 true | 7/7 true | yes |
| Notifications smoke (send + list + stats + markRead) | 8/8 true | 8/8 true | yes |

## Threat Mitigation

| Threat ID | Mitigation Implemented |
|---|---|
| T-03-01-01 | TRANSITIONS const là SOLE source — `canTransitionCycle`, `validateGuards`, `ALLOWED_NEXT_STATES` đều consult this table; Plan 03-03+ MUST use these helpers |
| T-03-01-02 | Accepted (POC scope — out of plan) |
| T-03-01-03 | Accepted (seed dev-only) |
| T-03-01-04 | `sendCycleInvitation` validates `recipientOrgIds.length` 1..50 — throws Vietnamese error |
| T-03-01-05 | Seed sets `signedDate = daysAgo(35)` (fixed past); Plan 03-03 server action sẽ Zod validate ≤ today |
| T-03-01-06 | Seed throws fast nếu `banql` user missing — `seedProgramCycles` precondition check |

## Threat Flags

None — không thêm trust boundary mới ngoài plan threat_model.

## Self-Check: PASSED

**Files verified existing:**
- FOUND: lib/notification-types.ts
- FOUND: lib/notifications.ts
- FOUND: prisma/seed/program-cycles.ts
- FOUND: prisma/seed/notifications.ts
- FOUND: storage/uploads/cong-van/.gitkeep
- FOUND: lib/workflows/programCycle.ts (modified)
- FOUND: prisma/schema.prisma (modified)
- FOUND: prisma/seed.ts (modified)
- FOUND: prisma/seed/organizations.ts (modified)
- FOUND: .gitignore (modified)
- FOUND: storage/.gitignore (modified)

**Commits verified:**
- FOUND: 51c8935 — Task 1 schema + workflow + notification-types
- FOUND: f7bd399 — Task 2 lib/notifications.ts
- FOUND: eeaf543 — Task 3 seed 3 cycles + 2 notifications + 10 dispatches

**Database verified:**
- 3 ProgramCycles (2025/2026/2027 COMPLETED/OPEN_REGISTRATION/DRAFT)
- 1 Attachment metadata công văn linked
- 2 Notifications + 10 Dispatches
- Re-run seed twice idempotent
