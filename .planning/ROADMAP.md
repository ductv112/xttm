# Roadmap: Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại (XTTMQG)

## Overview

11 phase đi từ Bootstrap (M0) qua Quản trị/Danh mục (M1), trọn vẹn hero flow Vòng đời đề án (M2.1 → M2.4 + M3), Hợp đồng/Triển khai/Điều chỉnh (M4), Báo cáo/Nghiệm thu/Tài chính (M5), Dashboard & Cảnh báo cho lãnh đạo (M6), khép lại bằng Polish & Demo Prep (M7). Mọi phase có UI work (đây là prototype UI). Bốn phase HERO (3, 5, 7, 10) cần ngân sách polish cao hơn vì là điểm chốt demo. Cấu trúc 8 milestone bám sát research SUMMARY, riêng M2 được tách thành 4 sub-phase (3-6) do có 4 entity cốt lõi với state machine và phụ thuộc lẫn nhau.

## Phases

**Phase Numbering:**
- Integer phases (1-11): Planned milestone work
- Decimal phases (chưa có): Urgent insertions

- [ ] **Phase 1: M0 Bootstrap & Hạ tầng** - Next.js 15 + Tailwind v4 + shadcn/ui + Prisma/SQLite + NextAuth 8 tài khoản + Layout shell + PDF spike font Be Vietnam Pro
- [ ] **Phase 2: M1 Quản trị & Danh mục** - User CRUD + Role matrix grid (render từ DB) + 8 catalogs + System config + Audit log
- [ ] **Phase 3: M2.1 Chu kỳ Chương trình XTTM (HERO)** - Wizard 5 bước + state machine 7 trạng thái + upload công văn + composer email mời + visual state machine
- [ ] **Phase 4: M2.2 Hồ sơ Đơn vị Chủ trì** - Đăng ký tổ chức + năng lực + đầu mối liên hệ + xác nhận hồ sơ
- [ ] **Phase 5: M2.3 Khai báo & Nộp Đề án (HERO)** - Multi-step form 6 bước + autosave + sao chép đề án cũ + đề án 2 năm + xuất PDF chuẩn công văn
- [ ] **Phase 6: M2.4 Tiếp nhận & Kiểm tra hồ sơ** - BQL tiếp nhận + drag-drop phân công + checklist kiểm tra + trả bổ sung + version snapshot + chấm điểm sơ bộ
- [ ] **Phase 7: M3 Thẩm định & Phê duyệt (HERO)** - Hội đồng thẩm định + side-by-side scoring + COI checkbox + tổng hợp real-time + tờ trình PDF + quyết định phê duyệt
- [ ] **Phase 8: M4 Hợp đồng, Triển khai & Điều chỉnh** - Sinh HĐ auto số + cảnh báo 60 ngày + kế hoạch triển khai + cảnh báo thương vụ 30 ngày + điều chỉnh đề án Điều 13 NĐ 28 với side-by-side diff
- [ ] **Phase 9: M5 Báo cáo, Nghiệm thu, Tài chính** - Báo cáo kết quả + biên bản nghiệm thu PDF + thanh lý hợp đồng + tạm ứng/thanh toán/quyết toán
- [ ] **Phase 10: M6 Dashboard & Cảnh báo (HERO Lãnh đạo)** - Overview cards + 4 widget SLA + drill-down 3 click + Recharts + thống kê + inbox thông báo + xuất Excel/PDF
- [ ] **Phase 11: M7 Polish & Demo Prep** - Mock data 10-15 records/loại + tên đơn vị thật + validator cross-entity + console hygiene + animation + role-switch Cmd+K + demo dry-run

## Phase Details

### Phase 1: M0 Bootstrap & Hạ tầng
**Goal**: Người dùng đăng nhập được vào layout shell tiếng Việt với 8 tài khoản hardcoded; foundation kỹ thuật (Prisma schema, Next.js 15, shadcn/ui, PDF spike) đủ vững để mọi phase sau xây trên đó.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08
**Success Criteria** (what must be TRUE):
  1. User đăng nhập bằng `donvi1/Donvi@123` (hoặc bất kỳ tài khoản nào trong 8 tài khoản) và được redirect về trang chủ phù hợp với vai trò
  2. Sau đăng nhập user thấy layout shell có sidebar (menu render động theo role), topbar (tên + vai trò + đơn vị + bell + dropdown đăng xuất), breadcrumb tiếng Việt, locale `vi-VN`
  3. User refresh trình duyệt vẫn giữ session JWT, click "Đăng xuất" hủy session và quay về trang đăng nhập
  4. Trang login hiển thị button "Đăng nhập SSO Bộ Công Thương" placeholder, click ra toast "Tính năng giai đoạn 2"
  5. PDF spike chạy được: render Quyết định mẫu với chuỗi smoke đầy đủ dấu tiếng Việt + font Be Vietnam Pro + watermark "BẢN MẪU", không vỡ chữ
