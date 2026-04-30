---
phase: 01-m0-bootstrap-h-t-ng
plan: 02
subsystem: data-layer
tags: [prisma, sqlite, schema, seed, bcrypt, scaffolding, m0, data-foundation]

requires:
  - "Plan 01: lib/constants.ts HARDCODED_USERS + ORG_CODES + ROLES"
  - "Plan 01: lib/vi-search.ts removeDiacritics for searchKey"
  - "Plan 01: lib/prisma.ts PrismaClient singleton (consumes generated client)"
  - "Plan 01: prisma 6.19 + @prisma/client 6.19 + bcryptjs 2.4 + tsx 4.21"
  - "Plan 01: package.json scripts db:push, db:seed + prisma.seed config"
provides:
  - "prisma/schema.prisma — 14 models locked cho M0-M9 (User, Role, Permission, RolePermission, Organization, OrganizationProfile, ProgramCycle, Project, EvaluationCouncil, ScoreSheet, Contract, Report, Attachment, AuditLog)"
  - "prisma/dev.db — SQLite database file đã push schema (gitignored, 225KB)"
  - "node_modules/@prisma/client — typed Prisma Client v6.19.3 generated"
  - "8 hardcoded users seeded với bcrypt cost 10 (admin, banql, chuyenvien, hoidong, donvi1, donvi2, taichinh, lanhdao)"
  - "5 organizations seeded với tên Vietnamese thật (Bộ Công Thương, Cục XTTM, VITAS, LEFASO, VINATEX)"
  - "User-Organization mapping: banql/chuyenvien/hoidong/taichinh→CUC_XTTM, donvi1→LEFASO, donvi2→VITAS, lanhdao→BO_CT, admin→null"
  - "Idempotent seed (upsert pattern) — chạy lại không nhân bản"
  - ".env file (gitignored) chứa DATABASE_URL cho Prisma CLI"
  - "Scaffolding cho parentProjectId (đề án 2 năm) + searchKey (VN search) + soft delete (deletedAt)"
affects: [01-03-nextauth, 01-04-layout-shell, 02-quan-tri-danh-muc, 03-chu-ky-chuong-trinh, all-future-phases]

tech-stack:
  added:
    - "prisma/schema.prisma (Prisma 6 schema language)"
    - ".env file (Prisma CLI convention — duplicates DATABASE_URL từ .env.local)"
  patterns:
    - "SQLite type strategy: Float thay Decimal (precision loss accepted cho POC, swap khi production Postgres); String thay enum (debug-friendly, swap-friendly)"
    - "JSON columns: SQLite không có JSON type → dùng String? cho marketIds/countryIds/scoresJson/quantitativeData/contactPersons/diffJson — serialize manual"
    - "Polymorphic Attachment: entityType + entityId + composite index — 1 model phục vụ mọi entity (Project, Contract, Report, ProgramCycle, OrganizationProfile)"
    - "Self-relation Project.parentProjectId qua named relation 'ProjectYearLink' — đề án 2 năm = 2 records riêng có link (per PITFALLS §4.2)"
    - "Soft delete via deletedAt nullable timestamp — tránh hard delete cho audit"
    - "searchKey String column lưu diacritics-removed name+code — query VN không cần FTS"
    - "Audit-ready createdAt/updatedAt cho tất cả models — Prisma @default(now()) + @updatedAt"
    - "Seed idempotent qua prisma.X.upsert({ where, update, create }) — rerun không tạo duplicate, update nếu data thay đổi"
    - "Bcrypt cost 10 (POC standard, ~80ms/hash) — bcryptjs Windows-compatible (không native bcrypt fail)"

key-files:
  created:
    - "prisma/schema.prisma — 14 models, 323 lines, SQLite + DATABASE_URL env"
    - "prisma/.gitignore — exclude *.db, *.db-journal"
    - "prisma/seed.ts — entry point idempotent với count assertions"
    - "prisma/seed/helpers.ts — hashPassword(plain) cost 10, logSeedStep utility"
    - "prisma/seed/organizations.ts — 5 orgs với tên Vietnamese thật, searchKey diacritics-removed"
    - "prisma/seed/users.ts — 8 users từ HARDCODED_USERS (lib/constants.ts), org resolved qua orgCode"
    - ".env — Prisma CLI convention (DATABASE_URL=\"file:./dev.db\", gitignored)"
  modified: []

