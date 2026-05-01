---
phase: 07-m3-thẩm-định-phê-duyệt
plan: 01
subsystem: evaluation
tags: [evaluation-council, scoring, side-by-side, pdf, react-pdf, prisma, conflict-of-interest, ranking]

# Dependency graph
requires:
  - phase: 01-m0-bootstrap-h-t-ng
    provides: PDF render pipeline (Be Vietnam Pro, OfficialDocument template, /api/pdf scaffold)
  - phase: 02-m1-quan-tri-danh-muc
    provides: ScoringCriterion catalog (15 records, 4 groups + 11 leaves), permissions matrix tham-dinh resource
  - phase: 03-m2.1-chu-kỳ-chương-trình-xttm
    provides: ProgramCycle với status EVALUATING + active cycle resolution
  - phase: 05-m2.3-khai-báo-nộp-đề-án
    provides: Project model + status machine (VALID → EVALUATING transition gate)
  - phase: 06-m2.4-tiếp-nhận-kiểm-tra
    provides: ScoreSheet kind field (PRELIMINARY|EVALUATION) + nullable councilId pattern
provides:
  - EvaluationCouncil + CouncilMember + ProjectCouncilAssignment schema
  - /hoi-dong (BQL council management) routes + 4-tab detail (Thành viên / Đề án / Kết quả / Báo cáo)
  - /tham-dinh (HOIDONG split-screen scoring) routes
  - Báo cáo thẩm định PDF chuẩn công văn nhà nước
  - Aggregate scoring (avg/min/max/ranking với COI-aware filter)
  - Lock workflow (OPEN → LOCKED freeze)
  - Workflow REJECTED_FINAL terminal state cho Phase 7-02
affects: [07-02-approval, 08-m4-hop-dong, 10-m6-bao-cao]

# Tech tracking
tech-stack:
  added:
    - EvaluationReport.tsx PDF template (A4 portrait, 4 sections + signature block)
  patterns:
    - "Council aggregate pattern: real-time calculation in getAggregateScores với rank assignment + COI exclusion"
    - "Split-screen scoring layout (xl:grid-cols-2) với sticky sidebars cả 2 bên"
    - "Member type constants in sibling member-types.ts (avoid 'use server' export-async constraint)"
    - "COI-aware ScoreSheet: conflictOfInterest=true → totalScore=0 + scoresJson=null, không tham gia avg"

key-files:
  created:
    - prisma/seed/councils.ts
    - lib/pdf/templates/EvaluationReport.tsx
    - app/(app)/hoi-dong/page.tsx
    - app/(app)/hoi-dong/[id]/page.tsx
    - app/(app)/hoi-dong/[id]/_components/CouncilDetail.tsx
    - app/(app)/hoi-dong/_components/CreateCouncilButton.tsx
    - app/(app)/hoi-dong/_actions/list.ts
    - app/(app)/hoi-dong/_actions/create.ts
    - app/(app)/hoi-dong/_actions/manage-members.ts
    - app/(app)/hoi-dong/_actions/member-types.ts
    - app/(app)/hoi-dong/_actions/assign-projects.ts
    - app/(app)/hoi-dong/_actions/aggregate.ts
    - app/(app)/hoi-dong/_actions/lock.ts
    - app/(app)/tham-dinh/page.tsx
    - app/(app)/tham-dinh/[projectId]/page.tsx
    - app/(app)/tham-dinh/[projectId]/_components/ScoringWorkspace.tsx
    - app/(app)/tham-dinh/[projectId]/_components/ScoringPanel.tsx
    - app/(app)/tham-dinh/[projectId]/_components/ProjectReadonlyPanel.tsx
    - app/(app)/tham-dinh/_actions/save-score.ts
    - app/(app)/tham-dinh/_actions/submit-score.ts
    - app/(app)/tham-dinh/_actions/decline-coi.ts
    - app/(app)/tham-dinh/_actions/list-assigned.ts
    - app/(app)/tham-dinh/_actions/get-detail.ts
    - app/api/pdf/evaluation/[councilId]/route.ts
  modified:
    - prisma/schema.prisma
    - lib/workflows/project.ts
    - lib/audit-types.ts
    - lib/constants.ts
    - lib/permissions.ts
    - lib/breadcrumbs.ts
    - components/shared/StatusBadge.tsx
    - lib/pdf/render.ts
    - prisma/seed/projects.ts
    - prisma/seed.ts

