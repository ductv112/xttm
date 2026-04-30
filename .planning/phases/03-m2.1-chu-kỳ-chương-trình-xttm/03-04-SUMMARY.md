---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 04
subsystem: program-cycle-wizard
tags: [wizard, multi-step-form, zustand, rhf, zod, autosave, hero-flow, hydration-gate]
requirements: [CYCLE-01, CYCLE-02, CYCLE-03, CYCLE-04]
dependency_graph:
  requires:
    - "components/shared/program-cycle/Stepper (Plan 03-02) — visual stepper primitive"
    - "components/shared/MultiSelect (Phase 2) — used by Step 3 + Step 4"
    - "components/ui/calendar + popover (Phase 1) — used by Step 2 date pickers"
    - "app/(app)/chuong-trinh/_actions (Plan 03-03) — listCycles + createCycle + transitionCycle"
    - "lib/permissions-db.ts (Phase 2) — canFromDB RBAC gate"
    - "lib/auth.ts — auth() session"
    - "lib/format.ts — formatVND + formatDate + formatDateTime + formatNumber"
    - "zustand@5 + zustand/middleware persist (Phase 0)"
    - "react-hook-form + @hookform/resolvers/zod (Phase 0)"
  provides:
    - "Wizard route /chuong-trinh/new (RBAC-gated to BANQL/ADMIN)"
    - "5 Zod schemas (Step1Schema..Step4Schema + CycleWizardFullSchema) — client-side validation contract for Plan 5 (M2.3 đề án 6 bước) reuse pattern"
    - "useWizardStore + useWizardHasHydrated — Zustand persist pattern reusable for Plan 5"
    - "StepHandle + validateAndCommit() forwardRef pattern — reusable multi-step form primitive"
  affects:
    - "Plan 03-05 list page — entry CTA 'Tạo chu kỳ mới' navigates to /chuong-trinh/new"
    - "Plan 03-06 detail page 6 tabs — receives router.push redirect after final submit"
    - "Plan 5 (M2.3 đề án wizard 6 bước) — reuse Zustand persist + RHF + Zod per-step + StepHandle pattern"
tech-stack:
  added: []
  patterns:
    - "Zustand persist middleware với localStorage key 'program-cycle-wizard' + partialize (chỉ persist currentStep + formData + lastAutosaveAt, drop transient isSubmitting)"
    - "Hydration gate: useWizardHasHydrated() subscribes to onFinishHydration; Shell renders <Skeleton /> until hydrated to avoid SSR/CSR mismatch khi user refresh giữa wizard"
    - "Date revival on rehydrate: onRehydrateStorage walks step2 fields parsing ISO strings to Date objects (JSON.stringify converts Date → ISO string by default; reverse trip needs explicit revival)"
    - "forwardRef + useImperativeHandle exposes validateAndCommit(): Promise<boolean> per Step component — Shell calls handle.validateAndCommit() trên 'Tiếp tục' click; if pass, store.setStepData + setStep(+1)"
    - "RHF mode='onBlur' for Step 1 + 2 (UX: validate on blur for early feedback); mode='onSubmit' for Step 3 + 4 (validate on Tiếp tục click only — MultiSelect changes shouldn't fire validation per-pick)"
    - "Async year-exists check: Step 1 onBlur of year field → listCycles({year}) server action → setError('year', 'Chu kỳ năm X đã tồn tại') if conflict (CYCLE-01 mitigation; final guard is Prisma @unique catch in createCycle)"
    - "Cross-validation chain via Zod superRefine in Step 2: registrationOpenAt < registrationCloseAt < supplementDeadline + evaluationStartAt < evaluationEndAt + approvalDeadline > evaluationEndAt — all 5 chain links checked, first violation surfaces"
    - "Autosave indicator debounce 2s: useEffect on JSON.stringify(formData) → setTimeout 2000ms → setLastAutosaveAt(new Date()); persist itself happens synchronously on every Zustand set (Zustand persist hooks every state mutation)"
    - "Catalog options server-side load: page.tsx RSC pulls scoringCriteria + organizations + emailTemplates via prisma → pass as props through Shell to Step components (no client fetch needed)"
    - "Final submit: Step 5 useTransition for pending state; createCycle then optional transitionCycle DRAFT→READY (canTransitionToReady gated by registrationOpenAt + registrationCloseAt presence); router.push to /chuong-trinh/{id} + resetWizard on success"