**Plans**: 6 plans
Plans:
- [x] 01-01-repo-init-PLAN.md — Bootstrap Next.js 15 + dependencies + shadcn init + lib foundation (TERMS, RBAC matrix, formatters, state machines, NextAuth types) — Wave 1
- [ ] 01-02-prisma-schema-seed-PLAN.md — Prisma schema (14 models) + db push [BLOCKING] + seed 8 accounts bcrypt + 5 organizations — Wave 2
- [ ] 01-03-nextauth-credentials-PLAN.md — NextAuth v5 split-config (edge auth.config + lib/auth Credentials) + middleware + login/logout server actions — Wave 3
- [ ] 01-04-layout-shell-PLAN.md — 18 shadcn components + AppShell/Sidebar/Topbar/Breadcrumb/UserMenu/LogoutDialog + (app)/layout — Wave 3
- [ ] 01-05-login-pages-PLAN.md — Login split 60/40 + LoginForm RHF/Zod + SSO toast + dashboard placeholder + 404/500 — Wave 4
- [ ] 01-06-pdf-spike-PLAN.md — Be Vietnam Pro static TTF + OfficialDocument template + /api/pdf/spike + /test-pdf page — Wave 2

**UI hint**: yes

### Phase 2: M1 Quản trị & Danh mục
**Goal**: Admin có đủ công cụ quản trị (người dùng, vai trò + ma trận phân quyền cấu hình bằng UI, 8 danh mục hệ thống, cấu hình SLA, audit log) để mọi entity nghiệp vụ ở các phase sau có data tham chiếu hợp lệ.
**Depends on**: Phase 1
**Requirements**: USER-01, USER-02, USER-03, USER-04, USER-05, USER-06, USER-07, ROLE-01, ROLE-02, ROLE-03, ROLE-04, ROLE-05, ROLE-06, ROLE-07, CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08, CONFIG-01, CONFIG-02, LOG-01, LOG-02, LOG-03
**Success Criteria** (what must be TRUE):
  1. Admin tạo người dùng mới (chọn vai trò + đơn vị), khóa/mở khóa, reset mật khẩu (sinh tạm hiển thị 1 lần), xuất danh sách Excel
  2. Admin xem ma trận phân quyền dạng grid 7 vai trò × phân hệ × hành động, tick/untick checkbox với optimistic UI; sidebar và action button render lại theo permission đã đổi
  3. Admin CRUD 8 danh mục (Loại đề án, Ngành hàng, Thị trường, Loại hình XTTM, Quốc gia, Đơn vị, Tiêu chí chấm điểm với trọng số, Mẫu văn bản với placeholder)
  4. Admin cấu hình tham số SLA (60 ngày HĐ / 30 ngày thương vụ / 15 ngày báo cáo / hạn 30/5) và mẫu email/SMS với honorific Việt; mọi thay đổi ghi audit log
  5. Admin tra cứu audit log với filter (user, entity, action, khoảng thời gian) và xuất CSV; mọi server action mutation đã được ghi nhận với before/after diff
**Plans**: TBD
**UI hint**: yes

