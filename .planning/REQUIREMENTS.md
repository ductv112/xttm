# Requirements: Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại (XTTMQG)

**Defined:** 2026-04-30
**Core Value:** Demo end-to-end mượt và đẹp luồng "Vòng đời đề án" (M2-M3): từ Ban quản lý khởi tạo Chu kỳ Chương trình → Đơn vị chủ trì khai báo & nộp đề án → Tiếp nhận & kiểm tra → Hội đồng thẩm định chấm điểm → Ban quản lý lập tờ trình & nhập quyết định phê duyệt.

## v1 Requirements

### Hạ tầng & Auth (AUTH) — Phase M0

- [x] **AUTH-01**: Người dùng đăng nhập bằng username + mật khẩu, được redirect về trang chủ phù hợp với vai trò
- [x] **AUTH-02**: Hệ thống cung cấp 8 tài khoản hardcoded với mật khẩu bcrypt cho 7 vai trò (admin, banql, chuyenvien, hoidong, donvi1, donvi2, taichinh, lanhdao)
- [x] **AUTH-03**: Người dùng đăng xuất hủy session và quay về trang đăng nhập
- [x] **AUTH-04**: Session JWT giữ trạng thái đăng nhập qua refresh trình duyệt
- [x] **AUTH-05**: Trang đăng nhập có button "Đăng nhập SSO" (placeholder, hiển thị toast "Tính năng giai đoạn 2")
- [x] **AUTH-06**: Layout shell có sidebar (menu render động theo vai trò), topbar (tên user + vai trò + đơn vị + notification bell + dropdown đăng xuất), breadcrumb tiếng Việt
- [x] **AUTH-07**: Theme system với light mode mặc định, locale `vi-VN` toàn cục cho date-fns / Intl
- [x] **AUTH-08**: Trang 404 và 500 tiếng Việt, không lộ stack trace

### Quản trị Người dùng (USER) — Phase M1

- [ ] **USER-01**: Admin xem danh sách người dùng với filter (vai trò, đơn vị, trạng thái), sort, pagination, search theo tên/email
- [ ] **USER-02**: Admin tạo người dùng mới (họ tên, email, username, mật khẩu, vai trò, đơn vị, trạng thái)
- [ ] **USER-03**: Admin chỉnh sửa thông tin người dùng (trừ username)
- [ ] **USER-04**: Admin khóa/mở khóa tài khoản với confirmation dialog
- [ ] **USER-05**: Admin gán/đổi vai trò cho người dùng
- [ ] **USER-06**: Admin reset mật khẩu người dùng (sinh mật khẩu tạm hiển thị 1 lần)
- [ ] **USER-07**: Admin xuất danh sách người dùng ra Excel/CSV

### Vai trò & Phân quyền (ROLE) — Phase M1

- [ ] **ROLE-01**: Admin xem danh sách vai trò (7 vai trò seed sẵn) và mô tả mỗi vai trò
- [ ] **ROLE-02**: Admin tạo nhóm quyền mới (custom role) với tên + mô tả
- [ ] **ROLE-03**: Admin chỉnh sửa nhóm quyền
- [ ] **ROLE-04**: Admin xem ma trận phân quyền — grid vai trò × phân hệ × hành động (Xem/Thêm/Sửa/Xóa/Phê duyệt) với checkbox tick/untick
- [ ] **ROLE-05**: Admin gán/bỏ quyền chức năng cho nhóm quyền với optimistic UI + audit log entry
- [ ] **ROLE-06**: Sidebar và action button render động theo permission của user hiện tại
- [ ] **ROLE-07**: Server action authoritative permission check — UI guard chỉ là layer 2

### Danh mục Hệ thống (CAT) — Phase M1

- [x] **CAT-01**: CRUD danh mục Loại đề án (Triển lãm xuất khẩu / Hội nghị quốc tế / Hội chợ trong nước / Đoàn giao thương ra / Đoàn giao thương vào / Thông tin TM tuyên truyền xuất khẩu / Tuyên truyền trong nước / Đào tạo)
- [x] **CAT-02**: CRUD danh mục Ngành hàng (20 ngành — dệt may, da giày, gỗ, thủy sản, nông sản, cà phê, cao su, gạo, thép, điện tử, ...)
- [x] **CAT-03**: CRUD danh mục Thị trường (mã thị trường, tên VN/EN, khu vực)
- [x] **CAT-04**: CRUD danh mục Loại hình XTTM
- [x] **CAT-05**: CRUD danh mục Quốc gia (mã ISO, tên VN, khu vực, có thương vụ?)
- [x] **CAT-06**: CRUD danh mục Đơn vị (Cục XTTM, hiệp hội, doanh nghiệp...)
- [x] **CAT-07**: CRUD danh mục Tiêu chí chấm điểm (sơ bộ + thẩm định) với trọng số, mô tả, áp dụng cho loại đề án nào
- [x] **CAT-08**: CRUD danh mục Mẫu văn bản (công văn mời, tờ trình, quyết định, hợp đồng, biên bản nghiệm thu, thanh lý) với placeholder variable interpolation

### Cấu hình Hệ thống (CONFIG) — Phase M1

- [ ] **CONFIG-01**: Admin cấu hình tham số cảnh báo SLA (60 ngày HĐ / 30 ngày thương vụ / 15 ngày báo cáo / hạn 30/5)
- [ ] **CONFIG-02**: Admin cấu hình mẫu email/SMS template với honorific Việt (Kính gửi Quý đơn vị / Quý ông / Quý bà) — UI-only, không gửi thật

