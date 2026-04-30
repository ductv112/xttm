---
phase: 02-m1-quan-tri-danh-muc
plan: 07
subsystem: m1-quan-tri-danh-muc
tags: [system-config, sla-params, email-template, sms-template, honorific, vietnamese, rbac]
requirements: [CONFIG-01, CONFIG-02]
dependency-graph:
  requires:
    - "Plan 02-01 lib/audit.ts withAuditLog wrapper"
    - "Plan 02-01 audit-types.ts AUDIT_RESOURCES['cau-hinh']"
    - "Plan 02-03 components/shared/RichTextEditor.tsx (Tiptap+VariableMenu)"
    - "Plan 02-03 components/shared/ConfirmDialog.tsx (useConfirmDialog)"
    - "Plan 02-05 lib/permissions.ts can(role,'cau-hinh','update')"
    - "Plan 01-01 lib/constants.ts SLA_THRESHOLDS"
    - "Plan 01-01 lib/prisma.ts singleton"
  provides:
    - "lib/system-config.ts cached helpers (30s TTL) cho Phase 3+"
    - "SystemConfig Prisma model (key-value JSON store)"
    - "Honorific enum 5 values + EMAIL_TEMPLATE_KEYS (5) + SMS_TEMPLATE_KEYS (3) cho downstream consumers"
    - "Server actions updateSLAConfig / updateEmailTemplate / updateSmsTemplate (admin-only)"
  affects:
    - "Phase 8 (Hợp đồng) — getSLAThresholds().CONTRACT_DAYS cho cảnh báo chậm ký 60 ngày"
    - "Phase 8 (Triển khai) — getSLAThresholds().CONSULATE_DAYS cho cảnh báo thương vụ 30 ngày"
    - "Phase 9 (Báo cáo) — getSLAThresholds().REPORT_DAYS cho cảnh báo hạn báo cáo 15 ngày"
    - "Phase 10 (Dashboard) — 4 SLA countdown widgets đọc từ getSLAThresholds()"
    - "Phase 3 (Chu kỳ) — getEmailTemplate('INVITE_REGISTRATION') cho composer email mời"
    - "Phase 7 (Phê duyệt) — getEmailTemplate('APPROVAL_RESULT') cho thông báo kết quả"
    - "Phase 5/8/9 (Cảnh báo) — getEmailTemplate('SLA_WARNING') + getSmsTemplate('SLA_WARNING')"
tech-stack:
  added:
    - "Prisma model SystemConfig (key/valueJson/category/label/updatedById)"
  patterns:
    - "Key-value JSON config store với category index (SLA|EMAIL|SMS)"
    - "30s TTL in-memory cache với fallback to constants on DB error"
    - "Whitelist key enums (T-02-07-02) chống mass-assignment qua dynamic key write"
    - "iframe sandbox='' XSS isolation cho admin-edited HTML (T-02-07-04)"
    - "split().join() string substitution thay regex (T-02-07-08)"
    - "Honorific Select 5 values với Vietnamese formal labels"
    - "Substitute {{honorific}} với label tại preview render time"
key-files:
  created:
    - "prisma/seed/system-config.ts"
    - "lib/system-config.ts"
    - "app/(app)/cau-hinh/_actions/schemas.ts"
    - "app/(app)/cau-hinh/_actions/sla.ts"
    - "app/(app)/cau-hinh/_actions/template.ts"
    - "app/(app)/cau-hinh/_components/SLAConfigForm.tsx"
    - "app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx"
    - "app/(app)/cau-hinh/_components/SmsTemplateEditor.tsx"
    - "app/(app)/cau-hinh/page.tsx"
  modified:
    - "prisma/schema.prisma (append SystemConfig model — 23 models total)"
    - "prisma/seed.ts (call seedSystemConfig + assertion 9 rows)"
    - "app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx (Rule 3 unescaped quote fix)"
    - "app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx (Rule 3 unescaped quote fix)"