### Phase 3: M2.1 Chu kỳ Chương trình XTTM (HERO)
**Goal**: Ban quản lý CT XTTM tạo và vận hành Chu kỳ chương trình năm — entity HERO làm tiền điều kiện gating cho mọi đề án con. Phase này là điểm chốt demo "khởi tạo chu kỳ" và cần ngân sách polish cao hơn (visual state machine, composer email Tiptap, gating UX).
**Depends on**: Phase 2 (cần 8 catalogs làm input cho cấu hình kỳ)
**Requirements**: CYCLE-01, CYCLE-02, CYCLE-03, CYCLE-04, CYCLE-05, CYCLE-06, CYCLE-07, CYCLE-08, CYCLE-09, CYCLE-10, CYCLE-11, CYCLE-12, CYCLE-13, CYCLE-14, CYCLE-15
**Success Criteria** (what must be TRUE):
  1. BQL tạo Chu kỳ Chương trình 2026 qua wizard 5 bước (Thông tin chung / Mốc thời gian / Cấu hình tiêu chí / Đơn vị mời / Xem lại), form chặn tạo trùng năm
  2. BQL upload bản scan công văn ban hành (PDF + số công văn + ngày ký + người ký), action "Mở cổng nhận đăng ký" chuyển READY → OPEN_REGISTRATION; đơn vị chủ trì thấy banner "Đợt mời đề xuất 2026 đang mở — hạn 30/05/2026"
  3. BQL đóng cổng (OPEN → CLOSED), gia hạn (CLOSED → OPEN với lý do + ngày hạn mới ghi audit log), chuyển sang thẩm định (CLOSED → EVALUATING) qua state machine 7 trạng thái với guard functions
  4. BQL chỉnh sửa cấu hình kỳ ngay cả khi OPEN_REGISTRATION (mốc/tiêu chí), hệ thống ghi audit log và tự động gửi thông báo cho danh sách đơn vị mời
  5. BQL soạn email mời đăng ký bằng Tiptap rich text với template variable + preview + gửi hàng loạt (mock dispatch lưu DB + inbox)
  6. Trang chi tiết hiển thị visual state machine diagram + 6 tabs (Tổng quan / Cấu hình kỳ / Công văn / Đơn vị mời + thông báo / Đề án đăng ký / Nhật ký), trang danh sách hiển thị card view các năm với status badge
**Plans**: TBD
**UI hint**: yes

### Phase 4: M2.2 Hồ sơ Đơn vị Chủ trì
**Goal**: Đơn vị chủ trì tạo và gửi xác nhận hồ sơ tổ chức (tiền điều kiện để được phép tạo đề án); BQL phê duyệt/từ chối hồ sơ với lý do.
**Depends on**: Phase 2 (cần user/role + danh mục đơn vị/lĩnh vực)
**Requirements**: ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08
**Success Criteria** (what must be TRUE):
  1. Đơn vị chủ trì (login `donvi1/Donvi@123`) tạo hồ sơ tổ chức (tên, mã số thuế, địa chỉ, người đại diện, loại hình, lĩnh vực) và cập nhật năng lực (thành tích, kinh nghiệm, đề án đã thực hiện)
  2. Đơn vị chủ trì upload hồ sơ pháp lý (Giấy ĐKKD, điều lệ) và quản lý đầu mối liên hệ (CRUD chủ tịch / chủ nhiệm / điều phối với chức danh + email + SĐT)
  3. Đơn vị chủ trì gửi hồ sơ xác nhận với confirmation dialog, theo dõi trạng thái (DRAFT / SUBMITTED / APPROVED / REJECTED) qua timeline visual
  4. BQL (login `banql/Banql@123`) phê duyệt hoặc từ chối hồ sơ đơn vị với lý do; đơn vị chủ trì nhận thông báo và thấy ghi chú xử lý
**Plans**: TBD
**UI hint**: yes

