---
phase: 08-m4-hợp-đồng-triển-khai-điều-chỉnh
plan: 01
subsystem: contract-implementation-amendment
tags: [contracts, implementation, amendments, sla-warnings, side-by-side-diff, pdf, prototype]
provides:
  - Quản lý hợp đồng /hop-dong với auto contract number XTTM/YYYY/NNN, status workflow DRAFT→SIGNED→IN_PROGRESS→COMPLETED→LIQUIDATED, upload bản scan
  - Cảnh báo SLA 60 ngày sau quyết định phê duyệt mà chưa ký HĐ + danh sách đề án sẵn sàng ký
  - Tab Triển khai trên /de-an/[id] với mốc công việc, nhân sự, lịch trình, simple horizontal timeline
  - Cảnh báo Thương vụ ĐSQ 30d cho đề án quốc tế + ConsulateContactDialog xác nhận
  - Module điều chỉnh đề án /dieu-chinh theo Điều 13 NĐ 28/2018/NĐ-CP với auto-classify TRỌNG YẾU/NHỎ
  - Side-by-side diff view (CSS grid 2-col + inline highlight, không pull react-diff-view)
  - PDF quyết định điều chỉnh (AmendmentDecision template) + /api/pdf/amendment/[id]
  - Workflow integration: loại nhỏ → BQL approve → sinh QĐ XTTM-DC/YYYY/NNN + apply changes; loại trọng yếu → status RESUBMIT_EVALUATION + project trở về EVALUATING
affects: [phase-09-bao-cao-nghiem-thu, phase-10-tai-chinh, phase-11-dashboard]
tech-stack:
  added: []
  patterns:
    - JSON-backed columns (Project.implementationJson, consulateContactJson)
    - Atomic running counter cho contract number với retry on collision
    - Pure types/parsers extract sang lib/ để bypass Next.js 'use server' async-only constraint
    - Auto-classify isCritical từ amendmentType server-side (UI không expose checkbox để tránh user evaluate sai)
    - Status state machine guard cho Contract transitions
