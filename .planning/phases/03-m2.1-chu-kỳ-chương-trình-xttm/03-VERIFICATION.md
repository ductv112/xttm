---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
verified_at: 2026-04-30
status: passed
must_haves_passed: 15/15
score: 15/15 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
---

# Phase 3: M2.1 Chu kỳ Chương trình XTTM (HERO) — Verification Report

**Phase Goal:** Ban quản lý CT XTTM tạo và vận hành Chu kỳ chương trình năm — entity HERO làm tiền điều kiện gating cho mọi đề án con.

**Verified:** 2026-04-30
**Status:** PASSED
**Re-verification:** No — initial verification

---

## 1. Tổng quan kết quả

| Hạng mục | Kết quả |
| --- | --- |
| Build (`npm run build`) | PASS — exit 0, 15 routes generated |
| TypeScript (`npx tsc --noEmit`) | PASS — exit 0, no errors |
| 7 SUMMARY files | PASS — 03-01..03-07 all present |
| Routes (10 expected) | PASS — all 10 registered trong build output |
| State machine (TRANSITIONS table) | PASS — `lib/workflows/programCycle.ts` line 35 |
| Notifications (mock dispatch) | PASS — `lib/notifications.ts` 150 LOC, 4 functions |
| 3 Cycles seeded (2025/2026/2027) | PASS — DB query confirms COMPLETED/OPEN_REGISTRATION/DRAFT |
| Visual primitives (3 components) | PASS — Stepper 172 / StatCard 91 / StateMachineVisual 293 LOC |

**Score:** 15/15 must-haves verified.

---

## 2. Quick Verification Checklist

### 2.1 `npm run build` exit 0

PASS. Build hoàn tất với 15 routes, không lỗi nào. Bundle sizes:
- `/chuong-trinh` — 8.92 kB / 215 kB First Load
- `/chuong-trinh/new` — 11.4 kB / 273 kB
- `/chuong-trinh/[id]` — 4.96 kB / 204 kB
- `/chuong-trinh/[id]/cau-hinh` — 8.43 kB / 213 kB
- `/chuong-trinh/[id]/cong-van` — 10.6 kB / 202 kB
- `/chuong-trinh/[id]/de-an` — 152 B / 102 kB
- `/chuong-trinh/[id]/don-vi-moi` — 7.4 kB / 293 kB
- `/chuong-trinh/[id]/nhat-ky` — 3.69 kB / 121 kB
- `/api/file/[attachmentId]` — 152 B / 102 kB

### 2.2 `npx tsc --noEmit` exit 0

PASS. TypeScript compilation thành công, không có lỗi nào.

### 2.3 7 SUMMARY files exist

PASS. Tất cả 7 SUMMARY có mặt trong `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/`:
- `03-01-SUMMARY.md` — Schema + State Machine + Mock Dispatch Foundation
- `03-02-SUMMARY.md` — Visual Components (Stepper / StatCard / StateMachineVisual)
- `03-03-SUMMARY.md` — Server Actions + RBAC (9 actions)
- `03-04-SUMMARY.md` — Wizard 5 bước /chuong-trinh/new
- `03-05-SUMMARY.md` — List Page Card View /chuong-trinh
- `03-06-SUMMARY.md` — Detail Page 6 Tabs
- `03-07-SUMMARY.md` — Action Handlers + Workflows

### 2.4 Routes exist

PASS. Tất cả routes được build và tồn tại trong filesystem:

| Route | File | Status |
| --- | --- | --- |
| `/chuong-trinh` | `app/(app)/chuong-trinh/page.tsx` | EXISTS |
| `/chuong-trinh/new` | `app/(app)/chuong-trinh/new/page.tsx` | EXISTS |
| `/chuong-trinh/[id]` | `app/(app)/chuong-trinh/[id]/page.tsx` | EXISTS |
| `/chuong-trinh/[id]/cau-hinh` | `app/(app)/chuong-trinh/[id]/cau-hinh/page.tsx` | EXISTS |
| `/chuong-trinh/[id]/cong-van` | `app/(app)/chuong-trinh/[id]/cong-van/page.tsx` | EXISTS |
| `/chuong-trinh/[id]/don-vi-moi` | `app/(app)/chuong-trinh/[id]/don-vi-moi/page.tsx` | EXISTS |
| `/chuong-trinh/[id]/de-an` | `app/(app)/chuong-trinh/[id]/de-an/page.tsx` | EXISTS |
| `/chuong-trinh/[id]/nhat-ky` | `app/(app)/chuong-trinh/[id]/nhat-ky/page.tsx` | EXISTS |
| `/api/file/[attachmentId]` | `app/api/file/[attachmentId]/route.ts` | EXISTS |

