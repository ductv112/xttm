---
phase: 01-m0-bootstrap-h-t-ng
plan: 06
subsystem: pdf
tags: [pdf, react-pdf, vietnamese, font-embed, official-document, spike, r1-critical-mitigated]

requires:
  - "@react-pdf/renderer@4.5.1 (frozen Plan 01)"
  - "Be Vietnam Pro static TTF (downloaded từ Google Fonts repo on GitHub)"
  - "Plan 01 foundation: lib/format.ts cho date helpers, components/ui/button.tsx cho test page"
provides:
  - "Be Vietnam Pro static TTF (Regular/Bold/Italic) trong public/fonts/ — KHÔNG variable font"
  - "lib/pdf/fonts.ts — registerPdfFonts() idempotent với Font.register 3 weights + Font.registerHyphenationCallback identity"
  - "lib/pdf/templates/OfficialDocument.tsx — JSX template Quyết định mẫu A4 với header công văn 2 cột chuẩn nhà nước (BỘ CT + Quốc hiệu) + watermark BẢN MẪU diagonal red alpha + signature block + Nghị định 28 reference + SMOKE_STRING constant với toàn bộ dấu Việt"
  - "lib/pdf/render.ts — renderOfficialDocumentPdf(props): Promise<Buffer> wrapper foundation"
  - "GET /api/pdf/spike — Route handler trả PDF buffer Content-Type application/pdf, runtime nodejs"
  - "/test-pdf page — public Vietnamese spike UI với Card + button mở PDF + smoke test checklist"
  - "scripts/download-fonts.mts — idempotent font download với 3 fallback URLs"
  - "scripts/pdf-smoke-test.mts — programmatic smoke test (size + magic header)"
  - "01-06-spike-output.pdf — sample 36KB output cho Phase 7-9 reference"
affects:
  - "Phase 5 (M2.3 in PDF đề án) — sẽ import @/lib/pdf/render + custom template"
  - "Phase 7 (M3 tờ trình + quyết định phê duyệt) — sẽ tái dùng OfficialDocument template với props khác (đề án ID, quyết định number, body từ DB)"
  - "Phase 9 (M5 biên bản nghiệm thu) — sẽ tái dùng OfficialDocument hoặc fork sang AcceptanceDocument template"

tech-stack:
  added: []
  patterns:
    - "PDF font register idempotent qua module-level boolean guard (`registered`) — gọi nhiều lần safe"
    - "PDF font path absolute qua `path.join(process.cwd(), 'public', 'fonts', filename)` — KHÔNG concat user input (T-06-04 mitigated)"
    - "Font.registerHyphenationCallback identity — tránh react-pdf hyphenate Vietnamese compound words"
    - "Static TTF (magic 0x00010000) ONLY — KHÔNG variable font / WOFF / WOFF2 (PDF 2.0 spec không support)"
    - "renderToBuffer return Buffer → wrap thành Uint8Array khi cấp cho NextResponse — Web Response constructor không nhận Node Buffer"
    - "Route Handler PDF dùng `runtime = 'nodejs'` + `dynamic = 'force-dynamic'` — react-pdf cần Node runtime, không Edge"
    - "Render wrapper trong .ts file dùng React.createElement thay vì JSX (per plan interface contract — file extension .ts không phải .tsx)"
    - "Template JSX file (.tsx) MUST `import * as React from 'react'` cho tsx CLI compatibility (classic JSX transform)"

key-files:
  created:
    - "scripts/download-fonts.mts (110 lines)"
    - "scripts/pdf-smoke-test.mts (40 lines)"
    - "public/fonts/BeVietnamPro-Regular.ttf (130KB)"
    - "public/fonts/BeVietnamPro-Bold.ttf (137KB)"
    - "public/fonts/BeVietnamPro-Italic.ttf (134KB)"
    - "lib/pdf/fonts.ts (45 lines)"
    - "lib/pdf/templates/OfficialDocument.tsx (240 lines)"
    - "lib/pdf/render.ts (25 lines)"
    - "app/api/pdf/spike/route.ts (50 lines)"
    - "app/test-pdf/page.tsx (60 lines)"
    - "components/ui/card.tsx (shadcn)"
    - ".planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf (36KB sample)"
  modified: []

