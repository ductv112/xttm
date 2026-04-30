# Stack Research — XTTMQG POC

**Domain:** Hệ thống quản lý chương trình quốc gia về Xúc tiến Thương mại (Vietnamese government grant management) — Prototype/POC
**Researched:** 2026-04-30
**Confidence:** HIGH (cho stack chính), MEDIUM (cho lựa chọn thư viện phụ trợ chuyên ngành như PDF tiếng Việt)
**Mục tiêu:** Demo "sign full project" cho Bộ Công Thương / Cục XTTM

> Tài liệu này validate và tinh chỉnh stack đã chốt trong `CLAUDE.md`, đồng thời đưa ra version cụ thể, lý do dùng, và các thư viện phụ trợ bắt buộc cho từng module nghiệp vụ. **Không** đề xuất framework thay thế — Next.js 15 / Tailwind v4 / shadcn / Prisma / NextAuth là dạng "đã chốt".

---

## 1. Recommended Stack — Core (đã chốt, validate version)

| Technology | Version đề xuất | Mục đích | Lý do giữ |
|---|---|---|---|
| **Next.js** | `15.4.x` (hoặc `15.5.x` LTS-style) | Full-stack framework, App Router, Server Actions, Turbopack | Stable từ 10/2024, hỗ trợ React 19, Server Actions GA, ecosystem cực mạnh, dev experience tốt nhất cho POC. **KHÔNG** nâng lên Next 16 ngay vì shadcn/ui và một số plugin Tailwind v4 đang đồng bộ với Next 15 ổn định hơn. |
| **React** | `19.0.x` | UI runtime | Đi kèm Next 15. Server Components + `useActionState` + `useOptimistic` rất hợp với form workflow nghiệp vụ phức tạp. |
| **TypeScript** | `5.7.x` hoặc `5.8.x` | Type safety | Strict mode bắt buộc. Match với Next 15 và Zod 4. |
| **Tailwind CSS** | `4.1.x` (mới nhất `4.2.0` 02/2026) | Styling utility-first | Build nhanh hơn 5x, config bằng CSS (`@import "tailwindcss"`), tích hợp cascade layers. Đã stable từ 01/2025. |
| **shadcn/ui (CLI v4)** | CLI `2.6+` (CLI v4 03/2026) | Component primitives copy-paste | Look "Vercel-grade" 2026, tùy biến cao, không bị lock vendor. Sử dụng `radix-ui` package thống nhất. |
| **Radix UI (unified)** | `radix-ui@1.x` | Accessible primitives | shadcn cần. Từ 02/2026 dùng package `radix-ui` thống nhất thay vì 30+ `@radix-ui/react-*` riêng lẻ → `package.json` sạch. |
| **Lucide React** | `0.460+` | Icon set | shadcn dùng mặc định. Hơn 1500 icon, tree-shakable. |
| **Framer Motion (Motion)** | `motion@12.x` | Micro-animations | Đã đổi tên `framer-motion` → `motion` (npm: `motion`, import `motion/react`). v12 hỗ trợ React 19 đầy đủ. **Chú ý:** dùng `motion` thay cho `framer-motion` cho project mới. |

**Lý do giữ Next.js 15 (không nhảy 16):** Next 16 (cuối 2025) có một số breaking change về caching và Server Actions; ecosystem shadcn/auth/Prisma đang ổn định trên Next 15. POC ưu tiên độ ổn định lúc demo hơn là "bleeding edge".

---

## 2. Forms & Data Layer

| Library | Version | Mục đích | Khi nào dùng |
|---|---|---|---|
| **React Hook Form** | `7.55+` (≥ v8 nếu kết hợp Zod 4 native) | Form state, validation | Mọi form trong app. Bắt buộc cho hero flow (form khai báo đề án 6 bước). |
| **Zod** | `4.x` (subpath import `zod/v4` đã GA, package `zod@4` chính thức cuối 2025) | Schema validation | Mọi input cần validate (form, server action, API). Dùng `z.strictObject()` thay `.strict()`. |
| **@hookform/resolvers** | `4.x` (hỗ trợ Zod 4) | Cầu nối RHF ↔ Zod | Bắt buộc đi kèm RHF + Zod. |
| **TanStack Table** | `8.21+` (v9 chưa GA tính tới 04/2026) | Headless data table | Tất cả list view (đề án, đơn vị, hợp đồng, báo cáo…). Client-side filter/sort cho POC vì dataset nhỏ (10-15 records/loại). |
| **TanStack Query** | `5.99+` | Server state cache | Dùng cùng Server Actions để optimistic update + invalidate cache. **Lưu ý v5 breaking:** `isLoading` → `isPending`, không còn `keepPreviousData` (dùng `placeholderData`). |
| **Zustand** | `5.0+` | UI global state | Sidebar collapse, theme, notifications panel, multi-step form draft persist (qua middleware `persist`). Yêu cầu React 18+. |

### Multi-step form pattern (cho hero flow — đề án 6 bước)

Quyết định: **Tự build wrapper trên React Hook Form + Zod + Zustand**, KHÔNG dùng `react-hook-form-wizard` hay Formik.

**Lý do:**
- `react-hook-form-wizard` không được maintain tốt, ít sao trên GitHub.
- Formik đã ngừng phát triển (last release 2022), thua RHF về performance lẫn DX.
- Pattern chuẩn 2026: 1 form instance RHF + per-step Zod schema, validate `safeParse` trước khi `nextStep`, persist draft vào Zustand `persist` middleware (localStorage). Đây là pattern các shadcn/Tailwind admin template dùng.

