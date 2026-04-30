---
phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì
plan: 01
subsystem: api
tags: [prisma, sqlite, zod, server-actions, rbac, audit, state-machine, file-upload]

requires:
  - phase: 01-m0-bootstrap-h-t-ng
    provides: OrganizationProfile schema scaffolding, Attachment polymorphic, withAuditLog, lib/permissions-db, lib/workflows pattern
  - phase: 02-m1-quan-tri-danh-muc
    provides: canFromDB DB-backed RBAC, audit pipeline, Notification + NotificationDispatch flow
  - phase: 03-m2.1-chu-kỳ-chương-trình-xttm
    provides: state machine + transition table pattern (programCycle.ts), upload pattern (upload-cong-van.ts), VN search via removeDiacritics

provides:
  - OrganizationProfile state machine (DRAFT → SUBMITTED → APPROVED/REJECTED ⇄ DRAFT)
  - 9 server actions split across 2 routes (đơn vị self-service + BQL phê duyệt)
  - Document upload with PDF/JPG/PNG magic byte verification (UUID filename, ≤10MB, ≤10/profile)
  - 5 seed OrganizationProfile records covering all 4 statuses
  - validateGuards domain rules (taxCode + address + repName + capabilities ≥50 chars + ≥1 contact)
  - Mock notification fan-out: submit → BANQL users; approve/reject → org users

affects: [phase-04-02 UI pages, phase-05 đề án (gating on APPROVED status), inbox UI Phase 4+]

tech-stack:
  added: []
  patterns:
    - "JSON-backed columns for SQLite-incompatible Json type (legalInfoJson/capabilitiesJson/contactsJson) — consistent với ProgramCycle.configJson pattern"
    - "withAuditLog wrap mọi mutation + captureBefore qua dynamic import auth (avoid circular dep)"
    - "Magic byte file validation (PDF/JPG/PNG) trên cả MIME type + first-bytes check"
    - "UUID filename trên FS + original name lưu trong DB (path traversal mitigation T-04-01-02)"
    - "Cross-tenant guard pattern: session.organizationId === profile.organizationId trên mọi DONVI action"
    - "Status-based edit freeze: SUBMITTED là frozen state, đơn vị không được edit cho tới khi BQL trả về REJECTED hoặc APPROVE"

key-files:
  created:
    - "prisma/seed/orgProfiles.ts (5 realistic VN org records, 4 statuses)"
    - "app/(app)/don-vi-cua-toi/_actions/types.ts (Zod schemas, VN_PHONE_REGEX, VN_TAX_CODE_REGEX)"
    - "app/(app)/don-vi-cua-toi/_actions/get-or-create.ts (auto-provision DRAFT khi DONVI lần đầu)"
    - "app/(app)/don-vi-cua-toi/_actions/update.ts (whitelist Zod + status guard)"
    - "app/(app)/don-vi-cua-toi/_actions/submit.ts (validateGuards → DRAFT→SUBMITTED + notify BANQL)"
    - "app/(app)/don-vi-cua-toi/_actions/upload-document.ts (upload + delete với magic byte check)"
    - "app/(app)/don-vi-cua-toi/_actions/contacts.ts (CRUD inline trên contactsJson)"
    - "app/(app)/don-vi-chu-tri/_actions/list.ts (listOrgProfiles + getOrgProfileDetail)"
    - "app/(app)/don-vi-chu-tri/_actions/approve.ts (SUBMITTED → APPROVED + notify org)"
    - "app/(app)/don-vi-chu-tri/_actions/reject.ts (SUBMITTED → REJECTED with reason ≥10 chars)"
  modified:
    - "prisma/schema.prisma (OrganizationProfile fields refactored cho JSON-backed pattern)"
    - "lib/workflows/orgProfile.ts (full state machine: TRANSITIONS, canTransitionOrgProfile, validateGuards, ALLOWED_NEXT_STATES, status labels + theme + parse helpers + 5 contact role enum)"
    - "lib/audit-types.ts (ORG_PROFILE_AUDIT_TYPES composite identifiers)"
    - "prisma/seed.ts (gọi seedOrgProfiles + count assertions ≥5 + status mix)"