key-decisions:
  - "Font source: Google Fonts upstream repo (github.com/google/fonts/main/ofl/bevietnampro/) — GitHub bvn-typeface mirror returned 404; bettergui mirror returned 404; Google Fonts repo always available"
  - "lib/pdf/render.ts giữ extension .ts (per plan interface contract) — dùng React.createElement thay vì JSX để TypeScript compile thành công"
  - "OfficialDocument.tsx thêm 'import * as React from react' — tsx CLI smoke test dùng classic JSX transform cần React in scope; Next.js production build dùng modern transform nhưng explicit import không hại"
  - "shadcn Card component cài thêm (Rule 3 deviation) — test-pdf page reference Card từ @/components/ui/card chưa tồn tại"
  - "PDF Buffer wrap thành Uint8Array trước khi pass NextResponse — Web Response constructor không accept Node Buffer trực tiếp (TypeScript error)"

metrics:
  duration: "7m"
  completed: 2026-04-30
  tasks: 3
  files_created: 12
  commits: 3

requirements-completed:
  - AUTH-07
---

# Phase 01 Plan 06: PDF Spike Summary

**PDF Vietnamese diacritics R1 CRITICAL pitfall mitigated — Be Vietnam Pro static TTF + @react-pdf/renderer + OfficialDocument template render Quyết định mẫu A4 chuẩn công văn nhà nước với header 2 cột, watermark diagonal đỏ, signature block; foundation ready cho Phase 5/7/9.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-30T16:54:49Z
- **Completed:** 2026-04-30T17:01:47Z
- **Tasks:** 3
- **Files created:** 12 (3 fonts + 2 scripts + 3 lib + 2 app + 1 shadcn ui + 1 sample PDF)

## Accomplishments

- Downloaded Be Vietnam Pro static TTF (Regular/Bold/Italic) ~400KB total from Google Fonts upstream repo (3rd fallback URL succeeded; first 2 URLs returned 404)
- Validated all 3 TTF magic bytes = `0x00010000` (TrueType static — confirmed NOT variable font, NOT WOFF/WOFF2)
- Built `lib/pdf` foundation: `fonts.ts` (idempotent register), `templates/OfficialDocument.tsx` (full Quyết định mẫu JSX), `render.ts` (Buffer wrapper)
- Created `/api/pdf/spike` Route Handler returning Content-Type `application/pdf` + correct Content-Disposition + render time ~75ms over HTTP
- Created `/test-pdf` public spike page with Card layout, smoke test checklist, button to download PDF
- Production build pass, typecheck pass exit 0
- Programmatic smoke test pass: 36823 bytes, magic header `%PDF-`, font `BeVietnamPro` referenced in PDF stream
- E2E HTTP test pass: server start + curl /api/pdf/spike → 200 OK + correct headers + correct body
- Sample PDF saved to `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf` for retrospective + Phase 7-9 visual reference
- R1 PDF Vietnamese pitfall **MITIGATED** (programmatic level — manual UAT visual verification still pending user open in Chrome/Adobe Reader)

## Task Commits

1. **Task 1: Download Be Vietnam Pro static TTF + scripts/download-fonts.mts** — `cf5ed5d` (feat)
2. **Task 2: lib/pdf foundation — fonts.ts + render.ts + OfficialDocument.tsx** — `a3afdf9` (feat)
3. **Task 3: API route /api/pdf/spike + /test-pdf page + smoke test pass** — `6009e8a` (feat)

## Files Created

### Scripts (Task 1 + Task 3)

- `scripts/download-fonts.mts` — Idempotent font download with 3 fallback URLs per filename (bvn-typeface, bettergui, google/fonts), MIN_VALID_SIZE_BYTES = 30000 sanity check
- `scripts/pdf-smoke-test.mts` — Programmatic render test, validates buffer size > 30KB + magic header `%PDF-`, saves output to `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf`

