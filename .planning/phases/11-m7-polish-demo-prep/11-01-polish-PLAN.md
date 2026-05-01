---
phase: 11-m7-polish-demo-prep
plan: 01
title: Mock data audit + Console hygiene + Demo script + Role switcher Cmd+K + README
wave: 1
autonomous: yes
depends_on: []
requirements: [POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08, POLISH-09, POLISH-10, POLISH-11, POLISH-12, POLISH-13]
---

<objective>
Final polish phase. 13 reqs. KHÔNG add features mới.
</objective>

<task n="1" id="11-01-01" type="seed-validator">
<read_first>
- prisma/seed.ts + prisma/seed/* (all seed files)
</read_first>

<action>
1. Create scripts/validate-seed.mts — sau npm run db:seed, run validator:
   - Every active ProgramCycle has at least 1 Project
   - Every Project APPROVED has Contract row
   - Every Contract IN_PROGRESS has ImplementationPlan
   - Every Project has organizationId pointing to existing Organization
   - Every Project has createdById pointing to existing User
   - Status mix verified (count per status >= expected minimum)
   - Throw if invariants fail

2. Add `npm run db:validate` script alias

3. Audit existing seeds — fix any data quality issues found:
   - Tên chủ nhiệm có chức danh: TS./PGS./CN./KS./Ths./ThS.
   - Tên đề án realistic (e.g., "Triển lãm Vietnam Expo 2026 — Quảng bá hàng Việt tại Đông Âu")
   - Realistic dates dùng daysAgo/daysFromNow

4. Run npm run db:reset && npm run db:seed && npm run db:validate exit 0

Commit: `feat(11-01): seed validator + audit mock data quality`
</action>
</task>

<task n="2" id="11-01-02" type="empty-states-and-skeletons">
<action>
Audit mọi list page và đảm bảo có proper empty state + skeleton:

1. Pages cần có empty state (icon + heading + description + CTA):
   - /chuong-trinh (no cycles yet)
   - /de-an (no projects)
   - /hop-dong (no contracts)
   - /dieu-chinh (no amendments)
   - /tiep-nhan (no submitted)
   - /phan-cong (no pending)
   - /kiem-tra (no assigned)
   - /cham-diem-so-bo (no valid)
   - /hoi-dong (no councils)
   - /tham-dinh (no assigned)
   - /phe-duyet (no submissions)
   - /thong-bao (no notifications)
   - /tai-chinh (no records)
   - /nhat-ky (no audit logs)
   - /nguoi-dung (no users — though always have 8)
   - /danh-muc (each catalog if no records)

2. Pages cần có skeleton loading (use Suspense + skeleton):
   - Same list pages above

3. Reuse components/shared/EmptyState.tsx và shadcn Skeleton

Commit: `feat(11-01): polish empty states + skeleton loaders cho mọi list page`
</action>
</task>

<task n="3" id="11-01-03" type="role-switcher-cmd-k">
<action>
Build Cmd+K command palette role switcher (dev tool):

1. components/shared/RoleSwitcherCmdK.tsx (client):
   - Use shadcn Command component
   - Trigger: Cmd+K (Mac) / Ctrl+K (Windows) global keyboard listener
   - Show: 8 accounts list với role + đơn vị
   - Click → server action signOut + signIn(account) → redirect to role landing
   - Optional: search filter

2. Show only in dev mode OR with ?demo=1 URL param (production safety)

3. Mount trong AppShell (gated by env)

Commit: `feat(11-01): Cmd+K role switcher cho dev/demo`
</action>
</task>

<task n="4" id="11-01-04" type="demo-script-readme">
<read_first>
- .planning/SESSION-OVERNIGHT-REPORT.md (đã có demo script khuyến nghị)
- 🎬 FLOW DEMO CHUẨN.docx (extract nếu có thể)
</read_first>

<action>
1. Create scripts/demo-script.md — chi tiết step-by-step theo 7 phần đã có trong SESSION-OVERNIGHT-REPORT.md, mở rộng với:
   - Setup (npm install, db:reset, db:seed, dev)
   - Time estimates per phần
   - Talking points cho lãnh đạo (highlight wow features)
   - Talking points cho IT team (highlight architecture decisions)
   - Backup plan nếu có lỗi (skip step X, focus vào Y)

2. Update README.md (nếu chưa có thì tạo):
   - Project overview
   - Setup commands
   - 8 demo accounts
   - Demo script reference
   - Tech stack quick view
   - Known limitations (defer to Phase 2 list)

Commit: `docs(11-01): demo script + README hướng dẫn chạy demo`
</action>
</task>

<task n="5" id="11-01-05" type="console-hygiene-audit">
<action>
Console + build hygiene audit:

1. npm run build — capture warnings/errors
2. Fix any:
   - Console.log statements ngoài seed/scripts (remove or guard with NODE_ENV)
   - React key warnings
   - Hydration warnings
   - Unused imports / dead code (eslint --fix)
3. Final smoke tests:
   - npx tsx scripts/smoke-auth.mts (8/8 PASS)
   - npx tsx scripts/menu-smoke.mts
   - npx tsx scripts/pdf-smoke-test.mts
4. Production build size check (npm run build) — log final route sizes

Commit: `chore(11-01): console hygiene + dead code cleanup + final smoke pass`
</action>
</task>

<verification>
npm run build exit 0. Update STATE.md, ROADMAP.md, REQUIREMENTS.md mark 13 reqs complete. Phase 11 done — POC complete.
</verification>