key-decisions:
  - "JSON-backed columns thay Prisma Json type — SQLite không support Json natively; pattern khớp ProgramCycle.configJson + Project.marketIds"
  - "Attachment.signedNumber column repurposed lưu category code (GIAY_DKKD/DIEU_LE/QUYET_DINH/KHAC) — tránh schema migration thêm column riêng cho Phase 4"
  - "Mock notification reuse type='CYCLE_INVITATION' — không thêm enum NotificationType mới (Phase 4 không yêu cầu inbox UI; type code chỉ là discriminator nội bộ)"
  - "validateGuards returns array errors thay reason đơn lẻ (như cycle GuardResult) — UI hiển thị bullet list lỗi"
  - "SUBMITTED là frozen state — đơn vị KHÔNG edit khi đang chờ BQL; phải REJECT trước → DRAFT → edit → resubmit"
  - "APPROVED → DRAFT chỉ áp dụng nếu user explicitly muốn cập nhật minor fields; mutation thường giữ status as-is để Phase 5 gating dùng approvedAt timestamp"
  - "Mã số thuế VN regex 10 chữ số (có thể thêm -3 chi nhánh) — không hardcode list mã hợp lệ"

patterns-established:
  - "Pattern A: Server actions module structure — types.ts (Zod + types) + per-action file ('use server'); barrel exports KHÔNG re-export schemas (Next 15 rule)"
  - "Pattern B: Status-aware guards — submit/update/upload/delete đều check profile.status === 'SUBMITTED' để freeze edits"
  - "Pattern C: Cross-tenant via session.organizationId === target.organizationId — defense-in-depth dù findUnique by orgId"
  - "Pattern D: Mock notification fan-out qua prisma.notification + prisma.notificationDispatch.createMany — recipientType=USER (BANQL) hoặc ORGANIZATION (org users)"

requirements-completed: [ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08]

duration: 14m
completed: 2026-04-30
---

# Phase 04 Plan 01: Server actions + workflow + seed cho OrganizationProfile Summary

**OrganizationProfile state machine (4 states) + 9 server actions wrap với audit + RBAC + 5 realistic seed orgs cover mọi trạng thái — foundation cho Phase 4 UI và Phase 5 đề án gating.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-04-30T22:00:00Z (approx)
- **Completed:** 2026-04-30T22:14:00Z (approx)
- **Tasks:** 3
- **Files modified:** 13 (3 modified + 10 created)

## Accomplishments

- State machine với TRANSITIONS table, validateGuards (5 domain rules: taxCode + address + repName + capabilities ≥50 chars + ≥1 contact), labels, badge themes, parse helpers
- Schema refactor: OrganizationProfile chuyển sang 3 JSON-backed columns (legalInfoJson/capabilitiesJson/contactsJson) + rejectionReason String? + status @@index — khớp pattern ProgramCycle
- 9 server actions với withAuditLog: get-or-create (auto-provision DRAFT), update (whitelist Zod + status guard), submit (validateGuards + DRAFT→SUBMITTED + mock notify BANQL), upload-document + delete (PDF/JPG/PNG magic byte + UUID filename), contacts (add/update/delete CRUD), list + getDetail (BQL inbox), approve (SUBMITTED→APPROVED + notify org), reject (reason ≥10 chars + notify org)
- Seed 5 OrganizationProfile records với statuses APPROVED=1 (LEFASO) / SUBMITTED=1 (VITAS) / REJECTED=1 (VINATEX) / DRAFT=2 (VASEP, VCCI) — realistic Vietnamese legalInfo, 1-3 pastProjects/org, 1-3 contacts/org với VN phone hợp lệ
- 4 threats mitigated (T-04-01-01 high RBAC, T-04-01-02 medium path traversal, T-04-01-03 medium mass-assignment, T-04-01-04 low cross-tenant)

## Task Commits

1. **Task 1: Schema verify + state machine + audit types** — `2703bf1` (feat)
2. **Task 2: 9 server actions** — `834d47b` (feat)
3. **Task 3: Seed 5 profiles** — `e0ab256` (feat)

## Files Created/Modified

### Modified
- `prisma/schema.prisma` — OrganizationProfile fields refactored: `legalInfoJson` / `capabilitiesJson` / `contactsJson` (JSON-backed) + `rejectionReason` String? + `@@index([status])`. Old fields (legalRepName, capabilities, contactPersons) replaced.
- `lib/workflows/orgProfile.ts` — replaced 20-line skeleton với full state machine (TRANSITIONS, canTransitionOrgProfile, validateGuards, ALLOWED_NEXT_STATES, ORG_PROFILE_STATUSES, ORG_PROFILE_STATUS_LABELS, ORG_PROFILE_STATUS_BADGE_THEME, ORG_PROFILE_CONTACT_ROLES + labels, parseLegalInfo/parseCapabilities/parseContacts helpers)
- `lib/audit-types.ts` — added ORG_PROFILE_AUDIT_TYPES composite identifiers (ORG_PROFILE_SUBMIT/APPROVE/REJECT/UPDATE)
- `prisma/seed.ts` — added seedOrgProfiles call + count assertions

