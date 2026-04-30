# Pitfalls Research — XTTMQG Prototype

**Domain:** Hệ thống quản lý chương trình XTTM Quốc gia (Bộ Công Thương / Cục XTTM) — POC để chốt hợp đồng triển khai chính thức
**Researched:** 2026-04-30
**Confidence:** HIGH (Vietnamese gov + XTTM domain), MEDIUM (Next.js 15 / shadcn / SQLite specifics — verified với docs hiện tại)

---

## 0. Cách đọc tài liệu này

- **Severity** chia 3 mức:
  - **CRITICAL** — nếu vướng phải, demo gần như chắc chắn fail / khách quay lưng
  - **HIGH** — không gây fail tức thì nhưng làm prototype "mất chất", giảm điểm tin cậy nghiêm trọng
  - **MEDIUM** — gây khó chịu, nhưng có thể vớt vát tại chỗ khi demo
- **Stage** chỉ giai đoạn pitfall lộ ra:
  - **Planning** — giai đoạn lập kế hoạch / chốt schema / chốt scope (M0-M1)
  - **Execution** — giai đoạn build feature (M2-M6)
  - **Demo** — giai đoạn polish & live demo (M7)
- Mỗi pitfall đều có **Warning sign**, **Prevention** cụ thể (không phải "cẩn thận"), và **Phase to address**.

---

## 1. CRITICAL Pitfalls — Vietnamese Government UX

### Pitfall 1.1: Diacritics tiếng Việt vỡ trong PDF xuất ra (severity: CRITICAL, stage: Execution + Demo)

**What goes wrong:**
PDF xuất từ jsPDF / @react-pdf/renderer hiển thị "ố ờ ặ ữ" thành "o", "Â?", hình vuông □, hoặc dấu hỏi ?. Khán giả mở Quyết định phê duyệt thấy "Quy?t ??nh ph? duy?t ?? ?n", coi như xong demo.

**Why it happens:**
- jsPDF mặc định chỉ load font Helvetica/Times — KHÔNG support Unicode. Phải embed font có đủ glyph tiếng Việt (Roboto/Times New Roman/DejaVu Sans qua fontconverter).
- @react-pdf/renderer cần `Font.register({ family, src })` rõ ràng, mặc định không có tiếng Việt.
- Nhiều dev test bằng input "abc" thay vì "Đề án xúc tiến thương mại quốc gia 2026", không phát hiện sớm.

**How to avoid:**
- **Quyết sớm ở M0**: dùng @react-pdf/renderer (React-friendly hơn jsPDF, control font tốt hơn) hoặc jsPDF + font embed bằng base64.
- **Bắt buộc test với chuỗi smoke**: `"Đề án Xúc tiến Thương mại — Hiệp hội Dệt may Việt Nam (VITAS) — Quý IV/2026 — đã được phê duyệt với kinh phí 2.500.000.000 đồng"` — chuỗi này có tất cả: dấu á à ả ã ạ, ă, â, đ, ê, ô, ơ, ư, dấu mũ, móc.
- **Font khuyến nghị**: Roboto (free, full Vietnamese subset), hoặc Times New Roman (đúng "chuẩn công văn nhà nước"). Nhúng cả Regular + Bold + Italic.
- **Convert TTF sang base64 1 lần, lưu vào `lib/pdf/fonts.ts`** — đừng load runtime từ public/ vì có thể lỗi CORS / 404 khi build.

**Warning signs:**
- PDF đầu tiên xuất ra mở bằng Adobe Reader thấy chữ vuông
- Console warning "Font not found" / "glyph not found"
- Tester bảo "in ra giấy chữ bị thiếu dấu"

**Phase to address:** **M0** (chốt PDF library + smoke test font), **M3** (xuất Quyết định phê duyệt — file PDF đầu tiên thực sự cần render ngon), **M7** (regression test toàn bộ PDF).

---

### Pitfall 1.2: Sai thuật ngữ chuyên ngành (severity: CRITICAL, stage: Planning + Execution)

**What goes wrong:**
Dùng "dự án" thay vì "đề án" → khán giả nghiệp vụ nghe phát biết ngay "thằng này không hiểu nghiệp vụ". Hoặc dùng "phê duyệt" và "ban hành quyết định" lẫn lộn. Hoặc gọi "kiểm tra hồ sơ" là "thẩm định" — đây là 2 bước hoàn toàn khác nhau ở cấp độ pháp lý.

**Why it happens:**
- Lập trình viên copy nhanh từ template SaaS quốc tế ("project" → dịch máy "dự án").
- Không đọc kỹ NĐ 28 / NĐ 81 và file `_extracted_quytrinh.txt`.
- AI code assistant (Claude, Copilot) có xu hướng tự "sáng tạo" thuật ngữ.

**How to avoid:**
- **Tạo từ điển thuật ngữ chuẩn** trong `lib/constants.ts`:
  ```typescript
  // KHÔNG dịch lại, KHÔNG đổi chữ hoa/thường
  export const TERMS = {
    DE_AN: 'Đề án',                    // KHÔNG phải "dự án"
    CHU_KY_CHUONG_TRINH: 'Chu kỳ chương trình',
    DON_VI_CHU_TRI: 'Đơn vị chủ trì',  // KHÔNG phải "đơn vị thực hiện"
    KIEM_TRA_HO_SO: 'Kiểm tra hồ sơ',  // bước sơ bộ, do chuyên viên
    THAM_DINH: 'Thẩm định',            // bước chính thức, do hội đồng
    PHE_DUYET: 'Phê duyệt',            // ra quyết định
    NGHIEM_THU: 'Nghiệm thu',          // KHÔNG phải "kiểm tra cuối"
    THANH_LY_HOP_DONG: 'Thanh lý hợp đồng',
    QUYET_TOAN: 'Quyết toán',          // tài chính, sau nghiệm thu
    TAM_UNG: 'Tạm ứng',
    THUONG_VU: 'Thương vụ',            // phòng thương vụ tại đại sứ quán
  } as const;
  ```
- **Ép tất cả label UI trỏ về TERMS** (hard-fail nếu literal string).
- **Đọc bắt buộc trước khi code M2-M3**: file `_extracted_quytrinh.txt` (đặc biệt 27 bước + ghi chú cuối), `Mau bieu/Tiêu chí thẩm định đề án.docx`.
- **Phân biệt "đề án" vs "đề xuất"**: "đề án" là sản phẩm chính thức được duyệt; "đề xuất" là nội dung ban đầu đơn vị nộp lên (ít dùng trong UI nhưng hay xuất hiện trong công văn).
- **Phân biệt "kiểm tra" vs "thẩm định"**:
  - **Kiểm tra hồ sơ** = checklist hành chính, do **chuyên viên** Cục XTTM thực hiện, kiểm tra tính đầy đủ / hợp lệ
  - **Thẩm định** = đánh giá chuyên môn theo bộ tiêu chí, do **hội đồng thẩm định** thực hiện
  - Phê duyệt = ra quyết định pháp lý, do **lãnh đạo Bộ/Cục**
- **Phân biệt "trọng yếu" vs "không trọng yếu"** (Điều 13 NĐ 28):
  - Không trọng yếu (BQL phê duyệt nội bộ): thay đổi thời gian tổ chức, địa điểm, tên đơn vị chủ trì, tên đề án
  - Trọng yếu (phải thẩm định lại): thay đổi mục tiêu, nội dung chuyên môn, dự toán kinh phí (vượt ngưỡng), quy mô

**Warning signs:**
- Tester nội bộ (người Việt) hỏi "đây là dự án gì vậy?" — tức là label đang sai
- Sidebar có cả "Đề án" và "Dự án" cùng tồn tại
- Trong cùng 1 màn hình dùng "thẩm định sơ bộ" — đây là từ tự chế, không có trong nghiệp vụ

**Phase to address:** **M0** (lock terminology dictionary), **M2** (mọi form khai báo đề án phải dùng đúng từ), **M3** (thẩm định/phê duyệt — đặc biệt nhạy cảm).

---

### Pitfall 1.3: Date/Currency format sai chuẩn Việt Nam (severity: CRITICAL, stage: Execution + Demo)

**What goes wrong:**
- Hiển thị "5/30/2026" hoặc "2026-05-30" trên màn hình demo cho lãnh đạo Cục → phản cảm, "không phải hệ thống Việt Nam".
- Hiển thị tiền "2,500,000,000 VND" hoặc "$2,500,000,000" — chuẩn Việt Nam là `2.500.000.000 đồng` (dấu chấm phân cách hàng nghìn, "đồng" hoặc "đ", KHÔNG phải "VND" trên UI hành chính).
- Sai số tiền do trộn dấu phân cách: `Intl.NumberFormat('en-US').format(2500000)` → `"2,500,000"` mà người Việt đọc nhầm thành "2,5 triệu" (vì Việt Nam dùng dấu phẩy cho thập phân).

**Why it happens:**
- date-fns mặc định format theo locale máy build (en-US trên CI hoặc dev máy nước ngoài).
- `toLocaleDateString()` không truyền `'vi-VN'` → fallback en-US.
- Dev quên import `date-fns/locale/vi`.

**How to avoid:**
- **Tạo helper `lib/format.ts` THỐNG NHẤT**:
  ```typescript
  import { format } from 'date-fns';
  import { vi } from 'date-fns/locale';

  export const formatDate = (d: Date | string) =>
    format(new Date(d), 'dd/MM/yyyy', { locale: vi });
  // "30/05/2026"

  export const formatDateTime = (d: Date | string) =>
    format(new Date(d), 'HH:mm dd/MM/yyyy', { locale: vi });
  // "14:30 30/05/2026"

  export const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN').format(n) + ' đồng';
  // "2.500.000.000 đồng"

  export const formatVNDShort = (n: number) => {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' tỷ';
    if (n >= 1e6) return (n / 1e6).toFixed(0) + ' triệu';
    return new Intl.NumberFormat('vi-VN').format(n);
  };
  // "2,5 tỷ" — dấu phẩy cho thập phân, đúng chuẩn VN
  ```
- **ESLint rule cấm dùng `toLocaleDateString` / `toLocaleString` trực tiếp** trong components — bắt buộc đi qua helper.
- **Mọi `<input type="date">` phải có placeholder "DD/MM/YYYY"** + dùng custom DatePicker shadcn để hiển thị format Việt.

**Warning signs:**
- Code search ra `Intl.NumberFormat(` không có locale string
- Mocked date hiển thị `2026-05-30T00:00:00.000Z` ra UI
- Số tiền có dấu `,` ngăn cách hàng nghìn

**Phase to address:** **M0** (tạo helper formatters), **M1** (audit log đã có timestamp đúng), **M2** (form đề án — input ngân sách phải định dạng VND).

---

### Pitfall 1.4: Honorific & xưng hô sai chuẩn (severity: HIGH, stage: Execution)

