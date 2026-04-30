# Phase 3: M2.1 Chu kỳ Chương trình XTTM (HERO) - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** Auto-generated during overnight session — decisions sourced từ PROJECT.md + project_xttm_program_cycle.md memory + ROADMAP.md success criteria

<domain>
## Phase Boundary

Đây là **HERO entity** — Chu kỳ Chương trình XTTM năm là tiền điều kiện gating cho mọi đề án. Phase này phải mượt nhất, đầu tư polish cao nhất.

**In scope (15 requirements CYCLE-01..15):**
- BQL tạo Chu kỳ Chương trình năm qua wizard 5 bước
- Cấu hình mốc thời gian / ngân sách / tiêu chí / mẫu công văn / mẫu email / danh sách đơn vị mời
- Upload bản scan công văn ban hành
- State machine 7 trạng thái với guard functions
- Visual state machine diagram (animated, hiển thị trạng thái hiện tại + transitions có sẵn)
- Composer email Tiptap mời đăng ký + gửi hàng loạt (mock dispatch)
- Trang chi tiết 6 tabs (Tổng quan / Cấu hình kỳ / Công văn / Đơn vị mời + thông báo / Đề án đăng ký / Nhật ký)
- Trang danh sách card view các năm
- Cho phép gia hạn (CLOSED → OPEN)
- Cho phép sửa cấu hình khi OPEN

**OUT of scope (defer to later phases):**
- Đề án/Project entity và submission flow → Phase 5 (M2.3)
- Hồ sơ đơn vị chủ trì → Phase 4 (M2.2)
- Thẩm định / hội đồng → Phase 7 (M3)
- Real email gateway → Out of scope (mock dispatch only)

</domain>

<decisions>
## Implementation Decisions

### State Machine (CYCLE-05, CYCLE-06)
- **States**: DRAFT → READY → OPEN_REGISTRATION → CLOSED_REGISTRATION → EVALUATING → APPROVED → COMPLETED
- **Allowed transitions**:
  - DRAFT → READY (must have all required config)
  - READY → OPEN_REGISTRATION (must have công văn uploaded)
  - OPEN_REGISTRATION ↔ CLOSED_REGISTRATION (gia hạn cho phép cả 2 chiều, ghi audit log với lý do)
  - CLOSED_REGISTRATION → EVALUATING (chuyển sang thẩm định)
  - EVALUATING → APPROVED (sau khi quyết định phê duyệt — Phase 7)
  - APPROVED → COMPLETED (sau khi tất cả đề án thanh lý — Phase 9)
- **Implementation**: status enum field + `lib/workflows/programCycle.ts` already has skeleton from M0 — extend with `transition(from, to)`, `canTransition(from, to)`, `validateGuards(cycle)` functions
- **Visual diagram**: built with React Flow (npm install @xyflow/react). 7 nodes ngang theo dòng thời gian, edges hiển thị transitions, node hiện tại = ring blue-700 + pulse animation, transitions có sẵn = highlight edge + button "Chuyển sang ..." khi hover

### Wizard tạo chu kỳ (CYCLE-01..04)
- **Multi-step pattern**: SAME as Phase 5 PROJ wizard sẽ dùng — single URL `/chuong-trinh/new`, RHF 1 instance, Zustand store cho step state, Zod schema/step, autosave debounce 2s.
- **5 bước**:
  1. Thông tin chung: name (auto "Chương trình XTTM Quốc gia [year]"), year (unique constraint, validate năm chưa tồn tại), description, totalBudget
  2. Mốc thời gian: registrationStartDate, registrationDeadline (default 30/5), supplementDeadline, evaluationStart/End, approvalDeadline
  3. Cấu hình tiêu chí: scoringCriteriaIds (multi-select từ catalog tieu-chi-cham-diem), evaluationCriteriaIds, defaults từ chu kỳ năm trước nếu có
  4. Đơn vị mời: multi-select từ catalog Organization (có thể search debounced), default "tất cả đơn vị active"
  5. Xem lại & lưu nháp: readonly summary toàn bộ + button "Lưu nháp" (DRAFT) hoặc "Tạo và sang cấu hình" (READY)
- **Stepper UI**: clickable steps (đã hoàn thành có thể click back), progress indicator, validation per-step trước khi cho next

### Trang chi tiết 6 tabs (CYCLE-14)
- **Route**: `/chuong-trinh/[id]` với tabs sub-routes (`/chuong-trinh/[id]/tong-quan`, `/chuong-trinh/[id]/cau-hinh`, `/chuong-trinh/[id]/cong-van`, `/chuong-trinh/[id]/don-vi-moi`, `/chuong-trinh/[id]/de-an`, `/chuong-trinh/[id]/nhat-ky`) — sub-routes cho deep-linkable
- **Header sticky**: tên chu kỳ + status badge + năm + action buttons theo trạng thái
- **Action buttons theo trạng thái**:
  - DRAFT: "Hoàn thành cấu hình" (chuyển → READY nếu validateGuards pass)
  - READY: "Mở cổng nhận đăng ký" (yêu cầu công văn uploaded)
  - OPEN: "Đóng cổng" + "Chỉnh sửa cấu hình kỳ" + "Gửi thông báo bổ sung"
  - CLOSED: "Mở lại để gia hạn" (form input lý do + ngày hạn mới) + "Chuyển sang thẩm định"
  - EVALUATING: read-only (Phase 7 sẽ handle)
  - APPROVED+: read-only