decisions:
  - "Key-value pattern thay vì 1 row/template (10 future template additions không cần migration)"
  - "Cache 30s TTL với fallback to SLA_THRESHOLDS constants (graceful degradation T-02-07-06 accept)"
  - "Honorific là enum 5 values whitelist trong Zod (T-02-07-05) — UI Select bind exact same values"
  - "Email body = Tiptap HTML; SMS body = plain text textarea (gateway convention)"
  - "Preview substitution dùng split().join() (consistent với Plan 02-06 DocumentTemplate)"
  - "Email preview iframe sandbox='' (consistent với Plan 02-06) — defense-in-depth XSS"
  - "SLA params cùng 1 row 'sla.params' với JSON value (4 fields atomic update)"
  - "Variable list hardcoded 13 (email) / 5 (SMS) — future extensibility qua UI defer Phase 11"
metrics:
  duration: "10m"
  completed: "2026-04-30"
  tasks: 3
  files-created: 9
  files-modified: 4
  commits: 3
---

# Phase 2 Plan 07: System Config Summary

Admin cấu hình tham số SLA (60/30/15/05-30) và 5 email + 3 SMS templates với honorific Việt qua trang /cau-hinh 3 tabs; lib/system-config.ts cung cấp cached helpers (30s TTL) sẵn sàng cho Phase 3+ consume.

## What Was Built

### Task 1: SystemConfig schema + seed defaults + lib helpers

**Schema** — Append `SystemConfig` model vào prisma/schema.prisma:
```prisma
model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique  // "sla.params" | "email.template.{KEY}" | "sms.template.{KEY}"
  valueJson   String              // JSON string
  category    String              // SLA | EMAIL | SMS
  label       String              // Vietnamese label
  updatedById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([category])
}
```
Total models: 22 → 23.

**Seed** — `prisma/seed/system-config.ts` upsert 9 rows idempotent:
- 1× `sla.params` ← `JSON.stringify(SLA_THRESHOLDS)`
- 5× `email.template.{KEY}` cho INVITE_REGISTRATION, APPROVAL_RESULT, SUPPLEMENT_REQUIRED, SLA_WARNING, CONTRACT_REMINDER — mỗi template có `{subject, honorific, bodyHtml}` với Vietnamese formal text
- 3× `sms.template.{KEY}` cho INVITE_REGISTRATION, SLA_WARNING, APPROVAL_RESULT — body plain text không dấu (gateway convention)

**Helper** — `lib/system-config.ts` exports:
- `getSystemConfig()` aggregate snapshot
- `getSLAThresholds()` returns SLAParams (cache hit fast path)
- `getEmailTemplate(key)` / `getSmsTemplate(key)`
- `invalidateConfigCache()` gọi sau mutations
- `HONORIFIC_OPTIONS` (5 values) + `HONORIFIC_LABELS` (Vietnamese map)
- `EMAIL_TEMPLATE_KEYS` (5) + `EMAIL_TEMPLATE_LABELS`
- `SMS_TEMPLATE_KEYS` (3) + `SMS_TEMPLATE_LABELS`

Cache: 30s TTL, in-memory per-process. T-02-07-06 accept POC scope; production cần Redis pub/sub.

### Task 2: Server actions (3 mutations)

**`schemas.ts`** — Zod schemas:
- `slaParamsSchema`: bounds 1-365 days CONTRACT, 1-180 REPORT/CONSULATE, regex `^\d{2}-\d{2}$` MM-DD
- `emailTemplateSchema`: subject 1-200 chars, honorific enum 5 values, bodyHtml ≥10 chars
- `smsTemplateSchema`: body 1-160 chars
- `emailKeySchema` / `smsKeySchema`: enum whitelist (T-02-07-02 mass-assignment guard)

