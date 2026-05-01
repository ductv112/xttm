---
phase: 09-m5-báo-cáo-nghiệm-thu-tài-chính
plan: 01
subsystem: M5 Báo cáo + Nghiệm thu + Tài chính
tags: [report, acceptance, liquidation, finance, advance, payment, settlement, pdf, sla]
requires:
  - Phase 5 (Project model + state machine)
  - Phase 8 (Contract model + LIQUIDATED state)
  - lib/audit.ts + lib/permissions-db.ts
  - lib/system-config.ts (SLA params)
provides:
  - Report module với state machine DRAFT/SUBMITTED/APPROVED/RETURNED
  - AcceptanceRecord 1:1 với Report (PASS/PARTIAL/FAIL) + liquidation
  - FinancialRecord state machine DRAFT→SUBMITTED→APPROVED→DISBURSED→SETTLED cho 3 loại ADVANCE/PAYMENT/SETTLEMENT
  - 2 PDF templates (AcceptanceRecord + LiquidationRecord)
  - /tai-chinh route cho TAICHINH role + summary chart
  - SLA 15-day overdue report warning
affects:
  - app/(app)/de-an/[id]/page.tsx — load report + acceptance + financial + SLA warning
  - app/(app)/de-an/[id]/_components/ProjectTabsShell.tsx — 3 new tabs (Báo cáo / Nghiệm thu / Tài chính)
  - prisma/schema.prisma — Report extended + AcceptanceRecord + FinancialRecord models
  - prisma/seed.ts — verify Phase 9 counts
tech-stack:
  added:
    - "@react-pdf/renderer (existing) + 2 new templates"
  patterns:
    - State machine + transition table (theo pattern Phase 7/8)
    - 1:1 Report ↔ AcceptanceRecord (reportId @unique)
    - Financial state machine 5 states linear forward
    - SLA threshold consume từ system-config với fallback
key-files:
  created:
    - lib/workflows/report.ts
    - lib/workflows/acceptance.ts
    - lib/workflows/financial.ts
    - lib/report-sla.ts
    - lib/pdf/templates/AcceptanceRecord.tsx
    - lib/pdf/templates/LiquidationRecord.tsx
    - app/(app)/de-an/[id]/_actions/report-actions.ts
    - app/(app)/de-an/[id]/_actions/acceptance-actions.ts
    - app/(app)/de-an/[id]/_components/BaoCaoTab.tsx
    - app/(app)/de-an/[id]/_components/NghiemThuTab.tsx
    - app/(app)/de-an/[id]/_components/TaiChinhTab.tsx
    - app/(app)/tai-chinh/page.tsx
    - app/(app)/tai-chinh/[id]/page.tsx
    - app/(app)/tai-chinh/_actions/list.ts
    - app/(app)/tai-chinh/_actions/create.ts
    - app/(app)/tai-chinh/_actions/transition.ts
    - app/(app)/tai-chinh/_components/FinancialRecordTable.tsx
    - app/(app)/tai-chinh/_components/CreateRecordDialogs.tsx
    - app/(app)/tai-chinh/_components/TransitionActions.tsx
    - app/(app)/tai-chinh/_components/FinanceSummaryChart.tsx
    - app/api/pdf/acceptance/[id]/route.ts
    - app/api/pdf/liquidation/[id]/route.ts
    - prisma/seed/reports-acceptance-finance.ts
  modified:
    - prisma/schema.prisma
    - lib/audit-types.ts
    - lib/workflows/report.ts
    - lib/pdf/render.ts
    - app/(app)/de-an/[id]/page.tsx
    - app/(app)/de-an/[id]/_components/ProjectTabsShell.tsx
    - prisma/seed.ts
