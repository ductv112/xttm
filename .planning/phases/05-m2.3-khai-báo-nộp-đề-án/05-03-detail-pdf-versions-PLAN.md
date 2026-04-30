---
phase: 05-m2.3-khai-báo-nộp-đề-án
plan: 03
title: Trang chi tiết đề án + PDF export + Lịch sử versions + Resubmit flow
wave: 3
autonomous: yes
depends_on: ['05-01', '05-02']
files_modified:
  - app/(app)/de-an/[id]/page.tsx
  - app/(app)/de-an/[id]/_components/ProjectDetailHeader.tsx
  - app/(app)/de-an/[id]/_components/ProjectStatusTimeline.tsx
  - app/(app)/de-an/[id]/_components/TongQuanTab.tsx
  - app/(app)/de-an/[id]/_components/KeHoachTab.tsx
  - app/(app)/de-an/[id]/_components/DuToanTab.tsx
  - app/(app)/de-an/[id]/_components/TaiLieuTab.tsx
  - app/(app)/de-an/[id]/_components/LichSuTab.tsx
  - app/(app)/de-an/[id]/_components/NhatKyTab.tsx
  - app/(app)/de-an/[id]/_components/ResubmitButton.tsx
  - app/(app)/de-an/[id]/_components/WithdrawDialog.tsx
  - lib/pdf/templates/ProjectProposal.tsx
  - app/api/pdf/project/[id]/route.ts
requirements: [PROJ-16, PROJ-19, PROJ-20, PROJ-21, PROJ-22]
---

<objective>
Trang chi tiết đề án với 6 tabs (Tổng quan / Kế hoạch / Dự toán / Tài liệu / Lịch sử / Nhật ký), action buttons theo trạng thái (Withdraw / Resubmit), export PDF chuẩn công văn, hiển thị parent/child link cho đề án 2 năm.
</objective>

<threat_model>
- T-05-03-01 (high): Cross-tenant access — server-side check session.user.organizationId === project.organizationId OR canFromDB('project', 'view')
- T-05-03-02 (medium): PDF authority bypass — /api/pdf/project/[id] verify same access logic
- T-05-03-03 (medium): Stack trace leak in error pages
</threat_model>

<task n="1" id="05-03-01" type="detail-page-tabs">
<read_first>
- d:/Thaodnp/XTTM/app/(app)/de-an/_actions/get-detail.ts
- d:/Thaodnp/XTTM/app/(app)/de-an/_actions/withdraw.ts
- d:/Thaodnp/XTTM/lib/workflows/project.ts
- d:/Thaodnp/XTTM/app/(app)/chuong-trinh/[id]/page.tsx (pattern reference)
- d:/Thaodnp/XTTM/components/shared/StatusBadge.tsx
</read_first>

<action>
Create `app/(app)/de-an/[id]/page.tsx` (RSC):
- auth() + getProjectDetail(id) — verify access
- Render ProjectDetailHeader (sticky) + Tabs nav + tab content (use Next.js Tabs from radix or shadcn)
- 6 tabs as separate components rendered conditionally (single page, NOT sub-routes — simpler)

Components:
1. **ProjectDetailHeader.tsx**: tên + StatusBadge + năm + chu kỳ link + If parentProjectId: Badge "Tiếp nối từ [tên]" linking + If has children: Badge "Đề án năm sau: [tên]" linking. Action area:
   - DRAFT: link "Tiếp tục soạn thảo" → /de-an/new (load draft)
   - SUBMITTED + assignedToUserId === null: button "Rút hồ sơ" (opens WithdrawDialog)
   - SUPPLEMENT_REQUIRED: button "Chỉnh sửa và nộp lại" → /de-an/[id]/edit (Phase 5 stub OK, Phase 6 will wire)
   - Always: button "In/Xuất PDF" → /api/pdf/project/[id]
2. **TongQuanTab.tsx**: thông tin chung (kind, industries, markets, countries, time range), mục tiêu (HTML render từ Tiptap), key stats card grid (ngân sách đăng ký, số tài liệu, ngày nộp, số lần bổ sung if version > 1)
3. **KeHoachTab.tsx**: bảng kế hoạch readonly (rows từ planJson)
4. **DuToanTab.tsx**: bảng dự toán readonly với total + nguồn breakdown chart (mock pie)
5. **TaiLieuTab.tsx**: list documents grouped by category, each row: tên file + size + category badge + download link
6. **LichSuTab.tsx**: ProjectVersion list — table rows: version, ngày, ai, lý do, button "Xem snapshot" (mở Sheet với JSON diff)
7. **NhatKyTab.tsx**: audit log scoped to project.id
8. **ProjectStatusTimeline.tsx** (used in TongQuanTab): vertical timeline với các status transitions
9. **ResubmitButton.tsx** + **WithdrawDialog.tsx**: action handlers

Run npx tsc --noEmit exit 0 và npm run build exit 0 sau mỗi commit.

Commit batches:
- Batch A: page.tsx + Header + TongQuanTab + StatusTimeline
- Batch B: KeHoachTab + DuToanTab + TaiLieuTab
- Batch C: LichSuTab + NhatKyTab + WithdrawDialog + ResubmitButton stub
</action>