**`sla.ts`** `updateSLAConfig(input)`:
1. `auth()` + `can(role, 'cau-hinh', 'update')` → throw nếu không phải ADMIN
2. `slaParamsSchema.parse(input)`
3. `prisma.systemConfig.upsert({where:{key:'sla.params'}, ...})`
4. `invalidateConfigCache()` + `revalidatePath('/cau-hinh')`
5. Wrapped in `withAuditLog` — capture before/after JSON values

**`template.ts`** — 2 functions với cùng pattern:
- `updateEmailTemplate(rawKey, input)` — `emailKeySchema.parse(rawKey)` whitelist 5 keys → upsert `email.template.{key}` → invalidate cache → audit
- `updateSmsTemplate(rawKey, input)` — `smsKeySchema.parse(rawKey)` whitelist 3 keys → upsert `sms.template.{key}` → invalidate cache → audit

### Task 3: Page với 3 tabs + form components

**`page.tsx`** — Server Component:
- `auth()` + `can(role, 'cau-hinh', 'read')` redirect (defense-in-depth)
- 1 query `prisma.systemConfig.findMany({where:{category:{in:['SLA','EMAIL','SMS']}}})`
- Group rows by category, parse valueJson, fallback to SLA_THRESHOLDS / empty defaults
- shadcn Tabs với 3 trigger: "Tham số SLA" / "Mẫu Email" / "Mẫu SMS"

**`SLAConfigForm.tsx`** — 4 fields RHF+zodResolver(slaParamsSchema):
- Cảnh báo chậm ký hợp đồng (ngày) — number 1-365, helper "Mặc định 60 ngày"
- Cảnh báo liên hệ thương vụ (ngày) — number 1-180, helper "Mặc định 30 ngày"
- Hạn nộp báo cáo sau hoạt động (ngày) — number 1-180, helper "Mặc định 15 ngày"
- Hạn nộp đề án (MM-DD) — text font-mono, helper "Mặc định 05-30"
- Footer: "Lưu" (disabled khi !isDirty) + "Khôi phục mặc định" (useConfirmDialog → form.reset SLA_THRESHOLDS)

**`EmailTemplateEditor.tsx`** — Outer Tabs với 5 sub-tabs (1 per template key). Mỗi sub-tab `<SingleEmailTemplateForm>`:
- Subject Input
- Honorific Select 5 options (KINH_GUI_QUY_DON_VI, KINH_GUI_QUY_ONG, KINH_GUI_QUY_BA, KINH_CHAO_ANH_CHI, TRAN_TRONG_KINH_GUI) với Vietnamese labels
- Body với inner Tabs "Soạn thảo" / "Xem trước"
  - Soạn thảo: `<RichTextEditor>` với `variables={EMAIL_VARIABLES}` (13 keys: honorific, tenChuongTrinh, namKy, ngayMo, hanNopDeAn, tenDonVi, tenDeAn, soQuyetDinh, ngayKy, nguoiKy, soHopDong, loaiCanhBao, ngayCanhBao)
  - Xem trước: iframe `sandbox=""` srcDoc (T-02-07-04) — substitute `{{honorific}}` với label trước, sau đó các biến khác với mock values
- Submit: `await updateEmailTemplate(key, values)` → toast + form.reset(values)

**`SmsTemplateEditor.tsx`** — Outer Tabs 3 sub-tabs. Mỗi sub-tab:
- Textarea (rows=4) với realtime char count `{n}/160` aria-live polite (red khi > 160)
- Popover "Chèn biến" với Command picker 5 SMS_VARIABLES — click insert `{{key}}` tại cursor position via `selectionStart/selectionEnd` splice
- Live preview block với mock substitution `split().join()` (T-02-07-08)
- Submit: `await updateSmsTemplate(key, values)` → toast

## Key Decisions

1. **Key-value JSON store thay 5 separate tables** — lý do: 10+ template additions tương lai không cần migration. Cost: per-template lookup qua key (acceptable cho ~10 reads/page).

