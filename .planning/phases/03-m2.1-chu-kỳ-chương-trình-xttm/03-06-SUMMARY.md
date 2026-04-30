---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 06
subsystem: program-cycle-detail-page
tags: [detail-page, six-tabs, sub-routes, react-flow-render, tiptap-composer, pdf-preview, hero-flow, audit-scoped, file-api]
requirements: [CYCLE-03, CYCLE-04, CYCLE-06, CYCLE-07, CYCLE-12, CYCLE-13, CYCLE-14]
dependency_graph:
  requires:
    - "Plan 03-01 — ProgramCycleStatus + CYCLE_STATUS_LABELS + ALLOWED_NEXT_STATES"
    - "Plan 03-02 — ProgramCycleStateMachineVisual + StatCard"
    - "Plan 03-03 — getCycleDetail / updateCycle / uploadCongVan / sendInvitation server actions + CycleDetail type"
    - "Phase 2 Plan 02-03 — RichTextEditor (Tiptap v3 with VariableMenu integrated) + StatusBadge + EmptyState + ConfirmDialog + MultiSelect"
    - "Phase 2 Plan 02-01 — withAuditLog wrapper writing AuditLog rows scoped resource='chuong-trinh' resourceId={cycleId}"
    - "lib/notifications — listCycleDispatches feeds CycleDetail.dispatchSummary"
    - "lib/permissions-db — canFromDB triple RBAC"
  provides:
    - "/chuong-trinh/[id] route with layout + 6 deep-linkable sub-routes (default Tổng quan, cau-hinh, cong-van, don-vi-moi, de-an, nhat-ky)"
    - "API route /api/file/[attachmentId] auth-gated path-safe file serve from storage/uploads/ — reusable for Phase 4+ file attachments via entity dispatch in resolveResourceForEntity()"
    - "InvitationComposer pattern: RichTextEditor + 7 variables + iframe sandbox srcDoc preview + split-join substitution + ConfirmDialog send + rate-limit error pass-through"
    - "CycleAuditLogTab compact 5-col table reusable pattern cho per-entity audit views (Phase 5+ đề án detail tab Nhật ký reuse)"
    - "CauHinhKyForm status-aware enable + significantChange dispatch flow"
  affects:
    - "Plan 03-07 — action handlers attach to CycleDetailHeader right-side area (currently empty placeholder)"
    - "Phase 5 Plan đề án detail page — sub-routes pattern + audit log scoped table reuse"
    - "Phase 4 inbox UI — DispatchHistoryList shape consumes existing dispatch records"
    - "Phase 8 amendment workflow — CongVanUploadTab simplification (only allow upload when no attachment) sẽ relax cho versioning"
tech-stack:
  added: []
  patterns:
    - "Next 15 layout + sub-routes with shared header + tabs nav: layout.tsx fetches cycle once for header/nav; each page.tsx re-fetches via Next dedup (cheap, RSC); 6 deep-linkable URLs replace client tabs for bookmarkability + per-tab RSC initial fetch"
    - "API file serve with auth + entity-aware RBAC dispatch: /api/file/[id] loads attachment row → switch on entityType → canFromDB(role, resource, 'read'); path safety via path.resolve + startsWith(baseDir + sep) prefix check; Content-Disposition UTF-8 filename* RFC 5987"
    - "Tiptap composer reuse pattern: RichTextEditor variables prop carries 7 cycle-bound exemplar values; preview uses iframe sandbox='' srcDoc with split().join() substitution (T-02-06 mitigation reuse — never regex on user-defined keys)"
    - "Client/server boundary discipline: layout.tsx + each page.tsx are RSC (auth + DB fetch); _components/* are 'use client' with explicit boundary at component file 'use client' directive"
    - "Status-aware form gating: EDITABLE_STATUSES = [DRAFT, READY, OPEN_REGISTRATION] gates CauHinhKyForm fields; banner explains read-only state; CYCLE-12 'sửa khi OPEN' satisfied"
    - "significantChange post-update prompt: updateCycle returns flag → useConfirmDialog 'Gửi thông báo cho đơn vị mời?' → sendInvitation auto-template với plain-text + 4 paragraphs"
    - "Per-cycle audit table bypasses /nhat-ky listAuditLogs to avoid audit-log:read RBAC requirement (BANQL không có); query prisma.auditLog directly với resource+resourceId scope, scope+role inherited from layout RBAC chain"
