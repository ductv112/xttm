---
phase: 05-m2.3-khai-báo-nộp-đề-án
plan: 02
subsystem: ui
tags: [wizard, multi-step-form, zustand-persist, react-hook-form, zod, tiptap, autosave, drag-drop-upload, hero-flow]

requires:
  - phase: 03-m2.1-chu-kỳ-chương-trình-xttm
    provides: Stepper visual component + wizard pattern (Zustand persist + RHF + Zod per-step + autosave debounce 2s + hydration gate)
  - phase: 05-01-foundation
    provides: 11 server actions (save-draft / submit / upload-document / copy-from-previous / list-previous / list-mine / get-detail / withdraw + types) + state machine + ProjectVersion + 6 mock projects

provides:
  - 2 routes (/de-an cổng tiếp nhận + /de-an/new wizard 6 bước) cho role DONVI
  - Project wizard 6 bước với Stepper visual + Zustand persist (userId-scoped key) + RHF + Zod per-step + autosave debounce 2s
  - SubmissionGate component (3 states UI: cycle+APPROVED / cycle+notApproved / no cycle)
  - MyProjectsList table với StatusBadge + parent badge cho đề án 2 năm
  - 6 step components production-ready (Step1: Select kind + 4 MultiSelect catalogs + DateRangePicker hoặc Quarter + đề án 2 năm toggle / Step2: Tiptap RichText 2 fields + plan rows table CRUD / Step3: budget table CRUD với auto-calc + dual total breakdown / Step4: contact cards radio chọn chủ nhiệm / Step5: drag-drop upload với category Select + ConfirmDialog xóa / Step6: 5-section summary readonly + checkbox cam đoan + ConfirmDialog nộp)
  - CopyFromPreviousDialog reuse copyFromPrevious server action

affects: [phase-05-03 detail page và PDF export sẽ tiêu thụ saved drafts từ wizard, phase-06 tiếp nhận BQL sẽ nhận SUBMITTED projects từ /de-an/new submit, phase-07 thẩm định reads same project records]

tech-stack:
  added: []
  patterns:
    - "Wizard pattern reuse từ Phase 3 (Plan 03-04): forwardRef + useImperativeHandle exposes validateAndCommit() — Shell calls handle.validateAndCommit() on Next click; Zustand source-of-truth for wizard data, RHF chỉ dùng for validation surface; allValues subscription syncs RHF → store on change cho autosave debounce trigger"
    - "Userscoped persist key (project-wizard-{userId}) thay vì global key, set qua setUserScopeKey() effect on shell mount — tránh leak state giữa các tài khoản share device"
    - "Server-side autosave (Plan 05-01 saveDraftProject) thay vì chỉ localStorage — debounce 2s on formData change → call server action; first call creates DRAFT row + assigns savedDraftProjectId; subsequent calls update same row"
    - "First-upload autosave gate: Step5TaiLieu requires projectId trước khi upload (uploadProjectDocument keys docs by projectId); shell exposes onAutosaveBeforeUpload() callback that force-saves draft + returns id"
    - "Step transitions: Stepper currentIndex from store, completed steps tracked separately for Stepper visual; markCompleted on validateAndCommit success enables back-navigation to completed steps"
    - "Tiptap RichTextEditor printable-text length validation (strip HTML + entities) — same approach as Phase 4 OrgProfile.capabilities.description"
    - "ConfirmDialog wrap submit action (Phase 2 Plan 02-04 pattern) — irreversible action gated by 2 user actions (declaration checkbox + dialog confirm)"