### Fonts (Task 1)

- `public/fonts/BeVietnamPro-Regular.ttf` — 132,948 bytes, magic `00010000` (TrueType static)
- `public/fonts/BeVietnamPro-Bold.ttf` — 140,300 bytes, magic `00010000`
- `public/fonts/BeVietnamPro-Italic.ttf` — 137,244 bytes, magic `00010000`

### lib/pdf (Task 2)

- `lib/pdf/fonts.ts` — `registerPdfFonts()` exports; module-level `let registered = false` guard; `Font.register({ family: 'Be Vietnam Pro', fonts: [...] })` 3 weights via absolute paths from `process.cwd()`; `Font.registerHyphenationCallback((word) => [word])` to disable hyphenation for Vietnamese
- `lib/pdf/templates/OfficialDocument.tsx` — `SMOKE_STRING` constant (covers all Vietnamese diacritic combinations), `OfficialDocumentProps` type, `OfficialDocument()` component rendering A4 Quyết định mẫu with: header 2-cột (BỘ CÔNG THƯƠNG + CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM), QUYẾT ĐỊNH centered uppercase, "Về việc ... " subtitle, 3 căn cứ paragraphs (NĐ 28/2018/NĐ-CP, QĐ 1387/QĐ-BCT), Điều 1/2/3, Nơi nhận block trái, signature block phải (KT. CỤC TRƯỞNG / PHÓ CỤC TRƯỞNG), watermark BẢN MẪU diagonal -30deg rgba(220, 38, 38, 0.15) `fixed` positioning
- `lib/pdf/render.ts` — `renderOfficialDocumentPdf(props): Promise<Buffer>` wrapper calling `registerPdfFonts()` then `renderToBuffer(createElement(OfficialDocument, props))`

### App routes (Task 3)

- `app/api/pdf/spike/route.ts` — `export const runtime = 'nodejs'` + `export const dynamic = 'force-dynamic'`; GET handler with try/catch, calls renderOfficialDocumentPdf with smoke props, returns `new NextResponse(uint8Array, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="quyet-dinh-mau-spike.pdf"', 'Content-Length': ..., 'Cache-Control': 'no-store' } })`; 500 JSON on error
- `app/test-pdf/page.tsx` — Public page outside route groups (no auth required per T-06-01); Card layout with FileText icon title, description, amber-50 smoke test checklist box, primary button "Mở/tải PDF mẫu" link to `/api/pdf/spike` `target="_blank"`, secondary button "Quay về đăng nhập" → `/login`, collapsed `<details>` with technical specs

### shadcn (Task 3)

- `components/ui/card.tsx` — shadcn Card primitive (Card, CardHeader, CardTitle, CardContent, CardFooter, CardAction, CardDescription) generated by `npx shadcn add card`

### Sample output (Task 3)

- `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf` — 36,823 bytes sample rendered PDF for retrospective + Phase 7-9 reference

## Decisions Made