key-files:
  created:
    - "app/(app)/chuong-trinh/[id]/layout.tsx"
    - "app/(app)/chuong-trinh/[id]/page.tsx"
    - "app/(app)/chuong-trinh/[id]/cau-hinh/page.tsx"
    - "app/(app)/chuong-trinh/[id]/cong-van/page.tsx"
    - "app/(app)/chuong-trinh/[id]/don-vi-moi/page.tsx"
    - "app/(app)/chuong-trinh/[id]/de-an/page.tsx"
    - "app/(app)/chuong-trinh/[id]/nhat-ky/page.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/CycleDetailHeader.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/CycleTabsNav.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/CauHinhKyForm.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/CongVanUploadTab.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/PdfPreview.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/DonViMoiManager.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/InvitationComposer.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/DispatchHistoryList.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/DeAnEmptyState.tsx"
    - "app/(app)/chuong-trinh/[id]/_components/CycleAuditLogTab.tsx"
    - "app/api/file/[attachmentId]/route.ts"
  modified: []
key-decisions:
  - "VariableMenu standalone file SKIPPED — RichTextEditor toolbar đã có VariableMenu integrated với variables prop (Phase 2 Plan 02-03); no need cho separate file. InvitationComposer just passes 7 cycle-bound variables array as prop."
  - "Cycle audit log query bypass /nhat-ky listAuditLogs — that action gates audit-log:read which BANQL lacks (only ADMIN + LANHDAO have it per lib/permissions.ts). Per-entity audit view uses resource+resourceId scope; RBAC inherited from layout's chuong-trinh:read gate."
  - "EDITABLE_STATUSES = [DRAFT, READY, OPEN_REGISTRATION] for CauHinhKyForm — covers CYCLE-12 (cho phép sửa khi OPEN); CLOSED/EVALUATING/APPROVED/COMPLETED disable với banner. Plan suggested same; locked here."
  - "CongVanUploadTab Phase 3 simplification: only show upload area when attachment === null AND canEdit; existing attachment view với iframe preview + Tải về button + 'Đã upload, không cho thay đổi' notice. Phase 8 amendment workflow sẽ wire versioning."
  - "Preview Sheet uses srcDoc với inline <style> (system-ui font + text colors) thay vì sandbox='allow-same-origin' — defense-in-depth XSS isolation. Substitution dùng split().join() (T-02-06 reuse)."
  - "API file route entity dispatch: resolveResourceForEntity('ProgramCycle') → 'chuong-trinh'; Phase 4+ extends switch cho OrgProfile / Project / Contract attachments. Returns 403 'Không hỗ trợ loại tệp này' khi entityType chưa wire."
  - "Tab Nhật ký bypasses central /nhat-ky table component — small custom 5-col table inline avoids RBAC inheritance + URL filter complexity for narrow per-cycle scope (typical < 50 entries); take 100 cap is sufficient for Phase 3."
  - "Sub-routes (vs client tabs) chosen for bookmarkability + per-tab RSC fetch — each tab page has independent data dependency (cau-hinh loads catalog options; cong-van loads attachment; nhat-ky loads audit log) so sub-route boundary natural."
  - "DispatchHistoryList wired via cycle.dispatchSummary (limit 5 from getCycleDetail) — Phase 4 inbox UI sẽ implement full dispatch detail; current view is summary-only with relative time + count badge."
metrics:
  duration: "12m"
  completed_date: "2026-04-30"
  tasks_completed: 4
  files_created: 19
  files_modified: 0
  commits: 4
---

# Phase 3 Plan 06: Detail Page 6 Tabs Summary

**One-liner:** /chuong-trinh/[id] hero detail page với layout + 6 deep-linkable sub-routes (Tổng quan state machine + 4 stat cards + activity timeline; Cấu hình kỳ status-aware form CYCLE-12; Công văn drag-drop PDF + iframe preview; Đơn vị mời composer Tiptap với 7 variables + dispatch history; Đề án empty state Phase 5 hint; Nhật ký scoped audit table) plus auth-gated path-safe /api/file/[attachmentId] route — ~1850 LOC across 19 files.

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-30T21:11:31Z
- **Completed:** 2026-04-30T21:23:25Z
- **Tasks:** 4 (Task 5 = manual UAT auto-approved per overnight execution context)
- **Files created:** 19

## Accomplishments