**What goes wrong:**
- Email/notification gửi "Hi Nguyen Van A," — như spam Mỹ.
- Hệ thống gọi lãnh đạo bằng "Bạn" thay vì "Ông/Bà" / "Đồng chí".
- Composer email mời đề xuất viết "Dear Sir/Madam" hoặc "Kính gửi Quý Đơn vị" (đúng) nhưng phần ký lại để "Best regards" (sai — phải là "Trân trọng" / "Kính chào").

**Why it happens:**
- Template AI sinh hay default sang style email tiếng Anh.
- Dev không có background nghiệp vụ hành chính nhà nước.

**How to avoid:**
- **Template email/notification có sẵn trong `lib/templates/`**:
  - Mời đề xuất: "Kính gửi Quý Đơn vị, ... Trân trọng, Cục Xúc tiến Thương mại"
  - Yêu cầu bổ sung hồ sơ: "Kính gửi [Đơn vị chủ trì], ... Đề nghị Quý Đơn vị bổ sung..."
  - Thông báo phê duyệt: "Kính gửi [Đơn vị chủ trì], ... Bộ Công Thương trân trọng thông báo..."
- **Field `User`** phải có cả `fullName`, `gender` (M/F), `title` (Ông/Bà/Đồng chí) để render đúng.
- **Cấm "Hi" / "Hello" / "Dear" / "Best regards"** trong mọi template — ESLint custom rule check string literal.

**Warning signs:**
- Tester nội bộ cười khi đọc email demo
- Notification inbox có "Xin chào, Bạn có thông báo mới" — quá thân mật, không phù hợp nhà nước

**Phase to address:** **M1** (composer email template), **M2** (gửi mời đăng ký đề án), **M3** (thông báo kết quả phê duyệt).

---

### Pitfall 1.5: Layout công văn / quyết định không đúng chuẩn nhà nước (severity: HIGH, stage: Execution + Demo)

**What goes wrong:**
PDF Quyết định phê duyệt hoặc Tờ trình xuất ra trông giống "invoice của Stripe" — không có header Quốc hiệu, không có số văn bản, không có nơi nhận, không có chỗ ký "đã ký" + "đã đóng dấu".

**Why it happens:**
- Dev không nhìn mẫu công văn thực tế.
- @react-pdf/renderer mặc định layout Western.

**How to avoid:**
- **Layout chuẩn công văn Việt Nam** (template `components/pdf/OfficialDocument.tsx`):
  ```
  ┌─────────────────────────────┬──────────────────────────────┐
  │ BỘ CÔNG THƯƠNG              │ CỘNG HÒA XÃ HỘI CHỦ NGHĨA   │
  │ CỤC XÚC TIẾN THƯƠNG MẠI     │ VIỆT NAM                    │
  │ ─────                       │ Độc lập - Tự do - Hạnh phúc │
  │                             │ ──────────────              │
  │ Số: [SỐ VB]/QĐ-XTTM         │ Hà Nội, ngày [DD] tháng [MM]│
  │                             │ năm [YYYY]                  │
  └─────────────────────────────┴──────────────────────────────┘

                          QUYẾT ĐỊNH
            Về việc [tiêu đề viết hoa, in đậm]

  CỤC TRƯỞNG CỤC XÚC TIẾN THƯƠNG MẠI

  Căn cứ ...;
  Căn cứ Nghị định số 28/2018/NĐ-CP ngày 01/3/2018...;
  Xét đề nghị của ...,

  QUYẾT ĐỊNH:

  Điều 1. ...
  Điều 2. ...
  Điều 3. ...

                                          CỤC TRƯỞNG
  Nơi nhận:                                (Ký tên, đóng dấu)
  - Như Điều 3;                            [chỗ trống]
  - Lưu: VT, XTTM.                         [Họ tên]
  ```
- **Logo Quốc huy**: dùng SVG placeholder (vector) trong `public/logo-quoc-huy.svg`. Đừng dùng ảnh PNG mờ.
- **Watermark "BẢN MẪU"** chéo nền nhạt khi demo — vừa đẹp vừa tránh hiểu nhầm là văn bản thật.
- **Số văn bản giả**: format `XX/QĐ-XTTM` (XX là số seq, QĐ là loại quyết định, XTTM là cơ quan).

**Warning signs:**
- PDF không có "Cộng hòa Xã hội Chủ nghĩa Việt Nam"
- Không có "Nơi nhận" và "Lưu: VT"
- Phần ký chỉ ghi "Signed by..." kiểu DocuSign

**Phase to address:** **M3** (quyết định phê duyệt — file PDF đầu tiên cần chuẩn), **M5** (biên bản nghiệm thu, hồ sơ thanh lý).

---

### Pitfall 1.6: Form label không khớp biểu mẫu pháp lý (severity: HIGH, stage: Execution)

**What goes wrong:**
Form khai báo đề án dùng label "Tên dự án" trong khi mẫu Bộ ban hành ghi "Tên đề án xúc tiến thương mại". Hoặc dùng "Ngân sách" trong khi mẫu ghi "Tổng dự toán kinh phí (đã bao gồm VAT)". Người dùng nghiệp vụ nhìn vào không thấy đúng "ngôn ngữ" họ quen.

**Why it happens:**
- Dev không tham chiếu file `Mau bieu/` khi đặt label.
- Đặt theo intuition của lập trình viên.

**How to avoid:**
- **Bắt buộc đọc các file trong `Mau bieu/` trước khi build form M2.3 (Khai báo đề án)**.
- **Map 1:1 từng field trong DB schema với từng dòng trong biểu mẫu giấy**:
  ```typescript
  // Project schema fields → biểu mẫu PDF/Word
  {
    name: 'Tên đề án',                          // Mục 1 — Mẫu đề án
    type: 'Loại hình hoạt động XTTM',           // Mục 2
    objective: 'Mục tiêu, yêu cầu của đề án',   // Mục 3
    content: 'Nội dung và quy mô',              // Mục 4
    duration: 'Thời gian, địa điểm',            // Mục 5
    budget: 'Tổng dự toán kinh phí',            // Mục 6
    budgetState: '— Phần kinh phí Nhà nước hỗ trợ',  // Mục 6.1
    budgetSelf: '— Phần kinh phí đơn vị tự bố trí',   // Mục 6.2
    leader: 'Chủ nhiệm đề án',                  // Mục 7
    market: 'Thị trường mục tiêu',              // Mục 8
    industry: 'Ngành hàng',                     // Mục 9
  }
  ```
- **Hover tooltip trên label** giải thích thuật ngữ (vd: "Đề án 2 năm: tách thành 2 record, mỗi record là 1 năm, có liên kết qua parentProjectId").

**Warning signs:**
- Khi audit form, gặp label tự chế ("Mục đích" thay vì "Mục tiêu")
- Sales team / nội bộ DFT review nói "label không giống công văn họ gửi"

**Phase to address:** **M2.3** (multi-step form khai báo đề án — phải khớp 6 bước biểu mẫu).

---

## 2. CRITICAL Pitfalls — Demo Failure

### Pitfall 2.1: Hardcoded "today" làm demo data trông cũ (severity: CRITICAL, stage: Demo)

**What goes wrong:**
Demo tháng 6/2026 nhưng seed file ghi `"Hạn nộp đề án: 30/05/2024"`, `"Đề án nộp ngày 15/03/2025"` → trông như hệ thống test từ năm ngoái, không có ai dùng. Mất tính "live".

**Why it happens:**
- Dev seed bằng date string cứng (`new Date('2025-03-15')`).
- Không tính đến demo có thể bị dời lịch 1-2 tháng.

**How to avoid:**
- **Mọi date trong seed phải tính tương đối với `new Date()`**:
  ```typescript
  // prisma/seed.ts
  const now = new Date();
  const Y = now.getFullYear();        // năm chu kỳ chương trình hiện tại
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000);
  const daysFromNow = (n: number) => new Date(Date.now() + n * 86400_000);

  // Chu kỳ chương trình năm hiện tại — đang OPEN_REGISTRATION
  await prisma.programCycle.create({
    data: {
      year: Y,
      openDate: daysAgo(45),       // mở 45 ngày trước
      deadlineDate: daysFromNow(15), // còn 15 ngày nữa hết hạn
      status: 'OPEN_REGISTRATION',
    },
  });

  // Chu kỳ năm trước — đã COMPLETED (để có lịch sử)
  await prisma.programCycle.create({
    data: { year: Y - 1, status: 'COMPLETED', /* ... */ },
  });
  ```
- **SLA cảnh báo cũng tính tương đối**: mock đề án có quyết định phê duyệt 55 ngày trước → cảnh báo "còn 5 ngày là chậm ký HĐ" hiển thị rực rỡ trên dashboard.
- **Demo sự kiện quốc tế**: 1 đề án có hoạt động "trong 28 ngày nữa" (chưa liên hệ thương vụ → cảnh báo 30 ngày trigger), 1 đề án "trong 35 ngày nữa" (chưa cảnh báo, để lát nữa demo trigger trên cùng máy).

**Warning signs:**
- Dashboard hiển thị "Hạn nộp đề án: 30/05/2024" nhưng đang là 2026
- Cảnh báo SLA tất cả đều "Quá hạn 320 ngày" — không có cái nào "đang sắp hạn" để demo

**Phase to address:** **M7** (mock data audit), nhưng convention phải set ngay từ **M2** (seed đầu tiên).

---

### Pitfall 2.2: Live demo broken file upload / role switching (severity: CRITICAL, stage: Demo)

**What goes wrong:**
- Đang demo upload bản scan công văn → file >5MB → server action timeout / Next.js body limit reject → demo đứng.
- Đang demo "BQL chuyển sang xem với role Đơn vị chủ trì" → phải logout, login lại → mất 30 giây ngồi gõ password trước mặt khán giả.
- Mid-demo chuyển user → session sticky, vẫn thấy menu cũ → bug nhìn rõ ràng.

**Why it happens:**
- Next.js 15 server action default body limit ~1MB — không config thì upload 5MB lỗi.
- NextAuth không có "switch user" button — phải logout/login.
- Cookie session không clear hết khi đổi role.

**How to avoid:**
- **Config Server Action body size**:
  ```typescript
  // next.config.ts
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
  },
  ```
- **Demo chỉ upload file mock <2MB** đã chuẩn bị sẵn trong `public/mock-files/sample-de-an.pdf`.
- **"Demo Switch User" hidden feature** (ẩn sau Cmd+K command palette, chỉ active khi `NODE_ENV=development` hoặc `?demo=1`):
  - Click 1 lần switch user, giữ session, redirect về dashboard mới
  - Hiện badge nhỏ "DEMO MODE • banql" góc dưới
- **Test trước demo trên đúng setup máy demo** (không phải máy dev), với projector đã kết nối.

**Warning signs:**
- Upload file 3MB lần đầu báo "413 Payload Too Large" trong console
- Click "Đăng xuất" rồi login mất >5 giây
- Thử trên máy đồng nghiệp (không cache), thấy chậm khác hẳn máy mình