**Cấu trúc đề xuất:**
```
components/de-an/multi-step/
├── ProjectFormProvider.tsx      // Context: currentStep, nextStep, prevStep, goTo
├── StepProgressIndicator.tsx    // Stepper + tick state
├── steps/
│   ├── Step1ThongTinChung.tsx
│   ├── Step2MucTieuNoiDung.tsx
│   ├── Step3DuToanKinhPhi.tsx
│   ├── Step4ChuNhiem.tsx
│   ├── Step5TaiLieu.tsx
│   └── Step6XemLaiNop.tsx
└── schemas/
    └── projectSchemas.ts        // step1Schema, step2Schema, ..., fullSchema
```

---

## 3. Database & ORM

| Tech | Version | Mục đích | Lý do |
|---|---|---|---|
| **Prisma ORM** | `6.x` (LTS-stable cho POC), `7.x` available 2026 nhưng caching layer mới chưa cần thiết | ORM type-safe | DX tốt nhất, schema-first, migrate tự động. v6 hỗ trợ JSON + Enum trên SQLite (từ 6.2.0 — quan trọng cho enum trạng thái). |
| **better-sqlite3** | bundle với Prisma | SQLite driver | Prisma quản lý ngầm. |
| **@prisma/client** | match Prisma version | Generated client | Singleton pattern trong `lib/prisma.ts`. |

**Khuyến nghị Prisma version:** Bắt đầu với `prisma@6.6.x` ổn định. Tránh nhảy v7 trừ khi cần caching layer (POC không cần, cache đã ở TanStack Query layer).

**Tránh dùng:**
- `Drizzle ORM` — DX kém hơn cho schema phức tạp với 20+ table có FK chéo nhau như XTTMQG.
- `Sequelize` — outdated, không type-safe.

---

## 4. Authentication & RBAC

| Library | Version | Mục đích | Lý do |
|---|---|---|---|
| **Auth.js (NextAuth v5)** | `next-auth@5.0.0-beta.25+` (v5 stable đã ra 2025) | Auth core | Credentials Provider, JWT session, callbacks `jwt`/`session` để inject `role` + `unitId`. **Phải dùng JWT strategy** (Credentials không hỗ trợ DB session natively). |
| **bcryptjs** | `2.4+` | Hash password | Dùng `bcryptjs` (pure JS) thay vì `bcrypt` (native binding) — tránh issue khi build trên Windows + serverless. |

### RBAC pattern — Quyết định: **Custom permission matrix, KHÔNG dùng CASL.js**

**Lý do KHÔNG dùng CASL:**
- CASL dựa trên class instances → mâu thuẫn với React Server Components (object mutation issues).
- Hydration issue khi dùng Context API trong Next.js App Router.
- Setup phức tạp cho 7 vai trò × 190 chức năng — overhead lớn so với plain object lookup.

**Pattern đề xuất:** Object permission matrix trong `lib/permissions.ts`:

```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  ADMIN: ['user:*', 'role:*', 'catalog:*', 'config:*', 'audit:read'],
  BAN_QL: ['programcycle:*', 'project:receive', 'project:assign', 'tham-dinh:*', 'quyet-dinh:*', 'hop-dong:*', ...],
  CHUYEN_VIEN: ['project:check', 'project:score-prelim'],
  HOI_DONG: ['tham-dinh:score', 'tham-dinh:comment'],
  DON_VI: ['don-vi-chu-tri:self', 'project:create', 'project:edit-own', 'project:submit-own'],
  TAI_CHINH: ['tam-ung:*', 'thanh-toan:*', 'quyet-toan:*'],
  LANH_DAO: ['dashboard:read', 'project:approve-final', 'report:read'],
} as const;

export function can(role: Role, action: string): boolean {
  const perms = PERMISSIONS[role] ?? [];
  return perms.some(p => p === action || p.endsWith(':*') && action.startsWith(p.split(':')[0]));
}
```

Hook + helper:
- `useCan(action)` — client check (UI-only, không bảo mật)
- `requireRole(action)` — server-side guard trong Server Action / Route Handler

**Lưu ý quan trọng:** UI yêu cầu "ma trận phân quyền cấu hình bằng UI, không hardcode" (M1). Vậy 2 layer:
1. **Static role default** trong `permissions.ts` (seed vào DB).
2. **Override trong DB** — bảng `RolePermission` cho phép Admin chỉnh qua UI ma trận. Logic `can()` đọc từ DB (cache qua TanStack Query) thay vì static const.

### Session augmentation

```typescript
// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: { id: string; username: string; role: Role; unitId?: string; }
  }
}
```

`auth.config.ts` callback:
```typescript
callbacks: {
  jwt: async ({ token, user }) => { if (user) { token.role = user.role; token.unitId = user.unitId; } return token; },
  session: async ({ session, token }) => { session.user.role = token.role as Role; session.user.unitId = token.unitId as string; return session; },
}
```

---

## 5. PDF Generation — Quyết định **dứt khoát**

> **DÙNG `@react-pdf/renderer`. KHÔNG dùng jsPDF. KHÔNG dùng pdf-lib (ngoại trừ trường hợp đặc biệt).**

### So sánh

| Library | Vietnamese unicode | API | Layout phức tạp | Bundle | Bảo trì |
|---|---|---|---|---|---|
| **`@react-pdf/renderer`** ✅ | OK với `Font.register()` (TTF static, không dùng variable font) | JSX declarative | Excellent — flexbox layout, page break tự động | ~280KB (chỉ server) | Active, v4.x |
| `jsPDF` ❌ | Phải base64-encode TTF, AddFont thủ công, no flexbox | Imperative `.text(x, y)` | Tệ — phải tự tính toạ độ → khó cho biểu mẫu nhiều trường (tờ trình, biên bản nghiệm thu) | ~250KB (client) | Active nhưng pain với layout |
| `pdf-lib` ⚠️ | Ổn nhưng phải embed font + tự draw mọi text | Low-level | Phải tự build layout engine | ~400KB | Active |