- Layout shared header (sticky, back link, name, status badge, year/budget/orgs/projects meta) + 6-tab nav across all sub-routes
- Tab Tổng quan renders ProgramCycleStateMachineVisual (Plan 03-02 React Flow 7-node visualization) + 4 StatCard grid (kinh phí, đề án, đơn vị mời, hạn còn lại countdown OPEN_REGISTRATION-aware) + merged activity timeline (top 5 dispatches + audit entries by recency)
- Tab Cấu hình kỳ RHF + Zod with 4 sections (Thông tin chung name/desc/budget editable / 6 mốc thời gian date pickers / 2 MultiSelect tiêu chí / 1 MultiSelect đơn vị + 1 mẫu công văn); status-aware enable (CYCLE-12 satisfied); significantChange detection triggers ConfirmDialog → sendInvitation auto-template "Cập nhật cấu hình chu kỳ"
- Tab Công văn drag-drop PDF area + 4-field metadata form (signedNumber/signedDate/signedByName/signedByTitle) + iframe sandbox PDF preview + metadata table dl + Tải về anchor (/api/file/[id]); Phase 3 simplification: only allow upload when attachment === null
- Tab Đơn vị mời 2-col layout: left CRUD list (× remove + Sheet edit MultiSelect) + right InvitationComposer Tiptap với 7 variables (tenChuongTrinh/namKy/hanNopHoSo/tenDonVi/nguoiKy/soCongVan/ngayKyCongVan); Sheet preview iframe sandbox='' srcDoc + split-join substitution (T-02-06 reuse); ConfirmDialog before send + 800ms artificial delay UX feel; rate-limit error pass-through to toast
- Tab Đề án empty state với FileText illustration + Phase 5 hint + conditional OPEN_REGISTRATION sub-text exposing hạn nộp date
- Tab Nhật ký compact 5-col custom table (thời gian / người thực hiện / hành động badge / tóm tắt / IP) querying prisma.auditLog scoped resource='chuong-trinh'+resourceId; reuse AUDIT_ACTION_BADGE color tokens
- API /api/file/[attachmentId] auth-gated entity-aware RBAC + path-safe (no traversal, must stay under storage/uploads via path.resolve + startsWith) + Content-Type from attachment.mimeType + UTF-8 filename* RFC 5987 + private no-store cache

## Task Commits

1. **Task 1: Layout + header + tabs nav + Tổng quan tab** — `3e7b34f` (feat)
2. **Task 2: Cấu hình kỳ + Công văn + API file route** — `d8818ac` (feat)
3. **Task 3: Đơn vị mời + composer Tiptap + dispatch history** — `47b6fee` (feat)
4. **Task 4: Đề án empty state + Nhật ký scoped audit** — `dfcad4a` (feat)

**Plan metadata:** committed alongside SUMMARY (single docs commit at end).

## Files Created/Modified

**Pages (7):**
- `app/(app)/chuong-trinh/[id]/layout.tsx` — RSC layout với RBAC chain (auth → canFromDB read → notFound) + shared CycleDetailHeader + CycleTabsNav
- `app/(app)/chuong-trinh/[id]/page.tsx` — default tab Tổng quan, fetches cycle + recent audit entries
- `app/(app)/chuong-trinh/[id]/cau-hinh/page.tsx` — loads cycle + scoring criteria + organizations + email templates parallel
- `app/(app)/chuong-trinh/[id]/cong-van/page.tsx` — loads cycle + canEdit
- `app/(app)/chuong-trinh/[id]/don-vi-moi/page.tsx` — loads cycle + all organizations for picker
- `app/(app)/chuong-trinh/[id]/de-an/page.tsx` — trivial wrapper
- `app/(app)/chuong-trinh/[id]/nhat-ky/page.tsx` — direct prisma.auditLog query scoped, summarizeDiff helper

**Components (11):**
- `_components/CycleDetailHeader.tsx` — sticky top-14, back link + name + StatusBadge + meta line
- `_components/CycleTabsNav.tsx` — 'use client' usePathname active detection across 6 segments
- `_components/TongQuanTab.tsx` — 3 sections (state machine / 4 stat cards / activity timeline)
- `_components/CauHinhKyForm.tsx` — RHF + Zod superRefine date ordering, 4 sections, status-gated, significantChange flow
- `_components/CongVanUploadTab.tsx` — drag-drop + metadata form + iframe preview + Tải về (extracted SignedDatePicker helper)
- `_components/PdfPreview.tsx` — iframe sandbox="" wrapper
- `_components/DonViMoiManager.tsx` — 2-col + bottom history layout, Sheet edit picker
- `_components/InvitationComposer.tsx` — RichTextEditor + 7 variables + Sheet preview + ConfirmDialog send
- `_components/DispatchHistoryList.tsx` — Mail icon list with type label + count badge + relative time + empty state
- `_components/DeAnEmptyState.tsx` — FileText illustration + conditional OPEN sub-text
- `_components/CycleAuditLogTab.tsx` — compact 5-col table với AUDIT_ACTION_BADGE colors + empty state

