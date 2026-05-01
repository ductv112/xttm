# XTTMQG — Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại

> **Loại dự án:** Prototype / POC để demo cho Bộ Công Thương — Cục Xúc tiến Thương mại.
>
> **Trạng thái:** ✅ Phase 1-11 hoàn thành. Sẵn sàng demo end-to-end.

---

## 🎯 Mục tiêu

Chứng minh toàn bộ quy trình nghiệp vụ **Vòng đời đề án XTTM** trên giao diện đẹp, mượt, đầy đủ chức năng:

> Ban quản lý khởi tạo Chu kỳ Chương trình → Đơn vị chủ trì khai báo & nộp đề án → Tiếp nhận & kiểm tra → Hội đồng thẩm định chấm điểm → Ban quản lý lập tờ trình & nhập quyết định phê duyệt → Hợp đồng → Triển khai → Báo cáo & Nghiệm thu → Tài chính → Dashboard.

**Không phải production** — focus vào độ phủ chức năng và chất lượng UI/UX, không phải kiến trúc backend chặt chẽ.

---

## 🚀 Khởi động trong 60 giây

```bash
# 1. Cài dependencies (lần đầu)
npm install

# 2. Khởi tạo + seed database (idempotent — chạy lại nhiều lần OK)
npm run db:reset

# 3. Verify mock data invariants
npm run db:validate

# 4. Khởi động dev server
npm run dev
```

Mở **http://localhost:3000/login**.

> **Production build cho demo (recommended):**
> ```bash
> npm run build && npm run start
> ```
> Build output sạch hơn, hot-reload không gây giật khi chiếu projector.

---

## 👥 8 Tài khoản demo

| Username | Mật khẩu | Vai trò | Đơn vị |
|----------|----------|---------|--------|
| `admin` | `Admin@123` | Quản trị viên | Cục XTTM |
| `banql` | `Banql@123` | Ban quản lý CT XTTM | Cục XTTM |
| `chuyenvien` | `Cv@123` | Chuyên viên kiểm tra | Cục XTTM |
| `hoidong` | `Hd@123` | Hội đồng thẩm định | Cục XTTM |
| `donvi1` | `Donvi@123` | Đơn vị chủ trì | LEFASO (Da giày) |
| `donvi2` | `Donvi@123` | Đơn vị chủ trì | VITAS (Dệt may) |
| `taichinh` | `Tc@123` | Tài chính | Cục XTTM |
| `lanhdao` | `Ld@123` | Lãnh đạo | Bộ Công Thương |

> 💡 **Mẹo demo:** nhấn **Cmd+K** (Mac) hoặc **Ctrl+K** (Windows) ở bất kỳ trang nào để mở Command Palette chuyển vai trò nhanh, không cần đăng xuất / đăng nhập lại.

---

## 📜 Demo script

Script chuẩn theo từng phần demo (~50-60 phút end-to-end):

➡️ **[scripts/demo-script.md](scripts/demo-script.md)**

7 phần chính:

1. **Quản trị hệ thống** (5 phút) — login `admin`
2. **Khởi tạo chu kỳ chương trình** (8 phút) — login `banql`
3. **Đơn vị chủ trì nộp đề án** (12 phút) — login `donvi1`
4. **BQL tiếp nhận và kiểm tra** (6 phút) — login `banql` rồi `chuyenvien`
5. **Hội đồng thẩm định** (7 phút) — login `hoidong`
6. **Phê duyệt** (8 phút) — login `banql`
7. **Đơn vị nhận kết quả + Triển khai + Tài chính** (10 phút) — login `donvi1`/`taichinh`/`lanhdao`

---

## 🛠 Tech Stack

### Full-stack
- **Next.js 15** (App Router, RSC, Server Actions) + **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui** (component primitives) + **Lucide React**
- **Framer Motion** (micro-animations)

### Forms & Data
- **React Hook Form** + **Zod** (validation schema-first)
- **TanStack Table v8** (data tables)
- **TanStack Query** (server state)
- **Zustand** (UI state, multi-step wizard persist)

### Database
- **SQLite** + **Prisma ORM** (file-based, zero-config)
- File: `prisma/dev.db` (gitignored)