- **Font source: Google Fonts upstream GitHub repo** (`raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/`) — first two URLs in fallback chain (bvn-typeface mirror, bettergui mirror) returned HTTP 404 during execution. The Google Fonts repo is the canonical upstream and was always available. Script kept all 3 URLs for resilience.
- **`lib/pdf/render.ts` extension is `.ts` not `.tsx`** per plan's interface contract `<interfaces>` block. To avoid TypeScript JSX parse error, used `React.createElement(OfficialDocument, props)` instead of JSX `<OfficialDocument {...props} />`. Functionally equivalent; future Phase 5/7/9 callers see same export signature.
- **`OfficialDocument.tsx` adds explicit `import * as React from 'react'`** — `tsx` CLI (used by smoke test scripts) defaults to classic JSX transform on `.tsx` files, requiring `React` in scope. Next.js production build uses modern automatic transform and doesn't need this, but the explicit import is a no-op there. Without this import, smoke test failed with `ReferenceError: React is not defined` (Rule 1 auto-fix).
- **shadcn Card installed via CLI** — test page references `Card` components which weren't yet installed (only `button.tsx` existed from Plan 01). Ran `npx shadcn add card` to generate `components/ui/card.tsx`.
- **PDF Buffer → Uint8Array wrapping** — Node `Buffer` is a `Uint8Array` subclass but recent `@types/next` typing for Web `Response` constructor explicitly rejects `Buffer`. Solution: `new Uint8Array(buffer)` before passing to `NextResponse(...)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two of three font fallback URLs returned 404**

- **Found during:** Task 1 (running `download-fonts.mts`)
- **Issue:** Primary URLs `github.com/bettergui/Be-Vietnam-Pro-Font/raw/main/...` and `github.com/bvn-typeface/Be-Vietnam-Pro/raw/master/...` both returned HTTP 404. Plan's recommended sources for Be Vietnam Pro are stale.
- **Fix:** The script's third fallback `raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/...` (Google Fonts upstream repo on GitHub) succeeded. All 3 TTFs downloaded with valid sizes (130-140KB each) and TrueType magic bytes.
- **Files modified:** None code-wise; the script's URL list as-written already handled this case.
- **Verification:** All 3 TTFs downloaded, validated size > 30KB and magic `0x00010000`.
- **Committed in:** `cf5ed5d` (Task 1 commit).

**2. [Rule 3 - Blocking] `lib/pdf/render.ts` JSX parse error with `.ts` extension**

- **Found during:** Task 2 (running `npx tsc --noEmit`)
- **Issue:** Plan specified `lib/pdf/render.ts` (in both `files_modified` frontmatter and `<interfaces>` contract). However, plan's `<action>` body used JSX syntax `<OfficialDocument {...props} />` which requires `.tsx` extension. TypeScript reported `error TS1005: '>' expected.`
- **Fix:** Kept the `.ts` extension (interface contract takes precedence per plan), replaced JSX with equivalent `React.createElement(OfficialDocument, props)` call. Functionally identical; future consumers (Phase 5/7/9) see the same export signature.
- **Files modified:** `lib/pdf/render.ts`
- **Verification:** `npx tsc --noEmit` exit 0; smoke test confirmed render works.
- **Committed in:** `a3afdf9` (Task 2 commit).

**3. [Rule 1 - Bug] `ReferenceError: React is not defined` during programmatic smoke test**

- **Found during:** Task 3 (running `scripts/pdf-smoke-test.mts` via tsx)
- **Issue:** `tsx` CLI's default JSX transform for `.tsx` files is classic (`React.createElement(...)` calls). `OfficialDocument.tsx` did not import React anywhere, so transpiled output had unresolved `React` reference at runtime. Next.js production build worked because Next uses modern automatic JSX transform.
- **Fix:** Added `import * as React from 'react';` at top of `OfficialDocument.tsx`. No-op for Next.js modern transform; required for tsx CLI classic transform.
- **Files modified:** `lib/pdf/templates/OfficialDocument.tsx`
- **Verification:** Smoke test pass `SMOKE TEST PASSED` with 36823 bytes + `%PDF-` header.
- **Committed in:** `6009e8a` (Task 3 commit).

**4. [Rule 2 - Missing Critical] shadcn Card component not yet installed**

- **Found during:** Task 3 (writing `app/test-pdf/page.tsx`)
- **Issue:** Plan's `app/test-pdf/page.tsx` template imports `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card` but Plan 01 only installed `button.tsx`. Without Card, page would fail to compile.
- **Fix:** Ran `npx shadcn@latest add card --yes` which generated `components/ui/card.tsx` with all required sub-components.
- **Files modified:** `components/ui/card.tsx` (created)
- **Verification:** `npm run build` pass; `/test-pdf` static page generated.
- **Committed in:** `6009e8a` (Task 3 commit).

**5. [Rule 1 - Bug] NextResponse Buffer typing incompatibility**

- **Found during:** Task 3 (route handler implementation, anticipating)
- **Issue:** Modern `@types/next` Web Response typings reject Node `Buffer` directly even though `Buffer extends Uint8Array`. Without conversion, would emit `Argument of type 'Buffer' is not assignable to parameter of type 'BodyInit | null | undefined'.`
- **Fix:** Wrap buffer with `new Uint8Array(buffer)` before passing to `NextResponse`. Zero-copy view, no allocation.
- **Files modified:** `app/api/pdf/spike/route.ts`
- **Verification:** Build pass; HTTP test returns correct bytes.
- **Committed in:** `6009e8a` (Task 3 commit).

---

**Total deviations:** 5 auto-fixed (3 blocking — Rule 3, 1 missing critical — Rule 2, 1 bug — Rule 1)

**Impact on plan:** All deviations were necessary to make the plan compile and run on this environment (Windows + Node 24 + tsx CLI + Next 15 + modern @types/next). Final outcome 100% matches plan goal — PDF spike renders Quyết định mẫu A4 with full Vietnamese diacritics support via Be Vietnam Pro static TTF.

## Issues Encountered

- **Pre-existing lint warnings in `prisma/seed.ts` and `prisma/seed/helpers.ts`** — `Unexpected console statement` (no-console rule). These are out of scope for Plan 06 (Plan 02 territory). Logged here as deferred — not addressed in this plan.
- **Direct grep for Vietnamese strings in PDF binary returned 0 matches** — expected; PDFs encode text as glyph IDs in subsetted embedded font, not as literal UTF-8 strings. Font reference `BeVietnamPro` confirmed in stream. Visual verification (open PDF in viewer) is the authoritative manual test.
- **PDF size (~36KB) is smaller than plan's expected ~100-200KB** — modern @react-pdf/renderer aggressively subsets fonts to only used glyphs. With our SMOKE_STRING covering ~120 unique Vietnamese characters, the font subset is small. This is correct, expected behavior; not a defect.

## User Setup Required

**Manual UAT recommended before declaring R1 fully mitigated:**

1. Run `npm run dev` (port 3000)
2. Open `http://localhost:3000/test-pdf` in Chrome / Edge
3. Click "Mở/tải PDF mẫu" → PDF opens in browser viewer
4. Verify smoke checklist:
   - [ ] All Vietnamese diacritics render correctly (á à ả ã ạ — ắ ằ ẳ ẵ ặ — ấ ầ ẩ ẫ ậ — đ Đ — ê ô ơ ư — ý ỳ ỷ ỹ ỵ) — NO □ squares, NO ? question marks
   - [ ] Header 2-cột with BỘ CÔNG THƯƠNG (left) and CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM (right) — Độc lập - Tự do - Hạnh phúc subline visible
   - [ ] "QUYẾT ĐỊNH" centered uppercase 16px bold
   - [ ] Watermark "BẢN MẪU" diagonal red alpha visible behind text
   - [ ] Signature block right side: "KT. CỤC TRƯỞNG" + "PHÓ CỤC TRƯỞNG" + "Nguyễn Văn An"
   - [ ] "Nơi nhận:" + "- Như Điều 3;" + "- Lưu: VT, XTTM." on left
   - [ ] Nghị định 28/2018/NĐ-CP reference visible in căn cứ paragraph
