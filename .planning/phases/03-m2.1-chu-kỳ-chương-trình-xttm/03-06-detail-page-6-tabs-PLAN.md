---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 06
type: execute
wave: 3
depends_on: [01, 02, 03]
files_modified:
  - app/(app)/chuong-trinh/[id]/layout.tsx
  - app/(app)/chuong-trinh/[id]/page.tsx
  - app/(app)/chuong-trinh/[id]/cau-hinh/page.tsx
  - app/(app)/chuong-trinh/[id]/cong-van/page.tsx
  - app/(app)/chuong-trinh/[id]/don-vi-moi/page.tsx
  - app/(app)/chuong-trinh/[id]/de-an/page.tsx
  - app/(app)/chuong-trinh/[id]/nhat-ky/page.tsx
  - app/(app)/chuong-trinh/[id]/_components/CycleDetailHeader.tsx
  - app/(app)/chuong-trinh/[id]/_components/CycleTabsNav.tsx
  - app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx
  - app/(app)/chuong-trinh/[id]/_components/CauHinhKyForm.tsx
  - app/(app)/chuong-trinh/[id]/_components/CongVanUploadTab.tsx
  - app/(app)/chuong-trinh/[id]/_components/PdfPreview.tsx
  - app/(app)/chuong-trinh/[id]/_components/DonViMoiManager.tsx
  - app/(app)/chuong-trinh/[id]/_components/InvitationComposer.tsx
  - app/(app)/chuong-trinh/[id]/_components/VariableMenu.tsx
  - app/(app)/chuong-trinh/[id]/_components/DispatchHistoryList.tsx
  - app/(app)/chuong-trinh/[id]/_components/DeAnEmptyState.tsx
  - app/(app)/chuong-trinh/[id]/_components/CycleAuditLogTab.tsx
  - app/api/file/[attachmentId]/route.ts
autonomous: false
requirements:
  - CYCLE-03
  - CYCLE-04
  - CYCLE-06
  - CYCLE-07
  - CYCLE-12
  - CYCLE-13
  - CYCLE-14
tags: [detail-page, six-tabs, sub-routes, react-flow-render, tiptap-composer, pdf-preview, hero-flow]
user_setup: []

must_haves:
  truths:
    - "Route /chuong-trinh/[id] với 6 sub-routes deep-linkable: Tổng quan (default), Cấu hình kỳ, Công văn, Đơn vị mời, Đề án đăng ký (empty state), Nhật ký"
    - "Header sticky với tên cycle + status badge + năm + button quay lại"
    - "Tab Tổng quan: ProgramCycleStateMachineVisual (Plan 03-02) + 4 StatCard grid + recent activity timeline (top 5 dispatches/audit entries)"
    - "Tab Cấu hình kỳ: form chỉnh sửa các trường mốc thời gian + tiêu chí, ENABLED khi status='OPEN_REGISTRATION' (CYCLE-12); save triggers updateCycle action; hiển thị confirmDialog 'Gửi thông báo cho đơn vị mời?' nếu significantChange"
    - "Tab Công văn: drag-drop PDF upload area + metadata form (số/ngày/người ký/chức vụ) + iframe PDF preview + lịch sử công văn (Phase 3 chỉ 1 công văn)"
    - "Tab Đơn vị mời: 2 sections — danh sách đơn vị (CRUD) + composer Tiptap với variable menu + button gửi + lịch sử dispatch"
    - "Tab Đề án đăng ký: empty state 'Chưa có đề án đăng ký — Phase 5 sẽ thêm thực sự'"
    - "Tab Nhật ký: filter audit log scoped to programCycleId, reuse pattern Plan 02-01 audit table"
    - "API route /api/file/[attachmentId] serve file qua Response stream với auth check + content-type"
  artifacts:
    - path: "app/(app)/chuong-trinh/[id]/layout.tsx"
      provides: "Layout shared header + tabs nav across 6 sub-routes"
      min_lines: 50
    - path: "app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx"
      provides: "State machine visual + 4 stat cards + recent activity"
      min_lines: 120
    - path: "app/(app)/chuong-trinh/[id]/_components/CongVanUploadTab.tsx"
      provides: "Drag-drop area + metadata form + PDF iframe preview"
      min_lines: 150
    - path: "app/(app)/chuong-trinh/[id]/_components/InvitationComposer.tsx"
      provides: "Tiptap RichTextEditor + variable menu + send button"
      min_lines: 130
    - path: "app/api/file/[attachmentId]/route.ts"
      provides: "Auth-gated file serve from storage/uploads/"
      min_lines: 50
  key_links:
    - from: "app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx"
      to: "components/shared/program-cycle/ProgramCycleStateMachineVisual"
      via: "render visual với cycle.status"
      pattern: "ProgramCycleStateMachineVisual"
    - from: "app/(app)/chuong-trinh/[id]/_components/InvitationComposer.tsx"
      to: "app/(app)/chuong-trinh/_actions/send-invitation"
      via: "sendInvitation server action call"
      pattern: "sendInvitation"
    - from: "app/(app)/chuong-trinh/[id]/_components/CongVanUploadTab.tsx"
      to: "app/(app)/chuong-trinh/_actions/upload-cong-van"
      via: "uploadCongVan formData call"
      pattern: "uploadCongVan"
    - from: "app/api/file/[attachmentId]/route.ts"
      to: "node:fs/promises + storage/uploads/"
      via: "readFile + Response.arrayBuffer"
      pattern: "readFile"
