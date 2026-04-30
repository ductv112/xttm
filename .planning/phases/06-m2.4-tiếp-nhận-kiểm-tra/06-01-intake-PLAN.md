---
phase: 06-m2.4-tiếp-nhận-kiểm-tra
plan: 01
title: Tiếp nhận, phân công, kiểm tra checklist, chấm điểm sơ bộ — full module
wave: 1
autonomous: yes
depends_on: []
files_modified:
  - lib/workflows/project.ts
  - lib/audit-types.ts
  - lib/intake-checklist.ts
  - prisma/schema.prisma
  - app/(app)/tiep-nhan/page.tsx
  - app/(app)/tiep-nhan/_actions/list.ts
  - app/(app)/tiep-nhan/_actions/receive.ts
  - app/(app)/tiep-nhan/_components/IntakeTable.tsx
  - app/(app)/phan-cong/page.tsx
  - app/(app)/phan-cong/_actions/assign.ts
  - app/(app)/phan-cong/_actions/unassign.ts
  - app/(app)/phan-cong/_actions/list-staff.ts
  - app/(app)/phan-cong/_components/AssignmentBoard.tsx
  - app/(app)/kiem-tra/page.tsx
  - app/(app)/kiem-tra/[id]/page.tsx
  - app/(app)/kiem-tra/_actions/list-mine.ts
  - app/(app)/kiem-tra/_actions/save-checklist.ts
  - app/(app)/kiem-tra/_actions/request-supplement.ts
  - app/(app)/kiem-tra/_actions/mark-valid.ts
  - app/(app)/kiem-tra/[id]/_components/ChecklistForm.tsx
  - app/(app)/kiem-tra/[id]/_components/SupplementRequestDialog.tsx
  - app/(app)/cham-diem-so-bo/page.tsx
  - app/(app)/cham-diem-so-bo/[id]/page.tsx
  - app/(app)/cham-diem-so-bo/_actions/list-valid.ts
  - app/(app)/cham-diem-so-bo/_actions/save-score.ts
  - app/(app)/cham-diem-so-bo/_actions/finalize-score.ts
  - prisma/seed/projects.ts
requirements: [INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05, INTAKE-06, INTAKE-07, INTAKE-08, INTAKE-09, INTAKE-10, INTAKE-11, INTAKE-12, INTAKE-13]
---

<objective>
Build complete Phase 6 module in single plan: workflow extension + 3 routes (tiếp nhận / phân công / kiểm tra) + chấm điểm sơ bộ. 13 INTAKE-* requirements.
</objective>

<threat_model>
- T-06-01-01 (high): Chuyên viên access hồ sơ không được giao — entity-aware filter session.user.id === project.assignedToUserId OR has permission view-all
- T-06-01-02 (medium): Bypass checklist (mark valid without items checked) — server validates min 80% items checked
- T-06-01-03 (medium): Self-assign — guard via canFromDB('intake', 'assign')
</threat_model>

<task n="1" id="06-01-01" type="schema-workflow-checklist">
<read_first>
- d:/Thaodnp/XTTM/lib/workflows/project.ts (need to extend with INTAKE statuses)
- d:/Thaodnp/XTTM/prisma/schema.prisma (verify ScoreSheet model fields)
- d:/Thaodnp/XTTM/lib/audit-types.ts
</read_first>

<action>
1. Verify ScoreSheet model: id, projectId (FK), kind ('PRELIMINARY' | 'EVALUATION'), evaluatorId (FK User), criteriaScores Json[] (criterionId, score, weight, note), totalScore Float, comments String?, status ('DRAFT' | 'SUBMITTED'), conflictOfInterest Boolean default false, submittedAt, createdAt. ADD if missing.
2. Add to Project model if missing: passedFormalCheck Boolean default false, formalRejectionReason String?
3. Run prisma db push.
4. Extend lib/workflows/project.ts:
   - Add INTAKE statuses to enum: ASSIGNED, IN_REVIEW, SUPPLEMENT_REQUIRED, RESUBMITTED, VALID, REJECTED_FORMAL
   - Update TRANSITIONS map: SUBMITTED → ASSIGNED, ASSIGNED → IN_REVIEW, IN_REVIEW → SUPPLEMENT_REQUIRED|VALID|REJECTED_FORMAL, SUPPLEMENT_REQUIRED → RESUBMITTED (via đơn vị edit + nộp lại), RESUBMITTED → IN_REVIEW (chuyên viên xem lại)
