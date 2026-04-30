---
phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì
plan: 02
title: UI pages — đơn vị tự sửa hồ sơ + BQL approval
wave: 2
autonomous: yes
depends_on: ['04-01']
files_modified:
  - app/(app)/don-vi-cua-toi/page.tsx
  - app/(app)/don-vi-cua-toi/_components/LegalInfoForm.tsx
  - app/(app)/don-vi-cua-toi/_components/CapabilitiesForm.tsx
  - app/(app)/don-vi-cua-toi/_components/ContactsManager.tsx
  - app/(app)/don-vi-cua-toi/_components/DocumentsManager.tsx
  - app/(app)/don-vi-cua-toi/_components/ProfileTimeline.tsx
  - app/(app)/don-vi-cua-toi/_components/SubmitButton.tsx
  - app/(app)/don-vi-cua-toi/_components/RejectionAlert.tsx
  - app/(app)/don-vi-chu-tri/page.tsx
  - app/(app)/don-vi-chu-tri/_components/OrgProfileTable.tsx
  - app/(app)/don-vi-chu-tri/_components/ProfileDetailSheet.tsx
  - app/(app)/don-vi-chu-tri/_components/ApproveDialog.tsx
  - app/(app)/don-vi-chu-tri/_components/RejectDialog.tsx
requirements: [ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08]
---

<objective>
UI pages cho 2 vai trò: (1) đơn vị chủ trì tự cập nhật hồ sơ tổ chức tại /don-vi-cua-toi, (2) BQL phê duyệt hoặc từ chối tại /don-vi-chu-tri.
</objective>

<threat_model>
- T-04-02-01 (medium): RBAC bypass trên /don-vi-chu-tri — mitigated qua page.tsx server-side `canFromDB('org-profile', 'view')` check
- T-04-02-02 (low): Email enumeration via contacts — mitigated qua entity-aware filter (đơn vị chỉ xem được contacts của chính mình)
</threat_model>

<task n="1" id="04-02-01" type="ui-don-vi-cua-toi">
<read_first>
- d:/Thaodnp/XTTM/app/(app)/don-vi-cua-toi/_actions/get-or-create.ts
- d:/Thaodnp/XTTM/app/(app)/don-vi-cua-toi/_actions/update.ts
- d:/Thaodnp/XTTM/lib/workflows/orgProfile.ts (ALLOWED_NEXT_STATES, validateGuards)
- d:/Thaodnp/XTTM/components/shared/RichTextEditor.tsx
- d:/Thaodnp/XTTM/components/shared/StatusBadge.tsx
- d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (form patterns)
</read_first>

<action>
Create `app/(app)/don-vi-cua-toi/page.tsx` (RSC):
1. `auth()` → if no session → redirect to /login
2. If user.role !== DONVI → redirect to /dashboard
3. Call getOrCreateMyProfile() → profile
4. Render layout:
   - Header: "Hồ sơ Đơn vị Chủ trì" + StatusBadge(profile.status) + last submitted date
   - If status REJECTED: <RejectionAlert reason={profile.rejectionReason} /> at top
   - Main 2-column layout:
     - Left col (2/3): tabs hoặc sections (Thông tin pháp lý / Năng lực / Đầu mối liên hệ / Tài liệu)
     - Right col (1/3): Timeline + Submit button + validation hints
   - Submit button (disabled if status SUBMITTED or validateGuards fails)

Create components:
- `LegalInfoForm.tsx` (client) — RHF + Zod, fields: tên (readonly từ Organization), MST, địa chỉ, người đại diện, chức danh, loại hình, lĩnh vực hoạt động. Auto-save debounce 1s call updateMyProfile({ legalInfo: ... })
- `CapabilitiesForm.tsx` (client) — RichTextEditor cho mô tả + table input cho pastProjects (tên đề án, năm, kết quả). Auto-save
- `ContactsManager.tsx` (client) — table với add/edit/delete row. Each row: tên, chức danh, vai trò (Select), email, sđt. Validate inline
- `DocumentsManager.tsx` (client) — drag-drop area + grid của uploaded files với category dropdown + delete button. Use uploadProfileDocument server action
- `ProfileTimeline.tsx` (client) — vertical timeline hiển thị: created, last updated, submitted (if), approved/rejected (if). Reuse audit log query scoped to profile.id
- `SubmitButton.tsx` (client) — wraps submitMyProfile in confirmation dialog, disabled state if validateGuards fails (show validation errors above button)
- `RejectionAlert.tsx` (client) — red Alert from shadcn với XCircle icon + reason + button "Chỉnh sửa và gửi lại"

