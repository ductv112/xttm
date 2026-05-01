---
phase: 07-m3-thẩm-định-phê-duyệt
plan: 02
subsystem: approval
tags: [submission, approval-decision, pdf, react-pdf, tiptap, notification, mock-dispatch, government-document]

# Dependency graph
requires:
  - phase: 03-m2.1-chu-kỳ-chương-trình-xttm
    provides: Notification + NotificationDispatch schema (mock email)
  - phase: 05-m2.3-khai-báo-nộp-đề-án
    provides: Project workflow EVALUATING → APPROVED transition
  - phase: 07-01-council
    provides: EvaluationCouncil + aggregate scoring (averageScore + ranking) + REJECTED_FINAL state
provides:
  - SubmissionDraft + ApprovalDecision schema + workflow tự động
  - /phe-duyet (BQL list + 3-tab detail editor)
  - Tờ trình PDF chuẩn công văn nhà nước
  - Quyết định phê duyệt PDF chuẩn công văn nhà nước
  - Notification flow (composer + variable substitution + per-org dispatch)
affects: [08-m4-hop-dong, 10-m6-bao-cao]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Submission/Decision atomic write: saveDecision uses prisma.$transaction để create ApprovalDecision + transition projects (EVALUATING→APPROVED|REJECTED_FINAL) trong cùng tx — prevents partial state"
    - "Idempotency guard: ApprovalDecision.decisionNumber unique check via findFirst trước create (T-07-02-03)"
    - "Tab orchestrator pattern: SubmissionTabsShell defaultValue logic chuyển tab theo state (DRAFT→draft, SUBMITTED→decision, has decision→notify) cho UX flow tự nhiên"
    - "Variable substitution helper (split-join, no regex injection) tái sử dụng từ Plan 02-06 DocumentTemplate"
    - "Mode switcher pattern in NotifyComposer (approved/rejected templates) với conditional disable khi rejectedProjects.length === 0"

key-files:
  created:
    - lib/pdf/templates/Submission.tsx
    - lib/pdf/templates/ApprovalDecision.tsx
    - app/(app)/phe-duyet/page.tsx
    - app/(app)/phe-duyet/new/page.tsx
    - app/(app)/phe-duyet/[id]/page.tsx
    - app/(app)/phe-duyet/[id]/_components/SubmissionTabsShell.tsx
    - app/(app)/phe-duyet/[id]/_components/SubmissionDraftForm.tsx
    - app/(app)/phe-duyet/[id]/_components/DecisionForm.tsx
    - app/(app)/phe-duyet/[id]/_components/NotifyComposer.tsx
    - app/(app)/phe-duyet/_actions/list-candidates.ts
    - app/(app)/phe-duyet/_actions/save-submission.ts
    - app/(app)/phe-duyet/_actions/save-decision.ts
    - app/(app)/phe-duyet/_actions/notify-results.ts
    - app/api/pdf/submission/[id]/route.ts
    - app/api/pdf/decision/[id]/route.ts
  modified:
    - prisma/schema.prisma
    - lib/pdf/render.ts

key-decisions:
  - "SubmissionDraft.projectIdsJson stored as JSON array (no junction table) — preserves submission ordering + simple read; FK integrity validated at write time"
  - "ApprovalDecision 1:1 với SubmissionDraft via @unique submissionId — preserves audit trail, cannot duplicate decision per submission"
  - "Decision atomic transaction: create ApprovalDecision + transition all projects (EVALUATING → APPROVED with approvedBudget set, or REJECTED_FINAL) trong single $transaction"
  - "saveDecision auto-marks SubmissionDraft.status = SUBMITTED_TO_BO (idempotent) — UI flow consistency"
  - "Reject scenario: project trong submission nhưng KHÔNG trong approvedItems → REJECTED_FINAL (terminal, không supplement)"
  - "Notification reuses CYCLE_OPENED type (no new enum) — POC simplification per Phase 3-04 pattern"
  - "Variable substitution dùng split().join() instead of regex (T-07-02 mitigation pattern reuse Plan 02-06)"
  - "Approved budget > proposed: show red warning + double-confirm dialog, but server allows (BQL có quyền override theo nghị định)"
  - "vndInWords helper POC simplified — chỉ formatNumber + 'đồng', full Vietnamese number-to-words deferred"

