---
phase: 05-m2.3-khai-báo-nộp-đề-án
plan: 02
title: Wizard 6 bước - HERO screen công khai nhất
wave: 2
autonomous: yes
depends_on: ['05-01']
files_modified:
  - app/(app)/de-an/page.tsx
  - app/(app)/de-an/_components/SubmissionGate.tsx
  - app/(app)/de-an/new/page.tsx
  - app/(app)/de-an/new/_lib/types.ts
  - app/(app)/de-an/new/_lib/schemas.ts
  - app/(app)/de-an/new/_lib/wizardStore.ts
  - app/(app)/de-an/new/_components/ProjectWizardShell.tsx
  - app/(app)/de-an/new/_components/Step1ThongTinChung.tsx
  - app/(app)/de-an/new/_components/Step2MucTieuKeHoach.tsx
  - app/(app)/de-an/new/_components/Step3DuToan.tsx
  - app/(app)/de-an/new/_components/Step4ChuNhiem.tsx
  - app/(app)/de-an/new/_components/Step5TaiLieu.tsx
  - app/(app)/de-an/new/_components/Step6XemLai.tsx
  - app/(app)/de-an/new/_components/CopyFromPreviousDialog.tsx
requirements: [PROJ-01, PROJ-02, PROJ-04, PROJ-05, PROJ-06, PROJ-07, PROJ-08, PROJ-09, PROJ-10, PROJ-11, PROJ-12, PROJ-13]
---

<objective>
Build HERO multi-step wizard 6 bước (the screen audience nhìn nhiều nhất). Pattern: single URL `/de-an/new`, RHF + Zustand persist + Zod per-step + autosave 2s + Stepper visual. Reuse Phase 3 ProgramCycle wizard pattern.
</objective>

<threat_model>
- T-05-02-01 (high): Submit via direct API bypass UI — server action validates programCycle + orgProfile gating
- T-05-02-02 (medium): Autosave race conditions — debounce + last-write-wins, no risk of data loss
- T-05-02-03 (medium): localStorage tampering — server validates everything on submit
</threat_model>

<task n="1" id="05-02-01" type="store-and-schemas">
<read_first>
- d:/Thaodnp/XTTM/.planning/phases/05-m2.3-khai-báo-nộp-đề-án/05-CONTEXT.md
- d:/Thaodnp/XTTM/app/(app)/chuong-trinh/new/_lib/wizardStore.ts (pattern reference)
- d:/Thaodnp/XTTM/app/(app)/chuong-trinh/new/_lib/schemas.ts
- d:/Thaodnp/XTTM/app/(app)/de-an/_actions/types.ts (Zod schemas already)
</read_first>

<action>
Create:

1. `_lib/types.ts` — TypeScript types for ProjectWizardData (6 step shape)
2. `_lib/schemas.ts` — 6 Zod schemas (step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema). Reuse from server actions/types.ts where applicable
3. `_lib/wizardStore.ts` — Zustand store with persist middleware:
   ```
   import { create } from 'zustand';
   import { persist, createJSONStorage } from 'zustand/middleware';
   
   interface State {
     currentStep: number;
     completedSteps: Set<number>;
     data: Partial<ProjectWizardData>;
     copyFromProjectId: string | null;
     is2Year: boolean;
     // actions
     setStep, markCompleted, updateData, reset, setCopyFromPrevious, set2YearMode
   }
   
   export const useProjectWizardStore = create<State>()(persist(...))
   ```
   Persist key: `project-wizard-{userId}` (parameterized).
4. Run npx tsc --noEmit exit 0
5. Commit: `feat(05-02): wizard scaffolding — Zustand store + 6 Zod schemas + types`
</action>

<acceptance_criteria>
- 3 files exist in _lib/
- Zustand store has persist middleware
- 6 schemas exported from schemas.ts
- npx tsc --noEmit exit 0
</acceptance_criteria>

<done_when>Wizard scaffolding committed.</done_when>
</task>

<task n="2" id="05-02-02" type="gate-and-shell">
<read_first>
- d:/Thaodnp/XTTM/app/(app)/chuong-trinh/_actions/list.ts (active cycle check pattern)
- d:/Thaodnp/XTTM/app/(app)/don-vi-cua-toi/_actions/get-or-create.ts
- d:/Thaodnp/XTTM/app/(app)/de-an/_actions/list-mine.ts
- d:/Thaodnp/XTTM/components/shared/program-cycle/Stepper.tsx (reuse)
- d:/Thaodnp/XTTM/components/shared/EmptyState.tsx
</read_first>

<action>
1. Create `app/(app)/de-an/page.tsx` (RSC) — cổng tiếp nhận:
   - auth() check
   - if user.role !== DONVI → redirect /dashboard
   - Get active programCycle (OPEN_REGISTRATION) and user's orgProfile
   - Render `<SubmissionGate cycle={cycle} profile={profile} />` with 3 states UI:
     - cycle && profile.status==='APPROVED' → green Alert "Đợt mời đề xuất [year] đang mở — hạn [date]" + button "Tạo đề án mới" linking /de-an/new + `<MyProjectsList />`
     - cycle && profile.status!=='APPROVED' → yellow Alert "Hồ sơ đơn vị chưa được phê duyệt..." + button disabled
     - !cycle → gray Alert "Hiện chưa có đợt mời nào đang mở..." + button disabled
   - Plus DataTable của đề án đã nộp (call listMyProjects)

