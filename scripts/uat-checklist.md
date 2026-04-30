# Phase 1 UAT Smoke Test — Manual Checklist

> Đây là checklist nghiệm thu tay (UAT) cho Phase 1 (M0 Bootstrap & Hạ tầng) — verify 8 yêu cầu AUTH-01 đến AUTH-08 hoạt động end-to-end trên production build.

| Field | Value |
|-------|-------|
| Date | `<YYYY-MM-DD>` |
| Tester | `<name>` |
| Build | production (`npm run build && npm run start`) |
| Browser | Chrome / Edge mới nhất |
| Resolution | 1366×768 baseline + 1920×1080 polish target |

---

## Chuẩn bị

```bash
cd d:/Thaodnp/XTTM
npm run db:reset       # reset DB + seed 8 accounts
npm run build          # production build
npm run start          # start production server (port 3000)
```

Mở http://localhost:3000/login trong DevTools (Console + Network tab).

## Pre-checks

- [ ] DevTools Console mở, Clear, navigate `/login` → 0 error / 0 warning
- [ ] Network tab → 0 request 404 (favicon, font, image)
- [ ] Server stdout không có "Error" hay "Warning" hydration mismatch / missing key prop

## Login Flow Per Account (lặp 8 lần)

For each user trong CLAUDE.md §5 / lib/constants.ts HARDCODED_USERS:

| # | Username | Password | Expected Role | Expected Redirect | Expected Sidebar Sections | Expected User Menu Greeting | Pass? |
|---|----------|----------|---------------|-------------------|---------------------------|------------------------------|---|
| 1 | `admin` | `Admin@123` | ADMIN | `/dashboard` | Nghiệp vụ + Quản trị (full 5 items) | "Xin chào, Nguyễn Văn Quản" + "Quản trị viên" | [ ] |
| 2 | `banql` | `Banql@123` | BANQL | `/dashboard` | Nghiệp vụ (full 13 items) | "Xin chào, Trần Thị Bích Ngọc" + "Ban quản lý CT XTTM · Cục Xúc tiến Thương mại" | [ ] |
| 3 | `chuyenvien` | `Cv@123` | CHUYENVIEN | `/tiep-nhan` | Nghiệp vụ (Trang chủ + Đề án + Tiếp nhận + Thông báo) | "Xin chào, Lê Quang Cường" + "Chuyên viên kiểm tra · Cục Xúc tiến Thương mại" | [ ] |
| 4 | `hoidong` | `Hd@123` | HOIDONG | `/tham-dinh` | Nghiệp vụ (Trang chủ + Chu kỳ + Đề án + Thẩm định + Thông báo) | "Xin chào, PGS.TS. Phạm Thanh Dũng" + "Hội đồng thẩm định · Cục Xúc tiến Thương mại" | [ ] |
| 5 | `donvi1` | `Donvi@123` | DONVI | `/de-an` | Nghiệp vụ limited (Trang chủ + Đơn vị + Đề án + ...) | "Xin chào, Hoàng Mai Linh" + "Đơn vị chủ trì · Hiệp hội Da giày - Túi xách Việt Nam" | [ ] |
| 6 | `donvi2` | `Donvi@123` | DONVI | `/de-an` | Nghiệp vụ limited (giống donvi1) | "Xin chào, Vũ Đức Minh" + "Đơn vị chủ trì · Hiệp hội Dệt may Việt Nam" | [ ] |
| 7 | `taichinh` | `Tc@123` | TAICHINH | `/tai-chinh` | Nghiệp vụ (Trang chủ + Hợp đồng + Tài chính + Thông báo) | "Xin chào, Đặng Thu Hà" + "Tài chính · Cục Xúc tiến Thương mại" | [ ] |
| 8 | `lanhdao` | `Ld@123` | LANHDAO | `/dashboard` | Nghiệp vụ (full) + Audit log | "Xin chào, Bùi Xuân Hồng" + "Lãnh đạo · Bộ Công Thương" | [ ] |

**For each account:** đăng xuất giữa các lần test (qua user menu → Đăng xuất → confirm dialog → "Đăng xuất" red button).