**Phase to address:** **M0** (Next.js config), **M7** (demo dry-run trên máy demo + tài khoản clean).

---

### Pitfall 2.3: Empty states / fresh DB demo trông trống trải (severity: HIGH, stage: Demo)

**What goes wrong:**
Demo tính năng "Quản lý chu kỳ chương trình" → bấm vào tab "Báo cáo cấp cao" → bảng trống tinh, không có placeholder → demo "chết". Hoặc dashboard cards toàn số 0 vì chưa có data ở module đó.

**Why it happens:**
- Dev test chỉ với data đã seed cho luồng mình build, quên các tab phụ.
- Empty state component không được thiết kế (mặc định shadcn DataTable → "No results.").

**How to avoid:**
- **Empty state convention** — mọi list/dashboard widget có 3 state:
  1. **Loading**: skeleton (không spinner)
  2. **Empty (chưa có data)**: illustration SVG + "Chưa có [đối tượng] nào" + CTA "+ Thêm mới"
  3. **No filter result**: "Không tìm thấy kết quả phù hợp với bộ lọc" + nút "Xóa bộ lọc"
- **Seed bao phủ mọi module**: mỗi module M1-M6 phải có ít nhất 5-10 record để mọi list view "có data".
- **Audit checklist trước demo**: mở từng route trong sidebar, screenshot, đảm bảo không có route nào "trắng tinh".

**Warning signs:**
- Click vào tab/route lần đầu thấy white screen 2 giây → ko có loading state
- DataTable hiện "No results." (English mặc định shadcn)
- Dashboard card hiển thị "0 đề án" trong khi trong seed có 15

**Phase to address:** **M0** (empty state component pattern), **M7** (audit toàn bộ route).

---

### Pitfall 2.4: Console errors / DevTools peek lộ điểm yếu (severity: HIGH, stage: Demo)

**What goes wrong:**
Đội kỹ thuật của khách (CIO / IT lead) hỏi "anh mở DevTools cho tôi xem" → hàng đống warning hydration mismatch, 404 favicon, key prop missing, deprecated API → mất uy tín kỹ thuật ngay tức khắc.

**Why it happens:**
- Next.js 15 hydration warnings rất phổ biến nếu xài `Date.now()` / `Math.random()` ngoài effect.
- React key warning khi map list không có ID ổn định.
- Favicon 404 nếu quên đặt file vào /public.

**How to avoid:**
- **Pre-demo console hygiene checklist**:
  - [ ] `npm run build && npm run start` (production build, không phải dev) — dev mode hiện thêm warning
  - [ ] Mở DevTools Console, bấm Clear, navigate khắp nơi → 0 error / 0 warning
  - [ ] Mở Network tab → 0 request 404 (favicon, font, image)
  - [ ] Mở React DevTools → không thấy "Suspended" hoặc "Error boundary"
- **Hydration mismatch fix pattern** cho date / random:
  ```typescript
  // ❌ SAI — gây hydration mismatch
  <span>{format(new Date(), 'dd/MM/yyyy', { locale: vi })}</span>

  // ✅ ĐÚNG — render server-side với data fixed, hoặc client-only
  'use client';
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return <span suppressHydrationWarning>{now ? formatDate(now) : '—'}</span>;
  ```
- **Demo data dates serialize qua server** (ISO string) rồi format lại trên client để consistent.

**Warning signs:**
- DevTools Console có dấu chấm than đỏ/vàng > 0
- "Warning: Text content did not match. Server: ... Client: ..."
- "Warning: Each child in a list should have a unique 'key' prop"

**Phase to address:** **M7** (pre-demo console audit), **M0** (set up tooling: lint rule no-console, strict mode).

---

### Pitfall 2.5: Performance jank trên wifi shared / projector (severity: MEDIUM, stage: Demo)

**What goes wrong:**
Demo trên phòng họp wifi share, network ping 200ms → mỗi navigation cảm giác lag. Server action mất 2 giây thay vì 200ms như ở văn phòng.

**Why it happens:**
- Demo prototype không tính tới network latency (chạy Next.js dev server qua wifi yếu).
- Không có loading optimistic UI — user click nút mà không có phản hồi tức thì.

**How to avoid:**
- **Demo LOCAL — tuyệt đối không deploy production cho demo lần này**. Chạy `npm run start` trên laptop demo, kết nối qua HDMI ra TV/projector. Network latency = 0.
- **Pre-cache mọi static asset**: chạy `next build` (production), không phải `next dev`.
- **Optimistic UI cho mọi action quan trọng**:
  - Click "Phê duyệt" → toast "Đang phê duyệt..." hiện ngay, status update optimistic, rollback nếu lỗi.
- **Skeleton loading + Suspense boundary**: tránh blank screen khi navigate.

**Warning signs:**
- Click button → 1-2 giây sau mới có phản hồi
- Page navigation thấy white flash giữa các route
- TanStack Query cache không hit lần thứ 2

**Phase to address:** **M7** (demo dry-run tại phòng họp thật, hoặc giả lập slow 3G qua Chrome DevTools).

---

## 3. HIGH Pitfalls — Prototype Scope Creep

### Pitfall 3.1: Over-engineer RBAC thành full permission engine (severity: HIGH, stage: Planning + Execution)

**What goes wrong:**
Sa lầy 1-2 tuần build full RBAC engine với resource-level permissions, conditional rules, dynamic roles, team-based ACL... cuối cùng không có thời gian polish hero flow.

**Why it happens:**
- Yêu cầu "Ma trận phân quyền cấu hình bằng UI, không hardcode" (M1) dễ bị diễn giải thành "build CASL/Casbin engine".
- Lập trình viên thích kỹ thuật, ít thích design UI.

**How to avoid:**
- **Scope cho POC**:
  - Permission matrix là **bảng 2D static** (rows = role, cols = action), lưu trong `lib/permissions.ts` hoặc DB seed.
  - UI cho phép **toggle ô** trong ma trận, lưu DB → load lại khi check permission. Hết.
  - **KHÔNG** có wildcards, KHÔNG có resource-level (chỉ action-level), KHÔNG có condition (vd "user chỉ sửa đề án của đơn vị mình" — hardcode trong query, không config).
- **API check permission**:
  ```typescript
  // Đủ cho POC
  function can(user: User, action: string): boolean {
    return permissions[user.role]?.includes(action) ?? false;
  }
  ```
- **Flag "đây là demo logic"** trong comment để tương lai biết phần này cần redo cho production.

**Warning signs:**
- Code có file `lib/casl.ts` hoặc `lib/casbin.ts`
- Permission check phức tạp hơn 5 dòng
- Dev họp hỏi "có nên dùng @casl/ability không?"

**Phase to address:** **M1** (Quản trị & danh mục — RBAC). Locked scope phải nhỏ.

---

### Pitfall 3.2: Build email/SMS dispatch thật (severity: HIGH, stage: Execution)

**What goes wrong:**
Tích hợp Mailgun/SendGrid/Twilio để "gửi thật" → tốn 1 tuần config, vướng API key, vướng deliverability, demo thì email vào spam → trông thiếu chuyên nghiệp.

**Why it happens:**
- Dev thấy "Composer email" thì nghĩ "phải gửi thật mới ấn tượng".
- Quên đọc CLAUDE.md mục Out of Scope.

**How to avoid:**
- **Mock dispatch trong app**:
  - Click "Gửi" → toast "Đã gửi email tới 12 đơn vị" → lưu record vào table `Notification` với `status='SENT'` và `mockEmailContent='...'`
  - Có inbox view "Thông báo đã gửi" để admin/BQL xem lại nội dung — DEMO ĐIỂM LÀ Ở ĐÂY (hiển thị danh sách email đã "gửi" trông rất pro)
  - Mỗi user có inbox thông báo riêng — đăng nhập tài khoản đó thấy email mock
- **KHÔNG cần SMTP, không cần API key, không cần queue.**
- **Visual cue rõ ràng**: badge "MOCK" hoặc "DEMO" trên header inbox để phân biệt với email thật (nhẹ nhàng, không phá look đẹp).

**Warning signs:**
- `package.json` có `nodemailer` / `@sendgrid/mail` / `twilio`
- `.env.local` có `SMTP_HOST=` hoặc `SMS_API_KEY=`
- Dev hỏi "domain mình có verified SPF chưa?"

**Phase to address:** **M1** (cấu hình email template — UI only), **M2.1** (mời đăng ký), **M3** (thông báo phê duyệt).

---

### Pitfall 3.3: Implement chữ ký số thật / e-signature (severity: HIGH, stage: Planning)

**What goes wrong:**
Dành tuần research USB token / VNPT-CA / FPT-CA / HSM integration → toàn yêu cầu hạ tầng phức tạp (server có hardware, certificate, tích hợp PKI). POC không đủ thời gian.

**Why it happens:**
- "Quyết định phê duyệt" cần "ký" → suy ra phải có chữ ký số.
- Khách demo cấp cao, sợ mock không thuyết phục.

**How to avoid:**
- **Mock e-signature flow**:
  - Click "Ký quyết định" → modal hiện hình token USB + spinner "Đang xác thực với token..." (visual placeholder, fake 2 giây)
  - Sau "ký" → PDF có watermark "ĐÃ KÝ SỐ - [Họ tên người ký] - [timestamp]" góc phải dưới
  - QR code chứa text "Xác thực tại: portal.bocongthuong.gov.vn/verify/[mock-id]" (link không cần work)
- **Visual fidelity là đủ.** Nói rõ "phần ký số sẽ tích hợp với VNPT-CA / FPT-CA ở giai đoạn 2" trong demo script.
- **Upload bản scan đã ký ngoài hệ thống** là flow chính — nghiệp vụ thực tế cũng thường làm thế (CLAUDE.md đã khẳng định).

**Warning signs:**
- Có code đọc certificate `.cer` / `.pfx`
- Tìm kiếm "node-signpdf" trong package.json
- Research "chữ ký số USB token web" — đây là lỗ vô đáy

**Phase to address:** **M3** (quyết định phê duyệt — chỉ mock visual), **M4** (hợp đồng — upload bản scan).

---

### Pitfall 3.4: Audit log immutable / cryptographic (severity: MEDIUM, stage: Execution)

**What goes wrong:**
Cài WORM (write-once-read-many), hash chain, blockchain audit → thừa thãi cho POC, làm Prisma schema phức tạp, query chậm.

**Why it happens:**
- "An toàn thông tin cấp độ 3" trong context → tưởng phải có audit log immutable.
- CLAUDE.md đã loại "ATBM cấp độ 3" out of scope nhưng dev quên.

**How to avoid:**
- **Audit log POC = 1 table phẳng**:
  ```prisma
  model AuditLog {
    id        String   @id @default(cuid())
    userId    String
    action    String   // "CREATE_PROJECT", "APPROVE_DECISION", etc.
    target    String   // "Project:abc-123"
    metadata  Json?    // before/after snapshot nếu cần
    ipAddress String?
    timestamp DateTime @default(now())
  }
  ```