2. Create `app/(app)/de-an/_components/SubmissionGate.tsx` (client) — handles 3 states above with proper styling

3. Create `app/(app)/de-an/new/page.tsx` (RSC):
   - auth + role check + active cycle check (redirect to /de-an if no cycle)
   - Get orgProfile (must be APPROVED)
   - Render `<ProjectWizardShell userId={userId} programCycleId={cycle.id} year={year} />` (client)

4. Create `_components/ProjectWizardShell.tsx` (client):
   - Use Stepper component (6 steps) + render current step component
   - Top bar: "Khai báo đề án năm [year]" + "Lưu nháp" button + "Sao chép từ đề án cũ" button (opens CopyFromPreviousDialog)
   - Bottom bar: Previous + Next + (on last step) "Nộp đề án"
   - Autosave: useEffect watching form state with 2s debounce → call saveDraftProject server action, show "Đã lưu lúc HH:mm:ss" indicator
   - On Next: validate current step Zod, mark completed, advance
   - On submit (step 6): call submitProject

5. Run npx tsc --noEmit exit 0
6. Commit: `feat(05-02): /de-an cổng tiếp nhận + /de-an/new wizard shell`
</action>

<acceptance_criteria>
- /de-an route renders với gate logic
- /de-an/new wizard shell renders Stepper
- Sao chép button và Lưu nháp button visible
- Autosave indicator works
- npx tsc --noEmit exit 0
- npm run build exit 0
</acceptance_criteria>

<done_when>Cổng tiếp nhận + wizard shell committed.</done_when>
</task>

<task n="3" id="05-02-03" type="step-components">
<read_first>
- d:/Thaodnp/XTTM/app/(app)/chuong-trinh/new/_components/Step1ThongTinChung.tsx (pattern)
- d:/Thaodnp/XTTM/components/shared/RichTextEditor.tsx
- d:/Thaodnp/XTTM/components/shared/MultiSelect.tsx
- d:/Thaodnp/XTTM/components/shared/DateRangePicker.tsx
</read_first>

<action>
Create 6 step components:

1. **Step1ThongTinChung.tsx**: tên đề án (Input), kind (Select 8 catalog ProjectKind), industrySectorIds (MultiSelect from catalog), marketIds (MultiSelect), countryIds (MultiSelect), promotionTypeIds (MultiSelect), thời gian (DateRangePicker hoặc nếu kind là đoàn ra thì cho phép Quarter Select Q1/Q2/Q3/Q4 + cho phép sửa thành ngày cụ thể), Toggle "Đề án 2 năm" → if ON, show input "Năm tiếp theo"

2. **Step2MucTieuKeHoach.tsx**: 
   - mục tiêu (RichTextEditor Tiptap, min 100 chars validate)
   - nội dung (RichTextEditor Tiptap, min 200 chars)
   - kế hoạch (table input rows: hạng mục text, deliverable text, due date DatePicker, owner text — add/remove row buttons, min 1 row)

3. **Step3DuToan.tsx**: bảng dự toán table — rows: hạng mục text, đơn vị tính text, số lượng number, đơn giá number, thành tiền (auto: số lượng × đơn giá, readonly), nguồn (Select: Nhà nước / Đối ứng đơn vị) — add/remove row, min 1 row. Show total bottom (auto sum) + ngân sách tổng (manual input để tham chiếu, validate >= total)

4. **Step4ChuNhiem.tsx**: Select chủ nhiệm từ orgProfile.contacts (hiện danh sách contacts với role) — option to "Thêm chủ nhiệm mới" (mở Dialog form contact mới + save to orgProfile). Hiển thị thông tin chi tiết khi chọn

5. **Step5TaiLieu.tsx**: drag-drop multi-file upload với category dropdown (Kế hoạch chi tiết / Hồ sơ năng lực / Bằng chứng kinh nghiệm / Khác) per file. List uploaded files với delete. Use uploadDocument server action. Max 20 files, 10MB/file

6. **Step6XemLai.tsx**: readonly summary toàn bộ data từ 5 steps trước (formatted nicely với section headings) + checkbox "Tôi cam đoan các thông tin trên là đúng sự thật" (required to enable submit) + buttons "Lưu nháp" và "Nộp đề án" (Nộp = submit + redirect to detail page)

7. **CopyFromPreviousDialog.tsx**: Dialog hiển thị list đề án cũ (call listPreviousProjects) — click chọn → calls copyFromPrevious server action → updates wizard store data

All Vietnamese formal tone. Validation messages step-specific.

Run npx tsc --noEmit exit 0 và npm run build exit 0 sau mỗi commit.

Commit batches:
- Batch A: Step 1 + Step 2 + CopyDialog
- Batch B: Step 3 + Step 4
- Batch C: Step 5 + Step 6 (final)
</action>

<acceptance_criteria>
- 6 step components + CopyDialog exist
- npm run build exit 0
- /de-an/new flow renders all 6 steps when navigated
</acceptance_criteria>

<done_when>3 commits, full wizard renders.</done_when>
</task>

<verification>
npm run build exit 0. Update STATE.md (plan 2/3 in Phase 5), ROADMAP.md, mark PROJ requirements complete in REQUIREMENTS.md.
</verification>