decisions:
  - 1:1 Report ↔ AcceptanceRecord (reportId @unique) thay vì N:1 cho prototype rõ ràng
  - Financial 5-state machine linear (no rollback after APPROVED → simplifies POC)
  - PDF inline-mode default (download=1 query để force attachment)
  - SLA 15-day check tính theo plannedEndAt field thay vì derive từ generalInfoJson.timeRange (đơn giản hơn cho POC)
  - Project state transitions IN_PROGRESS → COMPLETED khi finalizeAcceptance, contract → LIQUIDATED khi liquidateContract
metrics:
  duration: 19m
  completed: 2026-05-01
  tasks: 4
  files_created: 22
  files_modified: 7
---

# Phase 09 Plan 01: Báo cáo + Nghiệm thu + Tài chính Summary

POC-grade module M5 đóng vòng đời đề án — đơn vị nộp báo cáo kết quả → BQL nghiệm thu + thanh lý HĐ → Tài chính giải ngân advance/payment/settlement với state machine + PDF biên bản nhà nước.

## Functional Coverage

### Báo cáo kết quả (REPORT-01..07)

| ID | Yêu cầu | Trạng thái |
|----|---------|------------|
| REPORT-01 | Đơn vị tạo báo cáo kết quả từ tab "Báo cáo" | ✓ BaoCaoTab.tsx + saveReportDraft action |
| REPORT-02 | Form chỉ tiêu định lượng (Number inputs) | ✓ table inputs với 4 chỉ tiêu mặc định |
| REPORT-03 | Đánh giá định tính bằng Tiptap | ✓ RichTextEditor wired |
| REPORT-04 | Upload tài liệu/hình ảnh/Excel | ✓ documents list reuse từ tab Tài liệu (POC) |
| REPORT-05 | Submit → SUBMITTED → BQL review | ✓ submitReport + reviewReport actions |
| REPORT-06 | BQL có thể trả bổ sung với góp ý | ✓ returnReport action với comments min 10 char |
| REPORT-07 | Cảnh báo 15 ngày sau hoạt động chưa nộp | ✓ lib/report-sla.ts + warning banner |

### Nghiệm thu & Thanh lý (ACCEPT-01..06)

| ID | Yêu cầu | Trạng thái |
|----|---------|------------|
| ACCEPT-01 | Tab "Nghiệm thu" trên /de-an/[id] | ✓ NghiemThuTab.tsx |
| ACCEPT-02 | BQL tạo hồ sơ nghiệm thu sau APPROVED | ✓ createAcceptanceRecord (gates report.status === 'APPROVED') |
| ACCEPT-03 | Sinh biên bản nghiệm thu PDF chuẩn công văn | ✓ AcceptanceRecord.tsx + /api/pdf/acceptance/[id] |
| ACCEPT-04 | Cập nhật kết quả PASS/PARTIAL/FAIL + ghi chú | ✓ form 3-option Select + comments textarea |
| ACCEPT-05 | Upload bản scan đã ký | ✓ uploadScannedRecord (mock URL trong POC) |
| ACCEPT-06 | Sau nghiệm thu: thanh lý HĐ → CLOSED | ✓ finalizeAcceptance + liquidateContract + LiquidationRecord PDF |

### Tài chính (FIN-01..04)

| ID | Yêu cầu | Trạng thái |
|----|---------|------------|
| FIN-01 | /tai-chinh route cho TAICHINH role | ✓ page.tsx + RBAC qua canFromDB |
| FIN-02 | Hồ sơ tạm ứng/thanh toán/quyết toán | ✓ 3 record types với guards riêng |
| FIN-03 | State machine DRAFT→SUBMITTED→APPROVED→DISBURSED→SETTLED | ✓ transitionFinancial + ALLOWED_FINANCIAL_NEXT |
| FIN-04 | Tab "Tài chính" trên /de-an/[id] tóm tắt | ✓ TaiChinhTab.tsx — 4 summary cards + records list |

## Decisions Made

1. **1:1 Report ↔ AcceptanceRecord**. Đơn giản hóa cho POC: mỗi báo cáo APPROVED → 1 biên bản nghiệm thu. Schema enforce qua `reportId @unique`. Production có thể cần N:1 nếu nhiều biên bản (nghiệm thu giai đoạn).