### Audit Log (LOG) — Phase M1

- [x] **LOG-01**: Mọi server action mutation ghi audit log (user, action, entity, timestamp, IP, before/after diff JSON)
- [x] **LOG-02**: Admin tra cứu audit log với filter (user, entity, action, khoảng thời gian)
- [x] **LOG-03**: Admin xuất audit log ra CSV phục vụ thanh tra/kiểm tra

### Chu kỳ Chương trình XTTM (CYCLE) — Phase M2.1 — HERO ENTITY

- [ ] **CYCLE-01**: Ban quản lý CT XTTM tạo chu kỳ chương trình mới với multi-step wizard 5 bước (Thông tin chung / Mốc thời gian / Cấu hình tiêu chí / Đơn vị mời / Xem lại)
- [ ] **CYCLE-02**: Ràng buộc unique 1 chu kỳ / năm — form validation chặn tạo trùng năm
- [ ] **CYCLE-03**: Cấu hình mốc thời gian: ngày mở cổng, hạn nộp (mặc định 30/5), hạn nộp bổ sung, ngày bắt đầu/kết thúc thẩm định, hạn phê duyệt
- [ ] **CYCLE-04**: Cấu hình ngân sách dự kiến + tiêu chí chấm điểm sơ bộ + tiêu chí thẩm định + mẫu công văn + mẫu email + danh sách đơn vị mời
- [ ] **CYCLE-05**: State machine 7 trạng thái (DRAFT / READY / OPEN_REGISTRATION / CLOSED_REGISTRATION / EVALUATING / APPROVED / COMPLETED) với transition table + guard functions
- [ ] **CYCLE-06**: Visual state machine diagram trên trang chi tiết hiển thị tiến trình hiện tại
- [ ] **CYCLE-07**: Upload bản scan công văn ban hành (PDF) với số công văn, ngày ký, người ký
- [ ] **CYCLE-08**: Action "Mở cổng nhận đăng ký" chuyển READY → OPEN_REGISTRATION (yêu cầu đã upload công văn)
- [ ] **CYCLE-09**: Action "Đóng cổng" chuyển OPEN_REGISTRATION → CLOSED_REGISTRATION
- [ ] **CYCLE-10**: Action "Mở lại để gia hạn" chuyển CLOSED_REGISTRATION → OPEN_REGISTRATION (nhập lý do + ngày hạn mới, ghi audit log)
- [ ] **CYCLE-11**: Action "Chuyển sang thẩm định" chuyển CLOSED_REGISTRATION → EVALUATING
- [ ] **CYCLE-12**: Cho phép chỉnh sửa cấu hình kỳ ngay cả khi đang OPEN_REGISTRATION (ghi audit log + tự động gửi thông báo cho đơn vị nếu thay đổi mốc/tiêu chí)
- [ ] **CYCLE-13**: Composer email mời đăng ký bằng Tiptap rich text với template variable + preview + gửi hàng loạt cho danh sách đơn vị (mock dispatch lưu DB + inbox)
- [ ] **CYCLE-14**: Trang chi tiết chu kỳ với 6 tabs (Tổng quan / Cấu hình kỳ / Công văn / Đơn vị mời + thông báo / Đề án đăng ký / Nhật ký)
- [ ] **CYCLE-15**: Trang danh sách chu kỳ dạng card view các năm với status badge + tiến độ + thống kê (số đề án, kinh phí đăng ký)

### Hồ sơ Đơn vị Chủ trì (ORG) — Phase M2.2

- [ ] **ORG-01**: Đơn vị chủ trì tạo hồ sơ tổ chức (tên, mã số thuế, địa chỉ, người đại diện, loại hình, lĩnh vực hoạt động)
- [ ] **ORG-02**: Đơn vị chủ trì cập nhật hồ sơ tổ chức
- [ ] **ORG-03**: Đơn vị chủ trì upload hồ sơ pháp lý (Giấy ĐKKD, điều lệ, ...) với file PDF
- [ ] **ORG-04**: Đơn vị chủ trì cập nhật năng lực (thành tích, kinh nghiệm tổ chức XTTM, đề án đã thực hiện)
- [ ] **ORG-05**: Đơn vị chủ trì quản lý đầu mối liên hệ (CRUD: chủ tịch, chủ nhiệm, điều phối viên với chức danh + email + SĐT)
- [ ] **ORG-06**: Đơn vị chủ trì gửi hồ sơ tổ chức để xác nhận với confirmation dialog
- [ ] **ORG-07**: Đơn vị chủ trì theo dõi trạng thái xác nhận hồ sơ (DRAFT / SUBMITTED / APPROVED / REJECTED) với ghi chú xử lý
- [ ] **ORG-08**: Ban quản lý CT XTTM phê duyệt/từ chối hồ sơ đơn vị với lý do

### Khai báo & Nộp Đề án (PROJ) — Phase M2.3 — HERO

