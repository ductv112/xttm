# Tóm tắt Nghiên cứu Dự án — XTTMQG Prototype

**Project:** Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại (XTTMQG)
**Domain:** Government grant management — POC cho Bộ Công Thương / Cục XTTM
**Researched:** 2026-04-30
**Confidence:** HIGH (stack + nghiệp vụ XTTM), MEDIUM (PDF tiếng Việt + state machine details)
**Win condition:** Ký full project triển khai chính thức với Bộ Công Thương

---

## Executive Summary

Đây là POC bản chất "high-stakes single-shot demo" cho cơ quan nhà nước cấp Trung ương. Đối tượng demo đa dạng (lãnh đạo Cục/Bộ + ban nghiệp vụ + IT team + sếp DFT) nhưng **win condition rất rõ**: phải làm cho hero flow **M2-M3 (Vòng đời đề án: Chu kỳ → Đề án → Kiểm tra → Thẩm định → Phê duyệt)** chạy mượt và sâu nghiệp vụ. Các module còn lại (M4-M5) cần đủ chiều rộng để chứng minh end-to-end coverage, M6 cần "wow" cho lãnh đạo (dashboard + cảnh báo SLA), M7 polish bake mock data + demo script.

Stack đã chốt (Next.js 15 + Tailwind v4 + shadcn/ui + Prisma/SQLite + NextAuth Credentials) là lựa chọn đúng cho POC: dev velocity cao nhất, look "Vercel-grade" 2026, zero-config DB, deploy local là đủ. Kiến trúc đề xuất là monolith App Router thuần, với 3 quyết định trụ cột — (1) **Server Actions cho 95% mutation**, (2) **state machine bằng status enum + guard functions** thay vì XState, (3) **`@react-pdf/renderer` server-side** cho PDF tiếng Việt với font Be Vietnam Pro. Từ chối sớm ba thứ overkill: CASL, XState, custom permission engine.

Rủi ro lớn nhất tập trung ở 3 vùng: (a) **PDF tiếng Việt vỡ dấu / sai layout công văn nhà nước** — fail nguyên buổi demo; (b) **Sai thuật ngữ chuyên ngành / sai phân loại "trọng yếu" Điều 13 NĐ 28** — mất uy tín nghiệp vụ; (c) **Hardcoded date trong seed làm demo trông cũ + không có cảnh báo SLA nào trigger** — mất tính "live". Mọi rủi ro này đều có mitigation cụ thể trong PITFALLS.md, và toàn bộ phải được xử lý từ M0 (schema + helpers + smoke test PDF) chứ không để dồn về M7. Ưu tiên chất lượng > tốc độ; user đã confirm "no deadline".

---

## Frozen Tech Decisions (KHÔNG đem ra debate lại)

| # | Decision | Frozen reason |
|---|----------|---------------|
| 1 | Next.js 15.4+ App Router + React 19 | Đã chốt với user; STACK validate đúng cho 2026 |
| 2 | TypeScript 5.7+ strict, KHÔNG `any` | Bắt buộc cho POC nghiêm túc |
| 3 | Tailwind v4 + shadcn/ui CLI v4 (KHÔNG MUI/AntD/Bootstrap/Chakra) | "Vercel-grade" 2026 |
| 4 | Prisma 6.6+ (lock ≥6.2 enum SQLite) + SQLite | POC zero-config |
| 5 | NextAuth v5 Credentials + bcryptjs (KHÔNG bcrypt native) + JWT | Tránh issue Windows build |
| 6 | RHF 7.55+ + Zod 4 + @hookform/resolvers 4 | Standard 2026 |
| 7 | TanStack Table 8.21+ + TanStack Query 5.99+ + Zustand 5 | Standard data layer |
| 8 | **`@react-pdf/renderer` 4.x server-side** (KHÔNG jsPDF/pdf-lib/Puppeteer) | Layout phức tạp công văn cần flexbox + JSX |
| 9 | **Be Vietnam Pro static TTF** (KHÔNG variable font) | PDF 2.0 spec không support variable axis |
| 10 | date-fns v4 + locale `vi` (KHÔNG dayjs/Moment) | Tree-shake tốt, locale rich |
| 11 | Native `Intl.NumberFormat('vi-VN')` (KHÔNG numeral.js) | Zero bundle, native |
| 12 | Recharts v3 + shadcn `chart` block (KHÔNG Visx/Nivo/Chart.js) | Đủ cho dashboard |
| 13 | Tiptap v2 (KHÔNG Lexical/Quill/CKEditor) | Headless, ecosystem mạnh |
| 14 | Sonner toast | shadcn default |
| 15 | Native Server Actions + `fs/promises` (KHÔNG multer/formidable) | App Router compatibility |
| 16 | **Custom permission matrix** (KHÔNG CASL/Casbin) | RSC compatibility, đủ cho POC |
| 17 | **Status enum + guard functions** (KHÔNG XState v5) | Overkill cho 7-state machine |
| 18 | App Router: chỉ `(auth)` + `(app)` (KHÔNG split theo role/phân hệ) | URL clean, sidebar dynamic theo role |
| 19 | **Server Actions cho 95% mutation**, API routes CHỈ cho NextAuth/PDF/Excel/file | Type-safe E2E |
| 20 | **RBAC 3 lớp**: Middleware + Page + Server Action (authoritative) | Defense-in-depth không over-engineer |
| 21 | Hybrid `components/{ui,layout,shared}/` + `features/<phân-hệ>/` | Cân bằng reuse với feature locality |
| 22 | Polymorphic `Attachment` + `storage/uploads/` (KHÔNG `public/`) | Bypass auth nếu để `public/` |