key-decisions:
  - "Tạo .env (gitignored) cho Prisma CLI — Prisma CLI mặc định đọc .env, không đọc .env.local. Giữ .env.local cho Next.js app runtime, .env cho Prisma CLI tooling."
  - "Schema lock 14 models tại M0 thay vì chỉ User+Organization — pitfall research §4.1, §4.2 cảnh báo schema thrashing trong Phase 2-3 sẽ tốn 5-10x. Scaffold đầy đủ ngay, phase sau chỉ extend fields."
  - "Schema dùng String cho status thay Prisma enum — debug-friendly, swap-friendly khi migrate Postgres production. RBAC enforcement ở lib/permissions.ts authoritative."
  - "Float cho currency thay Decimal — SQLite REAL có precision loss nhưng acceptable cho POC; production Postgres sẽ migrate Decimal."
  - "Polymorphic Attachment thay 1 model per entity — 1 attachment table với entityType+entityId index phục vụ Project/Contract/Report/ProgramCycle/OrganizationProfile."
  - "Bcrypt cost 10 thay 12 — cost 12 ~250ms/hash sẽ làm seed 8 users mất 2s, cost 10 ~80ms còn ~640ms — tốt hơn cho dev iteration."

patterns-established:
  - "Seed pattern: separate file per entity (prisma/seed/{users,organizations}.ts) + entry point (prisma/seed.ts) gọi theo dependency order (orgs first, users next FK organizationId)"
  - "Idempotent seed: prisma.X.upsert({ where: { uniqueField }, update: {...}, create: {...} }) — rerun safe"
  - "Password hash: import { hashPassword } from './helpers' → bcrypt.hash(plain, 10) — KHÔNG hardcode cost trong từng file"
  - "Org resolution: orgCode (string from lib/constants) → prisma.organization.findUnique({ where: { code }}) → organization.id (FK to User)"
  - "searchKey VN: removeDiacritics(name + ' ' + code) — diacritics-removed cho search; query input cũng strip diacritics rồi LIKE"
  - "Schema indexes: composite [programCycleId, status] cho list view filter; single [searchKey] cho VN search; [organizationId] cho user filter by org"

requirements-completed:
  - AUTH-02

duration: 4m
completed: 2026-04-30
---

# Phase 01 Plan 02: Prisma Schema + Seed Summary

**Schema Prisma 14 models cho M0-M9 (lock đầy đủ tránh schema thrashing) + push lên SQLite + seed 8 hardcoded users với bcrypt cost 10 + 5 organizations với tên Vietnamese thật, idempotent.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-30T16:46:21Z
- **Completed:** 2026-04-30T16:50:40Z
- **Tasks:** 3 (1 commit-producing + 1 BLOCKING infrastructure + 1 commit-producing)
- **Files created:** 7 (1 schema + 1 prisma/.gitignore + 1 .env + 4 seed files)

## Accomplishments

- Schema Prisma 14 models lock cho M0-M9 với scaffolding đầy đủ (User/Role/Permission/RolePermission/Organization/OrganizationProfile/ProgramCycle/Project với parentProjectId/EvaluationCouncil/ScoreSheet/Contract/Report/Attachment/AuditLog) — 323 dòng
- `npx prisma format` exit 0 — schema syntactically valid
- `npx prisma db push` thành công — `prisma/dev.db` 225KB tạo ra với toàn bộ 14 tables, indexes, FK constraints
- `@prisma/client` v6.19.3 generated → `node_modules/.prisma/client/`, `node_modules/@prisma/client/index.d.ts` exists
- `npm run db:seed` chạy 2 lần liên tiếp PASS — counts vẫn 8 users / 5 orgs (idempotent qua upsert)
- 8/8 hardcoded users bcrypt verify PASS với password đúng theo CLAUDE.md §5
- Org mappings đúng acceptance criteria: banql→CUC_XTTM, chuyenvien→CUC_XTTM, hoidong→CUC_XTTM, donvi1→LEFASO, donvi2→VITAS, taichinh→CUC_XTTM, lanhdao→BO_CT, admin→null
- `npx tsc --noEmit` exit 0 — Prisma Client types resolve trong `lib/prisma.ts` (Plan 01)
- `git ls-files prisma/ | grep '.db$'` empty — dev.db không tracked (T-02-03 mitigation)
- Seed time ~680ms cho 8 users (8 bcrypt hash) + 5 orgs — well under 10s threat budget