- [ ] **PROJ-01**: Đơn vị chủ trì xem cổng tiếp nhận với banner "Đợt mời đề xuất [năm] đang mở — hạn [date]" hoặc "Hiện chưa có đợt mời nào đang mở" (gating bởi `ProgramCycle.status = OPEN_REGISTRATION`)
- [ ] **PROJ-02**: Đơn vị chủ trì xem chi tiết đợt mời (điều kiện, tiêu chí, biểu mẫu, thời hạn) và tải biểu mẫu
- [ ] **PROJ-03**: Đơn vị chủ trì tạo đề án mới (yêu cầu hồ sơ tổ chức APPROVED + chu kỳ OPEN_REGISTRATION)
- [ ] **PROJ-04**: Multi-step form 6 bước (Thông tin chung → Mục tiêu, nội dung, kế hoạch → Dự toán kinh phí → Chủ nhiệm đề án → Tài liệu đính kèm → Xem lại & nộp) với progress indicator
- [ ] **PROJ-05**: Form sử dụng RHF 1 instance + Zustand persist step + Zod schema/step + autosave debounce 2s
- [ ] **PROJ-06**: Step "Thông tin chung": tên đề án, loại đề án, ngành hàng (multi), thị trường (multi), quốc gia (multi), thời gian dự kiến (date range hoặc quý cho đoàn nước ngoài)
- [ ] **PROJ-07**: Step "Mục tiêu, nội dung, kế hoạch": mục tiêu, mô tả nội dung, kế hoạch tiến độ chi tiết (rich text)
- [ ] **PROJ-08**: Step "Dự toán kinh phí": bảng chi tiết hạng mục (mã, tên, đơn vị, số lượng, đơn giá, thành tiền) + tổng + nguồn (Nhà nước/Đối ứng đơn vị)
- [ ] **PROJ-09**: Step "Chủ nhiệm đề án": chọn từ danh sách đầu mối của đơn vị, hiển thị thông tin
- [ ] **PROJ-10**: Step "Tài liệu đính kèm": upload nhiều file (kế hoạch chi tiết, hồ sơ năng lực, ...) với progress + preview
- [ ] **PROJ-11**: Step "Xem lại & nộp": readonly summary toàn bộ đề án + checkbox cam đoan
- [ ] **PROJ-12**: Đơn vị chủ trì lưu nháp đề án bất kỳ lúc nào (auto-save + manual save)
- [ ] **PROJ-13**: Đơn vị chủ trì sao chép đề án từ đề án cũ (prefill toàn bộ data, sửa năm + chỉnh)
- [ ] **PROJ-14**: Đơn vị chủ trì nộp đề án — server action validate đầy đủ + ghi nhận thời điểm nộp + chuyển trạng thái SUBMITTED + tăng version
- [ ] **PROJ-15**: Đơn vị chủ trì rút hồ sơ trước khi được tiếp nhận (chỉ khi status = SUBMITTED, chưa được phân công)
- [ ] **PROJ-16**: Đơn vị chủ trì in/xuất PDF hồ sơ đề án (header Bộ CT, Quốc hiệu, font Be Vietnam Pro, dấu mộc placeholder, watermark "BẢN MẪU")
- [ ] **PROJ-17**: Đề án 2 năm: toggle "Đề án 2 năm" → tự động tạo 2 records cho 2 năm liên tiếp với parentProjectId link
- [ ] **PROJ-18**: Đề án 2 năm hiển thị badge "Tiếp nối từ [tên đề án năm trước]" và link điều hướng
- [ ] **PROJ-19**: Đơn vị chủ trì theo dõi trạng thái xử lý đề án (timeline visual: SUBMITTED → ASSIGNED → IN_REVIEW → SUPPLEMENT_REQUIRED → RESUBMITTED → VALID → EVALUATING → APPROVED → ...)
- [ ] **PROJ-20**: Đơn vị chủ trì nhận thông báo yêu cầu bổ sung hồ sơ + xem nội dung yêu cầu
- [ ] **PROJ-21**: Đơn vị chủ trì chỉnh sửa hồ sơ theo yêu cầu bổ sung và nộp lại với version increment
- [ ] **PROJ-22**: Đơn vị chủ trì xem lịch sử các lần bổ sung (ProjectVersion snapshot)

### Tiếp nhận & Kiểm tra hồ sơ (INTAKE) — Phase M2.4

- [ ] **INTAKE-01**: Ban quản lý CT XTTM xem danh sách hồ sơ đề án mới nộp với filter (đơn vị, loại đề án, ngày nộp, trạng thái)
- [ ] **INTAKE-02**: Ban quản lý tiếp nhận hồ sơ (chuyển từ SUBMITTED → ASSIGNED)
- [ ] **INTAKE-03**: Lãnh đạo Ban quản lý phân công chuyên viên kiểm tra (drag-drop hoặc bulk-assign theo loại đề án)
- [ ] **INTAKE-04**: Lãnh đạo thu hồi hồ sơ đã phân công về hàng đợi
- [ ] **INTAKE-05**: Lãnh đạo tái phân công cho chuyên viên khác
- [ ] **INTAKE-06**: Chuyên viên xem danh sách hồ sơ được giao
- [ ] **INTAKE-07**: Chuyên viên xem chi tiết thành phần hồ sơ với checklist (✓/✗/N/A + ghi chú từng mục)
- [ ] **INTAKE-08**: Chuyên viên nhập kết quả kiểm tra (nhận xét/kết luận sơ bộ)
- [ ] **INTAKE-09**: Chuyên viên trả hồ sơ yêu cầu bổ sung (nhập nội dung cần bổ sung → composer email → gửi)
- [ ] **INTAKE-10**: Chuyên viên xác nhận hồ sơ hợp lệ (chuyển → VALID)
- [ ] **INTAKE-11**: Chuyên viên chấm điểm sơ bộ theo bộ tiêu chí của chu kỳ
- [ ] **INTAKE-12**: Ban quản lý tổng hợp kết quả sơ bộ (sắp xếp danh sách)
- [ ] **INTAKE-13**: Ban quản lý chuyển hồ sơ sang hội đồng thẩm định (bulk action)