2. **Financial state machine linear (5 states forward, 1 rollback DRAFT)**. Không có rollback từ APPROVED/DISBURSED để đơn giản hóa demo. Nếu cần điều chỉnh giá trị sau DISBURSED, tạo record bù mới.

3. **PDF templates inline default + download=1 query**. Reuse pattern từ Phase 7-8.

4. **SLA 15-day check qua plannedEndAt**. Không parse generalInfoJson.timeRange.end vì plannedEndAt được populate khi đề án phê duyệt. Đơn giản hơn cho POC.

5. **finalizeAcceptance + liquidateContract là 2 bước**. finalizeAcceptance → project COMPLETED. liquidateContract → contract LIQUIDATED + acceptance.liquidationDate set. Hai bước tách biệt cho phép lập biên bản nghiệm thu trước khi quyết toán xong.

6. **Mock attachments**. Upload bản scan dùng `/mock-files/hop-dong-mau.pdf` cố định (POC scope). Production cần file storage thật.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Phase 8 contract verification fails after Phase 9 transitions**
- **Found during:** Task 4 (seed run)
- **Issue:** `seedContractsAndAmendments` expects ≥3 contracts in DRAFT/SIGNED/IN_PROGRESS but Phase 9 transitions one to LIQUIDATED, breaking the count
- **Fix:** Updated verification in `prisma/seed.ts` to allow LIQUIDATED status in the count
- **Files modified:** prisma/seed.ts
- **Commit:** ad42797

**2. [Rule 1 - Bug] Type narrowing for recordNumber after string trim**
- **Found during:** Task 1 typecheck
- **Issue:** `let recordNumber = input.recordNumber?.trim()` typed as `string | undefined` but later assigned in `if`-block, TS doesn't narrow at use site
- **Fix:** Explicit `let recordNumber: string = input.recordNumber?.trim() ?? ''`
- **Files modified:** app/(app)/de-an/[id]/_actions/acceptance-actions.ts
- **Commit:** 17b9bdf

**3. [Rule 1 - Bug] Recharts Tooltip formatter type mismatch**
- **Found during:** Task 3 typecheck
- **Issue:** Recharts v2+ Tooltip formatter expects ValueType (broader than number)
- **Fix:** Use generic `(value)` and cast result with `as string`
- **Files modified:** app/(app)/tai-chinh/_components/FinanceSummaryChart.tsx
- **Commit:** 1266a00

**4. [Rule 2 - Critical] Build errors from unescaped quotes + unused vars**
- **Found during:** Task 4 (npm run build)
- **Issue:** Next.js eslint blocks build on react/no-unescaped-entities + @typescript-eslint/no-unused-vars errors
- **Fix:** Use `&ldquo;`/`&rdquo;`, remove unused `setReport`/`isOwner` (rename to `_isOwner`), remove dead `report2Id` variable
- **Files modified:** BaoCaoTab.tsx, NghiemThuTab.tsx, reports-acceptance-finance.ts
- **Commit:** ad42797

## Verification

- TypeScript pass: `npx tsc --noEmit` → no errors
- Build pass: `npm run build` → exit 0, /tai-chinh + /tai-chinh/[id] routes generated
- Seed pass: `npm run db:seed` → 3 reports + 2 acceptance + 3 financial records
- All 17 requirements covered (REPORT-01..07 + ACCEPT-01..06 + FIN-01..04)

## Commits

- 17b9bdf: schema + server actions
- 5d070e4: tab Báo cáo
- d5944d0: tab Nghiệm thu + Tài chính summary + 2 PDF templates
- 1266a00: /tai-chinh route + transitions + chart
- ad42797: seed + lint fixes

## Self-Check: PASSED

- ✓ All 22 created files exist on disk
- ✓ All 5 commits exist in git log
- ✓ npm run build exits 0
- ✓ npm run db:seed succeeds with verification thresholds met
