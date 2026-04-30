# Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại (XTTMQG)

## What This Is

Hệ thống prototype/POC quản lý toàn bộ vòng đời Chương trình Xúc tiến Thương mại Quốc gia cho Bộ Công Thương / Cục XTTM — từ khởi tạo chu kỳ chương trình hằng năm, mời đăng ký đề án, thẩm định, phê duyệt, ký hợp đồng, triển khai, báo cáo, đến nghiệm thu và thanh lý. Phục vụ 7 vai trò người dùng (Admin, Ban quản lý CT XTTM, Chuyên viên kiểm tra, Hội đồng thẩm định, Đơn vị chủ trì, Tài chính, Lãnh đạo).

## Core Value

**Demo end-to-end mượt và đẹp luồng "Vòng đời đề án" (M2-M3): từ Ban quản lý khởi tạo Chu kỳ Chương trình → Đơn vị chủ trì khai báo & nộp đề án → Tiếp nhận & kiểm tra → Hội đồng thẩm định chấm điểm → Ban quản lý lập tờ trình & nhập quyết định phê duyệt.**

Đây là luồng nghiệp vụ cốt lõi, nếu không thuyết phục được khán giả ở luồng này thì các phần khác đẹp đến mấy cũng không cứu được POC. Mọi tradeoff phải ưu tiên độ mượt + chiều sâu nghiệp vụ của hero flow này.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- v1 scope cho prototype POC. Tất cả là hypothesis cho đến khi demo và khách hàng phản hồi. -->

**M0 — Bootstrap & Hạ tầng**
- [ ] Setup Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui + Prisma/SQLite
- [ ] Layout shell (sidebar + topbar + breadcrumb), theme system, locale tiếng Việt
- [ ] NextAuth Credentials Provider với 8 tài khoản hardcoded
- [ ] Trang login đẹp, redirect theo vai trò sau khi đăng nhập

**M1 — Quản trị & Danh mục**
- [ ] Quản lý người dùng: CRUD, gán đơn vị/vai trò, khóa/mở, reset mật khẩu
- [ ] Quản lý vai trò & nhóm quyền + Ma trận phân quyền (cấu hình bằng UI, không hardcode)
- [ ] CRUD 8 danh mục: loại đề án, ngành hàng, thị trường, loại hình XTTM, quốc gia, đơn vị, tiêu chí chấm điểm, mẫu văn bản
- [ ] Cấu hình hệ thống: tham số cảnh báo SLA, mẫu email/SMS (UI-only)
- [ ] Lịch sử truy cập / audit log với filter & export

**M2 — Vòng đời đề án (HERO FLOW)**
- [ ] **Phase 2.1 — Chu kỳ Chương trình XTTM năm**: BQL tạo chương trình năm (1/năm, unique constraint), cấu hình mốc/ngân sách/tiêu chí, upload công văn ký scan, state machine 7 trạng thái, gating logic, gia hạn được, sửa cấu hình khi OPEN, gửi email hàng loạt mời đăng ký
- [ ] **Phase 2.2 — Hồ sơ Đơn vị chủ trì**: Đăng ký tổ chức, năng lực, đầu mối liên hệ, gửi xác nhận
- [ ] **Phase 2.3 — Khai báo & nộp đề án**: Multi-step form 6 bước (thông tin chung → mục tiêu → dự toán → chủ nhiệm → tài liệu → xem lại & nộp), gating bởi ProgramCycle.OPEN_REGISTRATION, lưu nháp, validation chặt, sao chép từ đề án cũ, in/xuất PDF
- [ ] **Phase 2.4 — Tiếp nhận, phân công, kiểm tra**: BQL tiếp nhận hồ sơ, phân công chuyên viên, chuyên viên checklist kiểm tra, trả bổ sung hoặc xác nhận hợp lệ, nộp lại với version, chấm điểm sơ bộ

**M3 — Thẩm định & Phê duyệt (HERO FLOW)**
- [ ] Tạo hội đồng thẩm định, thêm thành viên, phân công đề án
- [ ] Phiếu chấm điểm theo tiêu chí, lưu nháp / nộp chính thức, nhận xét thẩm định
- [ ] Tổng hợp & tính điểm tự động, xếp hạng đề án
- [ ] Lập danh sách trình duyệt, mẫu tờ trình, nhập quyết định phê duyệt + kinh phí
- [ ] Thông báo kết quả cho đơn vị chủ trì (composer email)

**M4 — Hợp đồng & Triển khai**
- [ ] Sinh hợp đồng từ đề án duyệt với số HĐ tự động, upload bản scan, theo dõi trạng thái
- [ ] Cảnh báo chậm ký HĐ (60 ngày sau quyết định)
- [ ] Kế hoạch triển khai chi tiết: mốc công việc, nhân sự, lịch trình
- [ ] Cập nhật tiến độ, đính kèm minh chứng
- [ ] Điều chỉnh đề án (Điều 13 NĐ 28): thay đổi nhỏ duyệt nội bộ vs trọng yếu thẩm định lại, so sánh phiên bản