### Hội đồng Thẩm định (COUNCIL) — Phase M3 — HERO

- [ ] **COUNCIL-01**: Ban quản lý tạo hội đồng thẩm định cho kỳ (tên, kỳ, ngày họp, ghi chú)
- [ ] **COUNCIL-02**: Ban quản lý thêm thành viên hội đồng (chọn user vai trò Hội đồng) với chức danh trong hội đồng (Chủ tịch / Phó / Ủy viên / Thư ký)
- [ ] **COUNCIL-03**: Ban quản lý phân công đề án cho hội đồng (assign nhiều đề án → 1 hội đồng)
- [ ] **COUNCIL-04**: Hệ thống cấp quyền truy cập hồ sơ cho thành viên được phân công
- [ ] **COUNCIL-05**: Ban quản lý mở/khóa phiên chấm điểm
- [ ] **COUNCIL-06**: Thành viên hội đồng xem danh sách đề án được phân công
- [ ] **COUNCIL-07**: Thành viên hội đồng xem chi tiết hồ sơ đề án + tải tài liệu đính kèm
- [ ] **COUNCIL-08**: Thành viên hội đồng chấm điểm với side-by-side panel (rubric trọng số trái + nội dung hồ sơ phải)
- [ ] **COUNCIL-09**: Phiếu chấm điểm có conflict-of-interest checkbox (thành viên đánh dấu nếu có xung đột lợi ích)
- [ ] **COUNCIL-10**: Thành viên nhập nhận xét thẩm định / kết luận
- [ ] **COUNCIL-11**: Thành viên lưu nháp phiếu chấm
- [ ] **COUNCIL-12**: Thành viên nộp chính thức phiếu chấm (khóa phiếu cá nhân)
- [ ] **COUNCIL-13**: Hệ thống tự động tổng hợp & tính điểm trung bình theo trọng số (real-time qua TanStack Query polling 5s)
- [ ] **COUNCIL-14**: Ban quản lý xuất báo cáo thẩm định (PDF chuẩn công văn)
- [ ] **COUNCIL-15**: Ban quản lý xác nhận kết quả thẩm định (khóa danh sách)
- [ ] **COUNCIL-16**: Lãnh đạo Ban quản lý có quyền mở lại kết quả theo thẩm quyền (audit log)

### Phê duyệt (APPROVE) — Phase M3 — HERO

- [ ] **APPROVE-01**: Ban quản lý lập danh sách đề án trình duyệt từ kết quả thẩm định
- [ ] **APPROVE-02**: Ban quản lý lập tờ trình từ template với nội dung tự động điền + chỉnh sửa được
- [ ] **APPROVE-03**: Ban quản lý xuất tờ trình PDF (font Be Vietnam Pro, layout chuẩn công văn nhà nước với Quốc hiệu, "Nơi nhận", "Lưu: VT")
- [ ] **APPROVE-04**: Ban quản lý nhập quyết định phê duyệt (số quyết định, ngày ký, người ký, danh sách đề án + kinh phí được duyệt)
- [ ] **APPROVE-05**: Hệ thống cảnh báo nếu kinh phí phê duyệt cao hơn kinh phí đăng ký (tooltip + warning icon)
- [ ] **APPROVE-06**: Ban quản lý xuất quyết định phê duyệt PDF (chuẩn công văn)
- [ ] **APPROVE-07**: Ban quản lý gửi thông báo kết quả cho đơn vị chủ trì (composer email với template, cho phép sửa nội dung)
- [ ] **APPROVE-08**: Đơn vị chủ trì nhận thông báo kết quả phê duyệt và xem chi tiết quyết định

### Quản lý Hợp đồng (CONTRACT) — Phase M4

- [ ] **CONTRACT-01**: Ban quản lý sinh hợp đồng từ đề án đã phê duyệt với auto-generate số HĐ format "XTTM/YYYY/NNN"
- [ ] **CONTRACT-02**: Ban quản lý chỉnh sửa thông tin hợp đồng theo bản ký thực tế (điều khoản, số liệu)
- [ ] **CONTRACT-03**: Ban quản lý upload bản scan hợp đồng đã ký
- [ ] **CONTRACT-04**: Ban quản lý theo dõi trạng thái hợp đồng (DRAFT / SIGNED / IN_PROGRESS / COMPLETED / LIQUIDATED)
- [ ] **CONTRACT-05**: Tra cứu danh sách hợp đồng với filter (năm, đơn vị, trạng thái, khoảng kinh phí)
- [ ] **CONTRACT-06**: Hệ thống cảnh báo chậm ký hợp đồng (60 ngày sau quyết định phê duyệt) — gửi notification + email
- [ ] **CONTRACT-07**: Tổng hợp danh sách hợp đồng quá hạn ký với drill-down

### Triển khai Đề án (IMPL) — Phase M4