2. **30s TTL cache với fallback constants** — `getSLAThresholds()` luôn trả về value (DB hỏng → constants). T-02-07-06 accepted single-process POC; production thay Redis pub/sub.

3. **Honorific Select enum thay free-text** — Zod whitelist 5 values (T-02-07-05). Substitution thực hiện tại preview/render time, body chỉ chứa `{{honorific}}` placeholder.

4. **iframe sandbox="" cho email preview** — consistent với Plan 02-06 DocumentTemplate. Defense-in-depth: Tiptap StarterKit không expose script nodes nhưng admin có thể paste HTML.

5. **SMS plain text + char count realtime** — không dùng RichTextEditor (over-engineering). 160 char limit là Zod hard constraint + UI feedback (red khi over).

6. **Variable insertion textarea splice** — `selectionStart`/`selectionEnd` cursor position; setTimeout restore cursor sau React re-render. Plain `String.prototype.split().join()` cho substitution (consistent với Plan 02-06).

## Threats Mitigated

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-02-07-01 (E: Auth bypass) | Mitigated | All 3 actions: `auth()` + `can(role, 'cau-hinh', 'update')` |
| T-02-07-02 (T: Mass assignment via key) | Mitigated | `emailKeySchema`/`smsKeySchema` Zod enum whitelist; reject với "Khóa mẫu email/SMS không hợp lệ" |
| T-02-07-03 (T: Invalid SLA cascade) | Mitigated | Zod min/max bounds (1-365 / 1-180); regex `^\d{2}-\d{2}$`; UI Input type=number; getSLAThresholds() defensive fallback |
| T-02-07-04 (I: XSS via bodyHtml) | Mitigated | iframe `sandbox=""` cho preview; production Phase 3 sanitize qua DOMPurify trước khi dispatch |
| T-02-07-05 (I: Honorific enum injection) | Mitigated | `HONORIFIC_OPTIONS` whitelist trong Zod enum |
| T-02-07-06 (T: Cache stale across instances) | Accepted | In-memory cache per-process, dev single instance OK; production cần Redis pub/sub |
| T-02-07-07 (I: SMS body leak via audit) | Accepted | SMS template = không phải PII; audit diff acceptable |
| T-02-07-08 (E: Variable injection trong SMS) | Mitigated | `String.split().join()` thay regex (consistent Plan 02-06) |
| T-02-07-09 (T: FK on updatedById invalid) | Mitigated | Set từ `session.user.id`; FK soft (Plan-02-07 schema chấp nhận POC scope) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 API mismatch trong schemas.ts**
- **Found during:** Task 2 typecheck
- **Issue:** `invalid_type_error` và `errorMap: () => ({...})` không tồn tại trong Zod 4.4.1 — thư viện đổi API thành `{ message: '...' }`
- **Fix:** Đổi 4 occurrences: 3× `invalid_type_error: '...'` → `message: '...'`; 3× `errorMap: () => ({ message: '...' })` → `message: '...'`
- **Files modified:** app/(app)/cau-hinh/_actions/schemas.ts
- **Commit:** 2c020b9

**2. [Rule 3 - Blocker] Pre-existing unescaped quotes block npm run build**
- **Found during:** Task 3 build verification
- **Issue:** ESLint `react/no-unescaped-entities` errors trong Plan 02-06 files (CatalogEditSheet.tsx line 368, DocumentTemplateForm.tsx line 272) — chứa `"30 ngày trước sự kiện quốc tế"` và `"Chèn biến"` literal quotes. Build thất bại với 4 errors.
- **Fix:** Đổi `"text"` → `&quot;text&quot;` cho 2 dòng. Pre-existing issue NOT trong scope plan này nhưng block verification step `npm run build`.
- **Files modified:** app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx, app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx
- **Commit:** 050aef0

### Scope-bounded items deferred

None — all 3 tasks completed exactly as spec'd.

## Verification