### Lý do `@react-pdf/renderer` thắng cho XTTMQG

1. **Văn bản chính thức (quyết định, tờ trình, biên bản nghiệm thu) có layout dạng "biểu mẫu phức tạp"** — header có Quốc huy, table 2 cột "Số/Ký hiệu | V/v…", danh sách đề án dạng table với rowspan, signature block 3 cột. Flexbox API của react-pdf là khác biệt then chốt.
2. **JSX declarative** giúp dev viết template như component React → review nhanh, dễ chỉnh.
3. **Chạy server-side trong Server Action** → không phải bundle PDF lib vào client.
4. **Font subsetting** — chỉ embed glyph được dùng → file PDF nhỏ.
5. Có thể tái sử dụng cùng JSX cho preview HTML và export PDF.

### Vietnamese font setup

**Bắt buộc:** Đăng ký font có dấu tiếng Việt — KHÔNG dùng built-in font (chỉ ASCII).

```typescript
// lib/pdf/fonts.ts
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Be Vietnam Pro',
  fonts: [
    { src: '/fonts/BeVietnamPro-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/BeVietnamPro-Medium.ttf', fontWeight: 'medium' },
    { src: '/fonts/BeVietnamPro-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/BeVietnamPro-Italic.ttf', fontWeight: 'normal', fontStyle: 'italic' },
  ],
});

// QUAN TRỌNG: KHÔNG dùng variable font (.ttf variable axis) — PDF 2.0 spec không support
// → Tải static instance từ Google Fonts (tab "Static") hoặc fontsource.org
```

**Lựa chọn font:**
- **Be Vietnam Pro** (Google Fonts, OFL license) — neo-grotesk, hợp văn bản chính thức + UI hiện đại. Khuyến nghị #1.
- **Noto Sans Vietnamese** — fallback. Nhưng Noto variable font không dùng được, phải lấy static.
- **Times New Roman/Arial** (đã quen với văn bản hành chính VN) — chỉ dùng nếu khách hàng yêu cầu rõ. Không có sẵn TTF tự do, phải mua hoặc dùng font tương tự (Tinos/Arimo từ Google).

**Đặt file TTF ở:** `public/fonts/` (Next.js serve tĩnh) hoặc `app/fonts/` rồi import buffer.

### Use case mapping

| Văn bản | Module | Layout note |
|---|---|---|
| Tờ trình phê duyệt | M3 — Quyết định phê duyệt | Header CQ + Quốc huy, body 1 cột, table danh sách đề án, signature 2 cột |
| Quyết định phê duyệt | M3 | Format chuẩn nghị định, table kinh phí phê duyệt theo đề án |
| Biên bản nghiệm thu | M5 | Header 2 cột, table chỉ tiêu kết quả, signature 3 cột (đại diện đơn vị, ban QL, đơn vị giám sát) |
| Hợp đồng thực hiện | M4 | Layout khoản/điều, signature 2 cột |
| Hồ sơ đề án in ra | M2 | Multi-page, có TOC, từng tab in ra 1 section |

### Excel export

| Library | Version | Mục đích |
|---|---|---|
| **`xlsx` (SheetJS Community)** | `0.20.x` | Báo cáo Excel danh sách đề án/hợp đồng |
| **`exceljs`** | `4.4.x` (alternative) | Nếu cần style cell, merge, formula → exceljs mạnh hơn xlsx CE |

Khuyến nghị: bắt đầu với `xlsx` cho M6 (export báo cáo dashboard). Nếu cần biểu mẫu Excel chính thức có format theo mẫu Bộ Tài chính → cân nhắc chuyển `exceljs`.

---

## 6. Vietnamese Locale — Date, Number, Currency, Search

### Date library — **Giữ `date-fns` v4**

| Library | Bundle | Vietnamese locale | Tree-shaking | Khuyến nghị |
|---|---|---|---|---|
| **`date-fns@4`** ✅ | ~13KB tree-shaken | `date-fns/locale/vi` | Excellent (named imports) | DÙNG |
| `dayjs@1.11+` | 2KB core + plugin | `dayjs/locale/vi` | Tốt nhưng cần plugin cho mọi tính năng | Không cần thiết, ưu thế bundle nhỏ không quan trọng cho POC server-rendered |

**Khuyến nghị:**
```typescript
// lib/date.ts
import { format, formatDistance, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export const formatDate = (d: Date | string, fmt = 'dd/MM/yyyy') =>
  format(typeof d === 'string' ? parseISO(d) : d, fmt, { locale: vi });

export const formatDateTime = (d: Date | string) =>
  format(typeof d === 'string' ? parseISO(d) : d, "HH:mm 'ngày' dd/MM/yyyy", { locale: vi });

export const formatRelative = (d: Date | string) =>
  formatDistance(typeof d === 'string' ? parseISO(d) : d, new Date(), { locale: vi, addSuffix: true });
// → "2 ngày trước", "trong 5 ngày"
```

Format chuẩn cho hành chính VN: `dd/MM/yyyy`, không dùng `MM/dd/yyyy`.

### Currency / Number — Native `Intl.NumberFormat`

**KHÔNG dùng `numeral.js` hay `accounting.js`** — `Intl.NumberFormat` là native, zero bundle, hỗ trợ `vi-VN` đầy đủ.