- [ ] **IMPL-01**: Đơn vị chủ trì khai báo kế hoạch triển khai chi tiết sau khi ký HĐ (mục tiêu, nội dung, hoạt động chính)
- [ ] **IMPL-02**: Đơn vị chủ trì khai báo các mốc công việc (timeline với due date)
- [ ] **IMPL-03**: Đơn vị chủ trì khai báo nhân sự thực hiện
- [ ] **IMPL-04**: Đơn vị chủ trì khai báo lịch trình thực hiện (thời gian, địa điểm)
- [ ] **IMPL-05**: Đơn vị chủ trì cập nhật trạng thái triển khai (% hoàn thành, ghi chú)
- [ ] **IMPL-06**: Đơn vị chủ trì cập nhật kết quả từng hạng mục
- [ ] **IMPL-07**: Đơn vị chủ trì đính kèm minh chứng thực hiện (ảnh, tài liệu, chứng từ)
- [ ] **IMPL-08**: Ban quản lý theo dõi tiến độ tổng thể (% theo mốc, simple horizontal timeline)
- [ ] **IMPL-09**: Hệ thống cảnh báo chậm tiến độ khi tới hạn mốc chưa hoàn thành
- [ ] **IMPL-10**: Hệ thống gửi cảnh báo liên hệ thương vụ/đại sứ quán 30 ngày trước sự kiện quốc tế
- [ ] **IMPL-11**: Đơn vị chủ trì xác nhận đã liên hệ thương vụ với thông tin liên hệ
- [ ] **IMPL-12**: Ban quản lý tổng hợp đề án quốc tế chưa hoàn thành nghĩa vụ ngoại giao

### Điều chỉnh Đề án (AMEND) — Phase M4

- [ ] **AMEND-01**: Đơn vị chủ trì tạo đề nghị điều chỉnh đề án (chọn loại điều chỉnh: thời gian / địa điểm / tên đơn vị / tên đề án / mục tiêu / nội dung / dự toán / thị trường)
- [ ] **AMEND-02**: Hệ thống tự suy luận `is_critical` theo Điều 13 NĐ 28 (thay đổi nhỏ vs trọng yếu) và route đúng workflow
- [ ] **AMEND-03**: Ban quản lý kiểm tra thông tin đề án điều chỉnh
- [ ] **AMEND-04**: Thay đổi nhỏ → Ban quản lý phê duyệt nội bộ → ban hành quyết định điều chỉnh
- [ ] **AMEND-05**: Thay đổi trọng yếu → chuyển hồ sơ về quy trình thẩm định lại
- [ ] **AMEND-06**: Side-by-side diff view phiên bản cũ vs mới (highlight thay đổi)
- [ ] **AMEND-07**: Ban quản lý xuất quyết định điều chỉnh PDF

### Báo cáo Kết quả (REPORT) — Phase M5

- [ ] **REPORT-01**: Đơn vị chủ trì tạo báo cáo kết quả thực hiện sau khi kết thúc hoạt động
- [ ] **REPORT-02**: Đơn vị chủ trì khai báo chỉ tiêu kết quả (định lượng + định tính theo form chuẩn)
- [ ] **REPORT-03**: Đơn vị chủ trì upload tài liệu, hình ảnh, bằng chứng, danh sách doanh nghiệp tham gia
- [ ] **REPORT-04**: Đơn vị chủ trì gửi báo cáo (chuyển → SUBMITTED)
- [ ] **REPORT-05**: Ban quản lý xem xét, có thể trả lại báo cáo yêu cầu chỉnh sửa
- [ ] **REPORT-06**: Đơn vị chủ trì chỉnh sửa và nộp lại báo cáo
- [ ] **REPORT-07**: Hệ thống cảnh báo hạn nộp báo cáo (15 ngày sau hoạt động)

### Nghiệm thu & Thanh lý (ACCEPT) — Phase M5

- [ ] **ACCEPT-01**: Đơn vị chủ trì hoặc Ban quản lý tạo hồ sơ nghiệm thu khi đến giai đoạn
- [ ] **ACCEPT-02**: Hệ thống sinh biên bản nghiệm thu theo mẫu (PDF, ký bên ngoài hệ thống)
- [ ] **ACCEPT-03**: Ban quản lý tải về / in biên bản nghiệm thu
- [ ] **ACCEPT-04**: Ban quản lý cập nhật kết quả nghiệm thu (đạt/không đạt + ghi chú)
- [ ] **ACCEPT-05**: Tài chính/Ban quản lý tạo hồ sơ thanh lý hợp đồng (sau nghiệm thu)
- [ ] **ACCEPT-06**: Hệ thống cập nhật trạng thái đề án CLOSED khi hoàn tất thanh lý

### Tài chính (FIN) — Phase M5

- [ ] **FIN-01**: Tài chính/Ban quản lý tạo hồ sơ tạm ứng từ hợp đồng có hiệu lực
- [ ] **FIN-02**: Tài chính/Ban quản lý tạo hồ sơ thanh toán
- [ ] **FIN-03**: Tài chính/Ban quản lý tạo hồ sơ quyết toán cuối kỳ đề án
- [ ] **FIN-04**: Tài chính cập nhật trạng thái xử lý hồ sơ tài chính (DRAFT / SUBMITTED / APPROVED / DISBURSED / SETTLED)

### Dashboard & Thống kê (DASH) — Phase M6

- [ ] **DASH-01**: Lãnh đạo/Ban quản lý xem dashboard tổng quan chương trình theo từng năm với cards (số đề án, kinh phí đăng ký/duyệt/HĐ/giải ngân, số đơn vị tham gia)
- [ ] **DASH-02**: Widget cảnh báo sai lệch ngân sách (số phê duyệt > đăng ký, số HĐ > phê duyệt) với drill-down
- [ ] **DASH-03**: Widget chậm ký hợp đồng (60 ngày) với danh sách + drill-down
- [ ] **DASH-04**: Widget vi phạm hạn báo cáo (15 ngày) với danh sách + drill-down
- [ ] **DASH-05**: Widget đề án quốc tế chưa liên hệ thương vụ (30 ngày) với danh sách + drill-down
- [ ] **DASH-06**: SLA countdown widgets với màu sắc theo mức độ (đỏ/cam/vàng/xanh)
- [ ] **DASH-07**: Drill-down từ widget → danh sách filtered → record detail (3 click chain)
- [ ] **DASH-08**: Thống kê số lượng đề án theo năm (chart)
- [ ] **DASH-09**: Thống kê theo loại đề án + theo đơn vị chủ trì
- [ ] **DASH-10**: Thống kê kinh phí đăng ký / phê duyệt / hợp đồng / giải ngân (multi-series chart)
- [ ] **DASH-11**: Xuất Excel/PDF báo cáo dashboard
- [ ] **DASH-12**: Import báo cáo từ biểu mẫu ngoài hệ thống (upload Excel → map → preview → save)

