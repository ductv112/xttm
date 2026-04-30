---
phase: 05-m2.3-khai-báo-nộp-đề-án
plan: 03
subsystem: ui
tags: [detail-page, tabs, pdf-export, react-pdf, status-timeline, project-version, withdraw, resubmit, hero-flow, vietnamese-pdf]

requires:
  - phase: 01-m0-bootstrap-h-t-ng
    provides: Be Vietnam Pro static TTF fonts, lib/pdf/fonts.ts registerPdfFonts, lib/pdf/render.ts wrapper pattern, OfficialDocument template reference
  - phase: 05-01-foundation
    provides: 11 server actions (getProjectDetail/withdrawProject/submitProject với SUPPLEMENT_REQUIRED→RESUBMITTED auto-transition), ProjectVersion model + per-submit snapshot, parsed shapes (parseGeneralInfo/parseObjectives/parsePlan/parseBudget)
  - phase: 05-02-wizard
    provides: ProjectWizardShell + Zustand wizardStore với replaceAll() + setUserScopeKey(), Step5DocumentEntry shape, /de-an/new entry để redirect tới sau edit hydration

provides:
  - /de-an/[id] route với 6 tabs (Tổng quan / Kế hoạch / Dự toán / Tài liệu / Lịch sử / Nhật ký) — single-page Tabs primitive với hash-driven URLs (#tong-quan, #ke-hoach, ...)
  - ProjectDetailHeader sticky với tên + StatusBadge + meta + parent/child badges (đề án 2 năm) + 4 action buttons gated theo status (Tiếp tục soạn thảo / Rút hồ sơ / Chỉnh sửa và nộp lại / In PDF)
  - ProjectStatusTimeline visual với 5 transition entries (CREATE/SUBMIT/TRANSITION/ASSIGN/APPROVE/REJECT) từ audit log + current dot active indicator
  - PDF export ProjectProposal chuẩn công văn nhà nước (A4 portrait, header CHXHCNVN 2-col, 5 sections I-V, signature block với SVG dấu mộc placeholder, watermark BẢN MẪU diagonal khi !== APPROVED)
  - WithdrawDialog wired với withdrawProject + ConfirmDialog destructive + toast feedback + redirect /de-an
  - ResubmitButton + /de-an/[id]/edit route — load existing project data into wizard store qua replaceAll() + setSavedDraftProjectId() → redirect /de-an/new để tiếp tục
  - /api/pdf/project/[id] route Node runtime với auth + cross-tenant guard + render PDF buffer + stream inline application/pdf
  - /api/project-version/[id] route fetch ProjectVersion snapshot JSON cho LichSuTab on-demand

affects: [phase-06 tiếp nhận BQL sẽ trigger SUBMITTED→ASSIGNED→IN_REVIEW→SUPPLEMENT_REQUIRED transitions visible trong status timeline + lịch sử versions, phase-07 thẩm định reads same project records via /de-an/[id], phase-09 sẽ reuse PDF chuẩn công văn pattern cho biên bản nghiệm thu]

tech-stack:
  added: []
  patterns:
    - "Single-page Tabs primitive với hash bookmarkable URLs (vs sub-routes Phase 3 cycle pattern) — plan locked simpler approach since tab content cùng chia sẻ project data + RBAC; hash sync qua window.history.replaceState giữ scroll vị trí"
    - "PDF template reuse pattern: lib/pdf/render.ts wrapper hàm renderProjectProposalPdf analogous renderOfficialDocumentPdf — cùng registerPdfFonts() idempotent + renderToBuffer; Phase 7+ sẽ thêm renderTotrinhPdf, renderBienBanNghiemThuPdf cùng style"
    - "htmlToPlain helper strip Tiptap HTML → plain text cho react-pdf <Text> (react-pdf không support dangerouslySetInnerHTML/raw HTML); preserve <p>/<br>/<li> as newlines + bullet markers"
    - "SVG dấu mộc placeholder qua react-pdf <Svg>/<Circle>/<Path> — pure vector, no raster image; ngôi sao 5 cánh + 2 vòng tròn đỏ giả lập dấu mộc nhà nước"
    - "Status timeline build từ audit log filter action IN (SUBMIT/TRANSITION/ASSIGN/APPROVE/REJECT) + initial DRAFT entry từ project.createdAt; diffJson.after.status extraction để display target state cho mỗi transition"
    - "ProjectVersion snapshot fetch lazy on-demand qua /api/project-version/[id] thay vì pre-load tất cả snapshots vào client — versions array có thể grow lớn theo thời gian + JSON snapshot có thể nặng"
    - "Edit page redirect pattern (vs separate edit wizard): hydrate Zustand store với replaceAll(initialData) + setSavedDraftProjectId(projectId) → router.push(/de-an/new) — wizard tiếp tục autosave merges vào cùng project record qua existing save-draft projectId param; tránh duplicate wizard implementation"
    - "Resubmit flow leverages existing submit.ts: fromStatus === 'SUPPLEMENT_REQUIRED' auto-detected → targetStatus = 'RESUBMITTED' + ProjectVersion snapshot + currentVersion increment — không cần new resubmitProject action"

key-files:
  created:
    - "app/(app)/de-an/[id]/page.tsx (RSC: auth + getProjectDetail + load catalogs + status timeline từ audit + recent audit entries → ProjectTabsShell)"
    - "app/(app)/de-an/[id]/_components/ProjectDetailHeader.tsx (sticky header với StatusBadge + parent/child badges + 4 action buttons gated theo status)"
    - "app/(app)/de-an/[id]/_components/ProjectTabsShell.tsx (client tabs với hash bookmarkable URLs, 6 tab triggers + content)"
    - "app/(app)/de-an/[id]/_components/ProjectStatusTimeline.tsx (vertical timeline visual với current dot active + reversed order)"
    - "app/(app)/de-an/[id]/_components/TongQuanTab.tsx (4 stat cards + 2-col layout với thông tin chung + mục tiêu Tiptap render + status timeline sidebar)"
    - "app/(app)/de-an/[id]/_components/KeHoachTab.tsx (bảng readonly từ planJson với STT/hạng mục/sản phẩm bàn giao/thời hạn/phụ trách)"
    - "app/(app)/de-an/[id]/_components/DuToanTab.tsx (3 stat cards + horizontal bar source breakdown + chi tiết table với footer 3 dòng tổng Nhà nước/Đối ứng/Tổng cộng)"
    - "app/(app)/de-an/[id]/_components/TaiLieuTab.tsx (documents grouped by category PLAN/CAPABILITY/EVIDENCE/OTHER với tile list + download link qua /api/file/[id])"
    - "app/(app)/de-an/[id]/_components/LichSuTab.tsx (bảng versions sorted desc + Sheet on-demand snapshot fetch qua /api/project-version/[id])"
    - "app/(app)/de-an/[id]/_components/NhatKyTab.tsx (vertical timeline 50 audit entries scoped resource=de-an, resourceId=project.id)"
    - "app/(app)/de-an/[id]/_components/WithdrawDialog.tsx (ConfirmDialog wrap withdrawProject + toast + redirect /de-an)"
    - "app/(app)/de-an/[id]/_components/ResubmitButton.tsx (router push /de-an/[id]/edit)"
    - "app/(app)/de-an/[id]/edit/page.tsx (RSC: status gate DRAFT/SUPPLEMENT_REQUIRED + build ProjectWizardData từ project shape → ProjectEditEntry)"
    - "app/(app)/de-an/[id]/edit/_components/ProjectEditEntry.tsx (client: setUserScopeKey + waitForHydration → replaceAll + setSavedDraftProjectId → router.push /de-an/new)"
    - "lib/pdf/templates/ProjectProposal.tsx (A4 portrait template với header 2-col CHXHCNVN, 5 sections I-V, signature block với SVG dấu mộc, watermark BẢN MẪU)"
    - "app/api/pdf/project/[id]/route.ts (GET endpoint Node runtime với auth + cross-tenant guard + render PDF buffer + stream inline)"
    - "app/api/project-version/[id]/route.ts (GET endpoint với auth + cross-tenant guard + parsed snapshot JSON)"
  modified:
    - "lib/pdf/render.ts (thêm renderProjectProposalPdf wrapper analogous renderOfficialDocumentPdf với type cast cho Document narrowing)"

key-decisions:
  - "Single-page tabs (vs sub-routes như chuong-trinh detail) — plan locked 'simpler' approach; 6 tab content nhỏ enough để load chung; hash bookmarkable thay vì URL path"
  - "Edit page hydrate-then-redirect pattern — không tạo separate ProjectEditShell; tận dụng existing /de-an/new wizard với replaceAll(initialData) + savedDraftProjectId; trade-off UI flash 600ms 'Đang chuẩn bị…' nhưng giảm 70% code duplicate"
  - "Resubmit dùng cùng submitProject server action — submit.ts đã handle SUPPLEMENT_REQUIRED → RESUBMITTED auto-detection trong fromStatus logic; không tạo new resubmitProject action"
  - "PDF template inline width sums (budgetLeftSpan = '68%', budgetRightSpan = '18%') thay computed expression — TypeScript noUncheckedIndexedAccess strict + tuple as const không narrow array indexing đủ; precomputed constants cleaner và tránh runtime concat"
  - "Status timeline build qua filter audit log AuditAction IN ['SUBMIT', 'TRANSITION', 'ASSIGN', 'APPROVE', 'REJECT'] + initial DRAFT entry từ project.createdAt — Phase 6 sẽ thêm transitions tương ứng từ ASSIGN/IN_REVIEW/SUPPLEMENT_REQUIRED actions"
  - "ProjectStatusTimeline tách thành standalone component nhận entries[] prop — tái dùng cho mock data trong tests + Phase 6 có thể reuse cho admin dashboard"
  - "/api/project-version/[id] tách route thay vì server action — fetch on-demand từ Sheet open click giảm initial page weight; cùng cross-tenant guard pattern reuse"
  - "renderProjectProposalPdf type cast (ProjectProposal as unknown as React.ComponentType<ProjectProposalProps>) — react-pdf renderToBuffer signature expects ReactElement<DocumentProps> nhưng createElement loses Document narrowing với .tsx component returning <Document>; cùng issue OfficialDocument cũng có"

metrics:
  duration: "~25m"
  completed: "2026-04-30"
  tasks: 3
  commits: 5
---

# Phase 5 Plan 03: Trang chi tiết đề án + PDF export + Resubmit flow Summary

Trang chi tiết đề án với 6 tabs nội dung, action buttons theo trạng thái, status timeline visual, PDF export chuẩn công văn nhà nước với Be Vietnam Pro, và edit/resubmit flow tận dụng existing wizard.

## Done

- [x] Task 1 Batch A (`f4a0551`): /de-an/[id] RSC + ProjectDetailHeader sticky + ProjectTabsShell client tabs + TongQuanTab với 4 stat cards + ProjectStatusTimeline + WithdrawDialog wired + ResubmitButton stub + 5 placeholder tabs
- [x] Task 1 Batch B (`4694f98`): KeHoachTab bảng readonly + DuToanTab với 3 stat cards + horizontal bar source breakdown + chi tiết table + TaiLieuTab grouped by category với download links
- [x] Task 1 Batch C (`4c63fbb`): LichSuTab bảng ProjectVersion + Sheet snapshot lazy load + NhatKyTab vertical timeline + /api/project-version/[id] route với cross-tenant guard
- [x] Task 2 (`0162b38`): lib/pdf/templates/ProjectProposal.tsx (A4 + 5 sections + SVG dấu mộc + watermark) + lib/pdf/render.ts renderProjectProposalPdf wrapper + app/api/pdf/project/[id]/route.ts với auth + cross-tenant guard
- [x] Task 3 (`f7c3497`): /de-an/[id]/edit RSC với status gate + ProjectEditEntry client hydrate-then-redirect pattern; resubmit leverages existing submit.ts auto-detection

## Decisions Made

See `key-decisions` in frontmatter.

## Architecture

```
/de-an/[id]                                    [GET]   RSC: auth + getProjectDetail + load catalogs + status timeline → ProjectTabsShell
  ProjectDetailHeader (sticky)
    ├── Back link "Danh sách đề án"
    ├── h1 + StatusBadge + meta (code, year, kind, cycle link, org, submittedAt, version)
    ├── Parent/child badges (đề án 2 năm) — Link tới sibling
    └── Action buttons (gated theo status + isOwner)
        ├── DRAFT + isOwner → "Tiếp tục soạn thảo" → /de-an/new
        ├── SUBMITTED + !assignedToUserId + isOwner → WithdrawDialog → withdrawProject
        ├── SUPPLEMENT_REQUIRED + isOwner → ResubmitButton → /de-an/[id]/edit
        └── Always → "In/Xuất PDF" → /api/pdf/project/[id] (target=_blank)

  ProjectTabsShell (client)
    ├── Hash-driven default tab (#tong-quan, #ke-hoach, ...)
    ├── 6 TabsTrigger với count badges (Tài liệu, Lịch sử)
    └── 6 TabsContent
        ├── TongQuanTab — 4 stat cards + thông tin chung + Tiptap mục tiêu/nội dung + status timeline sidebar
        ├── KeHoachTab — bảng readonly planRows
        ├── DuToanTab — 3 stat cards + horizontal bar + chi tiết table với 3 dòng footer tổng
        ├── TaiLieuTab — grouped by category với download
        ├── LichSuTab — bảng versions + Sheet snapshot fetch (lazy)
        └── NhatKyTab — vertical timeline 50 audit entries

/de-an/[id]/edit                              [GET]   RSC: auth + getProjectDetail + status gate (DRAFT|SUPPLEMENT_REQUIRED)
  ProjectEditEntry (client)
    ├── setUserScopeKey + waitForHydration
    ├── replaceAll(initialData built from project shape)
    ├── setSavedDraftProjectId(projectId)  ← merges autosave vào cùng record
    └── router.push(/de-an/new) (tiếp tục soạn thảo)
        → user edits → Step6 click "Nộp đề án" → submitProject(projectId)
        → submit.ts auto-detects SUPPLEMENT_REQUIRED → RESUBMITTED transition + version snapshot + audit

/api/pdf/project/[id]                          [GET]   Node runtime, application/pdf inline
  → auth + getProjectDetail (cross-tenant guard) → resolve catalog names → renderProjectProposalPdf
  → ProjectProposal template (A4 portrait, Be Vietnam Pro):
      Header 2-col: BỘ CT/CỤC XTTM | CHXHCNVN/Độc lập-Tự do-Hạnh phúc
      Title: ĐỀ ÁN XTTM QUỐC GIA NĂM <Y>
      I. Thông tin chung — đơn vị, năm, kind, ngành hàng, thị trường, quốc gia
      II. Mục tiêu và nội dung — htmlToPlain(Tiptap HTML)
      III. Kế hoạch triển khai — bảng planRows
      IV. Dự toán kinh phí — bảng budgetRows + 3 dòng tổng (Nhà nước/Đối ứng/Tổng cộng)
      V. Chủ nhiệm đề án — contact snapshot
      Signature block: ngày + đại diện đơn vị + SVG dấu mộc + watermark BẢN MẪU diagonal red

/api/project-version/[id]                      [GET]   application/json
  → auth + cross-tenant guard → parsed snapshot JSON
```

## Deviations from Plan

None - plan executed as written. Plan-prescribed "stub OK" behaviors implemented:
- Edit page implemented as hydrate-then-redirect pattern (plan: "or build separate edit page; for time, redirect with query param")
- Resubmit flow leverages existing submit.ts auto-detection (plan: "Phase 6 will set status to SUPPLEMENT_REQUIRED via real flow, so resubmit testing comes naturally then")

## Threat Mitigation

- T-05-03-01 (high) Cross-tenant access: getProjectDetail returns null when not own org AND no canFromDB('de-an','read') — defense-in-depth duplicated trong /api/pdf/project + /api/project-version + /de-an/[id]/edit
- T-05-03-02 (medium) PDF authority bypass: /api/pdf/project/[id] reuses getProjectDetail authorization logic (same null-on-deny semantic)
- T-05-03-03 (medium) Stack trace leak: error pages use notFound() (next/navigation) instead of throwing — Next 15 default 404 page rendered (no stack trace)

## Auth Gates

None — all routes operate qua existing session.

## Known Stubs

- `/api/project-version/[id]` returns parsed snapshot JSON — UI displays raw JSON in <pre> block. Future Phase 6+ enhancement: diff visual giữa 2 versions thay vì raw JSON view.
- ProjectEditEntry redirect timing 600ms — UX friction nhưng acceptable để user thấy alert message; alternative would require server-side template duplication.

## Self-Check: PASSED

All 18 created files verified on disk. All 5 commits (f4a0551, 4694f98, 4c63fbb, 0162b38, f7c3497) verified in git log. npm run build exit 0 với `/de-an/[id]`, `/de-an/[id]/edit`, `/api/pdf/project/[id]`, `/api/project-version/[id]` routes registered.