5. (Optional) Open same PDF in Adobe Reader / Foxit if available — PDF 2.0 Adobe is strictest test for embedded font correctness.

If any diacritic breaks visually → would indicate font registration issue or wrong TTF variant; investigate by re-running `scripts/download-fonts.mts` and checking magic bytes.

## Next Phase Readiness

**Phase 5 (M2.3 PROJ-16 in PDF đề án) ready:**
- Import `renderOfficialDocumentPdf` from `@/lib/pdf/render`
- Pass props: `{ documentNumber: project.code, signedDate: ..., title: project.title, body: project.summary, signerTitle: ..., signerName: ... }`
- Or fork `OfficialDocument` → `ProjectSummaryDocument` if layout differs significantly

**Phase 7 (M3 APPROVE-03 tờ trình PDF, APPROVE-06 quyết định phê duyệt PDF) ready:**
- Same wrapper, real DB-driven data instead of SMOKE_STRING
- Wrap route handler with `auth()` check (T-06-01 mitigation deferred to Phase 7)
- Sign date from `Decision.signedAt` field (Plan 02 schema)

**Phase 9 (M5 ACCEPT-02 biên bản nghiệm thu PDF) ready:**
- May fork OfficialDocument template if biên bản layout differs significantly (multi-section format)
- Same `renderOfficialDocumentPdf` style wrapper for consistency