```typescript
// lib/format.ts
const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
});

export const formatVND = (n: number) => vndFormatter.format(n); // "150.000.000 ₫"

export const formatVNDCompact = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu`;
  return formatVND(n);
};

const numberFormatter = new Intl.NumberFormat('vi-VN');
export const formatNumber = (n: number) => numberFormatter.format(n); // "150.000"
```

### Vietnamese search — diacritics-insensitive

**Vấn đề:** SQLite `COLLATE NOCASE` chỉ work với ASCII. Search "Da giay" phải match "Da giày", "ho chi minh" phải match "Hồ Chí Minh".

**Giải pháp cho POC (SQLite):** Lưu thêm cột `searchKey` đã normalize, query dùng `LIKE` với input đã strip diacritics.

```typescript
// lib/vi-search.ts
export function removeDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

// Trong Prisma model:
// model Project { name String; searchKey String; ... }
// onCreate/onUpdate: searchKey = removeDiacritics(name + ' ' + code + ' ' + ...)
```

Khi search:
```typescript
const query = removeDiacritics(input);
prisma.project.findMany({ where: { searchKey: { contains: query } } });
```

**Production note:** Khi migrate sang Postgres giai đoạn 2 → dùng extension `unaccent` + GIN index thay vì cột `searchKey`.

---

## 7. File Upload — Local filesystem (POC) → Cloud (Production phase 2)

### Quyết định: **Native Server Actions + `fs/promises`, KHÔNG dùng multer/formidable**

**Lý do:**
- Next.js 15 Server Actions handle `FormData` natively — `multer` không tương thích với App Router.
- POC chạy local nên `fs.writeFile` vào `public/uploads/` đủ dùng và đơn giản.

**Pattern:**
```typescript
// app/(app)/de-an/[id]/_actions/upload.ts
'use server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function uploadProjectFile(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const file = formData.get('file') as File;
  if (!ALLOWED.includes(file.type)) throw new Error('Định dạng file không hợp lệ');
  if (file.size > MAX_SIZE) throw new Error('File vượt quá 20MB');

  const ext = file.name.split('.').pop();
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), 'storage', 'uploads', String(new Date().getFullYear()));
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);

  // Save to DB: Attachment { id, filename, originalName, mimeType, size, path, uploadedBy, uploadedAt }
  return { filename, originalName: file.name, size: file.size };
}
```

**Đặt file ở `storage/uploads/` (gitignored), KHÔNG đặt vào `public/`** — vì `public/` được serve tĩnh không qua middleware → bypass auth check.

**Serve file qua Route Handler có auth:**
```typescript
// app/api/files/[...path]/route.ts
export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  // Validate user has access to this attachment
  // ... read from storage/uploads/ and stream
}
```

**Mock files cho demo:** `public/mock-files/` chứa 2-3 PDF mẫu (1 quyết định mẫu, 1 biên bản, 1 hợp đồng) gán cho nhiều record → demo download hoạt động ngay.

---

## 8. Email Composer — "Gửi thông báo hàng loạt"

### Quyết định: **Tiptap v2** cho rich text editor, **template variable interpolation** custom

**So sánh:**
| Library | Pros | Cons |
|---|---|---|
| **Tiptap v2.x** ✅ | Headless, ProseMirror-based, ecosystem extension lớn (mention, table, image, link), docs xuất sắc | Bundle ~120KB |
| Lexical (Meta) | Performance tốt cho doc lớn, official React | Docs đuối, learning curve cao, overkill cho email POC |
| TinyMCE/CKEditor | Out-of-box | License vấn đề, không headless, lock vendor |
| `react-quill` | Đơn giản | Quill 2 mới ra, ecosystem yếu hơn Tiptap |

### Email composer architecture cho XTTMQG

```
components/email/
├── EmailComposer.tsx              // Tiptap editor + toolbar
├── TemplateSelector.tsx           // Chọn mẫu email (từ M1 — danh mục mẫu văn bản)
├── RecipientPicker.tsx            // Multi-select đơn vị từ danh sách mời
└── VariableMenu.tsx               // Insert {{tenDonVi}}, {{namChuongTrinh}}, {{hanNopDeAn}}, {{maDeAn}}, ...
lib/email/
├── templateEngine.ts              // {{var}} interpolation đơn giản (không cần Handlebars)
└── mockSender.ts                  // Lưu vào DB EmailLog + show inbox
```

**Tiptap extensions cần cài:**
```
@tiptap/react @tiptap/pm @tiptap/starter-kit
@tiptap/extension-link @tiptap/extension-placeholder
@tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

**Mock sending:** POC không gửi email thật → lưu `EmailLog { from, to, subject, htmlBody, sentAt, status: 'mock-sent' }` và hiển thị trong "Inbox thông báo" (M6).

**Render preview:** Tiptap → HTML → preview iframe có style email-safe.

**Use cases:**
- M2.1 — Gửi mời đăng ký đầu năm (BQL → list đơn vị mời)
- M2.4 — Gửi yêu cầu bổ sung hồ sơ
- M3 — Thông báo kết quả phê duyệt
- M4 — Nhắc ký hợp đồng (60 ngày)
- M5 — Nhắc nộp báo cáo (15 ngày)

---

## 9. State Machine — ProgramCycle 7-state + Project lifecycle

### Quyết định: **Plain TypeScript transition table + helper functions, KHÔNG dùng XState**