## Task Commits

1. **Task 1: Định nghĩa Prisma schema 14 models cho M0 + scaffolding** — `aa94202` (feat)
2. **Task 2: [BLOCKING] Push schema lên SQLite + generate Prisma Client** — NO_COMMIT (artifacts gitignored: prisma/dev.db, node_modules/@prisma/client)
3. **Task 3: Seed 8 users + 5 orgs idempotent** — `4314d14` (feat)

## Files Created

### Schema (Task 1)

- `prisma/schema.prisma` — 14 models, 323 lines:
  - **Auth (M0):** User (cuid id, username unique, passwordHash, role string, isActive, organizationId FK, indexes [organizationId][role])
  - **RBAC scaffold (Phase 2):** Role, Permission, RolePermission (composite PK)
  - **Organization (M0/M2.2):** Organization (code unique, type, searchKey diacritics-removed, isInvited, indexes [type][searchKey]), OrganizationProfile scaffold (1-1 với Organization, status DRAFT/SUBMITTED/APPROVED/REJECTED)
  - **Program Cycle scaffold (Phase 3 HERO):** ProgramCycle (year unique = 1 cycle/year, status 7-state, registrationOpen/CloseAt, evaluationStart/EndAt, approvalDeadline, scanDocumentUrl, invitedOrganizations JSON)
  - **Project scaffold (Phase 5 HERO):** Project (code unique XTTM-2026-001, programCycleId FK, organizationId FK, **parentProjectId self-relation 'ProjectYearLink' for đề án 2 năm per PITFALLS §4.2**, kind 9 types, marketIds/countryIds JSON, status 16-state, currentVersion, searchKey, deletedAt soft delete, indexes [programCycleId,status][organizationId][assignedReviewerId][searchKey])
  - **Evaluation scaffold (Phase 7 HERO):** EvaluationCouncil + ScoreSheet (unique [councilId,projectId,reviewerId], scoresJson, conflictOfInterest)
  - **Contract scaffold (Phase 8):** Contract (1-1 với Project, contractNo unique, status 6-state)
  - **Report scaffold (Phase 9):** Report (reportType PROGRESS/FINAL, status 4-state)
  - **Polymorphic Attachment:** entityType + entityId + composite index — phục vụ Project/Contract/Report/ProgramCycle/OrganizationProfile
  - **AuditLog (M1):** userId FK, action enum, resource enum, resourceId, diffJson, ip, userAgent, indexes [userId,createdAt][resource,resourceId]

### Gitignore (Task 1)

- `prisma/.gitignore` — exclude `*.db`, `*.db-journal`, `dev.db`, `dev.db-journal`

### Database (Task 2)

- `prisma/dev.db` — SQLite 225KB, 14 tables (gitignored)
- `node_modules/@prisma/client` — typed Prisma Client v6.19.3 generated

### Seed (Task 3)

- `prisma/seed.ts` — entry point, calls seedOrganizations() then seedUsers(), count assertions ≥8 users / ≥5 orgs, console.time, process.exit(0) on finally
- `prisma/seed/helpers.ts` — `BCRYPT_COST = 10`, `hashPassword(plain)` async wrapper, `logSeedStep(name, count)` logger
- `prisma/seed/organizations.ts` — 5 orgs (BO_CT/CUC_XTTM/VITAS/LEFASO/VINATEX) với tên Vietnamese thật, address, email, searchKey via removeDiacritics()
- `prisma/seed/users.ts` — 8 users từ HARDCODED_USERS (lib/constants.ts), passwordHash bcrypt cost 10, organizationId resolved qua orgCode lookup

### Config (deviation)

- `.env` — DATABASE_URL="file:./dev.db" cho Prisma CLI (gitignored)

## Decisions Made

