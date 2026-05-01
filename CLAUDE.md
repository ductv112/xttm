# CLAUDE.md — Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại (XTTMQG)

> File này định nghĩa context, ràng buộc và quy tắc làm việc cho Claude Code khi làm việc trong dự án này.

---

## 1. Mục tiêu dự án

**Loại dự án**: PROTOTYPE / POC để demo cho khách hàng (Bộ Công Thương — Cục Xúc tiến Thương mại).

**KHÔNG phải production**. Mục tiêu duy nhất: chứng minh được toàn bộ quy trình nghiệp vụ trên giao diện đẹp, mượt, đầy đủ chức năng — đủ để khách hàng "chốt" POC.

**Hệ quả ràng buộc**:
- Ưu tiên **độ phủ chức năng** + **chất lượng UI/UX** hơn là độ chặt chẽ kiến trúc backend.
- **Mock data** thay cho dữ liệu thật (10-15 bản ghi/loại).
- **Mock auth** với 8 tài khoản cứng — không tích hợp SSO, không OTP thật.
- **Không** triển khai chữ ký số, không tích hợp email/SMS gateway thật (chỉ giả lập trong app).
- **Không** triển khai an toàn thông tin cấp độ 3, audit log đầy đủ — chỉ ở mức demo được.
- Tất cả thao tác xuất file (PDF/Excel) phải chạy được, sinh file mẫu thực sự.

---

## 2. Tech Stack

### Frontend & Backend (full-stack)
- **Next.js 15** (App Router) + **TypeScript** (strict mode)
- **Tailwind CSS v4** + **shadcn/ui** (component primitives)
- **Lucide React** (icons)
- **Framer Motion** (micro-animations)

### Forms & Data
- **React Hook Form** + **Zod** (validation schema-first)
- **TanStack Table v8** (data tables)
- **TanStack Query** (server state)
- **Zustand** (UI state nhẹ: sidebar, theme, notifications panel)

### Database
- **SQLite** + **Prisma ORM** — file-based, zero-config
- File DB: `prisma/dev.db` (gitignored), seed lại được bằng `npm run db:seed`

### Auth
- **NextAuth.js** với **Credentials Provider**
- Tài khoản hardcoded trong `prisma/seed.ts` (xem mục 5)
- Session JWT, không refresh token phức tạp

### Tiện ích
- **Recharts** — charts dashboard
- **Sonner** — toast notifications
- **date-fns** + locale `vi` — định dạng ngày tháng
- **jsPDF** + **@react-pdf/renderer** — xuất PDF (quyết định, biên bản)
- **xlsx** (SheetJS) — xuất Excel báo cáo

---

## 3. Cấu trúc thư mục

```
d:/Thaodnp/XTTM/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group cho login
│   │   └── login/
│   ├── (app)/                    # Route group cho phần đã đăng nhập (có layout sidebar)
│   │   ├── dashboard/
│   │   ├── chuong-trinh/         # Quản lý chu kỳ chương trình XTTM năm (BQL khởi tạo)
│   │   ├── don-vi-chu-tri/       # Hồ sơ đơn vị chủ trì
│   │   ├── de-an/                # Quản lý đề án
│   │   ├── tham-dinh/            # Hội đồng thẩm định
│   │   ├── hop-dong/             # Quản lý hợp đồng
│   │   ├── trien-khai/           # Theo dõi triển khai
│   │   ├── bao-cao/              # Báo cáo & nghiệm thu
│   │   ├── tai-chinh/            # Tạm ứng/quyết toán
│   │   ├── danh-muc/             # Danh mục hệ thống
│   │   ├── nguoi-dung/           # Quản lý user/role
│   │   └── thong-bao/            # Inbox thông báo
│   ├── api/                      # API routes (nếu cần)
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # AppSidebar, AppTopbar, AppShell
│   ├── de-an/                    # Components nghiệp vụ theo phân hệ
│   ├── tham-dinh/
│   └── ...
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client singleton
│   ├── utils.ts                  # cn(), formatters
│   ├── permissions.ts            # RBAC matrix
│   └── constants.ts              # Trạng thái đề án, vai trò, etc.
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                   # Mock data 10-15 records/loại
│   └── dev.db                    # Gitignored
├── public/
│   ├── mock-files/               # PDF/Excel mẫu để demo download
│   └── logo.svg
├── .planning/                    # GSD workflow artifacts
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── intel/
│   └── milestones/
├── CLAUDE.md                     # File này
├── package.json
└── ...
```

---

## 4. Vai trò & ma trận phân quyền (RBAC)

7 nhóm vai trò:
1. **Admin** — toàn quyền danh mục, user, cấu hình
2. **Ban quản lý CT XTTM** — tiếp nhận, phân công, tổng hợp, ra quyết định
3. **Chuyên viên kiểm tra** — kiểm tra hồ sơ, chấm điểm sơ bộ
4. **Hội đồng thẩm định** — chấm điểm thẩm định
5. **Đơn vị chủ trì** — khai báo & nộp đề án, báo cáo, điều chỉnh
6. **Tài chính** — tạm ứng, thanh toán, quyết toán
7. **Lãnh đạo** — phê duyệt, dashboard, báo cáo cấp cao