key-decisions:
  - "EvaluationCouncil retains legacy `status` (DRAFT|OPEN|CLOSED) field for backward compat but business logic dùng `lockStatus` (OPEN|LOCKED) per plan"
  - "CouncilMember has @@unique([councilId, userId]) — 1 user / 1 role / 1 council; role change via update existing row"
  - "Block member removal khi đã có ≥1 SUBMITTED EVALUATION ScoreSheet (preserve audit trail)"
  - "lockCouncil requires ≥1 SUBMITTED scoresheet để cho phép freeze (POC simplified — production sẽ tighten thành all-members-submitted)"
  - "COI checkbox: setting conflictOfInterest=true zeros totalScore + nullifies scoresJson, separates SUBMITTED-COI vs SUBMITTED-NORMAL trong aggregate filter"
  - "REJECTED_FINAL terminal state added to project workflow (Phase 7-02 sẽ wire khi Bộ ra quyết định không phê duyệt)"
  - "Sidebar split: /hoi-dong (BANQL/ADMIN/LANHDAO BQL view) vs /tham-dinh (HOIDONG/ADMIN scoring view) — same resource, role-gated paths"
  - "ScoringWorkspace split-screen xl:grid-cols-2 — sticky sidebars both sides, mobile fallback stacked với readonly trên scoring"
  - "Real-time aggregate qua server query (no polling/WebSocket) — TanStack Query polling được defer cho production"

patterns-established:
  - "Pure types in sibling -types.ts module pattern: 'use server' files cannot export non-async values, so COUNCIL_MEMBER_ROLES + LABELS moved to member-types.ts (consumed by both server actions + client components)"
  - "Split-screen split panel layout với sticky sidebar pattern (xl:sticky xl:top-4 + max-h-[calc(100vh-2rem)]) — Phase 8+ contract approval flow có thể reuse"
  - "Aggregate ranking pattern: filter validForAvg (no COI + has score) → sort desc → 1-based rank assignment; preserves null rank for projects với 0 valid sheets"
  - "PDF report pattern: htmlToPlain helper for Tiptap HTML reuse từ ProjectProposal.tsx; lockStatus drives watermark conditionality (BẢN MẪU when OPEN, blank when LOCKED)"
  - "COI flow: 2 entry points (checkbox in ScoringPanel + dedicated declineCOI action) consolidate to same ScoreSheet state (conflictOfInterest=true, status=SUBMITTED, totalScore=0, comment=reason)"

requirements-completed:
  - COUNCIL-01
  - COUNCIL-02
  - COUNCIL-03
  - COUNCIL-04
  - COUNCIL-05
  - COUNCIL-06
  - COUNCIL-07
  - COUNCIL-08
  - COUNCIL-09
  - COUNCIL-10
  - COUNCIL-11
  - COUNCIL-12
  - COUNCIL-13
  - COUNCIL-14
  - COUNCIL-15
  - COUNCIL-16

# Metrics
duration: 25min
completed: 2026-04-30
---

# Phase 7 Plan 01: Hội đồng thẩm định + scoring + báo cáo PDF Summary

**Hội đồng thẩm định module với BQL council management UI 4-tab (members + assignments + ranked aggregate + PDF report) và HOIDONG side-by-side scoring (rubric trái với slider 0-10 + COI checkbox + project readonly tabs phải) đầy đủ workflow VALID → EVALUATING + lock + COI handling**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-30T23:50:59Z
- **Completed:** 2026-05-01T00:15:54Z
- **Tasks:** 5 (8 commits — Task 2 và 3 mỗi cái 3 batches)
- **Files created:** 24
- **Files modified:** 10

## Accomplishments

- Schema mở rộng cho Phase 7: EvaluationCouncil + CouncilMember + ProjectCouncilAssignment + ScoreSheet councilId wiring
- 11 audit types Phase 7 (COUNCIL_AUDIT_TYPES + APPROVAL_AUDIT_TYPES — chuẩn bị cho 7-02)
- Project workflow REJECTED_FINAL terminal state + EVALUATING transitions
- /hoi-dong list page + detail 4-tab (members management + project assignment + aggregate ranking + PDF export)
- /tham-dinh list + split-screen [projectId] scoring page với sticky panels
- 5 server actions cho scoring (saveEvaluationScore + submitEvaluationScore + declineCOI + listAssignedProjects + getEvaluationDetail)
- 6 server actions cho council management (listCouncils + createCouncil + addMember/removeMember + assignProjects/unassignProject + lockCouncil/unlockCouncil + listAssignableProjects + listEligibleUsers)
- EvaluationReport PDF template chuẩn công văn nhà nước Việt Nam + /api/pdf/evaluation/[councilId] streaming endpoint
- Seed data: 1 council + 3 members (chair + phó + ủy viên với 2 mock HOIDONG users) + 2 EVALUATION sheets (1 DRAFT + 1 SUBMITTED)
- 2 VALID projects bổ sung (XTTM-2026-008, XTTM-2026-009) để demo coverage
- Sidebar role-gated routes (/hoi-dong cho BANQL, /tham-dinh cho HOIDONG)

