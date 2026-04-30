---
phase: 01-m0-bootstrap-h-t-ng
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - tsconfig.json
  - next.config.ts
  - postcss.config.mjs
  - components.json
  - .gitignore
  - .env.example
  - .env.local
  - .eslintrc.json
  - .prettierrc.json
  - .prettierignore
  - app/layout.tsx
  - app/globals.css
  - app/page.tsx
  - lib/utils.ts
  - lib/prisma.ts
  - lib/constants.ts
  - lib/permissions.ts
  - lib/format.ts
  - lib/date.ts
  - lib/vi-search.ts
  - lib/breadcrumbs.ts
  - lib/menu.ts
  - lib/workflows/programCycle.ts
  - lib/workflows/project.ts
  - lib/workflows/orgProfile.ts
  - lib/workflows/scoreSheet.ts
  - lib/workflows/contract.ts
  - lib/workflows/report.ts
  - components/ui/.gitkeep
  - components/layout/.gitkeep
  - components/shared/.gitkeep
  - features/.gitkeep
  - storage/uploads/.gitkeep
  - storage/.gitignore
  - public/mock-files/.gitkeep
  - types/next-auth.d.ts
autonomous: true
requirements:
  - AUTH-07
user_setup: []
must_haves:
  truths:
    - "Toolchain `npm run typecheck` và `npm run lint` chạy pass trên repo trống"
    - "Toolchain `npm run build` build được app skeleton (chỉ root layout + placeholder page)"
    - "shadcn CLI đã init xong với new-york preset + slate base color + CSS variables"
    - "Tailwind v4 + PostCSS hoạt động (utility class render đúng trong build)"
    - "Locale `vi-VN` configured global (date-fns + Intl helpers tồn tại)"
    - "TERMS dictionary lock đầy đủ thuật ngữ XTTM trong lib/constants.ts"
    - "RBAC matrix scaffolding tồn tại trong lib/permissions.ts với 7 roles + 10 resources"
    - "State machine skeleton tồn tại cho 6 entity (programCycle, project, orgProfile, scoreSheet, contract, report)"
  artifacts:
    - path: "package.json"
      provides: "Dependency manifest với Next 15, React 19, TypeScript 5, Tailwind v4, Prisma 6, NextAuth v5 beta, RHF 7.55+, Zod 4, shadcn CLI deps, @react-pdf/renderer 4, sonner, lucide-react, date-fns 4, motion 12, recharts 3, bcryptjs"
      contains: "\"next\": \"^15.4\""
    - path: "tsconfig.json"
      provides: "Strict TypeScript 5.7+ config với path alias @/*"
      contains: "\"strict\": true"
    - path: "next.config.ts"
      provides: "Next 15 config với serverActions bodySizeLimit 20mb"
      contains: "bodySizeLimit"
    - path: "components.json"
      provides: "shadcn CLI v4 config với new-york + slate + CSS variables"
      contains: "new-york"
    - path: "lib/prisma.ts"
      provides: "PrismaClient singleton tránh hot-reload connection leak"
      exports: ["prisma"]
    - path: "lib/utils.ts"
      provides: "cn() helper ghép Tailwind class (clsx + tailwind-merge)"
      exports: ["cn"]
    - path: "lib/constants.ts"
      provides: "TERMS dictionary đầy đủ + ROLES + ROLE_LABELS + 8 hardcoded user mapping (username/role/orgCode)"
      contains: "TERMS"
    - path: "lib/permissions.ts"
      provides: "ROLES type, Resource type, Action type, MATRIX object, can() function, getMenuItems() function"
      exports: ["ROLES", "can", "getMenuItems"]
    - path: "lib/format.ts"
      provides: "formatDate, formatDateTime, formatVND, formatVNDCompact, formatNumber với locale vi-VN"
      exports: ["formatDate", "formatDateTime", "formatVND", "formatVNDCompact", "formatNumber"]
    - path: "lib/date.ts"
      provides: "daysAgo(n), daysFromNow(n), formatRelative — relative date helpers cho mock data"
      exports: ["daysAgo", "daysFromNow", "formatRelative"]
    - path: "lib/vi-search.ts"
      provides: "removeDiacritics() để build searchKey không dấu cho Prisma model"
      exports: ["removeDiacritics"]
    - path: "lib/workflows/programCycle.ts"
      provides: "ProgramCycleStatus enum + TRANSITIONS table 7 trạng thái + canTransition() guard"
      exports: ["canTransitionCycle"]
    - path: "app/layout.tsx"
      provides: "Root layout với <html lang='vi'> + Be Vietnam Pro font + Sonner toaster + light mode hardcode"
      contains: "lang=\"vi\""
    - path: "app/globals.css"
      provides: "Tailwind v4 entry point + shadcn CSS variables (slate base) + Be Vietnam Pro font-face"
      contains: "@import \"tailwindcss\""
    - path: ".gitignore"
      provides: "Git ignore Node + Next + Prisma dev.db + storage uploads + .env.local"
      contains: "prisma/dev.db"
  key_links:
    - from: "app/layout.tsx"
      to: "app/globals.css"
      via: "import"
      pattern: "import.*globals\\.css"
    - from: "lib/utils.ts"
      to: "clsx + tailwind-merge"
      via: "cn() composition"
      pattern: "twMerge.*clsx"
    - from: "components.json"
      to: "Tailwind v4 + slate"
      via: "shadcn CLI config"
      pattern: "\"baseColor\":\\s*\"slate\""
    - from: "lib/permissions.ts"
      to: "lib/constants.ts ROLES"
      via: "import"
      pattern: "import.*ROLES.*constants"
---

<objective>
Bootstrap repo greenfield: tạo Next.js 15 app, cài đặt toàn bộ dependency lock theo STACK.md §13, init shadcn/ui CLI v4 với preset đã lock trong UI-SPEC.md, dựng folder structure đầy đủ theo ARCHITECTURE.md §2.2 + §5.2, viết toàn bộ lib helper foundation (TERMS dictionary, RBAC matrix scaffolding, format/date/vi-search helpers, state machine skeleton 6 entity) để mọi phase sau xây trên đó mà không phải sửa lại.

Purpose: Khóa toàn bộ kỹ thuật foundation từ M0 — tránh trượt foundation = sửa sau tốn 5-10x (theo research SUMMARY R1-R5). Mọi pattern (TERMS, format VN, state machine, RBAC) phải lock đầy đủ tại đây để Phase 2-11 chỉ việc dùng.

Output:
- package.json với 25+ dependency đã lock version
- shadcn CLI initialized + Tailwind v4 working
- 13 file lib helper foundation đầy đủ (utils, prisma, constants, permissions, format, date, vi-search, breadcrumbs, menu, workflows/×6)
- Folder skeleton (app/, components/, features/, lib/, prisma/, public/, storage/) theo ARCHITECTURE
- ESLint + Prettier config
- Root layout.tsx với Be Vietnam Pro font + locale vi-VN
- typecheck + lint + build pass trên skeleton
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/research/SUMMARY.md
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
@.planning/research/PITFALLS.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
</context>

<interfaces>
<!-- Key types/contracts the executor MUST produce in this plan; later plans depend on these. -->