### Thông báo & Cảnh báo (ALERT) — Phase M6

- [ ] **ALERT-01**: Hệ thống gửi thông báo khi có hồ sơ mới nộp (cho cán bộ phụ trách)
- [ ] **ALERT-02**: Hệ thống gửi thông báo khi phân công xử lý
- [ ] **ALERT-03**: Hệ thống gửi thông báo yêu cầu bổ sung hồ sơ
- [ ] **ALERT-04**: Hệ thống gửi thông báo kết quả phê duyệt
- [ ] **ALERT-05**: Hệ thống gửi cảnh báo SLA (60 ngày HĐ / 30 ngày thương vụ / 15 ngày báo cáo / hạn 30/5)
- [ ] **ALERT-06**: Inbox thông báo trong app (topbar bell với badge counter)
- [ ] **ALERT-07**: Trang lịch sử thông báo cá nhân với filter (loại, đã đọc/chưa, khoảng thời gian)
- [ ] **ALERT-08**: Notification mock dispatch — lưu DB, hiển thị inbox, KHÔNG gửi thật ra ngoài

### Polish & Demo Prep (POLISH) — Phase M7

- [ ] **POLISH-01**: Mock data đầy đủ (10-15 records/loại) cover mọi trạng thái + mọi cảnh báo SLA
- [ ] **POLISH-02**: Tên đơn vị thật (VITAS, VINATEX, LEFASO, VICOFA, VASEP, VFA, VIFOREST, VCCI, May 10) với địa chỉ + người đại diện realistic
- [ ] **POLISH-03**: Tên chủ nhiệm có chức danh (TS./PGS./CN./KS.) realistic
- [ ] **POLISH-04**: Tên đề án hợp lý (ví dụ: "Hội chợ Vietnam Expo 2026 — Quảng bá hàng Việt tại Trung Đông")
- [ ] **POLISH-05**: Validator script cuối seed kiểm tra cross-entity invariants (mọi đề án phải thuộc 1 chu kỳ, mọi HĐ phải có quyết định...)
- [ ] **POLISH-06**: Pre-demo console hygiene: production build, 0 warning/error/404, không hydration mismatch
- [ ] **POLISH-07**: Animation transitions polish (Framer Motion cho route change, dialog, drawer)
- [ ] **POLISH-08**: Empty states có illustration + CTA
- [ ] **POLISH-09**: Loading states dùng skeleton, không spinner
- [ ] **POLISH-10**: Demo script khớp "FLOW DEMO CHUẨN.docx" với note cho mỗi bước
- [ ] **POLISH-11**: Role-switch dev button (Cmd+K command palette) chuyển vai trò trong < 2 giây
- [ ] **POLISH-12**: README hướng dẫn chạy demo (npm install → db:reset → dev → đăng nhập tài khoản nào cho flow nào)
- [ ] **POLISH-13**: Demo dry-run trên máy demo + projector + slow wifi

## v2 Requirements

Deferred — sẽ build sau khi POC sign full project và bước vào giai đoạn 2 (production).

### Tích hợp Hệ thống (INTEG)

- **INTEG-01**: SSO với cổng Bộ Công Thương (OAuth2 / SAML)
- **INTEG-02**: Tích hợp chữ ký số (USB token / VNPT-CA / FPT-CA)
- **INTEG-03**: Tích hợp email gateway thật (SMTP/SendGrid)
- **INTEG-04**: Tích hợp SMS gateway thật (Brand SMS Viettel/VinaPhone)
- **INTEG-05**: Tích hợp TABMIS / Kho bạc Nhà nước cho hồ sơ tài chính
- **INTEG-06**: Tích hợp API gateway của Cục với hệ thống nội bộ Bộ
- **INTEG-07**: Mobile app riêng (React Native) cho đơn vị chủ trì khai báo nhanh

### Bảo mật & Compliance (SEC)

- **SEC-01**: An toàn thông tin cấp độ 3 (theo Nghị định 85/2016)
- **SEC-02**: Immutable audit log với hash chain
- **SEC-03**: Encrypt tài liệu nhạy cảm at-rest
- **SEC-04**: 2FA/MFA cho tài khoản admin/lãnh đạo
- **SEC-05**: Quét virus tệp upload tự động

### Mở rộng Nghiệp vụ (EXT)

- **EXT-01**: Real-time collaboration trên đề án (Y.js)
- **EXT-02**: AI gợi ý mục tiêu/nội dung đề án dựa trên đề án cũ
- **EXT-03**: Phân tích chỉ số hiệu quả XTTM (ROI, tăng trưởng XK)
- **EXT-04**: Cổng tra cứu công khai cho doanh nghiệp xem các chương trình đang mời
- **EXT-05**: Đánh giá cuối kỳ chương trình + báo cáo Quốc hội