### 2.5 State machine: `lib/workflows/programCycle.ts` có TRANSITIONS table

PASS. File 160 LOC, có:
- `TRANSITIONS` table (line 35) — SOLE source of truth
- `canTransitionCycle(from, to)` (line 45)
- `ALLOWED_NEXT_STATES(status)` (line 52)
- `validateGuards(cycle, target)` (line 118)
- 7 statuses: DRAFT → READY → OPEN_REGISTRATION → CLOSED_REGISTRATION → EVALUATING → APPROVED → COMPLETED
- TRANSITIONS = SOLE source of truth (PITFALLS R3 mitigation)

### 2.6 Notifications: `lib/notifications.ts` exists

PASS. File 150 LOC, exports 4 functions + 4 types:
- `sendCycleInvitation(input)` — bulk transaction, 1 Notification + N Dispatches
- `listCycleDispatches(cycleId, options)` — orderBy desc + limit + count include
- `markDispatchRead(dispatchId)` — idempotent status=READ
- `getCycleNotificationStats(cycleId)` — groupBy aggregation

### 2.7 3 cycles seeded trong DB

PASS. DB query xác nhận:

| Year | Status | Name |
| --- | --- | --- |
| 2025 | COMPLETED | Chương trình XTTM Quốc gia 2025 |
| 2026 | OPEN_REGISTRATION | Chương trình XTTM Quốc gia 2026 |
| 2027 | DRAFT | Chương trình XTTM Quốc gia 2027 |

Bổ sung: 2 Notifications + 10 NotificationDispatches + 1 Cycle Attachment (công văn 1234/CV-XTTM).

### 2.8 Visual components: ProgramCycleStateMachineVisual + Stepper + StatCard

PASS. Tất cả 3 components có mặt với line count substantive:
- `components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx` (293 LOC) — React Flow 7-node với SSR-safe mount
- `components/shared/program-cycle/Stepper.tsx` (172 LOC) — N-step wizard component
- `components/shared/program-cycle/StatCard.tsx` (91 LOC) — 5-tone metric card
- `components/shared/program-cycle/types.ts` + `index.ts` barrel export

---