key-files:
  created:
    - "app/(app)/chuong-trinh/new/page.tsx"
    - "app/(app)/chuong-trinh/new/_lib/types.ts"
    - "app/(app)/chuong-trinh/new/_lib/schemas.ts"
    - "app/(app)/chuong-trinh/new/_lib/wizardStore.ts"
    - "app/(app)/chuong-trinh/new/_components/CycleWizardShell.tsx"
    - "app/(app)/chuong-trinh/new/_components/Step1ThongTinChung.tsx"
    - "app/(app)/chuong-trinh/new/_components/Step2MocThoiGian.tsx"
    - "app/(app)/chuong-trinh/new/_components/Step3CauHinhTieuChi.tsx"
    - "app/(app)/chuong-trinh/new/_components/Step4DonViMoi.tsx"
    - "app/(app)/chuong-trinh/new/_components/Step5XemLai.tsx"
  modified:
    - "app/(app)/chuong-trinh/_actions/create.ts"
    - "app/(app)/chuong-trinh/_actions/update.ts"
    - "app/(app)/chuong-trinh/_actions/transition.ts"
    - "app/(app)/chuong-trinh/_actions/extend.ts"
    - "app/(app)/chuong-trinh/_actions/send-invitation.ts"
    - "app/(app)/chuong-trinh/_actions/upload-cong-van.ts"
    - "app/(app)/chuong-trinh/_actions/index.ts"
key-decisions:
  - "Step 3 dùng cùng pool ScoringCriterion catalog cho cả 'chấm điểm sơ bộ' và 'thẩm định' — DB có 1 catalog tieu-chi-cham-diem (15 records: 4 group + 11 children); plan ban đầu giả định 2 catalogs nhưng Plan 02-02 chỉ seed 1 → admin có thể tự mark scope sau qua /danh-muc nếu cần phân tách. POC scope acceptable."
  - "Persistence key 'program-cycle-wizard' (no userId suffix) — POC dùng 1 device per role; production multi-user share device sẽ append session.user.id để tránh leak draft giữa role"
  - "[Rule 1 - Bug] Plan 03-03 server-action files có 'export const xxxSchema' (non-async) trong 'use server' modules — Next 15 throws 'Server Actions must be async functions' khi client consumer (Plan 03-04 Step 1 listCycles import) pulls in module. Fix: rename schemas to xxxInternal + drop export keyword. Schemas were not consumed externally (grep confirmed 0 external usages); barrel re-exports also removed. This bug was latent in Plan 03-03 because no client imported the actions until Plan 03-04."
  - "Removed unused `_CreateSchemaShape` placeholder type in update.ts — was never consumed externally"
  - "Date revival on rehydrate via onRehydrateStorage callback (not custom storage serialize/deserialize) — keeps Zustand JSON storage default + scoped revival logic to step2 fields only"
  - "Hydration gate via custom hook useWizardHasHydrated() (subscribe to onFinishHydration) instead of next/dynamic ssr:false — keeps page.tsx as RSC + Shell as client; only the gate hook handles hydration timing"
  - "Step 5 'Tạo và chuyển sẵn sàng' transition is best-effort: if transitionCycle fails (validateGuards rejects), wizard still surfaces toast.warning + redirects to detail page (cycle was created); user can retry transition from detail page action button (Plan 03-07)"
  - "Stepper completed steps clickable to revisit — Stepper component's onStepClick is wired only when index < currentStep (cannot jump forward without validating)"
metrics:
  duration: "13m"
  completed_date: "2026-04-30"
  tasks_completed: 4
  files_created: 10
  files_modified: 7
  commits: 3
---

