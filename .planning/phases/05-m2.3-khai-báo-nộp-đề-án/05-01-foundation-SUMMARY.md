---
phase: 05-m2.3-khai-báo-nộp-đề-án
plan: 01
subsystem: api
tags: [prisma, sqlite, zod, server-actions, rbac, audit, state-machine, file-upload, project-version, hero-flow]

requires:
  - phase: 01-m0-bootstrap-h-t-ng
    provides: Project schema scaffolding (incl. parentProjectId), Attachment polymorphic, withAuditLog, lib/permissions-db, lib/workflows pattern
  - phase: 02-m1-quan-tri-danh-muc
    provides: 8 catalogs (ProjectKind/IndustrySector/Market/PromotionType/Country) consumed via codes in seed
  - phase: 03-m2.1-chu-kỳ-chương-trình-xttm
    provides: ProgramCycle.OPEN_REGISTRATION gating + active cycle pattern + Notification + NotificationDispatch fan-out
  - phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì
    provides: OrganizationProfile.APPROVED gating + contactsJson UUIDs (used as pmContactId reference)

provides:
  - Project state machine 14 states (DRAFT → SUBMITTED → ASSIGNED → IN_REVIEW → ⤳ → VALID → EVALUATING → APPROVED → IN_PROGRESS → COMPLETED + SUPPLEMENT_REQUIRED ↔ RESUBMITTED + TENTATIVE for đề án 2 năm)
  - 11 server actions in app/(app)/de-an/_actions (types/list-mine/get-detail/list-previous/save-draft/submit/withdraw/copy-from-previous/upload-document + delete-document + getOrCreateMyDraft helper)
  - ProjectVersion snapshot model + per-submit/resubmit pattern
  - Đề án 2 năm transactional pair creation (parent SUBMITTED + child TENTATIVE with parentProjectId)
  - 6 mock projects covering all required statuses + 1 đề án 2 năm pair
  - validateGuards 6 rules (name length, kind, pmContact, sectors ≥1, plan rows ≥1, budget rows ≥1 + total > 0, cycle OPEN_REGISTRATION)
  - Idempotency 5s window + mock BANQL notification dispatch on submit

affects: [phase-05-02 wizard 6 bước, phase-05-03 detail/PDF/versions, phase-06 tiếp nhận (assigns project), phase-07 thẩm định (reads project budget/objectives), phase-08 contract (reads APPROVED projects)]

tech-stack:
  added: []
  patterns:
    - "JSON-backed columns for Project wizard data (generalInfoJson/objectivesJson/planJson/budgetJson) — same pattern as ProgramCycle.configJson + OrgProfile contactsJson"
    - "ProjectVersion snapshot taken BEFORE each submit/resubmit transition (in transaction) — supports PROJ-20..22 lịch sử bổ sung tab"
    - "Đề án 2 năm via parentProjectId self-reference + status TENTATIVE for year-2 placeholder; child auto-created in same transaction as parent submit"
    - "Idempotency window via timestamp comparison (project.submittedAt + 5000ms) — avoids duplicate submit on double-click"
    - "computeBudgetTotals server-side recomputation defence-in-depth — client may compute too but server is source of truth"
    - "pmContactId references OrganizationProfile.contactsJson contact UUID (not a foreign key) — keeps schema lean, snapshot in version"