---

## Top 8 Risks & Mitigation

| # | Risk | Severity | Phase | Mitigation |
|---|------|----------|-------|-----------|
| R1 | PDF tiếng Việt vỡ dấu / sai layout công văn | CRITICAL | M0 spike → M3 | `@react-pdf/renderer` + Be Vietnam Pro static + smoke test chuỗi đầy đủ dấu + template `OfficialDocument.tsx` chuẩn |
| R2 | Sai thuật ngữ chuyên ngành ("đề án"≠"dự án", "thẩm định"≠"kiểm tra") | CRITICAL | M0 lock + M2/M3 | `lib/constants.ts` TERMS dictionary lock từ M0; ESLint rule cấm string literal |
| R3 | State machine sai transition | CRITICAL | M0 spec + M2.1, M2.3-M2.4 | `lib/workflows/<entity>.ts` transition table + `canTransition()` guard authoritative |
| R4 | Phân loại "trọng yếu" Điều 13 NĐ 28 sai | CRITICAL | M4 | Hardcode rule list theo `_extracted_quytrinh.txt` + reference NĐ 28 PDF gốc |
| R5 | Hardcoded date trong seed | CRITICAL | M2 set + M7 audit | `daysAgo(n)/daysFromNow(n)` helper relative; seed cover SLA scenarios (28/55/12 ngày) |
| R6 | Multi-step form race / mất nháp / validation phức tạp | HIGH | M0 pattern + M2.3 | RHF 1 instance + Zustand persist + Zod schema/step + autosave debounce 2s |
| R7 | Demo broken upload / role switch chậm | HIGH | M0 config + M7 dry-run | `bodySizeLimit:'20mb'`; mock file <2MB; Role-switch Cmd+K command palette |
| R8 | Console error / 404 / hydration mismatch | HIGH | M0 hygiene + M7 audit | Production build cho demo; M7 audit checklist |

---

## Roadmap Implications

**8 milestones giữ nguyên M0-M7** từ PROJECT.md. Critical path round 1 (MVP demo): M0 → M1 → M2.1 → M2.2 → M2.3 → M2.4 → M3 → M7. Round 2 (chiều rộng + wow lãnh đạo): M4 → M5 → M6.

### M0 — Bootstrap & Hạ tầng
**Rationale:** Pitfall CRITICAL (PDF, terminology, date, state machine, schema, hydration) phải xử lý ở M0. Trượt foundation = sửa sau tốn 5-10x.
**Delivers:** Next.js init + 36 shadcn component + Prisma schema lock (parentProjectId, audit fields, soft delete) + `lib/{auth,permissions,prisma,format,constants(TERMS),utils,workflows/}` skeleton + Layout shell + NextAuth 8 tài khoản + **PDF spike** (1-2 ngày, render thử QĐ với chuỗi smoke + Be Vietnam Pro + watermark + Quốc huy SVG) + db:reset script + relative date helper + empty state + skeleton + sonner.

### M1 — Quản trị & Danh mục
**Rationale:** 8 catalog là tiền đề ProgramCycle. Audit log set sớm. Role matrix UI wow IT team.
**Delivers:** User CRUD + Role/Permission matrix grid (render từ DB, KHÔNG hardcode) + 8 catalogs CRUD + System config + Audit log + filter + export CSV + email template với honorific chuẩn.