**Lý do KHÔNG dùng XState v5:**
- XState v5 mạnh nhưng **overkill** cho 7-state machine có transition rules đơn giản.
- Bundle XState v5 + actor model: ~30KB → không justify.
- POC ưu tiên dev velocity → 1 file `lib/state-machine/programCycle.ts` đọc dễ hơn statechart JSON.
- Statechart visualizer của Stately.ai đẹp nhưng demo cho khách hàng không cần.

**KHI NÀO nên dùng XState:** Nếu state machine có >15 state, parallel states, history states, hierarchical states (statecharts thực sự). XTTMQG không có nhu cầu này.

**Pattern đề xuất:**

```typescript
// lib/state-machine/programCycle.ts
export type ProgramCycleStatus =
  | 'DRAFT'
  | 'READY'
  | 'OPEN_REGISTRATION'
  | 'CLOSED_REGISTRATION'
  | 'EVALUATING'
  | 'APPROVED'
  | 'COMPLETED';

export type ProgramCycleEvent =
  | 'PUBLISH'        // DRAFT → READY
  | 'OPEN'           // READY → OPEN_REGISTRATION
  | 'CLOSE'          // OPEN → CLOSED
  | 'REOPEN'         // CLOSED → OPEN (gia hạn)
  | 'START_EVALUATE' // CLOSED → EVALUATING
  | 'APPROVE'        // EVALUATING → APPROVED
  | 'COMPLETE';      // APPROVED → COMPLETED

const transitions: Record<ProgramCycleStatus, Partial<Record<ProgramCycleEvent, ProgramCycleStatus>>> = {
  DRAFT:                { PUBLISH: 'READY' },
  READY:                { OPEN: 'OPEN_REGISTRATION' },
  OPEN_REGISTRATION:    { CLOSE: 'CLOSED_REGISTRATION' },
  CLOSED_REGISTRATION:  { REOPEN: 'OPEN_REGISTRATION', START_EVALUATE: 'EVALUATING' },
  EVALUATING:           { APPROVE: 'APPROVED' },
  APPROVED:             { COMPLETE: 'COMPLETED' },
  COMPLETED:            {},
};

export function canTransition(from: ProgramCycleStatus, event: ProgramCycleEvent): boolean {
  return event in (transitions[from] ?? {});
}

export function transition(from: ProgramCycleStatus, event: ProgramCycleEvent): ProgramCycleStatus {
  const next = transitions[from]?.[event];
  if (!next) throw new Error(`Không thể chuyển từ ${from} qua sự kiện ${event}`);
  return next;
}

// Guard logic (kết hợp với business rules)
export function canCreateProject(cycleStatus: ProgramCycleStatus): boolean {
  return cycleStatus === 'OPEN_REGISTRATION';
}
```

Tương tự cho Project lifecycle: `DRAFT → SUBMITTED → UNDER_REVIEW → NEED_REVISION → SUBMITTED → APPROVED_PRELIM → EVALUATING → APPROVED_FINAL → CONTRACTED → IN_PROGRESS → REPORTED → ACCEPTED → LIQUIDATED`.

**UI helper:**
- `<StatusBadge status={...} />` — render label tiếng Việt + màu sắc theo enum.
- `<TransitionButton from={...} event="..." onConfirm={...} />` — tự động disabled nếu `canTransition` false.

---

## 10. Charts — Government Dashboard

### Quyết định: **Recharts v3** (đã chốt từ user, validate đúng đắn)

**So sánh:**
| Library | Bundle | Use case | Match POC? |
|---|---|---|---|
| **Recharts v3** ✅ | ~150KB | Default React charts | YES — default, ecosystem lớn |
| **Tremor** | ~200KB (chart bundle) | SaaS dashboard pre-styled | Có thể dùng song song nếu thích style — nhưng Tremor charts wrap Recharts ngầm |
| Visx | ~15KB modular | Custom complex viz | Overkill cho dashboard standard |
| Nivo | ~500KB+ full | 30+ chart types, canvas | Quá nặng cho POC |
| Chart.js | ~70KB | Canvas | Không React-native, ít composable |

**Recharts đủ cho XTTMQG dashboard (M6):**
- Bar chart — số đề án theo loại / theo đơn vị / theo năm
- Line chart — kinh phí đăng ký vs phê duyệt vs giải ngân theo tháng
- Pie/Donut — phân bổ theo loại hình XTTM
- Stacked bar — trạng thái đề án theo đơn vị
- Funnel-like — số đăng ký → phê duyệt → ký HĐ → hoàn thành

**Khuyến nghị thêm:**
- **Cài shadcn `chart` block** — wrapper chuẩn Recharts có theme + tooltip + legend đẹp ngay (`npx shadcn add chart`).
- Sử dụng `chart-config` của shadcn để nhất quán màu sắc với theme.

```bash
npx shadcn add chart
```

---

## 11. shadcn/ui Component Checklist (BẮT BUỘC cài hết cho POC)

Chạy 1 lần ở M0 (sau khi `npx shadcn init`):

```bash
# Layout & Navigation
npx shadcn add sidebar breadcrumb navigation-menu separator scroll-area sheet

# Form primitives
npx shadcn add button input textarea label form select checkbox radio-group switch slider toggle toggle-group

# Combobox & Date
npx shadcn add popover command combobox calendar date-picker input-otp

# Display
npx shadcn add card badge avatar skeleton progress alert tooltip hover-card aspect-ratio

# Feedback & Overlay
npx shadcn add dialog alert-dialog drawer sonner

# Data
npx shadcn add table data-table tabs accordion collapsible pagination

# Misc
npx shadcn add dropdown-menu context-menu menubar resizable
npx shadcn add chart                # Cho M6 dashboard
npx shadcn add empty                # Empty state (CLI v4)
```