### Phase 5: M2.3 Khai báo & Nộp Đề án (HERO)
**Goal**: Đơn vị chủ trì khai báo đề án qua multi-step form 6 bước với UX cấp Vercel-grade — màn hình công khai nhất của hero flow, cần ngân sách polish cao nhất (autosave, validation chặt, sao chép đề án cũ, đề án 2 năm, xuất PDF chuẩn công văn). Đây là screen audience nhìn nhiều nhất.
**Depends on**: Phase 3 (gating bởi `ProgramCycle.OPEN_REGISTRATION`) + Phase 4 (gating bởi `OrgProfile.APPROVED`)
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, PROJ-07, PROJ-08, PROJ-09, PROJ-10, PROJ-11, PROJ-12, PROJ-13, PROJ-14, PROJ-15, PROJ-16, PROJ-17, PROJ-18, PROJ-19, PROJ-20, PROJ-21, PROJ-22
**Success Criteria** (what must be TRUE):
  1. Đơn vị chủ trì xem cổng tiếp nhận: nếu chu kỳ OPEN_REGISTRATION thấy banner "Đợt mời đề xuất 2026 đang mở — hạn 30/05/2026" với nút "Tạo đề án mới"; nếu CLOSED thấy "Hiện chưa có đợt mời nào đang mở"
  2. Đơn vị chủ trì khai báo đề án qua wizard 6 bước (Thông tin chung → Mục tiêu/nội dung/kế hoạch → Dự toán kinh phí → Chủ nhiệm → Tài liệu → Xem lại) với autosave debounce 2s, lưu nháp bất kỳ lúc nào, validation Zod chặt từng bước, stepper clickable
  3. Đơn vị chủ trì sao chép đề án từ năm cũ (prefill toàn bộ data, sửa năm + chỉnh) và toggle "Đề án 2 năm" tự động tạo 2 records liên tiếp với parentProjectId link, hiển thị badge "Tiếp nối từ [tên đề án năm trước]"
  4. Đơn vị chủ trì nộp đề án — server action validate đầy đủ + ghi nhận thời điểm nộp + chuyển trạng thái SUBMITTED + tăng version; có thể rút hồ sơ trước khi được tiếp nhận
  5. Đơn vị chủ trì in/xuất PDF hồ sơ đề án với header Bộ CT + Quốc hiệu + font Be Vietnam Pro + dấu mộc placeholder + watermark "BẢN MẪU"
  6. Đơn vị chủ trì theo dõi trạng thái xử lý qua timeline visual (SUBMITTED → ASSIGNED → IN_REVIEW → SUPPLEMENT_REQUIRED → RESUBMITTED → VALID → ...) và xem lịch sử các lần bổ sung qua ProjectVersion snapshot
**Plans**: TBD
**UI hint**: yes

### Phase 6: M2.4 Tiếp nhận & Kiểm tra hồ sơ
**Goal**: Cầu nối giữa Nộp đề án (M2.3) và Thẩm định (M3) — BQL tiếp nhận, phân công chuyên viên, chuyên viên kiểm tra checklist hành chính (≠ thẩm định chuyên môn), trả bổ sung hoặc xác nhận hợp lệ, chấm điểm sơ bộ.
**Depends on**: Phase 5 (cần đề án SUBMITTED)
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05, INTAKE-06, INTAKE-07, INTAKE-08, INTAKE-09, INTAKE-10, INTAKE-11, INTAKE-12, INTAKE-13
**Success Criteria** (what must be TRUE):
  1. BQL xem danh sách hồ sơ mới nộp với filter (đơn vị, loại đề án, ngày nộp, trạng thái), tiếp nhận hồ sơ (SUBMITTED → ASSIGNED) và phân công chuyên viên qua drag-drop hoặc bulk-assign theo loại đề án
  2. Lãnh đạo BQL thu hồi hồ sơ đã phân công về hàng đợi và tái phân công cho chuyên viên khác
  3. Chuyên viên (login `chuyenvien/Cv@123`) xem chi tiết thành phần hồ sơ với checklist (✓/✗/N/A + ghi chú từng mục), nhập kết luận sơ bộ
  4. Chuyên viên trả hồ sơ yêu cầu bổ sung (nội dung cần bổ sung → composer email → gửi); đơn vị chủ trì nhận thông báo, chỉnh sửa và nộp lại với version increment + ProjectVersion snapshot
  5. Chuyên viên xác nhận hợp lệ (chuyển → VALID) và chấm điểm sơ bộ theo bộ tiêu chí của chu kỳ; BQL tổng hợp danh sách và bulk action chuyển sang hội đồng thẩm định
**Plans**: TBD
**UI hint**: yes