**No blockers.** Phase 1 Plan 06 complete; Plan 03 (NextAuth) is next in sequence.

## Threat Mitigation Status

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-06-01 (I — public spike) | accept | Spike serves placeholder + watermark; no real user data. Phase 5+ will wrap with auth(). ✓ |
| T-06-02 (T — font integrity) | mitigate | Fonts downloaded from Google Fonts upstream repo (canonical source); magic bytes verified `0x00010000` static TTF; size > 30KB sanity check; committed to repo (no runtime fetch). ✓ |
| T-06-03 (D — repeated register) | mitigate | `let registered = false` module-level guard; `registerPdfFonts()` early-return if already registered. Verified by warm test (54ms warm vs 186ms cold). ✓ |
| T-06-04 (I — path traversal) | mitigate | `Font.register` uses `path.join(process.cwd(), 'public', 'fonts', filename)` with static literal filenames; no user input concatenation. ✓ |
| T-06-05 (T — XSS smoke) | accept | Smoke string is a static literal; PDF rendering executes no JS. ✓ |
| T-06-06 (I — metadata leak) | accept | Default react-pdf metadata; M0 has no sensitive content. ✓ |
| T-06-07 (D — large font first req) | accept | First render 186ms, warm 54-85ms — acceptable; subsetting reduces embed to ~20KB per PDF. ✓ |

## Self-Check

Verifying claims before completion.

**Files created:**

- FOUND: `scripts/download-fonts.mts`
- FOUND: `scripts/pdf-smoke-test.mts`
- FOUND: `public/fonts/BeVietnamPro-Regular.ttf` (132,948 bytes)
- FOUND: `public/fonts/BeVietnamPro-Bold.ttf` (140,300 bytes)
- FOUND: `public/fonts/BeVietnamPro-Italic.ttf` (137,244 bytes)
- FOUND: `lib/pdf/fonts.ts`
- FOUND: `lib/pdf/templates/OfficialDocument.tsx`
- FOUND: `lib/pdf/render.ts`
- FOUND: `app/api/pdf/spike/route.ts`
- FOUND: `app/test-pdf/page.tsx`
- FOUND: `components/ui/card.tsx`
- FOUND: `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf` (36,823 bytes)

**Commits:**

- FOUND: `cf5ed5d` (Task 1 — fonts download)
- FOUND: `a3afdf9` (Task 2 — lib/pdf foundation)
- FOUND: `6009e8a` (Task 3 — API route + test page + smoke test)

**Behavioral smoke tests passed:**

- Programmatic render: `36823 bytes`, `%PDF-` magic, 186ms cold / 54-85ms warm ✓
- HTTP E2E: `200 OK`, `Content-Type: application/pdf`, `Content-Length: 36772`, ~75ms total ✓
- Font reference `BeVietnamPro` present in PDF stream ✓
- TTF magic bytes `0x00010000` (TrueType static) for all 3 weights ✓
- Idempotency: re-running `scripts/download-fonts.mts` skips existing files ✓
- `npm run build` exit 0 (5 static pages + dynamic /api/pdf/spike route) ✓
- `npx tsc --noEmit` exit 0 ✓

## Self-Check: PASSED

---

*Phase: 01-m0-bootstrap-h-t-ng*
*Completed: 2026-04-30*
*R1 PDF Vietnamese CRITICAL pitfall — programmatic mitigation complete; manual UAT visual verification pending user.*