**Tổng: ~36 component** (vượt mức 20-25 nhưng thiết yếu cho 14 module nghiệp vụ).

### Mapping module → component bắt buộc

| Module | Components chính |
|---|---|
| **Layout shell** | `sidebar` + `sheet` (mobile) + `breadcrumb` + `dropdown-menu` (user menu) |
| **Login (M0)** | `form` + `input` + `button` + `card` |
| **List view (mọi module)** | `table` + `data-table` + `input` (search) + `select` (filter) + `pagination` + `dropdown-menu` (row actions) + `badge` (status) |
| **Multi-step form (M2)** | `form` + `progress` (stepper) + `tabs` (alternative stepper) + `card` (section wrap) + `alert` (validation summary) + `dialog` (confirm submit) |
| **Phiếu chấm điểm (M3)** | `slider` hoặc `input type=number` + `radio-group` + `textarea` + `accordion` (gom theo tiêu chí) |
| **Quản lý vai trò (M1)** | `data-table` + `checkbox` (matrix cell) + `switch` (toggle perm) |
| **Calendar / Timeline (M4)** | `calendar` + `popover` (date picker) + (custom timeline component) |
| **Notifications (M6)** | `popover` (notification panel) + `sheet` (full inbox) + `badge` (unread count) + `sonner` (toast) |
| **Dashboard (M6)** | `card` + `chart` + `tabs` (year selector) + `tooltip` |
| **Confirm actions** | `alert-dialog` (xóa, nộp, hủy) + `sonner` (success toast) |
| **Help / Hover info** | `hover-card` + `tooltip` |
| **Email composer** | `dialog` (full screen modal) + Tiptap (custom) + `combobox` (recipient picker) + `command` (template select) |
| **File upload** | `input type=file` (custom dropzone) + `progress` |

### Component bổ sung (KHÔNG có sẵn shadcn — phải tự build hoặc cài registry khác)

| Cần | Đề xuất |
|---|---|
| Multi-select / Tag input | Cài registry `shadcn/ui-multi-select` hoặc tự build dựa trên `command` + `badge` |
| Rich text editor | Tiptap (xem mục 8) |
| Stepper component đẹp hơn `progress` | Tự build dựa trên `separator` + `badge` (1, 2, 3 numbered) hoặc cài `shadcnblocks` stepper |
| Tree (cho danh mục cha/con) | Tự build với `collapsible` + recursion |
| File dropzone | `react-dropzone@14` + style theo shadcn |
| Timeline (project history, audit log) | Tự build với `card` + `separator` + line CSS |
| Vietnamese date picker | `calendar` (đã có locale `vi`) — pass `locale={vi}` từ date-fns |

---

## 12. UI Helpers & Toast

| Library | Version | Mục đích |
|---|---|---|
| **Sonner** | `1.7+` (đi qua `npx shadcn add sonner`) | Toast notification |
| **clsx** + **tailwind-merge** | mới nhất | `cn()` helper trong `lib/utils.ts` (shadcn default) |
| **react-dropzone** | `14.3+` | File upload dropzone |
| **react-day-picker** | `9.x` (đi với shadcn `calendar`) | Date picker |
| **vaul** | `1.x` (đi với shadcn `drawer`) | Mobile drawer |

---

## 13. Installation Script tổng hợp

```bash
# 1. Bootstrap Next.js
npx create-next-app@15 xttm --ts --tailwind --app --src-dir=false --import-alias="@/*"
cd xttm

# 2. shadcn/ui init (chọn New York style, Tailwind v4)
npx shadcn@latest init

# 3. Core dependencies
npm install \
  next-auth@beta \
  bcryptjs \
  prisma @prisma/client \
  zod \
  react-hook-form @hookform/resolvers \
  @tanstack/react-query @tanstack/react-table \
  zustand \
  date-fns \
  recharts \
  motion \
  lucide-react \
  sonner

# 4. PDF + Excel
npm install \
  @react-pdf/renderer \
  xlsx

# 5. Tiptap (email composer)
npm install \
  @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-link @tiptap/extension-placeholder \
  @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header

# 6. File upload UI
npm install react-dropzone

# 7. Dev tooling
npm install -D \
  @types/bcryptjs \
  prisma \
  tsx                       # for prisma seed script
  eslint-config-next \
  @typescript-eslint/parser

# 8. shadcn components (chạy 1 lần)
npx shadcn add button card input label textarea form select checkbox radio-group switch slider toggle toggle-group \
  popover command combobox calendar date-picker input-otp \
  badge avatar skeleton progress alert tooltip hover-card aspect-ratio separator \
  dialog alert-dialog drawer sonner sheet \
  table data-table tabs accordion collapsible pagination \
  dropdown-menu context-menu menubar resizable scroll-area \
  navigation-menu sidebar breadcrumb chart empty
```

---

## 14. Alternatives Considered (đã loại)