# Phase 3 Plan 04: Wizard 5 bước /chuong-trinh/new Summary

**One-liner:** Wizard 5 bước tạo Chu kỳ Chương trình XTTM với Zustand persist localStorage restore on refresh + RHF per-step + Zod validation chains (incl. Step 2 date superRefine 5-link chain) + Stepper visual primitive + autosave 2s debounce indicator + final submit createCycle (Lưu nháp DRAFT) hoặc createCycle + transitionCycle DRAFT→READY (Tạo và chuyển sẵn sàng); ~1500 LOC across 10 files (4 lib + 1 page + 6 components).

## Tasks Executed

### Task 1: Zustand store + Zod schemas + types + RSC page shell
**Commit:** 4aa9236

Created the wizard scaffolding lib + RSC page entry:
- `_lib/types.ts`: `CycleWizardData` shape (step1..step4) + catalog option types (`ScoringCriterionOption`, `OrganizationOption`, `EmailTemplateOption`)
- `_lib/schemas.ts`: 5 Zod schemas with Vietnamese error messages — Step 1 (year ≥ currentYear refine, name 5-200 chars, totalBudget non-negative), Step 2 (6 optional dates với 5 superRefine cross-validation links: registrationOpenAt < registrationCloseAt < supplementDeadline + < evaluationStartAt < evaluationEndAt < approvalDeadline), Step 3 (scoringCriteriaIds + evaluationCriteriaIds min 1 max 20), Step 4 (invitedOrganizationIds min 1 max 50, emailTemplateIds optional max 10), CycleWizardFullSchema combined for final submit verification
- `_lib/wizardStore.ts`: Zustand `create()` với `persist` middleware → localStorage key `program-cycle-wizard`; `partialize` drops transient `isSubmitting`; `onRehydrateStorage` revives Step 2 ISO date strings → Date objects on rehydrate; SSR-safe storage shim returns no-op functions when `typeof window === 'undefined'`; exports `useWizardStore` + `useWizardHasHydrated()` hook (subscribe to `onFinishHydration`)
- `page.tsx`: RSC RBAC gate via `canFromDB(role, 'chuong-trinh', 'create')` → redirect to `defaultLandingPath(role)` if not authorized; loads scoring criteria + organizations + email templates server-side via prisma; passes catalogs to `<CycleWizardShell />`
- Stub `CycleWizardShell` for tsc pass; full impl arrived in Task 2

### Task 2: CycleWizardShell + Step 1 + Step 2
**Commit:** 87888d0

Full wizard root + first 2 step components:
- `CycleWizardShell.tsx`: Stepper (5 steps) + dynamic step component map + nav buttons (Quay lại / Tiếp tục); hydration gate renders Skeleton until `useWizardHasHydrated()` returns true; autosave indicator with debounce 2s on `JSON.stringify(formData)` change → `setLastAutosaveAt(new Date())` → text "Đã lưu nháp lúc {time}"; on Tiếp tục → `stepRef.current?.validateAndCommit()` → if true `setStep(+1)`; Step 5 hides default footer (renders own actions)
- `Step1ThongTinChung.tsx`: forwardRef + useImperativeHandle exposes `validateAndCommit`; RHF với Step1Schema resolver, mode='onBlur'; year input `valueAsNumber: true`; year onBlur → auto-prefill name `Chương trình XTTM Quốc gia ${year}` if name matches auto-fill pattern + async `listCycles({year})` check → setError 'Chu kỳ năm X đã tồn tại' if conflict; description Textarea (max 2000 chars); totalBudget number input với formatNumber display below
- `Step2MocThoiGian.tsx`: 6 date pickers (Calendar mode='single' inside Popover) via Controller wrapper; cross-validation runs automatically từ Step2Schema superRefine; "Sử dụng mốc mặc định 30/5" button prefills registrationCloseAt = `new Date(year, 4, 30)` từ Step 1's year; helper text "Theo quy định Bộ CT, hạn nộp mặc định 30/5 hàng năm" below registrationCloseAt
- Stubs cho Step 3/4/5 với forwardRef contract (validateAndCommit returns true) so Shell tsc passes

