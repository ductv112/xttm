---
phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì
plan: 02
subsystem: ui
tags: [react, rhf, tiptap, shadcn, tanstack-table, server-actions, file-upload, drag-drop]

requires:
  - phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì
    provides: 9 server actions (getOrCreateMyProfile, updateMyProfile, submitMyProfile, uploadProfileDocument, deleteProfileDocument, addContact/updateContact/deleteContact, listOrgProfiles, getOrgProfileDetail, approveOrgProfile, rejectOrgProfile) + state machine + types module
  - phase: 02-m1-quan-tri-danh-muc
    provides: shared UI primitives (DataTable, RichTextEditor, ConfirmDialog, EmptyState, StatusBadge)

provides:
  - "/don-vi-cua-toi page (DONVI self-service): 4 form sections (legal info / capabilities / contacts / documents) + sidebar (submit + timeline)"
  - "/don-vi-chu-tri page (BQL inbox): tabs filter + DataTable + ProfileDetailSheet drawer"
  - "Auto-save pattern: debounce 1s sau khi user dừng tương tác → call server action với section payload + SaveIndicator UI feedback"
  - "Frozen state UI: status === 'SUBMITTED' → readOnly toàn bộ + amber banner ở top"
  - "Approval flow UI: SUBMITTED state → drawer footer 2 buttons (Phê duyệt / Từ chối) → ConfirmDialog hoặc Dialog với reason"

affects: [phase-05 đề án (gating render khi APPROVED), phase-04 inbox UI (notifications dispatch reuse)]

tech-stack:
  added: []
  patterns:
    - "Section-based RHF auto-save: useForm + form.watch subscription + debounceRef + safeParse-before-save (skip nếu validate fail) + lastSavedRef ref tránh save trùng"
    - "URL search params drive list filter (status default SUBMITTED, search) — bookmarkable, browser nav friendly (consistent với /chuong-trinh pattern Phase 3)"
    - "RoleOnly menu filter: lib/permissions.ts getMenuItems honors optional MenuItem.roleOnly array để cùng 1 resource map sang URL khác nhau theo role (ADMIN/BANQL/LANHDAO → /don-vi-chu-tri, DONVI → /don-vi-cua-toi)"
    - "Sheet drawer profile detail: lazy load detail qua server action khi open + Skeleton fallback + footer 2 actions chỉ render khi state === SUBMITTED"
    - "Inline CRUD pattern (contacts): table rows + Dialog form add/edit + ConfirmDialog destructive cho delete; component owns local state mirror server response"

key-files:
  created:
    - "app/(app)/don-vi-cua-toi/page.tsx (RSC, RBAC chỉ DONVI, 2-col layout)"
    - "app/(app)/don-vi-cua-toi/_components/LegalInfoForm.tsx (RHF + Zod + auto-save 1s debounce)"
    - "app/(app)/don-vi-cua-toi/_components/CapabilitiesForm.tsx (RichTextEditor + textarea + inline pastProjects table)"
    - "app/(app)/don-vi-cua-toi/_components/ContactsManager.tsx (table + Dialog form + ConfirmDialog + max 20)"
    - "app/(app)/don-vi-cua-toi/_components/DocumentsManager.tsx (drag-drop + grid + max 10)"
    - "app/(app)/don-vi-cua-toi/_components/SubmitButton.tsx (validateGuards bullet list + ConfirmDialog)"
    - "app/(app)/don-vi-cua-toi/_components/RejectionAlert.tsx (red Alert)"
    - "app/(app)/don-vi-cua-toi/_components/ProfileTimeline.tsx (vertical timeline 5 event types)"
    - "app/(app)/don-vi-chu-tri/page.tsx (RSC, BQL list, tabs filter via URL params)"
    - "app/(app)/don-vi-chu-tri/_components/OrgProfileTable.tsx (DataTable + tabs + search)"
    - "app/(app)/don-vi-chu-tri/_components/ProfileDetailSheet.tsx (640px drawer + sections + footer actions)"
    - "app/(app)/don-vi-chu-tri/_components/ApproveDialog.tsx (ConfirmDialog wrapper)"
    - "app/(app)/don-vi-chu-tri/_components/RejectDialog.tsx (Dialog + textarea reason ≥10/≤2000 chars)"
  modified:
    - "lib/permissions.ts (MenuItem.roleOnly field + 2 menu entries cho /don-vi-cua-toi và /don-vi-chu-tri tách theo role)"
    - "lib/breadcrumbs.ts (thêm /don-vi-cua-toi label)"
    - "app/(app)/don-vi-chu-tri/_actions/list.ts (Rule 1 fix: dùng parseCapabilities thay inline IIFE — fix TS implicit-any)"

