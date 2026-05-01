---
phase: 01-m0-bootstrap-h-t-ng
plan: 05
type: execute
wave: 4
depends_on: [01, 03, 04]
files_modified:
  - app/(auth)/layout.tsx
  - app/(auth)/login/page.tsx
  - components/auth/LoginForm.tsx
  - components/auth/SsoPlaceholderButton.tsx
  - components/auth/QuocHuySvg.tsx
  - app/(app)/dashboard/page.tsx
  - app/not-found.tsx
  - app/error.tsx
  - app/global-error.tsx
  - public/logo-quoc-huy.svg
autonomous: true
requirements:
  - AUTH-01
  - AUTH-05
  - AUTH-06
  - AUTH-08
user_setup: []
must_haves:
  truths:
    - "Trang /login render đúng UI-SPEC: split 60/40 desktop ≥1024px, brand panel trái với Quốc huy SVG + 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM' + wordmark XTTMQG, form panel phải với 2 inputs + 2 buttons + 1 divider"
    - "Login form RHF + Zod validation Vietnamese: empty username 'Vui lòng nhập tên đăng nhập', empty password 'Vui lòng nhập mật khẩu'"
    - "Submit form với donvi1/Donvi@123 redirect /de-an (defaultLandingPath cho DONVI)"
    - "Submit form với wrong creds hiện Alert error 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại'"
    - "Loading state khi submit: button disable + Loader2 spinner + 'Đang đăng nhập...'"
    - "Click 'Đăng nhập SSO Bộ Công Thương' → Sonner info toast 'Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án'"
    - "Trang /dashboard render placeholder với 'Xin chào, {fullName}' + 'Bạn đang đăng nhập với vai trò {roleLabel}' + empty state card"
    - "Trang 404 (app/not-found.tsx) render hero 404 navy text-blue-700 + heading 'Không tìm thấy trang' + body + CTA 'Quay về trang chủ' — KHÔNG render stack trace"
    - "Trang 500 (app/error.tsx + app/global-error.tsx) render hero 500 red text-red-600 + heading 'Đã xảy ra lỗi' + 2 CTA 'Thử lại' + 'Quay về trang chủ' — KHÔNG render error.message hay error.stack"
  artifacts:
    - path: "app/(auth)/layout.tsx"
      provides: "Auth route group layout — minimal, NO AppShell, full-bleed cho split 60/40"
      exports: ["default AuthLayout"]
    - path: "app/(auth)/login/page.tsx"
      provides: "Login page với brand panel + LoginForm. Server check: nếu đã auth, redirect dashboard"
      exports: ["default LoginPage"]
    - path: "components/auth/LoginForm.tsx"
      provides: "Client form với RHF + Zod + useActionState wrap loginAction. Error inline + Alert. Show/hide password toggle."
      exports: ["LoginForm"]
    - path: "components/auth/SsoPlaceholderButton.tsx"
      provides: "Button outline với icon building-2 + Sonner info toast onClick"
      exports: ["SsoPlaceholderButton"]
    - path: "components/auth/QuocHuySvg.tsx"
      provides: "SVG inline Quốc huy navy outline 80×80px"
      exports: ["QuocHuySvg"]
    - path: "app/(app)/dashboard/page.tsx"
      provides: "Placeholder dashboard với greeting + role line + empty state"
      exports: ["default DashboardPage"]
    - path: "app/not-found.tsx"
      provides: "Trang 404 centered hero, navy 404, no stack trace"
      exports: ["default NotFound"]
    - path: "app/error.tsx"
      provides: "Trang 500 cho route segment errors"
      exports: ["default Error"]
    - path: "app/global-error.tsx"
      provides: "Trang 500 fallback root-level"
      exports: ["default GlobalError"]
    - path: "public/logo-quoc-huy.svg"
      provides: "Quốc huy SVG simple outline (placeholder)"
      contains: ""
  key_links:
    - from: "components/auth/LoginForm.tsx"
      to: "app/(auth)/_actions/login.ts loginAction"
      via: "useActionState"
      pattern: "loginAction"
    - from: "app/(auth)/login/page.tsx"
      to: "lib/auth.ts auth()"
      via: "skip login if already authenticated"
      pattern: "redirect.*defaultLandingPath"
    - from: "app/(app)/dashboard/page.tsx"
      to: "lib/auth.ts auth()"
      via: "RSC reads session for greeting"
      pattern: "session.user.fullName"
---

<objective>
Hoàn thiện UI Phase 1: trang Login (split 60/40 brand panel + form per UI-SPEC §Page-Level Specs), trang 404/500, dashboard placeholder. Đây là cuối cùng wire mọi mảnh Plan 01-04 lại với nhau thành flow user-facing complete: user truy cập → thấy login đẹp → đăng nhập → redirect role-based → thấy dashboard với layout shell.

Purpose:
- Satisfy AUTH-01 (đăng nhập thành công + redirect role-based)
- Satisfy AUTH-05 (SSO placeholder button + Sonner toast)
- Satisfy AUTH-06 last piece (dashboard placeholder để verify layout shell)
- Satisfy AUTH-08 (404/500 tiếng Việt no stack trace)
- Đóng phase 1 với end-to-end verifiable flow