---

<objective>
Trang chi tiết Chu kỳ Chương trình `/chuong-trinh/[id]` với 6 tabs sub-routes deep-linkable. Đây là HERO screen Phase 3 — nơi mọi nghiệp vụ vận hành chu kỳ diễn ra. CYCLE-03/04/06/07/12/13/14 — 7/15 phase requirements.

Purpose:
- Sub-routes thay vì client tabs để mọi tab bookmarkable + RSC initial fetch riêng từng tab
- Layout shared chứa header + tabs nav, mỗi tab page render content
- Tab Tổng quan = wow factor (state machine visual)
- Tab Đơn vị mời + thông báo = composer email Tiptap với variable menu (Phase 3 special)
- Tab Cấu hình kỳ enable edit khi OPEN (CYCLE-12)

Output: 1 layout + 6 sub-route pages + 12 client components + 1 API route; ~1500 LOC tổng, lớn nhất Phase 3.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-CONTEXT.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@.planning/phases/02-m1-quan-tri-danh-muc/02-01-audit-log-infrastructure-SUMMARY.md
@.planning/phases/02-m1-quan-tri-danh-muc/02-03-shared-ui-primitives-SUMMARY.md
@components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx
@components/shared/program-cycle/StatCard.tsx
@components/shared/RichTextEditor.tsx
@components/shared/StatusBadge.tsx
@components/shared/EmptyState.tsx
@components/shared/ConfirmDialog.tsx
@components/shared/MultiSelect.tsx
@lib/workflows/programCycle.ts
@lib/notifications.ts
@lib/format.ts

<interfaces>
From Plan 03-03:
- getCycleDetail(id): Promise of CycleDetail (cycle + invitationLetterAttachment + invitedOrganizations + dispatchSummary)
- updateCycle(input): Promise of { id, year, status, significantChange }
- uploadCongVan(cycleId, formData): Promise of { attachmentId, fileName, fileUrl, signedNumber }
- sendInvitation(input): Promise of { notificationId, dispatchCount, sentAt }

From Plan 03-01:
- ProgramCycleStatus + ALLOWED_NEXT_STATES + CYCLE_STATUS_LABELS

From Plan 03-02:
- ProgramCycleStateMachineVisual ({currentStatus, onTransitionClick?, readOnly?})
- StatCard ({label, value, icon?, tone?, subtitle?, trend?})

From Phase 2:
- RichTextEditor ({value, onChange, variables?, ...}) — Tiptap với VariableMenu integration
- StatusBadge, EmptyState, ConfirmDialog, MultiSelect
- listAuditLogs (scoped to filter)

