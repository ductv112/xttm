---
phase: 08-m4-hợp-đồng-triển-khai-điều-chỉnh
plan: 01
title: Hợp đồng + Triển khai + Điều chỉnh đề án (full module)
wave: 1
autonomous: yes
depends_on: []
requirements: [CONTRACT-01, CONTRACT-02, CONTRACT-03, CONTRACT-04, CONTRACT-05, CONTRACT-06, CONTRACT-07, IMPL-01, IMPL-02, IMPL-03, IMPL-04, IMPL-05, IMPL-06, IMPL-07, IMPL-08, IMPL-09, IMPL-10, IMPL-11, IMPL-12, AMEND-01, AMEND-02, AMEND-03, AMEND-04, AMEND-05, AMEND-06, AMEND-07]
---

<objective>
Build full Phase 8 module: Hợp đồng (auto số + upload + cảnh báo 60d), Triển khai (kế hoạch + tiến độ + cảnh báo thương vụ 30d), Điều chỉnh đề án (Điều 13 NĐ 28 với side-by-side diff).
</objective>

<threat_model>
- T-08-01-01 (high): Cross-tenant — entity-aware filter
- T-08-01-02 (medium): Auto số HĐ race — DB unique constraint + retry on collision
- T-08-01-03 (medium): "Trọng yếu" misclassify — hardcoded rule list theo Điều 13
</threat_model>

<task n="1" id="08-01-01" type="schema-and-workflow">
<read_first>
- prisma/schema.prisma
- lib/workflows/project.ts
- lib/audit-types.ts
</read_first>

<action>
1. Verify schema:
   - Contract: id, projectId, contractNumber (unique), signedDate, contractValue, scannedFileAttachmentId, status enum (DRAFT|SIGNED|IN_PROGRESS|COMPLETED|LIQUIDATED), termsHtml, createdAt, signedById
   - ImplementationPlan (or use Project.implementationJson Json): milestones, staff, schedule, contactedConsulate Boolean, consulateContactInfo Json
   - ProjectAmendment: id, projectId, amendmentType enum (TIME|LOCATION|UNIT_NAME|PROJECT_NAME|OBJECTIVE|CONTENT|BUDGET|MARKET|OTHER), isCritical Boolean (computed from type), oldValueJson, newValueJson, reason, status (PENDING|APPROVED|REJECTED|RESUBMIT_EVALUATION), reviewedById, decisionDate, createdAt
2. Run prisma db push
3. Extend lib/workflows/project.ts: APPROVED → IN_PROGRESS (when contract signed), IN_PROGRESS → COMPLETED (after báo cáo)
4. Create lib/amendment-rules.ts:
   ```
   export const AMENDMENT_TYPES = [...] as const;
   export const CRITICAL_TYPES = ['OBJECTIVE','CONTENT','BUDGET','MARKET'];
   export function isCriticalAmendment(type): boolean
   ```
5. Add audit types: CONTRACT_CREATE, CONTRACT_UPDATE, CONTRACT_UPLOAD, CONTRACT_LIQUIDATE, IMPL_UPDATE_PLAN, IMPL_UPDATE_PROGRESS, IMPL_CONTACT_CONSULATE, AMENDMENT_REQUEST, AMENDMENT_APPROVE, AMENDMENT_REJECT
6. npx tsc --noEmit exit 0
7. Commit: `feat(08-01): schema + workflow + amendment rules + audit types`
</action>
</task>

<task n="2" id="08-01-02" type="contract-module">
<action>
Create `/hop-dong` route + actions in `app/(app)/hop-dong/_actions/`:

1. `generate-number.ts`: action `generateContractNumber(year)` — atomic counter from Contract.contractNumber max + 1, format `XTTM/YYYY/NNN`
2. `create-from-project.ts`: action `createContractFromProject(projectId)` — auto-fill from approved project, assign new number
3. `update.ts`: edit terms, dates, value
4. `upload-scan.ts`: upload PDF scanned signed copy
5. `transition.ts`: status transitions
6. `list.ts`: filter by year, status, range

UI:
- /hop-dong page: DataTable với columns (số HĐ, đề án, đơn vị, ngày ký, value, status, action)
- /hop-dong/[id]/page.tsx: detail with tabs (Thông tin / File scan / Tiến độ implementation / Lịch sử)
- Cảnh báo 60d sau quyết định: red badge "Quá hạn ký HĐ X ngày" trên card