Output:
- 9 file UI components + pages + 1 SVG asset
- Login page pixel-perfect theo UI-SPEC §Login Page
- 404/500 hero pattern theo UI-SPEC §404/500 Page
- Dashboard placeholder theo UI-SPEC §Dashboard Placeholder
- Manual UAT khả thi: 8 tài khoản đăng nhập đều thấy đúng menu + greeting + redirect
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-01-repo-init-PLAN.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-03-nextauth-credentials-PLAN.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-04-layout-shell-PLAN.md
@CLAUDE.md
</context>

<interfaces>
<!-- Plan 05 wires all upstream artifacts into user-facing pages. No new exports needed beyond default page exports. -->

```typescript
// app/(auth)/layout.tsx
export default async function AuthLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element>;

// app/(auth)/login/page.tsx
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string>> }): Promise<JSX.Element>;

// components/auth/LoginForm.tsx
'use client';
export function LoginForm(): JSX.Element;

// app/(app)/dashboard/page.tsx
export default async function DashboardPage(): Promise<JSX.Element>;

// app/not-found.tsx — special Next.js convention
export default function NotFound(): JSX.Element;

// app/error.tsx — special Next.js convention
'use client';
export default function Error({ error, reset }: { error: Error &amp; { digest?: string }; reset: () => void }): JSX.Element;

// app/global-error.tsx — special Next.js convention (root-level fallback)
'use client';
export default function GlobalError({ error, reset }: { error: Error &amp; { digest?: string }; reset: () => void }): JSX.Element;
```
</interfaces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → Login form (Server Action) | FormData submit to `loginAction` (Plan 03) |
| Browser → SSO placeholder click | Client-side toast, no server interaction |
| Browser → Error boundary | Error.tsx receives `error` prop with potential stack trace |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-01 | I (Information Disclosure) | Stack trace leak qua error.tsx | mitigate | `app/error.tsx` và `app/global-error.tsx` MUST NOT render `error.message` hay `error.stack` lên UI. Hiển thị generic message "Đã xảy ra lỗi" + "Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút". Optionally log `error` qua `console.error` for dev debug — không lộ ra prod UI. Verify bằng grep `error.message` không xuất hiện trong JSX của error.tsx. |
| T-05-02 | I | Login error revealing user existence | mitigate | LoginForm hiển thị error từ `loginAction` state — chỉ chứa generic message từ Plan 03 (`'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại'`). KHÔNG split client-side thành "username not found" vs "wrong password". |
| T-05-03 | I | callbackUrl param open redirect | mitigate | `LoginPage` đọc `searchParams.next` (callbackUrl) — Plan 03 `defaultLandingPath` đã handle role-based redirect. Login form KHÔNG honor `next` param từ URL trừ khi nó là same-origin path matching whitelist (`/dashboard`, `/de-an`, `/tham-dinh`, `/tiep-nhan`, `/tai-chinh`). For Plan 05 simplicity: ignore `next` param entirely, dùng `defaultLandingPath(role)` từ loginAction. |
| T-05-04 | T (Tampering) | Form CSRF | mitigate | Login form dùng `<form action={formAction}>` với `useActionState` — Next.js Server Actions có built-in CSRF protection (action ID hash + Origin header check). KHÔNG cần manual CSRF token. |
| T-05-05 | I | Password autocomplete leak via DOM | accept | Browser autocomplete=current-password is a feature (UI-SPEC implicit). Field type="password" mask hiển thị. Show/hide toggle là UX feature. |
| T-05-06 | I | Already-authenticated user accessing /login | mitigate | `LoginPage` MUST `await auth()` first; if `session?.user` exists, redirect to `defaultLandingPath(session.user.role)`. Defense-in-depth alongside middleware (Plan 03). |
| T-05-07 | T | Quoc huy SVG XSS | accept | SVG file inline qua `<QuocHuySvg />` React component — React tự escape; không có user content embedded. SVG file `public/logo-quoc-huy.svg` không bao giờ render qua dangerouslySetInnerHTML. |
| T-05-08 | E | Rate limit brute force on /login | accept | POC scope (research SUMMARY explicit out-of-scope SEC). Production phase 2 sẽ add. |
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Login page split 60/40 + LoginForm với RHF/Zod + SSO placeholder + Quốc huy SVG (per UI-SPEC §Login Page)</name>
  <files>app/(auth)/layout.tsx, app/(auth)/login/page.tsx, components/auth/LoginForm.tsx, components/auth/SsoPlaceholderButton.tsx, components/auth/QuocHuySvg.tsx, public/logo-quoc-huy.svg</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (toàn bộ §Login Page section + §Color §Typography §Copywriting Contract + §Brand Element Treatment + §Accessibility Contract)
    - d:/Thaodnp/XTTM/app/(auth)/_actions/login.ts (Plan 03 — loginAction signature LoginState)
    - d:/Thaodnp/XTTM/lib/auth.ts (Plan 03 — auth())
    - d:/Thaodnp/XTTM/lib/permissions.ts (Plan 01 — defaultLandingPath)
    - d:/Thaodnp/XTTM/components/ui/button.tsx (Plan 04)
    - d:/Thaodnp/XTTM/components/ui/input.tsx (Plan 04)
    - d:/Thaodnp/XTTM/components/ui/label.tsx (Plan 04)
    - d:/Thaodnp/XTTM/components/ui/card.tsx (Plan 04)
    - d:/Thaodnp/XTTM/components/ui/alert.tsx (Plan 04)
    - d:/Thaodnp/XTTM/components/ui/separator.tsx (Plan 04)
  </read_first>
  <action>