- **UI có filter (user, action, date), export Excel** — đủ để demo "có audit log"
- **KHÔNG cần** hash chain, KHÔNG cần signature, KHÔNG cần read-only DB.

**Warning signs:**
- Code có `crypto.createHash('sha256')` cho audit log
- Schema có `previousHash` / `merkleRoot`

**Phase to address:** **M1** (Lịch sử truy cập / audit log — basic).

---

### Pitfall 3.5: Đầu tư quá nhiều cho mobile responsive (severity: MEDIUM, stage: Execution)

**What goes wrong:**
Dành 30% thời gian polish mobile breakpoint cho mọi màn hình → tốn tài nguyên trong khi audience demo dùng máy chiếu 1920×1080 hoặc TV 4K. Hero flow polish không nổi.

**Why it happens:**
- Best practice "mobile-first" reflex.
- shadcn/ui responsive sẵn → tưởng free, nhưng custom components vẫn cần effort.

**How to avoid:**
- **Tối thiểu hóa mobile**:
  - Layout chính: chỉ đảm bảo không "vỡ" ở 768px (sidebar collapse) và 1366×768
  - Multi-step form đề án: desktop-first, mobile chỉ cần "không vỡ chữ", không tối ưu UX
  - Dashboard charts: hide một số widget ở mobile (acceptable cho POC)
- **Test 2 viewport thôi**: 1366×768 (laptop demo phổ biến) + 1920×1080 (máy chiếu).
- **CLAUDE.md đã quy định**: "Mobile không bắt buộc nhưng không vỡ" — bám đó.

**Warning signs:**
- Spend > 1 ngày debug mobile hamburger menu animation
- Có breakpoint < 768px (nhỏ hơn tablet — thừa)

**Phase to address:** **M0** (layout shell — set responsive baseline 768/1366/1920).

---

## 4. CRITICAL Pitfalls — Business Process Modeling

### Pitfall 4.1: State machine đề án + chu kỳ chương trình sai transition (severity: CRITICAL, stage: Planning + Execution)

**What goes wrong:**
- Cho phép tạo đề án khi `ProgramCycle.status = DRAFT` (chưa OPEN) → vi phạm gating
- Cho phép `Project.status: APPROVED → DRAFT` (rollback bừa)
- Cho phép thẩm định khi đề án chưa qua "kiểm tra hợp lệ"
- Quên transition `CLOSED_REGISTRATION → OPEN_REGISTRATION` (gia hạn — đã chốt phải có)

**Why it happens:**
- State machine viết tự do trong server action, không có validation tập trung.
- Không vẽ sơ đồ trạng thái trước khi code.

**How to avoid:**
- **Đặc tả state machine bằng `lib/state-machines/`**:
  ```typescript
  // lib/state-machines/programCycle.ts
  export const PROGRAM_CYCLE_TRANSITIONS = {
    DRAFT: ['READY'],
    READY: ['OPEN_REGISTRATION', 'DRAFT'],
    OPEN_REGISTRATION: ['CLOSED_REGISTRATION'],
    CLOSED_REGISTRATION: ['EVALUATING', 'OPEN_REGISTRATION'], // gia hạn
    EVALUATING: ['APPROVED'],
    APPROVED: ['COMPLETED'],
    COMPLETED: [],
  } as const;

  export function canTransition(from: Status, to: Status): boolean {
    return PROGRAM_CYCLE_TRANSITIONS[from].includes(to);
  }
  ```
- **Mọi server action đổi status PHẢI gọi `canTransition` trước**, throw nếu không hợp lệ.
- **Test bằng table-driven test**:
  ```typescript
  describe('ProgramCycle transitions', () => {
    it.each([
      ['DRAFT', 'READY', true],
      ['DRAFT', 'OPEN_REGISTRATION', false], // skip step
      ['CLOSED_REGISTRATION', 'OPEN_REGISTRATION', true], // gia hạn
      ['APPROVED', 'DRAFT', false], // no rollback
    ])('%s → %s = %s', (from, to, expected) => { ... });
  });
  ```
- **Sơ đồ state machine vẽ trong README** dưới dạng Mermaid để team review.

**Warning signs:**
- Server action có `await prisma.update({ data: { status: 'APPROVED' } })` không kiểm tra current status
- Không có file `lib/state-machines/`
- Test data có đề án `APPROVED` mà chu kỳ vẫn `DRAFT`

**Phase to address:** **M0** (state machine spec), **M2.1** (chu kỳ chương trình), **M2.3-M2.4** (vòng đời đề án).

---

### Pitfall 4.2: Quên `parentProjectId` cho đề án 2 năm (severity: CRITICAL, stage: Planning)

**What goes wrong:**
Đề án 2 năm (kéo dài năm 2026 và 2027) phải tách thành 2 record với `parentProjectId` link. Nhưng dev model 1 record có `duration: 2`, hoặc không có FK → khi demo:
- Hợp đồng năm 2 nối vào hợp đồng năm 1 (sai — phải tách)
- Quyết toán năm 2 không độc lập với năm 1
- Báo cáo từng năm không đúng

**Why it happens:**
- Schema thiết kế trước khi đọc kỹ ghi chú trong `_extracted_quytrinh.txt` ("Đề án 2 năm: Coi như 2 đề án khác nhau, ký hợp đồng, nghiệm thu thanh toán khác nhau").
- Nghĩ đơn giản hóa = lưu 1 record + field `years`.

**How to avoid:**
- **Schema rõ ràng**:
  ```prisma
  model Project {
    id              String    @id @default(cuid())
    code            String    @unique // mã đề án
    name            String
    cycleYear       Int       // năm chu kỳ chương trình của record này
    parentProjectId String?   // null = đề án 1 năm, hoặc record năm 1; có giá trị = record năm 2
    parent          Project?  @relation("ProjectYears", fields: [parentProjectId], references: [id])
    children        Project[] @relation("ProjectYears")
    // ... contracts, reports, finances RIÊNG mỗi record
  }
  ```
- **Form khai báo đề án có toggle "Đề án 2 năm"** → khi bật, sau khi submit, hệ thống tự sinh 2 record link với nhau.
- **UI hiển thị** badge "Năm 1/2" và "Năm 2/2" + link sang đề án ngang cấp.
- **Seed mock**: ít nhất 1 đề án 2 năm (ví dụ "Hội chợ Vietnam Expo Quốc tế 2026-2027") để demo flow này.

**Warning signs:**
- Schema không có field `parentProjectId`
- Có field `durationYears: Int` mà không có cơ chế tách

**Phase to address:** **M0** (schema design — locked trước khi build M2).

---

### Pitfall 4.3: Gating ProgramCycle.OPEN_REGISTRATION không enforce (severity: CRITICAL, stage: Execution)

**What goes wrong:**
Đơn vị chủ trì login, vẫn thấy nút "Tạo đề án mới" hoạt động dù chu kỳ chưa OPEN, hoặc đã CLOSED. Khi demo flow ngược ("đầu năm chưa mời đề xuất, đơn vị chủ trì vào trước") → đơn vị tạo đề án thành công → demo không match câu chuyện.

**Why it happens:**
- Server action `createProject` không check `ProgramCycle.status`.
- Frontend hide nút nhưng route vẫn hit được (security through obscurity).
- Quên seed 1 ProgramCycle ở trạng thái OPEN_REGISTRATION → demo lỗi 404.

**How to avoid:**
- **Server action enforce**:
  ```typescript
  export async function createProject(data: ProjectInput) {
    const currentCycle = await getCurrentProgramCycle();
    if (currentCycle.status !== 'OPEN_REGISTRATION') {
      throw new Error(`Chu kỳ chương trình ${currentCycle.year} hiện đang ở trạng thái "${currentCycle.statusLabel}". Chỉ được tạo đề án khi chu kỳ ở trạng thái "Mở đăng ký".`);
    }
    // ...
  }
  ```
- **UI helper `<RegistrationGate>`** wrap khu vực tạo đề án, hiện banner thông báo trạng thái hiện tại của chu kỳ + countdown đến hạn nộp.
- **Seed**: chu kỳ năm hiện tại luôn ở `OPEN_REGISTRATION` với deadline 15-30 ngày tới (cảnh báo SLA hiện ra đẹp).
- **Demo script**: BQL demo trước, mở chu kỳ → đơn vị mới được phép vào → nhấn mạnh tính tuần tự.

**Warning signs:**
- Test gọi `createProject` thẳng không qua check status mà vẫn thành công
- UI có nút "Tạo mới" hiện ra mọi lúc

**Phase to address:** **M2.1** (chu kỳ chương trình — gating), **M2.3** (form đề án).

---

### Pitfall 4.4: Phân loại "trọng yếu" vs "không trọng yếu" sai (Điều 13 NĐ 28) (severity: HIGH, stage: Execution)

**What goes wrong:**
Module Điều chỉnh đề án (M4) cho phép thay đổi mục tiêu / nội dung chuyên môn → BQL phê duyệt thẳng (không thẩm định lại) → vi phạm NĐ 28. Khán giả nghiệp vụ thấy lỗi này = mất uy tín ngay lập tức (đây là điều khoản pháp lý họ thuộc nằm lòng).

**Why it happens:**
- Dev đọc lướt "thay đổi nhỏ vs trọng yếu" mà không có rule cụ thể.
- Quên rằng `_extracted_quytrinh.txt` đã ghi rõ phân loại.

**How to avoid:**
- **Rule phân loại rõ ràng** (theo file nguồn + NĐ 28):
  - **Không trọng yếu** (BQL duyệt nội bộ):
    - Thay đổi thời gian tổ chức (thay đổi lịch quý/ngày cụ thể)
    - Thay đổi địa điểm
    - Thay đổi tên đơn vị chủ trì (do tái cơ cấu)
    - Thay đổi tên đề án (chỉnh chính tả, làm rõ hơn)
  - **Trọng yếu** (phải thẩm định lại):
    - Thay đổi mục tiêu, nội dung chuyên môn của đề án
    - Thay đổi quy mô (số lượng DN tham gia, số đoàn, etc.)
    - Thay đổi dự toán kinh phí (đặc biệt nếu vượt ngưỡng % cho phép)
    - Thay đổi thị trường mục tiêu (vd: chuyển từ EU sang Châu Phi)
    - Bổ sung 1 đề án mới hoàn toàn (đi theo quy trình đăng ký mới)
- **UI form điều chỉnh**:
  - Bước 1: Đơn vị chọn "Loại điều chỉnh" (dropdown rõ ràng)
  - Bước 2: System tự suy luận `is_critical` từ loại + show nhãn "Cần thẩm định lại" / "BQL duyệt nội bộ"
  - Bước 3: Submit → route đúng workflow