### M2.1 — Chu kỳ Chương trình XTTM (HERO entity)
**Rationale:** Gating CHO TẤT CẢ entity con. Bug ở đây phá cả flow. Visual state machine wow IT.
**Delivers:** BQL tạo chu kỳ năm + cấu hình mốc/ngân sách/tiêu chí + upload công văn scan + State machine 7 trạng thái + cho phép gia hạn (CLOSED→OPEN) + cho phép sửa cấu hình khi OPEN + Composer email mời đăng ký (Tiptap + mock dispatch) + **Visual state machine diagram** + seed cycle năm trước (COMPLETED) + cycle hiện tại (OPEN_REGISTRATION).

### M2.2 — Hồ sơ Đơn vị chủ trì
**Rationale:** Tiền điều kiện Đề án. "1 hồ sơ đơn vị, nhiều đề án" emphasize trong UI.
**Delivers:** Đăng ký tổ chức + năng lực + đầu mối + xác nhận + OrgProfile state machine.

### M2.3 — Khai báo & Nộp Đề án (HERO — màn hình công khai nhất)
**Rationale:** Screen audience nhìn nhiều nhất. Form 6 bước phải đẹp + autosave + sao chép + xuất PDF. Label khớp 100% biểu mẫu trong `Mau bieu/`.
**Delivers:** Multi-step wizard 6 bước (single URL, Zustand step + RHF 1 instance + Zod schema/step) + autosave debounce 2s + Gating bởi `OPEN_REGISTRATION` + validation chặt + sao chép đề án cũ + xuất PDF + đề án 2 năm (toggle + auto-create 2 records với parentProjectId) + Print PDF có header Bộ CT + dấu mộc SVG.

### M2.4 — Tiếp nhận & Kiểm tra hồ sơ
**Rationale:** Cầu nối M2.3 → M3. Kiểm tra hồ sơ ≠ Thẩm định — phải tách biệt rõ.
**Delivers:** BQL tiếp nhận + drag-drop assign + bulk-assign + Chuyên viên checklist (✓/✗/N/A + ghi chú) + Trả bổ sung → đơn vị nộp lại với version increment + ProjectVersion snapshot + chấm điểm sơ bộ.

### M3 — Thẩm định & Phê duyệt (HERO — moment "in tờ trình ra đẹp")
**Rationale:** Closing flow của hero. Side-by-side panel = pattern peer quốc tế dùng.
**Delivers:** Tạo hội đồng + thành viên + phân công + **Side-by-side scoring panel** (rubric trọng số trái + hồ sơ phải) + lưu nháp/nộp + Conflict-of-interest checkbox + real-time aggregate (TanStack Query polling 5s) + tổng hợp + xếp hạng + tờ trình PDF + QĐ phê duyệt PDF chuẩn công văn + thông báo composer email.

### M4 — Hợp đồng, Triển khai & Điều chỉnh (Điều 13 NĐ 28)
**Rationale:** Round 2 demo. Side-by-side diff = pháp lý sâu, peer quốc tế không có.
**Delivers:** Sinh HĐ từ đề án + auto số HĐ (`XTTM/YYYY/NNN`) + upload scan + cảnh báo 60 ngày + Kế hoạch triển khai + simple horizontal timeline (KHÔNG Gantt phức tạp) + Điều chỉnh đề án (form chọn loại → suy luận `is_critical` → route đúng workflow) + **Side-by-side diff view**.

### M5 — Báo cáo, Nghiệm thu, Tài chính
**Rationale:** Đóng E2E. Tái dùng PDF infrastructure từ M3.
**Delivers:** Báo cáo + chỉ tiêu + minh chứng + Hồ sơ nghiệm thu + biên bản PDF + Hồ sơ thanh lý + Tạm ứng/thanh toán/quyết toán (state machine, KHÔNG tích hợp Kho bạc).

### M6 — Dashboard & Cảnh báo (HERO lãnh đạo — wow factor mạnh nhất)
**Rationale:** Screen đầu tiên lãnh đạo nhìn. SLA countdown widgets + 4 cảnh báo đặc thù XTTM = unique selling point.
**Delivers:** Overview cards + 4 widget SLA (60-HĐ đỏ / 30-thương-vụ cam / 15-báo-cáo vàng / sai-lệch-ngân-sách xanh) + Recharts + shadcn `chart` + Drill-down 3 click chain + Comparison alert + Notification inbox topbar + Export Excel/PDF.