| Recommended | Alternative | Lý do KHÔNG dùng |
|---|---|---|
| `@react-pdf/renderer` | `jsPDF` | Layout phức tạp (tờ trình, biên bản) cực khổ với imperative API; phải tự tính toạ độ. |
| `@react-pdf/renderer` | `pdf-lib` | Quá low-level, phải tự build layout engine. |
| `@react-pdf/renderer` | `Puppeteer` (HTML→PDF) | Đẹp nhưng cần Chromium binary (~200MB), khó deploy + setup phức tạp; overkill cho POC. |
| Custom permission matrix | `CASL.js` | Mâu thuẫn với React Server Components, hydration issue trong App Router. |
| Plain TS state machine | `XState v5` | Overkill cho 7 state đơn giản; bundle 30KB không đáng. |
| `date-fns` | `dayjs` | Tree-shaking date-fns tốt hơn; locale tiếng Việt rich hơn. |
| `date-fns` | `Moment.js` | Deprecated, bundle khổng lồ, không tree-shake. |
| `Intl.NumberFormat` | `numeral.js` | Native API zero bundle, hỗ trợ vi-VN đầy đủ. |
| Tiptap | `Lexical` | Docs đuối, learning curve cao cho POC. |
| Tiptap | `react-quill`, `react-draft-wysiwyg` | Quill 2 ecosystem yếu; draft-js đã deprecated. |
| Recharts | `Visx` | Quá low-level, dev velocity chậm. |
| Recharts | `Nivo` | Bundle quá nặng (500KB+). |
| Server Actions native | `multer` / `formidable` | Multer không tương thích App Router; Next 15 Server Actions handle FormData natively. |
| `bcryptjs` | `bcrypt` (native) | Native binding gây lỗi build trên Windows + serverless. |
| `radix-ui` (unified) | `@radix-ui/react-*` (split) | shadcn từ 02/2026 dùng package thống nhất; package.json sạch hơn. |
| `motion` (rebrand) | `framer-motion` (legacy) | `framer-motion` vẫn maintain nhưng mới project nên dùng `motion`. |

---

## 15. What NOT to Use (cấm)

| Avoid | Vấn đề | Use Instead |
|---|---|---|
| **Pages Router** (Next.js cũ) | Đã legacy, không support Server Actions, không React 19 features | App Router (đã chốt) |
| **Material UI / MUI** | Look "Google Material" lỗi thời cho gov VN, customization khó, bundle nặng | shadcn/ui (đã chốt) |
| **Ant Design** | Cùng vấn đề MUI; default style "Trung Quốc tech 2018" — không match Vercel-grade demo | shadcn/ui |
| **Bootstrap 5 / Bootstrap React** | Look outdated, không đủ wow cho lãnh đạo | Tailwind + shadcn |
| **Chakra UI** | Chakra v3 đã rebrand, ecosystem fragmented | shadcn/ui |
| **Redux Toolkit** | Overkill cho POC; Server Actions + TanStack Query đã cover | TanStack Query + Zustand |
| **Sequelize / TypeORM** | DX kém, type safety kém Prisma | Prisma |
| **Moment.js** | Deprecated từ 2020 | date-fns |
| **node-cron** trong Next.js | Edge runtime không support; phải worker riêng | Server Actions trigger thủ công cho POC; production phase 2 dùng cron job riêng. |
| **`bcrypt` (native)** | Issue build Windows / serverless | `bcryptjs` |
| **CSS Modules / styled-components** | Mâu thuẫn với Tailwind v4 cascade layers; bundle bloat | Tailwind utilities + `cn()` helper |
| **`next-i18next` / `next-intl`** | XTTMQG 100% tiếng Việt — không cần i18n; thêm plumbing không cần thiết | Hard-code text trong components |
| **Variable fonts trong react-pdf** | PDF 2.0 spec không support | Static TTF (Be Vietnam Pro static instances) |
| **Lưu file vào `public/uploads/`** | Bypass auth — public route | `storage/uploads/` + Route Handler có guard |

---

## 16. Version Compatibility Matrix

| Package A | Compatible With | Ghi chú |
|---|---|---|
| `next@15.4` | `react@19.0+`, `typescript@5.7+` | React 19 stable. |
| `next-auth@5` | `next@14.2+`, `next@15.x` | Beta nhưng đã dùng production rộng rãi. |
| `prisma@6.6` | `node@18+`, `node@20 LTS`, `node@22 LTS` | SQLite JSON + Enum (>=6.2.0). |
| `tailwindcss@4.1+` | PostCSS 8 hoặc Vite plugin (Next 15 dùng `@tailwindcss/postcss`) | Cần `@tailwindcss/postcss` thay vì `tailwindcss` plugin cũ. |
| `zod@4` | `react-hook-form@7.55+` cần `@hookform/resolvers@4+` | Resolver phải v4 để hỗ trợ Zod 4 native. |
| `@tanstack/react-query@5` | `react@18+` | Dùng `useSyncExternalStore`. |
| `motion@12` | `react@19` | OK; `framer-motion` legacy package vẫn alias đến motion. |
| `@react-pdf/renderer@4.x` | `react@18+`, `react@19` | Chạy server-side; `tsx` runtime cho seed script. |
| `shadcn cli v4` | `tailwindcss@4`, `next@15+` | Templates dùng React 19 + TS 5. |

---

## 17. Stack Patterns by Variant

**Nếu cần hot reload nhanh khi demo trực tiếp:**
- Dùng **Turbopack dev** (`next dev --turbo`) — stable trên Next 15.
- Tránh `pnpm` nếu team chưa quen — dùng `npm` cho consistency.

**Nếu cần demo offline:**
- SQLite + local fonts (đặt TTF vào `public/fonts/`) đã đảm bảo zero network deps.
- Mock email/SMS lưu DB → không cần internet.
- Chỉ cần Node.js + DB file.

**Nếu khách hàng yêu cầu test trên iPad / mobile:**
- Tailwind responsive đã default. Test breakpoint `md` (768px).
- Touch target ≥ 44px (shadcn defaults OK).
- Sidebar tự collapse vào `sheet` ở mobile.