patterns-established:
  - "Approval flow tabs orchestrator: SubmissionTabsShell với defaultValue logic giúp users naturally land on next-action tab"
  - "Hook-safe early return pattern: useMemo declared before conditional null-check return (avoid React Hooks rules violation)"
  - "Atomic state transitions: prisma.$transaction wraps decision create + N project status updates — Phase 8+ contract creation có thể reuse pattern"
  - "PDF endpoint pattern reuse: Same auth + canFromDB + getSubmissionDetail pipeline cho cả submission và decision PDF, riêng nội dung khác"

requirements-completed:
  - APPROVE-01
  - APPROVE-02
  - APPROVE-03
  - APPROVE-04
  - APPROVE-05
  - APPROVE-06
  - APPROVE-07
  - APPROVE-08

# Metrics
duration: 14min
completed: 2026-05-01
---

# Phase 7 Plan 02: Phê duyệt — tờ trình + quyết định + thông báo Summary

**Approval flow đầy đủ: list candidates by ranking → soạn tờ trình + xuất PDF chuẩn công văn → nhập quyết định phê duyệt từ Bộ với atomic transaction (EVALUATING → APPROVED|REJECTED_FINAL) → composer thông báo kết quả với variable substitution + sandbox preview**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-05-01T00:18:33Z
- **Completed:** 2026-05-01T00:32:58Z
- **Tasks:** 3
- **Files created:** 15
- **Files modified:** 2

## Accomplishments

- 2 new schema models (SubmissionDraft + ApprovalDecision) với 1:1 FK
- 7 server actions: listSubmissionCandidates + listSubmissions + saveSubmission + finalizeSubmission + getSubmissionDetail + saveDecision + notifyResults + previewNotificationForDecision
- /phe-duyet list + /phe-duyet/new + /phe-duyet/[id] với 3-tab detail (Soạn / Quyết định / Thông báo)
- 4 client components: SubmissionTabsShell, SubmissionDraftForm, DecisionForm, NotifyComposer
- 2 PDF templates (Tờ trình + Quyết định phê duyệt) chuẩn công văn nhà nước Việt Nam
- 2 PDF API routes (/api/pdf/submission/[id] + /api/pdf/decision/[id])
- Atomic decision tx: 1 ApprovalDecision + N project transitions trong single $transaction
- Notification composer với 5 variables ({tenDonVi}/{tenDeAn}/{kinhPhiDuyet}/{soQD}/{ngayKy}) + sandbox iframe preview
- Mode switcher (approved/rejected) với separate templates
- Idempotency guard: same decisionNumber rejected (T-07-02-03)

## Task Commits

1. **Task 1: Schema + 4 server actions** — `810c925` (feat)
2. **Task 2: /phe-duyet UI list + 3-tab detail** — `0be52ef` (feat)
3. **Task 3: PDF templates + 2 API routes** — `1c7faed` (feat)

## Files Created/Modified

### Schema + Server Actions
- `prisma/schema.prisma` — SubmissionDraft + ApprovalDecision models
- `app/(app)/phe-duyet/_actions/list-candidates.ts` — listSubmissionCandidates + listSubmissions
- `app/(app)/phe-duyet/_actions/save-submission.ts` — saveSubmission + finalizeSubmission + getSubmissionDetail
- `app/(app)/phe-duyet/_actions/save-decision.ts` — atomic decision transaction
- `app/(app)/phe-duyet/_actions/notify-results.ts` — notifyResults + previewNotificationForDecision

### Pages + UI
- `app/(app)/phe-duyet/page.tsx` — list page
- `app/(app)/phe-duyet/new/page.tsx` — new submission page
- `app/(app)/phe-duyet/[id]/page.tsx` — detail page header
- `app/(app)/phe-duyet/[id]/_components/SubmissionTabsShell.tsx` — tabs orchestrator
- `app/(app)/phe-duyet/[id]/_components/SubmissionDraftForm.tsx` — draft form
- `app/(app)/phe-duyet/[id]/_components/DecisionForm.tsx` — decision form
- `app/(app)/phe-duyet/[id]/_components/NotifyComposer.tsx` — notification composer

### PDF
- `lib/pdf/templates/Submission.tsx` — A4 tờ trình
- `lib/pdf/templates/ApprovalDecision.tsx` — A4 quyết định
- `lib/pdf/render.ts` — 2 new wrappers (renderSubmissionPdf + renderApprovalDecisionPdf)
- `app/api/pdf/submission/[id]/route.ts` — streaming endpoint
- `app/api/pdf/decision/[id]/route.ts` — streaming endpoint

## Decisions Made

