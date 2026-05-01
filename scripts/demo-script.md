# 🎬 Demo Script — Hệ thống Quản lý Chương trình XTTMQG

> **Tổng thời lượng:** ~50-60 phút end-to-end
> **Audience:** Lãnh đạo Cục XTTM + đại diện Bộ Công Thương + IT team
> **Mục tiêu:** Chốt POC + sang giai đoạn implementation thật

---

## 0. Setup trước khi bắt đầu (5 phút trước)

```bash
cd d:/Thaodnp/XTTM
npm run db:reset      # Reset state — mock data sạch
npm run db:validate   # Verify 0 errors
npm run build && npm run start  # Production build (recommended)
```

Mở browser ở `http://localhost:3000/login`. Phóng to chữ (Ctrl++ x 2) cho khán giả nhìn rõ.

**Backup tab:** Mở thêm tab `http://localhost:3000/dashboard?demo=1` ở chế độ ẩn danh để dùng Cmd+K nhanh khi cần switch role.

**Mẹo:** trong khi chạy demo, dùng **Cmd+K** (Mac) / **Ctrl+K** (Windows) để chuyển vai trò trong < 2 giây — không cần đăng xuất / đăng nhập thủ công.

---

## 1. Phần Quản trị hệ thống (~5 phút) — `admin`

**Đăng nhập:** `admin` / `Admin@123`

### Màn hình
- `/dashboard` — landing với 4 widget tổng quan
- `/nguoi-dung` — quản lý 8 tài khoản với filter (vai trò, đơn vị, trạng thái), sort, search, bulk action, export Excel
- `/vai-tro` — ma trận phân quyền 7×18×8 (vai trò × phân hệ × hành động)
- `/danh-muc` — 8 danh mục (8/20/15/8/30/12/15/6 records)
- `/cau-hinh` — SLA params + email/SMS templates với honorific Việt
- `/nhat-ky` — audit log với filter + export CSV

### Talking points cho lãnh đạo
- "Tất cả thao tác trên hệ thống đều được ghi audit log đầy đủ — phục vụ thanh tra, kiểm tra, báo cáo nội bộ."
- "Ma trận phân quyền có thể tinh chỉnh tới từng hành động trên từng phân hệ — không cần dev intervention."
- "8 danh mục cốt lõi đã được cấu hình sẵn theo Nghị định 28/2018/NĐ-CP."

### Talking points cho IT team
- "RBAC dual-layer: static MATRIX trong code + DB-backed RolePermission table — server action authoritative check."
- "Audit log dùng wrapper `withAuditLog` ở mọi server action mutation — guaranteed coverage."
- "Permission matrix UI là grid checkbox với optimistic UI + server action."

### Backup plan
Nếu /nhat-ky bị empty, skip — focus vào /vai-tro vì đây là wow factor cho lãnh đạo IT.

---

## 2. Phần Khởi tạo Chu kỳ Chương trình (~8 phút) — `banql`

**Cmd+K → chọn `banql`**

### Màn hình
- `/chuong-trinh` — danh sách card view 3 năm:
  - **2025** — "Đã hoàn thành"
  - **2026** — "Đang nhận đăng ký" (đợt mời đang mở)
  - **2027** — "Bản nháp"
- Click **2026** → trang chi tiết với **6 tabs**:
  - **Tổng quan** — visual state machine bằng React Flow (DRAFT → READY → OPEN_REGISTRATION → CLOSED → EVALUATING → APPROVED → COMPLETED)
  - **Cấu hình kỳ** — mốc thời gian, ngân sách, tiêu chí
  - **Công văn** — upload PDF preview
  - **Đơn vị mời** — composer email Tiptap với template variable, preview, gửi hàng loạt
  - **Đề án đăng ký** — list đề án thuộc kỳ này
  - **Nhật ký** — audit của riêng kỳ này