```typescript
// lib/constants.ts — MUST export
export const TERMS = {
  DE_AN: 'Đề án',
  CHU_KY_CHUONG_TRINH: 'Chu kỳ chương trình',
  DON_VI_CHU_TRI: 'Đơn vị chủ trì',
  KIEM_TRA_HO_SO: 'Kiểm tra hồ sơ',
  THAM_DINH: 'Thẩm định',
  PHE_DUYET: 'Phê duyệt',
  NGHIEM_THU: 'Nghiệm thu',
  THANH_LY_HOP_DONG: 'Thanh lý hợp đồng',
  QUYET_TOAN: 'Quyết toán',
  TAM_UNG: 'Tạm ứng',
  THUONG_VU: 'Thương vụ',
  HO_SO: 'Hồ sơ',
  TO_TRINH: 'Tờ trình',
  QUYET_DINH: 'Quyết định',
  HOI_DONG_THAM_DINH: 'Hội đồng thẩm định',
  CHUYEN_VIEN: 'Chuyên viên',
  BAN_QUAN_LY: 'Ban quản lý CT XTTM',
  DIEU_CHINH: 'Điều chỉnh',
  TRIEN_KHAI: 'Triển khai',
  BAO_CAO: 'Báo cáo',
  CONG_VAN: 'Công văn',
} as const;

export const ROLES = {
  ADMIN: 'ADMIN',
  BANQL: 'BANQL',
  CHUYENVIEN: 'CHUYENVIEN',
  HOIDONG: 'HOIDONG',
  DONVI: 'DONVI',
  TAICHINH: 'TAICHINH',
  LANHDAO: 'LANHDAO',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  BANQL: 'Ban quản lý CT XTTM',
  CHUYENVIEN: 'Chuyên viên kiểm tra',
  HOIDONG: 'Hội đồng thẩm định',
  DONVI: 'Đơn vị chủ trì',
  TAICHINH: 'Tài chính',
  LANHDAO: 'Lãnh đạo',
};

// Mapping cho seed (Plan 02 dùng)
export const HARDCODED_USERS = [
  { username: 'admin',      password: 'Admin@123', role: 'ADMIN',      orgCode: null,         fullName: 'Nguyễn Văn Quản', email: 'admin@xttm.gov.vn' },
  { username: 'banql',      password: 'Banql@123', role: 'BANQL',      orgCode: 'CUC_XTTM',   fullName: 'Trần Thị Bích Ngọc', email: 'banql@xttm.gov.vn' },
  { username: 'chuyenvien', password: 'Cv@123',    role: 'CHUYENVIEN', orgCode: 'CUC_XTTM',   fullName: 'Lê Quang Cường',   email: 'chuyenvien@xttm.gov.vn' },
  { username: 'hoidong',    password: 'Hd@123',    role: 'HOIDONG',    orgCode: 'CUC_XTTM',   fullName: 'PGS.TS. Phạm Thanh Dũng', email: 'hoidong@xttm.gov.vn' },
  { username: 'donvi1',     password: 'Donvi@123', role: 'DONVI',      orgCode: 'LEFASO',     fullName: 'Hoàng Mai Linh',   email: 'donvi1@lefaso.org.vn' },
  { username: 'donvi2',     password: 'Donvi@123', role: 'DONVI',      orgCode: 'VITAS',      fullName: 'Vũ Đức Minh',      email: 'donvi2@vitas.org.vn' },
  { username: 'taichinh',   password: 'Tc@123',    role: 'TAICHINH',   orgCode: 'CUC_XTTM',   fullName: 'Đặng Thu Hà',      email: 'taichinh@xttm.gov.vn' },
  { username: 'lanhdao',    password: 'Ld@123',    role: 'LANHDAO',    orgCode: 'BO_CT',      fullName: 'Bùi Xuân Hồng',    email: 'lanhdao@moit.gov.vn' },
] as const;

// lib/permissions.ts — MUST export
export type Resource =
  | 'chuong-trinh' | 'don-vi-chu-tri' | 'de-an' | 'tiep-nhan' | 'tham-dinh'
  | 'phe-duyet' | 'hop-dong' | 'trien-khai' | 'bao-cao' | 'nghiem-thu'
  | 'tai-chinh' | 'danh-muc' | 'nguoi-dung' | 'vai-tro' | 'cau-hinh'
  | 'audit-log' | 'thong-bao' | 'dashboard';
export type Action = 'read' | 'create' | 'update' | 'delete' | 'submit' | 'approve' | 'assign' | 'score';

export function can(role: Role, resource: Resource, action: Action): boolean;

export type MenuItem = {
  href: string;
  label: string;
  icon: string;          // lucide icon name
  resource: Resource;
  section: 'NGHIEP_VU' | 'QUAN_TRI';
};

export function getMenuItems(role: Role): MenuItem[];

// lib/format.ts — MUST export
export function formatDate(d: Date | string): string;     // "30/05/2026"
export function formatDateTime(d: Date | string): string; // "14:30 30/05/2026"
export function formatVND(n: number): string;             // "2.500.000.000 đồng"
export function formatVNDCompact(n: number): string;      // "2,5 tỷ"
export function formatNumber(n: number): string;          // "2.500.000"

// lib/date.ts — MUST export
export function daysAgo(n: number): Date;
export function daysFromNow(n: number): Date;
export function formatRelative(d: Date | string): string; // "2 ngày trước"

// lib/vi-search.ts — MUST export
export function removeDiacritics(s: string): string;

// lib/breadcrumbs.ts — MUST export
export const BREADCRUMB_LABELS: Record<string, string>;
export function buildBreadcrumb(pathname: string): Array<{ href: string; label: string }>;

// lib/workflows/programCycle.ts — MUST export
export type ProgramCycleStatus =
  | 'DRAFT' | 'READY' | 'OPEN_REGISTRATION' | 'CLOSED_REGISTRATION'
  | 'EVALUATING' | 'APPROVED' | 'COMPLETED';
export function canTransitionCycle(from: ProgramCycleStatus, to: ProgramCycleStatus): boolean;

// types/next-auth.d.ts — MUST declare module augmentation skeleton
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: import('@/lib/constants').Role;
      organizationId: string | null;
      organizationName: string | null;
    };
  }
}
```
</interfaces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Build-time → Runtime | Tooling (lint, typecheck, build) chạy local; outputs ảnh hưởng deploy |
| Filesystem → App | `.env.local` chứa secrets; `storage/uploads/` sẽ chứa user upload (Phase 1+) |
| Repo → Git | `.gitignore` quyết định file nào lộ ra public/repo |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | I (Information Disclosure) | `.env.local` | mitigate | `.gitignore` MUST include `.env.local`, `.env*.local`, `.env`, để KHÔNG commit secrets. `.env.example` (committed) chỉ chứa key names + placeholder, không chứa giá trị thật. Verify bằng `git ls-files | grep -E '^\.env\.local$'` returns empty. |
| T-01-02 | I | `prisma/dev.db` | mitigate | `.gitignore` MUST include `prisma/dev.db`, `prisma/*.db`, `prisma/*.db-journal`. SQLite DB chứa bcrypt password hash + có thể chứa data sensitive về sau. |
| T-01-03 | I | `storage/uploads/` | mitigate | `storage/.gitignore` MUST exclude tất cả trừ `.gitkeep`. POC sẽ chứa user-uploaded PDF (bản scan công văn) nhạy cảm về sau — không bao giờ commit. |
| T-01-04 | T (Tampering) | TypeScript strict mode | mitigate | `tsconfig.json` MUST set `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitAny": true` — bắt lỗi loại runtime sớm, giảm bug security do type confusion. |
| T-01-05 | E (Elevation of Privilege) | RBAC matrix scaffolding | mitigate | `lib/permissions.ts` MUST default-deny (`MATRIX[resource]?.[action]?.includes(role) ?? false`) — role nào không được liệt kê = deny. KHÔNG dùng default-allow. |
| T-01-06 | D (Denial of Service) | Server Actions body limit | mitigate | `next.config.ts` set `experimental.serverActions.bodySizeLimit: '20mb'` — chặn upload >20MB tránh DoS, đồng thời cho phép upload bản scan công văn legitimate. |
| T-01-07 | I | Stack trace leak | mitigate | `next.config.ts` không bật `experimental.serverDebugLogging`; `app/error.tsx` (Plan 05) sẽ KHÔNG render `error.stack`. M0 không build error.tsx nhưng Next 15 default production build đã suppress stack trace. |
| T-01-08 | T | Dependency supply chain | accept | POC scope; rủi ro lockfile poisoning thấp. Plan dùng `npm install` với version pin trong package.json, lockfile commit. Production phase 2 sẽ cân nhắc `npm audit` CI gate. |
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Khởi tạo Next.js 15 + cài đặt toàn bộ dependency theo STACK.md §13</name>
  <files>package.json, package-lock.json, tsconfig.json, next.config.ts, postcss.config.mjs, .gitignore, .env.example, .env.local, .eslintrc.json, .prettierrc.json, .prettierignore, app/layout.tsx, app/globals.css, app/page.tsx</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/research/STACK.md (đặc biệt §1, §13 install script, §16 compatibility matrix)
    - d:/Thaodnp/XTTM/.planning/research/PITFALLS.md (1.1 PDF, 1.3 date format, 2.4 console hygiene)
    - d:/Thaodnp/XTTM/CLAUDE.md (mục 8.1 ngôn ngữ, 8.4 quy tắc sinh code, 8.6 git commit)
  </read_first>
  <action>
