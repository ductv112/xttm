---
phase: 07-m3-thẩm-định-phê-duyệt
plan: 01
title: Hội đồng thẩm định + scoring side-by-side + báo cáo thẩm định PDF
wave: 1
autonomous: yes
depends_on: []
files_modified:
  - prisma/schema.prisma
  - lib/workflows/project.ts
  - lib/audit-types.ts
  - prisma/seed/councils.ts
  - prisma/seed.ts
  - app/(app)/hoi-dong/page.tsx
  - app/(app)/hoi-dong/_actions/list.ts
  - app/(app)/hoi-dong/_actions/create.ts
  - app/(app)/hoi-dong/_actions/manage-members.ts
  - app/(app)/hoi-dong/_actions/assign-projects.ts
  - app/(app)/hoi-dong/_actions/aggregate.ts
  - app/(app)/hoi-dong/_actions/lock.ts
  - app/(app)/hoi-dong/[id]/page.tsx
  - app/(app)/hoi-dong/[id]/_components/CouncilDetail.tsx
  - app/(app)/tham-dinh/page.tsx
  - app/(app)/tham-dinh/[projectId]/page.tsx
  - app/(app)/tham-dinh/[projectId]/_components/ScoringPanel.tsx
  - app/(app)/tham-dinh/[projectId]/_components/ProjectReadonlyPanel.tsx
  - app/(app)/tham-dinh/_actions/save-score.ts
  - app/(app)/tham-dinh/_actions/submit-score.ts
  - app/(app)/tham-dinh/_actions/decline-coi.ts
  - lib/pdf/templates/EvaluationReport.tsx
  - app/api/pdf/evaluation/[councilId]/route.ts
requirements: [COUNCIL-01, COUNCIL-02, COUNCIL-03, COUNCIL-04, COUNCIL-05, COUNCIL-06, COUNCIL-07, COUNCIL-08, COUNCIL-09, COUNCIL-10, COUNCIL-11, COUNCIL-12, COUNCIL-13, COUNCIL-14, COUNCIL-15, COUNCIL-16]
---

<objective>
Build hội đồng thẩm định module: BQL quản lý hội đồng + thành viên + phân công đề án, hội đồng thành viên chấm điểm side-by-side, BQL tổng hợp realtime + xuất báo cáo PDF.
</objective>

<threat_model>
- T-07-01-01 (high): Cross-COI access — entity-aware filter session.user.id has CouncilMember row for projectId
- T-07-01-02 (high): Score after lock — server validate council.lockStatus before save
- T-07-01-03 (medium): COI bypass — when COI checked, disable score saves
</threat_model>

<task n="1" id="07-01-01" type="schema-and-foundation">
<read_first>
- d:/Thaodnp/XTTM/prisma/schema.prisma (EvaluationCouncil, CouncilMember, ScoreSheet)
- d:/Thaodnp/XTTM/lib/workflows/project.ts
- d:/Thaodnp/XTTM/lib/audit-types.ts
</read_first>

<action>
1. Verify/Add to schema.prisma:
   - EvaluationCouncil: id, name, programCycleId (FK), term String, lockStatus enum ('OPEN','LOCKED'), createdAt, createdById
   - CouncilMember: id, councilId (FK), userId (FK), role enum ('CHU_TICH','PHO','UY_VIEN','THU_KY'), joinedAt
   - ProjectCouncilAssignment: id, councilId, projectId, assignedAt
   - ScoreSheet has councilId FK (for EVALUATION kind), conflictOfInterest field
2. Run prisma db push
3. Extend lib/workflows/project.ts:
   - Add transitions: VALID → EVALUATING (when assigned to council)
   - EVALUATING → APPROVED|REJECTED_FINAL (after quyết định)
4. Add audit types: COUNCIL_CREATE, COUNCIL_ADD_MEMBER, COUNCIL_REMOVE_MEMBER, COUNCIL_ASSIGN_PROJECT, COUNCIL_LOCK, EVALUATION_SAVE_SCORE, EVALUATION_SUBMIT_SCORE, EVALUATION_DECLINE_COI
5. npx tsc --noEmit + commit: `feat(07-01): council + scoresheet schema + workflow extension`
</action>

<acceptance_criteria>
- Schema verified, db pushed
- Workflow extended
- npx tsc --noEmit exit 0
</acceptance_criteria>

<done_when>Schema + workflow committed.</done_when>
</task>

<task n="2" id="07-01-02" type="bql-council-management">
<action>
Create `/hoi-dong` (BQL quản lý council):
1. `_actions/list.ts`: list councils for active cycle
2. `_actions/create.ts`: action createCouncil({ name, term }) — verify canFromDB('council', 'create'), create EvaluationCouncil with current programCycleId
3. `_actions/manage-members.ts`: actions addMember(councilId, userId, role), removeMember
4. `_actions/assign-projects.ts`: action assignProjects(councilId, projectIds[]) — verify projects status=VALID, transition VALID → EVALUATING, create ProjectCouncilAssignment
5. `_actions/aggregate.ts`: action getAggregateScores(councilId) — for each project assigned, average submitted ScoreSheets weighted, return ranking
6. `_actions/lock.ts`: action lockCouncil(councilId) — set lockStatus=LOCKED + audit
7. `page.tsx`: list of councils + "Tạo hội đồng mới" button
8. `[id]/page.tsx` + `_components/CouncilDetail.tsx`: tabs (Thành viên / Đề án phân công / Kết quả tổng hợp / Báo cáo) — table data + actions

