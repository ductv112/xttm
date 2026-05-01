---
phase: 01-m0-bootstrap-h-t-ng
plan: 06
type: execute
wave: 2
depends_on: [01]
files_modified:
  - public/fonts/BeVietnamPro-Regular.ttf
  - public/fonts/BeVietnamPro-Bold.ttf
  - public/fonts/BeVietnamPro-Italic.ttf
  - lib/pdf/fonts.ts
  - lib/pdf/templates/OfficialDocument.tsx
  - lib/pdf/render.ts
  - app/api/pdf/spike/route.ts
  - app/test-pdf/page.tsx
  - scripts/download-fonts.mts
autonomous: true
requirements:
  - AUTH-07
user_setup: []
must_haves:
  truths:
    - "Be Vietnam Pro static TTF (Regular, Bold, Italic) đã download vào public/fonts/ — KHÔNG dùng variable font"
    - "@react-pdf/renderer Font.register thành công cho 3 weight"
    - "lib/pdf/templates/OfficialDocument.tsx render Quyết định mẫu A4 với layout công văn 2 cột (BỘ CT + Quốc hiệu) + body uppercase 'QUYẾT ĐỊNH' + paragraph smoke string đầy đủ dấu + watermark 'BẢN MẪU' diagonal red alpha + signature block phải"
    - "GET /api/pdf/spike trả về Content-Type application/pdf + file size > 30KB (font embedded)"
    - "Render PDF bằng curl + open file local → đọc được toàn bộ chữ Việt có dấu (smoke string đầy đủ ở (á à ả ã ạ, ă, â, đ, ê, ô, ơ, ư, dấu mũ, móc) không vỡ"
    - "Trang /test-pdf có button 'Tải PDF mẫu' click → download PDF"
  artifacts:
    - path: "public/fonts/BeVietnamPro-Regular.ttf"
      provides: "Be Vietnam Pro Regular static TTF (KHÔNG variable font axis)"
      contains: ""
    - path: "public/fonts/BeVietnamPro-Bold.ttf"
      provides: "Be Vietnam Pro Bold static TTF"
      contains: ""
    - path: "public/fonts/BeVietnamPro-Italic.ttf"
      provides: "Be Vietnam Pro Italic static TTF"
      contains: ""
    - path: "lib/pdf/fonts.ts"
      provides: "Font.register() cho 3 weight, dùng absolute path từ process.cwd() public/fonts"
      exports: ["registerPdfFonts"]
    - path: "lib/pdf/templates/OfficialDocument.tsx"
      provides: "JSX template cho Quyết định mẫu — layout 2-col header, body, watermark, signature"
      exports: ["OfficialDocument", "SMOKE_STRING"]
    - path: "lib/pdf/render.ts"
      provides: "renderToBuffer wrapper với font registration"
      exports: ["renderOfficialDocumentPdf"]
    - path: "app/api/pdf/spike/route.ts"
      provides: "GET handler trả PDF buffer Content-Disposition attachment"
      exports: ["GET"]
    - path: "app/test-pdf/page.tsx"
      provides: "Trang test PDF với link tải"
      exports: ["default TestPdfPage"]
  key_links:
    - from: "lib/pdf/render.ts"
      to: "lib/pdf/fonts.ts registerPdfFonts"
      via: "registration trước renderToBuffer"
      pattern: "registerPdfFonts"
    - from: "lib/pdf/templates/OfficialDocument.tsx"
      to: "Be Vietnam Pro family"
      via: "Font.register family name"
      pattern: "fontFamily.*Be Vietnam Pro"
    - from: "app/api/pdf/spike/route.ts"
      to: "lib/pdf/render.ts"
      via: "render PDF buffer to Response"
      pattern: "renderOfficialDocumentPdf"
---

<objective>
PDF spike (research SUMMARY R1 CRITICAL) — render Quyết định mẫu Vietnamese với @react-pdf/renderer + Be Vietnam Pro static TTF + watermark. Đây là smoke test quan trọng nhất cho M0 vì nếu thất bại ở Phase 1, sẽ trượt nguyên Phase 7 (M3 Tờ trình + Quyết định phê duyệt PDF) và Phase 9 (M5 Biên bản nghiệm thu PDF) — tốn 5-10x sửa lúc đó.

Purpose:
- Verify @react-pdf/renderer (frozen Plan 01) thực sự render được tiếng Việt với dấu đầy đủ
- Verify Be Vietnam Pro static TTF download + register thành công (variable font sẽ vỡ — research STACK §5 lock)
- Verify layout công văn 2 cột chuẩn nhà nước (header BỘ CT + Quốc hiệu) renderable
- Verify watermark diagonal "BẢN MẪU" hiển thị đúng (cảnh báo "đây là demo, không phải văn bản thật")
- Cung cấp template `OfficialDocument.tsx` foundation để Phase 7-9 tái dùng cho Quyết định / Tờ trình / Biên bản nghiệm thu
- Cung cấp `renderOfficialDocumentPdf()` helper foundation cho Phase 5 (M2.3 in PDF đề án) và sau