**M5 — Báo cáo, Nghiệm thu, Tài chính**
- [ ] Đơn vị chủ trì tạo báo cáo kết quả: chỉ tiêu định lượng/định tính, upload minh chứng
- [ ] Hồ sơ nghiệm thu, sinh biên bản theo mẫu, in/tải về
- [ ] Hồ sơ thanh lý hợp đồng
- [ ] Tạo hồ sơ tạm ứng, thanh toán, quyết toán + cập nhật trạng thái

**M6 — Dashboard & Cảnh báo**
- [ ] Dashboard tổng quan theo năm (cards, charts), drill-down xuống chi tiết
- [ ] Widget: cảnh báo sai lệch ngân sách, chậm ký HĐ, vi phạm hạn báo cáo, đề án quốc tế chưa liên hệ thương vụ
- [ ] Thống kê đề án theo năm/loại/đơn vị/kinh phí, xuất Excel/PDF
- [ ] Hệ thống thông báo & cảnh báo: 30 ngày ngoại giao, 60 ngày ký HĐ, 15 ngày báo cáo, hạn 30/5
- [ ] Inbox thông báo trong app + lịch sử thông báo

**M7 — Polish & Demo Prep**
- [ ] Mock data đầy đủ 10-15 records/loại, cover mọi trạng thái + cảnh báo
- [ ] Demo script chuẩn theo "🎬 FLOW DEMO CHUẨN.docx"
- [ ] Fix UI rough edges, animation transitions, empty states, error states
- [ ] Performance audit, type/lint clean, README hướng dẫn chạy demo

### Out of Scope

<!-- Explicit boundaries — không build trong prototype này. -->

- **SSO với cổng Bộ Công Thương** — Để giai đoạn 2 (production), chỉ mock bằng button placeholder
- **Tích hợp chữ ký số (USB token / HSM)** — Phức tạp, không cần thiết cho POC, demo bằng upload PDF scan
- **Email/SMS gateway thật** — Mock trong app (lưu DB + hiển thị inbox), không gửi thật ra ngoài
- **An toàn thông tin cấp độ 3** — Yêu cầu hạ tầng + quy trình production thực, vượt phạm vi POC
- **Hosting trên Viettel Cloud** — POC chạy local, deploy chính thức ở giai đoạn sau
- **Nhập dữ liệu lịch sử** — Chỉ seed mock data, không có data migration
- **Mobile app riêng** — Web responsive là đủ cho demo
- **Unit/E2E test 100%** — Prototype, ưu tiên độ phủ feature hơn coverage
- **Tích hợp API gateway nội bộ Cục/Bộ** — Giai đoạn 2

## Context

**Khách hàng**: Bộ Công Thương — Cục Xúc tiến Thương mại. Đây là cơ quan nhà nước cấp Trung ương quản lý chương trình XTTM Quốc gia hằng năm với ngân sách lớn, nhiều đơn vị chủ trì (hiệp hội ngành hàng, viện nghiên cứu, doanh nghiệp).

**Đối tượng demo**: Đa dạng — bao gồm (1) Lãnh đạo Cục/Bộ (cần dashboard đẹp, narrative rõ ràng, ít chi tiết kỹ thuật), (2) Ban quản lý CT XTTM (cần thấy đủ chi tiết từng bước thao tác nghiệp vụ), (3) Đội kỹ thuật/CNTT (đánh giá kiến trúc, khả năng mở rộng), (4) Sếp nội bộ DFT. UI phải vừa "wow" được lãnh đạo, vừa thuyết phục được người dùng nghiệp vụ và IT cùng lúc.

**Stakes**: SIGN FULL PROJECT — đây là demo quyết định việc Bộ Công Thương có ký hợp đồng triển khai production hay không. Không phải demo cho vui, không phải POC trả phí giữa chừng — đây là canh bạc lớn cho hợp đồng triển khai chính thức.

**Quy trình nghiệp vụ tham chiếu**: 27 bước end-to-end (từ Khởi tạo chu kỳ → Mời đề xuất → Nộp hồ sơ → Kiểm tra → Thẩm định → Phê duyệt → Ký HĐ → Triển khai → Báo cáo → Nghiệm thu → Thanh lý), 190 chức năng đã được phân tích chi tiết trong tài liệu mô tả và các file Excel use case. Pháp lý: Nghị định 28 (đặc biệt Điều 13 về điều chỉnh đề án).