5. Create `lib/intake-checklist.ts`:
   - Export const CHECKLIST_ITEMS array of 12 items, each { id, label, description, required }
   - Items example: "Đề án có chữ ký + dấu mộc của người đại diện hợp pháp", "Dự toán kinh phí khớp với kế hoạch", "Tài liệu năng lực hoạt động đính kèm đầy đủ", "Mục tiêu và nội dung rõ ràng, có chỉ tiêu đo lường", "Chủ nhiệm đề án có thông tin đầy đủ", ...
6. Add audit types: INTAKE_RECEIVE, INTAKE_ASSIGN, INTAKE_UNASSIGN, INTAKE_REASSIGN, INTAKE_CHECKLIST_SAVE, INTAKE_REQUEST_SUPPLEMENT, INTAKE_MARK_VALID, INTAKE_SCORE_SAVE
7. npx tsc --noEmit exit 0
8. Commit: `feat(06-01): extend workflow + checklist constants + audit types`
</action>

<acceptance_criteria>
- lib/workflows/project.ts has new INTAKE statuses
- lib/intake-checklist.ts exists with CHECKLIST_ITEMS array (≥12 items)
- ScoreSheet model verified
- npx tsc --noEmit exit 0
</acceptance_criteria>

<done_when>Foundation extended, committed.</done_when>
</task>

<task n="2" id="06-01-02" type="route-tiep-nhan">
<read_first>
- d:/Thaodnp/XTTM/lib/workflows/project.ts
- d:/Thaodnp/XTTM/app/(app)/de-an/_actions/list-mine.ts (similar pattern)
- d:/Thaodnp/XTTM/components/shared/data-table/DataTable.tsx
</read_first>

<action>
Create `/tiep-nhan` (BQL nhận hồ sơ + danh sách hồ sơ chờ):
1. `_actions/list.ts`: action `listSubmittedProjects(filter)` — verify canFromDB('intake', 'view'), filter status SUBMITTED, search by org + kind + ngày nộp range
2. `_actions/receive.ts`: action `receiveProject(projectId)` — verify canFromDB('intake', 'receive'), transition SUBMITTED → ASSIGNED + assignedAt + assignedById, audit
3. `page.tsx` (RSC): auth + canFromDB check, list submittedProjects, render DataTable with bulk select + button "Tiếp nhận hồ sơ" (bulk action)
4. `_components/IntakeTable.tsx`: DataTable with columns (đơn vị, tên đề án, kind, ngày nộp, action button "Tiếp nhận")

Commit: `feat(06-01): /tiep-nhan BQL nhận hồ sơ`
</action>

<acceptance_criteria>
- /tiep-nhan route renders
- npm run build exit 0
- INTAKE-01, INTAKE-02 covered
</acceptance_criteria>

<done_when>Tiếp nhận route works.</done_when>
</task>

<task n="3" id="06-01-03" type="route-phan-cong">
<action>
Create `/phan-cong` (LĐ BQL phân công):
1. `_actions/list-staff.ts`: action `listStaffWithLoad()` — list users role=CHUYENVIEN with current count of assigned projects
2. `_actions/assign.ts`: action `assignProject(projectId, staffUserId)` — verify canFromDB('intake', 'assign'), update Project.assignedToUserId, transition ASSIGNED → IN_REVIEW, audit
3. `_actions/unassign.ts`: action `unassignProject(projectId)` — clear assignedToUserId + transition IN_REVIEW → ASSIGNED, audit
4. `page.tsx` (RSC): auth + canFromDB('intake', 'assign'), list ASSIGNED projects + chuyên viên list
5. `_components/AssignmentBoard.tsx` (client): hai cột — left "Hồ sơ chờ phân công" (cards drag), right "Chuyên viên" (drop zones với current load count). Use HTML5 native drag-drop. Click row alternative để mở Select dialog cho mobile.

Commit: `feat(06-01): /phan-cong drag-drop assignment board`
</action>

