# Nghiên cứu Tính năng — XTTMQG (Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại)

**Loại sản phẩm:** Hệ thống quản lý chương trình tài trợ/đề án nhà nước (Government program & grant management) — POC/Prototype
**Khách hàng demo:** Bộ Công Thương — Cục XTTM (lãnh đạo Cục/Bộ, Ban quản lý CT XTTM, đội CNTT, sếp DFT)
**Ngày nghiên cứu:** 2026-04-30
**Mức độ tin cậy tổng thể:** MEDIUM-HIGH (đối chiếu được với 4 sản phẩm quốc tế + 4 hệ thống Chính phủ Việt Nam)

> **Triết lý phân loại cho POC này:**
> - **Table stakes** = thiếu là khán giả "thấy hệ thống không nghiêm túc". Bắt buộc có, dù làm tối giản.
> - **Differentiator** = "wow factor" trong demo, làm lãnh đạo gật đầu, sếp DFT có cớ chốt deal.
> - **Anti-feature** = chủ động KHÔNG làm vì tốn thời gian mà không phục vụ demo.

---

## 1. Bối cảnh nghiên cứu

### 1.1. So sánh với peer quốc tế (grant management software)

| Sản phẩm | Strengths đặc trưng | Bài học cho XTTM |
|---|---|---|
| **Salesforce Grants Management** ([Trailhead Lifecycle](https://trailhead.salesforce.com/content/learn/modules/the-grantmaking-lifecycle-in-salesforce/understand-the-grantmaking-lifecycle), [Public Sector](https://www.salesforce.com/government/guided-tours/grants-management/?bc=OTH)) | Funding Program → Funding Opportunity → Application → Application Review → Funding Award. State-driven approval flow. OmniStudio guided processes (multi-step form). Customizable dashboards. | Kiến trúc dữ liệu giống XTTM: ProgramCycle → đề án → phiếu thẩm định → quyết định. Multi-step form là chuẩn, không phải sáng tạo. |
| **Fluxx Grantmaker** ([Product page](https://www.fluxx.io/products/grantmaker-fluxx-grants-management-software), [Grantelligence](https://www.fluxx.io/grantelligence-grants-management)) | Configurable workflows, automated tasks (notifications, reminders, document generation), grantee portal, 7000+ visualizations trong Grantelligence. | Cảnh báo SLA + email composer + dashboard drill-down là TABLE STAKES, không phải wow. Wow là **chiều sâu cấu hình**. |
| **SmartSimple Cloud** ([Government Grants](https://www.smartsimple.com/solution/government-grants-management-software), [Research Grants](https://www.smartsimple.com/solution/research-grants-management-software)) | Committee Manager: assign reviewers theo expertise + conflict-of-interest check, scoring rubric với weighted criteria, branching workflow theo loại program. | Hội đồng thẩm định là phân hệ phải đầu tư UI nhất — COI check là chi tiết "chuyên nghiệp" mà sản phẩm Việt Nam thường thiếu. |
| **Submittable** ([Review process](https://www.submittable.com/blog/how-to-review-grant-proposals), [Fair review guide](https://www.submittable.com/guides/building-fair-efficient-grant-review-process)) | Side-by-side reviewer panel (rubric bên cạnh hồ sơ), reviewer workload dashboard, blind review (anonymization), 3-5 numeric levels phổ biến cho rubric. | "Side-by-side rubric + hồ sơ" là pattern mạnh — nên áp dụng cho `M3 — Hội đồng chấm điểm`. |
| **Grants.gov + GrantSolutions** ([Lifecycle](https://www.grants.gov/learn-grants/grants-101/the-grant-lifecycle), [Peer Review](https://grantsgovprod.wordpress.com/2018/08/08/peer-review-panels-and-the-federal-grant-application-evaluations-process/)) | Pre-award (NOFO → applications → review → award), peer review panels, compliance reporting per 2 CFR 200. | "Peer review panel" terminology có sẵn — XTTM map sang "Hội đồng thẩm định". Cấu trúc 27 bước XTTM **chuẩn quốc tế**. |

### 1.2. So sánh với hệ thống Chính phủ Việt Nam (UX expectations)

| Hệ thống | Đặc trưng UX người dùng VN đã quen | Implication cho XTTM |
|---|---|---|
| **Cổng Dịch vụ công Quốc gia** ([dichvucong.gov.vn](https://dichvucong.gov.vn/)) | Banner đỏ-vàng-xanh dương, breadcrumb dạng "Trang chủ > Dịch vụ > ...", trạng thái hồ sơ dạng timeline đứng (đã tiếp nhận → đang xử lý → có kết quả), bảng tra cứu mã hồ sơ. | **PHẢI có**: timeline trạng thái hồ sơ hiển thị dọc, breadcrumb tiếng Việt, bảng tra cứu với cột "Mã hồ sơ"/"Trạng thái"/"Ngày nộp". |
| **EcoSys (Bộ Công Thương)** ([ecosys.gov.vn](https://ecosys.gov.vn/)) | Form khai báo nhiều bước, upload tài liệu pháp lý kèm scan, phê duyệt nhiều cấp, in/xuất PDF có dấu mộc giả lập. | **PHẢI có**: form multi-step, upload nhiều file 1 record, "in/xuất" PDF chuẩn hành chính. |
| **TABMIS (Bộ Tài chính)** | Dashboard thống kê tài chính theo năm/quý/tháng với filter sâu, drill-down từ tổng hợp xuống chi tiết khoản chi. | Dashboard XTTM **phải có drill-down** từ "Tổng kinh phí phê duyệt" xuống danh sách đề án. |
| **eTax / VNACCS (Hải quan, Thuế)** | Bảng dữ liệu lớn với filter dạng "Tìm nâng cao", trạng thái dùng badge màu rõ ràng (xanh = OK, vàng = cảnh báo, đỏ = vi phạm), nút action có icon, danh mục dropdown động (theo cây). | Sử dụng badge **3-4 màu chuẩn**: xanh dương (đang xử lý), xanh lá (hoàn thành/duyệt), vàng (cảnh báo SLA), đỏ (quá hạn/từ chối), xám (nháp). |
| **VGDS — Vietnam Government Design System** ([vgds.design](https://vgds.design/)) | Đề xuất khung design system riêng cho khu vực công VN: bảng màu nhà nước (đỏ #C8102E là chủ đạo), font UI (Be Vietnam Pro / Inter), icon system. | Có thể tham chiếu để layout sidebar/topbar có "feel" Việt Nam thay vì SaaS phương Tây thuần túy. |

**Kết luận:** XTTM cần phải có "vibe" = **EcoSys × TABMIS × Salesforce Grants Management**. Không phải Notion, không phải Linear. Người dùng là cán bộ nhà nước, họ quen với **list view dày đặc thông tin**, **tra cứu nâng cao**, **xuất file**, **timeline trạng thái**, **scan công văn upload**. Đẹp kiểu shadcn/ui là wow nhưng layout/info density phải Việt Nam-flavored.

---

## 2. Phân loại 14 module theo Table stakes / Differentiator

> Quy ước cột:
> - **Type**: TS (Table Stakes) | DIF (Differentiator) | AF (Anti-feature, không build cho POC)
> - **Complexity**: S (≤ 1 ngày), M (2-5 ngày), L (1-2 tuần)
> - **Demo Impact**: Low / Med / High (mức độ "ăn điểm" trong demo)
> - **Milestone**: theo `PROJECT.md` (M0-M7)

### 2.1. Phân hệ Quản trị Hệ thống (M0-M1)

| # | Module | Type | Complexity | Demo Impact | Milestone | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | **Auth & user management** (login đẹp, redirect theo role, CRUD user, gán đơn vị, khóa/mở, reset mật khẩu) | TS | M | Med | M0-M1 | Login screen PHẢI đẹp — đó là first impression. 8 tài khoản hardcoded đủ demo. |
| 1.1 | Mock SSO button "Đăng nhập bằng tài khoản Bộ Công Thương" (placeholder, không làm thật) | DIF | S | Med | M0 | Cost-S nhưng signal **professional** rất mạnh — lãnh đạo thấy "à có sẵn tích hợp SSO". |
| 1.2 | OTP/quên mật khẩu thật qua email/SMS gateway | AF | L | Low | — | Tốn thời gian, demo không cần. Mock UI screen "OTP đã gửi" là đủ. |
| 2 | **Role & permission matrix** (CRUD vai trò, gán quyền theo function, ma trận hiển thị grid checkbox) | TS | M | High | M1 | Ma trận grid hiển thị 7 vai trò × 190 chức năng là **screen rất ấn tượng** với IT team — chứng minh kiến trúc nghiêm túc. Render từ DB, không hardcode. |
| 3 | **Master data catalogs (8 danh mục)**: loại đề án, ngành hàng, thị trường, loại hình XTTM, quốc gia, đơn vị, tiêu chí chấm điểm, mẫu văn bản | TS | M | Low | M1 | Bắt buộc có nhưng demo lướt qua. Chiều sâu: **danh mục tiêu chí chấm điểm có trọng số** (cấu hình UI), tránh hardcode. |
| 4 | **System config**: tham số cảnh báo SLA, mẫu email/SMS template (UI-only) | TS | S | Low | M1 | Nhập số ngày cảnh báo (30/60/15) — cấu hình UI để chứng minh "không hardcode". Không cần gửi mail thật. |
| 5 | **Audit log** với filter & export (login, CRUD entity quan trọng, hành động phê duyệt) | TS | S | Med | M1 | Demo "tra cứu ai đã làm gì" — cán bộ nhà nước rất quan tâm. Ở mức cơ bản: list + filter + xuất CSV. |
| 5.1 | Immutable audit log (write-once, hash chain, blockchain-style) | AF | L | Low | — | Không có demo value. Liệt kê là "có ở phase 2". |

---

### 2.2. Phân hệ Nghiệp vụ — HERO FLOW (M2-M3)

> Đây là vùng **MỌI tradeoff phải nghiêng về depth + polish**. Nếu chỉ 1 module cần đẹp xuất sắc thì là M2-M3.

| # | Module | Type | Complexity | Demo Impact | Milestone | Ghi chú |
|---|---|---|---|---|---|---|
| 6 | **Program cycle management — Chu kỳ Chương trình XTTM năm** (HERO entity) | TS+DIF | L | **VERY HIGH** | M2.1 | Là tiền điều kiện cho mọi đề án. State machine 7 trạng thái (DRAFT→READY→OPEN_REGISTRATION→CLOSED→EVALUATING→APPROVED→COMPLETED). Unique constraint (1 chu kỳ/năm). Cấu hình mốc/ngân sách/tiêu chí/danh sách đơn vị mời. Upload công văn scan. Composer email gửi mời hàng loạt. **Gating logic**: đơn vị chỉ thấy "Tạo đề án mới" khi `OPEN_REGISTRATION`. |
| 6.1 | Visual state machine diagram (hiển thị workflow đồ hoạ, highlight bước hiện tại) | DIF | M | High | M2.1 | Wow factor cho lãnh đạo: "Hệ thống biết chu kỳ đang ở bước nào". Dùng React Flow hoặc SVG đơn giản. |
| 7 | **Organization profile (đơn vị chủ trì)** — hồ sơ pháp lý, năng lực, đầu mối liên hệ, gửi xác nhận | TS | M | Med | M2.2 | "1 hồ sơ đơn vị, nhiều đề án" — emphasize điểm này (khác Salesforce/Fluxx mặc định 1-1). |
| 8 | **Project proposal — multi-step form 6 bước** (thông tin chung → mục tiêu → dự toán → chủ nhiệm → tài liệu → xem lại & nộp) | TS | L | **VERY HIGH** | M2.3 | Form đẹp + validation chặt + lưu nháp + sao chép từ đề án cũ + xuất PDF + autosave. **Stepper progress** rõ ràng. Đây là "screen 1" của hero flow — phải đẹp xuất sắc. |
| 8.1 | "Sao chép đề án từ đề án cũ" với prefill form | DIF | S | High | M2.3 | Cán bộ nghiệp vụ thực tế rất muốn — wow factor "thực dụng". |
| 8.2 | Print-preview / xuất PDF đề án có **font tiếng Việt chuẩn** + header/footer Bộ Công Thương | DIF | M | **VERY HIGH** | M2.3 | Cán bộ nhà nước XEM PDF là đánh giá "có làm thật hay không". Phải dùng @react-pdf/renderer + font Be Vietnam Pro/Times New Roman Unicode. Header có logo Bộ Công Thương, footer có placeholder dấu mộc tròn (SVG). |
| 8.3 | E-signature thật (USB token / HSM tích hợp Vietnam CA) | AF | XL | Low | — | Mock bằng "upload bản scan đã ký" + button "Ký số" mở dialog placeholder. |
| 9 | **Reception & assignment** — BQL tiếp nhận hồ sơ, phân công chuyên viên kiểm tra, thu hồi & tái phân công, checklist kiểm tra, trả bổ sung, xác nhận hợp lệ, nộp lại với version | TS | L | High | M2.4 | Critical: **version history** khi nộp lại bổ sung — pattern UX có sẵn trong git diff (xem 2.5). |
| 9.1 | Drag-drop assign UI (kéo đề án vào tên chuyên viên) hoặc bulk-assign | DIF | S | High | M2.4 | Tạo cảm giác "modern app", không phải web 1.0. |
| 10 | **Council scoring — Hội đồng thẩm định** | TS+DIF | L | **VERY HIGH** | M3 | Tạo hội đồng, thêm thành viên, phân công đề án, phiếu chấm theo tiêu chí có trọng số, lưu nháp, nộp chính thức, nhận xét. **Side-by-side panel**: rubric trái + hồ sơ phải (theo Submittable pattern, [reference](https://www.submittable.com/blog/how-to-review-grant-proposals)). |
| 10.1 | Real-time aggregate scoring (khi mỗi thành viên chấm, BQL thấy tổng hợp cập nhật) | DIF | M | High | M3 | TanStack Query polling 5s là đủ cho demo, không cần WebSocket. |
| 10.2 | Conflict-of-interest checkbox (thành viên hội đồng đánh dấu "tôi có liên quan đến đề án này") | DIF | S | Med | M3 | Chi tiết "professional" mà sản phẩm Việt thường thiếu (theo SmartSimple pattern, [reference](https://www.smartsimple.com/solution/research-grants-management-software)). |
| 10.3 | Blind review / anonymization (ẩn tên đơn vị chủ trì khi chấm) | AF | M | Low | — | Wow trên giấy nhưng demo flow không cần. Để phase 2 nếu khách hỏi. |
| 11 | **Approval workflow** — lập danh sách trình duyệt, sinh tờ trình theo mẫu, nhập quyết định phê duyệt + kinh phí, thông báo kết quả | TS | M | **VERY HIGH** | M3 | **Tờ trình PDF** sinh tự động từ data + mẫu Word/HTML, có header/footer hành chính. Đây là "screen kết thúc" hero flow — phải có moment "in tờ trình ra đẹp". |

---

### 2.3. Phân hệ Hợp đồng & Triển khai (M4)

| # | Module | Type | Complexity | Demo Impact | Milestone | Ghi chú |
|---|---|---|---|---|---|---|
| 12 | **Contract management** — sinh hợp đồng từ đề án duyệt với số HĐ tự động (định dạng `XTTM/2026/<seq>`), upload bản scan, theo dõi trạng thái, cảnh báo chậm ký 60 ngày | TS | M | High | M4 | "Tự động sinh số HĐ" là chi tiết người dùng yêu cầu (thấy trong `_extracted_quytrinh.txt`). |
| 12.1 | Sinh hợp đồng PDF mẫu từ template (download → ký bên ngoài → upload lại) | DIF | M | High | M4 | Workflow thực tế: ký bên ngoài hệ thống, hệ thống lưu file scan. Phải làm đúng vì cán bộ "biết business". |
| 13 | **Implementation tracking** — kế hoạch triển khai chi tiết (mốc công việc, nhân sự, lịch trình), cập nhật tiến độ với % hoàn thành, đính kèm minh chứng | TS | M | Med | M4 | Gantt chart hoặc timeline view sẽ ăn điểm — không cần Gantt thật, chỉ cần dải timeline ngang đẹp. |
| 13.1 | Gantt chart timeline interactive | DIF | L | High | M4 | Tốn thời gian; thay bằng simple timeline horizontal là đủ demo. Cân nhắc kỹ. |
| 14 | **Project amendment (Điều 13 NĐ 28)** — đề nghị điều chỉnh, phân loại "thay đổi nhỏ" (BQL duyệt) vs "thay đổi trọng yếu" (thẩm định lại), so sánh phiên bản cũ-mới | TS+DIF | L | **VERY HIGH** | M4 | **Side-by-side diff view** so sánh 2 phiên bản đề án — pattern mạnh ([react-diff-view](https://github.com/otakustay/react-diff-view) hoặc tự làm với highlight). Đây là **chi tiết pháp lý** mà chỉ ai hiểu sâu nghiệp vụ XTTM mới làm được — sếp DFT sẽ hài lòng. |

---

### 2.4. Phân hệ Báo cáo, Nghiệm thu, Tài chính (M5)

| # | Module | Type | Complexity | Demo Impact | Milestone | Ghi chú |
|---|---|---|---|---|---|---|
| 15 | **Reporting (đơn vị chủ trì submits)** — tạo báo cáo kết quả: chỉ tiêu định lượng/định tính, upload minh chứng (ảnh, biên bản, danh sách DN tham gia) | TS | M | Med | M5 | Form 1-2 step, upload đa tệp, validation hạn 15 ngày sau hoạt động. |
| 16 | **Acceptance & liquidation** — hồ sơ nghiệm thu, sinh biên bản theo mẫu, tải/in, hồ sơ thanh lý hợp đồng | TS | M | Med | M5 | Sinh PDF biên bản nghiệm thu — tái dùng infrastructure PDF từ M3. |
| 17 | **Financial (tạm ứng/thanh toán/quyết toán)** | TS | S | Low | M5 | Demo nhanh: list, status workflow, không cần tích hợp ngân hàng/Kho bạc. |
| 17.1 | Tích hợp Kho bạc Nhà nước (TABMIS) cho thanh toán thật | AF | XL | Low | — | Phase 2. Mock hoàn toàn cho POC. |

---

### 2.5. Phân hệ Dashboard & Cảnh báo (M6) — chỗ "wow" cho lãnh đạo

| # | Module | Type | Complexity | Demo Impact | Milestone | Ghi chú |
|---|---|---|---|---|---|---|
| 18 | **Dashboard & alerts** — overview cards (tổng đề án, kinh phí đăng ký/duyệt/giải ngân), charts (theo loại/đơn vị/thị trường), drill-down xuống chi tiết | TS+DIF | L | **VERY HIGH** | M6 | Đây là **screen đầu tiên lãnh đạo nhìn**. Phải đẹp xuất sắc. Recharts + skeleton loading + empty state. |
| 18.1 | **SLA countdown widgets** (thẻ "Đề án sắp hết hạn báo cáo: 5 đề án — còn 3 ngày") với badge đếm ngược real-time | DIF | M | **VERY HIGH** | M6 | "Đếm ngược" tạo cảm giác hệ thống sống động. |
| 18.2 | **4 widget cảnh báo đặc thù XTTM**: sai lệch ngân sách, chậm ký HĐ, vi phạm hạn báo cáo, đề án quốc tế chưa liên hệ thương vụ | DIF | M | **VERY HIGH** | M6 | Cảnh báo "đề án quốc tế chưa liên hệ thương vụ 30 ngày" là **knowledge nghiệp vụ rất sâu** — chỉ team hiểu XTTM mới biết → wow factor mạnh nhất với nghiệp vụ. |
| 18.3 | Drill-down từ widget → list filtered → record detail | DIF | S | High | M6 | "Click vào số → ra danh sách → click record → ra chi tiết" — demo flow chuẩn. |
| 18.4 | Comparison alert: số đăng ký vs số phê duyệt vs số ký HĐ (theo yêu cầu trong `_extracted_quytrinh.txt`) | DIF | S | High | M6 | Chứng minh "đọc kỹ tài liệu nghiệp vụ" — sếp DFT thích. |
| 18.5 | Notification inbox trong app (icon chuông topbar có badge số) + lịch sử thông báo | TS | M | Med | M6 | Pattern chuẩn SaaS, người dùng VN đã quen từ Cổng DVCQG. |
| 18.6 | Real email/SMS gateway thật | AF | L | Low | — | Mock: lưu DB + hiển thị inbox. Đủ demo. |

---

### 2.6. Tổng kết phân loại 14 module gốc (theo prompt)

| Module gốc (prompt) | Phân loại tổng quát | Lý do |
|---|---|---|
| Auth & user management | TS | Cơ bản, nhưng login screen phải đẹp |
| Role/permission matrix | DIF | Ma trận grid 7×190 là ấn tượng IT |
| Master data (8 catalogs) | TS | Bắt buộc, lướt nhanh trong demo |
| **Program cycle management** | **TS+DIF (HERO)** | Là pre-condition của mọi đề án — phải đầu tư cao nhất |
| Organization profile | TS | "1 đơn vị, nhiều đề án" cần emphasize |
| **Project proposal multi-step form** | **TS+DIF (HERO)** | Screen công khai nhất — đẹp + sâu |
| Reception & assignment | TS+DIF | Drag-assign + version history là điểm sâu |
| **Council scoring** | **TS+DIF (HERO)** | Side-by-side panel pattern |
| **Approval workflow** | **TS+DIF (HERO)** | Sinh tờ trình PDF đẹp = moment "wow" |
| Contract management | TS | Auto-generate số HĐ là chi tiết nghiệp vụ |
| Implementation tracking | TS | Đủ dùng, không cần Gantt thật |
| Reporting | TS | Form đơn giản |
| Acceptance & liquidation | TS | Tái dùng PDF infrastructure |
| **Dashboard & alerts** | **TS+DIF (HERO cho lãnh đạo)** | Screen đầu tiên lãnh đạo nhìn |

---

## 3. Top 5 Demo Wow-Factor Features

Đây là 5 tính năng cụ thể sẽ làm khán giả gật đầu mạnh nhất:

### 3.1. **Realistic Vietnamese-text PDF export với seal placeholder + header Bộ Công Thương**
- **Cost:** M (3-5 ngày)
- **Impact:** VERY HIGH (lãnh đạo, BQL, IT cùng wow)
- **Mô tả:** Sinh PDF tờ trình + quyết định phê duyệt + biên bản nghiệm thu, font Be Vietnam Pro hoặc Times New Roman Unicode TCVN 6909:2001 ([reference](https://thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/ho-tro-phap-luat/tu-van-phap-luat/73939/font-unicode-tcvn-6909-2001-la-gi-bo-ma-ky-tu-unicode-theo-tieu-chuan-viet-nam-tcvn-6909-2001)). Header: quốc hiệu "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập - Tự do - Hạnh phúc". Footer: placeholder dấu mộc tròn (SVG đỏ với chữ "BỘ CÔNG THƯƠNG / CỤC XÚC TIẾN THƯƠNG MẠI" xoay tròn).
- **Tại sao wow:** PDF in ra trông như văn bản hành chính thật → khán giả nghĩ "hệ thống dùng được luôn".
- **Lib:** `@react-pdf/renderer` (chuẩn Unicode TV tốt hơn jsPDF).

### 3.2. **Multi-role role-switch demo button (top right, dropdown 8 tài khoản)**
- **Cost:** S (1 ngày)
- **Impact:** HIGH
- **Mô tả:** Nút dev-only ở top right cho phép demo presenter switch giữa 8 tài khoản không cần logout/login. Click "BQL → Hội đồng → Đơn vị chủ trì → Lãnh đạo" trong vòng 30 giây.
- **Tại sao wow:** Cho phép demo theo "FLOW DEMO CHUẨN" liên mạch — không bị gãy nhịp khi đổi vai.
- **Implementation:** NextAuth `signIn` programmatic + dropdown UI. Ẩn trong production.

### 3.3. **SLA countdown widgets trên Dashboard với 4 cảnh báo đặc thù XTTM**
- **Cost:** M (3 ngày)
- **Impact:** VERY HIGH (lãnh đạo + BQL)
- **Mô tả:** 4 cards màu sắc:
  - **Đỏ:** "X đề án quá hạn ký HĐ (>60 ngày)"
  - **Vàng:** "Y đề án sắp tới hạn báo cáo (còn Z ngày)"
  - **Cam:** "K đề án quốc tế chưa liên hệ thương vụ (30 ngày trước sự kiện)"
  - **Xanh:** "M đề án vi phạm sai lệch ngân sách"
- **Tại sao wow:** Cảnh báo "30 ngày liên hệ thương vụ" là **knowledge nghiệp vụ rất hẹp** — chỉ team đọc kỹ Nghị định 28 mới biết. Sếp DFT thấy "team mình hiểu khách hàng".

### 3.4. **Side-by-side diff view khi điều chỉnh đề án (Điều 13 NĐ 28)**
- **Cost:** L (5-7 ngày)
- **Impact:** VERY HIGH (BQL + IT team)
- **Mô tả:** Khi đơn vị chủ trì gửi đề nghị điều chỉnh, BQL mở màn so sánh 2 cột: **trái = đề án gốc**, **phải = đề án điều chỉnh**, các field thay đổi highlight vàng/xanh. Footer có toggle "Phân loại: Thay đổi nhỏ / Trọng yếu" → routing logic khác nhau.
- **Tại sao wow:** Pattern này trong sản phẩm Việt cực hiếm. Nó chứng minh **hiểu sâu Nghị định 28 Điều 13** — luật pháp lý cụ thể. Khán giả lãnh đạo Cục/Bộ sẽ thấy "đây không phải team copy-paste template SaaS".
- **Lib:** [`react-diff-view`](https://github.com/otakustay/react-diff-view) hoặc tự render với side-by-side table.

### 3.5. **Drill-down dashboard chain: card → list → record (3 click)**
- **Cost:** S (1-2 ngày, nếu list page có sẵn)
- **Impact:** HIGH
- **Mô tả:** Click card "Tổng kinh phí phê duyệt: 450 tỷ" → mở list 30 đề án đã duyệt với filter pre-applied → click 1 record → mở chi tiết đề án với timeline trạng thái + kinh phí breakdown. Toàn bộ cảm giác "fluid", có animation transition.
- **Tại sao wow:** Lãnh đạo Cục/Bộ là người duy nhất sẽ thực sự dùng dashboard. Drill-down từ tổng → chi tiết là pattern họ EXPECT từ TABMIS.

### 3.6. Bonus wow #6 — **Visual state machine cho ProgramCycle**
- **Cost:** M (3 ngày)
- **Impact:** HIGH (IT team thích nhất)
- **Mô tả:** Hiển thị 7 state node (DRAFT → READY → OPEN_REGISTRATION → ...) dạng đồ hoạ, node hiện tại highlight pulsing, click node để xem điều kiện chuyển trạng thái.
- **Lib:** React Flow (`reactflow`) hoặc SVG tự vẽ.

---

## 4. Demo Anti-Features (chủ động KHÔNG build)

Nguyên tắc: nếu một feature **TỐN HƠN 2 NGÀY mà không xuất hiện trên màn hình demo**, thì cắt.

| Anti-feature | Tại sao tránh | Demo workaround |
|---|---|---|
| **Real email/SMS gateway** (SendGrid, Twilio, Viettel SMS) | Tốn config, không gửi thật được trong môi trường demo (port chặn). | Mock: lưu vào table `Notification`, hiển thị trên trang `/thong-bao` như inbox + có nút "Xem nội dung email sẽ gửi" mở dialog với HTML preview. |
| **Real e-signature (USB token, Vietnam CA, HSM)** | Setup phức tạp, không có thiết bị demo, ROI thấp. | Button "Ký số" mở dialog placeholder "Đang kết nối với USB token..." → 2 giây → success. Upload bản scan PDF đã ký bên ngoài. |
| **SSO thật với cổng Bộ Công Thương** | Không có endpoint thật, OIDC config phức tạp. | Button "Đăng nhập SSO Bộ Công Thương" disabled với tooltip "Phase 2". |
| **Immutable audit log với hash chain** | Không có demo value (audit log thường người dùng chỉ xem 1 trang rồi bỏ qua). | Audit log table thường + filter + export CSV. |
| **Tích hợp TABMIS / Kho bạc** | Không có sandbox, không quan trọng cho POC. | Mock state machine: TẠO_HỒ_SƠ → GỬI → KHO_BẠC_DUYỆT → ĐÃ_GIẢI_NGÂN. Nút "Gửi sang Kho bạc" mock. |
| **Mobile app riêng (React Native, Flutter)** | Demo trên trình duyệt là đủ. | Web responsive (Tailwind), mobile không vỡ là đủ. |
| **Real-time collaboration (Y.js, multiple users editing)** | Phức tạp, không có demo value. | Optimistic UI + TanStack Query polling 5s khi cần "real-time feel". |
| **Full search (Elasticsearch, Algolia)** | Quá nặng cho POC. | Prisma full-text search SQLite hoặc filter tại client. |
| **Performance optimization (caching, CDN, edge runtime)** | Demo local đủ mượt. | `next dev` với Turbopack là đủ. |
| **A11y test 100% AA/AAA** | Tốn thời gian audit. | Đảm bảo keyboard nav + focus visible + contrast cơ bản. |
| **Data import lịch sử (Excel → DB migration)** | Không có data thật để import. | Mock data 10-15 records/loại trong seed. |
| **Backup/restore UI** | Không phải vấn đề POC. | Skip hoàn toàn. |
| **Dark mode** | Cán bộ nhà nước dùng light mode 100%. | Skip — chỉ light mode, theme system có sẵn nhưng không expose toggle. |
| **i18n đa ngôn ngữ (EN/VN switcher)** | Toàn bộ UI tiếng Việt. | Skip switcher, hardcode VN. |
| **Print preview ngoài PDF** (HTML print stylesheet riêng) | Tốn thời gian cho cả 2 path. | Chỉ làm PDF download — đủ. |
| **Tích hợp API gateway nội bộ Cục/Bộ** | Không có endpoint. | Skip. |

---

## 5. UX Patterns Việt Nam-flavored cần áp dụng

### 5.1. **Status badges với màu sắc chuẩn hành chính VN**

Người dùng VN đã quen từ Cổng DVCQG / eTax / VNACCS:

| Trạng thái | Màu (Tailwind) | Khi dùng |
|---|---|---|
| Nháp / Chưa nộp | `slate-500` (xám) | Đề án nháp, hồ sơ đơn vị chưa gửi |
| Đang xử lý / Đang chấm | `blue-600` (xanh dương) | Hồ sơ đang ở BQL / Hội đồng |
| Hợp lệ / Đã duyệt / Hoàn thành | `green-600` (xanh lá) | Phê duyệt thành công, nghiệm thu đạt |
| Cảnh báo / Sắp hết hạn | `amber-500` (vàng) | SLA gần đến hạn (3-7 ngày) |
| Quá hạn / Vi phạm | `red-600` (đỏ) | Quá hạn ký HĐ, quá hạn báo cáo |
| Bổ sung / Yêu cầu sửa | `orange-500` (cam) | Hồ sơ bị trả bổ sung |
| Bị từ chối / Hủy | `red-700 outline` (đỏ đậm) | Đề án bị từ chối, thanh lý |

**Anti-pattern:** Đừng dùng tím/hồng/xanh ngọc — màu này là SaaS phương Tây, cán bộ VN không quen.

### 5.2. **Timeline view dọc cho project lifecycle**

Pattern Cổng DVCQG: trên trang chi tiết đề án, render timeline DỌC bên phải:
```
●━━ Tiếp nhận hồ sơ      [10/05/2026 09:30]  by BQL Nguyễn Văn A
│
●━━ Phân công kiểm tra   [10/05/2026 14:00]  by BQL Nguyễn Văn A
│   Chuyên viên: Trần Thị B
│
●━━ Yêu cầu bổ sung      [12/05/2026 10:15]  by Trần Thị B
│   Lý do: Thiếu báo cáo tài chính 2024
│
○━━ Nộp lại bổ sung      (chờ)
```

Mỗi event có icon + actor + timestamp + collapsible detail. **Đừng dùng timeline ngang** — không quen với nghiệp vụ VN.

### 5.3. **Form multi-step với stepper Vietnamese**

```
[1] Thông tin chung  ──  [2] Mục tiêu ──  [3] Dự toán ──  [4] Chủ nhiệm ──  [5] Tài liệu ──  [6] Xem lại
   ✓ Đã hoàn thành        ◉ Đang nhập      ○ Chưa nhập       ○                ○                ○
```

Stepper PHẢI clickable nếu user đã đi qua step (cho phép quay lại sửa). Mỗi step có nút "Lưu nháp" + "Tiếp theo". Validation hiển thị error inline tiếng Việt: "Vui lòng nhập tên đề án" (không phải "Required field").

### 5.4. **List view với pattern "Tra cứu nâng cao" (eTax-style)**

- Filter bar dạng accordion "▾ Tra cứu nâng cao" expand ra grid 2-3 cột field filter
- Bên cạnh search box quick search
- Table với pagination 20/50/100 rows/page (cán bộ VN quen 100/page)
- Cột "Mã đề án" / "Tên đề án" / "Đơn vị chủ trì" / "Trạng thái" / "Ngày nộp" / "Hành động"
- Bulk action checkbox cột đầu (chọn → menu "Hành động hàng loạt: Duyệt / Trả bổ sung / Xuất Excel")
- Export Excel/PDF nút riêng góc phải

### 5.5. **Side-by-side diff (Điều 13 NĐ 28)**

```
┌──────────────────────────┬──────────────────────────┐
│   Đề án gốc (v1)         │   Đề án điều chỉnh (v2)  │
├──────────────────────────┼──────────────────────────┤
│ Tên: Hội chợ XK Vinatex  │ Tên: Hội chợ XK Vinatex  │
│ Ngân sách: 5 tỷ          │ Ngân sách: 5 tỷ          │
│ Địa điểm: Hà Nội         │ Địa điểm: TP.HCM    🟡   │  ← thay đổi
│ Thời gian: Q3/2026       │ Thời gian: Q4/2026  🟡   │  ← thay đổi
│ Chủ nhiệm: Nguyễn A      │ Chủ nhiệm: Trần B   🔴   │  ← trọng yếu
└──────────────────────────┴──────────────────────────┘

Phân loại tự động: ◉ Thay đổi trọng yếu (cần thẩm định lại)
                   ○ Thay đổi không trọng yếu (BQL phê duyệt)
```

### 5.6. **Bulk action UX**

- Checkbox cột đầu của table → khi check ≥1 row, hiển thị action bar **dính top** với count "Đã chọn 5 đề án" + buttons.
- Confirmation dialog khi action destructive: "Xác nhận trả bổ sung 5 đề án?" với list tên.
- Toast feedback "Đã gửi yêu cầu bổ sung tới 5 đơn vị chủ trì".

### 5.7. **Empty state với illustration + CTA**

Không bao giờ để table trắng trơn. Empty state phải có:
- SVG illustration đơn giản (Lucide icon lớn cũng được)
- Heading "Chưa có đề án nào trong chu kỳ này"
- Subtext "Đợi đơn vị chủ trì đăng ký hoặc gửi thông báo mời..."
- Primary button "Gửi thông báo mời đề xuất" (nếu role là BQL)

### 5.8. **Loading state với skeleton, không spinner toàn trang**

Mỗi card/row/section có skeleton riêng (gray bar pulse). Pattern shadcn/ui chuẩn.

### 5.9. **Toast notifications tiếng Việt**

Sonner toasts với 4 variants:
- ✓ Success: "Đã lưu nháp đề án" (xanh lá, 3s)
- ⚠ Warning: "Sắp hết hạn nộp đề án (còn 5 ngày)" (vàng, 5s)
- ✗ Error: "Lỗi: Không thể nộp đề án — thiếu file dự toán" (đỏ, 7s, có nút "Xem chi tiết")
- ℹ Info: "Hồ sơ đã được phân công cho chuyên viên Trần Thị B" (xanh dương, 4s)

### 5.10. **Header văn bản hành chính cho mọi screen quan trọng**

Trên đầu trang chi tiết đề án / chu kỳ chương trình, hiển thị block giả văn bản:
```
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
─────────────────
Hà Nội, ngày 30 tháng 04 năm 2026
```
Subtle, font Times New Roman italic, alignment đúng. Cán bộ VN đọc hàng ngày — sẽ tạo cảm giác "tự nhiên, đúng nghiệp vụ".

---

## 6. Feature Dependencies (cho roadmap phase ordering)

```
M0 — Bootstrap (Next.js + Prisma + shadcn/ui)
   └── M1 — Quản trị & Danh mục (User, Role, 8 catalogs, Audit log)
        └── M2.1 — Chu kỳ Chương trình (HERO entity, gating cho tất cả)
             ├── M2.2 — Hồ sơ Đơn vị chủ trì (cần ProgramCycle.OPEN)
             │    └── M2.3 — Khai báo & Nộp đề án (cần OrgProfile + OPEN cycle)
             │         ├── M2.4 — Tiếp nhận & Kiểm tra (cần đề án nộp)
             │         │    └── M3 — Hội đồng Thẩm định (cần đề án hợp lệ)
             │         │         └── M3 — Phê duyệt (cần kết quả thẩm định)
             │         │              └── M4 — Hợp đồng (cần đề án duyệt)
             │         │                   ├── M4 — Triển khai (cần HĐ ký)
             │         │                   ├── M4 — Điều chỉnh đề án (Điều 13)
             │         │                   └── M5 — Báo cáo + Nghiệm thu + Tài chính
             │         └── (path: rút hồ sơ, sao chép)
             └── M2 — Composer email mời đề xuất (cần ProgramCycle config)

M6 — Dashboard & Cảnh báo  ──> đọc data từ TẤT CẢ các module trên
M7 — Polish & Demo Prep    ──> bake tất cả lại

State machine ProgramCycle = gating logic cho TẤT CẢ entry points
   ├── OPEN_REGISTRATION  → đơn vị thấy "Tạo đề án"
   ├── CLOSED             → BQL thấy "Phân công kiểm tra"
   ├── EVALUATING         → Hội đồng thấy "Phiếu chấm"
   └── APPROVED           → BQL thấy "Tạo hợp đồng"
```

### Critical dependencies

- **ProgramCycle là tiền điều kiện của TẤT CẢ** → phải làm trước Đề án.
- **OrgProfile là tiền điều kiện của Đề án** → đơn vị phải đăng ký hồ sơ tổ chức trước khi tạo đề án.
- **PDF infrastructure (M2.3)** được tái dùng cho M3 (tờ trình), M4 (hợp đồng), M5 (biên bản nghiệm thu) → đầu tư đúng 1 lần.
- **State machine + Audit log** cần xong từ M1 để các phase sau dùng → đừng làm rời rạc.
- **Notification table** (mock email) cần xong M2 để Composer email + Dashboard alerts dùng.

---

## 7. MVP Definition cho POC

### 7.1. Launch with (M0-M3 — bắt buộc cho demo lần đầu)

- [x] **M0:** Bootstrap, layout shell, login screen, 8 tài khoản, locale VN
- [x] **M1:** User CRUD, Role matrix, 8 danh mục, Audit log cơ bản
- [x] **M2.1:** Chu kỳ Chương trình — full CRUD + state machine + composer email + visual state diagram
- [x] **M2.2:** Hồ sơ Đơn vị chủ trì — đầy đủ
- [x] **M2.3:** Multi-step form 6 bước + lưu nháp + sao chép + xuất PDF
- [x] **M2.4:** Tiếp nhận, phân công, checklist, version history
- [x] **M3:** Hội đồng thẩm định + side-by-side scoring + tổng hợp + tờ trình + quyết định + thông báo
- [x] **M6 (lite):** Dashboard với 4 widget cảnh báo + drill-down (cho lãnh đạo demo)

### 7.2. Add for full demo (M4-M5 — round 2)

- [ ] **M4:** Hợp đồng + triển khai + điều chỉnh đề án (side-by-side diff)
- [ ] **M5:** Báo cáo + nghiệm thu + tài chính
- [ ] **M6 (full):** Dashboard tất cả widget + thống kê + xuất Excel

### 7.3. Polish (M7 — trước demo chốt)

- [ ] Mock data 10-15 records/loại đầy đủ
- [ ] Empty states, loading states, error states
- [ ] Animation transitions (Framer Motion)
- [ ] Demo script khớp "FLOW DEMO CHUẨN.docx"
- [ ] Performance audit, type check, lint clean

### 7.4. Defer (KHÔNG cho POC)

- [ ] SSO thật, OTP thật, e-signature thật
- [ ] Email/SMS gateway thật
- [ ] An toàn thông tin cấp 3
- [ ] Hosting Viettel Cloud
- [ ] Mobile app
- [ ] Tích hợp TABMIS, API gateway

---

## 8. Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Demo Impact | Priority |
|---|---|---|---|---|
| Login screen đẹp + 8 tài khoản | HIGH | LOW | MED | **P1** |
| Multi-step form 6 bước (đề án) | HIGH | HIGH | VERY HIGH | **P1** |
| Chu kỳ Chương trình + state machine | HIGH | HIGH | VERY HIGH | **P1** |
| Hội đồng chấm điểm side-by-side | HIGH | HIGH | VERY HIGH | **P1** |
| Tờ trình PDF tiếng Việt + dấu mộc giả | HIGH | MED | VERY HIGH | **P1** |
| Dashboard 4 widget cảnh báo + drill-down | HIGH | HIGH | VERY HIGH | **P1** |
| Side-by-side diff điều chỉnh đề án | HIGH | HIGH | VERY HIGH | **P1** |
| Role matrix grid 7×190 | MED | MED | HIGH | **P1** |
| Visual state machine (React Flow) | MED | MED | HIGH | **P2** |
| Role-switch dev button | LOW (cho demo: HIGH) | LOW | HIGH | **P1** |
| Notification inbox + composer | MED | MED | MED | **P1** |
| Audit log filter + export | LOW | LOW | MED | **P2** |
| Sao chép đề án từ đề án cũ | MED | LOW | HIGH | **P1** |
| Drag-drop assign UI | MED | LOW | HIGH | **P2** |
| Conflict-of-interest checkbox | LOW | LOW | MED | **P2** |
| Gantt chart triển khai | MED | HIGH | MED | **P3** (thay bằng simple timeline) |
| Real email/SMS gateway | LOW (mock đủ) | HIGH | LOW | **P3** (defer) |
| E-signature thật | LOW | XL | LOW | **P3** (defer) |
| Mobile app | LOW | XL | LOW | **P3** (defer) |
| Dark mode | LOW | LOW | LOW | **P3** (skip) |

**P1 (must have for demo):** ~14 items — đây là core demo
**P2 (should have nếu thời gian cho phép):** ~5 items — wow factor bổ sung
**P3 (nice to have / defer):** ~5 items — phase 2

---

## 9. Competitor Feature Comparison Matrix

| Feature | Salesforce GM | Fluxx | SmartSimple | Submittable | **XTTM POC** |
|---|---|---|---|---|---|
| Multi-step application form | ✓ OmniStudio | ✓ Configurable | ✓ Branching | ✓ Multi-stage | ✓ 6 bước RHF + Zod |
| Reviewer panel scoring | ✓ Application Review | ✓ | ✓ Committee Manager | ✓ Side-by-side rubric | ✓ Side-by-side panel (lấy pattern Submittable) |
| Conflict-of-interest | Manual | Manual | ✓ Auto-check | ✓ COI flag | ✓ Checkbox đơn giản |
| Workflow automation | ✓ Flow | ✓ | ✓ Branching logic | ✓ Multi-stage | ✓ State machine ProgramCycle |
| Document generation (PDF) | ✓ via OmniStudio | ✓ Auto-gen | ✓ Templates | ✓ | ✓ @react-pdf/renderer + font VN |
| Dashboard / analytics | ✓ Customizable | ✓ Grantelligence (7000+ viz) | ✓ | ✓ Reviewer workload | ✓ 4 widget cảnh báo + drill-down |
| Grantee portal | ✓ Experience Cloud | ✓ Grantee portal | ✓ Self-service | ✓ Applicant portal | ✓ Đơn vị chủ trì có view riêng (role-based) |
| Multi-year programs | ✓ | ✓ | ✓ | ✓ | ✓ Đề án 2 năm = 2 records + parentProjectId |
| Amendment / change request | Manual | ✓ | ✓ | Manual | ✓ **Side-by-side diff (Điều 13 NĐ 28)** ← unique cho VN |
| E-signature | ✓ DocuSign integration | ✓ DocuSign | ✓ | ✓ | ✗ Mock (POC) |
| SLA / deadline tracking | ✓ | ✓ Reminders | ✓ | ✓ | ✓ Cảnh báo SLA tiếng Việt + countdown widget |
| Audit log | ✓ Field History | ✓ Activity log | ✓ | ✓ | ✓ Cơ bản (UI + filter + export) |
| Vietnamese-text PDF với dấu mộc | ✗ | ✗ | ✗ | ✗ | ✓ **Unique selling point** |
| Compliance với Nghị định 28 (luật VN) | ✗ | ✗ | ✗ | ✗ | ✓ **Unique selling point** |
| 27-step XTTM workflow | ✗ generic | ✗ generic | ✗ generic | ✗ generic | ✓ **Unique selling point** |

**Insight:** XTTM **không cố cạnh tranh** với Salesforce/Fluxx về độ rộng/automation/integration. **Unique selling point** = (a) hiểu sâu Nghị định 28, (b) tiếng Việt + văn bản hành chính chuẩn, (c) workflow XTTM 27 bước cụ thể. Đây là 3 thứ peer quốc tế KHÔNG thể cung cấp ngay được, và là lý do Bộ Công Thương sẽ chọn DFT thay vì mua Salesforce GM.

---

## 10. Risk Areas (cờ cảnh báo cho roadmap)

Các area dễ "nuốt" thời gian cần cờ đỏ:

1. **PDF tiếng Việt với font Unicode + layout hành chính** (M2.3 / M3 / M5)
   - Risk: Font embed sai → chữ thành □□□□. jsPDF support TV kém — phải dùng `@react-pdf/renderer` + import font file.
   - Mitigation: Spike sớm trong M2.3 (1-2 ngày prototype), validate cả tiếng Việt có dấu + bold/italic + table layout.

2. **State machine ProgramCycle với gating logic xuyên suốt** (M2.1)
   - Risk: Bug gating → đơn vị thấy nút "Tạo đề án" khi cycle CLOSED.
   - Mitigation: Trừu tượng hóa permission check thành 1 hook `useCanCreateProject()`, test mọi state.

3. **Multi-step form 6 bước với autosave + validation chặt** (M2.3)
   - Risk: RHF state phức tạp, autosave race condition.
   - Mitigation: Dùng `react-hook-form` + `zodResolver`, autosave debounce 2s, persist nháp vào DB qua server action.

4. **Side-by-side diff cho Điều 13 NĐ 28** (M4)
   - Risk: Logic phân loại "trọng yếu" vs "nhỏ" cần đúng nghiệp vụ.
   - Mitigation: Hardcode rule list theo `_extracted_quytrinh.txt` (thay đổi tên đề án/thời gian/địa điểm/đơn vị = nhỏ; ngân sách/mục tiêu/loại hình = trọng yếu).

5. **Dashboard performance với drill-down + 4 widget cảnh báo** (M6)
   - Risk: Query SQLite nhiều join → chậm.
   - Mitigation: Pre-compute alerts trong server action, cache 60s với TanStack Query.

---

## 11. Confidence Assessment

| Area | Confidence | Reasoning |
|---|---|---|
| 27-step process & 14 module list | **HIGH** | Tài liệu nguồn `_extracted_quytrinh.txt` rất chi tiết, đã có 190 chức năng cụ thể |
| Peer comparison (Salesforce/Fluxx/SmartSimple/Submittable) | **HIGH** | Cross-verified từ sources chính thức của vendor |
| Vietnamese government UX patterns | **MEDIUM-HIGH** | Inferred từ Cổng DVCQG, EcoSys, eTax (quan sát + general gov pattern) — không có style guide chính thức của Bộ Công Thương |
| VGDS (Vietnam Government Design System) | **MEDIUM** | VGDS là dự án cộng đồng, không phải chuẩn bắt buộc; có thể tham khảo |
| PDF font Unicode TCVN 6909:2001 | **HIGH** | Chuẩn quốc gia, có doc rõ |
| Knowledge nghiệp vụ XTTM (Nghị định 28 Điều 13) | **MEDIUM** | Inferred từ tài liệu nguồn — cần xác nhận với khách hàng nếu có doubt |
| Demo wow factor priority | **MEDIUM** | Dựa trên persona + best practice — chỉ validate được sau demo thật |

---

## 12. Sources

### Peer products (international)
- [Salesforce Grants Management — Grantmaking Lifecycle](https://trailhead.salesforce.com/content/learn/modules/the-grantmaking-lifecycle-in-salesforce/understand-the-grantmaking-lifecycle)
- [Salesforce Grants Management for Public Sector](https://www.salesforce.com/government/guided-tours/grants-management/?bc=OTH)
- [Fluxx Grantmaker Product](https://www.fluxx.io/products/grantmaker-fluxx-grants-management-software)
- [Fluxx Grantelligence Analytics](https://www.fluxx.io/grantelligence-grants-management)
- [SmartSimple Cloud Government Grants](https://www.smartsimple.com/solution/government-grants-management-software)
- [SmartSimple Cloud Research Grants](https://www.smartsimple.com/solution/research-grants-management-software)
- [Submittable — How to Review a Grant Proposal](https://www.submittable.com/blog/how-to-review-grant-proposals)
- [Submittable — Building a Fair Grant Review Process](https://www.submittable.com/guides/building-fair-efficient-grant-review-process)
- [Grants.gov — The Grant Lifecycle](https://www.grants.gov/learn-grants/grants-101/the-grant-lifecycle)
- [Grants.gov — Peer Review Panels](https://grantsgovprod.wordpress.com/2018/08/08/peer-review-panels-and-the-federal-grant-application-evaluations-process/)

### Vietnamese government systems & design
- [Cổng Dịch vụ công Quốc gia](https://dichvucong.gov.vn/)
- [EcoSys — Bộ Công Thương](https://ecosys.gov.vn/Homepage/DepartmentView.aspx)
- [Vietnam Government Design System (VGDS)](https://vgds.design/)
- [TCVN 6909:2001 Unicode Vietnamese Standard](https://thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/ho-tro-phap-luat/tu-van-phap-luat/73939/font-unicode-tcvn-6909-2001-la-gi-bo-ma-ky-tu-unicode-theo-tieu-chuan-viet-nam-tcvn-6909-2001)
- [Bộ TT&TT Dashboard ICT](https://mst.gov.vn/bo-tttt-gioi-thieu-he-thong-dashboard-theo-doi-va-danh-gia-cac-chi-so-phat-trien-nganh-ict-197139882.htm)

### UX patterns & libraries
- [react-diff-view (otakustay)](https://github.com/otakustay/react-diff-view)
- [Carbon Design System — Status Indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/)
- [Setproduct — Badge UI Design](https://www.setproduct.com/blog/badge-ui-design)

### Internal references
- `d:/Thaodnp/XTTM/.planning/PROJECT.md`
- `d:/Thaodnp/XTTM/CLAUDE.md`
- `d:/Thaodnp/XTTM/_extracted_quytrinh.txt`

---
*Feature research for XTTMQG (POC for Bộ Công Thương — Cục XTTM)*
*Researched: 2026-04-30 by GSD researcher (Features dimension)*