### Phase 7: M3 Thẩm định & Phê duyệt (HERO)
**Goal**: Closing flow của hero — Hội đồng thẩm định chấm điểm chuyên môn theo rubric trọng số (side-by-side panel pattern Submittable), BQL tổng hợp, lập tờ trình PDF chuẩn công văn nhà nước, nhập quyết định phê duyệt và thông báo đơn vị chủ trì. Phase này có moment "in tờ trình ra đẹp" — cần ngân sách polish cao.
**Depends on**: Phase 6 (cần đề án VALID đã chấm sơ bộ)
**Requirements**: COUNCIL-01, COUNCIL-02, COUNCIL-03, COUNCIL-04, COUNCIL-05, COUNCIL-06, COUNCIL-07, COUNCIL-08, COUNCIL-09, COUNCIL-10, COUNCIL-11, COUNCIL-12, COUNCIL-13, COUNCIL-14, COUNCIL-15, COUNCIL-16, APPROVE-01, APPROVE-02, APPROVE-03, APPROVE-04, APPROVE-05, APPROVE-06, APPROVE-07, APPROVE-08
**Success Criteria** (what must be TRUE):
  1. BQL tạo hội đồng thẩm định cho kỳ (tên, ngày họp), thêm thành viên với chức danh (Chủ tịch / Phó / Ủy viên / Thư ký), phân công đề án cho hội đồng (assign nhiều đề án → 1 hội đồng), mở/khóa phiên chấm
  2. Mỗi thành viên hội đồng (login `hoidong/Hd@123`) xem danh sách đề án được phân công, mở phiếu chấm điểm với side-by-side panel (rubric trọng số trái + nội dung hồ sơ phải), tick conflict-of-interest checkbox nếu có xung đột lợi ích, lưu nháp / nộp chính thức (khóa phiếu cá nhân)
  3. Hệ thống tự động tổng hợp & tính điểm trung bình theo trọng số real-time (TanStack Query polling 5s); BQL xem xếp hạng đề án và xuất báo cáo thẩm định PDF
  4. BQL lập danh sách trình duyệt từ kết quả thẩm định, lập tờ trình từ template với nội dung tự động điền, xuất tờ trình PDF (font Be Vietnam Pro, layout chuẩn công văn nhà nước với Quốc hiệu + "Nơi nhận" + "Lưu: VT")
  5. BQL nhập quyết định phê duyệt (số quyết định, ngày ký, người ký, danh sách đề án + kinh phí), hệ thống cảnh báo nếu kinh phí phê duyệt > kinh phí đăng ký, xuất quyết định PDF chuẩn công văn
  6. BQL gửi thông báo kết quả qua composer email với template; đơn vị chủ trì (login `donvi1`) nhận thông báo và xem chi tiết quyết định phê duyệt
**Plans**: TBD
**UI hint**: yes

### Phase 8: M4 Hợp đồng, Triển khai & Điều chỉnh
**Goal**: Round 2 demo — sinh hợp đồng từ đề án phê duyệt, theo dõi triển khai với cảnh báo SLA, và điều chỉnh đề án theo Điều 13 NĐ 28 (phân loại "trọng yếu" vs "không trọng yếu" với side-by-side diff view) — chi tiết pháp lý sâu mà peer quốc tế không có.
**Depends on**: Phase 7 (cần đề án APPROVED + quyết định phê duyệt)
**Requirements**: CONTRACT-01, CONTRACT-02, CONTRACT-03, CONTRACT-04, CONTRACT-05, CONTRACT-06, CONTRACT-07, IMPL-01, IMPL-02, IMPL-03, IMPL-04, IMPL-05, IMPL-06, IMPL-07, IMPL-08, IMPL-09, IMPL-10, IMPL-11, IMPL-12, AMEND-01, AMEND-02, AMEND-03, AMEND-04, AMEND-05, AMEND-06, AMEND-07
**Success Criteria** (what must be TRUE):
  1. BQL sinh hợp đồng từ đề án đã phê duyệt với auto-generate số HĐ format `XTTM/2026/NNN`, chỉnh sửa theo bản ký thực tế, upload bản scan đã ký, theo dõi trạng thái (DRAFT / SIGNED / IN_PROGRESS / COMPLETED / LIQUIDATED); hệ thống cảnh báo chậm ký 60 ngày sau quyết định
  2. Đơn vị chủ trì khai báo kế hoạch triển khai chi tiết (mục tiêu, mốc công việc với due date, nhân sự, lịch trình), cập nhật tiến độ % hoàn thành và đính kèm minh chứng (ảnh, tài liệu, chứng từ)
  3. BQL theo dõi tiến độ tổng thể qua simple horizontal timeline; hệ thống cảnh báo chậm tiến độ khi tới hạn mốc và cảnh báo liên hệ thương vụ 30 ngày trước sự kiện quốc tế; đơn vị chủ trì xác nhận đã liên hệ thương vụ
  4. Đơn vị chủ trì tạo đề nghị điều chỉnh đề án (chọn loại điều chỉnh: thời gian/địa điểm/tên đơn vị/mục tiêu/dự toán...); hệ thống tự suy luận `is_critical` theo Điều 13 NĐ 28 và route đúng workflow (thay đổi nhỏ → BQL phê duyệt nội bộ; trọng yếu → thẩm định lại)
  5. BQL xem side-by-side diff phiên bản đề án cũ vs mới (highlight thay đổi vàng/đỏ), phê duyệt hoặc chuyển thẩm định lại, xuất quyết định điều chỉnh PDF