key-files:
  created:
    - "prisma/seed/projects.ts (6 realistic VN projects, 5 status mix + đề án 2 năm pair)"
    - "app/(app)/de-an/_actions/types.ts (6 wizard step Zod schemas + saveDraft full payload)"
    - "app/(app)/de-an/_actions/list-mine.ts (cross-tenant filtered project list)"
    - "app/(app)/de-an/_actions/get-detail.ts (full project + parent + children + versions + documents + pmContact snapshot)"
    - "app/(app)/de-an/_actions/list-previous.ts (APPROVED+ historical projects for copy dialog)"
    - "app/(app)/de-an/_actions/save-draft.ts (autosave + find-or-create draft per (org,year,cycle))"
    - "app/(app)/de-an/_actions/submit.ts (DRAFT→SUBMITTED + ProjectVersion snapshot + đề án 2 năm child + idempotency + BANQL notification)"
    - "app/(app)/de-an/_actions/withdraw.ts (SUBMITTED→DRAFT, only if not assigned)"
    - "app/(app)/de-an/_actions/copy-from-previous.ts (clone APPROVED+ project as new DRAFT)"
    - "app/(app)/de-an/_actions/upload-document.ts (upload + delete với magic byte PDF/DOC/DOCX/XLSX/JPG/PNG, 10MB, 20/project)"
  modified:
    - "prisma/schema.prisma (Project model: + year + JSON columns + pmContactId + indexes; new ProjectVersion model)"
    - "lib/workflows/project.ts (full state machine: TRANSITIONS 14 states, canTransitionProject, validateGuards 6 rules, ALLOWED_NEXT_STATES, PROJECT_STATUS_LABELS + theme + JSON parsers + computeBudgetTotals + PROJECT_KIND_LABELS)"
    - "lib/audit-types.ts (PROJECT_AUDIT_TYPES 7 composite identifiers)"
    - "prisma/seed.ts (call seedProjects + status mix log + assertion ≥6 projects + status diversity + ≥1 đề án 2 năm child)"

key-decisions:
  - "State machine renamed to plan-spec names (IN_REVIEW vs M0 UNDER_REVIEW; SUPPLEMENT_REQUIRED vs RETURNED_FOR_REVISION; VALID vs VALIDATED; added TENTATIVE for đề án 2 năm); legacy M0 PROJECT_STATUS still in lib/constants.ts but Phase 5 sources of truth = lib/workflows/project.ts"
  - "JSON-backed wizard columns (generalInfoJson/objectivesJson/planJson/budgetJson) added alongside legacy scalar columns (objective/description/managerName/...) — co-exist for backward compat without schema thrash"
  - "pmContactId is plain String column referencing OrganizationProfile.contactsJson[].id (not FK) — keeps schema lean; snapshot resolved in get-detail.ts"
  - "ProjectVersion snapshotJson stores full project state at submit time (incl. all 4 JSON columns) — versions tab UI later compares snapshots"
  - "Đề án 2 năm: child created with status TENTATIVE in SAME transaction as parent SUBMITTED — atomic; child uses same programCycleId as parent (cycle-2027 may not exist yet, that's fine for placeholder)"
  - "Project code generation XTTM-{year}-{NNN} with count-based padding; race resolved by Prisma @unique on code (POC level)"
  - "Idempotency 5s window — prevents double-click duplicate submit; first call wins, subsequent calls in window return existing record"
  - "Mock notification dispatch reuses existing CYCLE_OPENED type — Phase 5 doesn't add new NotificationType enum (Phase 6 will when tiếp nhận generates new types)"

patterns-established:
  - "Pattern A: Per-step Zod schemas (generalInfoSchema, objectivesSchema, planSchema, budgetSchema, pmContactSchema, documentSchema) all named with `Internal` suffix internal + re-exported via aliases — ready for Phase 5 Plan 02 wizard client to import schemas, validate per-step"
  - "Pattern B: Cross-tenant guard pattern unified — every action checks session.organizationId === project.organizationId (excepts staff roles via canFromDB(role,'de-an','read'))"
  - "Pattern C: Status-aware mutation freeze — save-draft + upload-document + delete-document only allow status DRAFT | SUPPLEMENT_REQUIRED | TENTATIVE"
  - "Pattern D: Transaction wraps version-snapshot + status-change + đề án 2 năm child creation — atomic so partial failures don't leave inconsistent state"
  - "Pattern E: Notification dispatch wrapped in try/catch (fire-and-forget) — submit succeeds even if notification dispatch fails"

requirements-completed: [PROJ-01, PROJ-03, PROJ-12, PROJ-13, PROJ-14, PROJ-15, PROJ-17, PROJ-18, PROJ-19, PROJ-20, PROJ-21, PROJ-22]

duration: 13m
completed: 2026-04-30
---

# Phase 05 Plan 01: Schema verify + state machine + server actions + seed Summary

