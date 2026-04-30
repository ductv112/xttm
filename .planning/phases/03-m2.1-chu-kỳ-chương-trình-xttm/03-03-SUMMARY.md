---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 03
subsystem: program-cycle-server-actions
tags: [server-actions, rbac, zod, audit, file-upload, rate-limit, state-machine]
requirements: [CYCLE-02, CYCLE-07, CYCLE-08, CYCLE-09, CYCLE-10, CYCLE-11, CYCLE-13]
dependency_graph:
  requires:
    - "lib/workflows/programCycle.ts (Plan 03-01) — canTransitionCycle, validateGuards, CYCLE_STATUS_LABELS, PROGRAM_CYCLE_STATUSES"
    - "lib/notifications.ts (Plan 03-01) — sendCycleInvitation, listCycleDispatches"
    - "lib/audit.ts (Phase 2) — withAuditLog wrapper"
    - "lib/audit-types.ts — AUDIT_ACTIONS"
    - "lib/permissions-db.ts (Phase 2) — canFromDB authoritative check"
    - "lib/auth.ts — auth() session"
    - "lib/prisma.ts — prisma client singleton"
    - "Prisma models ProgramCycle + Attachment + Notification (Plan 03-01)"
  provides:
    - "9 server actions: listCycles, getCycleDetail, createCycle, updateCycle, transitionCycle, extendCycle, uploadCongVan, sendInvitation (+ index barrel)"
    - "createCycleSchema, updateCycleSchema, transitionInputSchema, extendInputSchema, uploadCongVanMetadataSchema, sendInvitationInputSchema — all Zod"
    - "CycleListItem / CycleDetail / CreateCycleInput / UpdateCycleInput types for UI consumption"
    - "Authoritative state machine entrypoint — transitionCycle (PITFALLS R3 lock)"
    - "Rate-limited mock dispatch entrypoint — sendInvitation"
    - "PDF upload entrypoint with triple validation — uploadCongVan"
    - "AuditAction enum extended: UPLOAD, DISPATCH, EXTEND (+ TRANSITION already present) + AUDIT_ACTION_LABELS + AUDIT_ACTION_BADGE"
  affects:
    - "Plan 03-04 wizard 5 bước — sẽ call createCycle để tạo nháp + updateCycle để autosave"
    - "Plan 03-05 list page card view — sẽ call listCycles"
    - "Plan 03-06 detail page 6 tabs — sẽ call getCycleDetail + uploadCongVan + sendInvitation + updateCycle"
    - "Plan 03-07 action handlers — sẽ call transitionCycle + extendCycle"
tech-stack:
  added: []
  patterns:
    - "RBAC dòng 1-3 trong mọi action: auth() + canFromDB(role, 'chuong-trinh', action) + throw VN message — defense-in-depth (UI là layer 2 only)"
    - "Authoritative state machine: transitionCycle consults canTransitionCycle + validateGuards before update; CLOSED→OPEN re-open delegated to extendCycle (force Gia hạn flow) — PITFALLS R3 mitigation lock"
    - "Triple PDF validation: file.type === application/pdf + size ≤ 10MB + magic byte 0x25504446 (T-03-03-03)"
    - "Path safety: storedFileName = randomUUID() + .pdf — original filename only stored in DB; cycleId regex-validated (T-03-03-05)"
    - "Year unique race: Prisma @unique catches via P2002; Zod pre-check is UX nicety (T-03-03-07)"
    - "Rate limit: Map<cycleId, lastSentAt> with 5-min cooldown for sendInvitation (T-03-03-04); recipientOrgIds.length ≤ 50"
    - "configJson stash for fields without DB columns (description) + extension history list — keeps schema lean while supporting wizard payload"
    - "withAuditLog every mutation: captureBefore loads existing row, captureAfter returns post-mutation snapshot (UPDATE + EXTEND); CREATE captures result; TRANSITION captures from→to + reason metadata"
    - "Significant-change detection in updateCycle while OPEN_REGISTRATION (closeAt OR scoringCriteriaIds OR evaluationCriteriaIds changed) → flag returned to UI for prompt-to-notify"