- **Code constants**:
  ```typescript
  export enum ChangeType {
    SCHEDULE = 'schedule',          // không trọng yếu
    LOCATION = 'location',          // không trọng yếu
    UNIT_RENAME = 'unit_rename',    // không trọng yếu
    PROJECT_RENAME = 'project_rename', // không trọng yếu
    OBJECTIVE = 'objective',        // TRỌNG YẾU
    SCOPE = 'scope',                // TRỌNG YẾU
    BUDGET = 'budget',              // TRỌNG YẾU
    MARKET = 'market',              // TRỌNG YẾU
    NEW_PROJECT = 'new_project',    // → workflow đăng ký mới
  }

  export const CRITICAL_CHANGE_TYPES = [
    ChangeType.OBJECTIVE,
    ChangeType.SCOPE,
    ChangeType.BUDGET,
    ChangeType.MARKET,
  ];
  ```

**Warning signs:**
- Form điều chỉnh chỉ có 1 textarea "Lý do thay đổi" mà không phân loại
- Demo điều chỉnh nội dung → đi thẳng tới "BQL duyệt"
- Không có reference đến NĐ 28 trong UI

**Phase to address:** **M4** (Điều chỉnh đề án — Điều 13 NĐ 28).

---

### Pitfall 4.5: Trộn lẫn "Kiểm tra hồ sơ" và "Thẩm định" (severity: HIGH, stage: Execution)

**What goes wrong:**
- Module M2.4 (kiểm tra hồ sơ) cho chuyên viên "chấm điểm thẩm định" → sai vai trò.
- Hoặc M3 (thẩm định) cho hội đồng "kiểm tra hồ sơ thiếu giấy tờ" → sai vai trò.
- 2 bước này có UI giống nhau dẫn đến confusion cho khán giả.

**Why it happens:**
- Cả 2 đều có "checklist" và "điểm số" → dev gộp logic.
- Không hiểu rõ phân chia nghiệp vụ.

**How to avoid:**
- **2 module hoàn toàn tách biệt**:
  | Khía cạnh | Kiểm tra hồ sơ (M2.4) | Thẩm định (M3) |
  |---|---|---|
  | Thực hiện bởi | Chuyên viên Cục XTTM | Hội đồng thẩm định (members) |
  | Mục đích | Hợp lệ về mặt hành chính | Đánh giá chuyên môn |
  | Output | Hợp lệ / Trả bổ sung | Điểm số + xếp hạng |
  | Tiêu chí | Checklist hành chính (đầy đủ giấy tờ) | Bộ tiêu chí chuyên môn (file `Mau bieu/Tiêu chí thẩm định đề án.docx`) |
  | Trigger sau | Đủ điều kiện thẩm định | Đủ điều kiện trình duyệt |
  | Có "chấm điểm sơ bộ" của chuyên viên (số 63 trong UC list) — đây vẫn KHÁC với điểm thẩm định | Điểm chính thức |
- **UI khác biệt rõ ràng**:
  - M2.4: layout checklist với checkbox (✓ / ✗ / N/A) + ghi chú từng mục
  - M3: form chấm điểm theo tiêu chí có trọng số, scale 1-10, hỗ trợ lưu nháp + nộp chính thức
- **Route khác biệt**: `/de-an/[id]/kiem-tra` vs `/tham-dinh/[hoiDongId]/de-an/[id]/cham-diem`

**Warning signs:**
- Code share component giữa 2 module
- Schema `Score` có cả `isPreliminary: boolean` + `councilMemberId`

**Phase to address:** **M2.4** (kiểm tra), **M3** (thẩm định) — cần spec rõ trước.

---

### Pitfall 4.6: Đề án quốc tế quên cảnh báo 30 ngày liên hệ thương vụ (severity: HIGH, stage: Execution + Demo)

**What goes wrong:**
Hệ thống không có cảnh báo "còn 28 ngày đến sự kiện quốc tế, đơn vị chưa xác nhận liên hệ thương vụ/ĐSQ" → mất 1 cảnh báo SLA quan trọng được nêu trong file nguồn (Bước 12, ghi chú).

**Why it happens:**
- Đây là rule khá ẩn, không phải ai cũng đọc kỹ.
- Demo data không có đề án quốc tế đang sắp đến hạn.

**How to avoid:**
- **Schema** thêm field `Project.isInternational: boolean`, `Project.embassyContacted: boolean`, `Project.embassyContactedAt: DateTime?`.
- **Cron-like check (chạy mỗi lần load dashboard)**:
  ```typescript
  const upcomingInternationalEvents = await prisma.project.findMany({
    where: {
      isInternational: true,
      embassyContacted: false,
      eventStartDate: {
        gte: new Date(),
        lte: addDays(new Date(), 30),
      },
    },
  });
  ```
- **Widget dashboard**: "Đề án quốc tế chưa liên hệ thương vụ" — list red badge.
- **Seed demo**: 2 đề án quốc tế — 1 đang trigger cảnh báo (28 ngày, chưa liên hệ), 1 đã liên hệ (xanh).

**Warning signs:**
- Schema không có field `embassyContacted`
- Dashboard không có widget "Cảnh báo ngoại giao 30 ngày"

**Phase to address:** **M6** (Dashboard & cảnh báo).

---

## 5. HIGH Pitfalls — Next.js 15 / shadcn/ui Specific

### Pitfall 5.1: Server Action không decode tiếng Việt (severity: MEDIUM, stage: Execution)

**What goes wrong:**
Form data submit qua server action → nhận về string "Ä‘á»" thay vì "đề án" → save DB sai → render UI vỡ.

**Why it happens:**
- Server action thường OK với UTF-8 default, nhưng **FormData encoded sai khi mix multipart + non-UTF-8 source** (vd: file CSV import có encoding Windows-1258 thay vì UTF-8).
- Nếu API route custom decode body bằng `Buffer.toString()` mặc định → sai encoding.

**How to avoid:**
- **Server action với JSON body** (qua React Hook Form serialize) → mặc định UTF-8, không vấn đề.
- **Khi upload CSV/Excel mock**: detect encoding bằng thư viện `chardet` hoặc force UTF-8 input. Không có thì hiển thị warning "File không phải UTF-8, vui lòng save as UTF-8 trước".
- **Test smoke với input tiếng Việt** ngay từ form đầu tiên (M0) — nếu encode lỗi sẽ phát hiện sớm.

**Warning signs:**
- Database query trả về "Ä‘á»" / "â??"
- File CSV import nhập từ Excel cũ → tên đề án vỡ

**Phase to address:** **M0** (smoke test encoding), **M5** (import báo cáo từ biểu mẫu — nếu có CSV import).

---

### Pitfall 5.2: Hydration mismatch với date-fns / locale vi (severity: HIGH, stage: Execution + Demo)

**What goes wrong:**
Server render `format(new Date(), 'PPP', { locale: vi })` = "30 tháng 4 năm 2026", client render khác (do timezone hoặc Date.now() khác milliseconds) → React warning hydration mismatch → có thể hiện flash UI sai.

**Why it happens:**
- Server (Node.js process) timezone có thể khác browser.
- `new Date()` chạy 2 lần (1 server, 1 client) cho ra giá trị khác nhau (ms khác).
- Locale vi import server-side đôi khi chưa load xong khi client hydrate.

**How to avoid:**
- **Pattern 1 — Date data từ server đã serialize**:
  ```typescript
  // Server: pass ISO string
  return { createdAt: project.createdAt.toISOString() };

  // Client: format từ ISO string (deterministic)
  <span>{formatDate(props.createdAt)}</span>
  ```
- **Pattern 2 — Client-only "live" component**:
  ```typescript
  'use client';
  function LiveClock() {
    const [now, setNow] = useState<string>('');
    useEffect(() => {
      setNow(formatDateTime(new Date()));
      const id = setInterval(() => setNow(formatDateTime(new Date())), 1000);
      return () => clearInterval(id);
    }, []);
    return <span suppressHydrationWarning>{now || '—'}</span>;
  }
  ```
- **Pattern 3 — fix timezone** trong `next.config.ts`: `process.env.TZ = 'Asia/Ho_Chi_Minh';` (nhưng client browser timezone vẫn theo máy user — nên data luôn pass ISO + format client-side).
- **Test bằng `npm run build && npm run start`** (production mode hiện hydration error rõ hơn dev mode).

**Warning signs:**
- Console: "Warning: Text content did not match. Server: '...' Client: '...'"
- Date/time hiển thị flash ngắn rồi đổi lại

**Phase to address:** **M0** (formatters helper + convention pass ISO), **M7** (audit hydration warnings).

---

### Pitfall 5.3: shadcn/ui Form + RHF + Zod gotchas (severity: MEDIUM, stage: Execution)

**What goes wrong:**
- `<FormField>` không bind đúng → validation không trigger.
- `defaultValues` không set → field undefined → Zod nhận undefined nhưng schema yêu cầu string → error message lạ.
- `<Select>` của shadcn dùng radix → value phải là string, nếu pass enum number sẽ lỗi.

**Why it happens:**
- shadcn/ui Form là wrapper RHF + Radix UI — có nhiều layer abstraction.
- Zod nullable vs optional vs default rất dễ lẫn.

**How to avoid:**
- **Convention setup form**:
  ```typescript
  const schema = z.object({
    name: z.string().min(1, 'Vui lòng nhập tên đề án'),
    typeId: z.string().min(1, 'Vui lòng chọn loại đề án'),
    budget: z.coerce.number().positive('Ngân sách phải > 0'),
    objective: z.string().min(10, 'Mục tiêu tối thiểu 10 ký tự'),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {  // BẮT BUỘC set hết, kể cả empty string
      name: '',
      typeId: '',
      budget: 0,
      objective: '',
    },
  });
  ```
- **Select**: luôn dùng string ID, convert sang số ở backend nếu cần.
- **Number input**: dùng `z.coerce.number()` không phải `z.number()` (vì input value luôn là string).
- **Custom currency input** wrap `<Input>` với mask `1.000.000` (display) + value số.

**Warning signs:**
- Validation không trigger trên field nào đó
- Console warning "An input is changing from uncontrolled to controlled"
- Submit thành công nhưng DB nhận `null`

**Phase to address:** **M0** (form pattern reference), **M2.3** (form khai báo đề án 6 bước — phức tạp nhất).

---

### Pitfall 5.4: TanStack Table v8 sort tiếng Việt sai thứ tự (severity: MEDIUM, stage: Execution)

**What goes wrong:**
Sort cột "Tên đơn vị chủ trì" → thứ tự "Đông", "Đào" trước "Anh" (do unicode codepoint Đ > A) thay vì A → Đ → ... theo thứ tự bảng chữ cái Việt.

**Why it happens:**
- Default sort dùng comparison `<` cho string → so sánh code point.
- TanStack Table v8 có sortingFn nhưng cần custom cho tiếng Việt.