### Created
- `prisma/seed/orgProfiles.ts` — 5 OrganizationProfile records, idempotent upsert by organizationId
- `app/(app)/don-vi-cua-toi/_actions/types.ts` — VN_PHONE_REGEX, VN_TAX_CODE_REGEX, Zod schemas (legalInfoInternal, capabilitiesInternal, contactInternal, contactsInternal)
- `app/(app)/don-vi-cua-toi/_actions/get-or-create.ts` — auto-provision OrganizationProfile DRAFT khi DONVI lần đầu (seed legalInfo từ Organization gốc)
- `app/(app)/don-vi-cua-toi/_actions/update.ts` — whitelist Zod parse + SUBMITTED freeze
- `app/(app)/don-vi-cua-toi/_actions/submit.ts` — validateGuards + transition + mock notify BANQL
- `app/(app)/don-vi-cua-toi/_actions/upload-document.ts` — uploadProfileDocument + deleteProfileDocument (PDF/JPG/PNG, magic byte, UUID filename, ≤10MB, ≤10 docs/profile)
- `app/(app)/don-vi-cua-toi/_actions/contacts.ts` — addContact / updateContact / deleteContact (max 20 contacts)
- `app/(app)/don-vi-chu-tri/_actions/list.ts` — listOrgProfiles (filter status + search by removeDiacritics) + getOrgProfileDetail (full profile + documents)
- `app/(app)/don-vi-chu-tri/_actions/approve.ts` — SUBMITTED→APPROVED + mock notify org
- `app/(app)/don-vi-chu-tri/_actions/reject.ts` — SUBMITTED→REJECTED with reason ≥10 chars + notify org

## Decisions Made

- **JSON-backed columns** thay Prisma Json type vì SQLite không support Json natively (consistent với ProgramCycle.configJson + Project.marketIds patterns đã lock từ Phase 1)
- **Attachment.signedNumber column repurposed** lưu category code cho org profile docs (GIAY_DKKD/DIEU_LE/QUYET_DINH/KHAC) — tránh thêm column mới chỉ cho Phase 4; column đã exist từ M0 cho công văn metadata
- **Mock notification type='CYCLE_INVITATION'** — Phase 4 không thêm enum NotificationType mới; type code chỉ là discriminator nội bộ; subject + content render Vietnamese tone formal đầy đủ ngữ cảnh
- **SUBMITTED frozen state** — UX critical: ngăn race condition nơi đơn vị edit khi BQL đang phê duyệt; BQL phải REJECT trước khi đơn vị có thể edit lại
- **validateGuards returns errors[] array** thay GuardResult.reason đơn — UI có thể hiển thị bullet list cho user khắc phục từng vi phạm

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed in sequence with no auto-fixes needed.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 04-02 (UI pages) ready: 9 server actions exposed, types module complete với Zod schemas client có thể import (RHF resolver), seed data 5 profiles cover empty + filled + submitted + approved + rejected states
- Phase 5 (M2.3 Đề án) ready: gating sẽ check `OrganizationProfile.status === 'APPROVED' || profile.approvedAt !== null` để cho phép tạo đề án mới

## Self-Check: PASSED

Files verified to exist:
- FOUND: prisma/schema.prisma (modified)
- FOUND: lib/workflows/orgProfile.ts (replaced)
- FOUND: lib/audit-types.ts (extended)
- FOUND: prisma/seed.ts (modified)
- FOUND: prisma/seed/orgProfiles.ts (created)
- FOUND: app/(app)/don-vi-cua-toi/_actions/types.ts
- FOUND: app/(app)/don-vi-cua-toi/_actions/get-or-create.ts
- FOUND: app/(app)/don-vi-cua-toi/_actions/update.ts
- FOUND: app/(app)/don-vi-cua-toi/_actions/submit.ts
- FOUND: app/(app)/don-vi-cua-toi/_actions/upload-document.ts
- FOUND: app/(app)/don-vi-cua-toi/_actions/contacts.ts
- FOUND: app/(app)/don-vi-chu-tri/_actions/list.ts
- FOUND: app/(app)/don-vi-chu-tri/_actions/approve.ts
- FOUND: app/(app)/don-vi-chu-tri/_actions/reject.ts

Commits verified:
- FOUND: 2703bf1 (Task 1)
- FOUND: 834d47b (Task 2)
- FOUND: e0ab256 (Task 3)

DB state verified: `prisma.organizationProfile.count() = 5`, status mix `APPROVED=1, DRAFT=2, REJECTED=1, SUBMITTED=1`.

Verification commands:
- `npx tsc --noEmit` exit 0
- `npm run build` exit 0
- `npm run db:seed` exit 0 with status mix assertions passing

---
*Phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì*
*Completed: 2026-04-30*