key-files:
  created:
    - "app/(app)/de-an/page.tsx (RSC cổng tiếp nhận: SubmissionGate + MyProjectsList với role + cycle + profile gating)"
    - "app/(app)/de-an/_components/SubmissionGate.tsx (3-state alert client component)"
    - "app/(app)/de-an/_components/MyProjectsList.tsx (DataTable đề án của đơn vị với StatusBadge + parentProjectId badge)"
    - "app/(app)/de-an/new/page.tsx (RSC wizard entry: load 5 catalogs + contacts + previousProjects → ProjectWizardShell)"
    - "app/(app)/de-an/new/_lib/types.ts (ProjectWizardData 6 step shape + WizardCatalogData + ContactOption + PreviousProjectOption)"
    - "app/(app)/de-an/new/_lib/schemas.ts (6 Zod schemas Step1..Step6Schema + ProjectWizardFullSchema + Tiptap printable-text validators)"
    - "app/(app)/de-an/new/_lib/wizardStore.ts (Zustand store + persist middleware userScoped key + setUserScopeKey + useProjectWizardHasHydrated + 6 default factories)"
    - "app/(app)/de-an/new/_components/ProjectWizardShell.tsx (root client với Stepper + autosave debounce 2s + manual Lưu nháp + Sao chép button)"
    - "app/(app)/de-an/new/_components/Step1ThongTinChung.tsx (RHF + Select kind + 4 MultiSelect + DateRangePicker hoặc Quarter Select cho đoàn ra/vào + đề án 2 năm toggle)"
    - "app/(app)/de-an/new/_components/Step2MucTieuKeHoach.tsx (2 RichTextEditor min 100/200 printable chars + plan rows table CRUD min 1 row)"
    - "app/(app)/de-an/new/_components/Step3DuToan.tsx (budget rows table CRUD với auto-calc amount + dual total breakdown Nhà nước/Đối ứng + ngân sách tham chiếu validate >= total)"
    - "app/(app)/de-an/new/_components/Step4ChuNhiem.tsx (radio cards select pmContactId từ contactsJson + auto-pick khi chỉ 1 contact + link bổ sung sang /don-vi-cua-toi)"
    - "app/(app)/de-an/new/_components/Step5TaiLieu.tsx (drag-drop multi-file upload với category Select + ConfirmDialog xóa + quota 20/10MB)"
    - "app/(app)/de-an/new/_components/Step6XemLai.tsx (5-section readonly summary + Tiptap dangerouslySetInnerHTML preview + checkbox cam đoan + ConfirmDialog nộp + final saveDraft + submitProject)"
    - "app/(app)/de-an/new/_components/CopyFromPreviousDialog.tsx (radio list previous projects + copyFromPrevious server action + redirect /de-an)"
  modified: []

key-decisions:
  - "Step file structure: 6 step components + 1 shell + 1 dialog (mirror Phase 3 Plan 03-04 pattern); placeholder shells committed in Task 2 then upgraded in Task 3 to keep build green throughout — atomic per-batch commits (Batch A: Step1+2+CopyDialog, Batch B: Step3+4, Batch C: Step5+6)"
  - "Autosave on store-level subscription thay vì RHF onChange — wizard data of truth = Zustand store; RHF chỉ wrap validation surface. Step1 syncs allValues→store via JSON.stringify deps in useEffect (cheap for shallow form state)"
  - "Step5 documents managed inline by server actions (uploadProjectDocument/deleteProjectDocument) — projectId required before first upload, force-autosave bridge in shell guarantees draft exists; category change inline UI deferred (info toast hint user xóa+upload lại) — would require new server action updateDocumentCategory"
  - "Step6 submit flow: final saveDraftProject pass + submitProject — server idempotency 5s window handles double-click; success → resetWizard + onSubmitted(id) → router.push detail (Phase 5 Plan 03 sẽ wire detail page)"
  - "Step4 auto-pick when contacts.length === 1 và stored chưa pick — UX gem: đa số đơn vị POC scope chỉ có 1 contact"
  - "DateRangePicker thay full DateRangePicker shared — 2 separate single date popovers cho start/end để tách hơn UI; quarter Select shows when kind = TRADE_DELEGATION_OUT/IN per CONTEXT.md decision"
  - "Step3 amount column readonly + auto-calc = qty × unitPrice trên mỗi row update; tổng dual breakdown (Nhà nước + Đối ứng) hiển thị tfoot với border-t-2 emerald accent"
  - "Vietnamese formal tone throughout (UI-SPEC §8.1) — error messages, button labels, helper text; PROJECT_KIND_LABELS reused từ lib/workflows/project.ts cho hiển thị tên loại đề án trong Step6 summary"