**Plans**: TBD
**UI hint**: yes

### Phase 9: M5 Báo cáo, Nghiệm thu, Tài chính
**Goal**: Đóng end-to-end vòng đời đề án — đơn vị chủ trì gửi báo cáo kết quả, BQL nghiệm thu sinh biên bản PDF, thanh lý hợp đồng, Tài chính xử lý tạm ứng/thanh toán/quyết toán (mock state machine, không tích hợp Kho bạc).
**Depends on**: Phase 8 (cần hợp đồng IN_PROGRESS / kế hoạch triển khai có data)
**Requirements**: REPORT-01, REPORT-02, REPORT-03, REPORT-04, REPORT-05, REPORT-06, REPORT-07, ACCEPT-01, ACCEPT-02, ACCEPT-03, ACCEPT-04, ACCEPT-05, ACCEPT-06, FIN-01, FIN-02, FIN-03, FIN-04
**Success Criteria** (what must be TRUE):
  1. Đơn vị chủ trì tạo báo cáo kết quả thực hiện sau khi kết thúc hoạt động: khai báo chỉ tiêu định lượng + định tính, upload tài liệu/hình ảnh/danh sách doanh nghiệp tham gia, gửi báo cáo (→ SUBMITTED); hệ thống cảnh báo hạn 15 ngày sau hoạt động
  2. BQL xem xét báo cáo, có thể trả lại yêu cầu chỉnh sửa với lý do; đơn vị chủ trì chỉnh và nộp lại
  3. Đơn vị chủ trì hoặc BQL tạo hồ sơ nghiệm thu, hệ thống sinh biên bản nghiệm thu PDF theo mẫu (tái dùng PDF infrastructure từ Phase 7), BQL tải về/in và cập nhật kết quả nghiệm thu (đạt/không đạt + ghi chú)
  4. Tài chính / BQL tạo hồ sơ thanh lý hợp đồng sau nghiệm thu; hệ thống cập nhật trạng thái đề án CLOSED khi hoàn tất thanh lý
  5. Tài chính (login `taichinh/Tc@123`) tạo hồ sơ tạm ứng từ HĐ có hiệu lực, hồ sơ thanh toán, hồ sơ quyết toán cuối kỳ, cập nhật trạng thái xử lý (DRAFT / SUBMITTED / APPROVED / DISBURSED / SETTLED)
**Plans**: TBD
**UI hint**: yes

### Phase 10: M6 Dashboard & Cảnh báo (HERO Lãnh đạo)
**Goal**: Screen đầu tiên lãnh đạo Cục/Bộ nhìn — overview dashboard với cards + 4 widget SLA đặc thù XTTM (60 ngày HĐ / 30 ngày thương vụ / 15 ngày báo cáo / sai lệch ngân sách) + drill-down 3 click + Recharts. Đây là wow factor mạnh nhất với lãnh đạo, cần đọc data từ tất cả phase trước (3-9).
**Depends on**: Phase 9 (cần data từ tất cả module nghiệp vụ để dashboard có nội dung)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11, DASH-12, ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05, ALERT-06, ALERT-07, ALERT-08
**Success Criteria** (what must be TRUE):
  1. Lãnh đạo (login `lanhdao/Ld@123`) xem dashboard tổng quan theo từng năm với cards (số đề án, kinh phí đăng ký/duyệt/HĐ/giải ngân, số đơn vị tham gia) và SLA countdown widgets với màu sắc (đỏ/cam/vàng/xanh)
  2. Lãnh đạo thấy 4 widget cảnh báo đặc thù XTTM với drill-down: sai lệch ngân sách, chậm ký HĐ 60 ngày, vi phạm hạn báo cáo 15 ngày, đề án quốc tế chưa liên hệ thương vụ 30 ngày
  3. Lãnh đạo drill-down từ widget → danh sách filtered → record detail trong 3 click chain với animation transition mượt
  4. Lãnh đạo xem charts thống kê (số đề án theo năm/loại/đơn vị, kinh phí đăng ký/phê duyệt/HĐ/giải ngân multi-series), xuất Excel/PDF báo cáo dashboard, import báo cáo từ biểu mẫu Excel ngoài
  5. Mọi vai trò thấy notification inbox topbar (bell với badge counter) + trang lịch sử thông báo cá nhân với filter; hệ thống dispatch mock notification khi có hồ sơ mới nộp / phân công / yêu cầu bổ sung / kết quả phê duyệt / cảnh báo SLA (lưu DB, KHÔNG gửi thật ra ngoài)