key-files:
  created:
    - "app/(app)/chuong-trinh/_actions/types.ts"
    - "app/(app)/chuong-trinh/_actions/list.ts"
    - "app/(app)/chuong-trinh/_actions/get-detail.ts"
    - "app/(app)/chuong-trinh/_actions/create.ts"
    - "app/(app)/chuong-trinh/_actions/update.ts"
    - "app/(app)/chuong-trinh/_actions/transition.ts"
    - "app/(app)/chuong-trinh/_actions/extend.ts"
    - "app/(app)/chuong-trinh/_actions/upload-cong-van.ts"
    - "app/(app)/chuong-trinh/_actions/send-invitation.ts"
    - "app/(app)/chuong-trinh/_actions/index.ts"
  modified:
    - "lib/audit-types.ts"
key-decisions:
  - "ProgramCycle has no description column trong schema — stash description (+ scoring/evaluation/email criteria ids) inside configJson to avoid schema migration; getCycleDetail extracts via safeParseConfigJson"
  - "transitionCycle rejects CLOSED→OPEN with explicit message 'Vui lòng dùng chức năng Gia hạn' — forces correct path (extendCycle records reason + extension history)"
  - "Rate limit uses in-memory Map (single-instance) — production multi-instance phase sẽ thay Redis pub/sub; documented inline comment"
  - "PDF magic byte check sau khi đọc full arrayBuffer (cần buffer toàn file để write tới disk anyway — không tradeoff perf)"
  - "Schemas exported alongside actions in 'use server' files — Next 15 build pass; aligns with usage where Plan 03-04 wizard reuses createCycleSchema for client form RHF resolver"
  - "uploadCongVan stores fileUrl using POSIX separators ('storage/uploads/cong-van/{cycleId}/{uuid}.pdf') for portability — disk write uses platform-specific join() but URL is normalized"
  - "extendCycle returns autoNotify hint (true if invitedOrgs > 0) — UI in Plan 03-07 chooses whether to chain sendInvitation"
metrics:
  duration: "8m"
  completed_date: "2026-04-30"
  tasks_completed: 4
  files_created: 10
  files_modified: 1
  commits: 4
---

# Phase 3 Plan 03: Server Actions + RBAC Summary

**One-liner:** 9 server actions cho ProgramCycle CRUD + lifecycle (~1 400 LOC, 10 files) — mọi action có 'use server' + canFromDB RBAC dòng 1-3 + Zod validation + withAuditLog wrap; authoritative state machine via transitionCycle (canTransitionCycle + validateGuards consulted), triple PDF validation (MIME + 10MB + magic byte 0x25504446), in-memory rate-limit Map cho sendInvitation 5 phút cooldown, year-unique constraint pre-check + Prisma P2002 catch.

## Tasks Executed

### Task 1: audit-types update + types.ts + listCycles + getCycleDetail

**Commit:** `9d546df`

- `lib/audit-types.ts`:
  - Append `UPLOAD`, `DISPATCH`, `EXTEND` to `AUDIT_ACTIONS` array (TRANSITION đã có sẵn từ Phase 2)
  - Add VN labels: UPLOAD=`Tải lên tệp`, DISPATCH=`Gửi thông báo`, EXTEND=`Gia hạn`
  - Add badge tones: UPLOAD=slate, DISPATCH=emerald, EXTEND=amber; bumped TRANSITION từ slate→blue per plan
- `app/(app)/chuong-trinh/_actions/types.ts` (NEW):
  - `CycleListFilter` (year + statuses)
  - `CycleListItem` (id/year/name/status/totalBudget/registrationOpenAt/registrationCloseAt/supplementDeadline/createdAt/projectCount/invitedOrgCount/daysRemaining)
  - `CreateCycleInput` + `UpdateCycleInput` (id required + Partial)
  - `CycleAttachmentSummary`, `CycleOrganizationSummary`, `CycleDispatchSummaryRow`
  - `CycleDetail` aggregating cycle row + attachment + invitedOrganizations + dispatchSummary + projectCount