- **Tab Tổng quan**: visual state machine diagram + statistics cards (số đề án đăng ký, tổng kinh phí, số đơn vị tham gia, % hoàn thành theo timeline) + recent activity timeline
- **Tab Cấu hình kỳ**: form chỉnh sửa các trường (mốc thời gian, ngân sách, tiêu chí). Khi OPEN_REGISTRATION → submit triggers email cho danh sách đơn vị mời
- **Tab Công văn**: upload area (drag-drop PDF), metadata form (số công văn, ngày ký, người ký, chức vụ), lịch sử các công văn (versioning nếu có công văn bổ sung/điều chỉnh)
- **Tab Đơn vị mời + thông báo**: 2 sub-section — danh sách đơn vị (add/remove) + composer email Tiptap với template variable + button "Gửi thông báo cho [N] đơn vị" + lịch sử dispatch
- **Tab Đề án đăng ký**: DataTable (sẽ filled real data từ Phase 5) — Phase 3 chỉ render empty state "Chưa có đề án nào đăng ký trong kỳ này"
- **Tab Nhật ký**: filter audit log scoped to programCycleId

### Trang danh sách (CYCLE-15)
- **Route**: `/chuong-trinh`
- **Layout**: card view các năm (3 columns desktop, 1 col mobile). Mỗi card hiển thị: năm, tên, status badge, số đề án (mock 0 cho Phase 3), tổng kinh phí, progress bar timeline (tỷ lệ thời gian đã trôi qua), nút "Xem chi tiết"
- **Filter**: năm (dropdown), status (multi-select)
- **Sort**: năm desc (mới nhất trên)
- **Actions**: nút "Tạo chu kỳ mới" (chỉ BQL/Admin có quyền)

### Công văn upload (CYCLE-07)
- **Storage**: `storage/uploads/cong-van/[cycleId]/[file].pdf` (gitignored)
- **Validation**: file type PDF only, max 10MB, virus scan KHÔNG cần (POC)
- **Metadata required**: số công văn, ngày ký, người ký (text), chức vụ
- **Display**: PDF preview iframe trong tab + download button + lịch sử versions

### Composer email Tiptap mời (CYCLE-13)
- **Reuse**: components/shared/RichTextEditor.tsx từ Phase 2 (Tiptap v3 + StarterKit)
- **Variables**: {tenChuongTrinh}, {namKy}, {hanNopHoSo}, {tenDonVi}, {nguoiKy}, {ngayKyCongVan}, {soCongVan} — popup variable menu inline
- **Preview tab**: render với mock data của 1 đơn vị
- **Mock dispatch**: server action tạo NotificationDispatch records cho mỗi đơn vị mời, status SENT, không gửi email thật. Inbox của đơn vị (Phase 4 sẽ có) sẽ hiển thị

### Mock dispatch system
- **Schema**: `Notification { id, programCycleId?, projectId?, type, subject, content, recipientType, createdAt }` + `NotificationDispatch { notificationId, recipientUserId, recipientOrgId, status, sentAt, readAt? }`
- **APPEND** to schema.prisma (model already scaffolded từ M0)
- **Server action**: `sendCycleInvitation(cycleId, templateId, recipientOrgIds[])` — bulk creates dispatches

### Gia hạn (CYCLE-10)
- **UI**: Action button "Mở lại để gia hạn" → AlertDialog form (lý do textarea bắt buộc + ngày hạn mới date picker, validate > today + audit log entry on confirm)
- **Server action**: `extendCycle(cycleId, reason, newDeadline)` — verify can transition + update status + audit + auto-send notification email cho danh sách đơn vị nếu config

### Sửa cấu hình khi OPEN (CYCLE-12)
- **Behavior**: Form chỉnh sửa cấu hình kỳ (mốc, tiêu chí, ngân sách) hoạt động kể cả khi status = OPEN_REGISTRATION
- **Audit**: ghi log diff before/after
- **Notification**: nếu thay đổi mốc thời gian / tiêu chí, prompt confirm "Gửi thông báo cho danh sách đơn vị đã được mời?" → optional dispatch

### Claude's Discretion
- React Flow node design (border, shadow, color theo state)
- Animation timing cho state transition
- Empty state cho danh sách năm đầu tiên
- Form validation specific messages
- Mock data: seed 3 chu kỳ — năm trước (COMPLETED), năm hiện tại 2026 (OPEN_REGISTRATION), năm tới 2027 (DRAFT) — đủ demo 3 góc nhìn
- Toast feedback wording

