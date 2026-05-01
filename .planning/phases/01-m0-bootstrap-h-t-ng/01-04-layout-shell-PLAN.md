---
phase: 01-m0-bootstrap-h-t-ng
plan: 04
type: execute
wave: 3
depends_on: [01, 03]
files_modified:
  - components/ui/button.tsx
  - components/ui/input.tsx
  - components/ui/label.tsx
  - components/ui/form.tsx
  - components/ui/card.tsx
  - components/ui/separator.tsx
  - components/ui/sonner.tsx
  - components/ui/sheet.tsx
  - components/ui/sidebar.tsx
  - components/ui/dropdown-menu.tsx
  - components/ui/avatar.tsx
  - components/ui/breadcrumb.tsx
  - components/ui/alert-dialog.tsx
  - components/ui/alert.tsx
  - components/ui/skeleton.tsx
  - components/ui/badge.tsx
  - components/ui/tooltip.tsx
  - components/ui/scroll-area.tsx
  - components/layout/AppShell.tsx
  - components/layout/AppSidebar.tsx
  - components/layout/AppTopbar.tsx
  - components/layout/AppBreadcrumb.tsx
  - components/layout/UserMenu.tsx
  - components/layout/LogoutDialog.tsx
  - components/layout/SidebarMenuItem.tsx
  - components/providers/QueryProvider.tsx
  - components/providers/AppProviders.tsx
  - app/(app)/layout.tsx
  - hooks/use-mobile.ts
autonomous: true
requirements:
  - AUTH-06
  - AUTH-07
user_setup: []
must_haves:
  truths:
    - "shadcn components đầy đủ ~18 components đã add từ official registry (button/input/label/form/card/separator/sonner/sheet/sidebar/dropdown-menu/avatar/breadcrumb/alert-dialog/alert/skeleton/badge/tooltip/scroll-area)"
    - "AppShell layout (sidebar + topbar + breadcrumb + main content slot) render khi user authenticated"
    - "AppSidebar render menu động theo role qua getMenuItems(session.role) — Plan 03 session shape"
    - "AppTopbar có user dropdown với 'Xin chào, {fullName}' + role line + logout button"
    - "Logout dialog confirmation với 2 button 'Hủy' + 'Đăng xuất' destructive variant — gọi logoutAction"
    - "Breadcrumb render từ pathname qua buildBreadcrumb() (Plan 01)"
    - "Light mode hardcode (theme provider không expose toggle)"
    - "Locale vi-VN setup global (date-fns Vietnamese, Intl)"
    - "TanStack Query provider wrap children — phase sau dùng cho server state"
  artifacts:
    - path: "components/layout/AppShell.tsx"
      provides: "Outer shell với SidebarProvider + AppSidebar + main wrapper + AppTopbar"
      exports: ["AppShell"]
    - path: "components/layout/AppSidebar.tsx"
      provides: "Server Component sidebar với role-aware menu items, sections NGHIEP_VU + QUAN_TRI, w-64 expanded / w-16 collapsed, mobile Sheet"
      exports: ["AppSidebar"]
    - path: "components/layout/AppTopbar.tsx"
      provides: "Sticky topbar h-14 với sidebar trigger + breadcrumb + bell + user menu"
      exports: ["AppTopbar"]
    - path: "components/layout/AppBreadcrumb.tsx"
      provides: "Client Component breadcrumb từ usePathname() + buildBreadcrumb(pathname)"
      exports: ["AppBreadcrumb"]
    - path: "components/layout/UserMenu.tsx"
      provides: "Dropdown menu với avatar initials, greeting, role + org line, logout trigger"
      exports: ["UserMenu"]
    - path: "components/layout/LogoutDialog.tsx"
      provides: "AlertDialog confirm logout — 'Xác nhận đăng xuất' theo UI-SPEC Copywriting"
      exports: ["LogoutDialog"]
    - path: "components/providers/AppProviders.tsx"
      provides: "Wrapper QueryProvider + (future ThemeProvider, LocaleProvider — Phase 1 chỉ wrap Query)"
      exports: ["AppProviders"]
    - path: "app/(app)/layout.tsx"
      provides: "(app) route group layout — gọi auth(), redirect /login nếu null, render AppShell với session.user"
      exports: ["default AppLayout"]
  key_links:
    - from: "app/(app)/layout.tsx"
      to: "lib/auth.ts auth()"
      via: "session check"
      pattern: "await auth\\(\\)"
    - from: "components/layout/AppSidebar.tsx"
      to: "lib/permissions.ts getMenuItems()"
      via: "role-aware menu render"
      pattern: "getMenuItems"
    - from: "components/layout/AppBreadcrumb.tsx"
      to: "lib/breadcrumbs.ts buildBreadcrumb()"
      via: "pathname → breadcrumb items"
      pattern: "buildBreadcrumb"
    - from: "components/layout/UserMenu.tsx"
      to: "app/(auth)/_actions/logout.ts logoutAction"
      via: "form action on logout"
      pattern: "logoutAction"
