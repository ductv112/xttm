# Phase 5: M2.3 Khai báo & Nộp Đề án (HERO) - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** Auto-generated overnight session — HERO phase, screen công khai nhất của hero flow

<domain>
## Phase Boundary

**HERO Phase** — Multi-step form 6 bước cho đơn vị chủ trì khai báo và nộp đề án. Đây là screen audience nhìn nhiều nhất, cần polish cao nhất.

**In scope (22 PROJ-* requirements):**
- Cổng tiếp nhận với gating bởi ProgramCycle.OPEN_REGISTRATION + OrgProfile.APPROVED
- Multi-step form 6 bước (Thông tin chung → Mục tiêu/nội dung/kế hoạch → Dự toán → Chủ nhiệm → Tài liệu → Xem lại & nộp)
- RHF + Zod per-step + Zustand persist + autosave debounce 2s
- Lưu nháp / Sao chép đề án cũ / Rút hồ sơ / Đề án 2 năm với parentProjectId
- Print/Export PDF chuẩn công văn
- Theo dõi trạng thái + lịch sử bổ sung (ProjectVersion)

**OUT of scope:** Tiếp nhận/Phân công (Phase 6), Thẩm định/Hội đồng (Phase 7).
</domain>

<decisions>
## Implementation Decisions

### Form pattern (PROJ-04, PROJ-05)
- **REUSE pattern from Phase 3 wizard** — Single URL `/de-an/new` (single URL, NOT per-step routes for state continuity), Zustand persist localStorage `project-wizard-{userId}`, RHF 1 instance with Zod schema/step, autosave debounce 2s to draft
- **6 bước**:
  1. **Thông tin chung**: tên đề án (text), kind (Select từ 8 catalog), industrySectorIds (MultiSelect), marketIds (MultiSelect), countryIds (MultiSelect), promotionTypeIds (MultiSelect), thời gian — date range hoặc quarter (Q1/Q2/Q3/Q4 cho đoàn nước ngoài)
  2. **Mục tiêu, nội dung, kế hoạch**: mục tiêu (Tiptap rich text), nội dung (Tiptap), kế hoạch chi tiết (table input rows: hạng mục, deliverable, due date, owner)
  3. **Dự toán kinh phí**: bảng table — hạng mục (text), đơn vị tính, số lượng, đơn giá, thành tiền (auto-calc), nguồn (Nhà nước/Đối ứng đơn vị) — total auto-calculated bottom + ngân sách tổng
  4. **Chủ nhiệm đề án**: select từ contacts của OrganizationProfile (đã có từ Phase 4) hoặc tạo mới
  5. **Tài liệu đính kèm**: drag-drop multiple files với category (Kế hoạch chi tiết / Hồ sơ năng lực / Bằng chứng kinh nghiệm / Khác) + max 20 files, 10MB/file
  6. **Xem lại & nộp**: readonly summary toàn bộ + checkbox "Tôi cam đoan các thông tin trên là đúng sự thật" + button "Lưu nháp" hoặc "Nộp đề án"

### Gating logic (PROJ-01, PROJ-03)
- **Cổng tiếp nhận** at `/de-an` (đơn vị):
  - Query active ProgramCycle (status = OPEN_REGISTRATION)
  - Query OrganizationProfile của user → status APPROVED required
  - **3 states for UI**:
    - Chu kỳ OPEN + Profile APPROVED → banner "Đợt mời đề xuất [năm] đang mở — hạn [date]" + button "Tạo đề án mới" enabled + danh sách đề án đã nộp
    - Chu kỳ OPEN + Profile not APPROVED → banner "Hồ sơ đơn vị chưa được phê duyệt. Vui lòng hoàn tất hồ sơ tại /don-vi-cua-toi" + button disabled
    - No chu kỳ OPEN → banner "Hiện chưa có đợt mời nào đang mở" + button disabled với tooltip "Chu kỳ chương trình tiếp theo sẽ được thông báo qua email"

### Sao chép đề án cũ (PROJ-13)
- Button "Sao chép từ đề án cũ" trên trang /de-an/new (visible nếu user có đề án năm trước APPROVED)
- Mở Dialog với list đề án cũ — click chọn → prefill toàn bộ form data (trừ thời gian + năm)
- Tự động chỉnh tên thêm suffix `(năm mới)` để dễ phân biệt