**Bước 1: Khởi tạo project tại thư mục gốc** `d:/Thaodnp/XTTM/` (KHÔNG tạo subdirectory `xttm/` — repo gốc đã là project root):
```bash
npx create-next-app@15.4 . \
  --typescript --tailwind --app --no-src-dir \
  --import-alias "@/*" --eslint --turbopack --use-npm
```
Khi prompt "would you like to proceed" với non-empty directory → đáp "y". `create-next-app` sẽ tạo `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.eslintrc.json`.

**Bước 2: Cài thêm runtime dependencies (theo STACK.md §13.3-§13.6):**
```bash
npm install \
  next-auth@beta \
  bcryptjs \
  prisma@^6.6 @prisma/client@^6.6 \
  zod@^4 \
  react-hook-form@^7.55 @hookform/resolvers@^4 \
  @tanstack/react-query@^5.99 @tanstack/react-table@^8.21 \
  zustand@^5 \
  date-fns@^4 \
  recharts@^3 \
  motion@^12 \
  lucide-react@^0.460 \
  sonner@^1.7 \
  clsx tailwind-merge \
  @react-pdf/renderer@^4 \
  xlsx@^0.20

npm install -D \
  @types/bcryptjs \
  tsx \
  prettier \
  eslint-config-prettier
```

**Bước 3: Cấu hình `tsconfig.json` strict (overwrite create-next-app default):**
- Set `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitAny": true`, `"noFallthroughCasesInSwitch": true`
- Giữ `"paths": { "@/*": ["./*"] }`
- Set `"target": "ES2022"`, `"moduleResolution": "bundler"`

**Bước 4: Cấu hình `next.config.ts` (overwrite create-next-app default):**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
  },
  eslint: {
    dirs: ['app', 'components', 'features', 'lib', 'prisma', 'types'],
  },
};