## Out of Scope

Explicit exclusions cho prototype POC này.

| Feature | Reason |
|---------|--------|
| SSO Bộ Công Thương thật | Phụ thuộc cổng Cục/Bộ chưa có sandbox; dùng button placeholder |
| Chữ ký số USB token / HSM | Phức tạp tích hợp, không cần thiết để chứng minh nghiệp vụ; mock bằng upload PDF scan |
| Email/SMS gateway thật | Mock trong app (lưu DB + inbox UI), không gửi thật để tránh nhiễu khi demo |
| ATTT cấp độ 3 đầy đủ | Yêu cầu hạ tầng + quy trình production thực, vượt phạm vi POC |
| Hosting trên Viettel Cloud | POC chạy local, deploy chính thức ở giai đoạn 2 |
| Nhập dữ liệu lịch sử | Chỉ seed mock data, không có data migration |
| Mobile app riêng | Web responsive 1366×768+ là đủ cho demo |
| Unit/E2E test 100% | Prototype, ưu tiên độ phủ feature hơn coverage; type/lint pass là đủ |
| Tích hợp API nội bộ Cục/Bộ | Giai đoạn 2 |
| Dark mode | Light mode chuẩn cho gov VN |
| i18n EN/JP | Chỉ tiếng Việt |
| Real-time websocket | Polling 5s đủ cho demo (TanStack Query) |
| Gantt chart phức tạp | Simple horizontal timeline đủ cho demo |
| Full-text search VN có dấu | searchKey + removeDiacritics đủ cho demo |
| Voice input / accessibility AAA | Keyboard nav + AA contrast là đủ |

## Traceability