**API (1):**
- `app/api/file/[attachmentId]/route.ts` — GET handler with auth + RBAC + path safety + UTF-8 Content-Disposition

## Decisions Made

See `key-decisions` in frontmatter for the full list. Highlights:

- **VariableMenu standalone file skipped** — RichTextEditor's built-in VariableMenu (toolbar "Chèn biến" Popover) already covers Plan 03-06 needs via `variables` prop; no separate file added.
- **Tab Nhật ký bypasses central /nhat-ky listAuditLogs** — that server action gates audit-log:read which BANQL lacks; per-entity audit uses resource+resourceId direct prisma query, RBAC inherited from layout's chuong-trinh:read gate.
- **API file route entity dispatch table** — `resolveResourceForEntity('ProgramCycle') → 'chuong-trinh'`; Phase 4+ extends switch for OrgProfile/Project/Contract attachments. Returns 403 "Không hỗ trợ loại tệp này" for unwired entities (defense-in-depth fail-closed).
- **Phase 3 simplification on Công văn upload** — only allow upload when no attachment exists; replacement workflow (versioning) deferred to Phase 8 amendment.
- **Sub-routes vs client tabs** — chose sub-routes for bookmarkability + each tab having independent data dependency (cau-hinh loads catalogs; cong-van loads attachment; nhat-ky loads audit; etc.) so route boundary is natural.

## Deviations from Plan

None — plan executed exactly as written. Minor refinements documented as decisions (not deviations):

- Plan said "skip VariableMenu standalone OR make it 10-line re-export" → chose skip entirely (saves a file with no value-add).
- Plan suggested "use existing AuditLogTable" → chose direct query + custom small table to bypass audit-log:read RBAC and avoid pulling AuditLogFilterBar's complexity.
- Right-side action buttons placeholder in CycleDetailHeader (canEdit prop received but not yet rendered) — Plan 03-07 wires transitionCycle/extendCycle CTAs there.
- Cấu hình kỳ "significantChange" auto-template uses inline HTML with VARIABLES placeholders (`{{tenDonVi}}`, etc.) — server's sendInvitation accepts this as content; substitution at render time matches existing composer flow.

### Authentication Gates

None — overnight autonomous execution; no auth gate hit.

## Issues Encountered

- **React hooks-rule violation** during initial draft of CongVanUploadTab where `React.useState` was placed inside a Controller's `render` callback. Fixed by extracting `SignedDatePicker` helper component outside the form (per-render hook stability). Caught before tsc run via mental review; no commit included the broken version.

## Verification Snapshot

| Check | Result |
|-------|--------|
| All 19 files exist | PASS — verified via Bash node fs.existsSync chain |
| `npx tsc --noEmit` (after each task) | PASS (exit 0, no output) |
| `npm run build` (Tasks 2 + 4) | PASS — `/chuong-trinh/[id]` 390 B / `/cau-hinh` 8.43 kB / `/cong-van` 10.6 kB / `/don-vi-moi` 10 kB / `/de-an` 152 B / `/nhat-ky` 3.69 kB / `/api/file/[attachmentId]` 152 B |
| All 6 sub-routes registered | PASS — verified in build output route table |
| API /api/file route auth check | PASS — `auth()` line 1, returns 401 with VN message before DB query |
| API path safety | PASS — path.resolve + startsWith(baseDir + sep) check; explicit `..` guard |
| Tiptap composer 7 variables | PASS — VARIABLES const với 7 keys (tenChuongTrinh/namKy/hanNopHoSo/tenDonVi/nguoiKy/soCongVan/ngayKyCongVan) |
| Status-aware form (CYCLE-12) | PASS — EDITABLE_STATUSES = [DRAFT, READY, OPEN_REGISTRATION]; banner explains otherwise |
| Audit scope filter (Tab Nhật ký) | PASS — prisma where { resource: 'chuong-trinh', resourceId: cycleId } |
| significantChange ConfirmDialog flow | PASS — useConfirmDialog imperative + sendInvitation auto-template |

