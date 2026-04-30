---
phase: 06-m2.4-tiếp-nhận-kiểm-tra
plan: 01
subsystem: workflow
tags: [intake, checklist, drag-drop, scoring, rbac, audit, prisma, sqlite]

requires:
  - phase: 05-m2.3-khai-báo-nộp-đề-án
    provides: Project model + state machine + guard validators + ScoreSheet scaffold
  - phase: 02-m1-quan-tri-danh-muc
    provides: ScoringCriterion catalog (15 records, 4 group + 11 leaf)
  - phase: 01-m0-bootstrap-h-t-ng
    provides: RBAC matrix + audit infrastructure + DataTable + ConfirmDialog

provides:
  - "/tiep-nhan route — BQL list + bulk receive (SUBMITTED → ASSIGNED)"
  - "/phan-cong route — LĐ BQL drag-drop assignment board (HTML5 native, no extra deps)"
  - "/kiem-tra + /kiem-tra/[id] — Chuyên viên 12-item checklist + supplement request + mark valid"
  - "/cham-diem-so-bo + /cham-diem-so-bo/[id] — PRELIMINARY ScoreSheet form, weighted total, save draft + finalize"
  - "lib/intake-checklist.ts — 12 hardcoded checklist items + helpers (parseChecklist, computeChecklistPassRatio, sanitizeChecklistInput, CHECKLIST_PASS_THRESHOLD=0.8)"
  - "lib/audit-types.ts INTAKE_AUDIT_TYPES — 10 composite identifiers"
  - "Project model intake fields: assignedAt, assignedById, checklistJson, passedFormalCheck, formalRejectionReason, supplementRequestReason"
  - "ScoreSheet kind field (PRELIMINARY|EVALUATION) + nullable councilId"
  - "Server actions: receiveProject, assignProject, unassignProject, saveChecklist, requestSupplement, markValid, saveScore, finalizeScore — all wrapped withAuditLog + canFromDB"
  - "9 seeded projects covering Phase 6 demo states (ASSIGNED, IN_REVIEW partial checklist, VALID + PRELIMINARY ScoreSheet DRAFT, SUPPLEMENT_REQUIRED)"

affects:
  - "Phase 7 (M3 Thẩm định) — uses passedFormalCheck=true filter, EVALUATION ScoreSheet"
  - "Phase 8 (M4 Hợp đồng) — Project status APPROVED → contract creation downstream"

tech-stack:
  added: []
  patterns:
    - "HTML5 native drag/drop pattern for assignment board (avoid heavy deps)"
    - "Entity-aware permissions: assignedReviewerId === session.user.id || canFromDB('tiep-nhan', view-all)"
    - "Server-side checklist threshold enforcement (T-06-01-02): markValid validates ≥80% items checked"
    - "Self-assign guard (T-06-01-03): assignProject rejects staffUserId === session.user.id"
    - "Find-or-create ScoreSheet with composite key (projectId, reviewerId, kind)"
    - "Composite audit type constants (INTAKE_AUDIT_TYPES) for grep-able semantics"

key-files:
  created:
    - "lib/intake-checklist.ts"
    - "app/(app)/tiep-nhan/page.tsx + _actions/{list,receive}.ts + _components/{IntakeTable,IntakeFilterBar}.tsx"
    - "app/(app)/phan-cong/page.tsx + _actions/{list-staff,assign,unassign}.ts + _components/AssignmentBoard.tsx"
    - "app/(app)/kiem-tra/page.tsx + [id]/page.tsx + _actions/{list-mine,get-detail,save-checklist,request-supplement,mark-valid}.ts + _components/{ReviewQueueTable,ChecklistForm,SupplementRequestDialog,ReviewActions}.tsx"
    - "app/(app)/cham-diem-so-bo/page.tsx + [id]/page.tsx + _actions/{list-valid,get-detail,save-score,finalize-score}.ts + _components/{ScoringQueueTable,ScoringForm}.tsx"
  modified:
    - "prisma/schema.prisma (Project intake fields + ScoreSheet kind/optional councilId)"
    - "lib/workflows/project.ts (IN_REVIEW now allows REJECTED transition)"
    - "lib/audit-types.ts (INTAKE_AUDIT_TYPES added)"
    - "lib/permissions.ts (4 new menu items: split tiep-nhan/phan-cong for BANQL, kiem-tra/cham-diem-so-bo for CHUYENVIEN)"
    - "prisma/seed/projects.ts (3 new projects + intake state fields + PRELIMINARY ScoreSheet seeding)"
    - "prisma/seed.ts (validation expects ≥9 projects + ≥1 each ASSIGNED/VALID/SUPPLEMENT_REQUIRED + ≥1 PRELIMINARY ScoreSheet)"

