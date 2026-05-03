# Tài liệu dự án XTTMQG

## Cấu trúc

```
docs/
├── README.md                       # File này
├── kich-ban-demo-pilot.md          # Source markdown (chỉnh sửa ở đây)
├── kich-ban-demo-pilot.docx        # File Word (regenerate từ MD)
├── reference.docx                  # Template style cho pandoc — đã patch border bảng
└── screenshots/                    # Thư mục ảnh chụp màn hình (rỗng — chờ chụp)
    ├── a1-chu-ky-list.png
    ├── a2-form-tao-chu-ky.png
    └── ...
```

## ✅ Trạng thái screenshots

**Đã capture đầy đủ 52 ảnh** bằng script Playwright tự động:

```bash
# Yêu cầu dev server đang chạy ở localhost:3000
npm run dev

# Trong terminal khác, chạy capture
npx tsx scripts/capture-screenshots.mts
```

Script ở [scripts/capture-screenshots.mts](../scripts/capture-screenshots.mts) sẽ:
1. Mở Chromium headless 1920×1080
2. Cho mỗi tài khoản trong 8 demo accounts: tạo fresh BrowserContext → login → chạy lần lượt các capture của tài khoản đó
3. Lưu PNG vào `docs/screenshots/<id>.png` đúng tên file đã tag trong `kich-ban-demo-pilot.md`

Re-run script bất kỳ lúc nào sau khi UI thay đổi để cập nhật ảnh. Sau đó regenerate docx (lệnh ở mục "Regenerate file Word" bên dưới).

> ⚠️ Một số ảnh là page-level capture (best-effort). Nếu cần ảnh có form đã fill / dialog đã mở / state đặc biệt → chỉnh hàm `run` của entry tương ứng trong script, hoặc thay thủ công file PNG cụ thể.

## Quy trình cập nhật kịch bản

### 1. Chụp screenshots

Theo kịch bản, tổng cộng có **51 ảnh** cần chuẩn bị, đặt trong thư mục `screenshots/` với tên file đã được chỉ định trong từng bước.