### Auth
- **NextAuth.js v5 (beta)** với **Credentials Provider**
- 8 tài khoản hardcoded, mật khẩu hash bcrypt
- Session JWT

### Đặc thù
- **@react-pdf/renderer** — PDF chuẩn công văn (Quốc hiệu / Nơi nhận / Lưu VT)
- **Tiptap v3** — rich text composer (mời đăng ký, tờ trình, mục tiêu)
- **xlsx** — xuất Excel báo cáo
- **Recharts** — chart dashboard
- **@xyflow/react** — visual state machine cho ProgramCycle

---

## 📁 Cấu trúc thư mục

```
.
├── app/                          # Next.js App Router
│   ├── (auth)/login              # Đăng nhập
│   └── (app)/                    # Protected routes (sidebar layout)
│       ├── dashboard
│       ├── chuong-trinh          # Chu kỳ Chương trình XTTM (HERO)
│       ├── don-vi-cua-toi        # Hồ sơ đơn vị chủ trì self-edit
│       ├── don-vi-chu-tri        # BQL phê duyệt hồ sơ
│       ├── de-an                 # Đề án (HERO)
│       ├── tiep-nhan             # BQL tiếp nhận
│       ├── phan-cong             # Phân công drag-drop
│       ├── kiem-tra              # Chuyên viên checklist
│       ├── cham-diem-so-bo
│       ├── hoi-dong              # Hội đồng thẩm định
│       ├── tham-dinh             # Side-by-side scoring
│       ├── phe-duyet             # Tờ trình + Quyết định
│       ├── hop-dong              # Quản lý hợp đồng
│       ├── dieu-chinh            # Điều chỉnh (Điều 13 NĐ 28)
│       ├── tai-chinh             # Tạm ứng / Quyết toán
│       ├── thong-bao             # Inbox
│       ├── nhat-ky               # Audit log
│       ├── nguoi-dung            # User CRUD (admin)
│       ├── vai-tro               # Ma trận phân quyền
│       ├── danh-muc              # 8 catalogs
│       └── cau-hinh              # SLA + email/SMS templates
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── layout/                   # AppShell, AppSidebar, AppTopbar
│   └── shared/                   # EmptyState, DataTable, RichTextEditor, ...
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client singleton
│   ├── permissions.ts            # RBAC matrix (static)
│   ├── permissions-db.ts         # canFromDB authoritative
│   ├── workflows/                # 6 state machines
│   └── pdf/templates/            # 4 PDF templates
├── prisma/
│   ├── schema.prisma             # 25+ models
│   ├── seed.ts                   # Master seed driver
│   └── seed/                     # Per-entity seed modules
├── scripts/
│   ├── demo-script.md            # ⭐ Demo script chi tiết
│   ├── validate-seed.mts         # Cross-entity invariants
│   ├── smoke-auth.mts            # Auth smoke (8/8 accounts)
│   ├── menu-smoke.mts            # Role-aware menu
│   └── pdf-smoke-test.mts        # PDF render check
└── .planning/                    # GSD workflow artifacts
    ├── PROJECT.md
    ├── ROADMAP.md
    ├── REQUIREMENTS.md
    ├── STATE.md
    └── phases/                   # 11 phase folders với plans + summaries
```

---

## ⚙️ Lệnh thường dùng

```bash
# Development
npm run dev               # Dev server (port 3000, Turbopack)
npm run build             # Production build
npm run start             # Production server (port 3000)
npm run lint              # ESLint
npm run typecheck         # TypeScript strict check
npm run format            # Prettier write
npm run format:check      # Prettier check

# Database
npm run db:generate       # Prisma generate
npm run db:push           # Sync schema → DB (no migration)
npm run db:seed           # Seed mock data (idempotent)
npm run db:reset          # Drop + push + seed
npm run db:studio         # Prisma Studio GUI
npm run db:validate       # Cross-entity invariants check

# Smoke tests
npx tsx scripts/smoke-auth.mts       # 8/8 accounts authenticate
npx tsx scripts/menu-smoke.mts       # Role-aware menu render
npx tsx scripts/pdf-smoke-test.mts   # PDF generation
```

---

## 📊 Mock data overview

Sau `npm run db:reset`, database có:

