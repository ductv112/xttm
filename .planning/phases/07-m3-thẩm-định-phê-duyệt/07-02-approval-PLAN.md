---
phase: 07-m3-thẩm-định-phê-duyệt
plan: 02
title: Phê duyệt — tờ trình PDF + nhập quyết định + thông báo kết quả
wave: 2
autonomous: yes
depends_on: ['07-01']
files_modified:
  - prisma/schema.prisma
  - lib/audit-types.ts
  - lib/pdf/templates/Submission.tsx
  - lib/pdf/templates/ApprovalDecision.tsx
  - app/(app)/phe-duyet/page.tsx
  - app/(app)/phe-duyet/_actions/list-candidates.ts
  - app/(app)/phe-duyet/_actions/save-submission.ts
  - app/(app)/phe-duyet/_actions/save-decision.ts
  - app/(app)/phe-duyet/_actions/notify-results.ts
  - app/(app)/phe-duyet/[id]/page.tsx
  - app/(app)/phe-duyet/[id]/_components/SubmissionDraftForm.tsx
  - app/(app)/phe-duyet/[id]/_components/DecisionForm.tsx
  - app/(app)/phe-duyet/[id]/_components/NotifyComposer.tsx
  - app/api/pdf/submission/[id]/route.ts
  - app/api/pdf/decision/[id]/route.ts
requirements: [APPROVE-01, APPROVE-02, APPROVE-03, APPROVE-04, APPROVE-05, APPROVE-06, APPROVE-07, APPROVE-08]
---

<objective>
BQL: lập tờ trình phê duyệt → in PDF chuẩn công văn → nhập quyết định phê duyệt từ Bộ trả về (số QĐ, ngày ký, người ký, kinh phí được duyệt) → xuất QĐ PDF → composer thông báo kết quả gửi đơn vị chủ trì.
</objective>

<threat_model>
- T-07-02-01 (high): Phê duyệt > đăng ký không cảnh báo — UI shows red warning when approvedBudget > registeredBudget
- T-07-02-02 (high): RBAC bypass — only ADMIN/BANQL can save decision
- T-07-02-03 (medium): Idempotent submit — same decisionNumber rejected
</threat_model>

<task n="1" id="07-02-01" type="schema-and-actions">
<action>
1. Add to schema.prisma:
   - SubmissionDraft (tờ trình): id, programCycleId, councilId, projectIds Json[], contentHtml String, draftNumber String?, draftedAt, draftedById, status enum ('DRAFT','SUBMITTED_TO_BO')
   - ApprovalDecision: id, submissionId (FK), decisionNumber, decisionDate, signedByName, signedByTitle, approvedItems Json[] ({projectId, approvedBudget, comments}), totalApprovedBudget, createdAt, createdById
2. Run prisma db push
3. Audit types: SUBMISSION_CREATE, SUBMISSION_UPDATE, DECISION_SAVE, NOTIFY_RESULT
4. Create actions in /phe-duyet/_actions/:
   - list-candidates.ts: list projects status=EVALUATING from current cycle với điểm tổng hợp cao nhất ở top
   - save-submission.ts: action saveSubmission({programCycleId, councilId, projectIds, contentHtml, draftNumber}) — verify canFromDB('approval', 'create'), upsert SubmissionDraft
   - save-decision.ts: action saveDecision({submissionId, decisionNumber, decisionDate, signedBy, approvedItems[]}) — verify canFromDB, create ApprovalDecision, transition each project EVALUATING → APPROVED + set approvedBudget. Projects not in approvedItems → REJECTED_FINAL
   - notify-results.ts: action notifyResults(decisionId, emailTemplateContent) — for each approved/rejected project's organization, create Notification + NotificationDispatch (mock email)

Run npx tsc + commit batches.
</action>

<acceptance_criteria>
- Schema verified
- 4 actions exist with auth + audit
- npx tsc --noEmit exit 0
</acceptance_criteria>

<done_when>Schema + actions committed.</done_when>
</task>

<task n="2" id="07-02-02" type="approval-ui">
<action>
Create `/phe-duyet`:
1. page.tsx (RSC): list của tờ trình + actions "Lập tờ trình mới"
2. [id]/page.tsx: tabs (Soạn tờ trình / Quyết định phê duyệt / Thông báo kết quả)
3. _components/SubmissionDraftForm.tsx: form chọn projects (multi-select), Tiptap editor cho nội dung tờ trình (auto-fill template), draftNumber input, button "Xuất PDF tờ trình"
4. _components/DecisionForm.tsx: form số QĐ + ngày ký + người ký + chức vụ + table approvedItems (project + approvedBudget input + comments). Validation: approvedBudget <= registeredBudget (red warning if exceed). Button "Lưu quyết định" + "Xuất QĐ PDF"
5. _components/NotifyComposer.tsx: Tiptap với template biến {tenDonVi}, {tenDeAn}, {kinhPhiDuyet}, {soQD} — preview + send button (calls notifyResults)

Run npm run build. Commit batches.
</action>

<acceptance_criteria>
- /phe-duyet routes work
- All 3 tabs functional
- npm run build exit 0
</acceptance_criteria>

<done_when>3 commits.</done_when>
</task>

<task n="3" id="07-02-03" type="pdf-templates">
<action>
1. Create lib/pdf/templates/Submission.tsx — tờ trình A4 chuẩn công văn:
   - Header CHXHCNVN
   - Title "TỜ TRÌNH"
   - Subject: "V/v phê duyệt danh mục Đề án Xúc tiến Thương mại Quốc gia năm [year]"
   - Recipient: "Kính gửi: Bộ trưởng Bộ Công Thương"
   - Body: list đề án + tổng kinh phí + nhận xét
   - Footer: signature + Nơi nhận + Lưu VT
2. Create lib/pdf/templates/ApprovalDecision.tsx — quyết định phê duyệt A4:
   - Header CHXHCNVN
   - Title "QUYẾT ĐỊNH"
   - Subject: "V/v phê duyệt danh mục Đề án XTTM Quốc gia năm [year] và kinh phí thực hiện"
   - Body: căn cứ + các điều khoản + danh sách đề án phê duyệt + kinh phí
   - Footer: signature block (Bộ trưởng/người được ủy quyền)
3. API routes:
   - app/api/pdf/submission/[id]/route.ts
   - app/api/pdf/decision/[id]/route.ts
4. Add render functions in lib/pdf/render.ts

Commit: `feat(07-02): tờ trình + quyết định phê duyệt PDF chuẩn công văn`
</action>

<acceptance_criteria>
- 2 PDF templates exist
- 2 API routes work
- APPROVE-03, APPROVE-06 covered
- npm run build exit 0
</acceptance_criteria>

<done_when>PDFs work.</done_when>
</task>

<verification>
npm run build exit 0. Update STATE.md, ROADMAP.md, REQUIREMENTS.md mark APPROVE-01..08 complete. Phase 7 done — closes hero flow demo.
</verification>