## Task Commits

1. **Task 1: Schema + Workflow + Audit Foundation** — `fb8d37b` (feat)
2. **Task 2 Batch A: list + create + manage-members actions** — `3e240cd` (feat)
3. **Task 2 Batch B: assign-projects + aggregate + lock actions** — `4d0e8eb` (feat)
4. **Task 2 Batch C: /hoi-dong list page + CouncilDetail UI** — `77a5261` (feat)
5. **Task 3 Batch A: /tham-dinh actions** — `7d9bdf8` (feat)
6. **Task 3 Batch B+C: /tham-dinh page + ScoringPanel + ProjectReadonlyPanel** — `124dc31` (feat)
7. **Task 4: EvaluationReport PDF + /api/pdf/evaluation route** — `1ba47c9` (feat)
8. **Task 5: seed councils + 2 VALID projects** — `e4e57b4` (feat)

## Files Created/Modified

### Schema + Workflow
- `prisma/schema.prisma` — 3 new models, 1 extended (EvaluationCouncil)
- `lib/workflows/project.ts` — REJECTED_FINAL terminal state + EVALUATING transitions

### Server Actions
- `app/(app)/hoi-dong/_actions/*` — 6 files (list, create, manage-members, member-types, assign-projects, aggregate, lock)
- `app/(app)/tham-dinh/_actions/*` — 5 files (save-score, submit-score, decline-coi, list-assigned, get-detail)

### Pages + UI
- `app/(app)/hoi-dong/page.tsx` + `[id]/page.tsx` + components (CreateCouncilButton, CouncilDetail)
- `app/(app)/tham-dinh/page.tsx` + `[projectId]/page.tsx` + components (ScoringWorkspace, ScoringPanel, ProjectReadonlyPanel)

### PDF + API
- `lib/pdf/templates/EvaluationReport.tsx` — A4 báo cáo thẩm định
- `lib/pdf/render.ts` — renderEvaluationReportPdf wrapper
- `app/api/pdf/evaluation/[councilId]/route.ts` — streaming PDF endpoint

### Seed
- `prisma/seed/councils.ts` — Phase 7 mock data driver
- `prisma/seed/projects.ts` — 2 VALID projects bổ sung
- `prisma/seed.ts` — wire seedCouncils + assertions

### Config + Cross-cutting
- `lib/audit-types.ts` — COUNCIL_AUDIT_TYPES + APPROVAL_AUDIT_TYPES
- `lib/permissions.ts` — split /hoi-dong vs /tham-dinh sidebar entries
- `lib/breadcrumbs.ts` — `/hoi-dong` label
- `components/shared/StatusBadge.tsx` — REJECTED_FINAL theme
- `lib/constants.ts` — REJECTED_FINAL status label

## Decisions Made

- **lockStatus over status**: EvaluationCouncil giữ legacy `status` field (DRAFT|OPEN|CLOSED) để backward-compat nhưng business logic dùng `lockStatus` (OPEN|LOCKED) — separation cho phép admin sau này mở rộng status semantics mà không phá UI
- **REJECTED_FINAL state**: thay vì reuse REJECTED, thêm terminal state mới — REJECTED là từ vòng kiểm tra (Phase 6, có thể supplement), REJECTED_FINAL là quyết định Bộ không phê duyệt (terminal). Phase 7-02 sẽ wire transition.
- **Member types in sibling module**: COUNCIL_MEMBER_ROLES + LABELS moved khỏi 'use server' module sau Rule 1 fix khi build phát hiện constraint
- **COI normalization**: Same ScoreSheet table — `conflictOfInterest=true` flag điều khiển aggregate filter; không tạo separate `ConflictOfInterestDeclaration` model
- **Split sidebar paths**: /hoi-dong (BQL view managing councils) vs /tham-dinh (HOIDONG view scoring) — single resource (`tham-dinh`) nhưng 2 path để menu render rõ ràng theo role
- **Aggregate via server query**: TanStack Query polling 5s defer; current SSR approach đủ POC quality, refresh-on-action via `router.refresh()` keeps UX smooth
- **Lock guard simplified**: lockCouncil chỉ require ≥1 SUBMITTED sheet — production sẽ tighten thành all-members-submitted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 'use server' export-async constraint violation**
- **Found during:** Task 2 Batch C (build)
- **Issue:** `manage-members.ts` is a `'use server'` file but exports `COUNCIL_MEMBER_ROLES` + `COUNCIL_MEMBER_ROLE_LABELS` non-async values. Build fails: `A "use server" file can only export async functions, found object.`
- **Fix:** Created sibling `member-types.ts` module (no 'use server' directive) holding the constants + type. Updated all imports in CouncilDetail.tsx and consumers.
- **Files modified:** `app/(app)/hoi-dong/_actions/member-types.ts` (new), `app/(app)/hoi-dong/_actions/manage-members.ts`, `app/(app)/hoi-dong/[id]/_components/CouncilDetail.tsx`
- **Verification:** `npm run build` exit 0
- **Committed in:** `77a5261` (Task 2 Batch C commit)