**Mốc SLA quan trọng**: Trước 30/5 hạn nộp đề án, 30 ngày trước sự kiện quốc tế phải liên hệ thương vụ/đại sứ quán, 60 ngày sau quyết định cảnh báo chậm ký HĐ, 15 ngày sau hoạt động hạn nộp báo cáo tổng hợp.

**Đặc thù nghiệp vụ**:
- Mỗi năm chỉ có 1 chu kỳ chương trình duy nhất, là tiền điều kiện cho mọi đề án
- Đơn vị chủ trì nộp 1 lần cho tất cả đề án trong năm (1 hồ sơ, nhiều đề án)
- Đề án 2 năm = 2 records riêng có link parentProjectId, hợp đồng/nghiệm thu/thanh toán riêng
- Điều chỉnh đề án phân loại 2 mức: thay đổi nhỏ (BQL phê duyệt) vs trọng yếu (thẩm định lại)
- Đoàn giao dịch nước ngoài: thời gian linh hoạt theo quý, có thể chỉnh ngày cụ thể

**Tài liệu nguồn** (đã phân tích):
- `MÔ_TẢ_QUY_TRÌNH_TỔ_CHỨC_CHƯƠNG_TRÌNH_CẤP_QUỐC_GIA_VỀ_XÚC_TIẾN_THƯƠNG.docx`
- `PMNB_UC_671_PM_NghiepVu.xlsx`, `UC_XTTM_ChiTiet.xlsx`
- `🎬 FLOW DEMO CHUẨN.docx`
- `Mau bieu/` (biểu mẫu 4 bước + tiêu chí thẩm định)

## Constraints

- **Tech stack**: Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui — đã chốt vì cho UI hiện đại nhất 2025-2026, dễ demo nhanh
- **Database**: SQLite + Prisma — file-based, zero-config, seed mock data dễ. Không cần Docker, không cần server DB
- **Auth**: NextAuth Credentials Provider, 8 tài khoản hardcoded — không SSO thật cho POC
- **Mock data**: 10-15 records/loại, đủ cover mọi trạng thái + cảnh báo SLA. Tên đơn vị/đề án thực tế (VITAS, VINATEX, Hiệp hội Da giày, etc.)
- **Ngôn ngữ UI**: 100% tiếng Việt (label, error, validation, button). Code identifier tiếng Anh
- **Trình duyệt mục tiêu**: Chrome/Edge mới nhất, 1366×768 + 1920×1080. Mobile không bắt buộc nhưng không vỡ
- **Performance**: Local dev đủ mượt cho demo trực tiếp, không cần benchmark production
- **Audit log**: Có UI và lưu DB ở mức cơ bản (đủ để demo), không cần immutable log đầy đủ
- **No deadline**: Ưu tiên chất lượng UI/UX cao nhất, không vội

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 App Router + TypeScript | Full-stack 1 codebase, server actions tiện cho prototype, hot reload nhanh khi demo, ecosystem mạnh | — Pending |
| shadcn/ui làm UI primitive | Component library hiện đại nhất 2025-2026, look "Vercel-grade", tùy biến cao, không bị khóa vendor | — Pending |
| SQLite + Prisma cho POC | Zero-config, file-based DB, seed lại dễ, dev experience tốt nhất; có thể migrate sang Postgres khi production | — Pending |
| NextAuth Credentials với tài khoản cứng | POC không cần SSO; user yêu cầu rõ "không SSO, tài khoản mock data" | — Pending |
| Hero flow = M2-M3 (Vòng đời đề án) | User chỉ định luồng quan trọng nhất; M2-M3 là core nghiệp vụ XTTM | — Pending |
| 1 chu kỳ chương trình / năm (unique year) | User chốt: mỗi năm chỉ 1 chương trình | — Pending |
| Cho phép gia hạn (CLOSED → OPEN) | User chốt: cần gia hạn được | — Pending |
| Đề án 2 năm = 2 records có parentProjectId | User chốt: 2 records link với nhau, hợp đồng/nghiệm thu riêng | — Pending |
| Cho phép sửa cấu hình kỳ khi OPEN | User chốt: cấu hình kỳ chỉnh được kể cả khi đang nhận đăng ký | — Pending |
| Mock data 10-15 records/loại | User chốt: đủ realistic cho demo, tên đơn vị thật | — Pending |
| 8 tài khoản hardcoded (admin/banql/chuyenvien/hoidong/donvi1/donvi2/taichinh/lanhdao) | User yêu cầu đủ tài khoản tất cả vai trò để demo | — Pending |
| Ngôn ngữ UI 100% tiếng Việt | Khách hàng là cơ quan nhà nước VN, demo cho lãnh đạo | — Pending |
| Áp dụng GSD workflow chuẩn | User yêu cầu rõ để đảm bảo chất lượng prototype tốt nhất | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-30 after initialization*