### Task 3: Step 3 + Step 4 + Step 5 with final submit + bug fix
**Commit:** 05876a2

Final 3 steps + auto-fix Plan 03-03 server-action export bug:
- `Step3CauHinhTieuChi.tsx`: 2 MultiSelect (scoring + evaluation criteria) từ cùng `scoringCriteria` prop; option label `${name} · ${parentName} (trọng số ${weight}%)` for grouping context; mode='onSubmit'; helper text VN per-field
- `Step4DonViMoi.tsx`: 2 MultiSelect (orgs required + emailTemplates optional) với "Chọn tất cả ({count})" ghost button helper; org label `${name} · ${typeLabel}` mapping ASSOCIATION→Hiệp hội / ENTERPRISE→Doanh nghiệp / RESEARCH_INSTITUTE→Viện-Trường / GOVERNMENT→Cơ quan nhà nước
- `Step5XemLai.tsx`: 4 readonly summary Cards (Thông tin chung / Mốc thời gian / Cấu hình tiêu chí / Đơn vị mời) với "Quay lại chỉnh sửa" link per section calling `setStep(idx)`; CycleWizardFullSchema final validation before submit; useTransition for pending state; 2 actions:
  - "Lưu nháp" → `createCycle(input)` → toast success → `router.push('/chuong-trinh/{id}')` + `resetWizard()`
  - "Tạo và chuyển sẵn sàng" → createCycle → optional transitionCycle DRAFT→READY (best-effort: if transition fails, toast.warning but still redirect to detail page); button disabled khi `!canTransitionToReady` (missing registrationOpenAt OR registrationCloseAt) với title attribute hint
- **[Rule 1 - Bug fix]:** Removed `export` keyword from Zod schema declarations in 6 server-action files (`create.ts`, `update.ts`, `transition.ts`, `extend.ts`, `send-invitation.ts`, `upload-cong-van.ts`); renamed to `xxxInternal`. Removed schema re-exports from `_actions/index.ts` barrel. Removed unused `_CreateSchemaShape` placeholder type in `update.ts`. Build now passes.

### Task 4: Manual UAT (auto-approved per overnight chain mode)

Per execution context: "Overnight autonomous execution. UAT checkpoint in plan: auto-treat as approved." Skipping interactive UAT walk-through; the build pass + tsc pass + verification grep checks all pass. Manual UAT to be performed by user in next dev session before phase verifier.

## Verification Snapshot

| Check | Result |
|-------|--------|
| All 10 wizard files exist | PASS — types.ts, schemas.ts, wizardStore.ts, page.tsx + 6 step components |
| `npx tsc --noEmit` | PASS (exit 0) |
| `npm run build` | PASS — `/chuong-trinh/new` route compiled at 13.3 kB / 217 kB First Load |
| Stepper integration grep | 2 matches in CycleWizardShell.tsx (`from '@/components/shared/program-cycle'`) |
| Zod schemas count | 5 (`Step1Schema`, `Step2Schema`, `Step3Schema`, `Step4Schema`, `CycleWizardFullSchema`) |
| `persist` mention in store | 8 occurrences (import + middleware + hasHydrated gates) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `'use server'` modules cannot have non-async exports**
- **Found during:** Task 3 — first `npm run build` after Step 5 imported `createCycle` + `transitionCycle` from the barrel
- **Issue:** Next 15 enforces all exports of `'use server'` modules to be async functions; Plan 03-03 declared `export const createCycleSchema = z.object(...)` etc. in 6 server-action files. Build error: "Server Actions must be async functions" at the `.superRefine` line of each file
- **Fix:** Renamed each schema (`createCycleSchema` → `createCycleSchemaInternal`, etc.) and dropped the `export` keyword. Removed schema re-exports from `_actions/index.ts` barrel. Removed dependent `_CreateSchemaShape` placeholder type in `update.ts`
- **Why latent:** Plan 03-03 only had server consumers; this Plan 03-04 is the first client consumer (`Step1ThongTinChung.tsx` imports `listCycles` and `Step5XemLai.tsx` imports `createCycle` + `transitionCycle`)
- **Files modified:** `_actions/create.ts`, `_actions/update.ts`, `_actions/transition.ts`, `_actions/extend.ts`, `_actions/send-invitation.ts`, `_actions/upload-cong-van.ts`, `_actions/index.ts`
- **Commit:** 05876a2