export default nextConfig;
```

**Bước 5: `.gitignore` (append vào file create-next-app tạo):**
- Đảm bảo có dòng: `prisma/dev.db`, `prisma/*.db`, `prisma/*.db-journal`, `.env`, `.env.local`, `.env*.local`, `storage/uploads/*`, `!storage/uploads/.gitkeep`, `!storage/.gitignore`

**Bước 6: Tạo `.env.example` (committed, chỉ key names) và `.env.local` (gitignored, giá trị thật):**

`.env.example`:
```
# Auth
AUTH_SECRET=
AUTH_TRUST_HOST=true

# Database
DATABASE_URL="file:./dev.db"

# App
NEXT_PUBLIC_APP_NAME="XTTMQG"
NEXT_PUBLIC_APP_VERSION="0.1.0-poc"
```

`.env.local`:
```
AUTH_SECRET=<generate bằng: openssl rand -base64 32 — ví dụ "k8jX2pL5mQ9vN3wR7tY1bU4eS6hI0aFdC">
AUTH_TRUST_HOST=true
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="XTTMQG"
NEXT_PUBLIC_APP_VERSION="0.1.0-poc"
```
Lưu ý: AUTH_SECRET sinh bằng `openssl rand -base64 32` (Node có sẵn `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` cho Windows nếu không có openssl).

**Bước 7: ESLint + Prettier config:**

`.eslintrc.json` (overwrite create-next-app):
```json
{
  "extends": ["next/core-web-vitals", "next/typescript", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

`.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

`.prettierignore`:
```
node_modules
.next
prisma/dev.db
storage
public/fonts
package-lock.json
```

**Bước 8: Append npm scripts vào `package.json` (giữ scripts từ create-next-app, thêm DB + utility scripts):**
```json
"scripts": {
  "dev": "next dev --turbo",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\"",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio",
  "db:reset": "prisma db push --force-reset && npm run db:seed"
}
```
Cũng append vào package.json:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Bước 9: Overwrite `app/layout.tsx` với cấu trúc Vietnamese-first:**
```tsx
import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'XTTMQG — Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại',
    template: '%s · XTTMQG',
  },
  description: 'Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại — Bộ Công Thương — Cục Xúc tiến Thương mại',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`light ${beVietnamPro.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
```

**Bước 10: Overwrite `app/globals.css` (Tailwind v4 entry + shadcn CSS variables sẽ generate ở Task 2):**
```css
@import "tailwindcss";

/* Be Vietnam Pro variable từ next/font sẽ được set qua className trong html */
@layer base {
  html {
    font-family: var(--font-be-vietnam-pro), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```
Lưu ý: Sau Task 2 chạy `npx shadcn@latest init`, file globals.css sẽ được shadcn append thêm CSS variables (hsl tokens). KHÔNG cần xóa nội dung trên — shadcn merge thêm.

**Bước 11: Overwrite `app/page.tsx` thành placeholder redirect:**
```tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
```
(Phase 1 chưa có dashboard thật. Logic redirect role-based sẽ implement ở Plan 05.)

**Bước 12: Tạo folder skeleton (empty với .gitkeep):**
```bash
mkdir -p components/ui components/layout components/shared
mkdir -p features
mkdir -p lib/workflows lib/pdf
mkdir -p storage/uploads
mkdir -p public/mock-files public/fonts
mkdir -p types
```
Tạo file `.gitkeep` trong `components/ui/`, `components/layout/`, `components/shared/`, `features/`, `storage/uploads/`, `public/mock-files/`.

`storage/.gitignore`:
```
*
!.gitignore
!.gitkeep
!uploads/.gitkeep
```

**KHÔNG sử dụng**: `bcrypt` native (dùng `bcryptjs` per STACK §4 — Windows compatible). KHÔNG cài `multer`/`formidable` (Server Actions native). KHÔNG cài `framer-motion` (đã rebrand → `motion` per STACK §1).

**Lý do dùng bcryptjs**: bcrypt native binding lỗi build trên Windows (STACK §4 + PITFALLS).
**Lý do dùng next/font Be_Vietnam_Pro thay vì local TTF**: UI web — next/font tối ưu CLS + tự subset. PDF spike (Plan 06) sẽ dùng static TTF riêng vì react-pdf cần file path.
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f package.json &amp;&amp;
      grep -q '"next": "\^15\.4' package.json &amp;&amp;
      grep -q '"react": "\^19' package.json &amp;&amp;
      grep -q '"next-auth": "beta"' package.json &amp;&amp;
      grep -q '"bcryptjs"' package.json &amp;&amp;
      grep -q '"prisma": "\^6\.6"' package.json &amp;&amp;
      grep -q '"@react-pdf/renderer"' package.json &amp;&amp;
      grep -q '"sonner"' package.json &amp;&amp;
      grep -q '"motion"' package.json &amp;&amp;
      grep -q '"date-fns": "\^4"' package.json &amp;&amp;
      grep -q '"zod": "\^4"' package.json &amp;&amp;
      grep -q '"db:push"' package.json &amp;&amp;
      grep -q '"db:seed"' package.json &amp;&amp;
      grep -q '"db:reset"' package.json &amp;&amp;
      grep -q '"strict": true' tsconfig.json &amp;&amp;
      grep -q "bodySizeLimit" next.config.ts &amp;&amp;
      grep -q 'prisma/dev.db' .gitignore &amp;&amp;
      grep -q '\.env\.local' .gitignore &amp;&amp;
      test -f .env.example &amp;&amp;
      grep -q 'AUTH_SECRET=' .env.example &amp;&amp;
      grep -q 'DATABASE_URL=' .env.example &amp;&amp;
      test -f .env.local &amp;&amp;
      test -f .eslintrc.json &amp;&amp;
      test -f .prettierrc.json &amp;&amp;
      grep -q 'lang="vi"' app/layout.tsx &amp;&amp;
      grep -q 'Be_Vietnam_Pro' app/layout.tsx &amp;&amp;
      grep -q 'Toaster' app/layout.tsx &amp;&amp;
      grep -q '@import "tailwindcss"' app/globals.css &amp;&amp;
      test -d components/ui &amp;&amp; test -d components/layout &amp;&amp;
      test -d features &amp;&amp; test -d lib/workflows &amp;&amp;
      test -d storage/uploads &amp;&amp; test -f storage/.gitignore &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `package.json` chứa exact: `"next": "^15.4"` (hoặc `^15.5`), `"react": "^19"`, `"next-auth": "beta"`, `"bcryptjs"`, `"@types/bcryptjs"`, `"prisma": "^6.6"`, `"@prisma/client": "^6.6"`, `"@react-pdf/renderer": "^4"`, `"sonner"`, `"motion"`, `"date-fns": "^4"`, `"zod": "^4"`, `"react-hook-form": "^7.55"`, `"@hookform/resolvers": "^4"`, `"@tanstack/react-query": "^5.99"`, `"@tanstack/react-table": "^8.21"`, `"zustand": "^5"`, `"recharts": "^3"`, `"lucide-react": "^0.460"`, `"clsx"`, `"tailwind-merge"`, `"xlsx": "^0.20"`, `"tsx"`, `"prettier"`, `"eslint-config-prettier"`
    - `package.json` scripts chứa exact: `db:generate`, `db:push`, `db:seed`, `db:studio`, `db:reset`, `typecheck`, `lint`, `format`, `format:check`
    - `package.json` chứa `"prisma": { "seed": "tsx prisma/seed.ts" }` block
    - `tsconfig.json` chứa exact: `"strict": true`, `"noUncheckedIndexedAccess": true`
    - `next.config.ts` chứa exact: `bodySizeLimit: '20mb'`
    - `.gitignore` chứa exact: `prisma/dev.db`, `.env.local`, `storage/uploads/*`
    - `.env.local` exists và KHÔNG được tracked bởi git: `git ls-files | grep -E '^\.env\.local$'` returns empty
    - `app/layout.tsx` chứa exact: `lang="vi"`, `Be_Vietnam_Pro`, `<Toaster`, `position="top-right"`
    - `app/globals.css` chứa exact: `@import "tailwindcss"`
    - Folder structure exists: `components/{ui,layout,shared}/`, `features/`, `lib/workflows/`, `lib/pdf/`, `storage/uploads/`, `public/mock-files/`, `public/fonts/`, `types/`
    - `npx tsc --noEmit` exit code 0
    - `npx prettier --check .prettierrc.json` exit code 0
  </acceptance_criteria>
  <done>
    Repo bootstrap hoàn chỉnh: Next 15 + React 19 + TypeScript strict + Tailwind v4 + đủ dependency lock + folder skeleton + ESLint/Prettier + .env files + npm scripts + root layout VN locale. typecheck pass.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: shadcn/ui CLI v4 init với new-york + slate + CSS variables (per UI-SPEC)</name>
  <files>components.json, app/globals.css, components/ui/.gitkeep, lib/utils.ts</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (Design System section, Color section, Typography section)
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §11 (component checklist) §12 (UI helpers)
    - app/globals.css (đã tạo ở Task 1, cần preserve @import "tailwindcss")
  </read_first>
  <action>
**Bước 1: Run shadcn CLI init với answers đã lock trong UI-SPEC.md:**
```bash
npx shadcn@latest init
```
Khi CLI prompt, trả lời:
- Style: `new-york`
- Base color: `slate`
- CSS variables: `yes`
- (Nếu prompt typescript): yes
- (Nếu prompt path imports): @/*

CLI sẽ tự tạo `components.json`, generate CSS variables (HSL tokens) vào `app/globals.css`, tạo `lib/utils.ts` với `cn()` helper, tạo `components/ui/` (đã có .gitkeep).

**Bước 2: Verify `components.json` có:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```
Nếu CLI tạo sai config → edit thủ công cho đúng.

**Bước 3: Verify `lib/utils.ts` được CLI tạo với:**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
Nếu CLI dùng default export hoặc thiếu `cn` → edit thành đúng signature trên.

**Bước 4: Verify `app/globals.css` đã được merge với shadcn CSS variables (slate base color tokens trong `:root` và `.dark` blocks). KHÔNG xóa `@import "tailwindcss"` line đầu file.

Sau merge, file globals.css cần:
- Line 1: `@import "tailwindcss";`
- Block `@layer base` chứa `:root { ... --background, --foreground, --primary, --primary-foreground, --secondary, --muted, --accent, --destructive, --border, --input, --ring ... }`
- Block `.dark { ... }` (CLI tạo nhưng app hardcode light — không sao, không hại)
- Block tự thêm cho Be Vietnam Pro variable (đã thêm ở Task 1)

**Bước 5: KHÔNG cài thêm shadcn components ở task này** — task này chỉ init. Plan 04 (Layout shell) sẽ cài đủ ~18 components qua `npx shadcn add ...` theo UI-SPEC §Registry Safety list.

**Bước 6: Verify shadcn init thành công bằng cách thử thêm 1 component test rồi xóa:**
```bash
npx shadcn@latest add button
```
Verify `components/ui/button.tsx` exists. Đây là sanity check — Plan 04 sẽ thêm full bộ components nên có thể giữ button.tsx này (sẽ overwrite/keep ở Plan 04). Hoặc xóa nếu muốn để Plan 04 control toàn bộ list.

**Quy ước**: KHÔNG xóa button.tsx — giữ lại như smoke test artifact, Plan 04 sẽ idempotent re-add.
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f components.json &amp;&amp;
      grep -q '"style": "new-york"' components.json &amp;&amp;
      grep -q '"baseColor": "slate"' components.json &amp;&amp;
      grep -q '"cssVariables": true' components.json &amp;&amp;
      grep -q '"iconLibrary": "lucide"' components.json &amp;&amp;
      test -f lib/utils.ts &amp;&amp;
      grep -q 'export function cn' lib/utils.ts &amp;&amp;
      grep -q 'twMerge' lib/utils.ts &amp;&amp;
      grep -q 'clsx' lib/utils.ts &amp;&amp;
      grep -q '@import "tailwindcss"' app/globals.css &amp;&amp;
      grep -q -- '--primary' app/globals.css &amp;&amp;
      grep -q -- '--background' app/globals.css &amp;&amp;
      test -f components/ui/button.tsx &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `components.json` exists với exact: `"style": "new-york"`, `"baseColor": "slate"`, `"cssVariables": true`, `"iconLibrary": "lucide"`
    - `components.json` có `"aliases.utils": "@/lib/utils"` và `"aliases.ui": "@/components/ui"`
    - `lib/utils.ts` exports `cn` function ghép `clsx` + `tailwind-merge`
    - `app/globals.css` chứa cả `@import "tailwindcss"` (line đầu) và CSS variables `--background`, `--foreground`, `--primary`, `--destructive`, `--border` trong `:root`
    - `components/ui/button.tsx` exists (smoke test artifact từ shadcn add button)
    - `npx tsc --noEmit` exit code 0
    - Build smoke test: `npm run build` exit code 0 (skeleton app build được)
  </acceptance_criteria>
  <done>
    shadcn/ui CLI initialized với preset chính xác như UI-SPEC quy định: new-york + slate + CSS variables. lib/utils.ts có cn() helper. globals.css có Tailwind v4 + shadcn tokens. Smoke test button component build được.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Foundation libs — TERMS, RBAC, format, date, search, breadcrumbs, menu, state machines</name>
  <files>lib/prisma.ts, lib/constants.ts, lib/permissions.ts, lib/format.ts, lib/date.ts, lib/vi-search.ts, lib/breadcrumbs.ts, lib/menu.ts, lib/workflows/programCycle.ts, lib/workflows/project.ts, lib/workflows/orgProfile.ts, lib/workflows/scoreSheet.ts, lib/workflows/contract.ts, lib/workflows/report.ts, types/next-auth.d.ts</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/research/PITFALLS.md §1.2 (terminology lock), §1.3 (date/currency format), §4.1 (state machine spec)
    - d:/Thaodnp/XTTM/.planning/research/ARCHITECTURE.md §3 (Prisma schema sketch — refer enum names), §4 (state machine pattern), §6.1 (RBAC matrix), §7 (RBAC architecture)
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §4 (RBAC pattern), §6 (Vietnamese locale formatters)
    - d:/Thaodnp/XTTM/CLAUDE.md mục 4 (vai trò RBAC), 5 (8 tài khoản), 7 (mốc SLA), 8.3 (data & state)
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (Layout Shell Contract → Breadcrumb section cho BREADCRUMB_LABELS)
    - lib/utils.ts (đã tạo ở Task 2 — verify cn() format)
  </read_first>
  <action>
**File 1: `lib/prisma.ts` — PrismaClient singleton:**
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**File 2: `lib/constants.ts` — TERMS dictionary + ROLES + ROLE_LABELS + HARDCODED_USERS:**
Implement đúng theo `<interfaces>` block trong frontmatter (xem trên). Ngoài ra add:
- `STATUS_LABELS` map: status enum → tiếng Việt (ProgramCycle status, Project status — list đầy đủ từ ARCHITECTURE.md §3.2)
- `SLA_THRESHOLDS` const: `{ CONTRACT_DAYS: 60, REPORT_DAYS: 15, CONSULATE_DAYS: 30, REGISTRATION_DEADLINE_MMDD: '05-30' }`
- `ORG_CODES` const: `{ CUC_XTTM: 'CUC_XTTM', BO_CT: 'BO_CT', VITAS: 'VITAS', LEFASO: 'LEFASO', VINATEX: 'VINATEX', VASEP: 'VASEP', VCCI: 'VCCI' }` (3-7 mã org cho seed Plan 02)

**File 3: `lib/permissions.ts` — RBAC matrix + can() + getMenuItems():**
```typescript
import { ROLES, type Role } from './constants';

export type Resource =
  | 'chuong-trinh' | 'don-vi-chu-tri' | 'de-an' | 'tiep-nhan' | 'tham-dinh'
  | 'phe-duyet' | 'hop-dong' | 'trien-khai' | 'bao-cao' | 'nghiem-thu'
  | 'tai-chinh' | 'danh-muc' | 'nguoi-dung' | 'vai-tro' | 'cau-hinh'
  | 'audit-log' | 'thong-bao' | 'dashboard';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'submit' | 'approve' | 'assign' | 'score';

const MATRIX: Record<Resource, Partial<Record<Action, Role[]>>> = {
  'dashboard':       { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.CHUYENVIEN, ROLES.HOIDONG, ROLES.DONVI, ROLES.TAICHINH, ROLES.LANHDAO] },
  'chuong-trinh':    { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.HOIDONG, ROLES.LANHDAO], create: [ROLES.BANQL], update: [ROLES.BANQL], approve: [ROLES.LANHDAO] },
  'don-vi-chu-tri':  { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO], create: [ROLES.DONVI], update: [ROLES.DONVI], approve: [ROLES.BANQL] },
  'de-an':           { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.CHUYENVIEN, ROLES.HOIDONG, ROLES.DONVI, ROLES.LANHDAO], create: [ROLES.DONVI], update: [ROLES.DONVI, ROLES.BANQL], submit: [ROLES.DONVI], approve: [ROLES.LANHDAO], assign: [ROLES.BANQL] },
  'tiep-nhan':       { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.CHUYENVIEN], create: [ROLES.BANQL], update: [ROLES.BANQL, ROLES.CHUYENVIEN], assign: [ROLES.BANQL] },
  'tham-dinh':       { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.HOIDONG, ROLES.LANHDAO], score: [ROLES.HOIDONG], create: [ROLES.BANQL] },
  'phe-duyet':       { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.LANHDAO, ROLES.DONVI], create: [ROLES.BANQL], approve: [ROLES.LANHDAO] },
  'hop-dong':        { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.TAICHINH, ROLES.LANHDAO], create: [ROLES.BANQL], update: [ROLES.BANQL] },
  'trien-khai':      { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO], create: [ROLES.DONVI], update: [ROLES.DONVI] },
  'bao-cao':         { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO], create: [ROLES.DONVI], update: [ROLES.DONVI], submit: [ROLES.DONVI] },
  'nghiem-thu':      { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO], create: [ROLES.BANQL], update: [ROLES.BANQL] },
  'tai-chinh':       { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.TAICHINH, ROLES.LANHDAO], create: [ROLES.TAICHINH], update: [ROLES.TAICHINH] },
  'danh-muc':        { read: [ROLES.ADMIN, ROLES.BANQL], create: [ROLES.ADMIN], update: [ROLES.ADMIN], delete: [ROLES.ADMIN] },
  'nguoi-dung':      { read: [ROLES.ADMIN], create: [ROLES.ADMIN], update: [ROLES.ADMIN], delete: [ROLES.ADMIN] },
  'vai-tro':         { read: [ROLES.ADMIN], create: [ROLES.ADMIN], update: [ROLES.ADMIN] },
  'cau-hinh':        { read: [ROLES.ADMIN], update: [ROLES.ADMIN] },
  'audit-log':       { read: [ROLES.ADMIN, ROLES.LANHDAO] },
  'thong-bao':       { read: [ROLES.ADMIN, ROLES.BANQL, ROLES.CHUYENVIEN, ROLES.HOIDONG, ROLES.DONVI, ROLES.TAICHINH, ROLES.LANHDAO] },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[resource]?.[action]?.includes(role) ?? false;
}

export type MenuItem = {
  href: string;
  label: string;
  icon: string;
  resource: Resource;
  section: 'NGHIEP_VU' | 'QUAN_TRI';
};

const ALL_MENU_ITEMS: MenuItem[] = [
  { href: '/dashboard',       label: 'Trang chủ',          icon: 'layout-dashboard', resource: 'dashboard',      section: 'NGHIEP_VU' },
  { href: '/chuong-trinh',    label: 'Chu kỳ chương trình',icon: 'calendar-range',   resource: 'chuong-trinh',   section: 'NGHIEP_VU' },
  { href: '/don-vi-chu-tri',  label: 'Đơn vị chủ trì',     icon: 'building-2',       resource: 'don-vi-chu-tri', section: 'NGHIEP_VU' },
  { href: '/de-an',           label: 'Đề án',              icon: 'file-text',        resource: 'de-an',          section: 'NGHIEP_VU' },
  { href: '/tiep-nhan',       label: 'Tiếp nhận hồ sơ',    icon: 'inbox',            resource: 'tiep-nhan',      section: 'NGHIEP_VU' },
  { href: '/tham-dinh',       label: 'Thẩm định',          icon: 'gavel',            resource: 'tham-dinh',      section: 'NGHIEP_VU' },
  { href: '/phe-duyet',       label: 'Phê duyệt',          icon: 'check-square',     resource: 'phe-duyet',      section: 'NGHIEP_VU' },
  { href: '/hop-dong',        label: 'Hợp đồng',           icon: 'file-signature',   resource: 'hop-dong',       section: 'NGHIEP_VU' },
  { href: '/trien-khai',      label: 'Triển khai',         icon: 'play-circle',      resource: 'trien-khai',     section: 'NGHIEP_VU' },
  { href: '/bao-cao',         label: 'Báo cáo kết quả',    icon: 'file-bar-chart',   resource: 'bao-cao',        section: 'NGHIEP_VU' },
  { href: '/nghiem-thu',      label: 'Nghiệm thu',         icon: 'clipboard-check',  resource: 'nghiem-thu',     section: 'NGHIEP_VU' },
  { href: '/tai-chinh',       label: 'Tài chính',          icon: 'wallet',           resource: 'tai-chinh',      section: 'NGHIEP_VU' },
  { href: '/thong-bao',       label: 'Thông báo',          icon: 'bell',             resource: 'thong-bao',      section: 'NGHIEP_VU' },
  { href: '/danh-muc',        label: 'Danh mục',           icon: 'list',             resource: 'danh-muc',       section: 'QUAN_TRI' },
  { href: '/nguoi-dung',      label: 'Người dùng',         icon: 'users',            resource: 'nguoi-dung',     section: 'QUAN_TRI' },
  { href: '/vai-tro',         label: 'Vai trò & quyền',    icon: 'shield',           resource: 'vai-tro',        section: 'QUAN_TRI' },
  { href: '/cau-hinh',        label: 'Cấu hình',           icon: 'settings',         resource: 'cau-hinh',       section: 'QUAN_TRI' },
  { href: '/audit-log',       label: 'Nhật ký truy cập',   icon: 'history',          resource: 'audit-log',      section: 'QUAN_TRI' },
];

export function getMenuItems(role: Role): MenuItem[] {
  return ALL_MENU_ITEMS.filter((item) => can(role, item.resource, 'read'));
}

export function defaultLandingPath(role: Role): string {
  // Role-based redirect after login (per AUTH-01)
  if (role === ROLES.ADMIN) return '/dashboard';
  if (role === ROLES.BANQL) return '/dashboard';
  if (role === ROLES.CHUYENVIEN) return '/tiep-nhan';
  if (role === ROLES.HOIDONG) return '/tham-dinh';
  if (role === ROLES.DONVI) return '/de-an';
  if (role === ROLES.TAICHINH) return '/tai-chinh';
  if (role === ROLES.LANHDAO) return '/dashboard';
  return '/dashboard';
}
```

**File 4: `lib/format.ts` — Vietnamese formatters (per PITFALLS §1.3, STACK §6):**
```typescript
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const toDate = (d: Date | string): Date => (typeof d === 'string' ? parseISO(d) : d);

export const formatDate = (d: Date | string): string =>
  format(toDate(d), 'dd/MM/yyyy', { locale: vi });

export const formatDateTime = (d: Date | string): string =>
  format(toDate(d), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi });

export const formatDateLong = (d: Date | string): string =>
  format(toDate(d), "'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi });

const numberFormatter = new Intl.NumberFormat('vi-VN');
export const formatNumber = (n: number): string => numberFormatter.format(n);

const vndFormatter = new Intl.NumberFormat('vi-VN');
export const formatVND = (n: number): string => `${vndFormatter.format(n)} đồng`;

export const formatVNDCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} triệu`;
  return formatVND(n);
};
```

**File 5: `lib/date.ts` — Relative date helpers (per PITFALLS §2.1):**
```typescript
import { formatDistance, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const MS_PER_DAY = 86_400_000;

export const daysAgo = (n: number): Date => new Date(Date.now() - n * MS_PER_DAY);
export const daysFromNow = (n: number): Date => new Date(Date.now() + n * MS_PER_DAY);

export const formatRelative = (d: Date | string): string => {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatDistance(date, new Date(), { locale: vi, addSuffix: true });
};
```

**File 6: `lib/vi-search.ts` — Diacritics removal (per STACK §6.3):**
```typescript
export function removeDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
```

**File 7: `lib/breadcrumbs.ts` — Breadcrumb labels (per UI-SPEC §Layout Shell Contract → Breadcrumb):**
```typescript
export const BREADCRUMB_LABELS: Record<string, string> = {
  '/dashboard':       'Trang chủ',
  '/chuong-trinh':    'Chu kỳ chương trình',
  '/don-vi-chu-tri':  'Đơn vị chủ trì',
  '/de-an':           'Đề án',
  '/tiep-nhan':       'Tiếp nhận hồ sơ',
  '/tham-dinh':       'Thẩm định',
  '/phe-duyet':       'Phê duyệt',
  '/hop-dong':        'Hợp đồng',
  '/trien-khai':      'Triển khai',
  '/bao-cao':         'Báo cáo kết quả',
  '/nghiem-thu':      'Nghiệm thu',
  '/tai-chinh':       'Tài chính',
  '/thong-bao':       'Thông báo',
  '/danh-muc':        'Danh mục',
  '/nguoi-dung':      'Người dùng',
  '/vai-tro':         'Vai trò & quyền',
  '/cau-hinh':        'Cấu hình',
  '/audit-log':       'Nhật ký truy cập',
  '/de-an/new':       'Tạo đề án mới',
};

export function buildBreadcrumb(pathname: string): Array<{ href: string; label: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const items: Array<{ href: string; label: string }> = [];
  let current = '';
  for (const seg of segments) {
    current += '/' + seg;
    items.push({ href: current, label: BREADCRUMB_LABELS[current] ?? seg });
  }
  return items;
}
```

**File 8: `lib/menu.ts` — Re-export menu helpers cho convenient import:**
```typescript
export { getMenuItems, defaultLandingPath, type MenuItem } from './permissions';
```

**File 9-14: State machine skeletons trong `lib/workflows/`** (mỗi file ~30-50 dòng, theo pattern PITFALLS §4.1 + ARCHITECTURE §4.2):

`lib/workflows/programCycle.ts` (per ARCHITECTURE §4.2 + REQUIREMENTS CYCLE-05):
```typescript
export type ProgramCycleStatus =
  | 'DRAFT' | 'READY' | 'OPEN_REGISTRATION' | 'CLOSED_REGISTRATION'
  | 'EVALUATING' | 'APPROVED' | 'COMPLETED';

const TRANSITIONS: Record<ProgramCycleStatus, ProgramCycleStatus[]> = {
  DRAFT:               ['READY'],
  READY:               ['OPEN_REGISTRATION', 'DRAFT'],
  OPEN_REGISTRATION:   ['CLOSED_REGISTRATION'],
  CLOSED_REGISTRATION: ['EVALUATING', 'OPEN_REGISTRATION'],
  EVALUATING:          ['APPROVED'],
  APPROVED:            ['COMPLETED'],
  COMPLETED:           [],
};

export function canTransitionCycle(from: ProgramCycleStatus, to: ProgramCycleStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const CYCLE_STATUS_LABELS: Record<ProgramCycleStatus, string> = {
  DRAFT: 'Bản nháp',
  READY: 'Sẵn sàng',
  OPEN_REGISTRATION: 'Đang mở đăng ký',
  CLOSED_REGISTRATION: 'Đã đóng đăng ký',
  EVALUATING: 'Đang thẩm định',
  APPROVED: 'Đã phê duyệt',
  COMPLETED: 'Hoàn thành',
};
```

`lib/workflows/project.ts` (16 status từ ARCHITECTURE §3.2 ProjectStatus enum):
```typescript
export type ProjectStatus =
  | 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'ASSIGNED' | 'UNDER_REVIEW'
  | 'RETURNED_FOR_REVISION' | 'VALIDATED' | 'EVALUATING' | 'EVALUATED'
  | 'APPROVED' | 'REJECTED' | 'CONTRACTED' | 'IN_PROGRESS'
  | 'COMPLETED' | 'LIQUIDATED' | 'CANCELLED';

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT:                  ['SUBMITTED', 'CANCELLED'],
  SUBMITTED:              ['RECEIVED', 'CANCELLED'],
  RECEIVED:               ['ASSIGNED'],
  ASSIGNED:               ['UNDER_REVIEW'],
  UNDER_REVIEW:           ['RETURNED_FOR_REVISION', 'VALIDATED'],
  RETURNED_FOR_REVISION:  ['SUBMITTED'],
  VALIDATED:              ['EVALUATING'],
  EVALUATING:             ['EVALUATED'],
  EVALUATED:              ['APPROVED', 'REJECTED'],
  APPROVED:               ['CONTRACTED'],
  REJECTED:               [],
  CONTRACTED:             ['IN_PROGRESS'],
  IN_PROGRESS:            ['COMPLETED'],
  COMPLETED:              ['LIQUIDATED'],
  LIQUIDATED:             [],
  CANCELLED:              [],
};

export function canTransitionProject(from: ProjectStatus, to: ProjectStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Đang khai báo',
  SUBMITTED: 'Đã nộp',
  RECEIVED: 'Đã tiếp nhận',
  ASSIGNED: 'Đã phân công',
  UNDER_REVIEW: 'Đang kiểm tra',
  RETURNED_FOR_REVISION: 'Yêu cầu bổ sung',
  VALIDATED: 'Hợp lệ',
  EVALUATING: 'Đang thẩm định',
  EVALUATED: 'Đã thẩm định',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Bị từ chối',
  CONTRACTED: 'Đã ký HĐ',
  IN_PROGRESS: 'Đang triển khai',
  COMPLETED: 'Đã nghiệm thu',
  LIQUIDATED: 'Đã thanh lý',
  CANCELLED: 'Đã hủy',
};
```

`lib/workflows/orgProfile.ts`:
```typescript
export type OrgProfileStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
const TRANSITIONS: Record<OrgProfileStatus, OrgProfileStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['DRAFT'],
  REJECTED: ['DRAFT'],
};
export function canTransitionOrgProfile(from: OrgProfileStatus, to: OrgProfileStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
export const ORG_PROFILE_STATUS_LABELS: Record<OrgProfileStatus, string> = {
  DRAFT: 'Bản nháp', SUBMITTED: 'Đã gửi', APPROVED: 'Đã phê duyệt', REJECTED: 'Bị từ chối',
};
```

`lib/workflows/scoreSheet.ts`:
```typescript
export type ScoreSheetStatus = 'DRAFT' | 'SUBMITTED';
export function canTransitionScoreSheet(from: ScoreSheetStatus, to: ScoreSheetStatus): boolean {
  return from === 'DRAFT' && to === 'SUBMITTED';
}
export const SCORE_SHEET_STATUS_LABELS: Record<ScoreSheetStatus, string> = {
  DRAFT: 'Đang chấm', SUBMITTED: 'Đã nộp',
};
```

`lib/workflows/contract.ts`:
```typescript
export type ContractStatus = 'DRAFT' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'LIQUIDATED' | 'OVERDUE';
const TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['SIGNED', 'OVERDUE'],
  SIGNED: ['ACTIVE'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: ['LIQUIDATED'],
  LIQUIDATED: [],
  OVERDUE: ['SIGNED'],
};
export function canTransitionContract(from: ContractStatus, to: ContractStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Bản nháp', SIGNED: 'Đã ký', ACTIVE: 'Đang triển khai',
  COMPLETED: 'Hoàn thành', LIQUIDATED: 'Đã thanh lý', OVERDUE: 'Quá hạn ký',
};
```

`lib/workflows/report.ts`:
```typescript
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'ACCEPTED';
const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['RETURNED', 'ACCEPTED'],
  RETURNED: ['SUBMITTED'],
  ACCEPTED: [],
};
export function canTransitionReport(from: ReportStatus, to: ReportStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: 'Bản nháp', SUBMITTED: 'Đã nộp', RETURNED: 'Trả bổ sung', ACCEPTED: 'Đã duyệt',
};
```

**File 15: `types/next-auth.d.ts` — Module augmentation skeleton (Plan 03 sẽ wire NextAuth thật):**
```typescript
import type { Role } from '@/lib/constants';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: Role;
      organizationId: string | null;
      organizationName: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationId: string | null;
    organizationName: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationId: string | null;
    organizationName: string | null;
  }
}
```

**Lưu ý chung:**
- Mọi file dùng `export` named (KHÔNG default export trừ React component)
- Comment chỉ khi WHY không rõ — KHÔNG add header comment vô nghĩa (per CLAUDE.md §8.4)
- Tất cả label tiếng Việt là string literal, code identifier tiếng Anh
- KHÔNG hardcode magic number — dùng const từ SLA_THRESHOLDS trong constants.ts
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f lib/prisma.ts &amp;&amp;
      grep -q 'PrismaClient' lib/prisma.ts &amp;&amp;
      grep -q 'globalForPrisma' lib/prisma.ts &amp;&amp;
      test -f lib/constants.ts &amp;&amp;
      grep -q 'export const TERMS' lib/constants.ts &amp;&amp;
      grep -q 'DE_AN' lib/constants.ts &amp;&amp;
      grep -q 'THAM_DINH' lib/constants.ts &amp;&amp;
      grep -q 'KIEM_TRA_HO_SO' lib/constants.ts &amp;&amp;
      grep -q 'export const ROLES' lib/constants.ts &amp;&amp;
      grep -q 'HARDCODED_USERS' lib/constants.ts &amp;&amp;
      grep -q 'donvi1' lib/constants.ts &amp;&amp;
      grep -q 'Donvi@123' lib/constants.ts &amp;&amp;
      grep -q 'SLA_THRESHOLDS' lib/constants.ts &amp;&amp;
      test -f lib/permissions.ts &amp;&amp;
      grep -q 'export function can' lib/permissions.ts &amp;&amp;
      grep -q 'export function getMenuItems' lib/permissions.ts &amp;&amp;
      grep -q 'defaultLandingPath' lib/permissions.ts &amp;&amp;
      grep -q "'tham-dinh'" lib/permissions.ts &amp;&amp;
      test -f lib/format.ts &amp;&amp;
      grep -q "locale: vi" lib/format.ts &amp;&amp;
      grep -q "formatVND" lib/format.ts &amp;&amp;
      grep -q "đồng" lib/format.ts &amp;&amp;
      test -f lib/date.ts &amp;&amp;
      grep -q 'daysAgo' lib/date.ts &amp;&amp;
      grep -q 'daysFromNow' lib/date.ts &amp;&amp;
      test -f lib/vi-search.ts &amp;&amp;
      grep -q 'removeDiacritics' lib/vi-search.ts &amp;&amp;
      grep -q "normalize('NFD')" lib/vi-search.ts &amp;&amp;
      test -f lib/breadcrumbs.ts &amp;&amp;
      grep -q 'BREADCRUMB_LABELS' lib/breadcrumbs.ts &amp;&amp;
      grep -q 'Trang chủ' lib/breadcrumbs.ts &amp;&amp;
      test -f lib/menu.ts &amp;&amp;
      test -f lib/workflows/programCycle.ts &amp;&amp;
      grep -q 'OPEN_REGISTRATION' lib/workflows/programCycle.ts &amp;&amp;
      grep -q 'canTransitionCycle' lib/workflows/programCycle.ts &amp;&amp;
      test -f lib/workflows/project.ts &amp;&amp;
      grep -q 'SUBMITTED' lib/workflows/project.ts &amp;&amp;
      test -f lib/workflows/orgProfile.ts &amp;&amp;
      test -f lib/workflows/scoreSheet.ts &amp;&amp;
      test -f lib/workflows/contract.ts &amp;&amp;
      test -f lib/workflows/report.ts &amp;&amp;
      test -f types/next-auth.d.ts &amp;&amp;
      grep -q "declare module 'next-auth'" types/next-auth.d.ts &amp;&amp;
      grep -q 'role: Role' types/next-auth.d.ts &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `lib/constants.ts` exports `TERMS` chứa exact 21 keys: `DE_AN`, `CHU_KY_CHUONG_TRINH`, `DON_VI_CHU_TRI`, `KIEM_TRA_HO_SO`, `THAM_DINH`, `PHE_DUYET`, `NGHIEM_THU`, `THANH_LY_HOP_DONG`, `QUYET_TOAN`, `TAM_UNG`, `THUONG_VU`, `HO_SO`, `TO_TRINH`, `QUYET_DINH`, `HOI_DONG_THAM_DINH`, `CHUYEN_VIEN`, `BAN_QUAN_LY`, `DIEU_CHINH`, `TRIEN_KHAI`, `BAO_CAO`, `CONG_VAN`
    - `lib/constants.ts` exports `HARDCODED_USERS` array có exact 8 elements với username `admin`, `banql`, `chuyenvien`, `hoidong`, `donvi1`, `donvi2`, `taichinh`, `lanhdao` mapping đúng password + role + orgCode (per CLAUDE.md §5)
    - `lib/constants.ts` exports `SLA_THRESHOLDS = { CONTRACT_DAYS: 60, REPORT_DAYS: 15, CONSULATE_DAYS: 30, REGISTRATION_DEADLINE_MMDD: '05-30' }`
    - `lib/permissions.ts` exports `can()`, `getMenuItems()`, `defaultLandingPath()`, types `Resource`, `Action`, `MenuItem`
    - `lib/permissions.ts` `can('DONVI', 'de-an', 'create')` returns `true` (verify behavioral correctness via tsc + manual smoke trong test trong file scratch nếu cần)
    - `lib/permissions.ts` `can('DONVI', 'phe-duyet', 'approve')` returns `false` (default-deny)
    - `lib/format.ts` exports đủ 5 functions: `formatDate`, `formatDateTime`, `formatDateLong`, `formatVND`, `formatVNDCompact`, `formatNumber`
    - `lib/format.ts` import `vi` từ `date-fns/locale`, `formatVND` ghép suffix `' đồng'`
    - `lib/date.ts` exports `daysAgo`, `daysFromNow`, `formatRelative`
    - `lib/vi-search.ts` `removeDiacritics('Đề án Việt Nam')` returns `'de an viet nam'`
    - `lib/breadcrumbs.ts` `BREADCRUMB_LABELS['/dashboard'] === 'Trang chủ'`, `BREADCRUMB_LABELS['/de-an'] === 'Đề án'`
    - 6 files trong `lib/workflows/` exists, mỗi file có status type union + transition table + canTransitionXxx function + STATUS_LABELS map
    - `lib/workflows/programCycle.ts` `canTransitionCycle('CLOSED_REGISTRATION', 'OPEN_REGISTRATION') === true` (gia hạn flow per CYCLE-10)
    - `lib/workflows/programCycle.ts` `canTransitionCycle('APPROVED', 'DRAFT') === false` (no rollback)
    - `types/next-auth.d.ts` augments `Session.user` với `id, username, fullName, role, organizationId, organizationName`
    - `npx tsc --noEmit` exit code 0 (no type errors)
    - `grep -rn "any" lib/ --include="*.ts"` returns no occurrence của `: any` (strict typing)
  </acceptance_criteria>
  <done>
    Toàn bộ foundation libs đã viết: TERMS dictionary (21 keys), 8 hardcoded users mapping, RBAC matrix với 18 resources × 8 actions, 5 Vietnamese formatters, relative date helpers, diacritics removal, breadcrumb labels, dynamic menu builder, 6 state machines (programCycle 7-state, project 16-state, orgProfile 4-state, scoreSheet 2-state, contract 6-state, report 4-state), NextAuth module augmentation. typecheck pass.
  </done>
</task>

</tasks>

<verification>
**Phase-level checks (Plan 01):**
1. `npm run typecheck` exit 0 — TypeScript strict pass
2. `npm run lint` exit 0 (warnings allowed for unused; errors must be 0)
3. `npm run build` exit 0 — Next 15 build skeleton thành công (root layout + redirect home)
4. `npm run format:check` exit 0 (Prettier format consistent)
5. `git ls-files | grep -E '^\.env\.local$'` returns empty (secrets không commit)
6. `git ls-files | grep prisma/dev.db` returns empty (DB không commit)
7. Smoke import test (manual): `node --input-type=module -e "import('./lib/constants.ts')"` không throw — đã được tsc cover
</verification>

<success_criteria>
Plan 01 thành công khi:
- Repo Next.js 15 + React 19 + TypeScript strict + Tailwind v4 + shadcn CLI new-york preset đã init
- Đầy đủ 25+ runtime dependencies + 4 dev dependencies cài thành công, lockfile committed
- shadcn `lib/utils.ts` có `cn()` helper
- 13 file lib/ helper foundation (prisma, constants, permissions, format, date, vi-search, breadcrumbs, menu, 6 workflows) viết đầy đủ với contract chính xác như `<interfaces>` block
- `types/next-auth.d.ts` augment Session với role + orgId
- Folder skeleton (app/, components/, features/, lib/, prisma/dir-only-no-file, public/, storage/, types/) tồn tại
- ESLint + Prettier config + .env.example + .env.local + .gitignore đầy đủ
- typecheck + lint + build pass
- Plan 02 (Prisma schema) có thể bắt đầu mà không cần sửa foundation lib
- Plan 03 (NextAuth) có thể wire callbacks vào types/next-auth.d.ts đã chuẩn bị
- Plan 04 (Layout shell) có thể dùng `getMenuItems(role)` + `BREADCRUMB_LABELS` từ Plan 01 mà không cần xây thêm
- Plan 06 (PDF spike) có font Be Vietnam Pro chỗ `next/font` cho UI; PDF dùng static TTF riêng
</success_criteria>

<output>
Sau hoàn thành, tạo `.planning/phases/01-m0-bootstrap-h-t-ng/01-01-repo-init-SUMMARY.md` ghi nhận:
- Versions cuối cùng đã cài (đọc từ package.json sau npm install)
- Bất kỳ deviation nào so với STACK.md §13 (vd nếu một version range không resolve)
- AUTH_SECRET strategy (sinh ngẫu nhiên, lưu .env.local, không commit)
- shadcn CLI version đã chạy
- File counts: bao nhiêu file đã tạo trong lib/, components/, types/
- Confirmation rằng Plan 02 có thể chạy `prisma init` mà không xung đột
</output>