key-decisions:
  - "Auto-save thay 'Save button' rõ ràng — UX fluid hơn cho form dài, charCount realtime + SaveIndicator giảm anxiety user về việc lưu thủ công"
  - "Section-based update API thay full-profile patch — Plan 04-01 update.ts accept input?.legalInfo / input?.capabilities / input?.contacts riêng biệt; mỗi component owns 1 section + auto-save chỉ section của mình"
  - "ContactsManager dùng custom Dialog form thay RHF resolver — local state đơn giản hơn cho 5 fields, validate inline (VN_PHONE_REGEX + EMAIL_REGEX) đủ; tránh import zodResolver thừa"
  - "ProfileDetailSheet client-side fetch (không pass props từ parent) — open per-row, mỗi click trigger getOrgProfileDetail fresh data, Skeleton fallback cho perceived speed"
  - "/don-vi-cua-toi separate route từ /don-vi-chu-tri — concept khác nhau (self-service vs admin inbox), URL Vietnamese reflect mô hình mental của user; menu filter qua roleOnly"
  - "DataTable client-only mode với data đã filter từ server (no pagination) — POC scale ≤50 rows; production sẽ cần server-side paginate khi >100 đơn vị"

patterns-established:
  - "Pattern A: Auto-save debounce — useForm + form.watch + setTimeout 1s + safeParse skip + lastSavedRef tránh redundant save (dùng cho mọi form section dài Phase tiếp theo)"
  - "Pattern B: roleOnly menu filter — cho phép nhiều menu entries trỏ tới resource giống nhau với label khác theo vai trò"
  - "Pattern C: Drawer detail load on demand — Sheet open trigger server action fetch, Skeleton placeholder, lazy footer actions"
  - "Pattern D: validateGuards client mirror — chạy cùng validateGuards trên client để hiển thị bullet list errors trước khi gọi submit; server tái validate là authoritative"

requirements-completed: [ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08]

duration: 22m
completed: 2026-04-30
---

# Phase 04 Plan 02: UI pages — đơn vị tự sửa hồ sơ + BQL approval Summary

**Self-service hồ sơ tổ chức tại /don-vi-cua-toi với 4 sections auto-save + drag-drop upload, parallel với BQL inbox tại /don-vi-chu-tri (tabs filter + drawer detail + approve/reject dialogs).**

## Performance

- **Duration:** 22 min
- **Started:** 2026-04-30T22:14:00Z (approx)
- **Completed:** 2026-04-30T22:36:00Z (approx)
- **Tasks:** 2 (5 commits split per plan)
- **Files modified:** 16 (3 modified + 13 created)

## Accomplishments

- /don-vi-cua-toi (DONVI page): RSC layout 2-col, 4 form sections với auto-save 1s debounce + SaveIndicator (idle/saving/saved/error), RichTextEditor cho mô tả năng lực với charCount realtime ≥50 chars, inline pastProjects table max 20, ContactsManager với add/edit Dialog + delete ConfirmDialog max 20, DocumentsManager với drag-drop area + pendingFile preview + grid hiển thị docs với mime icons
- /don-vi-chu-tri (BQL page): RSC list với tabs filter (Chờ duyệt/Đã duyệt/Yêu cầu bổ sung/Đang khai báo/Tất cả) URL-driven, search input, DataTable, ProfileDetailSheet drawer 640px lazy load với getOrgProfileDetail, ApproveDialog (ConfirmDialog wrapper), RejectDialog với textarea reason ≥10/≤2000 chars + charCount realtime
- Cross-cutting: lib/permissions.ts MenuItem.roleOnly field cho phép cùng resource 'don-vi-chu-tri' nhưng menu entry khác URL theo role (DONVI → /don-vi-cua-toi, ADMIN/BANQL/LANHDAO → /don-vi-chu-tri); RBAC defense-in-depth 3 layers
- Build clean (npm run build exit 0): /don-vi-cua-toi 14.3kB / 378kB First Load, /don-vi-chu-tri 11.4kB / 238kB