VARIABLES cho composer: { tenChuongTrinh, namKy, hanNopHoSo, tenDonVi, nguoiKy, ngayKyCongVan, soCongVan } — exemplar values from cycle data
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Layout + header + tabs nav + Tab Tổng quan + page redirect</name>
  <files>app/(app)/chuong-trinh/[id]/layout.tsx, app/(app)/chuong-trinh/[id]/page.tsx, app/(app)/chuong-trinh/[id]/_components/CycleDetailHeader.tsx, app/(app)/chuong-trinh/[id]/_components/CycleTabsNav.tsx, app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx</files>
  <behavior>
    - layout.tsx: RSC, params: Promise of { id: string } (Next 15)
    - RBAC chain: auth → role → canFromDB('chuong-trinh','read') → fetch cycle via getCycleDetail(id), throw 404 NotFound nếu null (use Next 15 notFound() helper)
    - Render <div className="container mx-auto py-8 max-w-7xl"><CycleDetailHeader cycle={cycle} canEdit={canEdit} /><CycleTabsNav cycleId={id} /><div className="mt-6">{children}</div></div>
    - canEdit = await canFromDB(role,'chuong-trinh','update')
    - Pass cycle prop tới layout via React context: tạo CycleDetailContext provider, layout wraps children. Children pages can useCycleDetail() hook to access. Note: Next layouts can't pass to child pages directly via props — use React context provider OR each page re-fetches getCycleDetail(id). Decision: each page re-fetches (cheap with prisma cache + Next dedup). Layout only shows header + tabs nav.
    - page.tsx (default = Tổng quan tab content): RSC fetch getCycleDetail(id) again (Next dedups in-flight requests in same render); render <TongQuanTab cycle={cycle} />
    - CycleDetailHeader.tsx: 'use client' OR RSC (no interactivity → RSC OK)
    - Layout: <header className="sticky top-14 z-10 border-b border-slate-200 bg-white py-4">: row 1 — back button "← Danh sách chu kỳ" → Link /chuong-trinh; row 2 — h1 cycle.name text-2xl font-semibold + subtitle "Năm {cycle.year} · {cycle.totalBudget formatVND}" + StatusBadge entity=PROGRAM_CYCLE status=cycle.status; right side spacer for action buttons (Plan 03-07 sẽ thêm)
    - For Phase 3 detail header, ALSO show: invitedOrgCount + projectCount summary inline text-sm text-slate-600
    - CycleTabsNav.tsx: 'use client' (uses usePathname để highlight active)
    - 6 tab links: Tổng quan (/chuong-trinh/{id}), Cấu hình kỳ (/chuong-trinh/{id}/cau-hinh), Công văn (/chuong-trinh/{id}/cong-van), Đơn vị mời (/chuong-trinh/{id}/don-vi-moi), Đề án đăng ký (/chuong-trinh/{id}/de-an), Nhật ký (/chuong-trinh/{id}/nhat-ky)
    - Render flex border-b border-slate-200, mỗi tab Link className conditional: active = 'border-b-2 border-blue-700 text-blue-700 px-4 py-3 -mb-px text-sm font-semibold' / inactive = 'px-4 py-3 text-sm text-slate-600 hover:text-blue-700 hover:bg-slate-50'
    - Active detection: usePathname() === tab.href hoặc startsWith for sub-paths
    - TongQuanTab.tsx: 'use client' OR RSC for static content, but ProgramCycleStateMachineVisual is 'use client' so prefer 'use client' for tab wrapper, OR leave 'server' wrapping + dynamic-import client component. Choose: keep TongQuanTab as RSC, render <ProgramCycleStateMachineVisual> inside (client boundary handled automatically by 'use client' directive in component file)
    - Layout sections:
      1. Section "Tiến trình chu kỳ" với ProgramCycleStateMachineVisual currentStatus={cycle.status} readOnly={true}
      2. Section "Tổng quan kỳ" with grid grid-cols-4 gap-6 of 4 StatCard:
         - StatCard "Tổng kinh phí dự kiến" value=formatVND(totalBudget) icon=Wallet tone=info
         - StatCard "Đề án đăng ký" value=projectCount + ' đề án' subtitle="Phase 5 sẽ có thực" icon=FileText tone=default
         - StatCard "Đơn vị mời" value={invitedOrgCount} subtitle={`${dispatchCount} đã gửi thông báo`} icon=Users tone=default
         - StatCard "Hạn còn lại" value=daysRemaining + ' ngày' tone={daysRemaining<=7?'warning':'default'} subtitle={formatDate(registrationCloseAt)} icon=Calendar (only render if status=OPEN_REGISTRATION)
      3. Section "Hoạt động gần đây" timeline list 5 most recent: dispatches + audit entries (filter audit by resource='chuong-trinh' resourceId=cycleId via listAuditLogs from Plan 02-01; merge with dispatchSummary from getCycleDetail). Each entry: icon + text "Người dùng X — hành động — thời gian relative"
  </behavior>
  <action>
    1. Create layout.tsx
    2. Create page.tsx (Tổng quan default)
    3. Create CycleDetailHeader
    4. Create CycleTabsNav
    5. Create TongQuanTab
    6. tsc --noEmit + build
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['layout','page'].forEach(f=>console.log('top/'+f+':',require('fs').existsSync('app/(app)/chuong-trinh/[id]/'+f+'.tsx')));['CycleDetailHeader','CycleTabsNav','TongQuanTab'].forEach(f=>console.log('comp/'+f+':',require('fs').existsSync('app/(app)/chuong-trinh/[id]/_components/'+f+'.tsx')))"</automated>
  </verify>
  <done>
    - Layout với header + tabs nav rendered shared across 6 routes
    - page.tsx (Tổng quan) renders 3 sections: state machine + 4 stat cards + activity timeline
    - tsc pass
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Tab Cấu hình kỳ (form edit) + Tab Công văn (upload + preview) + API file route</name>
  <files>app/(app)/chuong-trinh/[id]/cau-hinh/page.tsx, app/(app)/chuong-trinh/[id]/cong-van/page.tsx, app/(app)/chuong-trinh/[id]/_components/CauHinhKyForm.tsx, app/(app)/chuong-trinh/[id]/_components/CongVanUploadTab.tsx, app/(app)/chuong-trinh/[id]/_components/PdfPreview.tsx, app/api/file/[attachmentId]/route.ts</files>
  <behavior>
    - cau-hinh/page.tsx RSC: fetch cycle via getCycleDetail; load scoringCriteria + organizations + emailTemplates server-side; render <CauHinhKyForm cycle={cycle} ... canEdit={canEdit} />
    - CauHinhKyForm.tsx: 'use client'
    - useForm với zodResolver(UpdateCycleSchema) — schema imported từ Plan 03-04 schemas.ts (re-export from there OR redefine here — prefer reuse via import from @/app/(app)/chuong-trinh/new/_lib/schemas)
    - defaultValues from cycle data (parse configJson → scoringCriteriaIds/etc.)
    - Layout: 4 sections same as wizard step 2-4 but inline (no stepper):
      1. "Mốc thời gian" 3x2 date pickers
      2. "Cấu hình tiêu chí" 2 MultiSelects
      3. "Đơn vị mời" 2 MultiSelects (organizations + email templates)
      4. (NEW) "Thông tin chung" — name + description + totalBudget editable
    - Disabled state: if !canEdit OR cycle.status NOT IN ['DRAFT','READY','OPEN_REGISTRATION'] → all fields disabled với banner top "Không thể chỉnh sửa khi chu kỳ ở trạng thái {label}". (CYCLE-12 cho phép sửa khi OPEN; DRAFT/READY cũng cho)
    - Submit handler: call updateCycle({id, ...formData}), if result.significantChange + cycle.status === 'OPEN_REGISTRATION' → useConfirmDialog (imperative hook from Phase 2) → "Bạn vừa thay đổi mốc thời gian hoặc tiêu chí. Gửi thông báo cho danh sách đơn vị đã được mời để cập nhật?" → if confirm, call sendInvitation với template auto-populated "Cập nhật cấu hình chu kỳ năm {year}"
    - Toast feedback: 'Đã cập nhật cấu hình chu kỳ' / on dispatch sent: 'Đã gửi thông báo cho {n} đơn vị'
    - cong-van/page.tsx RSC: fetch cycle + invitationLetterAttachment; render <CongVanUploadTab cycle={cycle} attachment={attachment} canEdit={canEdit} />
    - CongVanUploadTab.tsx: 'use client'
    - 2 sections layout:
      1. Top "Tải lên công văn ban hành" (always shown if no attachment yet, OR if canEdit + status DRAFT/READY allow re-upload — Phase 3 simplification: only allow upload if attachment === null; else show "Đã upload, không cho thay đổi" — Phase 8 amendment workflow)
      2. Bottom "Công văn hiện tại" (show if attachment exists)
    - Upload UI: drag-drop zone <div onDragOver/onDrop> styled border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-700 + <input type="file" accept="application/pdf" hidden ref={fileRef} /> + "Kéo thả PDF vào đây hoặc click để chọn" CTA
    - When file selected: preview file name + size; show metadata form (4 fields: signedNumber, signedDate Date Picker, signedByName, signedByTitle); submit button "Tải lên công văn"
    - Submit: build FormData('file', file, plus metadata fields), call uploadCongVan(cycleId, formData), on success toast + revalidate; on error display VN error
    - Bottom section "Công văn hiện tại": Card layout — left: PDF iframe preview + right: metadata table (Số công văn, Ngày ký, Người ký, Chức vụ) + button "Tải về" → window.open(/api/file/{attachmentId})
    - PdfPreview.tsx: 'use client', simple wrapper <iframe src={`/api/file/${attachmentId}`} className="w-full h-[600px] rounded-lg border border-slate-200" sandbox="" title="Xem trước công văn" />
    - app/api/file/[attachmentId]/route.ts: GET handler
    - Auth check: import auth, if !session return new Response('Yêu cầu đăng nhập', {status:401})
    - Load attachment via prisma.attachment.findUnique({where:{id: params.attachmentId}}); if null return 404
    - Permission: load via attachment.entityType='ProgramCycle' check role can read 'chuong-trinh' (or for other entities, dispatch by entityType — Phase 3 only handles ProgramCycle)
    - Resolve absolute path: const filePath = path.join(process.cwd(), attachment.fileUrl) — fileUrl đã có prefix 'storage/uploads/...'; verify path doesn't escape storage dir (security check)
    - Read file: fs.readFile(filePath); return new Response(buffer, {headers: {'Content-Type': attachment.mimeType ?? 'application/octet-stream', 'Content-Disposition': `inline; filename="${attachment.fileName}"`}})
    - Edge case: file missing on disk → return 404 với VN message "Tệp không tồn tại trên hệ thống"
  </behavior>
  <action>
    1. Create cau-hinh/page.tsx + CauHinhKyForm
    2. Create cong-van/page.tsx + CongVanUploadTab + PdfPreview
    3. Create app/api/file/[attachmentId]/route.ts
    4. tsc + build verify
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "console.log('cau-hinh/page:',require('fs').existsSync('app/(app)/chuong-trinh/[id]/cau-hinh/page.tsx'));console.log('cong-van/page:',require('fs').existsSync('app/(app)/chuong-trinh/[id]/cong-van/page.tsx'));console.log('api/file:',require('fs').existsSync('app/api/file/[attachmentId]/route.ts'))" &amp;&amp; npm run build 2&gt;&amp;1 | tail -10</automated>
  </verify>
  <done>
    - 6 files created
    - CauHinhKyForm với conditional disable based on status + significantChange dispatch prompt
    - CongVanUploadTab với drag-drop + iframe preview
    - API file route with auth + path safety
    - npm run build pass
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Tab Đơn vị mời + composer Tiptap + VariableMenu + dispatch history</name>
  <files>app/(app)/chuong-trinh/[id]/don-vi-moi/page.tsx, app/(app)/chuong-trinh/[id]/_components/DonViMoiManager.tsx, app/(app)/chuong-trinh/[id]/_components/InvitationComposer.tsx, app/(app)/chuong-trinh/[id]/_components/VariableMenu.tsx, app/(app)/chuong-trinh/[id]/_components/DispatchHistoryList.tsx</files>
  <behavior>
    - don-vi-moi/page.tsx RSC: fetch cycle + organizations + dispatch history; render <DonViMoiManager />
    - DonViMoiManager.tsx: 'use client'
    - 2-column layout lg:grid-cols-2 gap-6:
      - Left: "Danh sách đơn vị mời" — show invitedOrganizations as list with × button to remove + button "Thêm đơn vị" opens MultiSelect dialog. On apply update via updateCycle({id, invitedOrganizationIds: newIds})
      - Right: "Soạn thông báo gửi" — InvitationComposer
    - Below: "Lịch sử thông báo đã gửi" — DispatchHistoryList
    - InvitationComposer.tsx: 'use client'
    - State: subject (Input), contentHtml (RichTextEditor)
    - Default subject template: "Mời đăng ký Chương trình XTTM Quốc gia năm {namKy}"
    - Default content template: load từ emailTemplate (cycle.configJson.emailTemplateIds[0]) hoặc fallback default 4 paragraphs với {tenDonVi}, {tenChuongTrinh}, {hanNopHoSo}, {nguoiKy}
    - VARIABLES const: [{key:'tenChuongTrinh', label:'Tên chương trình', exampleValue: cycle.name}, {key:'namKy', label:'Năm chu kỳ', exampleValue: cycle.year}, {key:'hanNopHoSo', label:'Hạn nộp hồ sơ', exampleValue: formatDate(cycle.registrationCloseAt)}, {key:'tenDonVi', label:'Tên đơn vị', exampleValue:'Quý đơn vị'}, {key:'nguoiKy', label:'Người ký', exampleValue: attachment?.signedByName ?? 'Cục trưởng'}, {key:'soCongVan', label:'Số công văn', exampleValue: attachment?.signedNumber ?? '...'}, {key:'ngayKyCongVan', label:'Ngày ký công văn', exampleValue: formatDate(attachment?.signedDate)}]
    - RichTextEditor variables prop = VARIABLES (Phase 2 RichTextEditor đã support variable menu) — variable insertion via {{key}} syntax in editor body
    - Preview button: opens Sheet với Tiptap output rendered as HTML, substituted with mock VARIABLES via split().join() (T-03-06 mitigation reuse from Phase 2 Plan 02-06): for each variable, replace `{{key}}` with `<strong>${exampleValue}</strong>` (or plain value)
    - "Gửi thông báo cho [N] đơn vị" button: confirm via ConfirmDialog "Bạn sắp gửi thông báo cho {invitedOrgCount} đơn vị. Tiếp tục?"; on confirm call sendInvitation({cycleId, subject, contentHtml, recipientOrgIds: invitedOrganizationIds, notificationType:'CYCLE_INVITATION'}); show progress 'Đang gửi...' (motion fake animation 1.2s for UX feel) then toast 'Đã gửi thông báo cho {n} đơn vị'
    - Rate limit: if server returns rate-limit error, show inline "Vui lòng đợi 5 phút trước khi gửi lại"
    - VariableMenu.tsx: helper component — Phase 2 RichTextEditor đã có VariableMenu integrated, but if Phase 3 needs richer UX (popover w/ search), build standalone here. SIMPLE PATH: reuse RichTextEditor variables prop; no separate VariableMenu component needed at this level. SKIP file or make it a 10-line re-export.
    - DispatchHistoryList.tsx: 'use client'
    - Receives dispatchSummary from props (from getCycleDetail)
    - Render simple list: each entry — subject + type label + createdAt formatRelative + dispatchCount badge "{n} đơn vị" + click expand to show recipients (defer expand for v1: just summary line)
    - Empty state: "Chưa có thông báo nào được gửi" với illustration
  </behavior>
  <action>
    1. Create don-vi-moi/page.tsx + DonViMoiManager
    2. Create InvitationComposer (largest file in this task)
    3. Skip VariableMenu standalone (reuse RichTextEditor variables prop)
    4. Create DispatchHistoryList
    5. tsc + build
    6. Manual smoke: visit /chuong-trinh/{cycle2026}/don-vi-moi → verify 5 đơn vị shown + composer with variables auto-prefill
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "console.log('don-vi-moi:',require('fs').existsSync('app/(app)/chuong-trinh/[id]/don-vi-moi/page.tsx'));['DonViMoiManager','InvitationComposer','DispatchHistoryList'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/[id]/_components/'+f+'.tsx')))" &amp;&amp; npm run build 2&gt;&amp;1 | tail -5</automated>
  </verify>
  <done>
    - 4-5 files created
    - InvitationComposer wires Tiptap + variables + send button + rate limit handling
    - DispatchHistoryList shows dispatch summary
    - npm run build pass
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Tab Đề án (empty state) + Tab Nhật ký (audit log scoped)</name>
  <files>app/(app)/chuong-trinh/[id]/de-an/page.tsx, app/(app)/chuong-trinh/[id]/nhat-ky/page.tsx, app/(app)/chuong-trinh/[id]/_components/DeAnEmptyState.tsx, app/(app)/chuong-trinh/[id]/_components/CycleAuditLogTab.tsx</files>
  <behavior>
    - de-an/page.tsx RSC: trivial, render <DeAnEmptyState cycle={cycle} />
    - DeAnEmptyState.tsx: EmptyState wrap với icon='inbox' heading="Chưa có đề án nào đăng ký trong kỳ {year}" description="Khi đơn vị chủ trì nộp đề án (Phase 5 — M2.3), danh sách sẽ xuất hiện ở đây với filter + actions của Ban quản lý" — no CTA (Phase 5 sẽ enable submission flow)
    - For OPEN_REGISTRATION cycles, sub-text: "Đợt mời đề xuất {year} đang mở — hạn {date}. Đơn vị chủ trì có thể tạo đề án từ trang Đề án" với link disabled hint
    - nhat-ky/page.tsx RSC: fetch audit log scoped to programCycleId via listAuditLogs (Plan 02-01) with filter resource='chuong-trinh' resourceIds=[id]
    - Note: existing listAuditLogs filter shape uses resourceId? string in WHERE; verify filter accepts resourceId. If not, extend listAuditLogs filter to support resourceId in Plan 02-01 — but per Phase 2 SUMMARY filter has 6 fields including resourceId via keyword? Re-check: filter has userId, resources (array), actions (array), from, to, keyword (OR fullName + resourceId). Use keyword pre-pop to filter or add explicit resourceId field. SIMPLEST: use keyword=cycleId since prisma.auditLog has resourceId field and filter.keyword does OR match on resourceId. This works for Phase 3.
    - CycleAuditLogTab.tsx: 'use client', wraps existing AuditLogTable from Plan 02-01 (import path: @/app/(app)/nhat-ky/_components/AuditLogTable) with initial filter pre-populated cycleId; or create simpler local table specific to cycle scope
    - For Phase 3 simplification: render a small custom table directly here showing 6 columns (Time, User, Action, Diff summary, IP) — simpler than reusing full AuditLogTable
    - Layout: <div><h2>Nhật ký hoạt động chu kỳ</h2><table>...</table></div>; pagination 20/page (small scope)
    - For each log entry, render badge action (TRANSITION blue / UPDATE blue / UPLOAD slate / DISPATCH emerald / EXTEND amber) + diff summary từ diffJson (parse + show key changes only)
    - Empty state: "Chưa có nhật ký hoạt động cho chu kỳ này" với illustration
  </behavior>
  <action>
    1. Create de-an/page.tsx + DeAnEmptyState
    2. Create nhat-ky/page.tsx + CycleAuditLogTab
    3. tsc + build
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['de-an','nhat-ky'].forEach(t=>console.log(t+':',require('fs').existsSync('app/(app)/chuong-trinh/[id]/'+t+'/page.tsx')));['DeAnEmptyState','CycleAuditLogTab'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/[id]/_components/'+f+'.tsx')))" &amp;&amp; npm run build 2&gt;&amp;1 | tail -5</automated>
  </verify>
  <done>
    - 4 files created
    - All 6 sub-routes have a page.tsx
    - npm run build pass — all 6 routes registered
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 5: Manual UAT 6 tabs end-to-end</name>
  <files>app/(app)/chuong-trinh/[id]/* (6 sub-routes), app/api/file/[attachmentId]/route.ts</files>
  <action>Manual UAT — login banql, visit /chuong-trinh/{cycle 2026}, navigate qua 6 tabs verify content render đúng + dispatch composer test + công văn iframe + audit log entries</action>
  <verify><automated>echo "Manual checkpoint — see how-to-verify"</automated></verify>
  <done>User type "approved" hoặc record issues; ≥1 dispatch sent từ composer trong test cycle 2026</done>
  <what-built>Detail page /chuong-trinh/[id] với 6 sub-routes: Tổng quan (state machine + 4 stat cards + activity), Cấu hình kỳ (form edit), Công văn (upload + iframe preview), Đơn vị mời (composer Tiptap + dispatch), Đề án (empty state), Nhật ký (audit scoped)</what-built>
  <how-to-verify>
    1. npm run dev; login as banql
    2. Visit /chuong-trinh → click cycle 2026 OPEN_REGISTRATION → land at /chuong-trinh/{id}
    3. Tab Tổng quan: verify state machine 7 nodes hiển thị, OPEN_REGISTRATION ring blue, CLOSED_REGISTRATION emerald border (reachable). 4 StatCards với data thật. Activity timeline show 1+ dispatch + 1+ audit từ seed
    4. Click tab Cấu hình kỳ: form rendered, fields enabled (status OPEN allows edit). Đổi registrationCloseAt ngày khác → click Lưu → expect ConfirmDialog "Gửi thông báo cho đơn vị mời?" → click Xác nhận → toast 'Đã gửi'
    5. Click tab Công văn: thấy công văn hiện tại với iframe PDF preview (mock file path đã seed) + metadata 1234/CV-XTTM. Vì Phase 3 simplify chỉ cho upload nếu chưa có, nên upload area hidden
    6. Click tab Đơn vị mời: thấy 5 organizations VITAS/LEFASO/VINATEX/VASEP/VCCI; composer Tiptap với content auto-prefill template. Click variable menu → insert {tenDonVi} → preview tab show substituted text
    7. Click "Gửi thông báo" → confirm → toast 'Đã gửi thông báo cho 5 đơn vị'. Click lại sau <5 min → expect rate-limit error
    8. Click tab Đề án: empty state hiển thị "Chưa có đề án nào đăng ký trong kỳ 2026" + sub-text về OPEN_REGISTRATION
    9. Click tab Nhật ký: thấy ≥3 audit entries (CREATE seed, UPLOAD seed simulated, DISPATCH from step 7); badge colors đúng
    10. Visit /chuong-trinh/{cycle2027 DRAFT}: tab Cấu hình form fields ENABLED (DRAFT cho phép); state machine show DRAFT ring blue + READY emerald (reachable)
    11. Visit /chuong-trinh/{cycle2025 COMPLETED}: tab Cấu hình form DISABLED với banner "Không thể chỉnh sửa khi chu kỳ ở trạng thái Hoàn thành"
  </how-to-verify>
  <resume-signal>Type "approved" hoặc "issues: ..."</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL params [id] → server | Untrusted; Prisma findUnique returns null gracefully; notFound() throws 404 |
| Tiptap composer HTML output → server action | Untrusted but Plan 03-03 sendInvitation accepts HTML; rendering side (Plan 04 inbox) MUST sanitize via iframe sandbox |
| File API /api/file/[attachmentId] → disk read | Need path safety: attachment.fileUrl must not contain .. or absolute path |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-06-01 | I (Info disclosure) | /api/file/[id] reveals files to any authenticated user | mitigate | API route checks auth + reads attachment record; for ProgramCycle attachments, RBAC check 'chuong-trinh':'read' (all roles can read for POC); Phase 4+ entity-specific RBAC dispatch |
| T-03-06-02 | T (Path traversal) | attachment.fileUrl may contain ../ | mitigate | Prisma stored fileUrl always = 'storage/uploads/cong-van/{cycleId}/{uuid}.pdf' from upload action (Plan 03-03 generates UUID); API route does path.normalize + check startsWith(process.cwd() + '/storage/uploads/') trước fs.readFile |
| T-03-06-03 | I (XSS) | Tiptap output rendered in dispatch preview/inbox | mitigate | Preview Sheet uses iframe sandbox="" srcDoc (T-02-06 mitigation reuse); dispatched email never rendered in same-origin DOM |
| T-03-06-04 | T (CYCLE-12 unauthorized edit) | DONVI role calls updateCycle directly | mitigate | updateCycle server action (Plan 03-03) RBAC line 1 throws; UI button disabled is layer 2 |
| T-03-06-05 | D (Denial via composer) | Send invitation with 1MB Tiptap HTML | mitigate | Zod schema (Plan 03-03 sendInvitation) caps contentHtml at 50000 chars |
| T-03-06-06 | T (Variable injection) | User types literal `{{nguoiKy}}` in subject | accept | Subject is plain text; substitution happens only in preview rendering — no exec context; safe |
</threat_model>

<verification>
- All ~17 files exist
- npx tsc --noEmit pass
- npm run build pass; all 6 sub-routes /chuong-trinh/[id]/(default|cau-hinh|cong-van|don-vi-moi|de-an|nhat-ky) compiled
- Layout shared header + tabs nav across 6 routes (verify by visiting each)
- API /api/file/[id] route: grep "Content-Type" hit; grep "auth()" hit
- Manual UAT 11 steps all pass
</verification>

<success_criteria>
1. Detail page route /chuong-trinh/[id] với layout shared header (cycle name + status + back button) + tabs nav (6 sub-routes deep-linkable)
2. Tab Tổng quan default: ProgramCycleStateMachineVisual + 4 StatCard grid + recent activity timeline
3. Tab Cấu hình kỳ: form edit conditional disable based on status (CYCLE-12 enable khi OPEN); save triggers significantChange detection + ConfirmDialog gửi thông báo
4. Tab Công văn: drag-drop upload PDF với metadata form + iframe preview tham chiếu API /api/file/[id] auth-gated
5. Tab Đơn vị mời: 2-col layout — danh sách orgs (CRUD) + composer Tiptap với 7 variables ({tenChuongTrinh}, {namKy}, {hanNopHoSo}, {tenDonVi}, {nguoiKy}, {ngayKyCongVan}, {soCongVan}) + send button rate-limit aware
6. Tab Đề án: empty state với gating sub-text
7. Tab Nhật ký: audit log scoped to cycle với badge action colors
</success_criteria>

<output>
After completion, create `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-06-SUMMARY.md` theo template.
</output>
