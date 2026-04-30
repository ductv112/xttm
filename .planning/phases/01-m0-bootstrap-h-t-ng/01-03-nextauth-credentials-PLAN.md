---
phase: 01-m0-bootstrap-h-t-ng
plan: 03
type: execute
wave: 3
depends_on: [01, 02]
files_modified:
  - lib/auth.ts
  - auth.config.ts
  - middleware.ts
  - app/api/auth/[...nextauth]/route.ts
  - app/(auth)/_actions/login.ts
  - app/(auth)/_actions/logout.ts
autonomous: true
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
user_setup: []
must_haves:
  truths:
    - "NextAuth v5 Credentials Provider config sẵn sàng — JWT strategy với role + orgId injected"
    - "POST credentials với (donvi1, Donvi@123) authenticate thành công và trả session với role=DONVI + organizationName='Hiệp hội Da giày - Túi xách Việt Nam'"
    - "POST credentials với (donvi1, wrong) authenticate fail trả error message tiếng Việt"
    - "POST credentials với (admin, Admin@123) authenticate thành công role=ADMIN"
    - "Middleware redirect /chuong-trinh (protected) → /login khi chưa auth"
    - "Middleware allow /login khi không auth"
    - "Middleware redirect /login → /dashboard khi đã auth"
    - "Logout server action call signOut() và clear session cookie"
  artifacts:
    - path: "auth.config.ts"
      provides: "NextAuth v5 config edge-safe (used by middleware) — KHÔNG import bcryptjs/prisma (không edge-compat). Chỉ chứa providers list rỗng + callbacks edge-safe."
      contains: "NextAuthConfig"
    - path: "lib/auth.ts"
      provides: "Full NextAuth instance với Credentials Provider + bcrypt verify + Prisma — exports auth, signIn, signOut, handlers"
      contains: "Credentials"
    - path: "middleware.ts"
      provides: "Edge middleware checking auth + redirect protected/public routes"
      contains: "NextResponse"
    - path: "app/api/auth/[...nextauth]/route.ts"
      provides: "NextAuth route handler GET/POST"
      exports: ["GET", "POST"]
    - path: "app/(auth)/_actions/login.ts"
      provides: "Server action wrapper cho signIn với Zod validation Vietnamese error"
      exports: ["loginAction"]
    - path: "app/(auth)/_actions/logout.ts"
      provides: "Server action logout"
      exports: ["logoutAction"]
  key_links:
    - from: "lib/auth.ts"
      to: "lib/prisma.ts"
      via: "User table query"
      pattern: "prisma\\.user\\.findUnique"
    - from: "lib/auth.ts"
      to: "bcryptjs"
      via: "password verify"
      pattern: "bcrypt.*compare"
    - from: "middleware.ts"
      to: "auth.config.ts (edge-safe)"
      via: "NextAuth Edge"
      pattern: "auth.config"
    - from: "lib/auth.ts JWT callback"
      to: "session.user augmentation từ types/next-auth.d.ts"
      via: "token enrichment với role + organizationId"
      pattern: "token\\.role"
---

<objective>
Wire NextAuth v5 Credentials Provider để 8 hardcoded accounts (Plan 02 đã seed) đăng nhập được. Implement đúng pattern Auth.js v5 split config (edge-safe `auth.config.ts` cho middleware + full `lib/auth.ts` cho Server Actions) — research SUMMARY frozen decision #5.

Purpose:
- Satisfy AUTH-01 (đăng nhập username + password, redirect role-based)
- Satisfy AUTH-02 (8 hardcoded accounts với bcrypt verify)
- Satisfy AUTH-03 (logout flow)
- Satisfy AUTH-04 (JWT session persist qua refresh)
- Foundation auth cho Plan 04 layout shell (cần `auth()` để get session) và Plan 05 login UI (cần `loginAction` + `signOut`)