<acceptance_criteria>
- /phan-cong route works
- Drag-drop functions
- INTAKE-03, INTAKE-04, INTAKE-05 covered
</acceptance_criteria>

<done_when>Phân công works.</done_when>
</task>

<task n="4" id="06-01-04" type="route-kiem-tra">
<action>
Create `/kiem-tra` (Chuyên viên kiểm tra hồ sơ):
1. `_actions/list-mine.ts`: action `listMyAssignedProjects()` — filter session.user.id === assignedToUserId
2. `_actions/save-checklist.ts`: action `saveChecklist(projectId, items[])` — items = array of { itemId, status: '✓'|'✗'|'N/A', note }, save to Project.checklistJson Json field (add to schema if missing). Don't change project status.
3. `_actions/request-supplement.ts`: action `requestSupplement(projectId, reason)` — Zod min 20 chars, transition IN_REVIEW → SUPPLEMENT_REQUIRED, store reason, audit, mock notification to đơn vị
4. `_actions/mark-valid.ts`: action `markValid(projectId)` — verify ≥80% checklist items checked (not N/A), transition → VALID + passedFormalCheck=true, audit
5. `page.tsx`: list của mình
6. `[id]/page.tsx`: detail page với readonly project info on left, checklist form + action buttons trên right
7. `_components/ChecklistForm.tsx`: form với 12 items checkbox group (✓/✗/N/A radio per item) + textarea note per item, autosave 1s debounce
8. `_components/SupplementRequestDialog.tsx`: dialog với textarea reason + button "Gửi yêu cầu bổ sung"

Commits:
- `feat(06-01): /kiem-tra list + detail page + checklist form`
- `feat(06-01): request supplement + mark valid actions`
</action>

<acceptance_criteria>
- /kiem-tra and /kiem-tra/[id] routes work
- Checklist form saves
- INTAKE-06, INTAKE-07, INTAKE-08, INTAKE-09, INTAKE-10 covered
</acceptance_criteria>

<done_when>Kiểm tra works.</done_when>
</task>

<task n="5" id="06-01-05" type="cham-diem-so-bo">
<action>
Create `/cham-diem-so-bo`:
1. `_actions/list-valid.ts`: list projects status=VALID assigned to me (chuyên viên)
2. `_actions/save-score.ts`: action `saveScore(projectId, criterionScores[])` — find or create ScoreSheet (kind=PRELIMINARY, evaluatorId=session.user.id), update criteriaScores JSON, calculate totalScore using weights from criteria, save status=DRAFT
3. `_actions/finalize-score.ts`: action `finalizeScore(projectId)` — set ScoreSheet.status=SUBMITTED, audit
4. `page.tsx`: list các hồ sơ VALID
5. `[id]/page.tsx`: form chấm điểm với list tiêu chí từ ScoringCriterion catalog, mỗi tiêu chí có input số điểm (slider 0-10) + textarea note, total auto-calc, save draft button + finalize button

Commit: `feat(06-01): chấm điểm sơ bộ form + actions`
</action>

<acceptance_criteria>
- /cham-diem-so-bo route works
- ScoreSheet rows created
- INTAKE-11, INTAKE-12, INTAKE-13 covered
</acceptance_criteria>

<done_when>Chấm điểm works, all 13 INTAKE reqs covered.</done_when>
</task>

<task n="6" id="06-01-06" type="seed-update">
<action>
Update prisma/seed/projects.ts to set some seeded projects to varied INTAKE states for demo:
- VITAS 2026 đề án triển lãm: status=IN_REVIEW, assignedToUserId=chuyenvien user, partial checklist saved
- LEFASO 2026 đề án mới: status=VALID, passedFormalCheck=true, with PRELIMINARY ScoreSheet draft
- Add 1 new project status=SUBMITTED to demo "tiếp nhận" workflow
Run db:seed.

Commit: `feat(06-01): update seed for INTAKE workflow demo states`
</action>

<acceptance_criteria>
- DB has projects in ASSIGNED, IN_REVIEW, VALID states
- Some have ScoreSheet records
- npx tsc --noEmit + npm run build exit 0
</acceptance_criteria>

<done_when>Seed updated, all builds clean.</done_when>
</task>

<verification>
npm run build exit 0. SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md (mark INTAKE-01..13 complete). Phase 6 done.
</verification>