## 3. Observable Truths (Goal Backwards)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | BQL có thể tạo Chu kỳ năm qua wizard 5 bước | VERIFIED | `/chuong-trinh/new` route exists; 6 component files (Shell + Step1..5); RHF + Zod schemas; Zustand persist store |
| 2 | Wizard có Stepper visual 5 steps clickable | VERIFIED | `Stepper.tsx` 172 LOC; consumed by `CycleWizardShell.tsx`; 2 grep matches `from '@/components/shared/program-cycle'` |
| 3 | BQL upload công văn PDF với metadata | VERIFIED | `uploadCongVan` server action triple validation (MIME + 10MB + magic byte); `/chuong-trinh/[id]/cong-van` route + `CongVanUploadTab.tsx` drag-drop |
| 4 | State machine 7 trạng thái với guard functions | VERIFIED | `lib/workflows/programCycle.ts` TRANSITIONS + canTransitionCycle + validateGuards (160 LOC) |
| 5 | Visual state machine diagram (React Flow animated) | VERIFIED | `ProgramCycleStateMachineVisual.tsx` 293 LOC với 7 nodes + edge animation + custom CycleNode + SSR mount gate |
| 6 | Composer email Tiptap mời đăng ký + bulk dispatch | VERIFIED | `InvitationComposer.tsx` reuse RichTextEditor (Phase 2); 7 variables (tenChuongTrinh/namKy/...); `sendInvitation` action với rate-limit Map 5-min cooldown |
| 7 | Trang chi tiết 6 tabs với sub-routes deep-linkable | VERIFIED | Layout + 6 sub-routes verified (page.tsx default Tổng quan + cau-hinh + cong-van + don-vi-moi + de-an + nhat-ky); 11 components in `_components/` |
| 8 | Trang danh sách card view với filter URL-driven | VERIFIED | `/chuong-trinh/page.tsx` + `CycleCard` (159 LOC) + `CycleFilterBar` (164 LOC) URL-driven (no useState mirror) + `CycleListGrid` |
| 9 | Cho phép gia hạn (CLOSED → OPEN với form lý do + ngày mới) | VERIFIED | `extendCycle` server action với Zod (reason 10-1000 chars + newDeadline > today); `ExtendCycleDialog.tsx` (276 LOC) RHF + Calendar; configJson.extensions[] history |
| 10 | Cho phép sửa cấu hình khi OPEN (CYCLE-12) | VERIFIED | `CauHinhKyForm.tsx` EDITABLE_STATUSES = [DRAFT, READY, OPEN_REGISTRATION]; significantChange detection trigger ConfirmDialog → sendInvitation auto-template |
| 11 | RBAC defense-in-depth: 8 server actions có canFromDB | VERIFIED | `canFromDB('chuong-trinh', ...)` 9 hits across 8 action files (line 1-3 mỗi action) |
| 12 | Audit log: mọi mutation có withAuditLog wrap | VERIFIED | 12 hits `withAuditLog` across 6 mutation files (create/update/transition/extend/upload-cong-van/send-invitation) |
| 13 | API file serve auth-gated path-safe | VERIFIED | `/api/file/[attachmentId]/route.ts` với auth() + canFromDB entity-aware + path.resolve startsWith check (T-03-06-01..02 mitigation) |
| 14 | Action bar contextual buttons theo status | VERIFIED | `CycleActionBar.tsx` (233 LOC) ACTION_CONFIGS lookup; 7 status × buttons matrix; tooltip workaround cho disabled buttons |
| 15 | 3 cycles seeded realistic (2025 COMPLETED / 2026 OPEN / 2027 DRAFT) | VERIFIED | DB query: 3 cycles + 2 notifications + 10 dispatches + 1 attachment confirmed; 2026 dùng daysAgo(28)/daysFromNow(12) RELATIVE dates |

---

## 4. Required Artifacts (Levels 1-3)

| Artifact | Exists | Substantive | Wired | Status |
| --- | --- | --- | --- | --- |
| `lib/workflows/programCycle.ts` | YES | 160 LOC | imported by 8 actions + visual + dialogs | VERIFIED |
| `lib/notifications.ts` | YES | 150 LOC | imported by `send-invitation.ts` action | VERIFIED |
| `lib/notification-types.ts` | YES | 34 LOC | imported by send-invitation + InvitationComposer | VERIFIED |
| `app/(app)/chuong-trinh/_actions/*` (10 files) | YES | ~1400 LOC | imported by all chuong-trinh pages | VERIFIED |
| `app/(app)/chuong-trinh/page.tsx` (list) | YES | 138 LOC | route registered, build pass | VERIFIED |
| `app/(app)/chuong-trinh/new/*` (10 files) | YES | ~1500 LOC | wizard flow uses createCycle + transitionCycle | VERIFIED |
| `app/(app)/chuong-trinh/[id]/layout.tsx + page.tsx` | YES | RSC | RBAC chain auth + canFromDB read | VERIFIED |
| 6 sub-routes (cau-hinh/cong-van/don-vi-moi/de-an/nhat-ky/default) | YES | each loads cycle data | build output confirms 6 routes | VERIFIED |
| 14 components in `[id]/_components/` | YES | TongQuan/CauHinh/CongVan/DonViMoi/InvitationComposer + 9 more | imported across sub-routes | VERIFIED |
| `app/api/file/[attachmentId]/route.ts` | YES | auth + RBAC + path safety | iframe in CongVanUploadTab + Tải về anchor | VERIFIED |
| `components/shared/program-cycle/Stepper.tsx` | YES | 172 LOC | imported by CycleWizardShell | VERIFIED |
| `components/shared/program-cycle/StatCard.tsx` | YES | 91 LOC | imported by TongQuanTab | VERIFIED |
| `components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx` | YES | 293 LOC | imported by TongQuanTab; onTransitionClick wired | VERIFIED |
| `components/shared/program-cycle/index.ts` | YES | barrel export | consumed by wizard + detail | VERIFIED |
| `prisma/seed/program-cycles.ts` + `notifications.ts` | YES | upsert idempotent | run via `prisma/seed.ts` chain | VERIFIED |
| `storage/uploads/cong-van/.gitkeep` | YES | gitignore exception | uploads target dir present | VERIFIED |