**File 1: `public/logo-quoc-huy.svg`** — Simple Quốc huy outline SVG (placeholder, no copyright issue per UI-SPEC §Brand Element):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="40" cy="40" r="36" />
  <path d="M40 12 L42 30 L60 30 L46 42 L52 60 L40 50 L28 60 L34 42 L20 30 L38 30 Z" />
  <text x="40" y="72" text-anchor="middle" font-size="6" font-family="serif" fill="currentColor" stroke="none">VIỆT NAM</text>
</svg>
```
Note: Đây là placeholder simplified — UI-SPEC mention dùng "Quốc huy SVG outline navy 80×80" và KHÔNG dùng raster image của Bộ CT (tránh copyright). Placeholder dạng vòng tròn + ngôi sao 5 cánh là acceptable cho POC visual.

**File 2: `components/auth/QuocHuySvg.tsx`** — React component wrap SVG:
```tsx
export function QuocHuySvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="40" cy="40" r="36" />
      <path d="M40 12 L42 30 L60 30 L46 42 L52 60 L40 50 L28 60 L34 42 L20 30 L38 30 Z" />
    </svg>
  );
}
```

**File 3: `components/auth/SsoPlaceholderButton.tsx`** — Outline button với toast:
```tsx
'use client';

import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SsoPlaceholderButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={() => {
        toast.info('Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án');
      }}
    >
      <Building2 className="mr-2 h-4 w-4" />
      Đăng nhập SSO Bộ Công Thương
    </Button>
  );
}
```

**File 4: `components/auth/LoginForm.tsx`** — Form với useActionState + show/hide password:
```tsx
'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginAction, type LoginState } from '@/app/(auth)/_actions/login';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error &amp;&amp; (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập tên đăng nhập"
          autoComplete="username"
          autoFocus
          aria-invalid={!!state.fieldErrors?.username}
          className="h-10"
        />
        {state.fieldErrors?.username?.[0] &amp;&amp; (
          <p className="text-sm text-red-600">{state.fieldErrors.username[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            aria-invalid={!!state.fieldErrors?.password}
            className="h-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {state.fieldErrors?.password?.[0] &amp;&amp; (
          <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full mt-6 bg-blue-700 hover:bg-blue-800"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang đăng nhập...
        </>
      ) : (
        'Đăng nhập'
      )}
    </Button>
  );
}
```

**File 5: `app/(auth)/layout.tsx`** — Minimal auth layout, không AppShell:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```
KHÔNG render `<html>` hay `<body>` — root layout (Plan 01) đã handle. KHÔNG add ThemeProvider / QueryProvider — login không cần TanStack Query.

**File 6: `app/(auth)/login/page.tsx`** — Server Component split 60/40:
```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { LoginForm } from '@/components/auth/LoginForm';
import { SsoPlaceholderButton } from '@/components/auth/SsoPlaceholderButton';
import { QuocHuySvg } from '@/components/auth/QuocHuySvg';

export const metadata = { title: 'Đăng nhập hệ thống' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(defaultLandingPath(session.user.role));
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-3/5 flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-12">
        <QuocHuySvg className="h-20 w-20 text-blue-700" />
        <div className="text-center space-y-1" style={{ fontFamily: 'Times New Roman, serif' }}>
          <p className="text-sm italic text-slate-700 leading-relaxed">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="text-sm italic text-slate-700 leading-relaxed">Độc lập - Tự do - Hạnh phúc</p>
          <div className="flex justify-center pt-2">
            <span className="block w-24 border-t border-slate-400" />
          </div>
        </div>
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-4xl font-bold text-blue-700">XTTMQG</h1>
          <p className="text-base text-slate-600">
            Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          Bộ Công Thương — Cục Xúc tiến Thương mại
        </p>
      </aside>

      <section className="flex-1 lg:w-2/5 flex flex-col items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8 gap-3">
            <QuocHuySvg className="h-16 w-16 text-blue-700" />
            <h1 className="text-2xl font-bold text-blue-700">XTTMQG</h1>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">Đăng nhập hệ thống</h2>
          <p className="text-sm text-slate-600 mt-1">Vui lòng đăng nhập để tiếp tục</p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-slate-500">Hoặc</span>
            <Separator className="flex-1" />
          </div>

          <SsoPlaceholderButton />

          <p className="text-sm text-slate-400 mt-8 text-center">Phiên bản POC · 2026</p>
        </div>
      </section>
    </div>
  );
}
```