**Project state machine 14 states + ProjectVersion snapshot pattern + 11 server actions (autosave/submit with đề án 2 năm transactional child + withdraw + copy-from-previous + magic-byte upload) + 6 realistic mock projects covering APPROVED/SUBMITTED×2/DRAFT/IN_REVIEW/TENTATIVE — server-side foundation cho Phase 5 wizard UI (HERO).**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-30T22:15:23Z
- **Completed:** 2026-04-30T22:28:03Z
- **Tasks:** 3 (executed in 5 commits — 1 schema/workflow + 3 batched action commits + 1 seed)
- **Files modified:** 14 (3 modified core, 11 created)

## Accomplishments

- **State machine** 14 states locked in `lib/workflows/project.ts` with TRANSITIONS table + `canTransitionProject` + `validateGuards` 6 rules + `ALLOWED_NEXT_STATES` + status labels + badge theme — frozen contract for Phase 5+ server actions and UI buttons
- **ProjectVersion** snapshot model added to schema with `@@unique([projectId, versionNumber])` — atomic version creation in submit transaction
- **11 server actions** in `app/(app)/de-an/_actions/` covering full đơn vị self-service flow: types, listing (mine + previous), detail, autosave/save-draft, submit (with đề án 2 năm transactional child + 5s idempotency window + mock BANQL notification fan-out), withdraw, copy-from-previous (sao chép đề án cũ + suffix), upload + delete document (magic byte verification: PDF/DOC/DOCX/XLSX/JPG/PNG, 10MB, 20/project, UUID filename)
- **6 mock projects** seeded with realistic VN names, VND budget rows (500M-2B range), pmContactId resolved from Phase 4 OrgProfile contacts, status mix exactly matching plan spec (APPROVED=1, SUBMITTED=2, DRAFT=1, IN_REVIEW=1, TENTATIVE=1, đề án 2 năm child=1)
- **prisma db push** + **npm run db:seed** + **npx tsc --noEmit** + **npm run build** all exit 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema + state machine + audit types** — `0a2338f` (feat)
2. **Task 2 batch A: Read-only actions (types + list-mine + get-detail + list-previous)** — `f5cb26f` (feat)
3. **Task 2 batch B: Mutation actions (save-draft + submit + withdraw)** — `0a66ff1` (feat)
4. **Task 2 batch C: Special actions (copy-from-previous + upload-document)** — `f53840c` (feat)
5. **Task 3: Seed 6 mock projects** — `9314bff` (feat)

**Plan metadata:** to be added (docs commit at end)

## Files Created/Modified

**Created (11):**
- `prisma/seed/projects.ts` — 6 realistic VN project seeds covering 5 statuses + đề án 2 năm pair
- `app/(app)/de-an/_actions/types.ts` — Zod schemas for all 6 wizard steps + saveDraft payload
- `app/(app)/de-an/_actions/list-mine.ts` — Filtered list of caller's org projects
- `app/(app)/de-an/_actions/get-detail.ts` — Full detail with parent/children/versions/documents/pmContact snapshot
- `app/(app)/de-an/_actions/list-previous.ts` — APPROVED+ historical projects from same org
- `app/(app)/de-an/_actions/save-draft.ts` — autosave/find-or-create + getOrCreateMyDraft helper
- `app/(app)/de-an/_actions/submit.ts` — DRAFT→SUBMITTED with snapshot + đề án 2 năm child + notification
- `app/(app)/de-an/_actions/withdraw.ts` — SUBMITTED→DRAFT (rút hồ sơ)
- `app/(app)/de-an/_actions/copy-from-previous.ts` — Clone APPROVED+ project as new DRAFT
- `app/(app)/de-an/_actions/upload-document.ts` — Upload + delete with magic-byte verification