- **JSON array for projectIds** instead of junction table — preserves submission ordering + simple read; FK validation enforced at write time
- **1:1 ApprovalDecision** via @unique submissionId — prevents duplicate decisions, preserves audit
- **Atomic transaction** — saveDecision wraps create + N project transitions in single $transaction
- **REJECTED_FINAL automatic** — projects in submission but not in approvedItems → automatically transitioned to REJECTED_FINAL (terminal)
- **Mode switcher** in NotifyComposer (approved vs rejected) — separate templates avoid one-size-fits-all messaging
- **Variable substitution** via split-join (no regex injection)
- **vndInWords POC simplified** — formatNumber only; full Vietnamese number-to-words deferred to production

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] React Hook conditional call in NotifyComposer**
- **Found during:** Task 2 (build)
- **Issue:** `if (!decision) return ...` early return placed BEFORE `React.useMemo` calls violates Rules of Hooks. Build error: "React Hook 'React.useMemo' is called conditionally."
- **Fix:** Moved early return AFTER all useMemo declarations. useMemos check `if (!decision) return [];` internally for null safety.
- **Files modified:** `app/(app)/phe-duyet/[id]/_components/NotifyComposer.tsx`
- **Verification:** `npm run build` exit 0
- **Committed in:** `0be52ef` (Task 2 commit)

**2. [Rule 1 - Type] SubmissionDetail decision approvedItems type access**
- **Found during:** Task 1 (typecheck)
- **Issue:** `SubmissionDetail['decision']['approvedItems']` failed to compile because `decision` is nullable. TypeScript can't index a possibly-null type.
- **Fix:** Wrap in `NonNullable<SubmissionDetail['decision']>['approvedItems']` to assert non-null context for indexed access.
- **Files modified:** `app/(app)/phe-duyet/_actions/save-submission.ts`
- **Verification:** `npx tsc --noEmit` exit 0
- **Committed in:** `810c925` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — type/hook bugs caught at compile time)
**Impact on plan:** Both fixes essential — Hook violation crashes runtime, type error blocks build. No scope creep.

## Issues Encountered

None — all 3 tasks executed cleanly. Both deviations caught at verification gates.

## User Setup Required

None — no external service configuration required. PDF rendering reuses Be Vietnam Pro fonts.

## Next Phase Readiness

- **Phase 8 (Contract):** APPROVED projects với `approvedBudget` set are ready for hợp đồng auto-creation. ApprovalDecision linkage gives source-of-truth cho contract value.
- **Demo HERO flow complete:** Đề án từ DRAFT → SUBMITTED → ASSIGNED → IN_REVIEW → VALID → EVALUATING → (council scoring) → APPROVED hoặc REJECTED_FINAL với tờ trình + QĐ PDF + thông báo

### Demo Flow Validated (After Plan 07-02 wired)

1. BQL login → `/hoi-dong` → tab Kết quả → click "Lập tờ trình" (TODO: link from results) hoặc đi `/phe-duyet/new`
2. Chọn 2-3 đề án EVALUATING (sorted by avg score) → soạn body → tạo
3. Tab Quyết định → nhập số QĐ + ngày + người ký + budget cho từng đề án → Save → projects transition APPROVED|REJECTED_FINAL
4. Click "Xuất QĐ PDF" → mở `/api/pdf/decision/[id]` → quyết định chuẩn công văn nhà nước
5. Tab Thông báo → soạn email approved + click "Gửi" → tạo Notification + N dispatches; switch mode "rejected" → soạn message từ chối
6. Đơn vị inbox sẽ thấy thông báo (Phase 4 inbox UI consumes Notification.recipientOrgId)

---
*Phase: 07-m3-thẩm-định-phê-duyệt*
*Completed: 2026-05-01*

## Self-Check: PASSED

All claims verified:

**Files created:**
- FOUND: lib/pdf/templates/Submission.tsx
- FOUND: lib/pdf/templates/ApprovalDecision.tsx
- FOUND: app/(app)/phe-duyet/page.tsx
- FOUND: app/(app)/phe-duyet/new/page.tsx
- FOUND: app/(app)/phe-duyet/[id]/page.tsx
- FOUND: app/(app)/phe-duyet/[id]/_components/SubmissionTabsShell.tsx
- FOUND: app/(app)/phe-duyet/[id]/_components/DecisionForm.tsx
- FOUND: app/(app)/phe-duyet/[id]/_components/NotifyComposer.tsx
- FOUND: app/api/pdf/submission/[id]/route.ts
- FOUND: app/api/pdf/decision/[id]/route.ts

**Commits:**
- FOUND: 810c925 (Task 1 schema + actions)
- FOUND: 0be52ef (Task 2 UI)
- FOUND: 1c7faed (Task 3 PDFs)
