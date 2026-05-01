---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 04
type: execute
wave: 3
depends_on: [01, 02, 03]
files_modified:
  - app/(app)/chuong-trinh/new/page.tsx
  - app/(app)/chuong-trinh/new/_components/CycleWizardShell.tsx
  - app/(app)/chuong-trinh/new/_components/Step1ThongTinChung.tsx
  - app/(app)/chuong-trinh/new/_components/Step2MocThoiGian.tsx
  - app/(app)/chuong-trinh/new/_components/Step3CauHinhTieuChi.tsx
  - app/(app)/chuong-trinh/new/_components/Step4DonViMoi.tsx
  - app/(app)/chuong-trinh/new/_components/Step5XemLai.tsx
  - app/(app)/chuong-trinh/new/_lib/wizardStore.ts
  - app/(app)/chuong-trinh/new/_lib/schemas.ts
  - app/(app)/chuong-trinh/new/_lib/types.ts
autonomous: false
requirements:
  - CYCLE-01
  - CYCLE-02
  - CYCLE-03
  - CYCLE-04
tags: [wizard, multi-step-form, zustand, rhf, zod, autosave, hero-flow]
user_setup: []

must_haves:
  truths:
    - "Wizard render single URL /chuong-trinh/new với Stepper 5 bước hiển thị tiến trình"
    - "User điền step 1, click Tiếp tục → validate qua Zod schema bước 1 → bước 2; nếu sai validation hiển thị inline error tiếng Việt"
    - "User refresh giữa wizard → Zustand persist localStorage restore form data, vẫn ở step trước đó"
    - "Step 1 năm validation: nếu nhập 2026 (đã có cycle) → server action async check → hiển thị 'Chu kỳ năm 2026 đã tồn tại'"
    - "Step 5 Xem lại có 2 button: 'Lưu nháp' (createCycle status DRAFT) hoặc 'Tạo và chuyển sẵn sàng' (createCycle then transitionCycle DRAFT→READY); cả 2 redirect về /chuong-trinh/[id] sau success"
    - "Stepper component (Plan 03-02) clickable cho completed steps để revisit; upcoming steps disabled"
  artifacts:
    - path: "app/(app)/chuong-trinh/new/page.tsx"
      provides: "RSC page với RBAC redirect + render <CycleWizardShell />"
      min_lines: 30
    - path: "app/(app)/chuong-trinh/new/_components/CycleWizardShell.tsx"
      provides: "Client wizard root: Stepper + dynamic step component + nav buttons + autosave indicator"
      min_lines: 180
    - path: "app/(app)/chuong-trinh/new/_lib/wizardStore.ts"
      provides: "Zustand store với persist middleware, key=program-cycle-wizard-{userId}, fields: currentStep, formData, lastAutosaveAt, isSubmitting"
      exports: ["useWizardStore"]
      min_lines: 80
    - path: "app/(app)/chuong-trinh/new/_lib/schemas.ts"
      provides: "5 Zod schemas (one per step) + CycleWizardFullSchema combined"
      exports: ["Step1Schema", "Step2Schema", "Step3Schema", "Step4Schema", "CycleWizardFullSchema"]
      min_lines: 70
  key_links:
    - from: "app/(app)/chuong-trinh/new/_components/CycleWizardShell.tsx"
      to: "components/shared/program-cycle/Stepper"
      via: "import Stepper từ shared visual primitives"
      pattern: "from '@/components/shared/program-cycle'"
    - from: "app/(app)/chuong-trinh/new/_components/Step5XemLai.tsx"
      to: "app/(app)/chuong-trinh/_actions/create"
      via: "createCycle server action call on submit"
      pattern: "createCycle"
    - from: "app/(app)/chuong-trinh/new/_lib/wizardStore.ts"
      to: "zustand persist middleware"
      via: "persist({name: 'program-cycle-wizard'+userId})"
      pattern: "zustand/middleware"
---

<objective>
Wizard 5 bước tạo Chu kỳ Chương trình mới — single URL /chuong-trinh/new, Zustand persist (localStorage restore on refresh), RHF 1 instance per step, Zod validation per step, Stepper visual từ Plan 03-02. CYCLE-01/02/03/04 — 4/15 phase requirements covered.