Định nghĩa quyền cụ thể trong `lib/permissions.ts`. Sidebar menu render động theo role.

---

## 5. Tài khoản demo (mock)

| Username | Password | Vai trò | Đơn vị |
|---|---|---|---|
| `admin` | `Admin@123` | Admin | — |
| `banql` | `Banql@123` | Ban quản lý CT XTTM | Cục XTTM |
| `chuyenvien` | `Cv@123` | Chuyên viên kiểm tra | Cục XTTM |
| `hoidong` | `Hd@123` | Hội đồng thẩm định | Hội đồng năm hiện tại |
| `donvi1` | `Donvi@123` | Đơn vị chủ trì | Hiệp hội Da giày VN |
| `donvi2` | `Donvi@123` | Đơn vị chủ trì | Hiệp hội Dệt may VN |
| `taichinh` | `Tc@123` | Tài chính | Cục XTTM |
| `lanhdao` | `Ld@123` | Lãnh đạo | Bộ Công Thương |

Tất cả tài khoản được seed trong `prisma/seed.ts`, mật khẩu hash bằng bcrypt.

---

## 6. Phân hệ chức năng (190 chức năng — chia 14 module)

### Phân hệ I — Quản trị hệ thống
1. **Auth & SSO** (mock SSO bằng button placeholder)
2. **Quản lý người dùng**
3. **Vai trò & nhóm quyền** + Ma trận phân quyền
4. **Danh mục** (loại đề án, ngành hàng, thị trường, loại hình XTTM, quốc gia, đơn vị, tiêu chí chấm điểm, mẫu văn bản)
5. **Cấu hình hệ thống** (cảnh báo, email/SMS template — chỉ UI)
6. **Lịch sử truy cập / audit log**

### Phân hệ II — Nghiệp vụ
7. **Chu kỳ Chương trình XTTM năm** *(điều kiện tiền đề cho mọi đề án)*
   - BQL tạo chương trình năm, cấu hình mốc thời gian, ngân sách, tiêu chí thẩm định, mẫu công văn/email, danh sách đơn vị được mời
   - Upload bản scan công văn mời (ban hành ngoài hệ thống)
   - State machine: DRAFT → READY → OPEN_REGISTRATION → CLOSED_REGISTRATION → EVALUATING → APPROVED → COMPLETED
   - **Gating**: đơn vị chủ trì chỉ thấy nút "Tạo đề án mới" khi có `ProgramCycle.status = OPEN_REGISTRATION`
   - Composer email gửi thông báo hàng loạt cho danh sách đơn vị được mời
   - Mỗi `Project` (đề án) FK về `ProgramCycle.id`
8. **Quản lý đơn vị chủ trì** (hồ sơ tổ chức, năng lực, đầu mối)
9. **Khai báo & nộp đề án** (multi-step form: thông tin chung → mục tiêu → dự toán → chủ nhiệm → tài liệu → nộp; chỉ cho phép khi chu kỳ đang `OPEN_REGISTRATION`)
10. **Tiếp nhận & phân công kiểm tra**
11. **Thẩm định đề án** (hội đồng, phiếu chấm, tổng hợp điểm)
12. **Quyết định phê duyệt** (lập tờ trình, nhập quyết định, thông báo)
13. **Quản lý hợp đồng** (sinh từ đề án duyệt, upload bản scan, theo dõi)
14. **Tạm ứng / Thanh quyết toán**
15. **Kế hoạch triển khai & theo dõi thực hiện**
16. **Điều chỉnh đề án** (Điều 13 NĐ 28: thay đổi nhỏ vs trọng yếu)
17. **Báo cáo kết quả** (đơn vị chủ trì gửi)
18. **Nghiệm thu & thanh lý**
19. **Dashboard thống kê** (cards, charts, drill-down)
20. **Thông báo & cảnh báo** (SLA, ngoại giao 30 ngày, ký HĐ chậm 60 ngày)

---

## 7. Mốc thời gian / SLA cần demo cảnh báo

- **Trước 30/5**: hạn nộp đề án
- **30 ngày trước sự kiện quốc tế**: bắt buộc liên hệ thương vụ/đại sứ quán
- **60 ngày sau quyết định phê duyệt**: cảnh báo chậm ký hợp đồng
- **15 ngày sau hoạt động**: hạn nộp báo cáo tổng hợp
- **2 tháng sau quyết định**: thông báo nhắc ký hợp đồng

Demo bằng cách seed mock data với ngày tháng đặt sao cho hiển thị đủ các trạng thái cảnh báo.

---

## 8. Quy tắc làm việc (cho Claude Code)

### 8.1. Ngôn ngữ
- **Toàn bộ UI**: tiếng Việt (kể cả error messages, validation messages, button labels).
- **Code identifier**: tiếng Anh (camelCase/PascalCase).
- **Comment trong code**: tiếng Anh, ngắn gọn, chỉ khi WHY không rõ.
- **Tài liệu nghiệp vụ** trong `.planning/`: tiếng Việt.