Output:
- 3 file TTF Be Vietnam Pro static (~70-100KB each) trong public/fonts/
- lib/pdf/{fonts.ts, render.ts, templates/OfficialDocument.tsx} foundation
- API route GET /api/pdf/spike trả về PDF
- Trang test-pdf với button download
- File output verifiable: open trong Chrome PDF viewer + Adobe Reader → toàn bộ smoke string render đúng dấu
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/research/SUMMARY.md
@.planning/research/STACK.md
@.planning/research/PITFALLS.md
@.planning/research/ARCHITECTURE.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-01-repo-init-PLAN.md
</context>

<interfaces>
<!-- Plan 06 produces these foundation pieces; Phases 5, 7, 9 will reuse. -->

```typescript
// lib/pdf/fonts.ts — MUST export
export function registerPdfFonts(): void;
// Idempotent — safe to call multiple times. Calls Font.register({ family: 'Be Vietnam Pro', fonts: [...] }) with absolute file paths.

// lib/pdf/templates/OfficialDocument.tsx — MUST export
export const SMOKE_STRING: string;
// Vietnamese chuỗi smoke đầy đủ dấu — researched per PITFALLS §1.1.

export type OfficialDocumentProps = {
  documentNumber: string;        // "12/QĐ-XTTM"
  signedDate: Date;              // for "Hà Nội, ngày DD tháng MM năm YYYY"
  title: string;                 // "Phê duyệt đề án xúc tiến thương mại quốc gia năm 2026"
  body: string;                  // main paragraph
  signerTitle: string;           // "KT. CỤC TRƯỞNG\nPHÓ CỤC TRƯỞNG"
  signerName: string;            // "Nguyễn Văn A"
  watermark?: string;            // default 'BẢN MẪU'
};
export function OfficialDocument(props: OfficialDocumentProps): JSX.Element;

// lib/pdf/render.ts — MUST export
export async function renderOfficialDocumentPdf(props: OfficialDocumentProps): Promise<Buffer>;
```