<acceptance_criteria>
- /de-an/[id] route works
- 6 tabs render
- npm run build exit 0
</acceptance_criteria>

<done_when>3 commits, detail page renders.</done_when>
</task>

<task n="2" id="05-03-02" type="pdf-export">
<read_first>
- d:/Thaodnp/XTTM/lib/pdf/templates/OfficialDocument.tsx (reference pattern)
- d:/Thaodnp/XTTM/lib/pdf/render.ts
- d:/Thaodnp/XTTM/app/api/pdf/spike/route.ts (pattern)
</read_first>

<action>
1. Create `lib/pdf/templates/ProjectProposal.tsx`:
   - Page A4 portrait
   - Header: 2-column (left: Quốc hiệu CHXHCNVN + "Độc lập - Tự do - Hạnh phúc" Times italic, right: tên Bộ Công Thương + Cục XTTM block)
   - Title: "ĐỀ ÁN XÚC TIẾN THƯƠNG MẠI QUỐC GIA" centered bold
   - Section 1: "I. THÔNG TIN CHUNG" — đơn vị chủ trì, tên đề án, năm, kind, ngành hàng, thị trường
   - Section 2: "II. MỤC TIÊU VÀ NỘI DUNG" — render mục tiêu + nội dung từ Tiptap HTML (convert to react-pdf View)
   - Section 3: "III. KẾ HOẠCH TRIỂN KHAI" — bảng từ planJson
   - Section 4: "IV. DỰ TOÁN KINH PHÍ" — bảng từ budgetJson với total
   - Section 5: "V. CHỦ NHIỆM ĐỀ ÁN" — thông tin contact
   - Footer: ngày tháng năm + signature block (đại diện đơn vị, signature placeholder, dấu mộc placeholder SVG bottom-right)
   - Watermark "BẢN MẪU" diagonal red (status !== APPROVED)
   - Font Be Vietnam Pro registered từ lib/pdf/fonts.ts

2. Create `app/api/pdf/project/[id]/route.ts`:
   ```
   export async function GET(req, { params }) {
     const session = await auth(); if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
     const project = await getProjectDetail(params.id); // throws if no access
     const buffer = await renderProjectProposalPdf({ project, organization: project.organization });
     return new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="de-an-${project.id}.pdf"` } });
   }
   ```

3. Add export wrapper in lib/pdf/render.ts: `renderProjectProposalPdf(props)` analogous to `renderOfficialDocumentPdf`

4. Test: visit /api/pdf/project/[seeded-id] returns PDF >10KB

5. Run npx tsc --noEmit exit 0 và npm run build exit 0

6. Commit: `feat(05-03): PDF export đề án chuẩn công văn với Be Vietnam Pro`
</action>

<acceptance_criteria>
- lib/pdf/templates/ProjectProposal.tsx exists
- /api/pdf/project/[id] route exists
- npm run build exit 0
</acceptance_criteria>

<done_when>PDF export wired, committed.</done_when>
</task>

<task n="3" id="05-03-03" type="status-tracking-and-resubmit">
<read_first>
- d:/Thaodnp/XTTM/app/(app)/de-an/[id]/_components/ProjectStatusTimeline.tsx (just created)
- d:/Thaodnp/XTTM/app/(app)/de-an/_actions/withdraw.ts
- d:/Thaodnp/XTTM/lib/workflows/project.ts
</read_first>

<action>
1. Wire WithdrawDialog → withdrawProject server action → toast "Đã rút hồ sơ" → redirect /de-an

2. Create `/de-an/[id]/edit/page.tsx` — load existing project data into wizard store, redirect to /de-an/new with prefilled data (or build separate edit page; for time, redirect with query param like ?editProjectId=xxx and have wizard handle it)

3. Implement resubmit flow: when status === SUPPLEMENT_REQUIRED, "Chỉnh sửa và nộp lại" button:
   - Click → load project data into wizard store
   - User edits → click "Nộp lại" at step 6 → calls submitProject again (or new resubmitProject action)
   - submitProject auto creates ProjectVersion snapshot before re-saving + version increment + audit

4. Test mock data: use seeded project with status SUPPLEMENT_REQUIRED if any (or update one seed to that status)

5. Commit: `feat(05-03): withdraw + resubmit flow + version snapshot`

Note: resubmit with edit may be partially-stubbed for time — basic withdraw + status display sufficient. Phase 6 (Tiếp nhận) will set status to SUPPLEMENT_REQUIRED via real flow, so resubmit testing comes naturally then.
</action>

<acceptance_criteria>
- WithdrawDialog wired
- /de-an/[id]/edit route exists (even if redirects)
- ProjectVersion increments on resubmit (verify via prisma query after manual test)
- npm run build exit 0
</acceptance_criteria>

<done_when>Resubmit flow stub committed.</done_when>
</task>

<verification>
npm run build exit 0. Update STATE.md, ROADMAP.md, REQUIREMENTS.md mark all PROJ-* complete.
Phase 5 done.
</verification>