key-decisions:
  - "Single consolidated plan covers full Phase 6 — no sub-plans needed for ~13 INTAKE-* requirements"
  - "HTML5 native drag-drop chosen over react-dnd / @hello-pangea/dnd — keeps deps minimal for POC"
  - "Checklist hardcoded in lib/intake-checklist.ts (12 items) instead of catalog-backed — POC speed"
  - "PRELIMINARY ScoreSheet shares ScoreSheet model with EVALUATION via kind field; councilId nullable"
  - "Self-assign guard server-side only (T-06-01-03), no UI hint needed since LĐ BQL không có CHUYENVIEN role"
  - "Mock notifications for supplement request reuse 'CYCLE_OPENED' enum until INTAKE notification type added"
  - "Tái phân công preserves checklist progress (chuyên viên mới thấy work của chuyên viên cũ)"

patterns-established:
  - "Pattern: Multi-step intake state machine — SUBMITTED → ASSIGNED → IN_REVIEW → (SUPPLEMENT_REQUIRED ↔ RESUBMITTED → IN_REVIEW)* → VALID/REJECTED with 80% checklist threshold"
  - "Pattern: Entity-aware list — list-mine.ts pattern (assignedReviewerId === session.user.id) re-used in kiem-tra + cham-diem-so-bo"
  - "Pattern: 2-column detail with sticky right action panel — kiem-tra/[id]/page.tsx layout for review actions"
  - "Pattern: Autosave debounce 1s (ChecklistForm) — saving state machine 'idle | pending | saving | saved | error'"
  - "Pattern: Group + leaf criterion tree rendering with weighted total computation (skip parentId=null)"

requirements-completed: [INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05, INTAKE-06, INTAKE-07, INTAKE-08, INTAKE-09, INTAKE-10, INTAKE-11, INTAKE-12, INTAKE-13]

duration: 47min
completed: 2026-04-30
---

# Phase 6 Plan 01: Tiếp nhận, phân công, kiểm tra checklist, chấm điểm sơ bộ Summary

**Hoàn thành 4 routes (/tiep-nhan, /phan-cong, /kiem-tra, /cham-diem-so-bo) với HTML5 drag-drop assignment + 12-item checklist autosave + PRELIMINARY ScoreSheet weighted scoring — 13/13 INTAKE-* requirements covered, 9 seeded demo projects.**

## Performance

- **Duration:** ~47 min
- **Started:** 2026-04-30T23:16Z (Phase 6 execution)
- **Completed:** 2026-05-01T00:03Z
- **Tasks:** 6 / 6
- **Files created/modified:** 30+ files

## Accomplishments