Output:
- `auth.config.ts` (edge-safe, chỉ providers + callbacks không database, dùng trong middleware)
- `lib/auth.ts` (full config với Credentials Provider, bcrypt verify, Prisma query, JWT/session callbacks inject role + orgId)
- `middleware.ts` (route protection: protected routes → /login, /login khi auth → /dashboard)
- `app/api/auth/[...nextauth]/route.ts` (NextAuth handlers)
- `app/(auth)/_actions/login.ts` (server action wrapper với Zod validation Vietnamese)
- `app/(auth)/_actions/logout.ts` (server action logout)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
@.planning/research/PITFALLS.md
@CLAUDE.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-01-repo-init-PLAN.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-02-prisma-schema-seed-PLAN.md
</context>

<interfaces>
<!-- Plan 03 produces these for Plan 04 (Layout) and Plan 05 (Login Page) -->

```typescript
// lib/auth.ts — MUST export
export const { auth, signIn, signOut, handlers } = NextAuth(authOptions);

// Used by Plan 04 in (app)/layout.tsx:
// const session = await auth();
// session?.user is { id, username, fullName, role, organizationId, organizationName }

// auth.config.ts — MUST export
export const authConfig = {
  pages: { signIn: '/login' },
  providers: [],  // empty in edge config
  callbacks: { authorized, jwt, session },  // edge-safe (no DB calls)
} satisfies NextAuthConfig;

// app/(auth)/_actions/login.ts — MUST export
export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState>;

export type LoginState = {
  error?: string;
  fieldErrors?: { username?: string; password?: string };
};

// app/(auth)/_actions/logout.ts — MUST export
export async function logoutAction(): Promise<void>;
```
</interfaces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → middleware (Edge) | Cookie-based session token, validated edge-side |
| Browser → Server Action (login) | FormData with username/password POST over HTTPS in production |
| Server Action → Prisma | Server-side DB query, role enrichment in JWT callback |
| Edge → Node runtime | `auth.config.ts` (edge) MUST NOT import bcrypt/prisma (Node-only modules) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | S (Spoofing) | Credentials provider | mitigate | NextAuth Credentials `authorize()` MUST `await bcrypt.compare(input.password, user.passwordHash)`; KHÔNG so sánh plaintext. Throw error generic "Tên đăng nhập hoặc mật khẩu chưa đúng" cho cả case sai username và sai password (tránh user enumeration). Verify `lib/auth.ts` không có dòng `if (input.password === user.password)`. |
| T-03-02 | T (Tampering) | JWT secret | mitigate | `AUTH_SECRET` MUST đọc từ `process.env.AUTH_SECRET` (set trong .env.local Plan 01). Length ≥32 chars (Plan 01 `openssl rand -base64 32`). KHÔNG hardcode secret trong code. Verify bằng grep `lib/auth.ts auth.config.ts` không có literal secret. |
| T-03-03 | I (Information Disclosure) | Cookie security | mitigate | NextAuth v5 default cookie config: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`. Đủ cho POC. Trust default — KHÔNG override cookie config sai. |
| T-03-04 | I | Open redirect after login | mitigate | After login success, redirect target MUST đi qua `defaultLandingPath(role)` từ `lib/permissions.ts` (Plan 01). KHÔNG dùng `searchParams.callbackUrl` raw — validate nó là same-origin và in role allowlist. Plan 03 implement: Login redirect chỉ redirect về `/dashboard`, `/de-an`, `/tham-dinh`, `/tiep-nhan`, `/tai-chinh` (whitelisted via `defaultLandingPath`). |
| T-03-05 | I | Account enumeration | mitigate | `authorize()` callback throw exact same error message cho cả case "user không tồn tại" và "password sai" — `'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại'`. KHÔNG split thành 2 message khác. |
| T-03-06 | E (Elevation of Privilege) | Role injection vào JWT | mitigate | JWT callback chỉ set `token.role = user.role` lần đầu khi `user` truthy (initial sign-in). Subsequent calls re-use existing token — không cho client inject role. Session callback đọc role từ token, không từ client input. |
| T-03-07 | D (Denial of Service) | Bcrypt compare timing | accept | Cost 10 = ~80ms/compare. POC scope không cần rate limiting; production phase 2 sẽ add. Login form Plan 05 sẽ disable button khi pending để tránh user spam click. |
| T-03-08 | I | Session JWT exposure | mitigate | JWT chỉ chứa: `id, username, fullName, role, organizationId, organizationName` — KHÔNG chứa passwordHash hay sensitive data. Verify session callback shape khớp `types/next-auth.d.ts` (Plan 01). |
| T-03-09 | T | Edge middleware bypass | mitigate | `middleware.ts` MUST có `matcher` config exclude `/api/auth/*`, `/_next/*`, `/favicon.ico` nhưng MUST include all protected routes (`/dashboard`, `/de-an`, `/chuong-trinh`, ...). Verify bằng test: GET `/dashboard` chưa auth → 307 redirect to `/login`. |
| T-03-10 | I | Stack trace in auth error | mitigate | `lib/auth.ts` `authorize()` catch block log error to server console, throw generic message to client. KHÔNG bao gồm `error.stack` trong response. |
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Auth.js v5 split config — auth.config.ts (edge-safe) + lib/auth.ts (full với Credentials)</name>
  <files>auth.config.ts, lib/auth.ts, app/api/auth/[...nextauth]/route.ts</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §4 (Auth.js v5 + bcryptjs + Credentials Provider pattern, session augmentation)
    - d:/Thaodnp/XTTM/types/next-auth.d.ts (Plan 01 — verify Session shape: id, username, fullName, role, organizationId, organizationName)
    - d:/Thaodnp/XTTM/lib/prisma.ts (Plan 01 singleton)
    - d:/Thaodnp/XTTM/lib/constants.ts (ROLES, type Role)
    - d:/Thaodnp/XTTM/lib/permissions.ts (defaultLandingPath function — Plan 01)
    - d:/Thaodnp/XTTM/.env.local (verify AUTH_SECRET, AUTH_TRUST_HOST set)
    - d:/Thaodnp/XTTM/prisma/schema.prisma (Plan 02 — verify User model with organization relation)
  </read_first>
  <action>
**Auth.js v5 split-config pattern:** middleware chạy trên Edge runtime — KHÔNG import được `bcryptjs` (cần Node `crypto` native binding) hay `prisma` (cần Node `child_process`). Vì vậy:
- `auth.config.ts` = base config edge-safe, chỉ có `pages` + callbacks không DB call (trừ `authorized` callback ai cũng OK).
- `lib/auth.ts` = full config import `auth.config.ts` + add Credentials Provider với bcrypt + Prisma.

**File 1: `auth.config.ts`** (root level, NOT trong /lib — Auth.js convention):
```typescript
import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@/lib/constants';

const PUBLIC_PATHS = ['/login'] as const;

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

      if (isPublic) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      // All non-public routes require auth
      if (!isLoggedIn) {
        const callbackUrl = pathname + nextUrl.search;
        const loginUrl = new URL('/login', nextUrl);
        if (pathname !== '/' && pathname !== '/dashboard') {
          loginUrl.searchParams.set('next', callbackUrl);
        }
        return Response.redirect(loginUrl);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.fullName = user.fullName;
        token.role = user.role as Role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.fullName = token.fullName as string;
        session.user.role = token.role as Role;
        session.user.organizationId = (token.organizationId as string | null) ?? null;
        session.user.organizationName = (token.organizationName as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
```

**File 2: `lib/auth.ts`** (full Node runtime with Credentials):
```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/constants';
import { authConfig } from '../auth.config';

const CredentialsSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập').max(64),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(128),
});

const GENERIC_AUTH_ERROR = 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = CredentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          throw new Error(GENERIC_AUTH_ERROR);
        }
        const { username, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { username },
          include: { organization: { select: { id: true, name: true } } },
        });

        if (!user) {
          // Constant-time-ish: still run bcrypt compare with dummy hash to mitigate timing attack
          await bcrypt.compare(password, '$2a$10$' + 'A'.repeat(53));
          throw new Error(GENERIC_AUTH_ERROR);
        }

        if (!user.isActive) {
          throw new Error('Tài khoản này hiện đang bị khóa. Vui lòng liên hệ quản trị viên');
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          throw new Error(GENERIC_AUTH_ERROR);
        }

        return {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role as Role,
          organizationId: user.organization?.id ?? null,
          organizationName: user.organization?.name ?? null,
        };
      },
    }),
  ],
});
```

**File 3: `app/api/auth/[...nextauth]/route.ts`:**
```typescript
export { GET, POST } from '@/lib/auth';
```
Lưu ý: `lib/auth.ts` export `handlers` → unfold trong route file. Sửa `lib/auth.ts` final line:
```typescript
export const { handlers: { GET, POST }, signIn, signOut, auth } = NextAuth({ ... });
// Đồng thời export handlers để có thể GET/POST từ route file:
```
Hoặc viết trực tiếp trong route:
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```
Recommended: dùng pattern thứ 2 (clean separation).

**Cập nhật lib/auth.ts để export handlers:**
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({ ...authConfig, providers: [...] });
```
Rồi route.ts:
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

**Lưu ý version compatibility:**
- next-auth@beta (5.0.0-beta.X) đã ra production-stable.
- `Credentials` provider import path: `'next-auth/providers/credentials'`.
- TypeScript types đã augment trong `types/next-auth.d.ts` (Plan 01) — `User`, `Session`, `JWT` interfaces đều có `role`, `organizationId`, `organizationName`.

**KHÔNG**:
- KHÔNG dùng `next-auth/react` `signIn` ở server (đó là client API). Plan 03 dùng server action wrapping `signIn` từ `lib/auth.ts`.
- KHÔNG hardcode AUTH_SECRET trong code — đọc từ env.
- KHÔNG include `database` adapter (Credentials với JWT strategy không cần adapter).
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f auth.config.ts &amp;&amp;
      grep -q 'NextAuthConfig' auth.config.ts &amp;&amp;
      grep -q "signIn: '/login'" auth.config.ts &amp;&amp;
      grep -q "strategy: 'jwt'" auth.config.ts &amp;&amp;
      grep -q 'authorized' auth.config.ts &amp;&amp;
      ! grep -q 'bcrypt' auth.config.ts &amp;&amp;
      ! grep -q '@/lib/prisma' auth.config.ts &amp;&amp;
      test -f lib/auth.ts &amp;&amp;
      grep -q "import NextAuth" lib/auth.ts &amp;&amp;
      grep -q "from 'next-auth/providers/credentials'" lib/auth.ts &amp;&amp;
      grep -q 'bcrypt.compare' lib/auth.ts &amp;&amp;
      grep -q 'prisma.user.findUnique' lib/auth.ts &amp;&amp;
      grep -q 'authConfig' lib/auth.ts &amp;&amp;
      grep -q 'Tên đăng nhập hoặc mật khẩu chưa đúng' lib/auth.ts &amp;&amp;
      grep -q 'export const' lib/auth.ts &amp;&amp;
      test -f app/api/auth/\[...nextauth\]/route.ts &amp;&amp;
      grep -q "export const { GET, POST }" app/api/auth/\[...nextauth\]/route.ts &amp;&amp;
      ! grep -rq "AUTH_SECRET\s*=\s*['\"]" lib/ auth.config.ts &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `auth.config.ts` exports `authConfig` of type `NextAuthConfig` với `pages.signIn = '/login'` và `session.strategy = 'jwt'`
    - `auth.config.ts` callbacks: `authorized` (route guard), `jwt` (token enrichment với role + organizationId + organizationName), `session` (session shape khớp `types/next-auth.d.ts`)
    - `auth.config.ts` KHÔNG import `bcryptjs` hay `@/lib/prisma` (edge-safe)
    - `lib/auth.ts` import `Credentials` từ `next-auth/providers/credentials`
    - `lib/auth.ts` `authorize()` flow: Zod validate → `prisma.user.findUnique({ where: { username } })` → check `isActive` → `bcrypt.compare` → return `{ id, username, fullName, role, organizationId, organizationName }`
    - `lib/auth.ts` throw exact error string `'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại'` cho cả case user not found và password mismatch
    - `lib/auth.ts` exports `handlers, signIn, signOut, auth`
    - `app/api/auth/[...nextauth]/route.ts` exports `GET, POST` từ `handlers`
    - KHÔNG có literal AUTH_SECRET trong code (`grep -rq 'AUTH_SECRET\s*=\s*['\"]' lib/ auth.config.ts` returns no match)
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    NextAuth v5 split-config setup đúng pattern Auth.js: edge-safe `auth.config.ts` cho middleware, full `lib/auth.ts` với Credentials Provider + bcrypt + Prisma. JWT/session callbacks inject role + orgId. Route handler wired. typecheck pass.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Edge middleware — protected routes redirect /login, public allow</name>
  <files>middleware.ts</files>
  <read_first>
    - d:/Thaodnp/XTTM/auth.config.ts (Task 1 — authorized callback)
    - d:/Thaodnp/XTTM/.planning/research/ARCHITECTURE.md §7.1 (RBAC 3-layer enforcement, Layer 1 middleware)
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §4 (Auth.js v5 middleware pattern)
  </read_first>
  <action>
**File `middleware.ts` (root level, NOT trong /app):**
```typescript
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match all routes except:
  // - /api/auth/* (NextAuth handlers)
  // - /api/* (API routes — auth handled at route handler level)
  // - /_next/static, /_next/image (assets)
  // - /favicon.ico, /robots.txt, /sitemap.xml
  // - /fonts/* (public fonts cho PDF spike Plan 06)
  // - /mock-files/* (public mock files cho demo)
  // - /logo-*.svg (public logo assets)
  matcher: ['/((?!api/auth|api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|fonts|mock-files|logo-).*)'],
};
```

**Cách hoạt động:**
- NextAuth v5 export `auth` function từ config làm middleware. Pattern này đảm bảo edge runtime, không pull bcrypt/prisma.
- `authorized` callback trong `auth.config.ts` (Task 1) là chỗ enforce: chưa auth + path không phải `/login` → redirect `/login`. Đã auth + path `/login` → redirect `/dashboard`.
- Matcher exclude assets + API routes để tránh middleware overhead trên non-page requests.

**Test pattern:**
```bash
# Build và start production server
npm run build
npm run start &
sleep 3

# Test 1: GET /dashboard chưa auth → 307 redirect /login
curl -sIL http://localhost:3000/dashboard | head -5
# Expect: HTTP/1.1 307 Temporary Redirect, Location: /login

# Test 2: GET /login khi chưa auth → 200 OK
curl -sI http://localhost:3000/login | head -3
# Expect: HTTP/1.1 200 OK (placeholder login page Plan 05 chưa có nhưng route group exists)

# Test 3: GET /api/auth/session → 200 (NextAuth route bypassed by matcher)
curl -sI http://localhost:3000/api/auth/session | head -3
# Expect: HTTP/1.1 200 OK
```

Lưu ý: Plan 03 chưa có `app/(auth)/login/page.tsx` (Plan 05 sẽ tạo). Build sẽ pass nhưng GET `/login` sẽ 404 đến khi Plan 05 hoàn tất. Middleware test chỉ verify redirect logic, không yêu cầu page render.

Để verify middleware redirect mà không cần page tồn tại:
```bash
# Tạo placeholder app/(auth)/login/page.tsx tạm:
mkdir -p "app/(auth)/login"
cat > "app/(auth)/login/page.tsx" << 'EOF'
export default function LoginPage() { return <div>Login placeholder (Plan 05 sẽ overwrite)</div>; }
EOF
```
Plan 05 sẽ overwrite file này với UI thật. KHÔNG xóa placeholder ở Plan 03 — keep nó để middleware test pass.

**Cũng tạo placeholder dashboard để middleware redirect đến đúng nơi không 404:**
```bash
mkdir -p "app/(app)/dashboard"
cat > "app/(app)/dashboard/page.tsx" << 'EOF'
export default function DashboardPage() { return <div>Dashboard placeholder (Plan 05 sẽ overwrite)</div>; }
EOF
mkdir -p "app/(app)"
cat > "app/(app)/layout.tsx" << 'EOF'
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
EOF
```
Plan 04 sẽ overwrite `(app)/layout.tsx` với AppShell thật. Plan 05 sẽ overwrite các page. Plan 03 chỉ tạo placeholder để middleware test runnable.
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f middleware.ts &amp;&amp;
      grep -q "import.*authConfig" middleware.ts &amp;&amp;
      grep -q 'export const config' middleware.ts &amp;&amp;
      grep -q 'matcher' middleware.ts &amp;&amp;
      grep -q 'api/auth' middleware.ts &amp;&amp;
      ! grep -q 'bcrypt' middleware.ts &amp;&amp;
      ! grep -q '@/lib/prisma' middleware.ts &amp;&amp;
      test -f "app/(auth)/login/page.tsx" &amp;&amp;
      test -f "app/(app)/dashboard/page.tsx" &amp;&amp;
      test -f "app/(app)/layout.tsx" &amp;&amp;
      npx tsc --noEmit &amp;&amp;
      npm run build
    </automated>
  </verify>
  <acceptance_criteria>
    - `middleware.ts` exports `middleware` (named export `auth` aliased) và `config` với `matcher` array
    - `middleware.ts` matcher exclude `api/auth`, `_next/static`, `_next/image`, `favicon.ico`, `fonts`, `mock-files`, `logo-`
    - `middleware.ts` KHÔNG import `bcryptjs`, `@prisma/client`, hay `@/lib/prisma` (edge-safety)
    - `app/(auth)/login/page.tsx` placeholder exists (Plan 05 sẽ overwrite)
    - `app/(app)/dashboard/page.tsx` placeholder exists (Plan 05 sẽ overwrite)
    - `app/(app)/layout.tsx` placeholder exists (Plan 04 sẽ overwrite)
    - `npm run build` exit code 0 (toàn project build với middleware compile thành công Edge bundle)
    - Build output (manual check): "Route ƒ Middleware" line in `npm run build` stdout
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    Middleware Edge-safe với matcher chuẩn, redirect protected → /login + /login → /dashboard tự động qua authorized callback. Placeholder pages cho login/dashboard/layout để build pass. Plan 04, 05 sẽ overwrite những placeholder này.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Server actions — loginAction (signIn wrap với Vietnamese error) + logoutAction + smoke verify 8 accounts</name>
  <files>app/(auth)/_actions/login.ts, app/(auth)/_actions/logout.ts</files>
  <read_first>
    - d:/Thaodnp/XTTM/lib/auth.ts (Task 1 — signIn, signOut export)
    - d:/Thaodnp/XTTM/lib/permissions.ts (Plan 01 — defaultLandingPath function)
    - d:/Thaodnp/XTTM/lib/constants.ts (Plan 01 — ROLES, type Role)
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (Copywriting Contract — Login validation messages)
    - d:/Thaodnp/XTTM/.planning/research/ARCHITECTURE.md §6.2 (Server Action quy ước)
  </read_first>
  <action>
**File 1: `app/(auth)/_actions/login.ts`** — Server action wrap `signIn` với Zod + Vietnamese errors:
```typescript
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/constants';

const LoginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập').max(64),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(128),
});

export type LoginState = {
  error?: string;
  fieldErrors?: { username?: string[]; password?: string[] };
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    username: formData.get('username'),
    password: formData.get('password'),
  };
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let landingPath = '/dashboard';
  try {
    // Look up role BEFORE signIn to compute landing path; signIn redirects internally on success
    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: { role: true, isActive: true },
    });
    if (user?.isActive) {
      landingPath = defaultLandingPath(user.role as Role);
    }

    await signIn('credentials', {
      username: parsed.data.username,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const message =
        error.cause?.err?.message ??
        'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng thử lại';
      return { error: message };
    }
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return { error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau ít phút' };
  }

  redirect(landingPath);
}
```

**File 2: `app/(auth)/_actions/logout.ts`** — Server action logout:
```typescript
'use server';

import { signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  redirect('/login');
}
```

**Smoke test 8 tài khoản (manual node script — KHÔNG commit, chạy 1 lần verify):**

Tạo file tạm `scripts/smoke-auth.mts` (gitignored / xóa sau verify):
```typescript
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { HARDCODED_USERS } from '../lib/constants.js';

const prisma = new PrismaClient();
let allPass = true;
for (const user of HARDCODED_USERS) {
  const dbUser = await prisma.user.findUnique({
    where: { username: user.username },
    include: { organization: { select: { name: true } } },
  });
  if (!dbUser) {
    console.error(`✗ ${user.username}: USER NOT FOUND`);
    allPass = false;
    continue;
  }
  const ok = await bcrypt.compare(user.password, dbUser.passwordHash);
  const orgName = dbUser.organization?.name ?? '(no org)';
  if (ok && dbUser.role === user.role) {
    console.log(`✓ ${user.username.padEnd(12)} → role=${dbUser.role.padEnd(11)} org=${orgName}`);
  } else {
    console.error(`✗ ${user.username}: ok=${ok} role-expected=${user.role} role-actual=${dbUser.role}`);
    allPass = false;
  }
}
await prisma.$disconnect();
process.exit(allPass ? 0 : 1);
```

Run:
```bash
npx tsx scripts/smoke-auth.mts
```
Expected output: 8 lines starting with `✓`, exit code 0.

Sau verify, KHÔNG xóa file scripts/smoke-auth.mts (giữ làm regression check cho phase sau). Add `scripts/` vào .gitignore HOẶC commit file này như utility — chọn: commit file vào repo.

Decision: commit `scripts/smoke-auth.mts` để Plan 11 polish có thể re-run + sửa nếu cần.

**Lưu ý:**
- `loginAction` dùng `useActionState` pattern (React 19) trong Plan 05 với signature `(prev, formData) => state`. State có `error` (general error) hoặc `fieldErrors` (zod validation errors).
- `signIn('credentials', { redirect: false })` không tự redirect — Plan 03 control redirect via `defaultLandingPath`. Plan 05 form sẽ dùng `useFormState` để show error message.
- `logoutAction` dùng `redirect('/login')` — lưu ý `signOut({ redirect: false })` rồi redirect manual để Plan 05 control flow tốt hơn (toast trước redirect).
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f "app/(auth)/_actions/login.ts" &amp;&amp;
      grep -q "'use server'" "app/(auth)/_actions/login.ts" &amp;&amp;
      grep -q 'export async function loginAction' "app/(auth)/_actions/login.ts" &amp;&amp;
      grep -q 'signIn' "app/(auth)/_actions/login.ts" &amp;&amp;
      grep -q 'AuthError' "app/(auth)/_actions/login.ts" &amp;&amp;
      grep -q 'defaultLandingPath' "app/(auth)/_actions/login.ts" &amp;&amp;
      grep -q 'Vui lòng nhập tên đăng nhập' "app/(auth)/_actions/login.ts" &amp;&amp;
      test -f "app/(auth)/_actions/logout.ts" &amp;&amp;
      grep -q "'use server'" "app/(auth)/_actions/logout.ts" &amp;&amp;
      grep -q 'signOut' "app/(auth)/_actions/logout.ts" &amp;&amp;
      grep -q "redirect\\('/login'\\)" "app/(auth)/_actions/logout.ts" &amp;&amp;
      test -f scripts/smoke-auth.mts &amp;&amp;
      npx tsx scripts/smoke-auth.mts &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - `app/(auth)/_actions/login.ts` first line is `'use server'`
    - `loginAction` signature: `(prev: LoginState, formData: FormData) => Promise<LoginState>`
    - `loginAction` validates với Zod (LoginSchema), returns `fieldErrors` từ `parsed.error.flatten().fieldErrors`
    - `loginAction` calls `signIn('credentials', { username, password, redirect: false })`
    - `loginAction` catches `AuthError` and returns `{ error: 'Tên đăng nhập hoặc mật khẩu chưa đúng...' }`
    - `loginAction` redirect to `defaultLandingPath(role)` on success
    - `app/(auth)/_actions/logout.ts` first line is `'use server'`
    - `logoutAction` calls `signOut({ redirect: false })` then `redirect('/login')`
    - `scripts/smoke-auth.mts` runs `npx tsx scripts/smoke-auth.mts` with exit code 0 (all 8 users authenticate correctly)
    - Smoke output contains exactly 8 lines starting with `✓` (one per HARDCODED_USERS entry)
    - Each line shows role (DONVI / BANQL / ADMIN / etc.) and organization name (Hiệp hội Da giày... / Cục Xúc tiến Thương mại / Bộ Công Thương / etc.)
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    Server actions `loginAction` + `logoutAction` ready cho Plan 05 Login UI. Vietnamese error messages locked. Role-based redirect via `defaultLandingPath`. Smoke test 8/8 accounts authenticate đúng role + org. AUTH-01, AUTH-03, AUTH-04 wireup complete.
  </done>
</task>

</tasks>

<verification>
**Phase-level checks (Plan 03):**
1. `npm run build` exit 0 — middleware Edge bundle build thành công, KHÔNG có warning về bcrypt/prisma trong edge runtime
2. `npm run typecheck` exit 0 — types từ `types/next-auth.d.ts` resolve đúng (Session.user.role typed as Role)
3. `npx tsx scripts/smoke-auth.mts` exit 0 — 8/8 hardcoded accounts authenticate
4. Manual smoke (sau khi npm start): GET /dashboard không auth → 307 redirect /login; GET /login không auth → 200; POST /api/auth/callback/credentials với valid creds → 200 + Set-Cookie session
5. Grep `lib/auth.ts auth.config.ts middleware.ts` không tìm thấy literal `AUTH_SECRET` value (chỉ `process.env.AUTH_SECRET` reference)
6. Grep `auth.config.ts middleware.ts` không tìm thấy `bcrypt` hay `@/lib/prisma` (edge-safety)
</verification>

<success_criteria>
Plan 03 thành công khi:
- Auth.js v5 split-config setup chuẩn (auth.config edge-safe + lib/auth full)
- 8 hardcoded accounts authenticate được với bcrypt verify (smoke test 8/8 PASS)
- Session shape khớp `types/next-auth.d.ts` Plan 01: `{id, username, fullName, role, organizationId, organizationName}`
- Middleware redirect protected → /login chưa auth, /login → /dashboard đã auth
- Server actions `loginAction` + `logoutAction` ready với Vietnamese error messages
- Default landing path role-based (admin/banql/lanhdao → /dashboard, chuyenvien → /tiep-nhan, hoidong → /tham-dinh, donvi → /de-an, taichinh → /tai-chinh)
- AUTH-01, AUTH-02, AUTH-03, AUTH-04 satisfied
- Plan 04 có thể `await auth()` trong (app)/layout.tsx
- Plan 05 có thể wire `useActionState(loginAction)` trong login form
- typecheck + build pass
</success_criteria>

<output>
Sau hoàn thành, tạo `.planning/phases/01-m0-bootstrap-h-t-ng/01-03-nextauth-credentials-SUMMARY.md`:
- Auth.js version đã cài (next-auth@5.0.0-beta.X)
- Smoke test 8/8 PASS log (paste output từ smoke-auth.mts)
- Middleware build size (Edge bundle KB)
- Confirmation các file edge-safe (auth.config.ts, middleware.ts) không pull bcrypt/prisma
- AUTH_SECRET strategy: env-only, ≥32 chars, gitignored
- Session shape verified khớp types/next-auth.d.ts
- Default landing path mapping đầy đủ cho 7 roles
- Plan 04 ready: `import { auth } from '@/lib/auth'`; await trong RSC
- Plan 05 ready: `import { loginAction, logoutAction } from '@/app/(auth)/_actions/...'`
</output>