---

<objective>
Build layout shell (AUTH-06): cài đầy đủ shadcn components theo UI-SPEC §Registry Safety, tạo AppShell wrapping pattern, AppSidebar role-aware (render menu động qua getMenuItems từ Plan 01), AppTopbar h-14 với user dropdown + breadcrumb + bell, LogoutDialog confirmation. Theme light mode hardcode, locale vi-VN, TanStack Query provider sẵn cho phase sau.

Purpose:
- Layout shell là "khung" mọi phase 2-11 sẽ kế thừa — UI-SPEC đã lock toàn bộ visual decisions, Plan 04 chỉ implement đúng spec
- Sidebar dynamic theo role per ARCHITECTURE §7.3 — ADMIN thấy đủ Quản trị section, DONVI chỉ thấy Nghiệp vụ section limited
- Logout flow theo UI-SPEC §Logout Flow (AUTH-03): AlertDialog → signOut → toast → redirect /login
- AUTH-07 satisfied: light mode hardcode, locale vi-VN

Output:
- ~18 shadcn components installed (verify components/ui/*.tsx exist)
- 7 layout components viết theo UI-SPEC pixel-perfect (sidebar w-64/w-16, topbar h-14, accent navy blue-700)
- (app)/layout.tsx wrap với auth() check + AppShell
- Providers wrap (QueryProvider sẵn dùng phase sau)
- Light mode hardcode trong root layout (Plan 01) đã có; Plan 04 không thêm dark toggle
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-01-repo-init-PLAN.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-03-nextauth-credentials-PLAN.md
</context>

<interfaces>
<!-- Plan 04 produces these for Plan 05 (Login UI) and downstream phases -->

```typescript
// components/layout/AppShell.tsx — MUST export
type AppShellProps = {
  user: {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationId: string | null;
    organizationName: string | null;
  };
  children: React.ReactNode;
};
export function AppShell(props: AppShellProps): JSX.Element;

// components/layout/AppSidebar.tsx — MUST export
export function AppSidebar(props: { user: AppShellProps['user'] }): JSX.Element;

// components/providers/AppProviders.tsx — MUST export
export function AppProviders({ children }: { children: React.ReactNode }): JSX.Element;
```

For Plan 05 (Login Page) the executor will use:
- `app/(auth)/layout.tsx` (Plan 05 will create) — minimal layout, NO AppShell
- `redirect('/dashboard')` from server action for authenticated users hitting /login
</interfaces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Server (auth() RSC) → Client component | Session passed via props, not exposed via global |
| Browser → Server action (logoutAction) | CSRF protected by Next.js Server Actions framework |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-01 | I (Information Disclosure) | Session in client bundle | mitigate | `(app)/layout.tsx` is RSC, calls `await auth()`, passes ONLY public fields (id, username, fullName, role, organizationId, organizationName) to AppShell. KHÔNG pass `passwordHash`, `email` raw, hay full session token. Verify AppShell props type khớp interfaces block. |
| T-04-02 | E (Elevation of Privilege) | Sidebar items shown bypass | accept | UI guard layer (sidebar) is layer 4 (UI polish per ARCHITECTURE §7.1) — NOT authoritative. Real check ở Server Action / Page level (Plan 03 + downstream). Even if user "inspect element" và unhide menu items, click navigate sẽ trigger middleware → redirect nếu not authorized at page level. |
| T-04-03 | I | Logout race condition | mitigate | LogoutDialog dùng `<form action={logoutAction}>` (Plan 03 server action) — Next.js native CSRF + idempotent. Button disabled khi pending qua `useFormStatus()`. KHÔNG dùng client-side fetch + manual cookie clear. |
| T-04-04 | T | XSS qua user fullName | mitigate | React tự escape mọi text node — UserMenu render `{user.fullName}` an toàn. KHÔNG dùng `dangerouslySetInnerHTML`. KHÔNG concatenate HTML strings. |
| T-04-05 | I | Org name leak qua avatar tooltip | accept | UI shows org name (per UI-SPEC Topbar) is an intentional feature — user thấy org của mình. Không phải info disclosure. |
| T-04-06 | I | Role label leak | accept | UI hiện role label (per UI-SPEC) — phần của design, không phải security boundary. |
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Cài ~18 shadcn components official theo UI-SPEC §Registry Safety</name>
  <files>components/ui/button.tsx, components/ui/input.tsx, components/ui/label.tsx, components/ui/form.tsx, components/ui/card.tsx, components/ui/separator.tsx, components/ui/sonner.tsx, components/ui/sheet.tsx, components/ui/sidebar.tsx, components/ui/dropdown-menu.tsx, components/ui/avatar.tsx, components/ui/breadcrumb.tsx, components/ui/alert-dialog.tsx, components/ui/alert.tsx, components/ui/skeleton.tsx, components/ui/badge.tsx, components/ui/tooltip.tsx, components/ui/scroll-area.tsx, hooks/use-mobile.ts</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (§Registry Safety — exact ~18 component list)
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §11 (shadcn checklist)
    - d:/Thaodnp/XTTM/components.json (Plan 01 — verify config khớp shadcn CLI v4)
  </read_first>
  <action>
**Bước 1: Run shadcn add cho 18 components theo UI-SPEC §Registry Safety:**
```bash
cd d:/Thaodnp/XTTM
npx shadcn@latest add button input label form card separator sonner sheet sidebar dropdown-menu avatar breadcrumb alert-dialog alert skeleton badge tooltip scroll-area
```

CLI có thể prompt overwrite cho `button.tsx` (đã add ở Plan 01 Task 2 smoke test) → trả lời `y` (overwrite OK, file mới giống file cũ).

**Bước 2: Verify list components đã tạo:**
```bash
ls components/ui/*.tsx
```
Expected output (alphabetical): `alert-dialog.tsx`, `alert.tsx`, `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button.tsx`, `card.tsx`, `dropdown-menu.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `scroll-area.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `sonner.tsx`, `tooltip.tsx` = 18 files.

**Bước 3: shadcn `sidebar` block tự generate `hooks/use-mobile.ts`** (mobile breakpoint detection). Verify:
```bash
test -f hooks/use-mobile.ts
```
Nếu CLI tạo trong `components/hooks/` thay vì root `hooks/`, di chuyển:
```bash
mv components/hooks/use-mobile.ts hooks/use-mobile.ts 2>/dev/null || true
rmdir components/hooks 2>/dev/null || true
```

**Bước 4: shadcn `form` block install thêm dependency `react-hook-form` peer (đã cài Plan 01) — không lỗi. Verify import:**
```bash
grep -l "react-hook-form" components/ui/form.tsx
```
Expected: components/ui/form.tsx imports react-hook-form.

**Bước 5: shadcn `sonner` block install dependency `sonner` (đã cài Plan 01). Verify components/ui/sonner.tsx exports `Toaster`.

**Bước 6: shadcn `sidebar` block tạo nhiều exports (SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarGroup, SidebarGroupLabel, ...). Verify file size:**
```bash
wc -l components/ui/sidebar.tsx
```
Expected: >500 lines (sidebar block lớn nhất shadcn). Nếu <100 dòng → CLI có thể đã add wrong, re-run.

**KHÔNG cài thêm components ngoài UI-SPEC list.** Plan 04 chỉ cài đúng 18 components theo spec lock. Phase sau (M1+) sẽ add thêm `table`, `data-table`, `tabs`, `accordion`, `pagination`, `select`, `checkbox`, `radio-group`, `switch`, `dialog`, `drawer`, `popover`, `command`, `combobox`, `calendar`, `date-picker`, `progress`, `chart` per UI-SPEC §Registry Safety footnote và STACK §11 full checklist.

**Lý do chỉ cài 18 ở M0:** Phase 1 chỉ cần đủ components cho login + layout shell + 404/500 + dashboard placeholder. Cài thừa → bloat repo, dev confusion về components nào dùng được khi chưa có UI spec.
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f components/ui/button.tsx &amp;&amp;
      test -f components/ui/input.tsx &amp;&amp;
      test -f components/ui/label.tsx &amp;&amp;
      test -f components/ui/form.tsx &amp;&amp;
      test -f components/ui/card.tsx &amp;&amp;
      test -f components/ui/separator.tsx &amp;&amp;
      test -f components/ui/sonner.tsx &amp;&amp;
      test -f components/ui/sheet.tsx &amp;&amp;
      test -f components/ui/sidebar.tsx &amp;&amp;
      test -f components/ui/dropdown-menu.tsx &amp;&amp;
      test -f components/ui/avatar.tsx &amp;&amp;
      test -f components/ui/breadcrumb.tsx &amp;&amp;
      test -f components/ui/alert-dialog.tsx &amp;&amp;
      test -f components/ui/alert.tsx &amp;&amp;
      test -f components/ui/skeleton.tsx &amp;&amp;
      test -f components/ui/badge.tsx &amp;&amp;
      test -f components/ui/tooltip.tsx &amp;&amp;
      test -f components/ui/scroll-area.tsx &amp;&amp;
      test -f hooks/use-mobile.ts &amp;&amp;
      [ $(ls components/ui/*.tsx | wc -l) -ge 18 ] &amp;&amp;
      [ $(wc -l &lt; components/ui/sidebar.tsx) -gt 500 ] &amp;&amp;
      grep -q "Toaster" components/ui/sonner.tsx &amp;&amp;
      grep -q "react-hook-form" components/ui/form.tsx &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - 18 files exists trong `components/ui/`: button, input, label, form, card, separator, sonner, sheet, sidebar, dropdown-menu, avatar, breadcrumb, alert-dialog, alert, skeleton, badge, tooltip, scroll-area
    - `components/ui/sidebar.tsx` >500 lines (full sidebar block với SidebarProvider, SidebarInset, SidebarMenu exports)
    - `components/ui/form.tsx` imports `react-hook-form`
    - `components/ui/sonner.tsx` exports `Toaster`
    - `hooks/use-mobile.ts` exists (auto-generated by sidebar block)
    - `npx tsc --noEmit` exit code 0 (no missing imports)
  </acceptance_criteria>
  <done>
    18 shadcn components theo UI-SPEC lock đã add từ official registry. Sidebar block full feature (Provider/Inset/Menu/Trigger). use-mobile hook ready. typecheck pass.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Build AppShell + AppSidebar + AppTopbar + AppBreadcrumb + UserMenu + LogoutDialog theo UI-SPEC pixel-perfect</name>
  <files>components/layout/AppShell.tsx, components/layout/AppSidebar.tsx, components/layout/AppTopbar.tsx, components/layout/AppBreadcrumb.tsx, components/layout/UserMenu.tsx, components/layout/LogoutDialog.tsx, components/layout/SidebarMenuItem.tsx</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (toàn bộ §Layout Shell Contract — Sidebar/Topbar/Breadcrumb sections; §Color §Spacing §Typography §Copywriting Contract; §Logout Flow)
    - d:/Thaodnp/XTTM/lib/permissions.ts (Plan 01 — getMenuItems, MenuItem type)
    - d:/Thaodnp/XTTM/lib/constants.ts (Plan 01 — ROLE_LABELS, TERMS, type Role)
    - d:/Thaodnp/XTTM/lib/breadcrumbs.ts (Plan 01 — buildBreadcrumb, BREADCRUMB_LABELS)
    - d:/Thaodnp/XTTM/components/ui/sidebar.tsx (Task 1 — verify SidebarProvider + Sidebar + SidebarInset + SidebarMenuButton exports)
    - d:/Thaodnp/XTTM/components/ui/breadcrumb.tsx (Task 1 — verify Breadcrumb + BreadcrumbList + BreadcrumbItem + BreadcrumbLink + BreadcrumbSeparator + BreadcrumbPage exports)
    - d:/Thaodnp/XTTM/app/(auth)/_actions/logout.ts (Plan 03 — logoutAction)
  </read_first>
  <action>
**File 1: `components/layout/SidebarMenuItem.tsx`** — Client component cho từng menu item với Lucide icon dynamic + active state highlight:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem as ShadSidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/lib/permissions';

type Props = { item: MenuItem };

export function SidebarMenuItem({ item }: Props) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    toPascal(item.icon)
  ] ?? Icons.Circle;

  return (
    <ShadSidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className={cn(
          'gap-2',
          isActive &amp;&amp; 'bg-blue-50 text-blue-700 border-l-2 border-l-blue-700 font-semibold',
        )}
      >
        <Link href={item.href}>
          <Icon className="h-4 w-4" />
          <span className="text-sm">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </ShadSidebarMenuItem>
  );
}

function toPascal(kebab: string): string {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}
```

**File 2: `components/layout/AppSidebar.tsx`** — Server Component, render menu sections theo role:
```tsx
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { getMenuItems, type MenuItem } from '@/lib/permissions';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import { SidebarMenuItem } from './SidebarMenuItem';

type Props = {
  user: {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationName: string | null;
  };
};

export function AppSidebar({ user }: Props) {
  const items = getMenuItems(user.role);
  const businessItems = items.filter((i) => i.section === 'NGHIEP_VU');
  const adminItems = items.filter((i) => i.section === 'QUAN_TRI');

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <span className="text-lg font-bold text-blue-700">XTTMQG</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {businessItems.length > 0 &amp;&amp; (
          <SidebarGroup>
            <SidebarGroupLabel>Nghiệp vụ</SidebarGroupLabel>
            <SidebarMenu>
              {businessItems.map((item) => (
                <SidebarMenuItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
        {adminItems.length > 0 &amp;&amp; (
          <SidebarGroup>
            <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-slate-500">
          <div className="font-semibold text-slate-700">{user.fullName}</div>
          <div className="truncate text-slate-500">
            {ROLE_LABELS[user.role]}
            {user.organizationName ? ` · ${user.organizationName}` : ''}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

**File 3: `components/layout/AppBreadcrumb.tsx`** — Client component dùng usePathname:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildBreadcrumb } from '@/lib/breadcrumbs';

export function AppBreadcrumb() {
  const pathname = usePathname();
  const items = buildBreadcrumb(pathname);

  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={item.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sm font-semibold text-slate-900">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-blue-700"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast &amp;&amp; (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </BreadcrumbSeparator>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

**File 4: `components/layout/LogoutDialog.tsx`** — AlertDialog confirm logout:
```tsx
'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { logoutAction } from '@/app/(auth)/_actions/logout';
import { toast } from 'sonner';

export function LogoutDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      toast.success('Đã đăng xuất khỏi hệ thống');
      await logoutAction();
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            className="bg-red-600 hover:bg-red-700"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng xuất...
              </>
            ) : (
              'Đăng xuất'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**File 5: `components/layout/UserMenu.tsx`** — Avatar + dropdown:
```tsx
'use client';

import { ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import { LogoutDialog } from './LogoutDialog';

type Props = {
  user: {
    fullName: string;
    role: Role;
    organizationName: string | null;
    email?: string | null;
  };
};

export function UserMenu({ user }: Props) {
  const initials = getInitials(user.fullName);
  const roleLine =
    user.organizationName != null
      ? `${ROLE_LABELS[user.role]} · ${user.organizationName}`
      : ROLE_LABELS[user.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-700 text-white text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-slate-900">{user.fullName}</span>
          <span className="text-sm text-slate-600 truncate max-w-[180px]">{roleLine}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-semibold">Xin chào, {user.fullName}</span>
            <span className="text-xs text-slate-600 truncate">{roleLine}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LogoutDialog />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

**File 6: `components/layout/AppTopbar.tsx`** — Sticky h-14 với trigger + breadcrumb + bell + user menu:
```tsx
import { Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { type Role } from '@/lib/constants';
import { AppBreadcrumb } from './AppBreadcrumb';
import { UserMenu } from './UserMenu';

type Props = {
  user: {
    id: string;
    fullName: string;
    role: Role;
    organizationName: string | null;
  };
};

export function AppTopbar({ user }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" aria-label="Mở rộng thanh điều hướng" />
        <AppBreadcrumb />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Thông báo"
          className="relative text-slate-600 hover:text-blue-700"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
```

**File 7: `components/layout/AppShell.tsx`** — Outer wrapper:
```tsx
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { type Role } from '@/lib/constants';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';

export type AppUser = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  organizationId: string | null;
  organizationName: string | null;
};

type Props = {
  user: AppUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppTopbar user={user} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Verify visual lock** với UI-SPEC §Layout Shell Contract:
- Sidebar variant `inset` ✓
- Sidebar collapsible `icon` (= w-16 collapsed) ✓
- Active state `bg-blue-50 text-blue-700 border-l-2 border-l-blue-700 font-semibold` ✓
- Topbar h-14 sticky with white bg + border-b slate-200 ✓
- User dropdown `Xin chào, {fullName}` ✓
- Logout flow: AlertDialog với title "Xác nhận đăng xuất" + body chuẩn + 2 buttons "Hủy" + "Đăng xuất" destructive ✓
- Breadcrumb separator chevron-right + items có hover blue-700 ✓
- Avatar initials bg-blue-700 text-white ✓

KHÔNG render Skip-link ở Plan 04 (UI-SPEC mention nhưng accessibility polish defer M7); Plan 04 chỉ render `id="main-content"` ready cho Skip-link sau.
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f components/layout/AppShell.tsx &amp;&amp;
      test -f components/layout/AppSidebar.tsx &amp;&amp;
      test -f components/layout/AppTopbar.tsx &amp;&amp;
      test -f components/layout/AppBreadcrumb.tsx &amp;&amp;
      test -f components/layout/UserMenu.tsx &amp;&amp;
      test -f components/layout/LogoutDialog.tsx &amp;&amp;
      test -f components/layout/SidebarMenuItem.tsx &amp;&amp;
      grep -q 'getMenuItems' components/layout/AppSidebar.tsx &amp;&amp;
      grep -q "variant=\"inset\"" components/layout/AppSidebar.tsx &amp;&amp;
      grep -q 'collapsible="icon"' components/layout/AppSidebar.tsx &amp;&amp;
      grep -q 'Nghiệp vụ' components/layout/AppSidebar.tsx &amp;&amp;
      grep -q 'Quản trị' components/layout/AppSidebar.tsx &amp;&amp;
      grep -q 'XTTMQG' components/layout/AppSidebar.tsx &amp;&amp;
      grep -q 'h-14' components/layout/AppTopbar.tsx &amp;&amp;
      grep -q 'sticky' components/layout/AppTopbar.tsx &amp;&amp;
      grep -q 'aria-label="Thông báo"' components/layout/AppTopbar.tsx &amp;&amp;
      grep -q 'buildBreadcrumb' components/layout/AppBreadcrumb.tsx &amp;&amp;
      grep -q 'usePathname' components/layout/AppBreadcrumb.tsx &amp;&amp;
      grep -q "ChevronRight" components/layout/AppBreadcrumb.tsx &amp;&amp;
      grep -q 'Xin chào' components/layout/UserMenu.tsx &amp;&amp;
      grep -q 'getInitials' components/layout/UserMenu.tsx &amp;&amp;
      grep -q 'bg-blue-700 text-white' components/layout/UserMenu.tsx &amp;&amp;
      grep -q 'Xác nhận đăng xuất' components/layout/LogoutDialog.tsx &amp;&amp;
      grep -q 'Bạn có chắc chắn muốn đăng xuất' components/layout/LogoutDialog.tsx &amp;&amp;
      grep -q 'logoutAction' components/layout/LogoutDialog.tsx &amp;&amp;
      grep -q 'bg-red-600' components/layout/LogoutDialog.tsx &amp;&amp;
      grep -q 'SidebarProvider' components/layout/AppShell.tsx &amp;&amp;
      grep -q 'SidebarInset' components/layout/AppShell.tsx &amp;&amp;
      grep -q 'id="main-content"' components/layout/AppShell.tsx &amp;&amp;
      npx tsc --noEmit
    </automated>
  </verify>
  <acceptance_criteria>
    - 7 layout files exists trong `components/layout/`
    - `AppSidebar.tsx` is RSC (no 'use client'), uses `getMenuItems(user.role)` and renders 2 sections "Nghiệp vụ" + "Quản trị"
    - `AppSidebar.tsx` uses `variant="inset"` and `collapsible="icon"` (w-16 collapsed per UI-SPEC)
    - `AppSidebar.tsx` Header renders `XTTMQG` wordmark with `text-blue-700`
    - `AppTopbar.tsx` has `h-14`, `sticky top-0`, `border-b border-slate-200 bg-white`
    - `AppTopbar.tsx` Bell button `aria-label="Thông báo"`, separator vertical h-6, UserMenu on right
    - `AppBreadcrumb.tsx` is client (`'use client'`), uses `usePathname()` + `buildBreadcrumb(pathname)` from Plan 01
    - `AppBreadcrumb.tsx` separator uses `<ChevronRight className="h-3.5 w-3.5 text-slate-400">`
    - `UserMenu.tsx` greeting `Xin chào, {fullName}` (UI-SPEC Copywriting), Avatar fallback bg-blue-700 text-white, getInitials function
    - `LogoutDialog.tsx` AlertDialog title `Xác nhận đăng xuất`, body `Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?`, 2 buttons `Hủy` + `Đăng xuất` destructive (`bg-red-600`)
    - `LogoutDialog.tsx` calls `logoutAction` from `@/app/(auth)/_actions/logout`
    - `LogoutDialog.tsx` shows `Loader2 animate-spin` + `Đang đăng xuất...` text khi pending
    - `AppShell.tsx` wraps `SidebarProvider` > `AppSidebar` + `SidebarInset` > `AppTopbar` + `main#main-content`
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>
    Layout shell components viết theo UI-SPEC pixel-perfect: AppSidebar role-aware (Nghiệp vụ + Quản trị sections, inset variant, icon collapsible), AppTopbar sticky h-14 với bell + user menu, AppBreadcrumb dùng buildBreadcrumb, UserMenu với greeting Vietnamese + avatar initials, LogoutDialog confirmation chuẩn copywriting. typecheck pass.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Providers (TanStack Query) + (app)/layout.tsx wire auth() session vào AppShell</name>
  <files>components/providers/QueryProvider.tsx, components/providers/AppProviders.tsx, app/(app)/layout.tsx</files>
  <read_first>
    - d:/Thaodnp/XTTM/.planning/research/STACK.md §2 (TanStack Query v5 — useSyncExternalStore, isPending vs isLoading)
    - d:/Thaodnp/XTTM/lib/auth.ts (Plan 03 — auth() function)
    - d:/Thaodnp/XTTM/components/layout/AppShell.tsx (Task 2 — AppUser type)
    - d:/Thaodnp/XTTM/.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md (no theme toggle, light mode hardcoded)
  </read_first>
  <action>
**File 1: `components/providers/QueryProvider.tsx`** — TanStack Query client wrap:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

**File 2: `components/providers/AppProviders.tsx`** — Composition root cho providers:
```tsx
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
```
Note: Plan 04 không add ThemeProvider vì UI-SPEC quy định light mode hardcode (đã set `class="light"` trên `<html>` trong Plan 01 Task 1 root layout). Plan 04 cũng không add LocaleProvider vì date-fns đọc locale qua import `vi` trực tiếp (Plan 01 lib/format.ts) — không cần context provider.

**File 3: Overwrite `app/(app)/layout.tsx`** (placeholder từ Plan 03 task 2):
```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { AppProviders } from '@/components/providers/AppProviders';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppProviders>
      <AppShell user={session.user}>{children}</AppShell>
    </AppProviders>
  );
}
```

**Lưu ý:**
- `auth()` trong RSC trả về Session (đã augment trong types/next-auth.d.ts từ Plan 01).
- `session.user` shape: `{ id, username, fullName, role, organizationId, organizationName }` — khớp `AppShell` props `user: AppUser`.
- Middleware Plan 03 đã redirect /login khi chưa auth, nhưng `(app)/layout.tsx` thêm fallback check (defense-in-depth) — nếu somehow middleware miss (vd config matcher sai), layout vẫn redirect.
- KHÔNG dùng `<ThemeProvider>` vì:
  1. UI-SPEC §Design System quy định light mode only, no toggle
  2. Plan 01 đã set `<html class="light" suppressHydrationWarning>` trong root layout
  3. shadcn không yêu cầu ThemeProvider khi không có dark/system toggle
- KHÔNG render Skip-link ở Plan 04 (defer M7).

**Verify overall flow:**
1. `npm run build` — phải pass, no errors
2. Manual: `npm run start` → GET `/dashboard` chưa auth → redirect `/login` (qua middleware Plan 03) → 200 (placeholder login page Plan 03 task 2 tạo)
3. Sau Plan 05 hoàn tất, có thể login với donvi1/Donvi@123 → redirect /de-an (defaultLandingPath cho DONVI) → AppShell render với menu role-aware (Đề án, Hợp đồng, Triển khai, Báo cáo, Nghiệm thu, Thông báo — DONVI có quyền theo permissions matrix Plan 01).
  </action>
  <verify>
    <automated>
      cd d:/Thaodnp/XTTM &amp;&amp;
      test -f components/providers/QueryProvider.tsx &amp;&amp;
      grep -q "'use client'" components/providers/QueryProvider.tsx &amp;&amp;
      grep -q 'QueryClientProvider' components/providers/QueryProvider.tsx &amp;&amp;
      grep -q 'staleTime' components/providers/QueryProvider.tsx &amp;&amp;
      test -f components/providers/AppProviders.tsx &amp;&amp;
      grep -q 'QueryProvider' components/providers/AppProviders.tsx &amp;&amp;
      test -f "app/(app)/layout.tsx" &amp;&amp;
      grep -q "import { auth }" "app/(app)/layout.tsx" &amp;&amp;
      grep -q 'await auth()' "app/(app)/layout.tsx" &amp;&amp;
      grep -q "redirect\\('/login'\\)" "app/(app)/layout.tsx" &amp;&amp;
      grep -q 'AppShell' "app/(app)/layout.tsx" &amp;&amp;
      grep -q 'AppProviders' "app/(app)/layout.tsx" &amp;&amp;
      npx tsc --noEmit &amp;&amp;
      npm run build
    </automated>
  </verify>
  <acceptance_criteria>
    - `components/providers/QueryProvider.tsx` is `'use client'`, creates `QueryClient` lazily với `useState`, `staleTime: 30_000`, `refetchOnWindowFocus: false`
    - `components/providers/AppProviders.tsx` composes `QueryProvider` (light wrap, ready để add Theme/Locale providers later if needed)
    - `app/(app)/layout.tsx` is async RSC, calls `await auth()`, redirects `/login` if `!session?.user`
    - `app/(app)/layout.tsx` renders `<AppProviders><AppShell user={session.user}>{children}</AppShell></AppProviders>`
    - `npm run build` exit code 0 (full project builds với layout shell + providers)
    - `npx tsc --noEmit` exit code 0
    - Manual smoke (sau npm start): GET `/dashboard` chưa auth → redirect `/login` (verified bằng `curl -sIL` returns 307 → /login → 200)
  </acceptance_criteria>
  <done>
    QueryProvider sẵn cho phase sau dùng TanStack Query. AppProviders composition ready. (app)/layout.tsx wire auth() → AppShell, defense-in-depth redirect khi unauth. Plan 04 hoàn chỉnh. Plan 05 chỉ cần build login page UI vào (auth)/login/page.tsx mà mọi layout shell đã sẵn sàng.
  </done>
</task>

</tasks>

<verification>
**Phase-level checks (Plan 04):**
1. `npm run build` exit 0 — full project build with 18 shadcn components + 7 layout components + providers + (app)/layout
2. `npm run typecheck` exit 0 — types từ session augment + permissions matrix + sidebar block resolve đúng
3. shadcn components count: `ls components/ui/*.tsx | wc -l` ≥ 18
4. Layout components count: `ls components/layout/*.tsx | wc -l` = 7
5. Manual smoke (sau Plan 05 hoàn tất): login với donvi1 → redirect /de-an → sidebar render menu Nghiệp vụ chỉ (DONVI không có Quản trị section) → topbar hiện "Hoàng Mai Linh" + "Đơn vị chủ trì · Hiệp hội Da giày - Túi xách Việt Nam" → click logout dropdown → AlertDialog "Xác nhận đăng xuất" → confirm → toast "Đã đăng xuất" → redirect /login
6. Manual smoke admin: login với admin → redirect /dashboard → sidebar có cả Nghiệp vụ section và Quản trị section (5 items: Danh mục, Người dùng, Vai trò &amp; quyền, Cấu hình, Nhật ký truy cập)
</verification>

<success_criteria>
Plan 04 thành công khi:
- 18 shadcn components đã add từ official registry, sidebar block đầy đủ feature
- 7 layout components viết theo UI-SPEC §Layout Shell Contract pixel-perfect (sidebar inset variant collapsible icon, topbar h-14 sticky, breadcrumb chevron-right, user menu greeting Vietnamese, logout dialog confirmation)
- (app)/layout.tsx call auth() + redirect fallback + render AppShell với session.user
- AppShell components đều type-safe, KHÔNG dùng `any`
- TanStack QueryProvider ready trong AppProviders cho phase sau
- AUTH-06 satisfied (sidebar dynamic theo role, topbar có user info + bell + logout dropdown, breadcrumb tiếng Việt)
- AUTH-07 satisfied (light mode hardcode, locale vi-VN qua format.ts)
- Plan 05 chỉ cần build (auth)/layout.tsx + login/page.tsx + 404/500 + dashboard placeholder; mọi shell + auth + permissions đã ready
- typecheck + build pass
</success_criteria>

<output>
Sau hoàn thành, tạo `.planning/phases/01-m0-bootstrap-h-t-ng/01-04-layout-shell-SUMMARY.md`:
- Tổng số shadcn components đã install: 18
- Tổng số layout components: 7
- Sidebar block file size (line count) — confirm full block
- Confirmation: AppSidebar render menu cho từng role (test bằng smoke: getMenuItems('ADMIN').length, getMenuItems('DONVI').length, etc. — verify counts khác nhau)
- AUTH-06, AUTH-07 satisfied — list specific UI-SPEC items mapped
- Confirmation Plan 05 ready: (auth)/layout.tsx có thể tạo riêng cho login (no AppShell), (app)/dashboard placeholder Plan 03 sẽ overwrite ở Plan 05
</output>