- `list.ts` (NEW): `'use server'` + `auth()` + `canFromDB('chuong-trinh','read')` + filter year/statuses + Prisma findMany với `_count.projects` + invitedOrgs JSON parse + `daysRemaining` from registrationCloseAt; orderBy year desc
- `get-detail.ts` (NEW): RBAC read + parallel Promise.all fetch attachment+invitedOrgs+dispatchSummary; configJson safeParse extracts description (no DB column) + scoringCriteriaIds + evaluationCriteriaIds + emailTemplateIds; throws 'Không tìm thấy chu kỳ chương trình' if missing

**Smoke verified:** 3 cycles seeded (2025 COMPLETED, 2026 OPEN_REGISTRATION với 5 invited orgs + attachment cong-van-moi-2026.pdf signedNumber 1234/CV-XTTM Bùi Xuân Hồng, 2027 DRAFT) — listCycles + getCycleDetail data shape matches

### Task 2: createCycle + updateCycle với Zod year-unique + significantChange detection

**Commit:** `f894947`

- `create.ts` (NEW): `createCycleSchema` Zod object — year (int 2020-2050), name (5-200), description (max 2000), totalBudget (nonnegative), 6 dates optional, 4 string-array fields default empty; `superRefine` enforces registrationCloseAt > registrationOpenAt + supplementDeadline > registrationCloseAt
- Pre-check year uniqueness via `prisma.programCycle.findUnique({where:{year}})` → CYCLE-02 VN message; Prisma P2002 catch covers race (T-03-03-07 mitigation)
- `configJson` stash {description, scoringCriteriaIds, evaluationCriteriaIds, emailTemplateIds} (ProgramCycle has no description column)
- Status defaults DRAFT; createdById from session; `revalidatePath('/chuong-trinh')`
- Wrapped via `withAuditLog<CREATE>` returning {year, status} as captureAfter
- `update.ts` (NEW): `updateCycleSchema` partial w/ id required, same date-ordering refines; year-change conflict check; `safeParseConfig` merge preserves unset fields; **significantChange** flag set when status === OPEN_REGISTRATION AND (closeAt changed OR scoringCriteriaIds changed OR evaluationCriteriaIds changed) — UI uses to prompt confirm gửi thông báo
- Field-by-field Prisma update payload (no spread mass-assignment); double revalidatePath; `withAuditLog<UPDATE>` captureBefore loads cycle, captureAfter loads updated row → diff in audit JSON

### Task 3: transitionCycle (authoritative state machine) + extendCycle (gia hạn)

**Commit:** `8dbfd31`

- `transition.ts` (NEW): `transitionInputSchema` — cycleId + target enum (7 statuses) + optional reason
- RBAC `'update'` action; load cycle (404 nếu null); **special case** CLOSED→OPEN ⇒ throw 'Vui lòng dùng chức năng Gia hạn để mở lại cổng đăng ký' để force correct path
- Authoritative gate: `canTransitionCycle(from, to)` first → 'Không thể chuyển từ X sang Y' nếu false; then `validateGuards({status, invitationLetterAttachmentId, registrationOpenAt, registrationCloseAt, totalBudget}, target)` → throw guard.reason (already VN-localized)
- Update Prisma + double revalidatePath; `withAuditLog<TRANSITION>` captureBefore status, captureAfter {from, to, reason}
- `extend.ts` (NEW): `extendInputSchema` — cycleId + reason (10-1000 chars) + newDeadline (must be > now())
- Require status === CLOSED_REGISTRATION; append extension entry into configJson.extensions[] ({date, reason, oldCloseAt, newCloseAt, extendedById})
- Update {status: OPEN_REGISTRATION, registrationCloseAt: newDeadline, configJson}; return autoNotify=true if invitedOrgs > 0 (Plan 03-07 dùng để chain prompt sendInvitation)
- `withAuditLog<EXTEND>` captureBefore {status, registrationCloseAt}, captureAfter {status, registrationCloseAt, extendReason} — diff includes reason