</decisions>

<canonical_refs>
## Canonical References

### Foundation (from Phase 1)
- `prisma/schema.prisma` — `ProgramCycle` model already scaffolded với fields: id, name, year (unique), description, totalBudget, registrationStartDate, registrationDeadline, supplementDeadline, evaluationStartDate, evaluationDeadline, approvalDeadline, invitationLetterNumber, invitationLetterDate, invitationLetterFile (Attachment relation), signedBy, status, scoringCriteriaIds, evaluationCriteriaIds, emailTemplateIds, invitedUnitIds, createdById, createdAt
- `lib/workflows/programCycle.ts` — state enum + skeleton transition logic
- `lib/audit.ts` — withAuditLog wrapper (Phase 2)
- `lib/permissions-db.ts` — canFromDB authoritative check (Phase 2)
- `lib/system-config.ts` — getSLAThresholds for 30 ngày commercial office warning

### Shared UI (from Phase 2)
- `components/shared/data-table/DataTable.tsx`
- `components/shared/EmptyState.tsx`
- `components/shared/ConfirmDialog.tsx`
- `components/shared/MultiSelect.tsx`
- `components/shared/DateRangePicker.tsx`
- `components/shared/RichTextEditor.tsx` (Tiptap)
- `components/shared/StatusBadge.tsx`
- `components/shared/CopyButton.tsx`

### Catalogs (from Phase 2)
- `lib/catalog-types.ts` + 8 seeded tables (use ScoringCriterion for scoring config, DocumentTemplate for công văn template, OrgUnit for đơn vị mời selection)

### Project Architecture
- `.planning/research/ARCHITECTURE.md` — Server Actions policy, multi-step form pattern with Zustand
- `.planning/research/STACK.md` — Tiptap, RHF, Zod
- `.planning/research/PITFALLS.md` — state machine sai transition (CRITICAL), hardcoded date in seed (CRITICAL)
- `.planning/research/SUMMARY.md` — frozen tech decisions
- `.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md` — design system reuse

### Memory
- `~/.claude/projects/d--Thaodnp-XTTM/memory/project_xttm_program_cycle.md` — full ProgramCycle entity spec với 4 ràng buộc đã chốt

### Project Instructions
- `CLAUDE.md` — Vietnamese UI 100%, TERMS dictionary

</canonical_refs>

<specifics>
## Specific Ideas

- **React Flow visual state machine**: install @xyflow/react. 7 horizontal nodes connected with directed edges. Custom node component renders status badge + label + (current node has glow ring). Transitions có sẵn từ current state highlighted với hover effect "Click to transition" + AlertDialog confirm.
- **Wizard step persistence**: Zustand persist middleware to localStorage with key `program-cycle-wizard-{userId}`. Restore on mount. Clear on submit.
- **Stepper component**: build custom from shadcn — list of 5 circles connected with lines, current = filled blue-700, completed = filled with checkmark, future = empty ring. Clickable for completed steps to revisit.
- **Statistics cards** (Tab Tổng quan): 4 cards layout 2x2 hoặc 4x1 — số đề án đăng ký (mock 0), tổng kinh phí đăng ký (Intl.NumberFormat VND), số đơn vị mời / đã phản hồi, ngày còn lại tới hạn nộp (countdown). Cards có icon + value + subtitle.
- **PDF preview iframe**: simple `<iframe src="/api/file/[attachmentId]" />` với border + max-height. PDF served via Route Handler at `/api/file/[id]` với auth check.
- **Composer email variable menu**: floating popup khi user nhập `{` — fuzzy search variable names, click to insert with `{tenChuongTrinh}` syntax. Tiptap extension custom hoặc inline implementation.
- **Notification batch UI**: send button shows progress bar with N/M dispatches sent (mock instant — but show animation 1s for UX feel).

</specifics>

<deferred>
## Deferred Ideas

- **Cron job auto-transition state** (e.g., auto OPEN → CLOSED khi qua hạn) — defer to Phase 9 hoặc as a one-time button click for POC
- **Bulk import danh sách đơn vị mời từ Excel** — defer
- **Versioning công văn** (nếu phải ban hành công văn điều chỉnh) — POC only handles 1 công văn ban hành; điều chỉnh sẽ là Phase 8 (M4 Amendment)
- **Custom variable definition trong DocumentTemplate** — Phase 2 đã handle ở admin level, Phase 3 chỉ consume
- **Send email schedule** (gửi sau X ngày) — defer
- **Cycle template từ năm cũ "Sao chép cấu hình"** — nice-to-have, defer to backlog
- **Cycle archive view** (history view) — defer
- **Multi-language support** (EN khi cần) — out of scope
- **Real-time updates** (websocket khi có đơn vị nộp đề án) — POC dùng polling

</deferred>

---

*Phase: 03-m2.1-chu-kỳ-chương-trình-xttm*
*Context auto-generated: 2026-04-30 during overnight autonomous session*
*HERO Phase — invest most polish here*