### M7 — Polish & Demo Prep
**Rationale:** KHÔNG optional — pitfall demo (console error, hardcoded date, empty state, fake names) đều surface ở polish.
**Delivers:** Mock data audit (10-15 records/loại, mọi status ≥2 records, mọi SLA trigger được) + tên đơn vị thật (VITAS, VINATEX, LEFASO, VICOFA, VASEP, VFA, VIFOREST, VCCI, May 10) + tên chủ nhiệm có chức danh thật + tên đề án realistic + Validator cuối seed (cross-entity invariants) + Pre-demo console hygiene (production build, 0 warning/error/404) + animation transitions + Demo script khớp "FLOW DEMO CHUẨN.docx" + Demo dry-run + projector + **Role-switch dev button (Cmd+K)** + README chạy demo.

### Research Flags

**Cần `/gsd-research-phase` (research sâu hơn khi vào planning):**
- **M2.1 (ProgramCycle)** — visual state machine UX, composer email pattern, gating edge cases
- **M2.3 (Project wizard)** — multi-step pattern + autosave + Zustand persist + sao chép đề án cũ, mapping 1:1 với `Mau bieu/`
- **M3 (Council scoring)** — side-by-side UX, real-time aggregate polling, tờ trình PDF layout chuẩn nghị định
- **M4 (Amendment Điều 13)** — phân loại "trọng yếu" rule (verify NĐ 28 PDF gốc), side-by-side diff UX, version snapshot
- **M6 (Dashboard)** — drill-down chain UX, SLA countdown widget pattern, Recharts customization

**Pattern chuẩn (skip research, build thẳng theo ARCHITECTURE.md):**
- M0 (đã có installation script đầy đủ trong STACK.md)
- M1 (generic CRUD pattern)
- M2.2 (form đơn giản, tái dùng pattern M2.3)
- M2.4 (checklist UI, drag-drop có sẵn)
- M5 (form đơn giản, tái dùng PDF)
- M7 (checklist driven)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Đã chốt với user + validate đúng version 2026 từ official docs |
| Features | **MEDIUM-HIGH** | Cross-verified với 4 peer quốc tế + 4 hệ thống Chính phủ VN. Demo wow priority chỉ validate sau demo thật |
| Architecture | **HIGH** | 10 quyết định trụ cột dựa trên Next.js 15 official docs + best practices 2026 |
| Pitfalls | **HIGH (VN gov + XTTM domain) / MEDIUM (Next.js/shadcn)** | Vietnamese gov pitfalls verified với NĐ 28, 81, 128/2024 |

**Overall: HIGH** cho stack + architecture; **MEDIUM-HIGH** cho features + UX gov VN; **MEDIUM** cho phân loại Điều 13 (verify trước M4).

### Gaps to Address Later

- **Wording cụ thể Điều 13 NĐ 28** — verify với PDF gốc trước M4
- **Tên đầy đủ + chức danh chủ tịch hiệp hội thực** — verify từ public site khi vào M7
- **Demo "wow factor" priority** — chỉ validate sau demo thật
- **Layout chính xác mẫu công văn QĐ phê duyệt + tờ trình + biên bản nghiệm thu** — đối chiếu sample thật trước M3
- **Mapping 1:1 field schema → biểu mẫu giấy** — đọc kỹ `Mau bieu/` trước M2.3
- **Tích hợp future** (SSO Bộ CT, USB token, TABMIS, Viettel Cloud) — list trong demo script "Phase 2 sẽ có"

---

## Sources

### Primary (HIGH confidence)
- `d:/Thaodnp/XTTM/.planning/PROJECT.md`, `CLAUDE.md`, `_extracted_quytrinh.txt`, `Mau bieu/`, `🎬 FLOW DEMO CHUẨN.docx`
- Nghị định 28/2018/NĐ-CP, 81/2018/NĐ-CP, 128/2024/NĐ-CP
- Next.js 15 docs, Prisma 6 SQLite docs, Auth.js v5, Tailwind v4, shadcn/ui CLI v4, @react-pdf/renderer fonts

### Secondary (MEDIUM confidence)
- 4 peer quốc tế: Salesforce GM, Fluxx, SmartSimple, Submittable, Grants.gov
- 4 hệ thống VN: Cổng DVCQG, EcoSys, TABMIS, eTax/VNACCS
- VGDS, TCVN 6909:2001, shadcn studio + LogRocket multi-step patterns

### Internal research files (chi tiết đầy đủ)
- `.planning/research/STACK.md` (~770 lines, 19 sections)
- `.planning/research/FEATURES.md` (~530 lines)
- `.planning/research/ARCHITECTURE.md` (~1500+ lines)
- `.planning/research/PITFALLS.md` (~1480 lines)