**Smoke verified:** Cycle 2027 (DRAFT, no attachment, no dates) — `canTransitionCycle('DRAFT','OPEN_REGISTRATION')` returns false (must go through READY); `canTransitionCycle('DRAFT','READY')` returns true at table level but guard would throw 'Vui lòng cấu hình mốc thời gian (ngày mở và ngày đóng đăng ký) trước khi chuyển sang trạng thái Sẵn sàng'

### Task 4: uploadCongVan + sendInvitation + index barrel

**Commit:** `4603828`

- `upload-cong-van.ts` (NEW): `uploadCongVanMetadataSchema` — signedNumber (1-100) + signedDate (≤ today) + signedByName (2-200) + signedByTitle (2-200)
- RBAC `'update'`; cycleId regex `/^[a-zA-Z0-9_-]+$/` defense-in-depth (path traversal mitigation T-03-03-05); confirm cycle exists
- **Triple validation T-03-03-03:**
  1. `file.type === 'application/pdf'` → 'Chỉ chấp nhận tệp định dạng PDF'
  2. `file.size ≤ 10*1024*1024` → 'Tệp vượt quá kích thước cho phép 10MB' (+ size > 0)
  3. Magic byte first 5 bytes === `0x25 0x50 0x44 0x46 0x2d` (`%PDF-`) → 'Tệp không hợp lệ — không phải PDF thực'
- `storedFileName = randomUUID() + '.pdf'` — NEVER use original filename in path (T-03-03-05); original kept only as DB metadata
- `mkdir storage/uploads/cong-van/{cycleId}/ {recursive:true}` + `writeFile`
- `prisma.$transaction`: create Attachment (entityType='ProgramCycle', entityId=cycleId, fileName, fileUrl POSIX-joined, fileSize, mimeType, signedNumber/signedDate/signedByName/signedByTitle, uploadedById) + update programCycle.invitationLetterAttachmentId
- `withAuditLog<UPLOAD>` captureAfter {attachmentId, fileName, signedNumber}; revalidatePath cycle detail
- `send-invitation.ts` (NEW): `sendInvitationInputSchema` — cycleId + subject (5-300) + contentHtml (50-50000) + recipientOrgIds (1-50 cap) + notificationType enum (default CYCLE_INVITATION)
- **Module-level Map rate limit (T-03-03-04):** `RATE_LIMIT.get(cycleId)` if `Date.now() - last < 5*60*1000` → 'Vui lòng đợi ít nhất 5 phút trước khi gửi đợt thông báo tiếp theo (còn N giây)'
- Reject DRAFT cycles ('Chu kỳ ở trạng thái nháp không thể gửi thông báo'); delegate to `lib/notifications.sendCycleInvitation()` (pure data layer)
- `RATE_LIMIT.set(cycleId, Date.now())` ONLY after success
- `withAuditLog<DISPATCH>` captureAfter {notificationId, dispatchCount, recipientCount, subject, type}
- `index.ts` barrel re-exports all 9 actions + 6 schemas + 8 types via `from './X'` statements
- **`npm run build` passed** — 13 routes generated, no SSR errors

**Smoke verified:** All 10 files present (sizes 1.2-8.7KB); magic byte logic tested in Node — valid `%PDF-` prefix accepted, fake `PK\x03\x04` zip prefix correctly rejected

## Verification

| Check                                                       | Status | Notes                                                            |
| ----------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| All 10 files exist                                          | PASS   | types.ts + 8 actions + index.ts barrel                           |
| Each file starts with `'use server'`                        | PASS   | All 8 action files (types.ts is type-only)                       |
| `canFromDB` import + check on all 8 action files            | PASS   | Line 1-3 of each function body                                   |
| `withAuditLog` wrap on 6 mutation files                     | PASS   | createCycle, updateCycle, transitionCycle, extendCycle, uploadCongVan, sendInvitation |
| `npx tsc --noEmit` pass                                     | PASS   | After every task                                                 |
| `npm run build` pass                                        | PASS   | 13 routes generated successfully                                 |
| `lib/audit-types.ts` has TRANSITION + UPLOAD + DISPATCH + EXTEND | PASS   | + AUDIT_ACTION_LABELS + AUDIT_ACTION_BADGE                       |