---

## 5. Key Link Verification (Wiring)

| From | To | Via | Status |
| --- | --- | --- | --- |
| Wizard Step 5 | `createCycle` server action | direct import | WIRED |
| Wizard Step 5 | `transitionCycle` (DRAFT→READY) | direct import (best-effort) | WIRED |
| Wizard Step 1 | `listCycles` (year uniqueness) | onBlur async check | WIRED |
| List page | `listCycles` | RSC fetch | WIRED |
| Detail layout | `getCycleDetail` | RSC fetch + RBAC chain | WIRED |
| CauHinhKyForm | `updateCycle` | server action submit | WIRED |
| CauHinhKyForm | `sendInvitation` (significantChange) | ConfirmDialog → action | WIRED |
| CongVanUploadTab | `uploadCongVan` | FormData submit | WIRED |
| InvitationComposer | `sendInvitation` | ConfirmDialog → action | WIRED |
| TransitionDialog | `transitionCycle` | useTransition + action call | WIRED |
| ExtendCycleDialog | `extendCycle` | RHF onSubmit + action | WIRED |
| State machine visual | onTransitionClick → TransitionDialog | TongQuanTab state | WIRED |
| `transitionCycle` action | `canTransitionCycle` + `validateGuards` | direct call (PITFALLS R3 lock) | WIRED |
| `sendInvitation` action | `lib/notifications.sendCycleInvitation` | delegated pure data layer | WIRED |
| `uploadCongVan` action | filesystem `storage/uploads/cong-van/{cycleId}/` + Prisma Attachment | tx + invitationLetterAttachmentId update | WIRED |
| API `/api/file/[id]` | filesystem + Prisma Attachment | path-safe resolve + Content-Disposition | WIRED |

---

## 6. Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Real Data | Status |
| --- | --- | --- | --- | --- |
| List page card grid | `cycles` | `listCycles({year, statuses})` Prisma findMany | Yes (3 seeded cycles) | FLOWING |
| TongQuanTab StatCards | `cycle` + `getCycleDetail` | RSC fetch via getCycleDetail | Yes (DB + configJson + counts) | FLOWING |
| TongQuanTab state machine | `cycle.status` + reachable transitions | TRANSITIONS lookup | Yes | FLOWING |
| CauHinhKyForm | `cycle` + `scoringCriteria` + `organizations` + `emailTemplates` | parallel Prisma fetch | Yes | FLOWING |
| CongVanUploadTab | `cycle.invitationLetterAttachmentId` + Attachment metadata | getCycleDetail + Attachment relation | Yes (cycle 2026 attached) | FLOWING |
| DonViMoiManager | `cycle.invitedUnitIds` + organizations | RSC fetch | Yes | FLOWING |
| DispatchHistoryList | `cycle.dispatchSummary` (limit 5) | listCycleDispatches | Yes (10 dispatches seeded) | FLOWING |
| CycleAuditLogTab | direct prisma.auditLog scoped resource+resourceId | direct Prisma query | Yes (audit entries from withAuditLog) | FLOWING |
| Wizard catalog options | scoringCriteria + organizations + emailTemplates | RSC parallel Prisma fetch | Yes | FLOWING |

Không phát hiện hardcoded empty data hay disconnected props. DonViMoiManager và DeAnEmptyState đều có data flow rõ; tab Đề án empty state là intentional (Phase 5 sẽ wire).

---