### Demo step-by-step
1. Show card view → highlight badge "Đang nhận đăng ký" với progress bar.
2. Click 2026 → tab **Tổng quan** → chỉ vào visual state machine, giải thích "đang ở `OPEN_REGISTRATION`".
3. Tab **Đơn vị mời** → show composer Tiptap → click "Chèn biến" → chọn `{{ten_don_vi}}` → preview → giả lập gửi.
4. Tab **Công văn** → show upload PDF + iframe preview.

### Talking points cho lãnh đạo
- "State machine 7 trạng thái đảm bảo không bao giờ có thao tác sai quy trình — ví dụ không thể duyệt khi chưa thẩm định."
- "Composer email với template variable — tiết kiệm 80% thời gian soạn email mời cho 50+ đơn vị."
- "Có thể mở lại để gia hạn đăng ký với lý do + audit log — tuân thủ Điều 13 NĐ 28."

### Talking points cho IT team
- "ProgramCycle là root entity — mọi Project (đề án) đều FK về `programCycleId`. Đơn vị chủ trì chỉ thấy nút 'Tạo đề án mới' khi `cycle.status === OPEN_REGISTRATION`."
- "React Flow dùng SSR-safe mount gate để tránh hydration mismatch."
- "Tiptap v3 với extension Link + Placeholder; HTML lưu vào DB column."

---

## 3. Phần Đơn vị Chủ trì nộp đề án (~12 phút) — `donvi1` ⭐ HERO

**Cmd+K → chọn `donvi1` (LEFASO)**

### Màn hình
- `/don-vi-cua-toi` — hồ sơ tổ chức LEFASO đã APPROVED, có capabilities + past projects + 3 contacts
- `/de-an` — banner "Đợt mời đề xuất 2026 đang mở — hạn còn 12 ngày" (auto-calc relative date), list đề án năm trước
- Click **"Tạo đề án mới"** → `/de-an/new` wizard 6 bước:

### Wizard 6 bước
1. **Thông tin chung** — tên đề án, kind, ngành hàng (multi), thị trường (multi), quốc gia (multi), thời gian (date range hoặc quý)
2. **Mục tiêu, nội dung, kế hoạch** — Tiptap rich text + plan table
3. **Dự toán kinh phí** — bảng hạng mục với auto-sum total + nguồn (Nhà nước/Đối ứng)
4. **Chủ nhiệm đề án** — chọn từ contacts của org
5. **Tài liệu đính kèm** — drag-drop multi-file
6. **Xem lại & nộp** — preview toàn bộ + checkbox cam đoan + nút "Nộp đề án"

### Demo step-by-step
1. `/de-an` → highlight banner "đợt mời đang mở".
2. Click "Tạo đề án mới" → wizard hiện ra với progress indicator.
3. Bước 1: nhập tên "Tham dự ANUGA Cologne 2026 — Quảng bá thực phẩm Việt tại EU" (~5s typing).
4. Bước 2: highlight Tiptap với toolbar formatting — "đây là rich text như Microsoft Word".
5. Bước 3: nhập 3 hạng mục, highlight auto-sum total dưới cùng.
6. Bước 4: chọn chủ nhiệm từ dropdown — show "Th.S. Hoàng Mai Linh".
7. Bước 5: drag-drop 1 file PDF mẫu.
8. Bước 6: review screen → click "Nộp đề án" → toast "Đã nộp thành công" → redirect.

**Show feature đặc biệt:**
- **Autosave 2s** — đóng tab + reload, nháp vẫn còn (Zustand persist).
- **Sao chép từ đề án cũ** — button trên cùng wizard → dialog list đề án năm trước → 1 click prefill.
- **Toggle "Đề án 2 năm"** — tự động tạo 2 records linked qua `parentProjectId`.

### Talking points cho lãnh đạo
- "Wizard 6 bước với progress indicator — đơn vị không bao giờ bị 'lạc' trong form dài."
- "Autosave mỗi 2 giây — không bao giờ mất dữ liệu nhập do sự cố mạng / điện."
- "Sao chép từ đề án cũ — đơn vị tổ chức triển lãm hằng năm chỉ cần 1 click để prefill 80% nội dung."