**Quy ước**:
- Format: PNG, độ phân giải 1920×1080
- Có thể dùng Snipping Tool (Win+Shift+S), CleanShot, ShareX
- Nén dưới 500KB/ảnh nếu có thể (https://tinypng.com)
- Khoanh đỏ điểm cần chú ý (Skitch / mspaint)

### 2. Sửa nội dung kịch bản

Mọi chỉnh sửa thực hiện trong `kich-ban-demo-pilot.md`. **KHÔNG chỉnh trực tiếp file `.docx`** vì sẽ bị ghi đè khi regenerate.

### 3. Regenerate file Word

```bash
cd docs
pandoc kich-ban-demo-pilot.md --reference-doc=reference.docx -o kich-ban-demo-pilot.docx --from markdown --to docx --standalone
```

> Yêu cầu: Pandoc 3.x đã cài (https://pandoc.org/installing.html). Test: `pandoc --version`.
>
> ⚠️ **Đóng file `.docx` trong Word trước khi regenerate**, nếu không pandoc sẽ báo "Permission denied". Lock file `~$kich-ban-demo-pilot.docx` xuất hiện = Word đang mở.

### Lưu ý về `reference.docx`

File này là template Word đã được patch để bảng có border đầy đủ + header row đậm + nền xám nhạt. Nếu cần thay đổi style (font, màu, heading...), mở `reference.docx` trong Word, sửa Style → lưu lại. Pandoc sẽ tự áp dụng style mới ở lần regen tiếp.

Sau khi đặt screenshots vào `screenshots/`, các ảnh sẽ tự động được nhúng vào file docx — không cần thao tác thủ công gì nữa.

### 4. Tuỳ chỉnh format docx (nâng cao)

Pandoc có thể nhận template docx tham chiếu để áp dụng style:

```bash
pandoc kich-ban-demo-pilot.md \
  --reference-doc=mau-bo-cong-thuong.docx \
  -o kich-ban-demo-pilot.docx
```

Tạo `mau-bo-cong-thuong.docx` bằng cách:
1. `pandoc -o template.docx --print-default-data-file reference.docx`
2. Mở template.docx trong Word, chỉnh font/màu/heading style theo thương hiệu Bộ Công Thương
3. Lưu lại và tham chiếu trong lệnh pandoc

## Danh sách 51 screenshots cần chuẩn bị

### Phần A — Khởi tạo chu kỳ (8 ảnh)

| File | Mô tả |
|---|---|
| `a1-chu-ky-list.png` | Trang Chu kỳ chương trình (banql) |
| `a2-form-tao-chu-ky.png` | Form tạo chu kỳ mới |
| `a3-1-moc-thoi-gian.png` | Tab cấu hình mốc thời gian |
| `a3-2-tieu-chi.png` | Tab cấu hình tiêu chí thẩm định |
| `a3-3-don-vi-moi.png` | Tab chọn đơn vị mời |
| `a4-1-mo-dang-ky.png` | Dialog xác nhận mở đăng ký |
| `a4-2-composer-email.png` | Composer email mời |
| `a4-3-lich-su-email.png` | Lịch sử email đã gửi |

### Phần B — Đơn vị nộp đề án (7 ảnh)

| File | Mô tả |
|---|---|
| `b1-ho-so-don-vi.png` | Hồ sơ tổ chức Hiệp hội Da giày VN |
| `b2-1-wizard-buoc-1.png` | Wizard Bước 1 Thông tin chung |
| `b2-2-wizard-du-toan.png` | Wizard Bước 4 Dự toán |
| `b2-3-wizard-tai-lieu.png` | Wizard Bước 6 Tài liệu |
| `b3-1-dialog-nop.png` | Dialog xác nhận nộp đề án |
| `b3-2-da-nop.png` | Toast + status SUBMITTED |

### Phần C — Tiếp nhận & kiểm tra (8 ảnh)

| File | Mô tả |
|---|---|
| `c1-1-tiep-nhan-queue.png` | Queue tiếp nhận hồ sơ (banql) |
| `c1-2-bulk-receive.png` | Bulk action tiếp nhận hàng loạt |
| `c2-1-modal-phan-cong.png` | Modal phân công chuyên viên |
| `c2-2-da-phan-cong.png` | Đề án đã được phân công |
| `c3-1-checklist.png` | Checklist kiểm tra hành chính |
| `c3-2-ket-luan-hop-le.png` | Kết luận hợp lệ |
| `c4-1-cham-diem-queue.png` | Tab Chấm điểm sơ bộ + queue |
| `c4-2-form-cham-diem.png` | Form chấm điểm 8 tiêu chí |

### Phần D — Thẩm định & phê duyệt (7 ảnh)

| File | Mô tả |
|---|---|
| `d1-1-tao-hoi-dong.png` | Form tạo hội đồng thẩm định |
| `d1-2-phan-cong-de-an.png` | Phân công đề án vào hội đồng |
| `d2-1-tham-dinh-queue.png` | Queue phiếu thẩm định (hoidong) |
| `d2-2-form-hoi-dong.png` | Form chấm phiếu hội đồng |
| `d3-tong-hop-tro-trinh.png` | Tổng hợp điểm + tờ trình (banql) |
| `d4-1-ky-quyet-dinh.png` | Form ký quyết định (lanhdao) |
| `d4-2-pdf-quyet-dinh.png` | PDF Quyết định phê duyệt |

### Phần E — Hợp đồng & triển khai (6 ảnh)

| File | Mô tả |
|---|---|
| `e1-1-sinh-hd.png` | Sinh hợp đồng tự động |
| `e1-2-upload-scan.png` | Upload bản scan HĐ đã ký |
| `e2-1-trien-khai.png` | Tab Triển khai (donvi1) |
| `e2-2-thuong-vu.png` | Form liên hệ thương vụ ĐSQ |
| `e3-1-form-tam-ung.png` | Form phiếu tạm ứng (taichinh) |
| `e3-2-da-giai-ngan.png` | Đã giải ngân + dashboard |

### Phần F — Báo cáo & nghiệm thu (10 ảnh)

| File | Mô tả |
|---|---|
| `f1-1-form-bao-cao.png` | Form báo cáo định lượng + định tính |
| `f1-2-da-nop-bao-cao.png` | Đã nộp báo cáo |
| `f2-1-queue-bao-cao.png` | Queue Báo cáo chờ duyệt (banql) |
| `f2-2-duyet-bao-cao.png` | Trang duyệt báo cáo |
| `f3-1-form-bb-nghiem-thu.png` | Form biên bản nghiệm thu |
| `f3-2-pdf-bb.png` | PDF biên bản nghiệm thu |
| `f4-thanh-ly-hd.png` | Thanh lý hợp đồng |
| `f5-1-thanh-toan.png` | Phiếu thanh toán cuối |
| `f5-2-quyet-toan.png` | Phiếu quyết toán |
| `f5-3-dashboard-tai-chinh.png` | Dashboard tài chính tổng hợp |

### Phần G — Demo phụ trợ (5 ảnh)

| File | Mô tả |
|---|---|
| `g1-1-donvi2-de-an.png` | donvi2 chỉ thấy đề án của mình |
| `g1-2-url-blocked.png` | Truy cập URL trực tiếp bị chặn |
| `g2-1-ma-tran-quyen.png` | Ma trận quyền (admin) |
| `g2-2-confirm-diff.png` | Confirm dialog hiển thị diff |
| `g3-1-audit-log.png` | Audit log timeline |
| `g3-2-audit-detail.png` | Chi tiết JSON before/after |

### Phần H — Dashboard tổng hợp (1 ảnh)

| File | Mô tả |
|---|---|
| `h-dashboard-lanhdao.png` | Dashboard tổng hợp lãnh đạo |

---

## Gợi ý nâng cao

Nếu cần auto-capture screenshot bằng Playwright (giảm công sức chụp tay), báo cho tôi để build script tự động. Script sẽ:
- Login lần lượt 8 tài khoản
- Navigate theo từng bước
- Capture screenshot và lưu đúng tên file
- Có thể chạy lại bất kỳ lúc nào sau khi UI thay đổi

Hoặc nếu phần nào của kịch bản chưa khớp với hệ thống thực tế (ví dụ: form thực tế có field khác), chỉnh `kich-ban-demo-pilot.md` rồi regenerate là cập nhật ngay.