Purpose:
- Hero UX: wizard mượt nhất phase này, set pattern cho Plan 5 (M2.3 đề án 6 bước) reuse
- Validation chặt theo step: chặn next nếu step có lỗi, hiển thị inline errors VN
- Year unique check ở Step 1 — async qua createCycle dry-run hoặc list query trước submit
- Save Draft tại Step 5: 2 lựa chọn (lưu nháp DRAFT hoặc tạo + chuyển READY)

Output: 1 RSC page + 1 client shell + 5 step components + Zustand store + Zod schemas; ~700 LOC tổng.
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
@.planning/research/ARCHITECTURE.md
@components/shared/program-cycle/Stepper.tsx
@components/shared/RichTextEditor.tsx
@components/shared/MultiSelect.tsx
@components/shared/DateRangePicker.tsx
@components/shared/ConfirmDialog.tsx
@lib/workflows/programCycle.ts
@lib/permissions.ts
@lib/audit-types.ts

<interfaces>
From Plan 03-03 server actions:
- createCycle(input: CreateCycleInput): Promise of { id, year, status: 'DRAFT' }
- transitionCycle(input: { cycleId, target, reason? }): Promise of { id, fromStatus, toStatus }
- listCycles(filter?): Promise of CycleListItem[] (used to check year exists during step 1)

From Plan 03-02 visual:
- Stepper({ steps, currentIndex, onStepClick, orientation? })
- StepperStep type: { id, label, description? }

From Phase 2 shared:
- MultiSelect ({options, values, onChange, placeholder, ...})
- DateRangePicker ({from, to, onChange})
- ConfirmDialog
- RichTextEditor