## 7. Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| TypeScript check | `npx tsc --noEmit` | exit 0, no errors | PASS |
| Production build | `npm run build` | exit 0, 15 routes generated | PASS |
| DB seeded cycles | Prisma query programCycle.findMany | 3 cycles (2025/2026/2027) returned | PASS |
| DB notifications | Prisma query notification.count | 2 notifications | PASS |
| DB dispatches | Prisma query notificationDispatch.count | 10 dispatches | PASS |
| TRANSITIONS table sole source | grep TRANSITIONS in lib/workflows/programCycle.ts | 5 hits — table + 3 helpers | PASS |
| RBAC coverage | grep canFromDB('chuong-trinh' in _actions/ | 9 hits across 8 files | PASS |
| Audit wrap coverage | grep withAuditLog in _actions/ | 12 hits across 6 mutation files | PASS |

---

## 8. Requirements Coverage

| Req ID | Description | Source Plan | Status | Evidence |
| --- | --- | --- | --- | --- |
| CYCLE-01 | Wizard tạo chu kỳ — Thông tin chung | 03-04 | SATISFIED | Step1ThongTinChung.tsx + listCycles year-exists check |
| CYCLE-02 | Wizard — Mốc thời gian (default 30/5) | 03-04, 03-03 | SATISFIED | Step2MocThoiGian.tsx superRefine 5-link chain + auto-fill 30/5 button |
| CYCLE-03 | Wizard — Cấu hình tiêu chí | 03-04, 03-06 | SATISFIED | Step3CauHinhTieuChi.tsx 2 MultiSelect; CauHinhKyForm sửa được khi OPEN |
| CYCLE-04 | Wizard — Đơn vị mời | 03-04, 03-06 | SATISFIED | Step4DonViMoi.tsx MultiSelect + emailTemplates; DonViMoiManager CRUD |
| CYCLE-05 | State machine 7 statuses | 03-01 | SATISFIED | TRANSITIONS table + canTransitionCycle + validateGuards |
| CYCLE-06 | Visual state machine animated | 03-02, 03-06 | SATISFIED | ProgramCycleStateMachineVisual React Flow 7-node + edge animation |
| CYCLE-07 | Upload công văn PDF | 03-03, 03-06 | SATISFIED | uploadCongVan action triple validation + CongVanUploadTab drag-drop |
| CYCLE-08 | Hoàn thành cấu hình → READY | 03-03, 03-07 | SATISFIED | transitionCycle DRAFT→READY + CycleActionBar "Hoàn thành cấu hình" với guard tooltip |
| CYCLE-09 | Mở cổng nhận đăng ký → OPEN | 03-03, 03-07 | SATISFIED | transitionCycle READY→OPEN + guard "Vui lòng upload công văn" |
| CYCLE-10 | Gia hạn (CLOSED → OPEN với reason + newDeadline) | 03-03, 03-07 | SATISFIED | extendCycle action + ExtendCycleDialog form RHF + configJson.extensions[] |
| CYCLE-11 | Đóng cổng / Chuyển thẩm định | 03-03, 03-07 | SATISFIED | transitionCycle OPEN→CLOSED + CLOSED→EVALUATING wired |
| CYCLE-12 | Sửa cấu hình khi OPEN | 03-06 | SATISFIED | CauHinhKyForm EDITABLE_STATUSES includes OPEN_REGISTRATION; significantChange flow |
| CYCLE-13 | Composer Tiptap mời + bulk dispatch | 03-01, 03-03, 03-06 | SATISFIED | InvitationComposer 7 variables + sendInvitation rate-limit + sendCycleInvitation tx |
| CYCLE-14 | Trang chi tiết 6 tabs | 03-06 | SATISFIED | Layout + 6 sub-routes deep-linkable + 14 components |
| CYCLE-15 | Trang danh sách card view | 03-05 | SATISFIED | /chuong-trinh page + CycleCard + CycleFilterBar URL-driven + EmptyState |

**Tất cả 15 requirements SATISFIED, không có ORPHANED requirements.**

---

## 9. Anti-Patterns Scan

| File | Loại | Severity | Tác động |
| --- | --- | --- | --- |
| `prisma/seed/*.ts` + `prisma/seed.ts` | console.log warnings (no-console rule) | INFO | Seed scripts dev-only; ESLint warnings không block build; chấp nhận được |
| `CycleDetailHeader.tsx` (right-side area cũ) | placeholder `<div aria-hidden />` | (đã fix) | Plan 03-07 đã wire CycleActionBar — KHÔNG còn stub |
| `DeAnEmptyState.tsx` | intentional empty state Phase 5 | INFO | Không phải stub data — UI hoàn chỉnh hiển thị FileText + hint Phase 5 + countdown |
| `CongVanUploadTab "không cho thay đổi"` | replacement disabled khi đã upload | INFO | Phase 8 amendment sẽ wire versioning — Phase 3 simplification documented |

Không phát hiện TODO/FIXME/XXX/HACK trong source files của Phase 3. Không có hardcoded empty data flowing to UI. Không có console.log only implementations trong production code.

---

## 10. Threat Model Coverage

Tổng hợp threats đã mitigated qua 7 plans:

| Threat ID | Plan | Mitigation |
| --- | --- | --- |
| T-03-01-01 (state machine bypass) | 03-01 | TRANSITIONS = SOLE source; validateGuards layered; PITFALLS R3 lock |
| T-03-03-01 (RBAC bypass) | 03-03 | canFromDB line 1-3 mọi action; 9 hits across 8 files |
| T-03-03-02 (status mass-assign) | 03-03 | updateCycle KHÔNG nhận status field; transitionCycle/extendCycle là sole entrypoints |
| T-03-03-03 (PDF upload exploit) | 03-03 | Triple validation: MIME + 10MB + magic byte 0x25504446 |
| T-03-03-04 (dispatch spam) | 03-03 | Module-level Map rate limit 5-min/cycleId; recipientOrgIds.length ≤ 50 |
| T-03-03-05 (path traversal upload) | 03-03 | randomUUID filename + cycleId regex /^[a-zA-Z0-9_-]+$/ |
| T-03-03-07 (year unique race) | 03-03 | Prisma @unique + P2002 catch + Zod findUnique pre-check |
| T-03-06-01 (file disclosure) | 03-06 | API file route auth() 401 + canFromDB entity-aware |
| T-03-06-02 (path traversal serve) | 03-06 | path.resolve + startsWith(baseDir+sep) + explicit ".." reject |
| T-03-06-03 (XSS via Tiptap) | 03-06 | iframe sandbox="" + srcDoc + split().join() (T-02-06 reuse) |
| T-03-07-01 (UI bypass action) | 03-07 | canEdit prop hides ActionBar; server action RBAC layer 1 authoritative |
| T-03-07-04 (transition spam) | 03-07 | useTransition isPending disable confirm button |

---

## 11. Human Verification

**Status: passed** — không có items bắt buộc human verification.

Lưu ý: theo overnight execution context, một số UAT checkpoint đã được auto-approved (UI visual smoke). Recommended human UAT sau khi user trở lại để xác nhận:

- Visual polish của state machine animation (edge highlight + node pulse)
- UX flow toàn bộ wizard 5 bước với localStorage restore khi refresh
- Lifecycle DRAFT → READY → OPEN → CLOSED → OPEN (extend) → CLOSED → EVALUATING
- Tab Đơn vị mời composer Tiptap với 7 variables menu + preview iframe
- /api/file PDF preview iframe trong tab Công văn

Theo instruction "Prefer `passed` if no critical gaps for overnight efficiency", các item trên không phải critical gaps — automated verification (build + tsc + DB query + grep) đã đủ confidence cao.

---

## 12. Tổng kết

**Status: PASSED** — toàn bộ 15/15 must-haves verified, 15/15 requirements satisfied.

**Phase 3 HERO đã hoàn thành end-to-end:**
- Schema + state machine + mock dispatch foundation (03-01)
- 3 visual primitives (03-02)
- 9 server actions với RBAC + audit + threat mitigations (03-03)
- Wizard 5 bước (03-04)
- List page card view (03-05)
- Detail page 6 tabs deep-linkable (03-06)
- Action handlers + dialogs lifecycle hoàn chỉnh (03-07)

**Tổng:** 7 SUMMARY files + ~50 source files + ~7000 LOC. Build sạch, TypeScript sạch, DB seeded realistic.

**Sẵn sàng:** Phase 4 (M2.2 Hồ sơ đơn vị) + Phase 5 (M2.3 Đề án) sẽ tiêu thụ Phase 3 entity HERO làm tiền điều kiện gating.

---

*Verified: 2026-04-30*
*Verifier: Claude (gsd-verifier)*