### Talking points cho IT team
- "RHF 1 instance toàn wizard + Zustand persist step + Zod schema/step. Cross-step validation chỉ chạy khi click 'Nộp'."
- "Đề án 2 năm: pattern parentProjectId Self-Ref — năm 1 được nộp, năm 2 status TENTATIVE chờ chu kỳ năm tiếp theo."
- "PDF Project Proposal export với React-PDF, font Be Vietnam Pro, đầy đủ Unicode tiếng Việt."

### Backup plan
Nếu wizard bị lag, skip bước 5 (file upload) — focus vào bước 3 (dự toán) vì đây là wow factor.

---

## 4. Phần BQL tiếp nhận và kiểm tra (~6 phút) — `banql` rồi `chuyenvien`

### `banql`
- `/tiep-nhan` — danh sách hồ sơ SUBMITTED → click "Tiếp nhận" → toast → trạng thái chuyển RECEIVED
- `/phan-cong` — drag-drop board:
  - Cột trái: hồ sơ chờ phân công
  - Cột phải: 3 ô chuyên viên (drop zone)
  - Drag → drop → toast → audit log entry

### `chuyenvien`
**Cmd+K → chọn `chuyenvien`**
- `/kiem-tra` — list hồ sơ được giao
- Click 1 hồ sơ → `/kiem-tra/[id]` checklist 12 items (✓/✗/N/A) với note + autosave + 2 buttons:
  - **"Trả bổ sung"** — yêu cầu đơn vị nộp bổ sung
  - **"Xác nhận hợp lệ"** — chuyển sang trạng thái VALID
- `/cham-diem-so-bo` — chấm điểm sơ bộ với slider 0-10 cho từng tiêu chí

### Talking points cho lãnh đạo
- "Drag-drop phân công — lãnh đạo BQL phân chuyên viên trong < 5 giây cho 20 hồ sơ."
- "Checklist 12 items chuẩn hóa quy trình kiểm tra — không bỏ sót, không kiểm tra qua loa."

### Talking points cho IT team
- "Drag-drop dùng HTML5 native (không lib bên ngoài) — keyboard accessible qua dialog fallback."
- "Checklist autosave debounce 1s — không spam server."

### Backup plan
Nếu drag-drop bị giật, dùng dialog fallback (click vào hồ sơ → chọn chuyên viên qua select).

---

## 5. Phần Hội đồng thẩm định (~7 phút) — `hoidong`

**Cmd+K → chọn `hoidong`**

### Màn hình
- `/tham-dinh` — list đề án được phân
- Click 1 đề án → `/tham-dinh/[id]` **split-screen 50/50**:
  - **Trái:** rubric với weighted scoring (slider 0-10 cho mỗi tiêu chí + ghi chú)
  - **Phải:** project readonly với 4 tabs (Thông tin / Mục tiêu / Dự toán / Tài liệu)
  - **COI checkbox** — "Tôi không có xung đột lợi ích"
  - 2 buttons: "Lưu nháp" / "Nộp chính thức"

**Switch sang `banql`** → `/hoi-dong/[id]`:
- Tổng hợp điểm real-time của 3 thành viên (Chủ tịch / Phó / Ủy viên)
- Bảng điểm trung bình theo tiêu chí + tổng cuối
- Button **"Xuất Báo cáo thẩm định PDF"** — chuẩn công văn nhà nước

### Demo step-by-step
1. `/tham-dinh` → click 1 đề án.
2. Show split-screen — kéo slider trái, đọc đề án phải.
3. Tick COI checkbox → click "Nộp chính thức" → toast.
4. Cmd+K → `banql` → `/hoi-dong` → click council → tổng hợp điểm.
5. Click "Xuất Báo cáo thẩm định" → mở PDF mới với đầy đủ Quốc hiệu / kết luận.

### Talking points cho lãnh đạo
- "Split-screen — thành viên hội đồng vừa đọc đề án vừa chấm điểm, không phải mở 2 cửa sổ."
- "Tổng hợp điểm tự động real-time — chủ tịch hội đồng không cần Excel + máy tính tay."
- "Báo cáo thẩm định PDF chuẩn công văn nhà nước, sẵn sàng in ra ký."