**Modified (3):**
- `prisma/schema.prisma` — Project model gets `year` Int + 4 wizard JSON columns + pmContactId + indexes; new ProjectVersion model with @@unique constraint
- `lib/workflows/project.ts` — Full rewrite: 14-state machine + transitions + guards + parsers + computeBudgetTotals + PROJECT_KIND_LABELS
- `lib/audit-types.ts` — Added PROJECT_AUDIT_TYPES with 7 composite identifiers (SAVE_DRAFT, SUBMIT, WITHDRAW, RESUBMIT, COPY_FROM_PREVIOUS, UPLOAD_DOCUMENT, TRANSITION)
- `prisma/seed.ts` — Call seedProjects + project status mix log + 6+ count assertion + status diversity + ≥1 đề án 2 năm child assertion

## Decisions Made

See `key-decisions` in frontmatter — 8 decisions captured.

Highlights:
1. **State name change** — Plan spec uses IN_REVIEW (vs M0 UNDER_REVIEW), SUPPLEMENT_REQUIRED (vs RETURNED_FOR_REVISION), VALID (vs VALIDATED). Plan's spec wins; lib/constants.ts legacy enum left as-is (Phase 6 will reconcile if needed).
2. **Coexisting columns** — Wizard JSON columns added alongside M0 legacy scalar columns (objective/managerName/...) — no schema thrash; UI prefers JSON.
3. **pmContactId as plain String** — references OrgProfile.contactsJson[].id without DB FK; snapshot resolved in get-detail.
4. **Atomic transaction** — submit() wraps version snapshot + status change + đề án 2 năm child creation in single $transaction.
5. **5s idempotency window** for double-click protection.

## Deviations from Plan

None — plan executed as written. The plan's must_haves (state machine, parentProjectId, ProjectVersion, 5+ seeded projects covering diverse states) all satisfied. State naming aligned to plan must_haves over M0 skeleton names — this is alignment with plan, not deviation.

## Issues Encountered

None significant. ESLint warnings about `console.log` in seed/seed.ts are pre-existing project pattern (other phases also log seed steps via console.log — expected behavior).

## User Setup Required

None — no external service configuration required. POC mode.

## Next Phase Readiness

**Ready for Plan 05-02 (Wizard 6 bước):**
- ✅ All Zod schemas exposed via types.ts re-exports — wizard client can import directly
- ✅ saveDraftProject autosave-ready — wizard wires debounce 2s
- ✅ submitProject + withdrawProject + copyFromPrevious wired to UI buttons in Plan 02
- ✅ ALLOWED_NEXT_STATES helper available for action button rendering
- ✅ PROJECT_STATUS_BADGE_THEME for StatusBadge consumption
- ✅ Mock data covers happy path (DRAFT to write into) + edge cases (APPROVED to copy from + IN_REVIEW to view + đề án 2 năm pair)

**Ready for Plan 05-03 (Detail + PDF + Versions):**
- ✅ getProjectDetail returns versions + documents + parent/children
- ✅ ProjectVersion snapshotJson serializes full state for diff viewer

**Blockers:** None.

## Self-Check

Verifying claims:

**Created files exist:**
- ✅ FOUND: prisma/seed/projects.ts
- ✅ FOUND: app/(app)/de-an/_actions/types.ts
- ✅ FOUND: app/(app)/de-an/_actions/list-mine.ts
- ✅ FOUND: app/(app)/de-an/_actions/get-detail.ts
- ✅ FOUND: app/(app)/de-an/_actions/list-previous.ts
- ✅ FOUND: app/(app)/de-an/_actions/save-draft.ts
- ✅ FOUND: app/(app)/de-an/_actions/submit.ts
- ✅ FOUND: app/(app)/de-an/_actions/withdraw.ts
- ✅ FOUND: app/(app)/de-an/_actions/copy-from-previous.ts
- ✅ FOUND: app/(app)/de-an/_actions/upload-document.ts

**Commits exist (verified post-creation):**
- ✅ FOUND: 0a2338f (Task 1)
- ✅ FOUND: f5cb26f (Task 2 batch A)
- ✅ FOUND: 0a66ff1 (Task 2 batch B)
- ✅ FOUND: f53840c (Task 2 batch C)
- ✅ FOUND: 9314bff (Task 3)

## Self-Check: PASSED

---
*Phase: 05-m2.3-khai-báo-nộp-đề-án*
*Completed: 2026-04-30*