**How to avoid:**
- **Custom sortingFn**:
  ```typescript
  // lib/table-utils.ts
  export const vietnameseSort: SortingFn<any> = (rowA, rowB, columnId) => {
    const a = String(rowA.getValue(columnId) ?? '');
    const b = String(rowB.getValue(columnId) ?? '');
    return a.localeCompare(b, 'vi-VN', { sensitivity: 'base', numeric: true });
  };

  // Column def
  { accessorKey: 'name', header: 'Tên', sortingFn: vietnameseSort }
  ```
- **`localeCompare('vi-VN')` chạy đúng tại browser hiện đại** (Chrome/Edge fully support).
- **Server-side sort**: nếu sort từ Prisma → SQLite không biết tiếng Việt (xem Pitfall 6.3) → fetch về client rồi sort, hoặc thêm cột `nameSearchKey` (đã chuẩn hóa).

**Warning signs:**
- Sort cột tên thấy "Đ..." trước "A..."
- Sort không tôn trọng dấu (Đào ≠ Dao)

**Phase to address:** **M1** (mọi list view có sort).

---

### Pitfall 5.5: PDF generation memory leak / freeze browser (severity: MEDIUM, stage: Demo)

**What goes wrong:**
Click "Xuất PDF báo cáo tổng hợp 50 đề án" → browser freeze 10 giây, demo đứng → audience nghĩ "hệ thống chậm".

**Why it happens:**
- jsPDF render synchronous trên main thread.
- @react-pdf/renderer render React tree → có thể chậm cho document dài.
- Mỗi PDF có embed font Roboto base64 → ~200KB/file → 50 file = 10MB.