### Đề án 2 năm (PROJ-17, PROJ-18)
- Toggle "Đề án 2 năm" tại step 1
- Khi toggle ON: hiển thị thêm input "Năm tiếp theo" (mặc định currentYear+1)
- Khi nộp: tự động tạo 2 records — record năm hiện tại + record năm sau với `parentProjectId` link
- Năm sau record có `status: TENTATIVE` (chưa thuộc chu kỳ active)
- UI hiển thị badge "Tiếp nối từ [tên đề án năm trước]" trên record năm sau, link điều hướng

### Submit flow (PROJ-14)
- Server action `submitProject` — Zod validate đầy đủ + canTransition guard (DRAFT → SUBMITTED) + create ProjectVersion snapshot + transition status + audit + notification BQL
- Idempotency: same form submit twice within 5s → return existing project (don't create duplicate)
- Mock notification dispatch: BQL users get inbox entry "Có đề án mới từ [đơn vị]"

### Withdraw (PROJ-15)
- Action "Rút hồ sơ" chỉ hiển thị khi status SUBMITTED và chưa được phân công (assignedToUserId === null)
- Confirmation dialog → status SUBMITTED → DRAFT + audit

### Resubmit (PROJ-20..22)
- Khi status SUPPLEMENT_REQUIRED, đơn vị edit + nộp lại
- Nộp lại tăng version (ProjectVersion snapshot trước update), audit log
- Lịch sử versions hiển thị tab Lịch sử trên trang chi tiết đề án

### PDF Export (PROJ-16)
- Reuse lib/pdf foundation từ Phase 1 (Be Vietnam Pro)
- Template `lib/pdf/templates/ProjectProposal.tsx` — A4 portrait, header Bộ CT + Quốc hiệu, sections matching 6 bước form, footer signature block + dấu mộc placeholder, watermark "BẢN MẪU"
- Server endpoint `/api/pdf/project/[id]` returns PDF buffer
- Button "In/Xuất PDF" trên trang chi tiết đề án

### Trạng thái timeline (PROJ-19)
- Visual timeline trên trang chi tiết — rows: SUBMITTED → ASSIGNED → IN_REVIEW → SUPPLEMENT_REQUIRED → RESUBMITTED → VALID → EVALUATING → APPROVED → ...
- Mỗi row có timestamp + ai làm + comment

### Trang danh sách đề án của đơn vị (`/de-an`)
- DataTable với columns: tên, năm, status, ngày nộp, ngân sách đăng ký, action (Xem chi tiết)
- Filter: năm, status, kind
- Empty state khi chưa có đề án

### Trang chi tiết đề án (`/de-an/[id]`)
- Header: tên + status badge + năm + chu kỳ + action buttons theo trạng thái
- Tabs: Tổng quan / Kế hoạch / Dự toán / Tài liệu / Lịch sử / Nhật ký
- Read-only nếu status SUBMITTED+ (chỉ DRAFT mới edit được)

### Claude's Discretion
- Stepper visual (reuse Phase 3 component)
- Form validation messages (formal Vietnamese)
- Empty states / loading skeletons
- Mock data: seed 5-7 đề án với mọi trạng thái + 1 đề án 2 năm với parentProjectId
- Toast wordings
- Auto-save indicator pattern
</decisions>

<canonical_refs>
- prisma/schema.prisma — Project model với parentProjectId scaffolded từ M0
- lib/workflows/project.ts — state machine skeleton
- lib/pdf/* — Be Vietnam Pro foundation
- components/shared/program-cycle/Stepper.tsx — reuse stepper
- components/shared/* — DataTable, RichTextEditor, MultiSelect, DateRangePicker, ConfirmDialog, EmptyState
- app/(app)/chuong-trinh/new/* — wizard pattern reference (Phase 3)
- app/(app)/don-vi-cua-toi/_actions/get-or-create.ts — get profile to check APPROVED
- 05-CONTEXT.md (this file)
- CLAUDE.md
</canonical_refs>

<deferred>
- Real e-signature for "tôi cam đoan" — out of scope (mock checkbox)
- Auto-detect duplicate đề án — defer
- AI suggest từ đề án cũ — defer to backlog
- Real-time co-edit — out of scope
- Mobile camera scan tài liệu — out of scope
- Multi-currency budget — out of scope (VND only)
- Bulk submit nhiều đề án cùng lúc — defer
</deferred>

---
*Phase: 05 HERO | Auto-generated 2026-04-30 overnight*
*Critical investment area for demo*