Server-side check: query approved projects WHERE Contract IS NULL AND approvedAt < daysAgo(60) → render warning.

Commit: `feat(08-01): /hop-dong CRUD + auto contract number + 60d warning`
</action>
</task>

<task n="3" id="08-01-03" type="implementation-tracking">
<action>
Add tab "Triển khai" trên /de-an/[id]:
1. Implementation plan form: milestones (table), staff (multi-select), schedule (date range)
2. Progress update: % per milestone, comment, attach evidence files
3. Simple horizontal timeline (build with CSS grid + flexbox, dùng các blocks chiều rộng theo % progress)
4. Cảnh báo thương vụ 30d cho đề án quốc tế (kind đoàn ra hoặc thị trường nước ngoài):
   - Server-side daily check: project events trong 30d tới + chưa contactedConsulate → flag warning
   - Banner "Cần liên hệ thương vụ ĐSQ ___ trước [date]"
   - Form xác nhận liên hệ với thông tin

Routes/files needed:
- /de-an/[id]/_components/ImplementationTab.tsx
- /de-an/[id]/_components/ImplementationTimeline.tsx
- /de-an/[id]/_components/ConsulateContactDialog.tsx
- /de-an/[id]/_actions/save-impl-plan.ts
- /de-an/[id]/_actions/update-progress.ts
- /de-an/[id]/_actions/confirm-consulate.ts

Mock data: update 1-2 projects with implementation in-progress + 1 international project chưa liên hệ thương vụ (sự kiện trong 25d).

Commit: `feat(08-01): triển khai tab + timeline + cảnh báo thương vụ 30d`
</action>
</task>

<task n="4" id="08-01-04" type="amendment-module">
<action>
Create `/dieu-chinh` route + ProjectAmendment workflow:

1. Đơn vị (donvi role) tạo amendment request từ trang /de-an/[id] → button "Đề nghị điều chỉnh"
2. Form select amendmentType → system tự suy luận isCritical → show banner:
   - Nhỏ: "Loại điều chỉnh nhỏ — BQL sẽ phê duyệt nội bộ"
   - Trọng yếu: "Loại điều chỉnh TRỌNG YẾU theo Điều 13 NĐ 28 — yêu cầu thẩm định lại"
3. Form fields old (auto-fill từ project) + new (input) + lý do (textarea, min 50 chars)
4. /dieu-chinh page (BQL): list pending amendments với side-by-side diff view (Old | New với highlight changes), actions:
   - Loại nhỏ: "Phê duyệt" → tạo quyết định điều chỉnh PDF + apply changes to Project
   - Loại trọng yếu: "Chuyển thẩm định lại" → status = RESUBMIT_EVALUATION, project quay về EVALUATING
5. PDF template `lib/pdf/templates/AmendmentDecision.tsx` — quyết định điều chỉnh chuẩn công văn

Routes/files:
- /dieu-chinh/page.tsx
- /dieu-chinh/[id]/page.tsx
- /dieu-chinh/_actions/create.ts
- /dieu-chinh/_actions/approve.ts
- /dieu-chinh/_actions/reject.ts
- /dieu-chinh/_actions/route-to-evaluation.ts
- /dieu-chinh/_components/AmendmentForm.tsx
- /dieu-chinh/_components/SideBySideDiff.tsx
- /dieu-chinh/_components/AmendmentDetailCard.tsx
- lib/pdf/templates/AmendmentDecision.tsx
- app/api/pdf/amendment/[id]/route.ts

Mock data: 2 amendments (1 nhỏ approved, 1 trọng yếu pending).

Commit: `feat(08-01): điều chỉnh đề án + side-by-side diff + quyết định điều chỉnh PDF`
</action>
</task>

<task n="5" id="08-01-05" type="seed-update">
<action>
Update prisma/seed: add Contract records, ImplementationPlan data, ProjectAmendment records.

Commit: `feat(08-01): seed contracts + impl + amendments`
</action>
</task>

<verification>npm run build exit 0. Update STATE.md, ROADMAP.md, REQUIREMENTS.md mark 26 reqs complete.</verification>