**How to avoid:**
- **Demo PDF chỉ 1-2 đề án/lần** (đừng demo "xuất tất cả 50 đề án" trừ khi đã optimize).
- **Server-side PDF generation** với `@react-pdf/renderer`:
  ```typescript
  // app/api/decision/[id]/pdf/route.ts
  import { renderToBuffer } from '@react-pdf/renderer';

  export async function GET(req, { params }) {
    const buffer = await renderToBuffer(<DecisionPDF id={params.id} />);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="QD-${params.id}.pdf"`,
      },
    });
  }
  ```
  Server render = browser không freeze.
- **Loading toast**: "Đang sinh PDF..." có thanh tiến trình giả (animate progress 0% → 90% trong 2s, jump 100% khi xong).
- **Pre-generate static PDF mẫu**: cho 3-5 đề án quan trọng nhất (dùng demo), xuất ra `public/mock-files/QD-001.pdf`. Click "Xuất PDF" → trả về file static (instant, ấn tượng).

**Warning signs:**
- Click xuất PDF → browser tab "Not responding" 5+ giây
- Memory tab Chrome DevTools tăng vọt mỗi lần xuất

**Phase to address:** **M3** (xuất quyết định), **M5** (xuất biên bản nghiệm thu, báo cáo).

---

## 6. MEDIUM Pitfalls — Prisma + SQLite

### Pitfall 6.1: Quên Prisma 6.2+ mới support enum SQLite (severity: MEDIUM, stage: Planning)

**What goes wrong:**
Schema dùng `enum ProjectStatus { DRAFT, SUBMITTED, ... }` → migrate báo lỗi "enum not supported" → dev hoảng → đổi sang `String` rải rác → mất type safety.

**Why it happens:**
- Training data cũ nói "SQLite không support enum" — đúng cho Prisma <6.2.
- Hiện Prisma 6.2+ (2025) đã polyfill enum cho SQLite — store là TEXT, validate ở app level.

**How to avoid:**
- **Lock Prisma version >=6.2.0** trong `package.json`.
- **Dùng enum thoải mái** trong schema:
  ```prisma
  enum ProjectStatus {
    DRAFT
    SUBMITTED
    UNDER_REVIEW
    NEED_SUPPLEMENT
    VALID
    EVALUATING
    APPROVED
    REJECTED
    CONTRACTED
    IN_PROGRESS
    COMPLETED
    LIQUIDATED
  }

  model Project {
    status ProjectStatus @default(DRAFT)
  }
  ```
- **Vẫn map enum value → label tiếng Việt** trong `lib/constants.ts`:
  ```typescript
  export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    DRAFT: 'Bản nháp',
    SUBMITTED: 'Đã nộp',
    UNDER_REVIEW: 'Đang kiểm tra',
    NEED_SUPPLEMENT: 'Yêu cầu bổ sung',
    VALID: 'Hợp lệ',
    EVALUATING: 'Đang thẩm định',
    APPROVED: 'Đã phê duyệt',
    REJECTED: 'Bị từ chối',
    CONTRACTED: 'Đã ký hợp đồng',
    IN_PROGRESS: 'Đang triển khai',
    COMPLETED: 'Hoàn thành',
    LIQUIDATED: 'Đã thanh lý',
  };
  ```

**Warning signs:**
- `npx prisma migrate dev` báo "Type ... is not supported"
- Dev đổi enum sang `@db.Text` rồi viết check thủ công

**Phase to address:** **M0** (lock Prisma version + schema design).

---

### Pitfall 6.2: Migration drift khi seed thay đổi (severity: MEDIUM, stage: Execution)

**What goes wrong:**
Sửa schema + sửa seed → quên `prisma migrate reset` → seed cũ trong DB conflict với schema mới → demo lỗi runtime.

**Why it happens:**
- SQLite file-based, không tự reset như Postgres trên Docker.
- Workflow chưa có script reset.

**How to avoid:**
- **Script `npm run db:reset`**:
  ```json
  "db:reset": "rm -f prisma/dev.db && prisma db push --skip-generate && prisma db seed",
  ```
- **Script `npm run db:seed` phải idempotent**:
  ```typescript
  // seed.ts
  await prisma.user.deleteMany(); // xóa hết trước
  await prisma.user.createMany({ data: [...] }); // tạo lại
  ```
- **CI step**: chạy `db:reset` trước demo dry-run để verify clean state.

**Warning signs:**
- App start báo "Column does not exist" / "Constraint failed"
- Seed script dùng `upsert` nhưng có race condition

**Phase to address:** **M0** (script + workflow), **M7** (pre-demo reset).

---

### Pitfall 6.3: SQLite collation sort tiếng Việt sai (severity: MEDIUM, stage: Execution)

**What goes wrong:**
Query `prisma.user.findMany({ orderBy: { fullName: 'asc' } })` → trả về thứ tự sai (Đông trước An).

**Why it happens:**
- SQLite chỉ có `BINARY`, `NOCASE`, `RTRIM` collation. NOCASE chỉ ASCII case-insensitive, không hỗ trợ Vietnamese diacritics.
- Prisma không có locale-aware sort.

**How to avoid:**
- **Lựa chọn 1 — Sort client-side** (đơn giản nhất cho POC):
  - Fetch unsorted, dùng `Array.sort((a,b) => a.localeCompare(b, 'vi-VN'))` ở component
  - Acceptable vì list ngắn (<200 record cho POC)
- **Lựa chọn 2 — Cột phụ chuẩn hóa**:
  ```prisma
  model Unit {
    name        String
    nameSortKey String  // pre-computed: lowercase + remove diacritics
  }
  ```
  Dùng `lib/utils.ts` helper:
  ```typescript
  export function vietnameseSortKey(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  ```
  Generate khi create/update, sort theo `nameSortKey`.
- **POC chọn lựa chọn 1** (đủ nhanh, ít phức tạp).

**Warning signs:**
- List user / đơn vị sort sai thứ tự
- Báo cáo Excel xuất ra dòng đầu là "Đại Việt..." không phải "An Phú..."

**Phase to address:** **M1** (sort các danh mục), **M2** (list đề án — sort theo tên).

---

## 7. HIGH Pitfalls — Mock Data Quality

### Pitfall 7.1: Tên/dữ liệu mock fake-looking (severity: HIGH, stage: Execution + Demo)

**What goes wrong:**
Tên đề án "Đề án test 1", "Đề án ABC", chủ nhiệm "Nguyễn Văn A", "Trần Thị B" → audience nhìn phát biết là demo dập từ template, mất sức thuyết phục.

**Why it happens:**
- Faker library output kiểu Tây.
- Lười nghĩ tên thực tế.

**How to avoid:**
- **Dùng tên đơn vị THẬT trong ngành** (CLAUDE.md đã list):
  - Hiệp hội Da giày - Túi xách Việt Nam (LEFASO)
  - Hiệp hội Dệt May Việt Nam (VITAS)
  - Tập đoàn Dệt May Việt Nam (VINATEX)
  - Hiệp hội Cà phê - Ca cao Việt Nam (VICOFA)
  - Hiệp hội Chế biến và Xuất khẩu Thủy sản Việt Nam (VASEP)
  - Hiệp hội Lương thực Việt Nam (VFA)
  - Hiệp hội Gỗ và Lâm sản Việt Nam (VIFOREST)
  - Tổng Công ty May 10 — CTCP
  - Phòng Thương mại và Công nghiệp Việt Nam (VCCI)
- **Tên đề án realistic**:
  - "Tham gia Hội chợ Vietnam Expo USA 2026 tại Los Angeles"
  - "Tổ chức Đoàn giao dịch xúc tiến xuất khẩu cà phê sang thị trường Trung Đông quý III/2026"
  - "Hội nghị quốc tế Ngành dệt may Việt Nam — Cơ hội hậu CPTPP"
  - "Triển lãm Quốc tế Da giày & Túi xách Việt Nam (IFLE Vietnam) 2026"
  - "Tuyên truyền xuất khẩu nông sản sang thị trường EU theo Hiệp định EVFTA"
- **Tên người chủ nhiệm**: dùng tên đầy đủ + chức danh — "TS. Lê Tiến Trường — Chủ tịch HĐQT VINATEX", "Bà Phan Thị Thanh Xuân — Phó Chủ tịch kiêm Tổng Thư ký LEFASO" (có thể tham khảo public profile thực).
- **Email đơn vị**: `lefaso.org.vn`, `vitas.org.vn` — khớp domain thật.

**Warning signs:**
- Tên có số sequential ("Đề án 1", "Đề án 2")
- Tất cả họ là "Nguyễn Văn"
- Email `test@example.com`

**Phase to address:** **M7** (audit seed data), set convention từ **M2**.

---

### Pitfall 7.2: Timestamp đồng đều / "phẳng" (severity: MEDIUM, stage: Demo)

**What goes wrong:**
Timeline đề án mọi event "tạo lúc 2026-04-30 10:00:00" → trông như import bulk → mất cảm giác "đang được dùng".

**Why it happens:**
- Seed dùng `new Date()` cho mọi record.

**How to avoid:**
- **Phân tán timestamp realistic**:
  ```typescript
  function randomBusinessHour(daysAgo: number): Date {
    const day = daysAgo - Math.floor(Math.random() * 3); // ±3 ngày
    const hour = 8 + Math.floor(Math.random() * 9); // 8h-17h
    const minute = Math.floor(Math.random() * 60);
    const d = new Date();
    d.setDate(d.getDate() - day);
    d.setHours(hour, minute, Math.floor(Math.random() * 60));
    return d;
  }
  ```
- **Chuỗi sự kiện logic**: tạo đề án (T-30 ngày) → submit (T-25) → kiểm tra (T-20) → trả bổ sung (T-18) → nộp lại (T-15) → hợp lệ (T-12) → thẩm định (T-7) → phê duyệt (T-3).
- **Tránh giờ chẵn**: 10:00 → 10:23, 14:47, etc.
- **Tránh ngày cuối tuần** (Việt Nam ít làm Chủ Nhật).

**Warning signs:**
- Activity log toàn `00:00:00`
- Mọi đề án `createdAt = updatedAt`

**Phase to address:** **M7** (mock data quality).

---

### Pitfall 7.3: Seed không cover hết trạng thái / cảnh báo (severity: HIGH, stage: Demo)

**What goes wrong:**
Demo flow tốt nhưng trên dashboard không có cảnh báo nào trigger → demo "Hệ thống có cảnh báo SLA" mà không hiện được cảnh báo nào.

**Why it happens:**
- Seed chỉ tạo data happy path.
- Không có "demo data scenario" plan.

**How to avoid:**
- **Mock data scenario list** — bắt buộc seed phải tạo ít nhất:
  - 2 đề án đang ở mỗi trạng thái (DRAFT, SUBMITTED, UNDER_REVIEW, NEED_SUPPLEMENT, VALID, EVALUATING, APPROVED, REJECTED, CONTRACTED, IN_PROGRESS, COMPLETED, LIQUIDATED)
  - 1 đề án quốc tế chưa liên hệ thương vụ, còn 28 ngày → cảnh báo 30 ngày
  - 1 đề án đã phê duyệt 55 ngày, chưa ký HĐ → cảnh báo 60 ngày
  - 1 đề án có hoạt động kết thúc 12 ngày trước, chưa nộp báo cáo → cảnh báo 15 ngày
  - 1 đề án 2 năm (parentProjectId)
  - 1 đề án có điều chỉnh "trọng yếu" đang chờ thẩm định lại
  - 1 đề án có điều chỉnh "không trọng yếu" đã được BQL duyệt
  - 1 chu kỳ năm trước (COMPLETED) — cho dashboard có lịch sử so sánh
  - 1 hội đồng thẩm định đang active với 5 thành viên
  - Mỗi thành viên hội đồng đã chấm 50% đề án (để demo "đang chấm")
- **File `prisma/seed.ts` chia helper module** theo scenario:
  ```typescript
  await seedUsers();
  await seedCatalogs();
  await seedProgramCycles({ current: Y, history: [Y-1, Y-2] });
  await seedHostUnits();
  await seedProjects(); // bao phủ mọi status + SLA scenario
  await seedCouncils();
  await seedScores();
  await seedContracts();
  await seedActivityLogs();
  ```

**Warning signs:**
- Dashboard hiển thị "0 cảnh báo" trên mọi widget
- Một số trạng thái đề án không có ví dụ nào

**Phase to address:** **M7** (seed scenario audit), set convention từ **M2.3**.

---

### Pitfall 7.4: Demo data tự mâu thuẫn (severity: HIGH, stage: Demo)

**What goes wrong:**
- Đề án trạng thái `APPROVED` nhưng `ProgramCycle` của nó vẫn `DRAFT` → bug logic
- Hợp đồng số 12/HĐ-XTTM/2026 nhưng đề án `cycleYear=2025`
- Tổng dự toán đề án 5 tỷ nhưng "Phần kinh phí Nhà nước hỗ trợ" 6 tỷ — phi logic

**Why it happens:**
- Seed tạo từng entity độc lập, không ràng buộc cross-entity.
- Random generator không respect business rules.

**How to avoid:**
- **Seed builder pattern** với invariant check:
  ```typescript
  async function createApprovedProject(opts: { unit: Unit; cycle: ProgramCycle }) {
    // INVARIANT: chu kỳ phải đã EVALUATING / APPROVED / COMPLETED
    if (!['EVALUATING', 'APPROVED', 'COMPLETED'].includes(opts.cycle.status)) {
      throw new Error(`Cannot create approved project in cycle status ${opts.cycle.status}`);
    }
    // INVARIANT: budget logic
    const totalBudget = randomBetween(2_000_000_000, 10_000_000_000);
    const stateBudget = Math.floor(totalBudget * 0.7); // tối đa 70%
    const selfBudget = totalBudget - stateBudget;
    // ...
  }
  ```
- **Validator cuối seed**: sau khi seed xong, chạy 1 hàm validate cross-entity invariants:
  ```typescript
  await validateSeedConsistency(); // throw nếu sai
  ```

**Warning signs:**
- Demo gặp đề án `APPROVED` mà nhấn vào không thấy quyết định
- Số liệu dashboard không cộng đúng

**Phase to address:** **M7** (validate seed).

---

## 8. Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| 8 tài khoản hardcoded trong seed | Demo nhanh, không cần SSO | Không thể scale tới hàng trăm user thực | **Acceptable cho POC** — đã chốt out of scope |
| Mock email/SMS | Không cần SMTP/Twilio | Không gửi thật | **Acceptable** — đã chốt |
| RBAC matrix hardcoded fallback | Đỡ build full engine | Khó thêm role động | **Acceptable cho POC** |
| Dùng `any` cho FormData | Code nhanh hơn | Mất type safety | **Never** — luôn có Zod schema |
| Skip validation server-side, chỉ Zod client | Nhanh hơn | Bug khi user bypass | **Never** — server action phải re-validate |
| Hardcode label tiếng Việt rải rác trong components | Code nhanh hơn `t('...')` | Sửa wording phải search 50 file | **Acceptable cho POC** (không cần i18n thật) — nhưng nên gom vào `lib/labels.ts` |
| File upload lưu vào local FS | Đơn giản, không cần S3 | Không scale, mất file khi redeploy | **Acceptable cho POC** — file mẫu trong `public/mock-files/` |
| 1 SQLite file db | Zero config | Không multi-user thực | **Acceptable cho POC** — đã chốt |
| Skip error boundary trên route nội bộ | Code nhanh hơn | Crash 1 component → cả page trắng | **Never** — luôn có `error.tsx` cho mỗi route group |
| PDF generate browser-side (jsPDF) | Đơn giản hơn | Freeze main thread cho file lớn | Acceptable cho file <5 trang |
| Hardcode "Cục XTTM" vào template | Đỡ build "danh mục đơn vị" sớm | Sai khi multi-tenant | **Acceptable** — POC chỉ 1 đơn vị tổ chức là Cục XTTM |

---

## 9. Integration Gotchas (POC scope)

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| NextAuth Credentials | Quên hash password trong seed | bcrypt hash 8-10 round trong seed.ts |
| NextAuth session callback | Không trả role/unitId vào session | Custom callbacks `jwt` và `session` để inject |
| Prisma + Next.js 15 hot reload | Tạo nhiều PrismaClient instances | Singleton pattern `lib/prisma.ts` |
| TanStack Query + Server Components | Cố hydrate query trên RSC | Server fetch trực tiếp trong Server Component, TanStack chỉ ở Client Component |
| date-fns/locale/vi import | Import default thay vì named | `import { vi } from 'date-fns/locale'` |
| Next.js 15 cookies() | Đọc cookies trong Server Component không async | `await cookies()` (Next 15 thay đổi API) |
| Recharts + SSR | Hydration mismatch do canvas dimension | Wrap trong `dynamic(() => import('...'), { ssr: false })` |
| Sonner toast + Server Action | Toast không hiện sau redirect | Dùng `redirect` flag hoặc `useEffect` + `useFormState` |

---

## 10. Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Render PDF font base64 mỗi lần | Lag 2-3s mỗi click "Xuất PDF" | Embed font 1 lần, cache | Demo có nhiều PDF |
| TanStack Table chưa virtualize >500 rows | Scroll lag | Dùng `@tanstack/react-virtual` | Seed >500 đề án (POC không tới) |
| Server Action không stream | UI đứng khi action mất 2s | Optimistic UI + skeleton | Bất kỳ action nào |
| Recharts re-render mỗi tick | Chart flicker | useMemo data, memo component | Dashboard có nhiều chart |
| Prisma N+1 query | API mất 5s cho list 50 items | Dùng `include` / `select` đầy đủ | List view có nested data |
| Image không optimize | Page load chậm trên wifi yếu | `next/image` + WebP | Demo có nhiều ảnh |
| Bundle size lớn | First load >5MB | Dynamic import cho route nặng (PDF, charts) | Mọi route đều import jsPDF |

---

## 11. Security Mistakes (relevant to POC scope)

POC không cần ATBM cấp độ 3, nhưng vẫn cần avoid những lỗi cơ bản kẻo demo bị soi:

| Mistake | Risk | Prevention |
|---|---|---|
| Hardcode password plaintext trong seed | Audience xem code thấy ngại | bcrypt hash, password trong CLAUDE.md (đã làm đúng) |
| Server action không check session | User1 sửa data của User2 | Mọi server action: `const session = await auth(); if (!session) throw` |
| Không check role authorization | Đơn vị chủ trì xem được tất cả đề án | Check `session.user.unitId === project.unitId` cho route nội bộ |
| File upload không check MIME | Upload `.exe` → demo lỗi | Whitelist `.pdf, .doc, .docx, .xlsx, .png, .jpg`; check magic bytes |
| Không sanitize user input render HTML | XSS qua tên đề án có `<script>` | React tự escape (default safe), tránh `dangerouslySetInnerHTML` |
| File size limit không set | Upload 1GB freeze server | `bodySizeLimit: '20mb'` trong next.config |
| Console log secrets | DevTools lộ token | `process.env.NODE_ENV === 'production'` strip console.log |
| Audit log không log action quan trọng | Demo "có audit log" nhưng không có entry nào liên quan | Hook tất cả mutation server actions vào `auditLog.create` |

---

## 12. UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| Confirm dialog "OK/Cancel" mặc định | Trông tạm bợ | shadcn `<AlertDialog>` với title VN rõ ràng + nút "Hủy" / "Xác nhận xóa đề án" |
| Toast `"Saved!"` | Thấy fake | "Đã lưu nháp đề án vào lúc 14:32" — concrete + có thời gian |
| Empty validation error "Required" | Không action được | "Vui lòng nhập tên đề án" + scroll-to + focus field |
| Loading spinner toàn trang | Trông giống legacy | Skeleton matching layout |
| Action button không có icon | Trông flat | Lucide icons consistent (Check, Upload, FileText, etc.) |
| Sidebar không highlight active route | User không biết đang ở đâu | Active state với background `bg-primary/10` + border-left |
| Breadcrumb không có | Multi-level navigation lạc | shadcn breadcrumb mọi page sub-route |
| Modal đóng khi click outside (mất data) | Form dài mất data → user nổi giận | Disable click-outside cho modal có form, chỉ đóng bằng nút "Hủy" |
| Date picker tiếng Anh ("Mon/Tue/Wed") | Không nhất quán | Pass `locale={vi}` cho `<Calendar>` shadcn |
| Disabled state không rõ | User click không hiểu sao không work | Tooltip giải thích "Không thể tạo đề án — chu kỳ chưa OPEN" |

---

## 13. "Looks Done But Isn't" Checklist

Bắt buộc verify trước khi tick "done" mỗi phase:

- [ ] **Multi-step form đề án**: bấm "Trở lại" có giữ data không? Refresh giữa chừng có lưu nháp?
- [ ] **Upload file**: file >5MB có throw lỗi rõ? File `.exe` có bị reject?
- [ ] **PDF xuất**: tiếng Việt đầy đủ dấu? Layout chuẩn công văn? Có watermark "BẢN MẪU"?
- [ ] **Sort/Filter list**: Sort tên có đúng thứ tự tiếng Việt? Filter "Trạng thái" có lưu URL state để share link?
- [ ] **Empty state**: mọi route mới (chưa có data) có illustration + CTA?
- [ ] **Loading state**: mọi async action có skeleton? Không có spinner toàn trang?
- [ ] **Error state**: throw error trong server action có hiện toast Việt rõ ràng?
- [ ] **Confirmation dialog**: mọi action xóa/hủy/nộp có xác nhận?
- [ ] **Mobile breakpoint**: 768px không vỡ layout (sidebar collapse)?
- [ ] **Permission**: login vai trò sai có thấy menu không thuộc quyền? (Phải KHÔNG)
- [ ] **Cảnh báo SLA**: mọi rule SLA (30 ngày ngoại giao, 60 ngày HĐ, 15 ngày báo cáo) có ít nhất 1 đề án trigger trong seed?
- [ ] **Notification inbox**: mọi role có ít nhất 3 thông báo trong inbox khi login?
- [ ] **Dashboard**: mọi widget có data hoặc empty state đẹp?
- [ ] **Audit log**: action quan trọng (tạo đề án, phê duyệt, ký HĐ) có entry trong audit?
- [ ] **State machine**: thử transition không hợp lệ (vd phê duyệt khi chưa thẩm định) → reject với lỗi rõ?
- [ ] **Console**: production build, navigate khắp nơi → 0 warning / 0 error?
- [ ] **Network**: 0 request 404 (favicon, font, image)?
- [ ] **Demo dry-run**: chạy hero flow end-to-end trên máy demo trong 30 phút, không lỗi?

---

## 14. Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Tiếng Việt vỡ trong PDF | LOW | Fix font embed, regenerate PDF — 1-2h |
| Sai thuật ngữ ("dự án" → "đề án") | LOW | Search & replace + audit `lib/constants.ts` — 30 phút |
| Date format sai | LOW | Replace `toLocaleDateString` → `formatDate` helper — 1h |
| State machine cho transition sai | MEDIUM | Refactor server actions, có thể cần migrate dữ liệu seed — 1 ngày |
| Quên `parentProjectId` cho đề án 2 năm | HIGH | Refactor schema, migrate, fix UI hiển thị — 2 ngày |
| Hardcoded date trong seed | LOW | Đổi sang relative date helper — 2h |
| Build full RBAC engine | HIGH | Cắt scope, simplify về 2D matrix — 1-2 ngày refactor |
| Hydration mismatch | MEDIUM | Identify culprit (date/random/locale), wrap suppressHydration hoặc client-only — 4h |
| Empty dashboard widget | LOW | Seed thêm scenario data — 1h |
| Demo console error | MEDIUM | Identify từng warning, fix root cause — 2-4h |
| File upload >5MB lỗi | LOW | Config bodySizeLimit, redeploy — 15 phút |
| PDF freeze browser | MEDIUM | Move to server-side render hoặc pre-generate static — 4h |

---

## 15. Pitfall-to-Phase Mapping

| Pitfall | Severity | Prevention Phase | Verification |
|---|---|---|---|
| 1.1 Diacritics PDF vỡ | CRITICAL | M0 (chốt PDF lib + font) | Smoke test: xuất PDF với chuỗi đầy đủ dấu |
| 1.2 Sai thuật ngữ chuyên ngành | CRITICAL | M0 (terminology dict) + M2/M3 | Audit label so với `_extracted_quytrinh.txt` |
| 1.3 Date/currency format sai | CRITICAL | M0 (helpers) | Code search: `toLocaleDateString` không có locale |
| 1.4 Honorific sai | HIGH | M1 (template email) | Review template với reviewer Việt |
| 1.5 Layout công văn sai chuẩn | HIGH | M3 (xuất quyết định) | So với mẫu PDF công văn thật |
| 1.6 Form label không khớp biểu mẫu | HIGH | M2.3 (form khai báo) | Map từng field với `Mau bieu/` |
| 2.1 Hardcoded date stale | CRITICAL | M2 (seed convention) | Demo dry-run T-1 ngày |
| 2.2 Demo broken upload/role switch | CRITICAL | M0 (config) + M7 (dry-run) | Live dry-run trên máy demo |
| 2.3 Empty states trống trải | HIGH | M0 (component) + M7 (audit) | Click mọi route, screenshot |
| 2.4 Console errors lộ điểm yếu | HIGH | M7 (audit) | Production build console clean |
| 2.5 Performance jank | MEDIUM | M7 (local demo) | Demo offline, không qua network |
| 3.1 Over-engineer RBAC | HIGH | M1 (lock scope) | Code review: permission check ≤5 dòng |
| 3.2 Email/SMS thật | HIGH | M1 (mock pattern) | `package.json` không có nodemailer/twilio |
| 3.3 E-signature thật | HIGH | M3 (mock visual) | Code review |
| 3.4 Audit log immutable | MEDIUM | M1 (basic log) | Schema review |
| 3.5 Mobile over-invest | MEDIUM | M0 (responsive baseline) | Time tracking |
| 4.1 State machine sai transition | CRITICAL | M0 (spec) + M2-M3 | Table-driven test |
| 4.2 Quên parentProjectId | CRITICAL | M0 (schema) | Schema review trước M2 |
| 4.3 Gating ProgramCycle không enforce | CRITICAL | M2.1 (gate) + M2.3 | Test: tạo đề án khi cycle DRAFT → reject |
| 4.4 "Trọng yếu" sai (Điều 13) | HIGH | M4 (điều chỉnh đề án) | Review với reference NĐ 28 |
| 4.5 Trộn kiểm tra/thẩm định | HIGH | M2.4 + M3 (spec rõ) | Spec review trước build |
| 4.6 Quên cảnh báo 30 ngày ngoại giao | HIGH | M6 (dashboard) | Seed có 1 case trigger |
| 5.1 Server action encoding | MEDIUM | M0 (smoke) | Test với input tiếng Việt |
| 5.2 Hydration date mismatch | HIGH | M0 (formatters convention) + M7 | Production build console clean |
| 5.3 shadcn Form + RHF gotcha | MEDIUM | M0 (form pattern) + M2.3 | Form pattern reference test |
| 5.4 TanStack Table sort sai VN | MEDIUM | M1 (sortingFn) | Sort cột tên: A→Đ |
| 5.5 PDF memory leak | MEDIUM | M3, M5 (server-side render) | Demo PDF nhiều file |
| 6.1 Prisma enum SQLite version | MEDIUM | M0 (lock version) | `npx prisma migrate dev` không lỗi |
| 6.2 Migration drift | MEDIUM | M0 (db:reset script) | CI step trước demo |
| 6.3 SQLite collation tiếng Việt | MEDIUM | M1 (client sort) | Sort danh mục đúng A→Đ |
| 7.1 Mock data fake-looking | HIGH | M2 (convention) + M7 (audit) | Review tên đơn vị/đề án |
| 7.2 Timestamp đồng đều | MEDIUM | M7 (audit) | Activity log nhìn realistic |
| 7.3 Seed không cover trạng thái | HIGH | M2.3 + M7 | Checklist scenario |
| 7.4 Demo data tự mâu thuẫn | HIGH | M7 (validator) | Run validateSeedConsistency() |

---

## 16. Sources

**Verified:**
- File `_extracted_quytrinh.txt` (HIGH — nguồn nghiệp vụ chính, 27 bước + 190 chức năng + ghi chú thiết kế)
- File `PROJECT.md` + `CLAUDE.md` (HIGH — đặc tả scope POC, đã chốt với user)
- [Prisma SQLite enum support v6.2+](https://www.prisma.io/docs/orm/overview/databases/sqlite) (HIGH — Prisma official doc, xác nhận enum được polyfill cho SQLite từ 6.2)
- [Next.js Hydration Errors guide](https://nextjs.org/docs/messages/react-hydration-error) (HIGH — Next.js official)
- [jsPDF Unicode/Diacritics support](https://github.com/parallax/jsPDF/issues/2093) (MEDIUM — GitHub issue, cần custom font embed)
- [SQLite Collation limitations](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/collation) (HIGH — Microsoft docs, NOCASE chỉ ASCII)
- [date-fns hydration mismatch](https://medium.com/@sfcofc/displaying-dates-and-times-in-next-js-72889231577b) (MEDIUM — community pattern verified)
- Nghị định 28/2018/NĐ-CP — [HoaTieu](https://hoatieu.vn/phap-luat/nghi-dinh-28-2018-nd-cp-4386), [Sở Tư pháp Đắk Lắk](https://sotuphap.daklak.gov.vn/nghi-dinh-so-28-2018-nd-cp-quy-dinh-chung-doi-voi-chuong-trinh-cap-quoc-gia-ve-xuc-tien-thuong-mai-4582.html) (HIGH — văn bản pháp lý gốc)
- Nghị định 81/2018/NĐ-CP về xúc tiến thương mại — [VBPL Bộ Công Thương](https://vbpl.vn/bocongthuong/Pages/vbpq-toanvan.aspx?ItemID=129582&dvid=218) (HIGH)
- Nghị định 128/2024/NĐ-CP sửa đổi NĐ 81/2018 — [VPCP](https://vanban.chinhphu.vn/?pageid=27160&docid=211405) (HIGH)

**Unverified (training data only — flagged LOW):**
- Cụ thể wording các Điều khoản trong NĐ 28 (đặc biệt phân loại "trọng yếu" — phải verify với file PDF gốc của NĐ trước M4)
- Tên đầy đủ + chức danh thực của các chủ tịch hiệp hội (cần update lại từ public site khi seed)

---

*Pitfalls research for: XTTMQG POC — Bộ Công Thương / Cục XTTM*
*Researched: 2026-04-30*
*Reviewer: Mọi pitfall trên đây đều có warning sign và prevention cụ thể. Khi triển khai phase tương ứng, MỞ LẠI file này và đối chiếu checklist trước khi tick "done".*