**2. [Rule 3 - Blocking] Insufficient VALID projects for demo coverage**
- **Found during:** Task 5 (seed run)
- **Issue:** seedCouncils consumes 2 VALID projects (transitions to EVALUATING), leaving 0 — assertion `Expected ≥1 VALID Project (Phase 6 demo)` fails
- **Fix:** Added 2 new VALID projects to seedProjects (XTTM-2026-008 Texworld NYC, XTTM-2026-009 Đào tạo Da giày) before councils consume — net VALID after council = 1, satisfying assertion + giving BQL realistic assignable list
- **Files modified:** `prisma/seed/projects.ts`, `prisma/seed.ts` (project count threshold ≥9 → ≥11)
- **Verification:** `npm run db:seed` × 2 idempotent, all assertions pass
- **Committed in:** `e4e57b4` (Task 5 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes essential — Rule 1 fix unblocks build, Rule 3 fix preserves Phase 6 demo state. No scope creep.

## Issues Encountered

None during planned work — execution flowed cleanly. Both deviations were caught at verification gates (build + seed).

## User Setup Required

None — no external service configuration required. PDF rendering uses local Be Vietnam Pro fonts already in `public/fonts/` from Phase 1.

## Next Phase Readiness

- **Plan 7-02 (Approval):** Aggregate scoring API + REJECTED_FINAL state ready for tờ trình + decision flow. ProjectCouncilAssignment data có sẵn cho list-candidates query (sort by averageScore desc).
- **Phase 8 (Contract):** EvaluationCouncil + ScoreSheet are write-once after lock — Phase 8 can read-only reference council outcome.

### Demo Flow Validated

After `npm run db:seed`:
- BQL login → `/hoi-dong` → see "Hội đồng Thẩm định CT XTTMQG 2026 — Kỳ 1" với 3 members + 2 đề án + 2 phiếu (1 nộp)
- BQL → tab "Kết quả tổng hợp" → thấy ranked table với điểm TB + min/max + COI flags
- BQL → tab "Báo cáo PDF" → click "Xuất báo cáo PDF" → mở `/api/pdf/evaluation/[councilId]` với watermark "BẢN MẪU" (council OPEN)
- HOIDONG login → `/tham-dinh` → thấy 2 đề án assigned, 1 chưa chấm + 1 đang chấm (DRAFT)
- HOIDONG → click vào đề án → split-screen rubric + project tabs → score slider 0-10 + comment + COI checkbox + Lưu nháp / Nộp chính thức

---
*Phase: 07-m3-thẩm-định-phê-duyệt*
*Completed: 2026-05-01*

## Self-Check: PASSED

All claims verified:

**Files created:**
- FOUND: prisma/seed/councils.ts
- FOUND: lib/pdf/templates/EvaluationReport.tsx
- FOUND: app/(app)/hoi-dong/page.tsx
- FOUND: app/(app)/hoi-dong/[id]/page.tsx
- FOUND: app/(app)/hoi-dong/[id]/_components/CouncilDetail.tsx
- FOUND: app/(app)/tham-dinh/page.tsx
- FOUND: app/(app)/tham-dinh/[projectId]/page.tsx
- FOUND: app/(app)/tham-dinh/[projectId]/_components/ScoringPanel.tsx
- FOUND: app/(app)/tham-dinh/[projectId]/_components/ProjectReadonlyPanel.tsx
- FOUND: app/api/pdf/evaluation/[councilId]/route.ts

**Commits:**
- FOUND: fb8d37b (Task 1 schema + workflow)
- FOUND: 3e240cd (Task 2A actions list/create/manage-members)
- FOUND: 4d0e8eb (Task 2B actions assign/aggregate/lock)
- FOUND: 77a5261 (Task 2C UI page + CouncilDetail)
- FOUND: 7d9bdf8 (Task 3A tham-dinh actions)
- FOUND: 124dc31 (Task 3BC scoring page)
- FOUND: 1ba47c9 (Task 4 PDF)
- FOUND: e4e57b4 (Task 5 seed)