### Talking points cho IT team
- "ScoreSheet model lưu scoresJson + totalScore (computed weighted). Real-time aggregation server-side."
- "PDF dùng @react-pdf/renderer với font Be Vietnam Pro — full Unicode tiếng Việt + dấu thanh."

---

## 6. Phần Phê duyệt (~8 phút) — `banql` ⭐ HERO MOMENT

**Cmd+K → chọn `banql`**

### Màn hình
- `/phe-duyet` — list đề án đã thẩm định, sẵn sàng phê duyệt
- Click 1 council → 3 tabs:
  - **Soạn tờ trình** — Tiptap rich text + template insertion → **xuất "Tờ trình PDF"** (Quốc hiệu / Số / Kính gửi / Nội dung / Nơi nhận / Lưu VT)
  - **Quyết định phê duyệt** — form số QĐ + ngày + người ký + bảng duyệt kinh phí cho từng đề án (cảnh báo nếu kinh phí duyệt > đăng ký)
  - **Thông báo kết quả** — Composer email gửi đơn vị

### Demo step-by-step (HERO MOMENT)
1. Tab "Soạn tờ trình" → click "Chèn template" → tờ trình tự load template chuẩn.
2. Click **"Xuất Tờ trình PDF"** → 🎯 **moment "in tờ trình ra"** — PDF mở với chuẩn công văn đầy đủ.
3. Tab "Quyết định phê duyệt" → nhập số QĐ "47/QĐ-XTTM" + ngày → nhập kinh phí duyệt cho từng đề án.
4. Click "Xuất Quyết định PDF" → PDF chuẩn quyết định nhà nước.
5. Tab "Thông báo kết quả" → composer email → preview → gửi hàng loạt.

### Talking points cho lãnh đạo (KEY)
- "Đây là moment then chốt — lãnh đạo Cục in tờ trình + quyết định ra để ký, không phải gõ tay từng cái như hiện tại."
- "Cảnh báo kinh phí duyệt > đăng ký giúp tránh sai sót tài chính."
- "Thông báo kết quả gửi tự động cho 50 đơn vị qua composer — không cần forward email thủ công."

### Talking points cho IT team
- "Template Tờ trình + Quyết định + Thông báo lưu trong DocumentTemplate — dễ thay đổi nội dung mà không cần deploy."
- "PDF generation dùng React-PDF với layout chuẩn 30/12/30/12mm margins, Be Vietnam Pro 13pt."

### Backup plan
Nếu PDF render lỗi, mở tab pre-generated PDF mẫu trong `public/mock-files/` để show.

---

## 7. Phần Đơn vị nhận kết quả + Triển khai + Tài chính (~10 phút)

### `donvi1` (LEFASO) — Nhận kết quả
**Cmd+K → chọn `donvi1`**
- Topbar bell badge số thông báo mới → click → inbox
- Click thông báo "Đề án đã được phê duyệt" → mở đề án → status APPROVED + kinh phí được duyệt
- `/hop-dong/[id]` — sinh hợp đồng từ đề án duyệt → upload bản scan ký → status SIGNED

### `donvi1` — Triển khai
- `/de-an/[id]` → tab "Triển khai" — kế hoạch milestones với progress bar
- Cập nhật progress 1 milestone → 75% → toast → audit
- Cảnh báo "Liên hệ thương vụ trong vòng 30 ngày" nếu có sự kiện quốc tế

### `donvi1` — Báo cáo + nghiệm thu
- `/de-an/[id]` → tab "Báo cáo" → tạo báo cáo cuối kỳ với KPI quantitative + qualitative HTML
- Submit → BQL nhận → biên bản nghiệm thu → tài chính quyết toán

### `taichinh`
**Cmd+K → chọn `taichinh`**
- `/tai-chinh` — list financial records (ADVANCE / PAYMENT / SETTLEMENT)
- Click 1 record → form chi tiết + file đính kèm