## Negative Cases (validation + auth)

- [ ] Empty username → inline error đỏ `text-sm text-red-600` "Vui lòng nhập tên đăng nhập" dưới input
- [ ] Empty password → inline error "Vui lòng nhập mật khẩu" dưới input
- [ ] Wrong username (vd `nobody` / `whatever`) → Alert destructive "Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại"
- [ ] Wrong password (right username `admin` / wrong `xxx`) → cùng generic error (không phân biệt user-not-found vs wrong-password — chống user enumeration)

## SSO Placeholder (AUTH-05)

- [ ] Click button "Đăng nhập SSO Bộ Công Thương" → Sonner info toast hiện top-right "Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án"
- [ ] Toast border-left blue + icon info → đúng variant info
- [ ] Toast duration ~4s, dismissable
- [ ] KHÔNG navigate / submit form khi click SSO button

## Logout Flow (AUTH-03)

- [ ] User menu dropdown opens (click avatar + chevron-down trên topbar)
- [ ] Header dropdown hiện greeting + email/username
- [ ] Click item "Đăng xuất" → AlertDialog "Xác nhận đăng xuất" mở với body "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?"
- [ ] Click "Hủy" (outline) → dialog đóng, vẫn ở trang hiện tại
- [ ] Reopen dialog → Click "Đăng xuất" (red destructive) → button hiện spinner + "Đang đăng xuất..."
- [ ] Toast "Đã đăng xuất khỏi hệ thống" → redirect `/login`
- [ ] ESC key cũng đóng dialog (auto-focus button "Hủy")

## Session Persist (AUTH-04)

- [ ] Login `donvi1` → redirect `/de-an` → Refresh trang (F5) → vẫn ở `/de-an`, layout shell render đúng (KHÔNG kick về `/login`)
- [ ] Close tab → reopen `http://localhost:3000/dashboard` (đã đổi sang account ADMIN/BANQL có quyền dashboard) → cookie session vẫn valid → render dashboard

## Route Guards (middleware AUTH-01)

- [ ] Logged out: GET `/dashboard` → 307 redirect `/login`
- [ ] Logged out: GET `/de-an` → 307 redirect `/login`
- [ ] Logged out: GET `/tham-dinh` → 307 redirect `/login`
- [ ] Logged in `donvi1`: GET `/login` → 307 redirect `/de-an` (defaultLandingPath cho DONVI)
- [ ] Logged in `admin`: GET `/login` → 307 redirect `/dashboard`
- [ ] Logged in `chuyenvien`: GET `/login` → 307 redirect `/tiep-nhan`

## 404 / 500 Pages (AUTH-08)

- [ ] GET `/this-route-does-not-exist` → 404 page render với:
  - Hero "404" `text-4xl font-bold text-blue-700` (navy, không đỏ)
  - Heading "Không tìm thấy trang"
  - Body "Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển"
  - CTA Button "Quay về trang chủ" với icon home prefix
- [ ] CTA click → navigate `/`
- [ ] **(Manual: temporarily throw error trong RSC để trigger error.tsx)** → 500 page render với:
  - Hero "500" `text-4xl font-bold text-red-600` (red signal "lỗi")
  - Heading "Đã xảy ra lỗi"
  - Body "Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút"
  - 2 CTA: "Thử lại" (default) + "Quay về trang chủ" (outline)
- [ ] Click "Thử lại" → reset() → page recovers (nếu error đã fix)
- [ ] KHÔNG hiện stack trace trên UI / DOM
- [ ] DevTools Inspect Element → KHÔNG thấy `error.message` hay `error.stack` trong DOM
- [ ] View page source → KHÔNG xuất hiện stack trace string ("at ", file paths server-side)

## Vietnamese Rendering Check

