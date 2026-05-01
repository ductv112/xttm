---
phase: 09-m5-báo-cáo-nghiệm-thu-tài-chính
plan: 01
title: Báo cáo + Nghiệm thu + Thanh lý + Tài chính (full module)
wave: 1
autonomous: yes
depends_on: []
requirements: [REPORT-01, REPORT-02, REPORT-03, REPORT-04, REPORT-05, REPORT-06, REPORT-07, ACCEPT-01, ACCEPT-02, ACCEPT-03, ACCEPT-04, ACCEPT-05, ACCEPT-06, FIN-01, FIN-02, FIN-03, FIN-04]
---

<objective>
Build Phase 9 module: Báo cáo kết quả + Nghiệm thu + Thanh lý + Tài chính (advance/payment/settlement). 17 requirements.
</objective>

<threat_model>
- T-09-01-01 (high): Cross-tenant — entity-aware filter
- T-09-01-02 (medium): Status manipulation — server-side state machine guards
- T-09-01-03 (medium): Financial amount tampering — Zod validate, audit log
</threat_model>

<task n="1" id="09-01-01" type="schema-and-actions">
<read_first>
- prisma/schema.prisma
- lib/workflows/project.ts
- lib/audit-types.ts
</read_first>

<action>
1. Verify schema:
   - Report: id, projectId, quantitativeJson (chỉ tiêu định lượng), qualitativeHtml, attendingCompaniesCount, status enum (DRAFT|SUBMITTED|APPROVED|RETURNED), submittedAt, reviewedById, reviewComments, createdAt
   - AcceptanceRecord: id, projectId, reportId, recordNumber, recordDate, result enum (PASS|PARTIAL|FAIL), comments, scannedFileAttachmentId, createdById
   - FinancialRecord: id, projectId, contractId, recordType enum (ADVANCE|PAYMENT|SETTLEMENT), amount, status enum (DRAFT|SUBMITTED|APPROVED|DISBURSED|SETTLED), submittedAt, approvedById, transactionDate, notes
2. prisma db push.
3. Audit types: REPORT_SUBMIT, REPORT_REVIEW, ACCEPT_CREATE, ACCEPT_UPLOAD_RECORD, FIN_CREATE_ADVANCE, FIN_CREATE_PAYMENT, FIN_CREATE_SETTLEMENT, FIN_TRANSITION
4. Server actions in:
   - app/(app)/de-an/[id]/_actions/report-actions.ts (saveReportDraft, submitReport, reviewReport, returnReport)
   - app/(app)/de-an/[id]/_actions/acceptance-actions.ts (createAcceptanceRecord, uploadScannedRecord, finalizeAcceptance)
   - app/(app)/tai-chinh/_actions/* (listFinancialRecords, createAdvance, createPayment, createSettlement, transitionFinancial)
5. Commit: `feat(09-01): schema + server actions cho báo cáo + nghiệm thu + tài chính`
</action>
</task>

<task n="2" id="09-01-02" type="report-and-acceptance-tabs">
<action>
Add 3 tabs trên /de-an/[id]: "Báo cáo" / "Nghiệm thu" / "Tài chính"

1. ReportTab.tsx: form chỉ tiêu định lượng (table input rows: tên chỉ tiêu, đơn vị, giá trị thực tế, ghi chú) + Tiptap qualitative + upload tài liệu/ảnh/Excel danh sách DN. Buttons "Lưu nháp" / "Nộp báo cáo". Disabled nếu status APPROVED.
2. AcceptanceTab.tsx: hiển thị status (chưa lập / đang lập / hoàn thành). Form lập biên bản (chỉ BQL): record number, date, result, comments. Button "Sinh biên bản PDF" → /api/pdf/acceptance/[id]. Upload bản ký scan.
3. FinanceTab.tsx (readonly summary cho đơn vị, có actions cho TAICHINH/BANQL): list 3 loại records, totals, status badges.

Lib pdf templates:
- AcceptanceRecord.tsx — biên bản nghiệm thu chuẩn công văn
- LiquidationRecord.tsx — biên bản thanh lý HĐ

Cảnh báo 15d: server-side check projects has events ended (timeRange.endDate < daysAgo(15)) AND no Report.status=SUBMITTED → flag warning trên dashboard đơn vị.

Commits:
- `feat(09-01): tab Báo cáo trên /de-an/[id]`
- `feat(09-01): tab Nghiệm thu + biên bản PDF`
- `feat(09-01): cảnh báo 15d nộp báo cáo`
</action>
</task>

<task n="3" id="09-01-03" type="finance-route">
<action>
Create /tai-chinh route for TAICHINH role:

1. /tai-chinh/page.tsx (RSC): list financial records với filters (project, type, status, date range)
2. /tai-chinh/[id]/page.tsx: detail view + transition actions
3. /tai-chinh/_components/FinancialRecordTable.tsx
4. /tai-chinh/_components/CreateAdvanceDialog.tsx (chọn project + amount + notes)
5. /tai-chinh/_components/CreatePaymentDialog.tsx
6. /tai-chinh/_components/CreateSettlementDialog.tsx
7. /tai-chinh/_components/TransitionDialog.tsx

Dashboard summary: tổng tạm ứng / thanh toán / quyết toán theo năm (Recharts simple bar chart).

Mock data update: 3 financial records với states khác nhau.

Commit: `feat(09-01): /tai-chinh route + 3 record types + transitions`
</action>
</task>

<task n="4" id="09-01-04" type="seed">
<action>
Update seed:
- 2 Reports (1 SUBMITTED, 1 APPROVED)
- 2 AcceptanceRecords (1 PASS đầy đủ, 1 PARTIAL)
- 3 FinancialRecords (1 ADVANCE DISBURSED, 1 PAYMENT APPROVED, 1 SETTLEMENT DRAFT)

Commit: `feat(09-01): seed reports + acceptance + finance records`
</action>
</task>

<verification>npm run build exit 0. Update STATE.md, ROADMAP.md, REQUIREMENTS.md mark 17 reqs complete.</verification>