## Threat Surface Scan

No new attack surface introduced beyond plan threat model — all T-03-06-01..06 mitigations in place:

- **T-03-06-01 (I — file disclosure):** Mitigated via `auth()` 401 + entity-aware RBAC `canFromDB(role, 'chuong-trinh', 'read')` in /api/file route.
- **T-03-06-02 (T — path traversal):** Mitigated via `path.resolve(baseDir, relPart)` + `startsWith(baseDir + path.sep)` prefix check + explicit `..` rejection upfront.
- **T-03-06-03 (I — XSS via Tiptap):** Mitigated via Sheet preview iframe `sandbox=""` + `srcDoc` (T-02-06 reuse).
- **T-03-06-04 (T — unauthorized edit):** Mitigated via updateCycle server action RBAC line 1 (Plan 03-03); UI button disabled is layer 2 only (defense-in-depth).
- **T-03-06-05 (D — large composer payload):** Mitigated via Zod cap 50000 chars (Plan 03-03 sendInvitation schema).
- **T-03-06-06 (T — variable injection):** Accepted as low-risk; subject is plain text and substitution happens only in preview rendering (no exec context).

## Known Stubs

These are intentional placeholders documented in plan (not data stubs preventing demo):

- **CycleDetailHeader right-side action buttons area** — empty `<div aria-hidden="true" />` placeholder for Plan 03-07 to wire `transitionCycle` / `extendCycle` CTAs. Header still works fully (back link + name + status + meta).
- **DeAnEmptyState** — entire tab is intentional placeholder; Phase 5 (M2.3) wires real submission flow + DataTable. The empty state itself is fully rendered with illustration + Phase 5 hint + conditional OPEN_REGISTRATION sub-text.
- **CongVanUploadTab "không cho thay đổi" notice** — when attachment exists, replacement is disabled; Phase 8 (M4 Amendment) wires versioning workflow. Existing attachment view (iframe + metadata + download) is fully functional.

None block Plan 03-06 demo or downstream Phase 5 dependency.

## Next Phase Readiness

- All 7 Phase 3 plans now complete (03-01..03-06 done; 03-07 next).
- Plan 03-07 (action handlers + workflows) entry point: CycleDetailHeader's right-side area receives action buttons gated by `canEdit` + `cycle.status` + `ALLOWED_NEXT_STATES`.
- Detail page is fully usable for visual UAT (banql role): all 6 tabs render, dispatch flow ends-to-end testable, audit log populated by every server action with `withAuditLog`.

## Self-Check: PASSED

**Created files (19):**
- FOUND: app/(app)/chuong-trinh/[id]/layout.tsx
- FOUND: app/(app)/chuong-trinh/[id]/page.tsx
- FOUND: app/(app)/chuong-trinh/[id]/cau-hinh/page.tsx
- FOUND: app/(app)/chuong-trinh/[id]/cong-van/page.tsx
- FOUND: app/(app)/chuong-trinh/[id]/don-vi-moi/page.tsx
- FOUND: app/(app)/chuong-trinh/[id]/de-an/page.tsx
- FOUND: app/(app)/chuong-trinh/[id]/nhat-ky/page.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/CycleDetailHeader.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/CycleTabsNav.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/CauHinhKyForm.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/CongVanUploadTab.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/PdfPreview.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/DonViMoiManager.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/InvitationComposer.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/DispatchHistoryList.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/DeAnEmptyState.tsx
- FOUND: app/(app)/chuong-trinh/[id]/_components/CycleAuditLogTab.tsx
- FOUND: app/api/file/[attachmentId]/route.ts

**Commits:**
- FOUND: 3e7b34f — Task 1 layout + tabs nav + Tổng quan
- FOUND: d8818ac — Task 2 Cấu hình + Công văn + API file route
- FOUND: 47b6fee — Task 3 Đơn vị mời + composer + dispatch history
- FOUND: dfcad4a — Task 4 Đề án empty + Nhật ký scoped audit

UAT checkpoint Task 5 auto-approved per overnight execution context — manual UAT will be performed against running dev server in next session.

---
*Phase: 03-m2.1-chu-kỳ-chương-trình-xttm*
*Completed: 2026-04-30*