- [ ] Tất cả label/heading/button render đầy đủ dấu (kiểm 5 dấu sắc/huyền/ngã/hỏi/nặng + dấu mũ + đ/Đ)
- [ ] Smoke check string đầy đủ dấu: "Đề án Xúc tiến Thương mại — Hiệp hội Dệt may Việt Nam (VITAS) — Quý IV/2026"
- [ ] User menu dòng role+org render đầy đủ tên Việt (đặc biệt "Hiệp hội Da giày - Túi xách Việt Nam" — nhiều dấu)
- [ ] Brand panel left login: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" + "Độc lập - Tự do - Hạnh phúc" Times New Roman italic render rõ
- [ ] Sidebar items menu render đúng dấu: "Đề án", "Thẩm định", "Phê duyệt", "Đơn vị chủ trì", "Tiếp nhận hồ sơ", "Tài chính"

## Accessibility Quick Check

- [ ] Tab through login form: Username → Password → Eye toggle → "Đăng nhập" → "Đăng nhập SSO" — focus ring `ring-2 ring-blue-700` visible mỗi step
- [ ] Avatar trong topbar có aria-label (avatar component shadcn default)
- [ ] Bell button có aria-label "Thông báo"
- [ ] Eye toggle aria-label đúng "Hiển thị mật khẩu" / "Ẩn mật khẩu" tùy state
- [ ] Sidebar collapse button có aria-label "Thu gọn thanh điều hướng" / "Mở rộng thanh điều hướng"
- [ ] Color contrast verified per UI-SPEC §Accessibility Contract (text-slate-900 trên white = 16.4:1 AA; text-white trên blue-700 = 7.7:1 AAA)

## Brand Panel Visual Check (login page split 60/40)

- [ ] Desktop ≥ 1024px: split 60/40 — brand panel trái (60%), form phải (40%)
- [ ] Tablet 640-1024px / Mobile < 640px: stack vertical — form phải lên trên, brand panel collapse thành mini header (`lg:hidden` block hiện QuocHuySvg + "XTTMQG" wordmark)
- [ ] Brand panel chứa: Quốc huy SVG navy outline 80×80 → Quốc hiệu Times New Roman italic → wordmark "XTTMQG" `text-4xl font-bold text-blue-700` → tagline → footer "Bộ Công Thương — Cục Xúc tiến Thương mại"
- [ ] Form panel chứa: title "Đăng nhập hệ thống" `text-2xl font-semibold` → subtitle → 2 inputs với eye toggle → primary blue button "Đăng nhập" → divider with "Hoặc" → SSO outline button → footer "Phiên bản POC · 2026"

## PDF Spike Check (Plan 06 đã commit, sanity check)

- [ ] GET `/test-pdf` → trang preview PDF mở
- [ ] Click "Generate PDF" → download `xttm-quyet-dinh-mau.pdf`
- [ ] Open PDF trong Adobe / Chrome viewer → render đầy đủ dấu tiếng Việt KHÔNG vỡ
- [ ] Watermark "BẢN MẪU" diagonal đỏ alpha visible
- [ ] Header công văn 2 cột chuẩn

## Sign-off

- [ ] All checkboxes pass: `[Y/N]`
- [ ] Phase 1 ready to merge: `[Y/N]`
- [ ] Notes / issues found:
  ```
  <leave empty if all pass>
  ```

---

## Coverage Mapping (AUTH-01 đến AUTH-08)

| Requirement | Coverage |
|------------|----------|
| AUTH-01 — Đăng nhập + redirect role-based | Login flow per account (8 rows) + Route guards |
| AUTH-02 — 8 tài khoản hardcoded bcrypt | Login flow per account (mỗi account login thành công với bcrypt-hashed password) |
| AUTH-03 — Logout flow với confirm dialog | Logout Flow section |
| AUTH-04 — Session persist refresh | Session Persist section |
| AUTH-05 — SSO placeholder Sonner toast | SSO Placeholder section |
| AUTH-06 — Layout shell sidebar dynamic + topbar + breadcrumb | Login flow per account (Expected Sidebar Sections cột) + User Menu greeting cột |
| AUTH-07 — Light mode + locale vi-VN | Vietnamese Rendering Check section + implicit (entire UI tiếng Việt) |
| AUTH-08 — 404/500 không lộ stack trace | 404 / 500 Pages section |