For Phases 5/7/9 the executor will:
- Import `OfficialDocument` template
- Pass project/decision/acceptance data via props
- Call `renderOfficialDocumentPdf(props)` from a Route Handler
- Return `new Response(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': '...' } })`
</interfaces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → /api/pdf/spike | Public endpoint trong M0 spike (no auth gate) — Plan 06 limit scope |
| Server → public/fonts/ | Server-side font file read via fs/promises absolute path |
| Server → @react-pdf/renderer | Pure server-side render (Node runtime) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-01 | I (Information Disclosure) | /api/pdf/spike public access | accept | M0 spike route serves placeholder content (smoke text + "BẢN MẪU" watermark — không có user data thật). Phase 5+ sẽ wrap PDF routes với `auth()` check trước khi render. M0 không expose real document. |
| T-06-02 | T (Tampering) | Font file integrity | mitigate | Font TTF download từ official Google Fonts CDN (https://fonts.gstatic.com/s/bevietnampro/...) HOẶC Fontsource CDN. Verify file size ~70-100KB cho mỗi weight. KHÔNG download từ untrusted source. Commit TTF files vào repo (NOT runtime fetch — tránh CORS / 404 PITFALLS §1.1). |
| T-06-03 | D (Denial of Service) | Font register repeated overhead | mitigate | `registerPdfFonts()` idempotent — set guard variable `_registered` để chỉ run 1 lần per process lifetime. Tránh re-register mỗi request. |
| T-06-04 | I | Path traversal khi load font | mitigate | `Font.register({ src: ... })` dùng absolute path từ `path.join(process.cwd(), 'public', 'fonts', filename)`. KHÔNG concat user input vào path. Filenames are static literals. |
| T-06-05 | T | XSS qua smoke string | accept | Smoke string là static literal trong template, không phải user input. PDF rendering không expose JavaScript execution context — react-pdf renders via PDF spec, không browser. |
| T-06-06 | I | PDF metadata leak | accept | @react-pdf/renderer set default metadata (creator: react-pdf, producer: PDFKit). M0 không sensitive — Phase 7 sẽ override metadata cho real Quyết định nếu cần. |
| T-06-07 | D | Large font file slow first request | accept | Font file ~80KB × 3 = 240KB total embed vào mỗi PDF. First render takes ~500ms-1s on cold start. Subsequent fast (font cache trong process). Acceptable for POC; production sẽ font subset only used glyphs. |
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Download Be Vietnam Pro static TTF (Regular + Bold + Italic) vào public/fonts/</name>
  <files>public/fonts/BeVietnamPro-Regular.ttf, public/fonts/BeVietnamPro-Bold.ttf, public/fonts/BeVietnamPro-Italic.ttf, scripts/download-fonts.mts</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §5 (PDF font setup, lý do dùng static TTF không variable)
    - d:/Thaodnp/XTTM/.planning/research/PITFALLS.md §1.1 (PDF Vietnamese diacritics — convention)
    - d:/Thaodnp/XTTM/public/fonts/.gitkeep (Plan 01 — verify thư mục tồn tại)
  </read_first>
  <action>
**Bước 1: Tạo `scripts/download-fonts.mts`** — script idempotent download fonts:
```typescript
import { writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';

const FONTS_DIR = join(process.cwd(), 'public', 'fonts');

const FONT_URLS = {
  'BeVietnamPro-Regular.ttf':
    'https://github.com/bvn-typeface/Be-Vietnam-Pro/raw/main/fonts/ttf/BeVietnamPro-Regular.ttf',
  'BeVietnamPro-Bold.ttf':
    'https://github.com/bvn-typeface/Be-Vietnam-Pro/raw/main/fonts/ttf/BeVietnamPro-Bold.ttf',
  'BeVietnamPro-Italic.ttf':
    'https://github.com/bvn-typeface/Be-Vietnam-Pro/raw/main/fonts/ttf/BeVietnamPro-Italic.ttf',
};

const FALLBACK_URLS = {
  'BeVietnamPro-Regular.ttf':
    'https://fonts.gstatic.com/s/bevietnampro/v11/QdVPSTAyLFyeg_IDWvOJmVES_HRUBX8YYbAyR_w.ttf',
  'BeVietnamPro-Bold.ttf':
    'https://fonts.gstatic.com/s/bevietnampro/v11/QdVKSTAyLFyeg_IDWvOJmVES_HwyPbwymrAyR_w.ttf',
  'BeVietnamPro-Italic.ttf':
    'https://fonts.gstatic.com/s/bevietnampro/v11/QdVPSTAyLFyeg_IDWvOJmVES_HRUFn8aZbAyR_w.ttf',
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, destination: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destination, buffer);
  return buffer.length;
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });

  for (const [filename, primaryUrl] of Object.entries(FONT_URLS)) {
    const dest = join(FONTS_DIR, filename);
    if (await fileExists(dest)) {
      console.log(`✓ Already exists: ${filename}`);
      continue;
    }

    let size = 0;
    try {
      size = await downloadFile(primaryUrl, dest);
      console.log(`✓ Downloaded ${filename} from primary (${(size / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.warn(`⚠ Primary failed for ${filename}: ${(err as Error).message}. Trying fallback...`);
      const fallback = FALLBACK_URLS[filename as keyof typeof FALLBACK_URLS];
      size = await downloadFile(fallback, dest);
      console.log(`✓ Downloaded ${filename} from fallback (${(size / 1024).toFixed(1)}KB)`);
    }

    if (size < 30_000) {
      throw new Error(`Font file ${filename} too small (${size} bytes). Likely corrupted.`);
    }
  }

  console.log('🎉 Font download complete.');
}

main().catch((err) => {
  console.error('❌ Font download failed:', err);
  process.exit(1);
});
```

**Bước 2: Run script:**
```bash
cd d:/Thaodnp/XTTM
npx tsx scripts/download-fonts.mts
```

Expected output:
```
✓ Downloaded BeVietnamPro-Regular.ttf from primary (XX.XKB)
✓ Downloaded BeVietnamPro-Bold.ttf from primary (XX.XKB)
✓ Downloaded BeVietnamPro-Italic.ttf from primary (XX.XKB)
🎉 Font download complete.
```

**Bước 3: Add fonts to git (commit)** — TTF files là static asset, OK to commit per UI-SPEC §Design System lock + STACK §5 ("Đặt file TTF ở: public/fonts/ Next.js serve tĩnh"):
```bash
git add public/fonts/*.ttf
```
Note: TTF files ~70-100KB mỗi file, total ~250KB cho 3 weights. Acceptable cho repo POC.

**Bước 4: Verify TTF không phải variable font** — variable font có "wght@100..900" axis trong file. Static TTF chỉ có 1 weight specific:
```bash
# Check TTF header byte signature (file should start with 0x00010000 or 0x4F54544F)
xxd public/fonts/BeVietnamPro-Regular.ttf | head -1
# Expected: 00000000: 0001 0000 ... (TrueType) or 4f54 544f ... (OpenType-CFF)
```
Nếu file bắt đầu với "wOFF" (WOFF) hay "wOF2" (WOFF2) → SAI, react-pdf không support. Tải lại TTF.

**Bước 5: Verify font weight bằng cách load trong Node (không decode glyph, chỉ parse table):**
```bash
node --input-type=module -e "
import { readFile } from 'fs/promises';
const buf = await readFile('public/fonts/BeVietnamPro-Regular.ttf');
console.log('Size:', buf.length, 'Header:', buf.slice(0, 4).toString('hex'));
process.exit(buf.length > 30000 ? 0 : 1);
"
```
Expected: `Header: 00010000` (TrueType), size > 30KB.

**Lưu ý:**
- Nếu primary URL fail (GitHub raw có thể rate-limit), fallback Google Fonts CDN sẽ work. Plan 06 có 2 source.
- Nếu CẢ 2 source đều fail (rare, cần internet), fallback strategy: user tải manual từ https://fonts.google.com/specimen/Be+Vietnam+Pro tab "Static" (Regular 400, Bold 700, Italic 400) → đặt vào `public/fonts/`.
- Filename phải EXACTLY `BeVietnamPro-Regular.ttf`, `BeVietnamPro-Bold.ttf`, `BeVietnamPro-Italic.ttf` — Task 2 sẽ register theo tên này.
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f scripts/download-fonts.mts &amp;&amp;
      npx tsx scripts/download-fonts.mts &amp;&amp;
      test -f public/fonts/BeVietnamPro-Regular.ttf &amp;&amp;
      test -f public/fonts/BeVietnamPro-Bold.ttf &amp;&amp;
      test -f public/fonts/BeVietnamPro-Italic.ttf &amp;&amp;
      [ $(stat -c%s public/fonts/BeVietnamPro-Regular.ttf 2>/dev/null || stat -f%z public/fonts/BeVietnamPro-Regular.ttf) -gt 30000 ] &amp;&amp;
      [ $(stat -c%s public/fonts/BeVietnamPro-Bold.ttf 2>/dev/null || stat -f%z public/fonts/BeVietnamPro-Bold.ttf) -gt 30000 ] &amp;&amp;
      [ $(stat -c%s public/fonts/BeVietnamPro-Italic.ttf 2>/dev/null || stat -f%z public/fonts/BeVietnamPro-Italic.ttf) -gt 30000 ]
    </automated>
  </verify>
  <acceptance_criteria>
    - `scripts/download-fonts.mts` exists, has primary + fallback URLs, has size validation > 30KB
    - 3 TTF files exist trong `public/fonts/`: `BeVietnamPro-Regular.ttf`, `BeVietnamPro-Bold.ttf`, `BeVietnamPro-Italic.ttf`
    - Each TTF file size > 30,000 bytes (typically 70-100KB) — validates not empty/corrupted
    - TTF files start with magic bytes `0x00010000` (TrueType) — verified bằng xxd hoặc Node Buffer slice
    - Re-running script không fail (idempotent — skips already-downloaded files)
    - Files committed to git (`git ls-files public/fonts/*.ttf` returns 3 lines after staging)
  </acceptance_criteria>
  <done>
    Be Vietnam Pro static TTF (3 weights) downloaded vào public/fonts/, file size validated, idempotent download script. KHÔNG variable font (PDF 2.0 không support). Sẵn sàng cho Task 2 register vào react-pdf.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: lib/pdf foundation — fonts.ts register + render.ts wrapper + OfficialDocument.tsx template với smoke string + watermark + signature block</name>
  <files>lib/pdf/fonts.ts, lib/pdf/render.ts, lib/pdf/templates/OfficialDocument.tsx</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §5 (PDF generation pattern, font register code sample)
    - d:/Thaodnp/XTTM/.planning/research/ARCHITECTURE.md §11 (PDF strategy, structure features/pdf/)
    - d:/Thaodnp/XTTM/.planning/research/PITFALLS.md §1.1 (smoke string Việt với mọi dấu), §1.5 (layout công văn nhà nước)
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (§PDF Spike Contract — exact layout requirements)
    - d:/Thaodnp/XTTM/lib/format.ts (Plan 01 — formatDateLong cho dòng "Hà Nội, ngày XX tháng XX năm YYYY")
    - d:/Thaodnp/XTTM/public/fonts/BeVietnamPro-Regular.ttf (Task 1 — exists)
  </read_first>
  <action>
**File 1: `lib/pdf/fonts.ts`** — Idempotent font registration:
```typescript
import { Font } from '@react-pdf/renderer';
import { join } from 'path';

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;

  const fontsDir = join(process.cwd(), 'public', 'fonts');

  Font.register({
    family: 'Be Vietnam Pro',
    fonts: [
      { src: join(fontsDir, 'BeVietnamPro-Regular.ttf'), fontWeight: 'normal' },
      { src: join(fontsDir, 'BeVietnamPro-Bold.ttf'), fontWeight: 'bold' },
      { src: join(fontsDir, 'BeVietnamPro-Italic.ttf'), fontWeight: 'normal', fontStyle: 'italic' },
    ],
  });

  // Disable hyphenation for Vietnamese (default react-pdf hyphenates English words)
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
```

**File 2: `lib/pdf/templates/OfficialDocument.tsx`** — JSX template Quyết định mẫu:
```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export const SMOKE_STRING =
  'Phê duyệt đề án Xúc tiến Thương mại Quốc gia năm 2026 do Hiệp hội Dệt may Việt Nam (VITAS) chủ trì, ' +
  'với các nội dung chủ yếu sau đây: thẩm định, phê duyệt, ký kết hợp đồng triển khai. ' +
  'Tổng dự toán kinh phí: 2.500.000.000 đồng (Hai tỷ năm trăm triệu đồng). ' +
  'Đường dẫn ngắn: tổ chức quản lý chương trình XTTM — Quý IV/2026. ' +
  'Chuỗi smoke kiểm tra dấu: á à ả ã ạ — ắ ằ ẳ ẵ ặ — ấ ầ ẩ ẫ ậ — đ Đ — ê ô ơ ư — Ý ỳ ỷ ỹ ỵ.';

export type OfficialDocumentProps = {
  documentNumber: string;
  signedDate: Date;
  title: string;
  body: string;
  signerTitle: string;
  signerName: string;
  watermark?: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Be Vietnam Pro',
    fontSize: 12,
    padding: 40,
    paddingBottom: 60,
    color: '#0f172a',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 60,
    color: 'rgba(220, 38, 38, 0.15)',
    fontWeight: 'bold',
    transform: 'rotate(-30deg)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerCol: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  headerColLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  headerLine: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubLine: {
    fontSize: 11,
    textAlign: 'center',
  },
  headerItalic: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  separator: {
    width: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    marginTop: 4,
    marginBottom: 4,
  },
  documentNumber: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  dateLine: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  decisionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  decisionAbout: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  body: {
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 12,
  },
  signatureBlock: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureNoiNhan: {
    flexDirection: 'column',
    width: '48%',
  },
  noiNhanLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noiNhanItem: {
    fontSize: 11,
  },
  signatureSigner: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  signerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  signerSpace: {
    height: 60,
  },
  signerName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export function OfficialDocument({
  documentNumber,
  signedDate,
  title,
  body,
  signerTitle,
  signerName,
  watermark = 'BẢN MẪU',
}: OfficialDocumentProps) {
  const dateStr = formatVietnameseDate(signedDate);

  return (
    <Document title={title} author="Cục Xúc tiến Thương mại" creator="XTTMQG POC">
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark} fixed>{watermark}</Text>

        <View style={styles.headerRow}>
          <View style={styles.headerColLeft}>
            <Text style={styles.headerLine}>BỘ CÔNG THƯƠNG</Text>
            <Text style={styles.headerLine}>CỤC XÚC TIẾN THƯƠNG MẠI</Text>
            <View style={styles.separator} />
            <Text style={styles.documentNumber}>Số: {documentNumber}</Text>
          </View>
          <View style={styles.headerCol}>
            <Text style={styles.headerLine}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
            <Text style={styles.headerSubLine}>Độc lập - Tự do - Hạnh phúc</Text>
            <View style={styles.separator} />
            <Text style={styles.dateLine}>{dateStr}</Text>
          </View>
        </View>

        <Text style={styles.decisionTitle}>QUYẾT ĐỊNH</Text>
        <Text style={styles.decisionAbout}>Về việc {title.toLowerCase()}</Text>

        <Text style={styles.body}>
          CỤC TRƯỞNG CỤC XÚC TIẾN THƯƠNG MẠI
        </Text>
        <Text style={styles.body}>
          Căn cứ Nghị định số 28/2018/NĐ-CP ngày 01 tháng 3 năm 2018 của Chính phủ quy định chi tiết
          Luật Quản lý ngoại thương về một số biện pháp phát triển ngoại thương;
        </Text>
        <Text style={styles.body}>
          Căn cứ Quyết định số 1387/QĐ-BCT ngày 25 tháng 5 năm 2017 của Bộ trưởng Bộ Công Thương
          quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Cục Xúc tiến Thương mại;
        </Text>
        <Text style={styles.body}>
          Xét đề nghị của Trưởng phòng Quản lý Chương trình Xúc tiến Thương mại Quốc gia,
        </Text>
        <Text style={[styles.body, { fontWeight: 'bold', marginTop: 12 }]}>
          QUYẾT ĐỊNH:
        </Text>

        <Text style={styles.body}>
          <Text style={{ fontWeight: 'bold' }}>Điều 1.</Text> {body}
        </Text>

        <Text style={styles.body}>
          <Text style={{ fontWeight: 'bold' }}>Điều 2.</Text> Quyết định này có hiệu lực kể từ ngày ký.
        </Text>

        <Text style={styles.body}>
          <Text style={{ fontWeight: 'bold' }}>Điều 3.</Text> Chánh Văn phòng Cục, Trưởng các phòng,
          ban thuộc Cục và đơn vị chủ trì có liên quan chịu trách nhiệm thi hành Quyết định này.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureNoiNhan}>
            <Text style={styles.noiNhanLabel}>Nơi nhận:</Text>
            <Text style={styles.noiNhanItem}>- Như Điều 3;</Text>
            <Text style={styles.noiNhanItem}>- Lưu: VT, XTTM.</Text>
          </View>
          <View style={styles.signatureSigner}>
            {signerTitle.split('\n').map((line, idx) => (
              <Text key={idx} style={styles.signerTitle}>{line}</Text>
            ))}
            <View style={styles.signerSpace} />
            <Text style={styles.signerName}>{signerName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function formatVietnameseDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;
}
```

**File 3: `lib/pdf/render.ts`** — Wrapper renderToBuffer + register guard:
```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { OfficialDocument, type OfficialDocumentProps } from './templates/OfficialDocument';
import { registerPdfFonts } from './fonts';

export async function renderOfficialDocumentPdf(
  props: OfficialDocumentProps,
): Promise<Buffer> {
  registerPdfFonts();
  const buffer = await renderToBuffer(<OfficialDocument {...props} />);
  return buffer;
}
```

**Lưu ý visual lock với UI-SPEC §PDF Spike Contract:**
- Document type: "Quyết định mẫu" (1 trang A4) ✓
- Layout 2 cột header (BỘ CT trái + Quốc hiệu phải) ✓
- "QUYẾT ĐỊNH" centered uppercase 16px bold ✓
- Body có smoke string đầy đủ dấu (verified bằng SMOKE_STRING constant) ✓
- Watermark "BẢN MẪU" diagonal 60px red alpha 0.15 ✓
- Signature block phải với "KT. CỤC TRƯỞNG / PHÓ CỤC TRƯỞNG" + 3 dòng trống + tên placeholder ✓
- Font Be Vietnam Pro Regular cho body, Bold cho heading (2 weights) ✓
- Margins A4 padding 40pt ✓
- Cấu trúc Điều 1, Điều 2, Điều 3 chuẩn công văn ✓
- "Nơi nhận:" + "Lưu: VT, XTTM." ✓
- Căn cứ NĐ 28/2018/NĐ-CP ngày 01/3/2018 ✓
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f lib/pdf/fonts.ts &amp;&amp;
      grep -q 'Font.register' lib/pdf/fonts.ts &amp;&amp;
      grep -q "family: 'Be Vietnam Pro'" lib/pdf/fonts.ts &amp;&amp;
      grep -q 'BeVietnamPro-Regular.ttf' lib/pdf/fonts.ts &amp;&amp;
      grep -q 'BeVietnamPro-Bold.ttf' lib/pdf/fonts.ts &amp;&amp;
      grep -q 'BeVietnamPro-Italic.ttf' lib/pdf/fonts.ts &amp;&amp;
      grep -q 'registered = true' lib/pdf/fonts.ts &amp;&amp;
      grep -q 'registerHyphenationCallback' lib/pdf/fonts.ts &amp;&amp;
      test -f lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'export const SMOKE_STRING' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'á à ả ã ạ' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'đ Đ' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'BỘ CÔNG THƯƠNG' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'CỤC XÚC TIẾN THƯƠNG MẠI' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'Độc lập - Tự do - Hạnh phúc' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'QUYẾT ĐỊNH' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'Nơi nhận' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'Lưu: VT, XTTM' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'Nghị định số 28/2018/NĐ-CP' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q "fontFamily: 'Be Vietnam Pro'" lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q "transform: 'rotate(-30deg)'" lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      grep -q 'rgba(220, 38, 38, 0.15)' lib/pdf/templates/OfficialDocument.tsx &amp;&amp;
      test -f lib/pdf/render.ts &amp;&amp;
      grep -q 'renderToBuffer' lib/pdf/render.ts &amp;&amp;
      grep -q 'registerPdfFonts()' lib/pdf/render.ts &amp;&amp;
      grep -q 'export async function renderOfficialDocumentPdf' lib/pdf/render.ts &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `lib/pdf/fonts.ts` exports `registerPdfFonts()` idempotent (uses `registered` boolean guard)
    - `Font.register` registers family `'Be Vietnam Pro'` với 3 weights: normal, bold, italic (italic uses `fontStyle: 'italic'`)
    - Font src paths use `path.join(process.cwd(), 'public', 'fonts', filename)` (absolute, không relative)
    - `Font.registerHyphenationCallback` set to identity (không hyphenate Vietnamese)
    - `lib/pdf/templates/OfficialDocument.tsx` exports `SMOKE_STRING` chứa exact: `'á à ả ã ạ'`, `'đ Đ'`, `'2.500.000.000 đồng'`
    - `OfficialDocument.tsx` JSX renders: BỘ CÔNG THƯƠNG, CỤC XÚC TIẾN THƯƠNG MẠI, CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM, Độc lập - Tự do - Hạnh phúc, QUYẾT ĐỊNH, Điều 1, Điều 2, Điều 3, Nơi nhận, "Lưu: VT, XTTM"
    - Watermark style: position absolute, transform rotate(-30deg), color rgba(220, 38, 38, 0.15), fontSize 60
    - Header reference Nghị định 28/2018/NĐ-CP correctly
    - `lib/pdf/render.ts` exports `renderOfficialDocumentPdf(props)` returning Promise<Buffer>
    - `render.ts` calls `registerPdfFonts()` BEFORE `renderToBuffer`
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    PDF foundation viết xong: fonts.ts idempotent register Be Vietnam Pro 3 weights, OfficialDocument.tsx template với header công văn 2 cột chuẩn nhà nước + watermark BẢN MẪU diagonal red alpha + signature block + Nghị định 28 reference, render.ts wrapper. Phase 5/7/9 sẽ tái dùng.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: API route /api/pdf/spike + trang test-pdf — verify PDF render đúng dấu Việt</name>
  <files>app/api/pdf/spike/route.ts, app/test-pdf/page.tsx</files>
  <read_first>
    - d:/Thaodnp/XTTM/lib/pdf/render.ts (Task 2)
    - d:/Thaodnp/XTTM/lib/pdf/templates/OfficialDocument.tsx (Task 2 — props shape, SMOKE_STRING)
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §13 (xlsx + pdf install — verify @react-pdf/renderer cài đúng)
    - d:/Thaodnp/XTTM/middleware.ts (Plan 03 — verify matcher exclude /api OK)
  </read_first>
  <action>
**File 1: `app/api/pdf/spike/route.ts`** — GET handler render PDF:
```typescript
import { NextResponse } from 'next/server';
import { renderOfficialDocumentPdf } from '@/lib/pdf/render';
import { SMOKE_STRING } from '@/lib/pdf/templates/OfficialDocument';

export const runtime = 'nodejs'; // @react-pdf/renderer chỉ chạy Node, KHÔNG Edge
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buffer = await renderOfficialDocumentPdf({
      documentNumber: '12/QĐ-XTTM',
      signedDate: new Date(),
      title: 'Phê duyệt đề án xúc tiến thương mại quốc gia năm 2026',
      body: SMOKE_STRING,
      signerTitle: 'KT. CỤC TRƯỞNG\nPHÓ CỤC TRƯỞNG',
      signerName: 'Nguyễn Văn An',
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="quyet-dinh-mau-spike.pdf"',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[/api/pdf/spike] render failed:', err);
    return NextResponse.json(
      { error: 'PDF render failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
```

**File 2: `app/test-pdf/page.tsx`** — Trang test với button download:
```tsx
import Link from 'next/link';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'PDF Spike — Quyết định mẫu' };

export default function TestPdfPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex items-start justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-blue-700" />
            PDF Spike — Quyết định mẫu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Trang này dùng để kiểm tra @react-pdf/renderer + Be Vietnam Pro static TTF có render
            đầy đủ dấu tiếng Việt (á à ả ã ạ ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ đ Đ ê ô ơ ư) hay không.
            Đây là spike test bắt buộc của M0 trước khi Phase 7 (M3) build Tờ trình + Quyết định
            phê duyệt PDF chuẩn công văn.
          </p>

          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <strong>Smoke test:</strong> Mở file PDF trong Chrome / Edge / Adobe Reader và kiểm tra
            tất cả ký tự có dấu hiển thị đúng, không bị vỡ thành ô vuông □ hoặc dấu hỏi ?.
          </div>

          <div className="flex flex-row gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/api/pdf/spike" target="_blank" rel="noopener">
                <Download className="mr-2 h-4 w-4" />
                Mở/tải PDF mẫu
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">
                Quay về đăng nhập
              </Link>
            </Button>
          </div>

          <details className="text-xs text-slate-500 pt-4 border-t border-slate-200">
            <summary className="cursor-pointer text-slate-600">Chi tiết kỹ thuật</summary>
            <ul className="list-disc pl-6 pt-2 space-y-1">
              <li>Library: @react-pdf/renderer 4.x (frozen Plan 01)</li>
              <li>Font: Be Vietnam Pro static TTF Regular/Bold/Italic (~250KB total)</li>
              <li>Layout: A4, padding 40pt, header công văn 2 cột chuẩn Bộ CT</li>
              <li>Watermark: "BẢN MẪU" diagonal -30deg, red rgba(220, 38, 38, 0.15)</li>
              <li>Signature block: KT. CỤC TRƯỞNG / PHÓ CỤC TRƯỞNG</li>
              <li>Reference: Nghị định 28/2018/NĐ-CP về quản lý ngoại thương</li>
            </ul>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Lưu ý:**
- `app/test-pdf/page.tsx` đặt OUTSIDE `(app)` route group → KHÔNG có AppShell + KHÔNG yêu cầu auth → public smoke test page. Điều này phù hợp với threat model T-06-01 (M0 spike public, không expose user data).
- Path không bị middleware block (matcher `((?!api/auth|api|_next/static|...))` allow `/test-pdf`).

**Bước 3: Smoke test với production build:**
```bash
cd d:/Thaodnp/XTTM
npm run build
npm run start &amp;
sleep 3

# Test PDF render
curl -sI "http://localhost:3000/api/pdf/spike"
# Expected: HTTP/1.1 200 OK, Content-Type: application/pdf, Content-Length: > 30000

# Save PDF and verify
curl -s -o /tmp/spike.pdf "http://localhost:3000/api/pdf/spike"
ls -la /tmp/spike.pdf
# Expected: file size > 100KB (font embedded + content)

# Verify PDF magic bytes %PDF-
xxd /tmp/spike.pdf | head -1
# Expected: 00000000: 2550 4446 ...  ("%PDF" in ASCII)

# Verify file viewable (manual: open in browser)
# Or use pdftotext nếu available
```

**Bước 4: Stop server sau verify (manual hoặc qua kill).**

**Bước 5: Commit `/tmp/spike.pdf` sample đến `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf` để retrospective + Phase 7 reference:**
```bash
mkdir -p .planning/phases/01-m0-bootstrap-h-t-ng/
cp /tmp/spike.pdf .planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf
```
File ~100-200KB OK to commit (1-time artifact for verification record).
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f "app/api/pdf/spike/route.ts" &amp;&amp;
      grep -q "renderOfficialDocumentPdf" "app/api/pdf/spike/route.ts" &amp;&amp;
      grep -q "Content-Type" "app/api/pdf/spike/route.ts" &amp;&amp;
      grep -q "application/pdf" "app/api/pdf/spike/route.ts" &amp;&amp;
      grep -q "runtime = 'nodejs'" "app/api/pdf/spike/route.ts" &amp;&amp;
      test -f "app/test-pdf/page.tsx" &amp;&amp;
      grep -q "PDF Spike" "app/test-pdf/page.tsx" &amp;&amp;
      grep -q "/api/pdf/spike" "app/test-pdf/page.tsx" &amp;&amp;
      grep -q "Mở/tải PDF mẫu" "app/test-pdf/page.tsx" &amp;&amp;
      npm run build &amp;&amp;
      npx tsc --noEmit &amp;&amp;
      node --input-type=module -e "
import { renderOfficialDocumentPdf } from './lib/pdf/render.js';
import { SMOKE_STRING } from './lib/pdf/templates/OfficialDocument.js';
const buffer = await renderOfficialDocumentPdf({
  documentNumber: '12/QĐ-XTTM',
  signedDate: new Date(),
  title: 'Smoke test',
  body: SMOKE_STRING,
  signerTitle: 'KT. CỤC TRƯỞNG\nPHÓ CỤC TRƯỞNG',
  signerName: 'Nguyễn Văn An',
});
console.log('PDF_SIZE:', buffer.length);
const header = buffer.slice(0, 5).toString();
console.log('PDF_HEADER:', header);
process.exit(buffer.length > 30000 &amp;&amp; header === '%PDF-' ? 0 : 1);
"
    </automated>
  </verify>
  <acceptance_criteria>
    - `app/api/pdf/spike/route.ts` exports `GET` handler, `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`
    - GET handler calls `renderOfficialDocumentPdf` with documentNumber `'12/QĐ-XTTM'`, signedDate `new Date()`, title chuẩn Vietnamese, body = SMOKE_STRING, signerTitle multiline với `KT. CỤC TRƯỞNG\nPHÓ CỤC TRƯỞNG`
    - Response headers: `Content-Type: application/pdf`, `Content-Disposition: inline; filename="quyet-dinh-mau-spike.pdf"`, `Cache-Control: no-store`
    - Error handling: catch block returns 500 JSON với message Vietnamese, console.error log
    - `app/test-pdf/page.tsx` is outside `(app)` and `(auth)` route groups (public, no auth required for spike)
    - Test page has Card với title "PDF Spike — Quyết định mẫu", button link to `/api/pdf/spike`, smoke test checklist text
    - Test page renders smoke checklist list (font, layout, watermark, signature, NĐ 28 reference)
    - `npm run build` exit code 0
    - PDF render programmatic test: buffer size > 30,000 bytes, magic header `%PDF-` (5 ASCII bytes)
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    /api/pdf/spike trả PDF đúng MIME, content-disposition. /test-pdf page có button mở PDF. Programmatic smoke test pass: buffer > 30KB, header %PDF-. Manual UAT (user mở Chrome, click "Mở/tải PDF mẫu"): PDF hiển thị đầy đủ dấu Việt không vỡ, watermark BẢN MẪU diagonal đỏ, layout 2 cột header, signature block. R1 PDF Vietnamese pitfall mitigated cho Phase 7-9.
  </done>
</task>

</tasks>

<verification>
**Phase-level checks (Plan 06):**
1. Font files exist + size > 30KB each
2. `npm run build` exit 0 — production build với PDF route compile thành công
3. Programmatic render test: `renderOfficialDocumentPdf` returns Buffer > 30KB với magic `%PDF-`
4. Manual UAT (user-facing): Open `/test-pdf` → click "Mở/tải PDF mẫu" → PDF download → open trong Chrome PDF viewer + Adobe Reader nếu có:
   - [ ] Toàn bộ smoke string (á à ả ã ạ ăắằẳẵặ ấầẩẫậ đ Đ ê ô ơ ư) render đúng, KHÔNG vỡ
   - [ ] Header công văn 2 cột (BỘ CT trái, Quốc hiệu phải) đúng layout
   - [ ] "QUYẾT ĐỊNH" centered uppercase bold
   - [ ] Watermark "BẢN MẪU" diagonal red alpha hiển thị behind text
   - [ ] Signature block: KT. CỤC TRƯỞNG / PHÓ CỤC TRƯỞNG + tên placeholder ở phải
   - [ ] "Nơi nhận" + "Lưu: VT, XTTM." ở trái
   - [ ] Nghị định 28/2018/NĐ-CP reference hiện trong căn cứ
5. PDF size > 100KB (font embedded properly)
</verification>

<success_criteria>
Plan 06 thành công khi:
- Be Vietnam Pro static TTF (3 weights) downloaded + committed vào public/fonts/
- lib/pdf foundation đầy đủ (fonts.ts idempotent + OfficialDocument.tsx template + render.ts wrapper)
- /api/pdf/spike trả PDF buffer Vietnamese đầy đủ dấu — manual UAT pass với Chrome/Adobe Reader
- /test-pdf page có CTA download cho dev test
- R1 (PDF Vietnamese — CRITICAL) pitfall mitigated: smoke test pass cho M0 → Phase 7-9 có foundation tin cậy
- Phase 5 (M2.3 PROJ-16 in PDF đề án) có thể import OfficialDocument template + props shape
- Phase 7 (M3 APPROVE-03 tờ trình PDF, APPROVE-06 quyết định PDF) có thể tái dùng template với props khác
- Phase 9 (M5 ACCEPT-02 biên bản nghiệm thu PDF) có thể tái dùng
- typecheck + build pass
- AUTH-07 partially satisfied (locale vi-VN render PDF correctly via Be Vietnam Pro Vietnamese subset)
</success_criteria>

<output>
Sau hoàn thành, tạo `.planning/phases/01-m0-bootstrap-h-t-ng/01-06-pdf-spike-SUMMARY.md`:
- Font versions + sources (GitHub primary OR Google Fonts fallback)
- Total font bundle size committed (~250KB cho 3 weights)
- PDF render time on local machine (cold start, warm)
- Sample PDF output `01-06-spike-output.pdf` committed (link)
- Manual UAT result: smoke string render đúng dấu? watermark đúng? layout 2 cột đúng?
- Confirmation Phase 7-9 ready: import path `@/lib/pdf/render` available, `OfficialDocument` template props shape
- R1 (PDF Vietnamese — CRITICAL) pitfall MITIGATED — record cho retrospective
</output>
