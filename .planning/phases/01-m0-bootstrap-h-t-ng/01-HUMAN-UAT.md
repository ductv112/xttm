---
status: partial
phase: 01-m0-bootstrap-h-t-ng
source: [01-VERIFICATION.md]
started: 2026-04-30
updated: 2026-04-30
---

## Current Test

[awaiting human testing — will surface in /gsd-progress and /gsd-audit-uat]

## Tests

### 1. Visual PDF rendering — diacritics + watermark
expected: Mở `01-06-spike-output.pdf` trong Chrome / Adobe Reader. Tất cả dấu tiếng Việt (ô, ơ, ư, ỹ, ặ, ợ, ụ, ỗ) render đúng — không có ô vuông □, dấu hỏi ?, hoặc ký tự lạ. Watermark "BẢN MẪU" đỏ chéo hiển thị rõ. Layout 2 cột header công văn chuẩn (Quốc hiệu trái, "Số:..." phải).
result: [pending]

### 2. End-to-end login UAT 8 tài khoản
expected: `npm run start` → http://localhost:3000/login. Theo `scripts/uat-checklist.md`, login lần lượt 8 tài khoản (admin/banql/chuyenvien/hoidong/donvi1/donvi2/taichinh/lanhdao) → mỗi account: (a) thấy form validation tiếng Việt khi nhập sai, (b) login thành công redirect đúng landing path theo role, (c) sidebar render đúng menu theo role, (d) topbar greeting đúng tên + role + đơn vị, (e) click "Đăng xuất" hiện AlertDialog xác nhận, click "Đăng xuất" lại quay về /login.
result: [pending]

### 3. 404 visual
expected: GET `/this-route-does-not-exist` (URL bất kỳ không tồn tại). Hero "404" màu navy text-blue-700 36px bold + "Không tìm thấy trang" + "Trang anh/chị tìm kiếm không tồn tại hoặc đã được di chuyển." + 2 CTA "Quay về trang chủ" + "Đăng nhập lại". DevTools KHÔNG thấy stack trace trong DOM.
result: [pending]

### 4. 500 visual + DOM stack-trace check
expected: Tạm inject `throw new Error("test")` vào server component, refresh trang. Hero "500" màu đỏ text-red-600 36px bold + "Đã có lỗi xảy ra" + "Vui lòng thử lại sau ít phút hoặc liên hệ quản trị viên." + 2 CTA "Thử lại" + "Quay về trang chủ". DevTools (Inspect Element) confirm KHÔNG có error.message và KHÔNG có error.stack trong DOM.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

(no gaps — all 32 automated must-haves passed; these 4 items are intrinsic visual UAT only)

---

**Note:** Phase 1 đạt `human_needed` không phải vì lỗi mà vì có 4 items chỉ verify được bằng human eyes (visual rendering, manual login flow, DOM inspection). Tất cả 32 automated must-haves PASSED. Auto-approved trong overnight session vì user đã authorize. Anh xem lại 4 items trên sáng mai.