- **Schema lock 14 models tại M0** — pitfall research §4.1 (state machine fields), §4.2 (parentProjectId 2-year project), §4.4 (soft delete) cảnh báo schema thrashing trong Phase 2-3 sẽ tốn 5-10x. Scaffold đầy đủ ngay, phase sau chỉ extend fields existing model.
- **String thay Prisma enum cho status** — debug-friendly (Prisma Studio hiển thị dễ đọc), swap-friendly khi migrate Postgres production. RBAC + state machine enforcement ở `lib/permissions.ts` + `lib/workflows/*.ts` (Plan 01) authoritative — schema chỉ là storage.
- **Float cho currency thay Decimal** — SQLite REAL có precision loss nhưng acceptable cho POC; production Postgres sẽ migrate Decimal. Đã document trong threat register T-02-04.
- **Polymorphic Attachment thay 1 model/entity** — 1 attachment table với `entityType+entityId+@@index([entityType, entityId])` phục vụ 5+ entity types. Tradeoff: không có FK constraint thật, nhưng đỡ 5+ join tables.
- **Bcrypt cost 10 thay 12** — cost 12 ~250ms/hash → seed 8 users mất 2s; cost 10 ~80ms → ~640ms. Cost 10 vẫn là industry POC standard. Threat T-02-01 mitigated.
- **Tạo .env riêng cho Prisma CLI** — Prisma CLI mặc định đọc `.env` file, không đọc `.env.local` (Next.js convention). Giải pháp: tạo `.env` chỉ chứa DATABASE_URL (Prisma CLI cần), giữ `.env.local` cho Next.js runtime. Cả hai gitignored.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma CLI không đọc .env.local — DATABASE_URL not found**

- **Found during:** Task 2 (npx prisma db push)
- **Issue:** `npx prisma db push --schema=prisma/schema.prisma` failed với `Error: Environment variable not found: DATABASE_URL`. Plan 01 lưu DATABASE_URL trong `.env.local` (Next.js convention), nhưng Prisma CLI mặc định chỉ đọc `.env` (Prisma docs convention). 2 conventions không tương thích.
- **Fix:** Tạo `.env` file chứa `DATABASE_URL="file:./dev.db"` ở root project. `.env` đã có sẵn trong `.gitignore` (line 32) nên KHÔNG commit ra repo. `.env.local` vẫn giữ nguyên cho Next.js runtime. Both files gitignored, no leakage.
- **Files modified:** `.env` (created)
- **Verification:** Sau khi tạo `.env`, `npx prisma db push` thành công với output `Environment variables loaded from .env`. `git check-ignore .env` confirm gitignored.
- **Committed in:** Not committed (`.env` is gitignored — same as `.env.local` from Plan 01)

**Why this is necessary, not scope creep:** Without `.env`, mọi command Prisma CLI (`db:push`, `db:seed`, `db:studio`, `db:reset`) sẽ fail. Plan 03 (NextAuth) cần `prisma.user.findUnique` runtime — Next.js đọc `.env.local`, OK. Nhưng dev workflow (npm run db:seed) sẽ liên tục fail nếu thiếu `.env`. Đây là blocker thực sự cho dev experience.

**Alternative considered & rejected:**
- (a) Pass `DATABASE_URL=...` inline mỗi lần chạy → fragile, dev quên = fail
- (b) Move DATABASE_URL từ `.env.local` sang `.env` only → break Next.js runtime (Next chỉ đọc `.env.local` cho dev)
- (c) Symlink `.env` → `.env.local` → Windows symlink permission issues
- (d) Dùng `dotenv-cli` wrapper trong scripts → thêm dep + complexity

Chọn (e) duplicate DATABASE_URL trong cả `.env` (Prisma CLI) và `.env.local` (Next.js runtime) — đơn giản, hai file đều gitignored, no security risk.

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)

**Impact on plan:** Không có scope creep. Deviation cần thiết để Prisma CLI hoạt động trên project có cả Next.js (.env.local) + Prisma (.env) tooling. Tất cả acceptance criteria của plan đạt 100%.

## Issues Encountered

- **Git LF→CRLF warnings** — Windows default line ending; không ảnh hưởng functionality. No action.
- **Prisma 7 deprecation warning** — `package.json#prisma` config sẽ removed trong Prisma 7, khuyên migrate sang `prisma.config.ts`. Hiện tại Prisma 6.19.3 vẫn support, không cần action ngay. Phase 11 (M7 polish) có thể address khi upgrade.

## User Setup Required

None — không cần external services. Database file `prisma/dev.db` tạo tự động bởi `npx prisma db push`.

## Threat Model Mitigations Applied