**Verify visual lock với UI-SPEC §Login Page:**
- Split 60/40 desktop ≥1024px (`lg:flex-row`, `lg:w-3/5`, `lg:w-2/5`) ✓
- Brand panel left với gradient `from-slate-50 via-white to-blue-50` ✓
- Quốc huy SVG 80×80px navy outline ✓
- Times New Roman italic Quốc hiệu ✓
- Wordmark `text-4xl font-bold text-blue-700` ✓
- Login card `max-w-md` ✓
- Card title `text-2xl font-semibold` "Đăng nhập hệ thống" ✓
- Subtitle `text-sm text-slate-600` "Vui lòng đăng nhập để tiếp tục" ✓
- Spacing `mt-8` form + `space-y-4` ✓
- Inputs `h-10` ✓
- Primary CTA `bg-blue-700 hover:bg-blue-800` `w-full mt-6` "Đăng nhập" ✓
- Divider with text "Hoặc" `my-6` `text-sm text-slate-500` ✓
- SSO outline button với icon building-2 prefix ✓
- Mobile: brand collapsed thành header thu gọn (lg:hidden block ở phần form) ✓
- Footer `Phiên bản POC · 2026` `text-sm text-slate-400 mt-8 text-center` ✓
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f public/logo-quoc-huy.svg &amp;&amp;
      test -f components/auth/QuocHuySvg.tsx &amp;&amp;
      test -f components/auth/SsoPlaceholderButton.tsx &amp;&amp;
      test -f components/auth/LoginForm.tsx &amp;&amp;
      test -f "app/(auth)/layout.tsx" &amp;&amp;
      test -f "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'useActionState' components/auth/LoginForm.tsx &amp;&amp;
      grep -q 'loginAction' components/auth/LoginForm.tsx &amp;&amp;
      grep -q 'useFormStatus' components/auth/LoginForm.tsx &amp;&amp;
      grep -q 'Vui lòng nhập tên đăng nhập\|Nhập tên đăng nhập' components/auth/LoginForm.tsx &amp;&amp;
      grep -q 'Đang đăng nhập' components/auth/LoginForm.tsx &amp;&amp;
      grep -q 'autoComplete="current-password"' components/auth/LoginForm.tsx &amp;&amp;
      grep -q 'Hiển thị mật khẩu' components/auth/LoginForm.tsx &amp;&amp;
      grep -q 'bg-blue-700 hover:bg-blue-800' components/auth/LoginForm.tsx &amp;&amp;
      grep -q "Tính năng đăng nhập SSO sẽ có ở giai đoạn 2" components/auth/SsoPlaceholderButton.tsx &amp;&amp;
      grep -q 'toast.info' components/auth/SsoPlaceholderButton.tsx &amp;&amp;
      grep -q 'Building2' components/auth/SsoPlaceholderButton.tsx &amp;&amp;
      grep -q 'lg:w-3/5' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'lg:w-2/5' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'Độc lập - Tự do - Hạnh phúc' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'XTTMQG' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'Bộ Công Thương — Cục Xúc tiến Thương mại' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'Đăng nhập hệ thống' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'Vui lòng đăng nhập để tiếp tục' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'Phiên bản POC · 2026' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'await auth' "app/(auth)/login/page.tsx" &amp;&amp;
      grep -q 'defaultLandingPath' "app/(auth)/login/page.tsx" &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `public/logo-quoc-huy.svg` exists (≥200 bytes — vector with circle + star path)
    - `components/auth/QuocHuySvg.tsx` exports `QuocHuySvg` React component với viewBox 0 0 80 80
    - `components/auth/SsoPlaceholderButton.tsx` is `'use client'`, button onClick triggers `toast.info('Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án')`
    - `components/auth/SsoPlaceholderButton.tsx` button có icon `Building2` prefix + label `Đăng nhập SSO Bộ Công Thương`
    - `components/auth/LoginForm.tsx` uses `useActionState(loginAction, initialState)` + `useFormStatus` for pending state
    - `LoginForm.tsx` shows Alert variant destructive khi `state.error` truthy, inline `text-sm text-red-600` cho field errors
    - `LoginForm.tsx` show/hide password toggle với aria-label `Hiển thị mật khẩu` / `Ẩn mật khẩu` per UI-SPEC Copywriting
    - `LoginForm.tsx` submit button: pending state hiện `Loader2 animate-spin` + `Đang đăng nhập...`, không pending hiện `Đăng nhập`
    - `LoginForm.tsx` autoFocus on username input
    - `LoginForm.tsx` autoComplete: `username` cho input1, `current-password` cho input2
    - `app/(auth)/layout.tsx` minimal: just `<>{children}</>` (no provider, no shell)
    - `app/(auth)/login/page.tsx` is async RSC, calls `await auth()`, redirects `defaultLandingPath(session.user.role)` nếu đã auth
    - `app/(auth)/login/page.tsx` split 60/40 layout với `lg:w-3/5` (brand left) + `lg:w-2/5` (form right)
    - Brand panel chứa exact: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM`, `Độc lập - Tự do - Hạnh phúc`, wordmark `XTTMQG` text-4xl font-bold text-blue-700, tagline tiếng Việt, footer `Bộ Công Thương — Cục Xúc tiến Thương mại`
    - Form panel chứa exact: title `Đăng nhập hệ thống` text-2xl font-semibold, subtitle `Vui lòng đăng nhập để tiếp tục`, divider with `Hoặc`, SSO button below, footer `Phiên bản POC · 2026`
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    Login page pixel-perfect theo UI-SPEC: split 60/40 brand panel (Quốc huy + Quốc hiệu + XTTMQG wordmark + tagline + Bộ CT footer), form panel (title + subtitle + 2 inputs với eye toggle + primary blue button + divider + SSO outline button + version footer). Form wire useActionState với loginAction. SSO toast Vietnamese. Already-auth redirect.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Dashboard placeholder per UI-SPEC + 404/500 hero pages without stack trace</name>
  <files>app/(app)/dashboard/page.tsx, app/not-found.tsx, app/error.tsx, app/global-error.tsx</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (§Dashboard Placeholder, §404 Page, §500 Page sections + §Empty State Pattern)
    - d:/Thaodnp/XTTM/lib/auth.ts (Plan 03 — auth())
    - d:/Thaodnp/XTTM/lib/constants.ts (Plan 01 — ROLE_LABELS)
    - d:/Thaodnp/XTTM/components/ui/card.tsx (Plan 04)
    - d:/Thaodnp/XTTM/components/ui/button.tsx (Plan 04)
  </read_first>
  <action>
**File 1: Overwrite `app/(app)/dashboard/page.tsx`** (Plan 03 placeholder):
```tsx
import { LayoutDashboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/constants';

export const metadata = { title: 'Trang chủ' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null; // (app) layout đã redirect; thêm guard cho TS narrowing

  const { fullName, role, organizationName } = session.user;
  const roleLine = organizationName != null
    ? `${ROLE_LABELS[role]} · ${organizationName}`
    : ROLE_LABELS[role];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Xin chào, {fullName}</h1>
        <p className="text-sm text-slate-600 mt-1">Bạn đang đăng nhập với vai trò {roleLine}</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center text-center gap-3 py-12">
          <LayoutDashboard className="h-12 w-12 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Trang chủ đang được xây dựng</h2>
          <p className="text-sm text-slate-600 max-w-md">
            Các tính năng nghiệp vụ sẽ xuất hiện ở các phase tiếp theo của dự án
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**File 2: `app/not-found.tsx`** — 404 hero (root level, fallback ngoài cả (app) và (auth)):
```tsx
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-md py-24">
        <p className="text-4xl font-bold text-blue-700" aria-hidden="true">404</p>
        <h1 className="text-2xl font-semibold text-slate-900">Không tìm thấy trang</h1>
        <p className="text-base text-slate-600">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển
        </p>
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Quay về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

**File 3: `app/error.tsx`** — 500 cho route segment errors:
```tsx
'use client';

import Link from 'next/link';
import { Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error &amp; { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[error.tsx]', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-md py-24">
        <p className="text-4xl font-bold text-red-600" aria-hidden="true">500</p>
        <h1 className="text-2xl font-semibold text-slate-900">Đã xảy ra lỗi</h1>
        <p className="text-base text-slate-600">
          Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút
        </p>
        <div className="flex flex-row gap-3">
          <Button size="lg" onClick={() => reset()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Quay về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**File 4: `app/global-error.tsx`** — Fallback cho root layout errors (cần render `<html>` `<body>` riêng vì root layout đã crash):
```tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error &amp; { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[global-error.tsx]', error);
    }
  }, [error]);

  return (
    <html lang="vi">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        padding: '1rem',
        margin: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', maxWidth: '28rem', padding: '6rem 0' }}>
          <p style={{ fontSize: '2.25rem', fontWeight: 700, color: '#dc2626', margin: 0 }} aria-hidden="true">500</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Đã xảy ra lỗi nghiêm trọng</h1>
          <p style={{ fontSize: '1rem', color: '#475569', margin: 0 }}>
            Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#1d4ed8',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
```
Lưu ý global-error.tsx KHÔNG dùng Tailwind / shadcn vì root layout có thể đã chết (CSS chưa load). Inline style đảm bảo render được trong mọi trường hợp.

**Verify visual lock với UI-SPEC §404/500:**
- 404: hero number `text-4xl font-bold text-blue-700` (NOT red) ✓
- 404 heading `text-2xl font-semibold text-slate-900` "Không tìm thấy trang" ✓
- 404 body `text-base text-slate-600` chuẩn copywriting ✓
- 404 CTA Button với icon home prefix ✓
- 500: hero number `text-4xl font-bold text-red-600` (red signals "lỗi") ✓
- 500 heading "Đã xảy ra lỗi" + body chuẩn ✓
- 500 hai CTA gap-3 flex-row: "Thử lại" default + "Quay về trang chủ" outline ✓
- KHÔNG render error.message hay error.stack ✓
- Centered hero pattern `flex items-center justify-center min-h-screen` ✓
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f "app/(app)/dashboard/page.tsx" &amp;&amp;
      grep -q 'Xin chào,' "app/(app)/dashboard/page.tsx" &amp;&amp;
      grep -q 'Bạn đang đăng nhập với vai trò' "app/(app)/dashboard/page.tsx" &amp;&amp;
      grep -q 'LayoutDashboard' "app/(app)/dashboard/page.tsx" &amp;&amp;
      grep -q 'Trang chủ đang được xây dựng' "app/(app)/dashboard/page.tsx" &amp;&amp;
      grep -q 'ROLE_LABELS' "app/(app)/dashboard/page.tsx" &amp;&amp;
      test -f app/not-found.tsx &amp;&amp;
      grep -q 'Không tìm thấy trang' app/not-found.tsx &amp;&amp;
      grep -q 'text-blue-700' app/not-found.tsx &amp;&amp;
      grep -q '"404"' app/not-found.tsx &amp;&amp;
      grep -q 'Quay về trang chủ' app/not-found.tsx &amp;&amp;
      grep -q "Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển" app/not-found.tsx &amp;&amp;
      ! grep -q 'error.message' app/not-found.tsx &amp;&amp;
      ! grep -q 'error.stack' app/not-found.tsx &amp;&amp;
      test -f app/error.tsx &amp;&amp;
      grep -q "'use client'" app/error.tsx &amp;&amp;
      grep -q 'Đã xảy ra lỗi' app/error.tsx &amp;&amp;
      grep -q 'text-red-600' app/error.tsx &amp;&amp;
      grep -q 'reset()' app/error.tsx &amp;&amp;
      grep -q 'Thử lại' app/error.tsx &amp;&amp;
      grep -q 'Hệ thống tạm thời gặp sự cố' app/error.tsx &amp;&amp;
      ! grep -q '{error.message}' app/error.tsx &amp;&amp;
      ! grep -q '{error.stack}' app/error.tsx &amp;&amp;
      test -f app/global-error.tsx &amp;&amp;
      grep -q "'use client'" app/global-error.tsx &amp;&amp;
      grep -q 'lang="vi"' app/global-error.tsx &amp;&amp;
      grep -q 'Đã xảy ra lỗi' app/global-error.tsx &amp;&amp;
      ! grep -q '{error.message}' app/global-error.tsx &amp;&amp;
      ! grep -q '{error.stack}' app/global-error.tsx &amp;&amp;
      npx tsc --noEmit &amp;&amp;
      npm run build
    </automated>
  </verify>
  <acceptance_criteria>
    - `app/(app)/dashboard/page.tsx` is async RSC, reads `await auth()`, renders `Xin chào, {fullName}` + `Bạn đang đăng nhập với vai trò {ROLE_LABELS[role]} · {organizationName}` (or just role label if no org)
    - Dashboard renders empty state Card with `LayoutDashboard` icon + heading `Trang chủ đang được xây dựng` + body
    - `app/not-found.tsx` renders centered hero: `404` text-4xl font-bold text-blue-700, heading `Không tìm thấy trang` text-2xl, body `Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển`, CTA Button asChild Link to `/` với icon Home
    - `app/not-found.tsx` does NOT contain `error.message` or `error.stack` references
    - `app/error.tsx` is `'use client'`, renders `500` text-4xl font-bold text-red-600, heading `Đã xảy ra lỗi`, body `Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút`, 2 CTA: `Thử lại` (calls `reset()`) + `Quay về trang chủ` (variant outline)
    - `app/error.tsx` does NOT render `{error.message}` hay `{error.stack}` trong JSX (only `console.error` in useEffect for dev)
    - `app/global-error.tsx` renders `<html lang="vi">` + `<body>` with inline styles (Tailwind may not load if root failed), text `Đã xảy ra lỗi nghiêm trọng`, button `Thử lại` calling `reset()`
    - `app/global-error.tsx` does NOT render `{error.message}` hay `{error.stack}`
    - `npm run build` exit code 0 (full project builds with all 4 special pages)
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    Dashboard placeholder render greeting role-aware. 404/500 hero pages tiếng Việt theo UI-SPEC pixel-perfect (404 navy, 500 red, no stack trace exposure). global-error.tsx fallback inline-style cho catastrophic root crash. Build pass.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: End-to-end manual UAT smoke test 8 tài khoản (build production + start + browse + login + verify)</name>
  <files>scripts/uat-checklist.md</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/REQUIREMENTS.md (AUTH-01..08 — verify mọi requirement đã cover)
    - d:/Thaodnp/XTTM/lib/permissions.ts (Plan 01 — defaultLandingPath cho 7 roles)
    - d:/Thaodnp/XTTM/lib/constants.ts (HARDCODED_USERS — 8 username/password)
    - d:/Thaodnp/XTTM/.planning/research/PITFALLS.md §2.4 (console hygiene)
  </read_first>
  <action>
**Bước 1: Production build:**
```bash
cd d:/Thaodnp/XTTM
npm run build
```
Verify exit 0 + không có warning về hydration mismatch / missing key prop / deprecated API. Build output cần có:
- "✓ Compiled successfully"
- Route list bao gồm: `ƒ /`, `ƒ /(auth)/login`, `ƒ /(app)/dashboard`, `ƒ Middleware`, `λ /api/auth/[...nextauth]`
- Không có `Error:` hay `Warning:` lines (warning về peer dependency OK)

**Bước 2: Start production server:**
```bash
npm run start &amp;
sleep 3
```

**Bước 3: Tạo `scripts/uat-checklist.md`** — Document UAT smoke test cho 8 tài khoản:
```markdown
# Phase 1 UAT Smoke Test — Manual Checklist

Date: <YYYY-MM-DD>
Tester: <name>
Build: production (`npm run build &amp;&amp; npm run start`)
Browser: Chrome/Edge mới nhất

## Pre-checks
- [ ] DevTools Console mở, Clear, navigate /login → 0 error / 0 warning
- [ ] Network tab → 0 request 404 (favicon, font, image)
- [ ] Server stdout không có "Error" hay "Warning"

## Login flow per account (lặp 8 lần)

For each user trong CLAUDE.md §5:

| # | Username | Password | Expected Role | Expected Redirect | Expected Sidebar Sections | Expected User Menu | Pass? |
|---|----------|----------|---------------|-------------------|---------------------------|--------------------|---|
| 1 | admin | Admin@123 | ADMIN | /dashboard | Nghiệp vụ + Quản trị | "Xin chào, Nguyễn Văn Quản" + "Quản trị viên" | [ ] |
| 2 | banql | Banql@123 | BANQL | /dashboard | Nghiệp vụ (full) | "Xin chào, Trần Thị Bích Ngọc" + "Ban quản lý CT XTTM · Cục Xúc tiến Thương mại" | [ ] |
| 3 | chuyenvien | Cv@123 | CHUYENVIEN | /tiep-nhan | Nghiệp vụ (Trang chủ + Đề án + Tiếp nhận + Thông báo) | "Xin chào, Lê Quang Cường" + "Chuyên viên kiểm tra · Cục Xúc tiến Thương mại" | [ ] |
| 4 | hoidong | Hd@123 | HOIDONG | /tham-dinh | Nghiệp vụ (Trang chủ + Chu kỳ + Đề án + Thẩm định + Thông báo) | "Xin chào, PGS.TS. Phạm Thanh Dũng" + "Hội đồng thẩm định · Cục Xúc tiến Thương mại" | [ ] |
| 5 | donvi1 | Donvi@123 | DONVI | /de-an | Nghiệp vụ limited | "Xin chào, Hoàng Mai Linh" + "Đơn vị chủ trì · Hiệp hội Da giày - Túi xách Việt Nam" | [ ] |
| 6 | donvi2 | Donvi@123 | DONVI | /de-an | Nghiệp vụ limited | "Xin chào, Vũ Đức Minh" + "Đơn vị chủ trì · Hiệp hội Dệt may Việt Nam" | [ ] |
| 7 | taichinh | Tc@123 | TAICHINH | /tai-chinh | Nghiệp vụ (Trang chủ + Hợp đồng + Tài chính + Thông báo) | "Xin chào, Đặng Thu Hà" + "Tài chính · Cục Xúc tiến Thương mại" | [ ] |
| 8 | lanhdao | Ld@123 | LANHDAO | /dashboard | Nghiệp vụ (full) + Audit log | "Xin chào, Bùi Xuân Hồng" + "Lãnh đạo · Bộ Công Thương" | [ ] |

## Negative cases
- [ ] Empty username → inline error "Vui lòng nhập tên đăng nhập"
- [ ] Empty password → inline error "Vui lòng nhập mật khẩu"
- [ ] Wrong username → Alert error "Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại"
- [ ] Wrong password (right username) → same generic error (no user enumeration)

## SSO Placeholder
- [ ] Click "Đăng nhập SSO Bộ Công Thương" → Sonner info toast "Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án" — KHÔNG navigate
- [ ] Toast position top-right, duration ~4s, dismissable

## Logout flow
- [ ] User menu dropdown opens
- [ ] Click "Đăng xuất" item → AlertDialog "Xác nhận đăng xuất" mở
- [ ] Click "Hủy" → dialog đóng, vẫn ở trang hiện tại
- [ ] Click "Đăng xuất" (red destructive) → button hiện "Đang đăng xuất...", toast "Đã đăng xuất khỏi hệ thống", redirect /login

## Session persist
- [ ] Login donvi1 → redirect /de-an → Refresh trang (F5) → vẫn ở /de-an, layout shell render đúng (KHÔNG kick về /login)
- [ ] Close tab → reopen http://localhost:3000/dashboard → cookie session vẫn valid → render dashboard

## Route guards
- [ ] Logged out: GET /dashboard → 307 redirect /login
- [ ] Logged out: GET /de-an → 307 redirect /login
- [ ] Logged in donvi1: GET /login → 307 redirect /de-an
- [ ] Logged in admin: GET /login → 307 redirect /dashboard

## 404 / 500
- [ ] GET /this-route-does-not-exist → 404 page với hero "404" navy + heading "Không tìm thấy trang" + CTA "Quay về trang chủ"
- [ ] CTA click → navigate /
- [ ] (Manual: throw error trong dashboard component temp) → error.tsx render với "500" red + "Đã xảy ra lỗi" + 2 CTA. KHÔNG hiện stack trace
- [ ] Click "Thử lại" → reset() → page recovers (nếu error đã fix)
- [ ] DevTools → KHÔNG thấy error.message hay error.stack trong DOM

## Vietnamese rendering check
- [ ] Tất cả label/heading/button render đầy đủ dấu (kiểm 5 dấu sắc/huyền/ngã/hỏi/nặng + dấu mũ + đ/Đ)
- [ ] Smoke check: "Đề án Xúc tiến Thương mại — Hiệp hội Dệt may Việt Nam (VITAS) — Quý IV/2026"
- [ ] User menu dòng role+org render đầy đủ tên Việt (đặc biệt "Hiệp hội Da giày - Túi xách Việt Nam" — nhiều dấu)

## Accessibility quick check
- [ ] Tab through login form: username → password → eye toggle → "Đăng nhập" → "Đăng nhập SSO" — focus ring blue-700 visible
- [ ] Avatar in topbar có aria-label (avatar component shadcn default)
- [ ] Bell button có aria-label "Thông báo"
- [ ] Eye toggle aria-label đúng "Hiển thị mật khẩu" / "Ẩn mật khẩu"

## Sign-off
- All checkboxes pass: [ ]
- Ready to merge Phase 1: [ ]
- Notes (issues found):
```

**Bước 4: Run UAT manually checklist OR delegate to user (this is checkpoint-style, but Plan 04 already lock infrastructure)**

For automated CI proxy: ensure build pass + smoke test login one user via curl (programmatic):
```bash
# Stop server if started above
# Manual UAT checklist runs by user; for now verify build + smoke automated checks below
```

KHÔNG chạy server background trong verify command (để tránh hanging Bash). User sẽ chạy `npm run start` riêng để UAT.

**Bước 5: Commit `scripts/uat-checklist.md` để Plan 11 polish dùng lại làm regression checklist.
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      npm run build &amp;&amp;
      test -f scripts/uat-checklist.md &amp;&amp;
      grep -q 'Phase 1 UAT' scripts/uat-checklist.md &amp;&amp;
      grep -q 'admin.*Admin@123' scripts/uat-checklist.md &amp;&amp;
      grep -q 'donvi1.*Donvi@123' scripts/uat-checklist.md &amp;&amp;
      grep -q 'lanhdao.*Ld@123' scripts/uat-checklist.md &amp;&amp;
      grep -q 'Tính năng đăng nhập SSO' scripts/uat-checklist.md &amp;&amp;
      grep -q 'Xác nhận đăng xuất' scripts/uat-checklist.md &amp;&amp;
      grep -q '404 page' scripts/uat-checklist.md &amp;&amp;
      grep -q 'KHÔNG hiện stack trace' scripts/uat-checklist.md &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `npm run build` exit 0 + output contains "✓ Compiled successfully"
    - Route list trong build output bao gồm: `/`, `/login`, `/dashboard`, middleware, `/api/auth/[...nextauth]`
    - `scripts/uat-checklist.md` exists và contains all 8 hardcoded users với expected redirect path + sidebar sections + user menu greeting
    - UAT checklist covers: AUTH-01 (login + redirect), AUTH-02 (8 accounts bcrypt), AUTH-03 (logout flow), AUTH-04 (session persist refresh), AUTH-05 (SSO placeholder toast), AUTH-06 (sidebar dynamic + topbar + breadcrumb), AUTH-07 (light mode + locale vi-VN implicit), AUTH-08 (404/500 no stack trace)
    - UAT checklist có Vietnamese rendering check section
    - UAT checklist có accessibility quick check section
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    Production build pass + UAT checklist documented đầy đủ 8 accounts mapping. Phase 1 ready for manual UAT signing-off. AUTH-01 đến AUTH-08 đã có verification path. Plan 06 (PDF spike) là independent thread cuối cùng.
  </done>
</task>

</tasks>

<verification>
**Phase-level checks (Plan 05):**
1. `npm run build` exit 0 — production build success
2. `npm run typecheck` exit 0
3. UAT checklist file exists với đầy đủ 8 user mapping
4. Manual UAT (user-facing): login 8/8 thành công, redirect đúng, sidebar đúng menu, logout flow đúng, 404/500 đúng — tracked qua `scripts/uat-checklist.md`
5. Production build output không có warning về hydration mismatch / key prop / deprecated API
</verification>

<success_criteria>
Plan 05 thành công khi:
- Login page split 60/40 render đúng UI-SPEC pixel-perfect (brand panel left với Quốc huy + Quốc hiệu + XTTMQG wordmark + tagline + Bộ CT footer; form panel right với title + subtitle + 2 inputs + primary blue button + divider + SSO outline button + version footer)
- LoginForm wire useActionState với loginAction (Plan 03), useFormStatus pending state, show/hide password, autoFocus, autoComplete đúng, Vietnamese error messages
- SSO placeholder button click → Sonner info toast Vietnamese chuẩn copywriting
- Dashboard placeholder render greeting role-aware "Xin chào, {fullName}" + role line + empty state card
- 404 page hero navy + Vietnamese + CTA, KHÔNG render error info
- 500 (error.tsx + global-error.tsx) hero red + Vietnamese + 2 CTA reset/home, KHÔNG render error.message/stack
- AUTH-01 đến AUTH-08 đã có path verification (UAT checklist documented)
- Production build pass, no hydration warnings
- Phase 1 ready: 8 tài khoản đăng nhập được, layout shell render đúng menu role-aware, logout flow chuẩn, 404/500 không lộ stack
</success_criteria>

<output>
Sau hoàn thành, tạo `.planning/phases/01-m0-bootstrap-h-t-ng/01-05-login-pages-SUMMARY.md`:
- Confirmation 9 files created (Quốc huy SVG + 4 auth components + 4 special pages + UAT checklist)
- Build output summary (route list, bundle sizes)
- Mapping AUTH-01..08 → file đảm nhận
- UAT checklist link cho user run manual
- Notes nếu UI-SPEC items nào chưa exact (vd: Skip-link defer M7, custom SVG illustration defer M7)
- Confirmation Phase 1 verifiable: 8 tài khoản đăng nhập + sidebar dynamic + logout + 404/500
</output>