Run npx tsc + npm run build. Commit batches:
- Batch A: schema + actions (list, create, manage-members)
- Batch B: assign-projects + aggregate + lock
- Batch C: page + detail UI

3 commits.
</action>

<acceptance_criteria>
- /hoi-dong + /hoi-dong/[id] routes work
- COUNCIL-01..05, COUNCIL-13, COUNCIL-15, COUNCIL-16 covered
- npm run build exit 0
</acceptance_criteria>

<done_when>3 commits, council management works.</done_when>
</task>

<task n="3" id="07-01-03" type="hoidong-scoring-route">
<action>
Create `/tham-dinh` (Hội đồng members chấm điểm):
1. `_actions/save-score.ts`: action saveScore(projectId, criteriaScores[], comments, conflictOfInterest) — verify session.user is CouncilMember of project, council not locked, find or create ScoreSheet (kind=EVALUATION, evaluatorId=session.user.id, councilId), update + status DRAFT
2. `_actions/submit-score.ts`: action submitScore(projectId) — set ScoreSheet.status=SUBMITTED, audit
3. `_actions/decline-coi.ts`: action declineCOI(projectId, reason) — mark conflictOfInterest=true, comments=reason, status=SUBMITTED with 0 score
4. `page.tsx`: list các đề án thành viên hội đồng được phân công (filter by user)
5. `[projectId]/page.tsx`: split-screen layout
6. `_components/ScoringPanel.tsx` (left, 50%): list criteria — for each: weight badge + slider 0-10 + textarea note. COI checkbox top. Total score calculator bottom. Save draft + Submit buttons. Disabled when ScoreSheet.status=SUBMITTED
7. `_components/ProjectReadonlyPanel.tsx` (right, 50%): tabs (Tổng quan / Kế hoạch / Dự toán / Tài liệu) — readonly project data

Run npx tsc + npm run build. Commit batches:
- Batch A: actions (save-score, submit-score, decline-coi)
- Batch B: page + scoring panel
- Batch C: readonly panel + integration

3 commits.
</action>

<acceptance_criteria>
- /tham-dinh + /tham-dinh/[projectId] work
- Side-by-side renders correctly
- COUNCIL-06..12 covered
- npm run build exit 0
</acceptance_criteria>

<done_when>3 commits, scoring works.</done_when>
</task>

<task n="4" id="07-01-04" type="evaluation-pdf">
<read_first>
- d:/Thaodnp/XTTM/lib/pdf/templates/OfficialDocument.tsx (pattern)
- d:/Thaodnp/XTTM/lib/pdf/templates/ProjectProposal.tsx (pattern)
</read_first>

<action>
1. Create `lib/pdf/templates/EvaluationReport.tsx`:
   - A4 portrait, header CHXHCNVN
   - Title "BÁO CÁO THẨM ĐỊNH ĐỀ ÁN XÚC TIẾN THƯƠNG MẠI QUỐC GIA"
   - Section I: Thông tin hội đồng (tên, kỳ, danh sách thành viên với chức vụ)
   - Section II: Danh sách đề án + điểm trung bình + xếp hạng + COI flags
   - Section III: Nhận xét tổng hợp từng đề án
   - Section IV: Kết luận và kiến nghị
   - Footer signature block (Chủ tịch hội đồng + Thư ký)
   - Watermark BẢN MẪU

2. Create `app/api/pdf/evaluation/[councilId]/route.ts`:
   - auth + canFromDB('council', 'view')
   - Get council + members + projects + aggregate scores
   - Render PDF buffer, return Content-Type application/pdf

3. Add export to lib/pdf/render.ts: renderEvaluationReportPdf(data)

4. Wire button "Xuất báo cáo" trên /hoi-dong/[id] tab Báo cáo

Commit: `feat(07-01): báo cáo thẩm định PDF chuẩn công văn`

5. Run npm run build exit 0
</action>

<acceptance_criteria>
- PDF endpoint works
- COUNCIL-14 covered
- npm run build exit 0
</acceptance_criteria>

<done_when>PDF route registered.</done_when>
</task>

<task n="5" id="07-01-05" type="seed-councils">
<action>
Create prisma/seed/councils.ts:
- 1 EvaluationCouncil for cycle 2026 với name "Hội đồng Thẩm định Chương trình XTTM Quốc gia 2026 — Kỳ 1"
- 3 CouncilMember (chu tịch, phó, ủy viên) — assign user `hoidong` as Chủ tịch, generate 2 mock users role=HOIDONG cho phó + ủy viên
- 2 ProjectCouncilAssignment với 2 projects status=VALID từ seed
- 1 ScoreSheet kind=EVALUATION, status=DRAFT (Chủ tịch đã chấm 1 đề án)
- 1 ScoreSheet kind=EVALUATION, status=SUBMITTED (1 đề án có 1 phiếu nộp)

Add seedCouncils to prisma/seed.ts.
Run db:seed.

Commit: `feat(07-01): seed 1 council + 3 members + 2 assignments + 2 scoresheets`
</action>

<acceptance_criteria>
- DB has 1 EvaluationCouncil + 3 CouncilMember + 2 assignments + 2 ScoreSheets
- npm run db:seed idempotent
</acceptance_criteria>

<done_when>Seed updated, mock data ready for demo.</done_when>
</task>

<verification>
npm run build exit 0. Update STATE.md, ROADMAP.md, REQUIREMENTS.md mark COUNCIL-01..16 complete.
</verification>