## Task Commits

1. **Task 1 chunk 1: page shell + LegalInfoForm + CapabilitiesForm** — `079f7a8` (feat)
2. **Task 1 chunk 2: ContactsManager + DocumentsManager** — `13c20ca` (feat)
3. **Task 1 chunk 3: SubmitButton + ProfileTimeline** — `2799528` (feat)
4. **Task 2 chunk 1: /don-vi-chu-tri page + OrgProfileTable** — `e559efa` (feat)
5. **Task 2 chunk 2: ProfileDetailSheet + ApproveDialog + RejectDialog** — `3909178` (feat)

## Files Created/Modified

### Created (13)
- `app/(app)/don-vi-cua-toi/page.tsx` (RSC, RBAC DONVI-only, 2-col layout)
- `app/(app)/don-vi-cua-toi/_components/LegalInfoForm.tsx` (RHF + Zod + auto-save)
- `app/(app)/don-vi-cua-toi/_components/CapabilitiesForm.tsx` (RichTextEditor + pastProjects table)
- `app/(app)/don-vi-cua-toi/_components/ContactsManager.tsx` (table + Dialog form + max 20)
- `app/(app)/don-vi-cua-toi/_components/DocumentsManager.tsx` (drag-drop + grid + max 10)
- `app/(app)/don-vi-cua-toi/_components/SubmitButton.tsx` (validateGuards bullet list)
- `app/(app)/don-vi-cua-toi/_components/RejectionAlert.tsx` (red Alert)
- `app/(app)/don-vi-cua-toi/_components/ProfileTimeline.tsx` (vertical timeline)
- `app/(app)/don-vi-chu-tri/page.tsx` (RSC, BQL inbox)
- `app/(app)/don-vi-chu-tri/_components/OrgProfileTable.tsx` (DataTable + tabs)
- `app/(app)/don-vi-chu-tri/_components/ProfileDetailSheet.tsx` (drawer)
- `app/(app)/don-vi-chu-tri/_components/ApproveDialog.tsx`
- `app/(app)/don-vi-chu-tri/_components/RejectDialog.tsx`

### Modified (3)
- `lib/permissions.ts` — MenuItem.roleOnly field + 2 menu entries (DONVI → /don-vi-cua-toi, ADMIN/BANQL/LANHDAO → /don-vi-chu-tri)
- `lib/breadcrumbs.ts` — thêm /don-vi-cua-toi label
- `app/(app)/don-vi-chu-tri/_actions/list.ts` — đổi inline IIFE parse capabilities sang parseCapabilities helper (fix TS implicit-any)

## Decisions Made