**Coverage:**
- v1 requirements: **193**
- Mapped to phases: **193 (100%)**
- Unmapped: **0**

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 (M0 Bootstrap) | Complete |
| AUTH-02 | Phase 1 (M0 Bootstrap) | Complete |
| AUTH-03 | Phase 1 (M0 Bootstrap) | Complete |
| AUTH-04 | Phase 1 (M0 Bootstrap) | Complete |
| AUTH-05 | Phase 1 (M0 Bootstrap) | Complete |
| AUTH-06 | Phase 1 (M0 Bootstrap) | Complete |
| AUTH-07 | Phase 1 (M0 Bootstrap) | Complete |
| AUTH-08 | Phase 1 (M0 Bootstrap) | Complete |
| USER-01 | Phase 2 (M1 Quản trị) | Pending |
| USER-02 | Phase 2 (M1 Quản trị) | Pending |
| USER-03 | Phase 2 (M1 Quản trị) | Pending |
| USER-04 | Phase 2 (M1 Quản trị) | Pending |
| USER-05 | Phase 2 (M1 Quản trị) | Pending |
| USER-06 | Phase 2 (M1 Quản trị) | Pending |
| USER-07 | Phase 2 (M1 Quản trị) | Pending |
| ROLE-01 | Phase 2 (M1 Quản trị) | Pending |
| ROLE-02 | Phase 2 (M1 Quản trị) | Pending |
| ROLE-03 | Phase 2 (M1 Quản trị) | Pending |
| ROLE-04 | Phase 2 (M1 Quản trị) | Pending |
| ROLE-05 | Phase 2 (M1 Quản trị) | Pending |
| ROLE-06 | Phase 2 (M1 Quản trị) | Pending |
| ROLE-07 | Phase 2 (M1 Quản trị) | Pending |
| CAT-01 | Phase 2 (M1 Quản trị) | Complete |
| CAT-02 | Phase 2 (M1 Quản trị) | Complete |
| CAT-03 | Phase 2 (M1 Quản trị) | Complete |
| CAT-04 | Phase 2 (M1 Quản trị) | Complete |
| CAT-05 | Phase 2 (M1 Quản trị) | Complete |
| CAT-06 | Phase 2 (M1 Quản trị) | Complete |
| CAT-07 | Phase 2 (M1 Quản trị) | Complete |
| CAT-08 | Phase 2 (M1 Quản trị) | Complete |
| CONFIG-01 | Phase 2 (M1 Quản trị) | Pending |
| CONFIG-02 | Phase 2 (M1 Quản trị) | Pending |
| LOG-01 | Phase 2 (M1 Quản trị) | Complete |
| LOG-02 | Phase 2 (M1 Quản trị) | Complete |
| LOG-03 | Phase 2 (M1 Quản trị) | Complete |
| CYCLE-01 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-02 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-03 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-04 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-05 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-06 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-07 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-08 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-09 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-10 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-11 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-12 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-13 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-14 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| CYCLE-15 | Phase 3 (M2.1 Chu kỳ HERO) | Pending |
| ORG-01 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| ORG-02 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| ORG-03 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| ORG-04 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| ORG-05 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| ORG-06 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| ORG-07 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| ORG-08 | Phase 4 (M2.2 Hồ sơ Đơn vị) | Pending |
| PROJ-01 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-02 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-03 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-04 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-05 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-06 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-07 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-08 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-09 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-10 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-11 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-12 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-13 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-14 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-15 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-16 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-17 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-18 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-19 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-20 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-21 | Phase 5 (M2.3 Đề án HERO) | Pending |
| PROJ-22 | Phase 5 (M2.3 Đề án HERO) | Pending |
| INTAKE-01 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-02 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-03 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-04 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-05 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-06 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-07 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-08 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-09 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-10 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-11 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-12 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| INTAKE-13 | Phase 6 (M2.4 Tiếp nhận) | Pending |
| COUNCIL-01 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-02 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-03 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-04 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-05 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-06 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-07 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-08 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-09 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-10 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-11 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-12 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-13 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-14 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-15 | Phase 7 (M3 Thẩm định HERO) | Pending |
| COUNCIL-16 | Phase 7 (M3 Thẩm định HERO) | Pending |
| APPROVE-01 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| APPROVE-02 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| APPROVE-03 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| APPROVE-04 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| APPROVE-05 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| APPROVE-06 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| APPROVE-07 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| APPROVE-08 | Phase 7 (M3 Phê duyệt HERO) | Pending |
| CONTRACT-01 | Phase 8 (M4 Hợp đồng) | Pending |
| CONTRACT-02 | Phase 8 (M4 Hợp đồng) | Pending |
| CONTRACT-03 | Phase 8 (M4 Hợp đồng) | Pending |
| CONTRACT-04 | Phase 8 (M4 Hợp đồng) | Pending |
| CONTRACT-05 | Phase 8 (M4 Hợp đồng) | Pending |
| CONTRACT-06 | Phase 8 (M4 Hợp đồng) | Pending |
| CONTRACT-07 | Phase 8 (M4 Hợp đồng) | Pending |
| IMPL-01 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-02 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-03 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-04 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-05 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-06 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-07 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-08 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-09 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-10 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-11 | Phase 8 (M4 Triển khai) | Pending |
| IMPL-12 | Phase 8 (M4 Triển khai) | Pending |
| AMEND-01 | Phase 8 (M4 Điều chỉnh) | Pending |
| AMEND-02 | Phase 8 (M4 Điều chỉnh) | Pending |
| AMEND-03 | Phase 8 (M4 Điều chỉnh) | Pending |
| AMEND-04 | Phase 8 (M4 Điều chỉnh) | Pending |
| AMEND-05 | Phase 8 (M4 Điều chỉnh) | Pending |
| AMEND-06 | Phase 8 (M4 Điều chỉnh) | Pending |
| AMEND-07 | Phase 8 (M4 Điều chỉnh) | Pending |
| REPORT-01 | Phase 9 (M5 Báo cáo) | Pending |
| REPORT-02 | Phase 9 (M5 Báo cáo) | Pending |
| REPORT-03 | Phase 9 (M5 Báo cáo) | Pending |
| REPORT-04 | Phase 9 (M5 Báo cáo) | Pending |
| REPORT-05 | Phase 9 (M5 Báo cáo) | Pending |
| REPORT-06 | Phase 9 (M5 Báo cáo) | Pending |
| REPORT-07 | Phase 9 (M5 Báo cáo) | Pending |
| ACCEPT-01 | Phase 9 (M5 Nghiệm thu) | Pending |
| ACCEPT-02 | Phase 9 (M5 Nghiệm thu) | Pending |
| ACCEPT-03 | Phase 9 (M5 Nghiệm thu) | Pending |
| ACCEPT-04 | Phase 9 (M5 Nghiệm thu) | Pending |
| ACCEPT-05 | Phase 9 (M5 Nghiệm thu) | Pending |
| ACCEPT-06 | Phase 9 (M5 Nghiệm thu) | Pending |
| FIN-01 | Phase 9 (M5 Tài chính) | Pending |
| FIN-02 | Phase 9 (M5 Tài chính) | Pending |
| FIN-03 | Phase 9 (M5 Tài chính) | Pending |
| FIN-04 | Phase 9 (M5 Tài chính) | Pending |
| DASH-01 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-02 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-03 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-04 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-05 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-06 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-07 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-08 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-09 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-10 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-11 | Phase 10 (M6 Dashboard HERO) | Pending |
| DASH-12 | Phase 10 (M6 Dashboard HERO) | Pending |
| ALERT-01 | Phase 10 (M6 Cảnh báo) | Pending |
| ALERT-02 | Phase 10 (M6 Cảnh báo) | Pending |
| ALERT-03 | Phase 10 (M6 Cảnh báo) | Pending |
| ALERT-04 | Phase 10 (M6 Cảnh báo) | Pending |
| ALERT-05 | Phase 10 (M6 Cảnh báo) | Pending |
| ALERT-06 | Phase 10 (M6 Cảnh báo) | Pending |
| ALERT-07 | Phase 10 (M6 Cảnh báo) | Pending |
| ALERT-08 | Phase 10 (M6 Cảnh báo) | Pending |
| POLISH-01 | Phase 11 (M7 Polish) | Pending |
| POLISH-02 | Phase 11 (M7 Polish) | Pending |
| POLISH-03 | Phase 11 (M7 Polish) | Pending |
| POLISH-04 | Phase 11 (M7 Polish) | Pending |
| POLISH-05 | Phase 11 (M7 Polish) | Pending |
| POLISH-06 | Phase 11 (M7 Polish) | Pending |
| POLISH-07 | Phase 11 (M7 Polish) | Pending |
| POLISH-08 | Phase 11 (M7 Polish) | Pending |
| POLISH-09 | Phase 11 (M7 Polish) | Pending |
| POLISH-10 | Phase 11 (M7 Polish) | Pending |
| POLISH-11 | Phase 11 (M7 Polish) | Pending |
| POLISH-12 | Phase 11 (M7 Polish) | Pending |
| POLISH-13 | Phase 11 (M7 Polish) | Pending |

---
*Requirements defined: 2026-04-30*
*Last updated: 2026-04-30 — traceability filled by roadmapper agent (193/193 mapped, 0 orphaned)*