### 8.2. UI/UX standards
- Mọi form dài phải chia **multi-step** với progress indicator (đề án có 6 step).
- Mọi list view phải có: search, filter, sort, pagination, bulk action, export.
- Mọi action quan trọng phải có: confirmation dialog (hủy/xóa/nộp), toast feedback, optimistic UI.
- Empty states phải có illustration + CTA.
- Loading states phải dùng skeleton, không spinner toàn trang.
- Responsive: tối thiểu chạy mượt ở 1366×768 và 1920×1080. Mobile không bắt buộc nhưng không vỡ layout.
- Accessibility: keyboard navigation hoạt động, focus visible, contrast AA.

### 8.3. Data & state
- Server state: TanStack Query (key gồm role + filters).
- UI state: Zustand cho global, useState cho local.
- KHÔNG dùng useReducer cho form — dùng React Hook Form.
- Trạng thái đề án dùng **enum** trong `lib/constants.ts`, không dùng string literal rải rác.

### 8.4. Khi sinh code
- Bắt đầu component bằng skeleton tĩnh (UI trước), wire data sau.
- Mỗi component file < 300 dòng — tách subcomponent nếu vượt.
- KHÔNG tạo abstraction sớm. 3 dòng lặp tốt hơn 1 helper sai.
- KHÔNG viết comment về task hiện tại ("Added for sprint X", "Fixes bug Y") — git commit lo việc đó.

### 8.5. Mock data
- Seed phải tạo dữ liệu **đủ realistic** — tên đơn vị thật (Hiệp hội Da giày VN, VITAS, VINATEX...), tên đề án có ý nghĩa, mốc ngày phân tán đều theo trục thời gian năm.
- Mỗi enum phải có ít nhất 1 record cover từng giá trị (mọi trạng thái đề án phải có ví dụ).
- File đính kèm: dùng PDF mẫu trong `public/mock-files/` (1 file duy nhất, gán nhiều record).

### 8.6. Git commit
- Mỗi phase GSD = 1 hoặc nhiều commit atomic.
- Commit message tiếng Việt OK, format: `<type>: <mô tả>` (vd: `feat: thêm form khai báo đề án`, `fix: sửa validation dự toán`).
- KHÔNG commit `prisma/dev.db`, `.env.local`, `node_modules/`.

### 8.7. GSD workflow
Dự án này áp dụng GSD (Get Shit Done) workflow. Artifacts trong `.planning/`:
- `PROJECT.md` — context tổng thể (tạo bằng `/gsd-new-project`)
- `ROADMAP.md` — chia milestone & phase
- `milestones/<n>/<phase>/` — mỗi phase có DISCUSS.md, RESEARCH.md, PLAN.md, VERIFICATION.md

**Quy trình mỗi phase**:
1. `/gsd-discuss-phase` — gather context qua câu hỏi
2. `/gsd-plan-phase` — research + tạo PLAN.md
3. `/gsd-execute-phase` — chạy plan với atomic commits
4. `/gsd-verify-work` — UAT validation

---

## 9. Tài liệu nguồn (đọc khi cần ngữ cảnh nghiệp vụ)

- `MÔ_TẢ_QUY_TRÌNH_TỔ_CHỨC_CHƯƠNG_TRÌNH_CẤP_QUỐC_GIA_VỀ_XÚC_TIẾN_THƯƠNG.docx` — quy trình 27 bước + danh sách 190 chức năng (đã extract sang `_extracted_quytrinh.txt`)
- `PMNB_UC_671_PM_NghiepVu.xlsx` — use cases chi tiết
- `UC_XTTM_ChiTiet.xlsx` — UC bổ sung
- `🎬 FLOW DEMO CHUẨN.docx` — demo flow chuẩn (kim chỉ nam cho UI flow)
- `Mau bieu/` — biểu mẫu chia 4 bước
- `Mau bieu/Tiêu chí thẩm định đề án.docx` — bộ tiêu chí thẩm định

---

## 10. Lệnh thường dùng

```bash
npm run dev           # Dev server (port 3000)
npm run build         # Production build
npm run db:push       # Sync schema to DB
npm run db:seed       # Seed mock data (idempotent)
npm run db:studio     # Prisma Studio (GUI xem DB)
npm run db:reset      # Drop + push + seed
npm run typecheck     # TypeScript check
npm run lint          # ESLint
```

---

## 11. Definition of "Done" cho prototype

Một phase được coi là "xong" khi:
1. Tất cả màn hình của phase render được, không có lỗi console.
2. Mọi action chính click được và có phản hồi (toast/dialog/navigation).
3. Mock data đủ để demo cả happy path và edge case (đặc biệt: trạng thái cảnh báo).
4. UI khớp với chuẩn ở mục 8.2.
5. Có thể đăng nhập bằng tài khoản phù hợp và thấy đúng menu/quyền.
6. TypeScript pass, ESLint pass.

KHÔNG yêu cầu: unit test 100%, E2E test, performance benchmark, security audit, deployment thật.