- Workflow extended: Project intake fields (assignedAt, checklistJson, passedFormalCheck, supplementRequestReason); ScoreSheet kind field with PRELIMINARY|EVALUATION; nullable councilId.
- 12-item hardcoded checklist (lib/intake-checklist.ts) with 80% pass threshold + parse/compute/sanitize helpers.
- /tiep-nhan: BQL nhận hồ sơ với search/kind/date filters + bulk receive button (SUBMITTED → ASSIGNED).
- /phan-cong: LĐ BQL drag-drop board hai cột (queue ↔ staff drop zones) với load count tone (slate/emerald/amber/red), tái phân công confirm, click fallback dialog cho mobile.
- /kiem-tra + /kiem-tra/[id]: Chuyên viên list filter `assignedReviewerId === me` + 2-cột detail (project summary | sticky action panel) với checklist autosave 1s + supplement dialog với 4 quick suggestions + mark valid với server-side ≥80% guard.
- /cham-diem-so-bo + /cham-diem-so-bo/[id]: PRELIMINARY ScoreSheet form với group sections + slider 0-10 per leaf criterion + weighted total tự động + save draft / finalize buttons.
- Seed: 3 new projects (ASSIGNED, VALID + PRELIMINARY ScoreSheet DRAFT, SUPPLEMENT_REQUIRED) + update IN_REVIEW project với partial checklist 8/9.
- 4 menu items mới (split tiep-nhan/phan-cong cho BANQL; kiem-tra/cham-diem-so-bo cho CHUYENVIEN).

## Task Commits

Each task was committed atomically:

1. **Task 1: extend workflow + checklist + audit types** — `805917d` (feat)
2. **Task 2: /tiep-nhan BQL nhận hồ sơ** — `af32602` (feat)
3. **Task 3: /phan-cong drag-drop assignment board** — `c2660fa` (feat)
4. **Task 4: /kiem-tra list + detail + checklist + supplement** — `25d7a3c` (feat)
5. **Task 5: chấm điểm sơ bộ form + actions** — `4411bb7` (feat)
6. **Task 6: update seed for INTAKE workflow demo states** — `e4edf0a` (feat)

## Files Created/Modified

**Created (lib + 4 routes):**
- `lib/intake-checklist.ts` — 12 checklist items + helpers
- `app/(app)/tiep-nhan/{page.tsx, _actions/list.ts, _actions/receive.ts, _components/IntakeTable.tsx, _components/IntakeFilterBar.tsx}`
- `app/(app)/phan-cong/{page.tsx, _actions/{list-staff,assign,unassign}.ts, _components/AssignmentBoard.tsx}`
- `app/(app)/kiem-tra/{page.tsx, [id]/page.tsx, _actions/{list-mine,get-detail,save-checklist,request-supplement,mark-valid}.ts, _components/ReviewQueueTable.tsx, [id]/_components/{ChecklistForm,SupplementRequestDialog,ReviewActions}.tsx}`
- `app/(app)/cham-diem-so-bo/{page.tsx, [id]/page.tsx, _actions/{list-valid,get-detail,save-score,finalize-score}.ts, _components/ScoringQueueTable.tsx, [id]/_components/ScoringForm.tsx}`

**Modified:**
- `prisma/schema.prisma` — Project intake columns + ScoreSheet kind
- `lib/workflows/project.ts` — IN_REVIEW now also allows REJECTED
- `lib/audit-types.ts` — INTAKE_AUDIT_TYPES added (10 composite types)
- `lib/permissions.ts` — 4 new menu items + roleOnly guards
- `prisma/seed/projects.ts` — 3 new projects + intake fields + PRELIMINARY ScoreSheet
- `prisma/seed.ts` — validation expects 9 projects + new statuses + PRELIMINARY ScoreSheet

## Decisions Made