| Threat ID | Mitigation Status |
|-----------|-------------------|
| T-02-01 (I - Password storage) | ✅ MITIGATED — bcryptjs cost 10, schema field `passwordHash`, không lưu plaintext. 8/8 users verify PASS. |
| T-02-02 (I - Hardcoded user passwords trong source) | ⚠️ ACCEPTED — POC scope theo CLAUDE.md §5, demo credentials đã user-approved. |
| T-02-03 (I - DB file commit) | ✅ MITIGATED — `prisma/.gitignore` excludes `*.db`. `git ls-files prisma/ \| grep '.db$'` empty. |
| T-02-04 (T - Schema integrity) | ✅ MITIGATED (POC level) — Prisma `db push` + FK constraints. Phase 11 sẽ chuyển sang `migrate dev`. |
| T-02-05 (E - Role hardcoded as string) | ⚠️ ACCEPTED — schema String, RBAC enforcement ở lib/permissions.ts authoritative. |
| T-02-06 (I - Email/phone trong seed) | ⚠️ ACCEPTED — placeholder mock email/name, không phải data thật. |
| T-02-07 (D - Seed runs forever) | ✅ MITIGATED — seed.ts `process.exit` on finally, completed in 681ms (well under 10s budget). |

## Next Phase Readiness

**Plan 03 (NextAuth Credentials Provider) ready:**
- `prisma.user.findUnique({ where: { username }, include: { organization: true } })` ready — User table populated với 8 records
- `bcrypt.compare(input, user.passwordHash)` ready — passwordHash field populated với bcryptjs hash cost 10
- User shape matches `types/next-auth.d.ts` Session.user (Plan 01): `{ id, username, fullName, role, organizationId, organizationName: user.organization?.name }`
- `lib/prisma.ts` singleton (Plan 01) đã import được `@prisma/client` đã generated
- `AUTH_SECRET`, `AUTH_TRUST_HOST` đã có trong `.env.local`

**Plan 04 (Layout shell) ready:**
- Session.user.organization?.name có data thật (5 orgs Vietnamese names) → Topbar có thể render badge org

**Plan 11 (Mock data) ready:**
- 5 organizations seed làm "anchor" cho mock projects (Phase 5+) — không cần re-seed orgs.
- HARDCODED_USERS có roles đầy đủ → mock projects có thể assign assignedReviewerId tới các users thật

**No blockers.** Phase 1 có thể tiếp tục Plan 03.

## Self-Check

Verifying claims before completion:

**Files created:**
- FOUND: `prisma/schema.prisma` (323 lines, 14 models)
- FOUND: `prisma/.gitignore`
- FOUND: `prisma/seed.ts`
- FOUND: `prisma/seed/helpers.ts`
- FOUND: `prisma/seed/organizations.ts`
- FOUND: `prisma/seed/users.ts`
- FOUND: `prisma/dev.db` (225KB, gitignored)
- FOUND: `.env` (gitignored)

**Commits:**
- FOUND: `aa94202` — feat(01-02): define Prisma schema cho M0 với scaffolding cho phase 2-9
- FOUND: `4314d14` — feat(01-02): seed 8 hardcoded users + 5 organizations idempotent (AUTH-02)

**Behavioral smoke tests passed:**
- 14 models defined ✓
- `npx prisma format` exit 0 ✓
- `npx prisma db push` exit 0, dev.db 225KB ✓
- `node_modules/@prisma/client/index.d.ts` exists ✓
- SQLite `SELECT name FROM sqlite_master WHERE name='User'` returns 1 row ✓
- `prisma.user.count()` = 8 ✓
- `prisma.organization.count()` = 5 ✓
- bcrypt.compare for all 8 users PASS ✓
- Org mappings: banql→CUC_XTTM, donvi1→LEFASO, donvi2→VITAS, lanhdao→BO_CT, admin→null ✓
- `npm run db:seed` 2nd run idempotent (counts unchanged) ✓
- `npx tsc --noEmit` exit 0 ✓
- `git ls-files prisma/ | grep '.db$'` empty ✓ (T-02-03)

**Phase verification:**
- Plan-level: ALL 8 phase-level checks PASS
- File integrity: All 7 files exist with expected content

## Self-Check: PASSED

---

*Phase: 01-m0-bootstrap-h-t-ng*
*Completed: 2026-04-30*