**Plans**: TBD
**UI hint**: yes

### Phase 11: M7 Polish & Demo Prep
**Goal**: Bake mọi thứ lại trước demo — mock data đầy đủ và realistic (tên đơn vị thật, tên chủ nhiệm có chức danh), validator cross-entity invariants, console hygiene 0 warning/error, animation polish, role-switch Cmd+K, demo dry-run khớp "FLOW DEMO CHUẨN.docx".
**Depends on**: Phase 10 (cần tất cả module hoàn chỉnh để audit cuối)
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08, POLISH-09, POLISH-10, POLISH-11, POLISH-12, POLISH-13
**Success Criteria** (what must be TRUE):
  1. Mock data đầy đủ 10-15 records/loại cover mọi trạng thái + mọi cảnh báo SLA (đề án 28/55/12 ngày để trigger 30/60/15-day alerts), tên đơn vị thật (VITAS, VINATEX, LEFASO, VICOFA, VASEP, VFA, VIFOREST, VCCI, May 10), tên chủ nhiệm có chức danh (TS./PGS./CN./KS.), tên đề án realistic (vd "Hội chợ Vietnam Expo 2026 — Quảng bá hàng Việt tại Trung Đông")
  2. Validator script cuối seed kiểm tra cross-entity invariants pass (mọi đề án thuộc 1 chu kỳ, mọi HĐ có quyết định, mọi báo cáo có HĐ...)
  3. Production build chạy không có console warning/error/404, không hydration mismatch, type/lint clean; mọi page có empty state với illustration + CTA, loading state dùng skeleton
  4. Animation transitions polish (Framer Motion / motion cho route change, dialog, drawer); role-switch dev button (Cmd+K command palette) chuyển vai trò trong < 2 giây để demo presenter switch giữa 8 tài khoản liên mạch
  5. README hướng dẫn chạy demo (npm install → db:reset → dev → đăng nhập tài khoản nào cho flow nào), demo script khớp "FLOW DEMO CHUẨN.docx" với note cho mỗi bước, demo dry-run trên máy demo + projector + slow wifi pass
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. M0 Bootstrap & Hạ tầng | 0/6 | Not started | - |
| 2. M1 Quản trị & Danh mục | 0/TBD | Not started | - |
| 3. M2.1 Chu kỳ Chương trình XTTM (HERO) | 0/TBD | Not started | - |
| 4. M2.2 Hồ sơ Đơn vị Chủ trì | 0/TBD | Not started | - |
| 5. M2.3 Khai báo & Nộp Đề án (HERO) | 0/TBD | Not started | - |
| 6. M2.4 Tiếp nhận & Kiểm tra hồ sơ | 0/TBD | Not started | - |
| 7. M3 Thẩm định & Phê duyệt (HERO) | 0/TBD | Not started | - |
| 8. M4 Hợp đồng, Triển khai & Điều chỉnh | 0/TBD | Not started | - |
| 9. M5 Báo cáo, Nghiệm thu, Tài chính | 0/TBD | Not started | - |
| 10. M6 Dashboard & Cảnh báo (HERO Lãnh đạo) | 0/TBD | Not started | - |
| 11. M7 Polish & Demo Prep | 0/TBD | Not started | - |

## Coverage Summary

- **Total v1 requirements:** 193
- **Mapped to phases:** 193 (100%)
- **Orphaned:** 0
- **Granularity:** standard (11 phases — fits 8-12 fine band do scope rộng + 4 HERO phase tách riêng)

| Phase | Reqs | Categories |
|-------|------|------------|
| 1 | 8 | AUTH |
| 2 | 27 | USER, ROLE, CAT, CONFIG, LOG |
| 3 | 15 | CYCLE |
| 4 | 8 | ORG |
| 5 | 22 | PROJ |
| 6 | 13 | INTAKE |
| 7 | 24 | COUNCIL, APPROVE |
| 8 | 26 | CONTRACT, IMPL, AMEND |
| 9 | 17 | REPORT, ACCEPT, FIN |
| 10 | 20 | DASH, ALERT |
| 11 | 13 | POLISH |
| **Total** | **193** | **18 categories** |

---
*Roadmap defined: 2026-04-30*
*Last updated: 2026-04-30 after initial roadmapping*