**Nếu phase 2 cần migrate sang production:**
- SQLite → PostgreSQL: Prisma schema chỉ đổi `provider`, migrate data với `prisma migrate dev`.
- Local file → S3/Viettel Cloud: refactor `uploadProjectFile` action sang `@aws-sdk/client-s3` hoặc Viettel Object Storage SDK.
- Mock SMTP → SendGrid/AWS SES: thay `mockSender.ts` bằng adapter.
- NextAuth Credentials → SAML/SSO Bộ Công Thương: thêm provider mới, giữ Credentials làm fallback admin.

---

## 18. Confidence Assessment

| Area | Confidence | Source |
|---|---|---|
| Next.js 15 / React 19 / Tailwind v4 / shadcn versions | **HIGH** | Official docs, release notes 2026 |
| Prisma 6 SQLite features | **HIGH** | Official Prisma changelog (JSON+Enum from 6.2.0) |
| NextAuth v5 Credentials + JWT pattern | **HIGH** | Official Auth.js docs, multiple 2026 guides |
| RBAC custom matrix vs CASL | **HIGH** | CASL has documented RSC issues |
| `@react-pdf/renderer` for Vietnamese PDF | **MEDIUM-HIGH** | Multiple GitHub issues confirm Font.register works with Be Vietnam Pro static TTF; cần test với template thực tế |
| Recharts v3 for dashboard | **HIGH** | Default choice, shadcn `chart` block built on it |
| date-fns v4 + locale `vi` | **HIGH** | Official package + Vietnamese locale stable |
| Native Server Actions for upload | **HIGH** | Next.js docs + multiple production guides |
| Tiptap for email composer | **MEDIUM** | Best in class but có thể đổi sang Lexical nếu cần performance cho doc lớn |
| Plain TS state machine vs XState | **HIGH** (cho POC scope) | XState overkill cho 7 state đơn giản |
| Vietnamese diacritics search via `searchKey` cột | **MEDIUM** | SQLite không có unaccent native; pattern này phổ biến nhưng cần test với data thực |
| Custom multi-step form vs library | **HIGH** | RHF + Zod + Zustand là pattern chuẩn 2026 |

---

## 19. Sources

### Official documentation (HIGH confidence)
- [Next.js 15 Blog](https://nextjs.org/blog/next-15) — release notes
- [Next.js Upgrading v15](https://nextjs.org/docs/app/guides/upgrading/version-15) — async APIs, caching
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — engine, config
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) — component list 2026
- [shadcn CLI v4 changelog (March 2026)](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [shadcn Unified Radix UI (Feb 2026)](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui)
- [Auth.js Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5)
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control)
- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials)
- [Prisma 6 Blog](https://www.prisma.io/blog/prisma-6-better-performance-more-flexibility-and-type-safe-sql)
- [Prisma SQLite docs](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Zod v4 Changelog](https://zod.dev/v4/changelog)
- [TanStack Query v5 Migration](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
- [TanStack Table v8 Pagination Guide](https://tanstack.com/table/v8/docs/guide/pagination)
- [@react-pdf/renderer Fonts](https://react-pdf.org/fonts)
- [date-fns npm](https://www.npmjs.com/package/date-fns)
- [Motion (Framer Motion v12) Upgrade](https://motion.dev/docs/react-upgrade-guide)
- [Be Vietnam Pro on Google Fonts](https://fonts.google.com/specimen/Be+Vietnam+Pro)
- [Be Vietnam Pro on Fontsource](https://fontsource.org/fonts/be-vietnam-pro)

### Patterns & guides (MEDIUM confidence — community)
- [React Hook Form Multi-Step + Zod + Shadcn Tutorial](https://shadcnstudio.com/blog/react-hook-form-zod-shadcn-ui)
- [LogRocket Multi-Step Form RHF + Zod](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/)
- [Auth.js v5 with Next.js 16 Complete Guide 2026 (DEV)](https://dev.to/huangyongshan46a11y/authjs-v5-with-nextjs-16-the-complete-authentication-guide-2026-2lg)
- [PkgPulse: react-pdf vs jsPDF 2026](https://www.pkgpulse.com/blog/react-pdf-vs-react-pdf-renderer-vs-jspdf-pdf-in-react-2026)
- [PkgPulse: Recharts v3 vs Tremor vs Nivo 2026](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026)
- [PkgPulse: Tiptap vs Lexical vs Slate vs Quill 2026](https://www.pkgpulse.com/blog/tiptap-vs-lexical-vs-slate-vs-quill-rich-text-editor-2026)
- [PkgPulse: date-fns v4 vs Temporal vs Day.js 2026](https://www.pkgpulse.com/guides/date-fns-v4-vs-temporal-api-vs-dayjs-date-handling-2026)
- [Strapi: Next.js 15 File Upload Server Actions](https://strapi.io/blog/epic-next-js-15-tutorial-part-5-file-upload-using-server-actions)
- [DesignRevision: Build Dashboard with shadcn/ui 2026](https://designrevision.com/blog/shadcn-dashboard-tutorial)
- [PostgreSQL unaccent docs](https://www.postgresql.org/docs/9.1/unaccent.html) — for phase 2 migration
- [SQLite Forum Unicode Folding](https://sqlite.org/forum/forumpost/524c146fbf) — confirms COLLATE NOCASE ASCII-only

### GitHub issues consulted (LOW confidence — bug reports)
- [react-pdf Vietnamese display](https://github.com/wojtekmaj/react-pdf/issues/629)
- [react-pdf font fallback multilang](https://github.com/diegomura/react-pdf/issues/933)
- [CASL RSC issue with Next.js](https://www.permit.io/blog/frontend-authorization-with-nextjs-and-casl-tutorial)

---

*Stack research for: Vietnamese government grant management POC (XTTMQG) — Bộ Công Thương demo*
*Researched: 2026-04-30 by GSD project researcher*