key-files:
  created:
    - prisma/schema.prisma (Contract extended, ProjectAmendment new, Project.implementationJson + consulate fields)
    - lib/amendment-rules.ts
    - lib/implementation.ts
    - app/(app)/hop-dong/* (page + [id] + 6 actions + 4 components)
    - app/(app)/dieu-chinh/* (page + [id] + 4 actions + 3 components)
    - app/(app)/de-an/[id]/_actions/save-impl-plan.ts
    - app/(app)/de-an/[id]/_actions/confirm-consulate.ts
    - app/(app)/de-an/[id]/_components/ImplementationTab.tsx
    - app/(app)/de-an/[id]/_components/ImplementationTimeline.tsx
    - app/(app)/de-an/[id]/_components/ConsulateContactDialog.tsx
    - app/(app)/de-an/[id]/_components/AmendmentTab.tsx
    - lib/pdf/templates/AmendmentDecision.tsx
    - app/api/pdf/amendment/[id]/route.ts
    - prisma/seed/contracts-and-amendments.ts
    - public/mock-files/hop-dong-mau.pdf
  modified:
    - lib/audit-types.ts (CONTRACT_AUDIT_TYPES + IMPL_AUDIT_TYPES + AMENDMENT_AUDIT_TYPES)
    - lib/pdf/render.ts (renderAmendmentDecisionPdf)
    - app/(app)/de-an/[id]/_components/ProjectTabsShell.tsx (2 new tabs)
    - app/(app)/de-an/[id]/page.tsx (load amendments + RBAC checks)
    - app/(app)/de-an/_actions/get-detail.ts (impl + consulate + contract fields)
    - prisma/seed.ts (wire seedContractsAndAmendments + verify counts)
key-decisions:
  - "Contract number atomic counter: read max sequence per year prefix + retry on collision (mock POC pattern; production sẽ dùng DB sequence)"
  - "Side-by-side diff KHÔNG pull react-diff-view library — build với CSS grid 2-col + inline highlight (line-through red / green badge) per user instruction"
  - "isCritical hardcoded list theo Điều 13 NĐ 28: OBJECTIVE/CONTENT/BUDGET/MARKET = trọng yếu (4); TIME/LOCATION/UNIT_NAME/PROJECT_NAME/OTHER = nhỏ (5)"
  - "Server actions can only export async — extracted ImplementationData/ImplementationMilestone/parseImplementationJson/parseConsulateContactJson types vào lib/implementation.ts"
  - "Seed cleanup pattern: deleteMany contracts + amendments at start of seed để tránh stale FK collision khi promoted projects thay đổi giữa các seed runs (idempotency)"
  - "Promoted 4 projects EVALUATING/VALID → APPROVED cho Phase 8 demo, nhưng giữ lại ≥1 VALID + ≥2 SUBMITTED để Phase 6 demo state machine vẫn hoạt động"
  - "Amendment approval auto-applies changes to Project (TIME → generalInfo.timeRange + plannedStart/End; LOCATION → location; PROJECT_NAME → name); BUDGET/OBJECTIVE/CONTENT là loại trọng yếu nên không auto-apply mà chuyển EVALUATING"
duration: 30min
completed: 2026-05-01
---

# Phase 8 Plan 01: Hợp đồng + Triển khai + Điều chỉnh đề án Summary

**JWT-style atomic POC: Hợp đồng auto-number + workflow đầy đủ, Triển khai timeline + cảnh báo Thương vụ 30d, Điều chỉnh đề án Điều 13 NĐ 28 với side-by-side diff + PDF quyết định.**

## Performance
- **Duration:** ~30 phút
- **Tasks:** 5/5 (schema + workflow + audit / contract module / impl tracking / amendment module / seed)
- **Files created:** ~28 (10 actions, 11 components, 2 lib helpers, 1 PDF template, 1 API route, 1 seed file, 1 mock PDF, 1 schema)
- **Files modified:** 6 (audit-types, pdf/render, ProjectTabsShell, de-an/[id]/page, de-an/_actions/get-detail, seed.ts)
- **Build status:** `npm run build` exit 0 (4 new dynamic routes)

## Accomplishments

### Hợp đồng (CONTRACT-01..07)
- `/hop-dong` page: list với filter (year/status/search) + 5 stat pills + 3 sections (overdue warnings, awaiting list, contract list)
- Auto contract number `XTTM/YYYY/NNN` với atomic counter + retry on collision
- `/hop-dong/[id]` detail: tabs Thông tin & điều khoản (RichTextEditor 8 điều khoản chuẩn) + Bản scan (upload + history)
- Status workflow: DRAFT → SIGNED → IN_PROGRESS → COMPLETED → LIQUIDATED với guards (SIGNED requires scan)
- Sync project status: contract.IN_PROGRESS → project.IN_PROGRESS, contract.COMPLETED → project.COMPLETED
- Cảnh báo 60d: red banner liệt kê đề án đã có QĐ phê duyệt > 60 ngày mà chưa SIGNED HĐ
- Awaiting list: amber banner liệt kê đề án APPROVED chưa có HĐ + nút "Tạo hợp đồng" (auto-fill từ approved budget)

### Triển khai (IMPL-01..12)
- Tab "Triển khai" trên `/de-an/[id]`: ImplementationTab với 3 sections (Cảnh báo, Mốc công việc, Nhân sự + Lịch trình)
- Auto-seed milestones từ `project.plan.rows` nếu trống → user chỉnh sửa hoặc thêm mới
- Timeline horizontal đơn giản: progress bar tổng + per-milestone card với status icon (PENDING/IN_PROGRESS/DONE/BLOCKED) + progress bar màu theo status
- Editor mốc công việc: title, dates, owner, progress 0-100, status, note
- Cảnh báo Thương vụ ĐSQ 30d: trigger cho đề án quốc tế (kind ∈ EXPORT_EXHIBITION/INTL_CONFERENCE/TRADE_DELEGATION_OUT/TRADE_INFO_EXPORT) + start trong 0-60d + chưa contactedConsulate
- ConsulateContactDialog form: country, contact name/title/phone/email, contactDate, note
- After confirm → emerald banner "Đã liên hệ Thương vụ ĐSQ — [country]" với detail
- Hợp đồng badge link từ tab triển khai về `/hop-dong/[contractId]`

### Điều chỉnh (AMEND-01..07)
- `/dieu-chinh` page (BQL): list với 5 stat pills (total/pending/approved/rejected/routed) + click-through to detail
- `/dieu-chinh/[id]` detail: header với critical badge + status, SideBySideDiff (red strike-through old | green new), reason section, action client component
- AmendmentForm dialog (đơn vị): type picker + auto-fill old value từ project + auto-classify critical → banner cảnh báo, reason textarea (min 50 chars validation)
- 9 loại amendment với labels VN: TIME/LOCATION/UNIT_NAME/PROJECT_NAME/OBJECTIVE/CONTENT/BUDGET/MARKET/OTHER
- Workflow:
  - Loại nhỏ + APPROVED → sinh decisionNumber `XTTM-DC/YYYY/NNN` + apply changes to Project (TIME/LOCATION/PROJECT_NAME)
  - Loại trọng yếu + RESUBMIT_EVALUATION → project.status = EVALUATING (quay về Phase 7 thẩm định)
  - REJECTED với reviewerComment
- PDF AmendmentDecision: A4 portrait công văn nhà nước với BỘ CT/CỤC XTTM header + bảng so sánh 3-col (Nội dung | Trước | Sau) + 3 điều khoản + signature block
- API `/api/pdf/amendment/[id]` stream PDF với download/inline mode

### Tab "Điều chỉnh" trên /de-an/[id]
- AmendmentTab với button "Đề nghị điều chỉnh" (chỉ DONVI owner + project APPROVED/IN_PROGRESS) + list amendments
- Inline actions cho BQL: Phê duyệt / Chuyển thẩm định lại (theo isCritical) / Từ chối với prompt reason
- Download QĐ điều chỉnh PDF khi status=APPROVED

## Task Commits
1. **Task 1: schema + workflow + amendment rules + audit types** — `5401510`
2. **Task 2: /hop-dong CRUD + auto contract number + 60d warning** — `1c7405c`
3. **Task 3: triển khai tab + timeline + cảnh báo thương vụ 30d** — `b1edd7f`
4. **Task 4: điều chỉnh đề án + side-by-side diff + quyết định điều chỉnh PDF** — `36ecfd4`
5. **Task 5: seed contracts + impl + amendments** — `a6e66fb`

## Files Created/Modified

**Lib helpers:**
- `lib/amendment-rules.ts` — AMENDMENT_TYPES, CRITICAL_AMENDMENT_TYPES, isCriticalAmendment, formatContractNumber, parseContractNumber, AmendmentStatus + ContractStatus labels/badges
- `lib/implementation.ts` — ImplementationMilestone/Staff/Data types + parseImplementationJson + ConsulateContactInput + parseConsulateContactJson (extracted để client components import được)
- `lib/audit-types.ts` — added CONTRACT_AUDIT_TYPES (6) + IMPL_AUDIT_TYPES (3) + AMENDMENT_AUDIT_TYPES (4)
- `lib/pdf/render.ts` — added renderAmendmentDecisionPdf
- `lib/pdf/templates/AmendmentDecision.tsx` — A4 PDF template

**Hợp đồng module (`app/(app)/hop-dong/`):**
- `_actions/list.ts` — listContracts + listOverdueContractWarnings + listApprovedProjectsWithoutContract
- `_actions/generate-number.ts` — generateContractNumber
- `_actions/create-from-project.ts` — createContractFromProject với DEFAULT_TERMS_HTML
- `_actions/update.ts` — updateContract + transitionContract
- `_actions/upload-scan.ts` — uploadContractScan
- `_actions/get-detail.ts` — getContractDetail
- `page.tsx`, `[id]/page.tsx`
- `_components/ContractList.tsx`, `OverdueWarnings.tsx`, `AwaitingContractList.tsx`
- `[id]/_components/ContractDetailHeader.tsx`, `ContractTabsShell.tsx`, `ContractInfoTab.tsx`, `ContractScanTab.tsx`

**Điều chỉnh module (`app/(app)/dieu-chinh/`):**
- `_actions/list.ts` — listAmendments + getAmendmentDetail
- `_actions/create.ts` — createAmendmentRequest
- `_actions/approve.ts` — approveAmendment + rejectAmendment + routeAmendmentToEvaluation + applyAmendmentToProject
- `page.tsx`, `[id]/page.tsx`
- `_components/AmendmentForm.tsx`, `SideBySideDiff.tsx`, `AmendmentActionsClient.tsx`

**Triển khai integration (`app/(app)/de-an/[id]/`):**
- `_actions/save-impl-plan.ts` — saveImplementationPlan + updateMilestoneProgress
- `_actions/confirm-consulate.ts` — confirmConsulateContact
- `_components/ImplementationTab.tsx`, `ImplementationTimeline.tsx`, `ConsulateContactDialog.tsx`, `AmendmentTab.tsx`
- Updated `ProjectTabsShell.tsx` (8 tabs total: 6 + Triển khai + Điều chỉnh)
- Updated `page.tsx` (load amendments + canManageImpl + canApproveAmendment)

**Schema + seed:**
- `prisma/schema.prisma` — Contract extended (termsHtml, signedById, status enum updated, indexes), ProjectAmendment new model (8 enum types + isCritical + decisionNumber), Project added implementationJson + contactedConsulate + consulateContactJson + amendments[] relation
- `prisma/seed/contracts-and-amendments.ts` — promote 4 projects to APPROVED + synthetic SubmissionDraft+Decision (75d ago) + 3 contracts + 3 amendments
- `prisma/seed.ts` — wire seedContractsAndAmendments + Phase 8 verify
- `app/api/pdf/amendment/[id]/route.ts` — PDF stream

## Decisions & Deviations

### Auto-fixed Issues
**1. [Rule 3 - Blocking] Server Actions must be async — types extracted to lib/**
- **Found during:** Task 5 build (Next.js compile error: `Server Actions must be async functions`)
- **Issue:** `app/(app)/de-an/[id]/_actions/save-impl-plan.ts` and `confirm-consulate.ts` exported pure types/parsers from files marked `'use server'` — Next.js disallows non-async exports.
- **Fix:** Created `lib/implementation.ts` to host pure types (ImplementationMilestone, ImplementationStaff, ImplementationData, ConsulateContactInput) and parsers (parseImplementationJson, parseConsulateContactJson). Server action files now import from lib/.
- **Files modified:** lib/implementation.ts (new), save-impl-plan.ts, confirm-consulate.ts, ImplementationTab.tsx, ImplementationTimeline.tsx, ConsulateContactDialog.tsx
- **Commit:** a6e66fb

**2. [Rule 1 - Bug] ESLint error `<a>` for /hop-dong route**
- **Found during:** Task 5 build
- **Issue:** ImplementationTab used `<a href="/hop-dong/...">` triggering `@next/next/no-html-link-for-pages` error.
- **Fix:** Replaced with `<Link>` from next/link.
- **Commit:** a6e66fb

**3. [Rule 1 - Bug] TypeScript widening for status union literals in seed**
- **Found during:** Task 5 build
- **Issue:** Seed contract/amendment arrays used object literals with status string that TypeScript widened to `string`, breaking the `'DRAFT'|'SIGNED'|'IN_PROGRESS'` constraint.
- **Fix:** Restructure to use explicit typed array + push() pattern (typed `ContractSeed[]`/`AmendmentSeed[]` declared upfront).
- **Commit:** a6e66fb

**4. [Rule 3 - Blocking] Seed Project status promotion broke Phase 6 demo**
- **Found during:** First seed run (Expected ≥2 SUBMITTED Project failed; later Expected ≥1 VALID Project failed)
- **Issue:** Seed initially promoted SUBMITTED + VALID + EVALUATING → APPROVED, leaving 0 SUBMITTED then 0 VALID for Phase 6 demo state machine.
- **Fix:** (a) Don't touch SUBMITTED, (b) always leave ≥1 VALID — promote `validProjects.length - 1` VALID + all EVALUATING up to total 4.
- **Commit:** a6e66fb

**5. [Rule 1 - Bug] Seed unique constraint failure on contractNo when promoted projects shift**
- **Found during:** Second seed run (after first run already created contracts on now-different projectIds)
- **Issue:** Re-running seed with different project promotion candidates left orphan contracts referencing dropped projects, then unique(contractNo) collision.
- **Fix:** `deleteMany({})` for contracts + amendments at start of seedContractsAndAmendments (true idempotency).
- **Commit:** a6e66fb

### Scope-aligned with plan
- Side-by-side diff: built with CSS grid 2-col per user instruction (no react-diff-view) — confirmed in plan context.
- Plan listed exactly 5 tasks; all 5 implemented; no scope creep.

## Verification

- ✅ `npm run db:push` exit 0 — schema applied
- ✅ `npm run db:seed` exit 0 — 3 contracts + 3 amendments + Phase 6/7 demo states preserved
- ✅ `npm run build` exit 0 — production build succeeds
- ✅ All 4 new routes built: `/hop-dong` (9.05kB), `/hop-dong/[id]` (13.4kB), `/dieu-chinh` (155B), `/dieu-chinh/[id]` (3.37kB)
- ✅ Existing route `/de-an/[id]` rebuilt to 20.2kB (added 2 tabs)

## Next Phase Readiness

Phase 8 is complete. Phase 9 (M5 Báo cáo & Nghiệm thu) can now consume:
- `Project.status === 'IN_PROGRESS'` projects (3 promoted seed projects + 1 IN_PROGRESS) ready for báo cáo
- `Contract.status === 'IN_PROGRESS'` for trigger báo cáo định kỳ 15 ngày sau hoạt động
- Implementation milestones data có thể trở thành nguồn báo cáo định kỳ (progress per milestone)

Phase 10 (M5 Tài chính) can consume:
- `Contract.totalValue` + `signedDate` cho tính tạm ứng
- `Contract.status` workflow đã đầy đủ DRAFT → LIQUIDATED

Phase 11 (Dashboard) can consume:
- 60d overdue warnings (`listOverdueContractWarnings`)
- 30d Thương vụ warnings (per-project compute)
- Amendment stats (PENDING/APPROVED/REJECTED/RESUBMIT_EVALUATION)

## Self-Check: PASSED

- ✅ FOUND: prisma/schema.prisma (Contract + ProjectAmendment models)
- ✅ FOUND: lib/amendment-rules.ts
- ✅ FOUND: lib/implementation.ts
- ✅ FOUND: app/(app)/hop-dong/page.tsx + [id]/page.tsx
- ✅ FOUND: app/(app)/dieu-chinh/page.tsx + [id]/page.tsx
- ✅ FOUND: app/api/pdf/amendment/[id]/route.ts
- ✅ FOUND: lib/pdf/templates/AmendmentDecision.tsx
- ✅ FOUND: prisma/seed/contracts-and-amendments.ts
- ✅ FOUND commit 5401510 (Task 1)
- ✅ FOUND commit 1c7405c (Task 2)
- ✅ FOUND commit b1edd7f (Task 3)
- ✅ FOUND commit 36ecfd4 (Task 4)
- ✅ FOUND commit a6e66fb (Task 5)