- **Auto-save thay Save button**: Form dài 4 sections + section update API riêng → auto-save 1s debounce mỗi section UX fluid hơn, SaveIndicator + charCount realtime giảm anxiety user. Server action update.ts whitelist Zod đảm bảo data integrity dù client autosave aggressively.
- **roleOnly menu filter**: Cùng resource 'don-vi-chu-tri' nhưng URL khác nhau theo role; thay vì branch logic trong sidebar component, lib/permissions.ts MenuItem.roleOnly array là source of truth (consistent với pattern can() + getMenuItems).
- **Client-side fetch trong ProfileDetailSheet**: List page chỉ load summary rows; full profile (legalInfo + capabilities HTML + contacts + documents) lazy-loaded khi BQL click row → giảm initial payload, perceived snappiness qua Skeleton.
- **DataTable client-only mode**: POC scale ≤50 đơn vị; server-side filter qua URL params đủ; pagination state để default values (pageIndex=0, pageSize=50) không gây visual glitch. Production sẽ replace khi >100 rows.
- **Custom Dialog form thay RHF cho ContactsManager**: 5 fields đơn giản, local state với validate inline gọn hơn import resolver; vẫn enforce VN_PHONE_REGEX + EMAIL_REGEX mirror server schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fix TS implicit-any trong getOrgProfileDetail return type**
- **Found during:** Task 2 (BQL UI build)
- **Issue:** `app/(app)/don-vi-chu-tri/_actions/list.ts` dùng inline IIFE `(() => { try { JSON.parse(...) } catch { return {} } })()` để parse capabilitiesJson trả type `{}` (vì TS không infer được nhánh return từ catch). Khi `ProfileDetailSheet.tsx` map qua `detail.capabilities.pastProjects.map((p, i) => ...)` thì TS báo `parameter 'p' implicitly has 'any' type`.
- **Fix:** Đổi inline IIFE sang `parseCapabilities(profile.capabilitiesJson)` helper từ lib/workflows/orgProfile (đã có sẵn type signature `OrgProfileCapabilities`).
- **Files modified:** app/(app)/don-vi-chu-tri/_actions/list.ts
- **Verification:** `npx tsc --noEmit` exit 0
- **Committed in:** e559efa (Task 2 chunk 1 commit)

---

**Total deviations:** 1 auto-fixed (1 type bug)
**Impact on plan:** Necessary type fix, no scope creep. Helper đã được tạo trong Plan 04-01 chỉ là chưa được dùng ở đây — đây là sự nhất quán muộn.

## Issues Encountered

None — UI build straightforward sau khi server actions có sẵn.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 5 (M2.3 Đề án) ready: gating render "Tạo đề án mới" có thể check `OrganizationProfile.status === 'APPROVED'` qua getOrCreateMyProfile / direct query
- Inbox UI Phase 4+ ready: Notification + NotificationDispatch records đã được seed bởi submit/approve/reject actions với recipientType ORGANIZATION/USER + sentAt timestamp; Phase tiếp có thể list notifications by user để render inbox
- UAT pending: cần manual login donvi1 → /don-vi-cua-toi để verify auto-save UX, login banql → /don-vi-chu-tri để verify approve/reject flow + email notification visible (mock)

## Self-Check: PASSED

Files verified to exist:
- FOUND: app/(app)/don-vi-cua-toi/page.tsx
- FOUND: app/(app)/don-vi-cua-toi/_components/LegalInfoForm.tsx
- FOUND: app/(app)/don-vi-cua-toi/_components/CapabilitiesForm.tsx
- FOUND: app/(app)/don-vi-cua-toi/_components/ContactsManager.tsx
- FOUND: app/(app)/don-vi-cua-toi/_components/DocumentsManager.tsx
- FOUND: app/(app)/don-vi-cua-toi/_components/ProfileTimeline.tsx
- FOUND: app/(app)/don-vi-cua-toi/_components/SubmitButton.tsx
- FOUND: app/(app)/don-vi-cua-toi/_components/RejectionAlert.tsx
- FOUND: app/(app)/don-vi-chu-tri/page.tsx
- FOUND: app/(app)/don-vi-chu-tri/_components/OrgProfileTable.tsx
- FOUND: app/(app)/don-vi-chu-tri/_components/ProfileDetailSheet.tsx
- FOUND: app/(app)/don-vi-chu-tri/_components/ApproveDialog.tsx
- FOUND: app/(app)/don-vi-chu-tri/_components/RejectDialog.tsx

Commits verified:
- FOUND: 079f7a8 (Task 1 chunk 1)
- FOUND: 13c20ca (Task 1 chunk 2)
- FOUND: 2799528 (Task 1 chunk 3)
- FOUND: e559efa (Task 2 chunk 1)
- FOUND: 3909178 (Task 2 chunk 2)

Verification commands:
- `npx tsc --noEmit` exit 0
- `npm run build` exit 0 (both /don-vi-cua-toi và /don-vi-chu-tri routes registered)

---
*Phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì*
*Completed: 2026-04-30*