### `lanhdao`
**Cmd+K → chọn `lanhdao`**
- `/dashboard` — 4 widget tổng quan + charts (Recharts):
  - Tổng kinh phí năm
  - Số đề án theo trạng thái
  - Tiến độ ngân sách
  - Cảnh báo SLA
- Drill-down: click chart → list đề án match filter

### Talking points cho lãnh đạo
- "Lãnh đạo Cục có dashboard tổng quan, không phải đợi báo cáo Word từ trợ lý."
- "Cảnh báo SLA tự động — chậm ký HĐ 60 ngày, chậm báo cáo 15 ngày, chưa liên hệ thương vụ 30 ngày."

### Talking points cho IT team
- "Recharts với data fetched server-side — no chart-side data crunching."
- "Drill-down dùng URL query param + server-side filter — back button work."

### Backup plan
Nếu chart lỗi, focus vào widget số đếm — vẫn impressive cho lãnh đạo.

---

## ❓ Q&A buffer (~10 phút)

### Câu hỏi dự kiến

**Q: Khi nào triển khai thật?**
A: POC này chứng minh feasibility. Implementation thật sẽ:
- Tích hợp SSO Bộ CT (LDAP/OAuth)
- Email/SMS gateway thật
- Chữ ký số PDF
- Multi-tenant cho nhiều Cục/Bộ
- Production deployment với cloud (AWS/GCP/Azure) hoặc on-prem
- An toàn thông tin cấp độ 3 (audit log đầy đủ, encryption at rest, MFA)

**Q: Performance với 1000+ đề án/năm?**
A: SQLite chỉ là dev DB. Production sẽ migrate sang PostgreSQL với indexes đã design sẵn (xem `prisma/schema.prisma` `@@index`). TanStack Query cache + server-side pagination giải quyết 1000+ records.

**Q: Có support mobile không?**
A: POC chạy mượt từ 1366×768. Mobile responsive là phase 2 — design system shadcn/ui đã base mobile-first.

**Q: Tự host hay cloud?**
A: Cả 2 — Next.js standalone build deploy được cả Docker on-prem hoặc Vercel/cloud.

**Q: Bao lâu để go-live?**
A: Tùy scope — phase 2 với SSO + email + chữ ký số ước tính 4-6 tháng cho 1 team 5-7 người.

---

## 📋 Pre-demo checklist

- [ ] `npm run db:reset && npm run db:validate` — verify 0 errors
- [ ] `npm run build && npm run start` — production build
- [ ] Browser zoom level: ~125% (chữ rõ cho khán giả)
- [ ] Tab phụ ở `/dashboard?demo=1` ẩn danh — backup nếu mất session
- [ ] PDF backup files trong `public/mock-files/` — backup nếu PDF gen lỗi
- [ ] Wifi backup (4G hotspot) nếu wifi event không ổn
- [ ] Slide deck giới thiệu (5 phút mở đầu) trước khi vào demo
- [ ] Đồng hồ đếm xuôi để track 50-60 phút

---

## 🎯 Wow moments để emphasize

1. **Cmd+K role switcher** — Mọi lúc demo, dùng Cmd+K → khán giả "wow" vì tốc độ.
2. **Wizard autosave** — Đóng tab giữa chừng + reload → "data vẫn còn!".
3. **Sao chép từ đề án cũ** — 1 click prefill 80% form.
4. **Visual state machine** — React Flow render trực quan workflow.
5. **Composer email Tiptap** — `{{template}}` variable đẹp như Mailchimp.
6. **Side-by-side scoring** — split 50/50 hội đồng.
7. **PDF Tờ trình + Quyết định** — chuẩn công văn nhà nước → moment then chốt.
8. **Real-time tổng hợp điểm hội đồng** — không cần Excel.
9. **Drag-drop phân công** — < 5 giây cho 20 hồ sơ.
10. **Dashboard lãnh đạo** — 4 widget + drill-down.

---

**Chúc anh demo thành công! 🎯**

— Generated by Claude Code overnight session, 2026-05-01