From Phase 1:
- shadcn primitives: Form, Input, Label, Button, Textarea, Select, Calendar
- formatVND, formatDate from @/lib/format
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Zustand store + Zod schemas + types + RSC page shell</name>
  <files>app/(app)/chuong-trinh/new/_lib/types.ts, app/(app)/chuong-trinh/new/_lib/schemas.ts, app/(app)/chuong-trinh/new/_lib/wizardStore.ts, app/(app)/chuong-trinh/new/page.tsx</files>
  <behavior>
    - types.ts: export type CycleWizardData = { step1: { year: number; name: string; description?: string; totalBudget?: number | null }; step2: { registrationOpenAt?: Date; registrationCloseAt?: Date; supplementDeadline?: Date; evaluationStartAt?: Date; evaluationEndAt?: Date; approvalDeadline?: Date }; step3: { scoringCriteriaIds: string[]; evaluationCriteriaIds: string[] }; step4: { invitedOrganizationIds: string[]; emailTemplateIds: string[] } }
    - schemas.ts: import { z } from 'zod'
    - Step1Schema: year (z.number().int().min(2020).max(2050) refine year >= currentYear ?'Năm chu kỳ phải từ năm hiện tại trở đi'), name (z.string().min(5,'Tên tối thiểu 5 ký tự').max(200)), description (z.string().max(2000).optional()), totalBudget (z.number().nonnegative('Ngân sách không thể âm').optional().nullable()) — Note: name có default auto-prefill 'Chương trình XTTM Quốc gia ' + year on year change, but schema không enforce; UI handles
    - Step2Schema: all 6 dates optional but with cross-refines: registrationCloseAt > registrationOpenAt nếu cả 2 set ('Hạn nộp phải sau ngày mở cổng'); supplementDeadline > registrationCloseAt nếu cả 2 set ('Hạn bổ sung phải sau hạn nộp'); evaluationStartAt > registrationCloseAt; evaluationEndAt > evaluationStartAt; approvalDeadline > evaluationEndAt — chained refines via .superRefine
    - Step3Schema: scoringCriteriaIds z.array(z.string().cuid()).min(1,'Vui lòng chọn ít nhất 1 tiêu chí chấm điểm sơ bộ').max(20); evaluationCriteriaIds z.array(z.string().cuid()).min(1,'Vui lòng chọn ít nhất 1 tiêu chí thẩm định').max(20)
    - Step4Schema: invitedOrganizationIds z.array(z.string().cuid()).min(1,'Vui lòng chọn ít nhất 1 đơn vị mời').max(50); emailTemplateIds z.array(z.string().cuid()).min(0).max(10) — optional, default empty
    - CycleWizardFullSchema: combine via z.object({...}) — for final submit verification
    - export each schema + types via z.infer
    - wizardStore.ts: 'use client' (note: Zustand store can be 'use client' module)
    - import create from 'zustand', persist from 'zustand/middleware'
    - State shape: { currentStep: number (0-4); formData: Partial CycleWizardData; lastAutosaveAt: Date | null; isSubmitting: boolean; setStep, setStepData, resetWizard, setSubmitting }
    - Use persist middleware: name: 'program-cycle-wizard' (no userId for POC simplicity — clear on submit/reset), storage: createJSONStorage(() => localStorage)
    - Manual rehydrate gate to avoid hydration mismatch: useStore.persist.hasHydrated()
    - export useWizardStore, useWizardHasHydrated (custom hook checks rehydration state)
    - page.tsx: RSC, import auth + canFromDB; if !session → redirect /login; const role = session.user.role; if !await canFromDB(role, 'chuong-trinh', 'create') → redirect '/chuong-trinh' with toast (or just redirect)
    - Render <main className="container mx-auto py-8 max-w-5xl"><h1 className="text-2xl font-semibold text-slate-900 mb-2">Tạo chu kỳ chương trình mới</h1><p className="text-sm text-slate-600 mb-8">Hoàn thành 5 bước để khởi tạo chu kỳ chương trình XTTM năm</p><CycleWizardShell /></main>
  </behavior>
  <action>
    1. Create types.ts với CycleWizardData
    2. Create schemas.ts với 5 schemas + superRefine chains
    3. Create wizardStore.ts với Zustand persist + hydration gate
    4. Create page.tsx RSC với RBAC redirect
    5. Run npx tsc --noEmit
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['types','schemas','wizardStore'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/new/_lib/'+f+'.ts')));console.log('page:',require('fs').existsSync('app/(app)/chuong-trinh/new/page.tsx'))"</automated>
  </verify>
  <done>
    - 4 files created
    - tsc pass
    - page.tsx RBAC redirect for non-BANQL/ADMIN role
    - wizardStore exports useWizardStore + useWizardHasHydrated
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: CycleWizardShell + Step 1 + Step 2 components</name>
  <files>app/(app)/chuong-trinh/new/_components/CycleWizardShell.tsx, app/(app)/chuong-trinh/new/_components/Step1ThongTinChung.tsx, app/(app)/chuong-trinh/new/_components/Step2MocThoiGian.tsx</files>
  <behavior>
    - CycleWizardShell.tsx: 'use client'; useWizardStore + useWizardHasHydrated
    - If !hasHydrated, return Skeleton placeholder (avoid hydration mismatch)
    - Stepper config: STEPS = [{id:'1',label:'Thông tin chung',description:'Tên + năm + ngân sách'},{id:'2',label:'Mốc thời gian',description:'6 mốc nghiệp vụ'},{id:'3',label:'Cấu hình tiêu chí',description:'Sơ bộ + thẩm định'},{id:'4',label:'Đơn vị mời',description:'Danh sách + mẫu email'},{id:'5',label:'Xem lại',description:'Lưu nháp / chuyển sẵn sàng'}]
    - Render: <Stepper steps={STEPS} currentIndex={currentStep} onStepClick={(i) => i < currentStep && setStep(i)} className="mb-8" />; then dynamic component map: STEPS_COMPONENTS = [Step1ThongTinChung, Step2MocThoiGian, Step3CauHinhTieuChi, Step4DonViMoi, Step5XemLai]; render <StepComponent />
    - Footer nav buttons: <Button variant="outline" onClick={prev}>Quay lại</Button> (disabled if currentStep === 0); spacer; <Button onClick={next}>Tiếp tục</Button> hoặc <Button onClick={submit}>Hoàn thành</Button> on last step
    - Autosave indicator: top-right text "Đã lưu nháp lúc {format(lastAutosaveAt)}" hiển thị khi lastAutosaveAt set; debounce useEffect on formData change (lodash.debounce 2000ms — or simple setTimeout) → setLastAutosaveAt(new Date())
    - 'next' click: trigger schema validation cho currentStep — sử dụng RHF context inside step components — step component expose `validate()` qua imperative ref pattern OR use onSubmit Pattern. Simpler: each step component is self-contained with RHF + on submit calls store.setStepData(stepIdx, data) + parent shell knows when step is "valid" by checking if formData[stepKey] exists + matches schema.parse safely
    - DECISION: each Step component uses useForm with mode='onBlur', resolver=zodResolver(StepNSchema), defaultValues from store.formData[stepKey]. When user fills + clicks "Tiếp tục" in shell, shell calls a method exposed via ref (formMethods.handleSubmit + zod validate). If pass, shell calls store.setStepData + advances. If fail, focus first error field.
    - Pattern: useImperativeHandle in each Step exposes validateAndCommit(): Promise<boolean>. Shell calls it on next button click.
    - Step1ThongTinChung.tsx: 'use client', forwardRef + useImperativeHandle
    - useForm with Step1Schema resolver, defaultValues from store.formData.step1 ?? {year: new Date().getFullYear()+1}
    - Fields: year (Input type=number, label "Năm chu kỳ *"), name (Input, label "Tên chu kỳ *", auto-prefill 'Chương trình XTTM Quốc gia ' + year onBlur if name empty), description (Textarea, label "Mô tả ngắn"), totalBudget (Input type=number with VND formatter onBlur display, label "Ngân sách dự kiến (VND)")
    - On blur of year, async check via listCycles() filter by year — if exists, setError('year', 'Chu kỳ năm ' + year + ' đã tồn tại')
    - Layout: 2-column grid lg:grid-cols-2 gap-6, description full-width col-span-2
    - Error display: <FormMessage /> below each field, text-sm text-red-600
    - validateAndCommit: form.handleSubmit (async data => store.setStepData('step1', data); return true; on error return false)
    - Step2MocThoiGian.tsx: similar pattern with Step2Schema
    - Fields: 6 date pickers in 3 rows of 2 columns
    - Row 1: registrationOpenAt label "Ngày mở cổng nhận đăng ký" + registrationCloseAt label "Hạn nộp đề án (mặc định 30/05)"
    - Row 2: supplementDeadline label "Hạn nộp bổ sung" + evaluationStartAt label "Ngày bắt đầu thẩm định"
    - Row 3: evaluationEndAt label "Ngày kết thúc thẩm định" + approvalDeadline label "Hạn phê duyệt"
    - Each date picker uses shadcn Calendar inside Popover, format display via formatDate (date-fns vi)
    - Helper text below registrationCloseAt: "Theo quy định Bộ CT, hạn nộp mặc định 30/5 hàng năm" text-sm text-slate-500
    - Cross-validation auto-runs via Zod superRefine
    - Auto default: if user clears all → suggest button "Sử dụng mốc mặc định 30/5" prefill registrationCloseAt = new Date(year, 4, 30)
    - Layout 3x2 grid lg:grid-cols-2 gap-6
  </behavior>
  <action>
    1. Create CycleWizardShell với forwardRef pattern + dynamic step component
    2. Create Step1ThongTinChung với async year-exists check
    3. Create Step2MocThoiGian với 6 date pickers + cross-validation
    4. Run npx tsc --noEmit + npm run build
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['CycleWizardShell','Step1ThongTinChung','Step2MocThoiGian'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/new/_components/'+f+'.tsx')))"</automated>
  </verify>
  <done>
    - 3 files created, all 'use client'
    - Step components use forwardRef + validateAndCommit pattern
    - tsc pass
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Step 3 + Step 4 + Step 5 components + final submit logic</name>
  <files>app/(app)/chuong-trinh/new/_components/Step3CauHinhTieuChi.tsx, app/(app)/chuong-trinh/new/_components/Step4DonViMoi.tsx, app/(app)/chuong-trinh/new/_components/Step5XemLai.tsx</files>
  <behavior>
    - Step3CauHinhTieuChi.tsx: 'use client', forwardRef pattern
    - Load options at mount: useState scoringCriteria + evaluationCriteria; fetch via fetch from RSC server action listCatalogItems('scoring-criterion') OR pass as prop from page.tsx via initialOptions. Decision: pass via prop initialScoringCriteria: { id, name, weight }[] from page.tsx server-side load (simpler, no client fetch).
    - This means page.tsx must load ScoringCriterion data server-side and pass to Shell which forwards to step. Adjust Task 1 page.tsx accordingly: add `const scoringCriteria = await prisma.scoringCriterion.findMany({where:{isActive:true}, orderBy:{displayOrder:'asc'}}); pass to <CycleWizardShell scoringCriteria={...} />`
    - Two MultiSelect components: scoring (label "Tiêu chí chấm điểm sơ bộ *" + helpText "Áp dụng khi chuyên viên kiểm tra hồ sơ"), evaluation (label "Tiêu chí thẩm định *" + helpText "Áp dụng cho hội đồng thẩm định")
    - Display each criterion as option: { value: id, label: name + ' (trọng số ' + weight + '%)' }
    - Quick action button: "Sao chép cấu hình từ chu kỳ năm trước" — fetch latest cycle, prefill IDs (defer to scope — minimal v1: button greyed disabled với tooltip "Tính năng sao chép sẽ có sau" — or skip entirely if time)
    - Step4DonViMoi.tsx: 'use client', forwardRef
    - Load options server-side from page.tsx: organizations: { id, name, type, isInvited }[] from prisma.organization.findMany({where:{isActive:true}}) — pass via prop
    - Email templates: prisma.documentTemplate.findMany({where:{category:'CONG_VAN_MOI', isActive:true}}) — pass via prop
    - 2 MultiSelect components:
      - invitedOrganizationIds: label "Đơn vị mời tham gia *" + button "Chọn tất cả đơn vị active" (helper sets all org ids), helpText "Chọn các hiệp hội ngành hàng / doanh nghiệp được mời nộp đề án"
      - emailTemplateIds: label "Mẫu công văn / email mời" (optional), helpText "Có thể bỏ trống — soạn nội dung trực tiếp khi gửi thông báo"
    - Display orgs: option label = name + ' · ' + (type === 'ASSOCIATION' ? 'Hiệp hội' : type === 'ENTERPRISE' ? 'Doanh nghiệp' : 'Khác')
    - Step5XemLai.tsx: 'use client', NO useImperativeHandle (this is final step, exposes 2 submit buttons via separate handler)
    - Read full formData from store
    - Render readonly summary card với 4 sections (1 cho mỗi step), each section: <Card><CardHeader><CardTitle>Section name</CardTitle></CardHeader><CardContent grid> + show fields read-only with label + value formatted
    - Section 1: Thông tin chung — Năm, Tên, Mô tả, Ngân sách (formatVND)
    - Section 2: Mốc thời gian — 6 dates (formatDate vi)
    - Section 3: Cấu hình tiêu chí — count tiêu chí sơ bộ + count thẩm định + danh sách tên qua join with names from props
    - Section 4: Đơn vị mời — count + comma-separated names
    - "Quay lại chỉnh sửa" link beside each section title (onClick → setStep(idx))
    - Footer 2 actions:
      - <Button variant="outline" onClick={onSaveDraft}>Lưu nháp</Button> — calls createCycle(...) status='DRAFT' (default)
      - <Button onClick={onCreateAndReady}>Tạo và chuyển sẵn sàng</Button> — calls createCycle then transitionCycle({target:'READY'}); but READY requires registrationOpenAt + registrationCloseAt set (validateGuards) — if missing, disable button with tooltip "Bổ sung mốc thời gian để có thể chuyển sẵn sàng"
    - On submit:
      - Validate full Cycle data via CycleWizardFullSchema — if any step's data missing → toast error "Vui lòng hoàn thành các bước trước"
      - setSubmitting(true), call createCycle, on success: toast.success('Đã tạo chu kỳ năm ' + year), if onCreateAndReady call transitionCycle, on success router.push('/chuong-trinh/' + result.id), resetWizard()
      - On error: toast.error(error.message)
      - Use useTransition for pending state on buttons
    - Update CycleWizardShell to NOT render footer buttons on currentStep === 4 (let Step5 render its own actions)
  </behavior>
  <action>
    1. Update page.tsx to load scoringCriteria + organizations + emailTemplates server-side and pass to Shell
    2. Update CycleWizardShell to forward props to step components + skip footer buttons on last step
    3. Create Step3 + Step4 + Step5
    4. Run npx tsc --noEmit + npm run build
    5. Manual smoke test (defer to Task 4 checkpoint)
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['Step3CauHinhTieuChi','Step4DonViMoi','Step5XemLai'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/new/_components/'+f+'.tsx')))" &amp;&amp; npm run build 2&gt;&amp;1 | tail -10</automated>
  </verify>
  <done>
    - 3 step files + page + shell updated
    - Step5 has 2 submit buttons với conditional disable cho "chuyển sẵn sàng"
    - Form data submit via createCycle + optional transitionCycle
    - npm run build pass
  </done>
</task>

<task type="checkpoint:human-verify" gate="non-blocking">
  <name>Task 4: Manual UAT wizard end-to-end flow</name>
  <files>app/(app)/chuong-trinh/new/* (full wizard flow)</files>
  <action>Manual UAT — login banql, visit /chuong-trinh/new, complete 5 steps end-to-end với year duplicate test + persist refresh test + final submit test</action>
  <verify><automated>echo "Manual checkpoint — see how-to-verify"</automated></verify>
  <done>User type "approved" hoặc record issues; cycle 2030 created in DB nếu submit thành công</done>
  <what-built>Wizard 5 bước /chuong-trinh/new full implementation: Stepper + 5 steps validated qua Zod + Zustand persist + autosave + final submit createCycle and transitionCycle</what-built>
  <how-to-verify>
    1. npm run dev; login as banql (Banql@123)
    2. Visit /chuong-trinh/new
    3. Step 1: nhập year=2030, name auto-prefill 'Chương trình XTTM Quốc gia 2030', totalBudget=100000000000 → Tiếp tục
    4. Step 1 (try year=2026): expect inline error 'Chu kỳ năm 2026 đã tồn tại'
    5. Step 2: chọn registrationOpenAt = today, registrationCloseAt = today (expect error 'Hạn nộp phải sau ngày mở cổng'); fix bằng cách chọn close = +30 days; Tiếp tục
    6. Step 3: MultiSelect chọn 5 tiêu chí sơ bộ + 5 tiêu chí thẩm định; Tiếp tục
    7. Step 4: chọn 5 đơn vị mời; Tiếp tục
    8. Step 5: verify summary đúng; click "Lưu nháp" → toast 'Đã tạo chu kỳ năm 2030' → redirect /chuong-trinh/[id] (sẽ render qua Plan 03-06 — nếu Plan 03-06 chưa xong, expect 404 nhưng cycle was created in DB — verify qua prisma studio)
    9. Refresh giữa wizard (sau Step 2) → expect persist restore Step 1+2 data, currentStep=2
    10. Verify cleanup: localStorage 'program-cycle-wizard' cleared sau submit thành công
  </how-to-verify>
  <resume-signal>Type "approved" hoặc "issues: ..."</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → Server Action | Untrusted; createCycle Zod validates + RBAC enforces |
| Zustand localStorage | Untrusted; user can manipulate; don't store sensitive data |
| RHF form data | Validated by Zod resolver before submit |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-04-01 | E (Elevation) | Non-BQL user accesses /chuong-trinh/new | mitigate | page.tsx RSC checks canFromDB('chuong-trinh','create') line 1; redirect away if not authorized; createCycle action also checks RBAC |
| T-03-04-02 | T (Tampering) | User modifies localStorage Zustand to inject bad data | mitigate | Server action createCycle re-validates ALL fields via Zod; client-side Zustand is convenience only |
| T-03-04-03 | I (Info disclosure) | Wizard data persists across user sessions on shared device | accept | localStorage cleared on submit/reset; user can manually clear; POC scope acceptable |
| T-03-04-04 | T (Year race) | Two users create same year simultaneously | mitigate | Prisma @unique on year column; Zod async pre-check is UX nicety; second user sees Vietnamese error after submit |
</threat_model>

<verification>
- All 9 files exist
- npx tsc --noEmit pass
- npm run build pass với /chuong-trinh/new route compiled
- Stepper integration: grep "from '@/components/shared/program-cycle'" trong CycleWizardShell.tsx hit
- Zod schemas: grep "z.object" trong schemas.ts ≥ 5 hits
- Zustand persist: grep "persist" trong wizardStore.ts hit
- Manual UAT (Task 4) all 10 steps pass
</verification>

<success_criteria>
1. /chuong-trinh/new render đầy đủ với Stepper + 5 step components, RBAC chặn non-BQL/Admin
2. Step 1: name auto-prefill từ year, year async-check duplicate, totalBudget format VND on blur
3. Step 2: 6 date pickers với cross-validation chains qua Zod superRefine, helper text hạn 30/5
4. Step 3: 2 MultiSelects scoring + evaluation criteria load options từ catalog server-side
5. Step 4: 2 MultiSelects organizations + email templates với "Chọn tất cả" helper
6. Step 5: summary 4 sections + 2 submit buttons (Lưu nháp DRAFT / Tạo + Chuyển sẵn sàng); on success redirect tới detail page
7. Zustand persist localStorage 'program-cycle-wizard' restore on refresh, clear on submit
8. Stepper completed steps clickable để revisit
</success_criteria>

<output>
After completion, create `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-04-SUMMARY.md` theo template.
</output>