## Threat Mitigations Applied

| Threat ID  | Mitigation                                                                                                       | File                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | --------------------- |
| T-03-03-01 | All 9 actions have `auth()` + `canFromDB('chuong-trinh', action)` line 1-3 throw VN                              | All 8 action files    |
| T-03-03-02 | `updateCycle` only allows schema fields not status; status changes ONLY via `transitionCycle`/`extendCycle` (PITFALLS R3) | update.ts + transition.ts |
| T-03-03-03 | Triple PDF validation: MIME + size ≤ 10MB + magic byte `0x25504446`                                              | upload-cong-van.ts    |
| T-03-03-04 | In-memory Map rate limit per cycleId 5-min cooldown; recipientOrgIds.length ≤ 50                                 | send-invitation.ts    |
| T-03-03-05 | `storedFileName = randomUUID() + '.pdf'` — original kept only as DB metadata; cycleId regex `/^[a-zA-Z0-9_-]+$/` | upload-cong-van.ts    |
| T-03-03-07 | Prisma `@unique` on year column catches race; Zod `findUnique` pre-check is UX nicety; Prisma `P2002` catch      | create.ts + update.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ProgramCycle has no `description` column in Prisma schema**

- **Found during:** Task 1 (writing types.ts + get-detail.ts)
- **Issue:** Plan calls for `CycleDetail.description` and Zod schema includes `description (max 2000, optional)`, but `prisma/schema.prisma` `ProgramCycle` has no description field
- **Fix:** Stash description inside `configJson.description` JSON blob; create.ts + update.ts merge it; get-detail.ts extracts via `safeParseConfigJson`. No schema migration needed (kept lean). Documented inline comment in types.ts.
- **Files modified:** types.ts, get-detail.ts, create.ts, update.ts
- **Commits:** 9d546df (types/get-detail), f894947 (create/update)

**2. [Rule 2 - Critical] TRANSITION badge tone bumped slate → blue per plan spec**

- **Found during:** Task 1
- **Issue:** Plan spec calls for TRANSITION=blue badge, but seed values had it as slate
- **Fix:** Updated AUDIT_ACTION_BADGE in lib/audit-types.ts to TRANSITION='bg-blue-100 text-blue-800'. UPLOAD=slate, DISPATCH=emerald, EXTEND=amber per plan
- **Commit:** 9d546df

### Auth gates handled

None — smoke tests bypassed auth via direct prisma queries; runtime callers will hit auth() guard naturally.

## Self-Check: PASSED

**Files verified:**

- FOUND: app/(app)/chuong-trinh/_actions/types.ts
- FOUND: app/(app)/chuong-trinh/_actions/list.ts
- FOUND: app/(app)/chuong-trinh/_actions/get-detail.ts
- FOUND: app/(app)/chuong-trinh/_actions/create.ts
- FOUND: app/(app)/chuong-trinh/_actions/update.ts
- FOUND: app/(app)/chuong-trinh/_actions/transition.ts
- FOUND: app/(app)/chuong-trinh/_actions/extend.ts
- FOUND: app/(app)/chuong-trinh/_actions/upload-cong-van.ts
- FOUND: app/(app)/chuong-trinh/_actions/send-invitation.ts
- FOUND: app/(app)/chuong-trinh/_actions/index.ts
- FOUND: lib/audit-types.ts (modified)

**Commits verified:**

- FOUND: 9d546df (Task 1)
- FOUND: f894947 (Task 2)
- FOUND: 8dbfd31 (Task 3)
- FOUND: 4603828 (Task 4)