**2. [Rule 2 - Missing critical] Step 3 catalog source mismatch**
- **Found during:** Task 3 implementation
- **Issue:** Plan suggested 2 separate catalogs (chấm điểm sơ bộ vs thẩm định); but Phase 2 Plan 02-02 only seeded 1 ScoringCriterion catalog (15 records — 4 groups + 11 children, all without scope partition)
- **Fix:** Use single pool — both Step 3 MultiSelects display same options. POC scope: admin can split scope later via /danh-muc if needed; OR both lists deliberately share criteria (same tiêu chí áp dụng cho cả chấm điểm sơ bộ và thẩm định, chỉ khác khâu áp dụng)
- **Files modified:** `_lib/types.ts` (removed `scope` field, added `parentName` for group display), `Step3CauHinhTieuChi.tsx`, `page.tsx`
- **Commit:** 4aa9236 (initial implementation already adopted single-pool approach)

### Authentication Gates
None — wizard runs server-side RBAC `canFromDB(role, 'chuong-trinh', 'create')` redirect; createCycle action also checks RBAC at server (defense-in-depth).

## Threat Surface Scan

No new network surface introduced beyond Plan 03-03's existing server actions. Wizard is pure client form using existing `createCycle` / `transitionCycle` / `listCycles` actions. T-03-04-01 (RBAC bypass) is mitigated via dual-layer page.tsx redirect + server action canFromDB; T-03-04-02 (Zustand tampering) is mitigated by server-side Zod re-validation; T-03-04-03 (data leak across sessions) is accept (POC); T-03-04-04 (year race) is mitigated by Prisma @unique + P2002 catch (already in createCycle).

## Self-Check: PASSED

**Created files (10):**
- FOUND: app/(app)/chuong-trinh/new/page.tsx
- FOUND: app/(app)/chuong-trinh/new/_lib/types.ts
- FOUND: app/(app)/chuong-trinh/new/_lib/schemas.ts
- FOUND: app/(app)/chuong-trinh/new/_lib/wizardStore.ts
- FOUND: app/(app)/chuong-trinh/new/_components/CycleWizardShell.tsx
- FOUND: app/(app)/chuong-trinh/new/_components/Step1ThongTinChung.tsx
- FOUND: app/(app)/chuong-trinh/new/_components/Step2MocThoiGian.tsx
- FOUND: app/(app)/chuong-trinh/new/_components/Step3CauHinhTieuChi.tsx
- FOUND: app/(app)/chuong-trinh/new/_components/Step4DonViMoi.tsx
- FOUND: app/(app)/chuong-trinh/new/_components/Step5XemLai.tsx

**Commits:**
- FOUND: 4aa9236 — Task 1 wizard scaffolding
- FOUND: 87888d0 — Task 2 shell + Step 1 + Step 2
- FOUND: 05876a2 — Task 3 Step 3+4+5 + server-action export fix

**Modified files (7) — server-action files for [Rule 1] bug fix:**
- FOUND: app/(app)/chuong-trinh/_actions/create.ts
- FOUND: app/(app)/chuong-trinh/_actions/update.ts
- FOUND: app/(app)/chuong-trinh/_actions/transition.ts
- FOUND: app/(app)/chuong-trinh/_actions/extend.ts
- FOUND: app/(app)/chuong-trinh/_actions/send-invitation.ts
- FOUND: app/(app)/chuong-trinh/_actions/upload-cong-van.ts
- FOUND: app/(app)/chuong-trinh/_actions/index.ts

Manual UAT (Task 4) deferred to user — automated verification (build + tsc + grep) all pass.