| Entity | Count | Notes |
|--------|-------|-------|
| User | 8 mock + ~2 council | Roles cover toàn bộ RBAC |
| Organization | 7 | Cục XTTM, Bộ CT, VITAS, LEFASO, VINATEX, VASEP, VCCI |
| Catalogs | 8 (119 records) | ProjectKind, IndustrySector, Market, ... |
| RBAC | 7 roles × 18 resources × 8 actions | 144 permissions, ~108 grants |
| ProgramCycle | 3 | 2025 COMPLETED, 2026 OPEN_REGISTRATION, 2027 DRAFT |
| OrganizationProfile | 5 | Cover 4 statuses (DRAFT / SUBMITTED / APPROVED / REJECTED) |
| Project | 11 | Cover 10 statuses (DRAFT / SUBMITTED / IN_REVIEW / VALID / APPROVED / IN_PROGRESS / COMPLETED / TENTATIVE / ASSIGNED / SUPPLEMENT_REQUIRED) |
| EvaluationCouncil | 1 | 3 thành viên, 2 đề án assigned, 4 ScoreSheet |
| Contract | 3 | DRAFT / SIGNED / IN_PROGRESS / LIQUIDATED |
| ProjectAmendment | 3 | Cả 4 status |
| Report | 3 | DRAFT / SUBMITTED / APPROVED |
| AcceptanceRecord | 2 | PASS / PARTIAL |
| FinancialRecord | 3 | ADVANCE / PAYMENT / SETTLEMENT |
| Notification (inbox) | 20+ | Cho mock users |

Tất cả ngày tháng dùng `daysAgo()` / `daysFromNow()` relative — demo luôn trông "live" bất kể chạy hôm nào.

---

## ⚠️ Known limitations (deferred to Phase 2)

POC này **không có**:

- Tích hợp SSO thật (button SSO chỉ là placeholder, hiển thị toast "Tính năng giai đoạn 2")
- Email/SMS gateway thật (chỉ giả lập trong app, lưu vào DB)
- Chữ ký số / ký số PDF
- An toàn thông tin cấp độ 3 (audit log đầy đủ, log toàn diện, mã hóa dữ liệu nhạy cảm)
- Multi-tenancy (chỉ có 1 Bộ CT, 1 Cục XTTM)
- Performance benchmark / load test
- E2E test automation (smoke tests bằng tsx scripts)
- CI/CD pipeline
- Deployment thật (Docker / K8s / Cloud)

---

## 🔧 Demo helpers

### Cmd+K Role Switcher

Phím tắt **Cmd+K** (Mac) / **Ctrl+K** (Windows) mở Command Palette ngay lập tức:
- 8 tài khoản demo với icon role + tên đơn vị
- Search filter theo tên / vai trò / đơn vị
- Click → tự động đăng xuất + đăng nhập lại + redirect landing page

> 🛡️ **Bảo mật:** chỉ hoạt động trong dev mode hoặc với `?demo=1` query param. Production deploy không có URL `?demo=1` sẽ ẩn hoàn toàn.

### Reset state mid-demo

Nếu demo lỡ tay xóa / nộp gì đó, mở terminal khác:
```bash
npm run db:reset
```
Mất ~3 giây, mọi thứ về state seed ban đầu, login lại bằng tài khoản đang dùng.

---

## 📚 Tài liệu nguồn nghiệp vụ

- `MÔ_TẢ_QUY_TRÌNH_TỔ_CHỨC_CHƯƠNG_TRÌNH_CẤP_QUỐC_GIA_VỀ_XÚC_TIẾN_THƯƠNG.docx` — quy trình 27 bước + 190 chức năng
- `🎬 FLOW DEMO CHUẨN.docx` — kim chỉ nam UI flow
- `Mau bieu/` — 4 nhóm biểu mẫu tham khảo
- `.planning/` — GSD workflow artifacts (project context, requirements, roadmap, phases)

---

## 🤝 Liên hệ

- **PM:** Anh Đức (`ductv@dft.vn`)
- **Phát triển:** Đội ngũ DFT cùng Claude Code (Anthropic)
- **Khách hàng:** Cục Xúc tiến Thương mại — Bộ Công Thương

---

**Phiên bản:** 0.1.0-poc · **Ngày demo dự kiến:** 2026-05 · **Status:** ✅ Demo-ready