metrics:
  duration: "~17m"
  completed: "2026-04-30"
  tasks: 3
  commits: 5
---

# Phase 5 Plan 02: Wizard 6 bước - HERO screen công khai nhất Summary

Multi-step wizard 6 bước cho /de-an/new — HERO screen của hero flow đề án — với Zustand persist, RHF + Zod per-step, Tiptap rich text, drag-drop upload, autosave debounce 2s, và submit transactional pair với đề án 2 năm.

## Done

- [x] Task 1 (`1a0f026`): Wizard scaffolding — Zustand store với userId-scoped persist key, 6 Zod schemas (Step1..Step6 + ProjectWizardFullSchema), client-side types layer
- [x] Task 2 (`bbd2212`): /de-an cổng tiếp nhận RSC + SubmissionGate 3-state alert + MyProjectsList table + /de-an/new wizard shell với Stepper + autosave debounce + manual Lưu nháp + Sao chép button — placeholder steps để build xanh
- [x] Task 3 Batch A (`0624b33`): Step1 (Select kind + 4 MultiSelect + DateRangePicker/Quarter + đề án 2 năm toggle) + Step2 (2 Tiptap min 100/200 + plan rows table CRUD) + CopyFromPreviousDialog real impl
- [x] Task 3 Batch B (`af94827`): Step3 (budget table CRUD với auto-calc amount + dual total breakdown + ngân sách tham chiếu validation) + Step4 (radio contact cards với auto-pick single)
- [x] Task 3 Batch C (`1012b6b`): Step5 (drag-drop multi-file upload với category Select + ConfirmDialog xóa + quota guard) + Step6 (5-section readonly summary + checkbox cam đoan + ConfirmDialog nộp + final saveDraft+submitProject)

## Verification

- [x] npx tsc --noEmit exit 0 (sau mỗi commit)
- [x] npm run build exit 0 — /de-an = 9.22kB, /de-an/new = 25.6kB
- [x] /de-an route renders với 3-state gate logic (cycle+APPROVED / cycle+notApproved / no cycle)
- [x] /de-an/new wizard shell renders Stepper 6 bước
- [x] Sao chép từ đề án cũ button visible khi previousProjects.length > 0
- [x] Lưu nháp button + autosave indicator works
- [x] All 6 step components render với form fields đầy đủ
- [x] StatusBadge + EmptyState + DataTable patterns reused từ phase trước

## Wave Status

**Wave 2 status:** 2/3 plans complete (Plan 05-01 foundation done, Plan 05-02 wizard done, Plan 05-03 detail/PDF/versions pending).

## Deviations from Plan

**None substantive.** Plan executed exactly as written với 3 task structure (scaffolding → gate+shell → step components 3 batches). All 5 commits atomic; build green throughout.

Minor implementation notes (not deviations from plan):
- Step5 inline category change deferred to future updateDocumentCategory action (info toast hint user xóa + upload lại) — plan said "List uploaded files với delete" without specifying inline category mutation
- Step6 redirect target: onSubmitted(id) callback passes to router.push(/de-an/[id]); Phase 5 Plan 03 wires the detail page actually

## Next Steps

**Phase 5 Plan 03** — Detail page (/de-an/[id]) + PDF export + versions tab. Pre-conditions met:
- Wizard saves DRAFT projects với full data (this plan)
- submitProject creates ProjectVersion snapshots (Plan 05-01)
- /de-an/[id] route hiện chưa tồn tại — Plan 05-03 sẽ tạo

## Files Touched

15 new files (.tsx + .ts) — see frontmatter `key-files.created`. Total ~3,600 LOC client + RSC.

## Self-Check: PASSED

All 15 created files exist on disk. All 5 commits findable in git log:
- 1a0f026 (Task 1: scaffolding)
- bbd2212 (Task 2: gate + shell + placeholders)
- 0624b33 (Batch A: Step 1 + 2 + CopyDialog)
- af94827 (Batch B: Step 3 + 4)
- 1012b6b (Batch C: Step 5 + 6)