- **Single consolidated plan:** All 6 tasks for the entire Phase 6 module landed in one plan instead of splitting into multiple. Rationale: 13 INTAKE-* requirements have tight semantic coupling around the same Project entity + checklist + scoring flow — splitting would create artificial seams.
- **HTML5 native drag-drop:** No additional dependencies. Plan suggested react-dnd / @hello-pangea/dnd as alternatives; native chosen for minimal deps + simpler primitives + sufficient UX for POC.
- **Hardcoded checklist (lib/intake-checklist.ts):** Plan offered "constants vs catalog seed" — chose constants for POC speed. 12 items based on Mau bieu/ + Cục XTTM checklist pattern. Catalog-backed move is deferred.
- **ScoreSheet kind field + nullable councilId:** Reuses existing ScoreSheet model for both PRELIMINARY (Phase 6) and EVALUATION (Phase 7) instead of creating PreliminaryScore + EvaluationScore split tables. Composite unique key (projectId, reviewerId, kind) replaces (councilId, projectId, reviewerId) to support PRELIMINARY entries without council.
- **Self-assign guard server-side only:** No UI hint needed — currently the only role that can assign (BANQL) doesn't overlap with CHUYENVIEN, so the guard fires only as defensive depth.
- **Notification type reuse:** supplementRequest mock notifications use `CYCLE_OPENED` enum until proper INTAKE notification types are added in Phase 7+ (deferred — out of scope per plan).
- **Tái phân công preserves checklist:** When LĐ BQL reassigns to new chuyên viên, existing checklistJson is kept (new chuyên viên sees prior progress) instead of nulled. UX-friendly + audit-friendly.
- **Workflow extension scoped:** Only added REJECTED to IN_REVIEW transitions (formal rejection from Phase 6) — no new statuses, since SUBMITTED → ASSIGNED → IN_REVIEW → SUPPLEMENT_REQUIRED → RESUBMITTED → VALID was already in place from Phase 5.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Schema: ScoreSheet councilId required but Phase 6 PRELIMINARY scoring runs before council formation**
- **Found during:** Task 1 (schema verification)
- **Issue:** Plan said "ScoreSheet should have evaluatorId, criteriaScores Json, kind". Existing schema had councilId required + reviewerId + scoresJson. PRELIMINARY scoring (Phase 6) happens before EvaluationCouncil exists.
- **Fix:** Made councilId optional + added kind field with default 'EVALUATION' + replaced unique key (councilId, projectId, reviewerId) with (projectId, reviewerId, kind) so PRELIMINARY entries can coexist with EVALUATION entries for the same reviewer.
- **Files modified:** prisma/schema.prisma
- **Verification:** prisma db push succeeded; PRELIMINARY ScoreSheet seeded successfully.
- **Committed in:** 805917d

**2. [Rule 2 - Missing critical] Plan-suggested criterion codes did not match seeded scoring criteria**
- **Found during:** Task 6 (seed PRELIMINARY ScoreSheet)
- **Issue:** Plan implied codes like `CRIT_RELEVANCE_NATIONAL`, `CRIT_FEASIBILITY_BUDGET`. Actual seed (Phase 2) uses `CRIT_FIT_DIRECTION`, `CRIT_FEAS_FINANCE`, etc.
- **Fix:** Updated PRELIMINARY ScoreSheet seed to use actual codes (CRIT_FIT_*, CRIT_FEAS_*, CRIT_IMPACT_*, CRIT_QUALITY_*).
- **Files modified:** prisma/seed/projects.ts
- **Verification:** Seed succeeded with 1 PRELIMINARY ScoreSheet record.
- **Committed in:** e4edf0a

**3. [Rule 2 - Missing critical] Menu items for /phan-cong, /kiem-tra, /cham-diem-so-bo were not in sidebar**
- **Found during:** Task 5 (after final scoring page)
- **Issue:** Plan focused on routes but didn't specify menu wiring. Without menu items, users can't discover the new pages.
- **Fix:** Added 4 menu items to lib/permissions.ts ALL_MENU_ITEMS with roleOnly filters: tiep-nhan + phan-cong (BANQL only), kiem-tra + cham-diem-so-bo (CHUYENVIEN only). Updated tiep-nhan with roleOnly to avoid CHUYENVIEN seeing BQL queue.
- **Files modified:** lib/permissions.ts
- **Verification:** Build succeeded with 5 new routes recognized.
- **Committed in:** 4411bb7

