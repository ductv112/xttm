# Phase 4: M2.2 Hồ sơ Đơn vị Chủ trì - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** Auto-generated overnight session

<domain>
## Phase Boundary

Đơn vị chủ trì tạo + cập nhật hồ sơ tổ chức (tiền điều kiện cho việc nộp đề án ở Phase 5). BQL phê duyệt hoặc từ chối hồ sơ với lý do.

**In scope (8 ORG-* requirements):** Đăng ký tổ chức, năng lực, đầu mối liên hệ, gửi xác nhận, BQL phê duyệt/từ chối.

**OUT of scope:** Đề án (Phase 5), thông báo email thật (mock dispatch only).
</domain>

<decisions>
## Implementation Decisions

### Hồ sơ tổ chức (ORG-01..04)
- **Single page** `/don-vi-cua-toi` cho đơn vị chủ trì (vai trò DONVI) — KHÔNG multi-step (form ngắn hơn đề án)
- **Sections** trong page: Thông tin pháp lý / Năng lực hoạt động / Đầu mối liên hệ / Tài liệu pháp lý
- **Auto-create**: khi user role=DONVI login lần đầu, hệ thống tự tạo OrganizationProfile DRAFT từ Organization gốc
- **Năng lực**: rich text Tiptap field cho mô tả thành tích + multi text input array cho danh sách đề án đã thực hiện (tên + năm + kết quả)

### Đầu mối liên hệ (ORG-05)
- **CRUD inline** trong page — table với add/edit/delete row
- **Fields**: tên, chức danh (text — TS./PGS./CN.), vai trò (Chủ tịch / Phó chủ tịch / Chủ nhiệm / Điều phối viên / Khác), email, sđt
- **Validate**: email regex, sđt VN regex (+84 hoặc 0[3-9]xxxxxxxx)

### Tài liệu pháp lý (ORG-03)
- **Upload area**: drag-drop, accept PDF/JPG/PNG, max 10MB/file, max 10 files total
- **Categories**: Giấy ĐKKD, Điều lệ, Quyết định thành lập, Khác
- **Storage**: storage/uploads/org-profile/[orgId]/[uuid].pdf

### Submit & Phê duyệt (ORG-06..08)
- **Submit flow**: action "Gửi hồ sơ xác nhận" — confirmation dialog → server action → status DRAFT → SUBMITTED → audit log + email notification BQL (mock dispatch)
- **BQL approval page** `/don-vi-chu-tri` (admin/banql role): list của OrganizationProfile.SUBMITTED with filter
  - Click vào row → drawer hoặc dedicated page với view full profile + 2 buttons "Phê duyệt" / "Từ chối với lý do"
  - Approve: status → APPROVED, audit, notify đơn vị (mock email)
  - Reject: status → REJECTED with reason text, audit, notify đơn vị

### State machine
- DRAFT → SUBMITTED → APPROVED / REJECTED
- REJECTED → DRAFT (resubmit cho phép)
- APPROVED → DRAFT (đơn vị cập nhật, nhưng giữ APPROVED status — Phase 5 sẽ check approved=true)
- Implementation: extend lib/workflows/orgProfile.ts (skeleton từ M0)

### Timeline visual
- Vertical timeline trên trang chi tiết — hiển thị các lần submit / approve / reject với timestamp + comment

### Claude's Discretion
- Form layout details
- Empty state cho đơn vị mới chưa có hồ sơ
- Loading states
- Toast wordings
- Mock data: seed OrganizationProfile cho 5 orgs với statuses khác nhau (1 APPROVED, 1 SUBMITTED, 1 REJECTED, 2 DRAFT)
</decisions>

<canonical_refs>
- prisma/schema.prisma — Organization + OrganizationProfile model scaffolded từ M0
- lib/workflows/orgProfile.ts — state machine skeleton
- lib/audit.ts, lib/permissions-db.ts
- components/shared/* — DataTable, EmptyState, ConfirmDialog, RichTextEditor
- 04-CONTEXT.md (this file)
- CLAUDE.md
</canonical_refs>

<deferred>
- 2FA cho login đơn vị — out of scope
- Verify SĐT bằng OTP — out of scope (mock)
- API tích hợp với cơ quan đăng ký kinh doanh để verify mã số thuế — out of scope
- Multi-language EN — out of scope
- Bulk approve nhiều hồ sơ cùng lúc — defer to backlog
</deferred>

---
*Phase: 04 | Auto-generated 2026-04-30 overnight*