All forms use formal Vietnamese tone. Validation messages: "Vui lòng nhập...", "Email không đúng định dạng", "Số điện thoại Việt Nam không hợp lệ".

Run `npx tsc --noEmit` and `npm run build` after each commit.

Commit:
1. `feat(04-02): /don-vi-cua-toi page shell + LegalInfoForm + CapabilitiesForm`
2. `feat(04-02): ContactsManager + DocumentsManager`
3. `feat(04-02): SubmitButton + RejectionAlert + ProfileTimeline`
</action>

<acceptance_criteria>
- Files exist: page.tsx + 7 component files
- npm run build exits 0
- /don-vi-cua-toi route registered
- Login as donvi1 → page renders với StatusBadge
</acceptance_criteria>

<done_when>3 commits, tsc + build clean.</done_when>
</task>

<task n="2" id="04-02-02" type="ui-don-vi-chu-tri">
<read_first>
- d:/Thaodnp/XTTM/app/(app)/don-vi-chu-tri/_actions/list.ts
- d:/Thaodnp/XTTM/app/(app)/don-vi-chu-tri/_actions/approve.ts
- d:/Thaodnp/XTTM/app/(app)/don-vi-chu-tri/_actions/reject.ts
- d:/Thaodnp/XTTM/components/shared/data-table/DataTable.tsx
- d:/Thaodnp/XTTM/components/shared/ConfirmDialog.tsx
</read_first>

<action>
Create `app/(app)/don-vi-chu-tri/page.tsx` (RSC):
1. `auth()` + `canFromDB('org-profile', 'view')` — redirect if not authorized
2. Read URL search params: status (default 'SUBMITTED'), search
3. Call listOrgProfiles({ status, search }) → profiles
4. Render: header + filter bar (Tabs cho status: Tất cả / Chờ duyệt / Đã duyệt / Từ chối) + DataTable
5. Pass profiles to OrgProfileTable client component

Create components:
- `OrgProfileTable.tsx` (client) — DataTable với columns: tên đơn vị, MST, người đại diện, status badge, ngày nộp, action (button "Xem chi tiết" mở Sheet)
- `ProfileDetailSheet.tsx` (client) — large drawer (640px wide) hiển thị full profile readonly: legal info, capabilities, contacts, documents (with download links). Footer có 2 buttons "Phê duyệt" / "Từ chối" (chỉ hiện khi status=SUBMITTED)
- `ApproveDialog.tsx` — ConfirmDialog với confirm message "Bạn xác nhận phê duyệt hồ sơ của [tên đơn vị]?" → calls approveOrgProfile + toast "Đã phê duyệt thành công"
- `RejectDialog.tsx` — Dialog với textarea cho lý do (Zod min 10 chars) + button "Xác nhận từ chối" → calls rejectOrgProfile + toast

All Vietnamese tone formal.

Commits:
1. `feat(04-02): /don-vi-chu-tri page + OrgProfileTable + filter`
2. `feat(04-02): ProfileDetailSheet + ApproveDialog + RejectDialog`
</action>

<acceptance_criteria>
- Files exist
- npm run build exits 0
- /don-vi-chu-tri route registered
- Login as banql → page renders với 5 profiles từ seed
</acceptance_criteria>

<done_when>2 commits, tsc + build clean.</done_when>
</task>

<verification>
After all tasks: run `npm run build` exit 0. Update STATE.md (plan 2/2 complete in Phase 4), ROADMAP.md, REQUIREMENTS.md (mark ORG-01..08 complete via gsd-tools requirements complete).
</verification>