**4. [Rule 2 - Missing critical] Plan asked for evaluatorId field, schema has reviewerId**
- **Found during:** Task 1
- **Issue:** Plan named the field "evaluatorId"; schema already has "reviewerId" (used by Phase 7 thẩm định). Renaming would break Phase 7 scaffolding.
- **Fix:** Kept reviewerId. Used it consistently in PRELIMINARY ScoreSheet (chuyên viên = reviewer for kind=PRELIMINARY).
- **Files modified:** N/A — kept original schema field name.
- **Committed in:** 805917d

---

**Total deviations:** 4 auto-fixed (1 blocking schema gap, 3 missing critical wiring)
**Impact on plan:** All deviations were necessary for correctness. No scope creep — all stayed within Phase 6 INTAKE scope.

## Issues Encountered

- TypeScript error on type predicate in seed (sanitized scores filter): refactored from `.map().filter(): is X` pattern to imperative `for...push` to satisfy strict optional-property typing. Resolved in same task commit (e4edf0a).
- formatCurrency helper does not exist in lib/format.ts — used existing formatVNDCompact instead. (Phase 5 helper coverage.)

## Threat Model Coverage

| Threat | Severity | Mitigation Implemented |
|--------|----------|------------------------|
| T-06-01-01: Chuyên viên access hồ sơ không được giao | high | getReviewProjectDetail returns null when assignedReviewerId !== session.user.id AND role lacks view-all; list-mine.ts filters by assignedReviewerId at SQL level |
| T-06-01-02: Bypass checklist (mark valid without items) | medium | markValid server action calls computeChecklistPassRatio + checks ratio ≥ CHECKLIST_PASS_THRESHOLD (0.8) before transition; UI guard is defense-in-depth |
| T-06-01-03: Self-assign | medium | assignProject server action rejects staffUserId === session.user.id with "Không thể tự phân công cho chính mình" |

## Known Stubs

- **Notification type reuse**: Supplement-request mock notifications dispatch with `type='CYCLE_OPENED'` (existing enum) instead of a dedicated INTAKE_SUPPLEMENT_REQUEST type. Tracked for Phase 7+ when notification taxonomy is consolidated. Functional impact: in-app inbox renders entries correctly; only the type-label is generic.
- **Council seeding**: PRELIMINARY ScoreSheet records have `councilId=null` (intentional for Phase 6). Phase 7 will introduce EVALUATION ScoreSheet with `councilId=<EvaluationCouncil.id>`.

## User Setup Required

None — no external service configuration required for Phase 6.

## Next Phase Readiness

- **Phase 7 (M3 Thẩm định) ready:** Filter `passedFormalCheck=true` to list eligible projects for council scoring. PRELIMINARY ScoreSheet weights + total calculation pattern can be reused for EVALUATION.
- **Schema stable:** Project model + ScoreSheet model now cover all INTAKE + EVALUATION needs without further migrations.
- **Demo data ready:** 9 projects covering 8 distinct statuses (DRAFT/SUBMITTED/ASSIGNED/IN_REVIEW/SUPPLEMENT_REQUIRED/VALID/APPROVED/TENTATIVE) sufficient for end-to-end demo of Cycle 2026 lifecycle through Phase 6.

## Self-Check: PASSED

Verification commands:
- `git log --oneline -7` confirms 6 task commits (805917d, af32602, c2660fa, 25d7a3c, 4411bb7, e4edf0a) + planning commit (dba9d99).
- `npx next build` exit 0 with all 4 new routes (/tiep-nhan, /phan-cong, /kiem-tra, /kiem-tra/[id], /cham-diem-so-bo, /cham-diem-so-bo/[id]).
- `npm run db:seed` exit 0 with 9 projects + 1 PRELIMINARY ScoreSheet.
- `npx tsc --noEmit` exit 0.

---
*Phase: 06-m2.4-tiếp-nhận-kiểm-tra*
*Completed: 2026-04-30*