- `npx prisma format && npx prisma db push --accept-data-loss=false` — Pass
- `npm run db:seed` — Pass; log "✓ Seeded SystemConfig: 9" (1 SLA + 5 email + 3 SMS)
- `npm run db:seed` (idempotent) — Pass; count vẫn 9
- `npx tsx -e "import {getSLAThresholds}..." → returns {CONTRACT_DAYS:60, REPORT_DAYS:15, CONSULATE_DAYS:30, REGISTRATION_DEADLINE_MMDD:'05-30'}` — Pass
- `npx tsc --noEmit` — Pass (0 errors)
- `npm run lint` — Pass cho cau-hinh files (0 new errors); pre-existing warnings ngoài scope
- `npm run build` — Pass; `/cau-hinh` route 31.8 kB / 342 kB First Load JS
- Schema model count: `grep "^model " prisma/schema.prisma | wc -l` = 23 (was 22 + SystemConfig)
- `lib/system-config.ts` exports 5 required names + helper labels: `getSystemConfig`, `getSLAThresholds`, `getEmailTemplate`, `getSmsTemplate`, `invalidateConfigCache` plus enums

## Success Criteria

- ✓ **CONFIG-01**: Admin cấu hình tham số SLA 4 fields với validation (1-365 / 1-180 / regex MM-DD), Lưu/Khôi phục mặc định, audit log resource='cau-hinh'
- ✓ **CONFIG-02**: Admin cấu hình 5 email templates (subject + honorific Select + bodyHtml Tiptap + iframe preview) + 3 SMS templates (body 160 chars + char count + variable insert) — tất cả với honorific Việt formal
- ✓ **lib/system-config.ts ready**: `getSLAThresholds()`, `getEmailTemplate(key)`, `getSmsTemplate(key)`, `invalidateConfigCache()` cached 30s sẵn cho Phase 3+ consume
- ✓ **Reachability**: route `/cau-hinh` reachable qua sidebar (đã có resource:'cau-hinh' trong ALL_MENU_ITEMS Plan 01-04 — chỉ admin thấy)

## Files

**Created (9):**
- prisma/seed/system-config.ts (140 LOC)
- lib/system-config.ts (200 LOC)
- app/(app)/cau-hinh/_actions/schemas.ts (60 LOC)
- app/(app)/cau-hinh/_actions/sla.ts (90 LOC)
- app/(app)/cau-hinh/_actions/template.ts (180 LOC)
- app/(app)/cau-hinh/_components/SLAConfigForm.tsx (220 LOC)
- app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx (300 LOC)
- app/(app)/cau-hinh/_components/SmsTemplateEditor.tsx (270 LOC)
- app/(app)/cau-hinh/page.tsx (110 LOC)

**Modified (4):**
- prisma/schema.prisma — append SystemConfig model
- prisma/seed.ts — import + call seedSystemConfig + assertion
- app/(app)/danh-muc/[slug]/_components/CatalogEditSheet.tsx — Rule 3 fix
- app/(app)/danh-muc/[slug]/_components/DocumentTemplateForm.tsx — Rule 3 fix

**Total LOC added: ~1,570**

## Commits

- `4d81d9a` feat(02-07): SystemConfig schema + seed defaults + cached helpers
- `2c020b9` feat(02-07): server actions cập nhật SLA params + email/SMS templates
- `050aef0` feat(02-07): trang /cau-hinh 3 tabs SLA + Email + SMS

## Phase 2 Closure

Plan 02-07 là plan cuối cùng trong Phase 2 (M1 Quản trị & Danh mục). Phase 2 hoàn thành 7/7 plans với toàn bộ 27 requirements (USER-01..07, ROLE-01..07, CAT-01..08, CONFIG-01..02, LOG-01..03) đều mapped và covered. Foundation quản trị + master data sẵn sàng cho Phase 3 (M2.1 Chu kỳ Chương trình XTTM HERO).

## Self-Check: PASSED

All 9 created files exist on disk. All 3 commits (4d81d9a, 2c020b9, 050aef0) present in git log.
