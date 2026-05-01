---
phase: 02-m1-quan-tri-danh-muc
plan: 07
type: execute
wave: 3
depends_on: [01, 03, 05]
files_modified:
  - prisma/schema.prisma
  - prisma/seed/system-config.ts
  - prisma/seed.ts
  - lib/system-config.ts
  - app/(app)/cau-hinh/page.tsx
  - app/(app)/cau-hinh/_components/SLAConfigForm.tsx
  - app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx
  - app/(app)/cau-hinh/_components/SmsTemplateEditor.tsx
  - app/(app)/cau-hinh/_actions/sla.ts
  - app/(app)/cau-hinh/_actions/template.ts
  - app/(app)/cau-hinh/_actions/schemas.ts
autonomous: true
requirements: [CONFIG-01, CONFIG-02]
tags: [system-config, sla-params, email-template, sms-template, honorific]

must_haves:
  truths:
    - "Admin (`admin/Admin@123`) thấy menu 'Cấu hình' và truy cập /cau-hinh được"
    - "Trang /cau-hinh hiển thị 3 sections (Tabs): 'Tham số SLA', 'Mẫu email', 'Mẫu SMS'"
    - "Section SLA: form 4 fields number — 'Cảnh báo chậm ký HĐ (ngày)' default 60, 'Cảnh báo liên hệ thương vụ (ngày)' default 30, 'Hạn nộp báo cáo sau hoạt động (ngày)' default 15, 'Hạn nộp đề án (MM-DD)' default 05-30. Validation: số dương; submit save vào DB SystemConfig table"
    - "Section Email: 5 tabs cho 5 email type (mời đăng ký, kết quả phê duyệt, yêu cầu bổ sung, cảnh báo SLA, nhắc ký HĐ). Mỗi tab có: Subject (Input), Honorific (Select 'Kính gửi Quý đơn vị' / 'Kính chào Quý ông' / 'Kính chào Quý bà' / 'Trân trọng kính chào Anh/Chị'), Body (RichTextEditor với VariableMenu)"
    - "Section SMS: 3 tabs (mời đăng ký, cảnh báo SLA, kết quả phê duyệt). Mỗi tab có: textarea max 160 chars + character count + variable insertion với plain-text {{var}}"
    - "Save button: optimistic UI + audit log + revalidate; mọi thay đổi trong audit log /nhat-ky resource='cau-hinh'"
    - "lib/system-config.ts getSystemConfig() trả {sla: {...}, emailTemplates: {...}, smsTemplates: {...}} với cache 30s; consumers ở Phase 3+ import getSLAThresholds() để computed alert dates"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "SystemConfig model (key-value JSON store)"
      contains: "model SystemConfig"
    - path: "prisma/seed/system-config.ts"
      provides: "seedSystemConfig() inserts default values từ lib/constants.ts SLA_THRESHOLDS"
      exports: ["seedSystemConfig"]
    - path: "lib/system-config.ts"
      provides: "getSystemConfig(), getSLAThresholds(), getEmailTemplate(key), getSmsTemplate(key) — cached helpers"
      exports: ["getSystemConfig", "getSLAThresholds", "getEmailTemplate", "getSmsTemplate", "invalidateConfigCache"]
    - path: "app/(app)/cau-hinh/_actions/sla.ts"
      exports: ["updateSLAConfig"]
    - path: "app/(app)/cau-hinh/_actions/template.ts"
      exports: ["updateEmailTemplate", "updateSmsTemplate"]
  key_links:
    - from: "app/(app)/cau-hinh/_actions/*.ts"
      to: "lib/audit.ts withAuditLog"
      via: "wrap mọi update"
      pattern: "withAuditLog"
    - from: "app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx"
      to: "components/shared/RichTextEditor.tsx"
      via: "Tiptap với variables prop"
      pattern: "RichTextEditor"
    - from: "lib/system-config.ts getSLAThresholds"
      to: "prisma.systemConfig.findUnique"
      via: "DB read with cache"
      pattern: "systemConfig\\.findUnique"
---

<objective>
Build system configuration UI cho 2 nhóm: tham số SLA (CONFIG-01) và mẫu email/SMS với honorific Việt (CONFIG-02). Backend lưu vào bảng SystemConfig (key-value JSON pattern) — 1 hàng cho `sla.params`, 1 hàng cho `email.template.{key}`, 1 hàng cho `sms.template.{key}`. Lib helper `getSystemConfig()` cho Phase 3+ consume khi compute alert dates và compose email/SMS notifications.

Purpose: CONFIG-01 cần thiết để Phase 8 (Hợp đồng) compute cảnh báo chậm ký HĐ 60 ngày, Phase 9 cảnh báo hạn báo cáo 15 ngày, Phase 10 dashboard SLA countdown widgets — tất cả dùng tham số config được. CONFIG-02 cần thiết để Phase 3 mời đăng ký, Phase 7 thông báo phê duyệt, Phase 5/8/9 cảnh báo SLA — tất cả dùng template configurable với honorific Việt formal.

Output: 1 schema model thêm, 1 seed file, 1 lib helper, 1 page với 3 tabs (SLA + email + SMS), 4 form components, 3 server actions.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@CLAUDE.md
@prisma/schema.prisma
@lib/constants.ts
@lib/permissions.ts
@lib/audit.ts
@lib/prisma.ts
@components/shared/RichTextEditor.tsx
@components/shared/ConfirmDialog.tsx
@components/ui/tabs.tsx
@components/ui/select.tsx

<interfaces>
From lib/constants.ts:
```typescript
export const SLA_THRESHOLDS = {
  CONTRACT_DAYS: 60,
  REPORT_DAYS: 15,
  CONSULATE_DAYS: 30,
  REGISTRATION_DEADLINE_MMDD: '05-30',
} as const;
```

From lib/audit.ts (Plan 02-01): withAuditLog
From lib/permissions.ts: can(role, 'cau-hinh', action) — chỉ ADMIN
From components/shared/RichTextEditor.tsx (Plan 02-03): RichTextEditor with variables prop
</interfaces>

<vietnamese_data_specs>
### Email template defaults (5 templates, seed):
| key | label | subject default | honorific default |
|-----|-------|----------------|-------------------|
| INVITE_REGISTRATION | Mời đăng ký đề án | "Mời tham gia Chương trình XTTM Quốc gia năm {{namKy}}" | KINH_GUI_QUY_DON_VI |
| APPROVAL_RESULT | Kết quả phê duyệt | "Thông báo kết quả phê duyệt đề án {{tenDeAn}}" | KINH_GUI_QUY_DON_VI |
| SUPPLEMENT_REQUIRED | Yêu cầu bổ sung hồ sơ | "Yêu cầu bổ sung hồ sơ đề án {{tenDeAn}}" | KINH_GUI_QUY_DON_VI |
| SLA_WARNING | Cảnh báo SLA | "Cảnh báo: {{loaiCanhBao}} đối với đề án {{tenDeAn}}" | KINH_GUI_QUY_DON_VI |
| CONTRACT_REMINDER | Nhắc ký hợp đồng | "Nhắc ký hợp đồng thực hiện đề án {{tenDeAn}}" | KINH_GUI_QUY_DON_VI |

Honorific Select options (5 values):
- KINH_GUI_QUY_DON_VI: "Kính gửi Quý đơn vị"
- KINH_GUI_QUY_ONG: "Kính gửi Quý ông"
- KINH_GUI_QUY_BA: "Kính gửi Quý bà"
- KINH_CHAO_ANH_CHI: "Kính chào Anh/Chị"
- TRAN_TRONG_KINH_GUI: "Trân trọng kính gửi"

Body default (Tiptap HTML, gần đầy đủ cho INVITE_REGISTRATION):
```html
<p>{{honorific}},</p>
<p>Cục Xúc tiến Thương mại — Bộ Công Thương trân trọng thông báo:</p>
<p>Chương trình Xúc tiến Thương mại Quốc gia năm {{namKy}} chính thức mở cổng nhận đăng ký đề án từ ngày {{ngayMo}} đến hết ngày {{hanNopDeAn}}.</p>
<p>Kính đề nghị Quý đơn vị nghiên cứu và lập đề án đăng ký theo các tiêu chí và biểu mẫu đã được công bố tại Cổng thông tin Cục XTTM.</p>
<p>Trân trọng,<br>Cục Xúc tiến Thương mại</p>
```

Variables list available cho mọi email template (config-driven trong VariableMenu):
- honorific, tenChuongTrinh, namKy, ngayMo, hanNopDeAn, tenDonVi, tenDeAn, soQuyetDinh, ngayKy, nguoiKy, soHopDong, loaiCanhBao, ngayCanhBao

### SMS template defaults (3 templates, seed):
| key | label | body default (≤160 chars) |
|-----|-------|---------------------------|
| INVITE_REGISTRATION | Mời đăng ký | "Cuc XTTM moi Quy don vi dang ky de an XTTMQG nam {{namKy}}. Han nop: {{hanNopDeAn}}. Chi tiet tai cong thong tin Cuc XTTM." |
| SLA_WARNING | Cảnh báo SLA | "Canh bao: De an {{tenDeAn}} dang chua hoan thanh nghia vu {{loaiCanhBao}}. Vui long lien he Cuc XTTM som." |
| APPROVAL_RESULT | Kết quả phê duyệt | "De an {{tenDeAn}} cua Quy don vi da duoc phe duyet. Vui long kiem tra email de xem chi tiet quyet dinh phe duyet." |

Note: SMS không dấu (theo convention SMS Việt — branded SMS thường strip diacritics để gateway không corrupt). Admin có thể chỉnh có dấu hay không tùy.
</vietnamese_data_specs>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: SystemConfig schema model + seed defaults + lib/system-config.ts helpers</name>
  <files>prisma/schema.prisma, prisma/seed/system-config.ts, prisma/seed.ts, lib/system-config.ts</files>
  <read_first>
    - prisma/schema.prisma (xem 22 models đã có sau Plan 02-02; append 1 model nữa)
    - lib/constants.ts SLA_THRESHOLDS (default values reference)
    - lib/prisma.ts (PrismaClient singleton)
    - prisma/seed/permissions.ts (Plan 02-05 idempotent upsert pattern)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (CONFIG-01..02 decisions)
  </read_first>
  <action>
    **Append model SystemConfig vào prisma/schema.prisma:**
    ```prisma
    model SystemConfig {
      id        String   @id @default(cuid())
      key       String   @unique // "sla.params" | "email.template.INVITE_REGISTRATION" | "sms.template.INVITE_REGISTRATION" | ...
      valueJson String   // JSON string
      category  String   // "SLA" | "EMAIL" | "SMS"
      label     String   // human label
      updatedById String?
      updatedAt DateTime @updatedAt
      createdAt DateTime @default(now())
      
      @@index([category])
    }
    ```
    Run: `npx prisma format && npx prisma db push --accept-data-loss=false && npx prisma generate`

    **`prisma/seed/system-config.ts`**:
    ```typescript
    import { prisma } from '../../lib/prisma';
    import { SLA_THRESHOLDS } from '../../lib/constants';
    import { logSeedStep } from './helpers';

    const EMAIL_DEFAULTS = {
      INVITE_REGISTRATION: { subject:'Mời tham gia Chương trình XTTM Quốc gia năm {{namKy}}', honorific:'KINH_GUI_QUY_DON_VI', bodyHtml: '<p>...</p>' /* full from spec */ },
      APPROVAL_RESULT: { ... },
      SUPPLEMENT_REQUIRED: { ... },
      SLA_WARNING: { ... },
      CONTRACT_REMINDER: { ... },
    };
    const SMS_DEFAULTS = {
      INVITE_REGISTRATION: 'Cuc XTTM moi Quy don vi dang ky de an XTTMQG nam {{namKy}}. Han nop: {{hanNopDeAn}}.',
      SLA_WARNING: '...', APPROVAL_RESULT: '...',
    };
    const EMAIL_LABELS: Record<string, string> = {
      INVITE_REGISTRATION: 'Mời đăng ký đề án',
      APPROVAL_RESULT: 'Kết quả phê duyệt',
      SUPPLEMENT_REQUIRED: 'Yêu cầu bổ sung hồ sơ',
      SLA_WARNING: 'Cảnh báo SLA',
      CONTRACT_REMINDER: 'Nhắc ký hợp đồng',
    };
    const SMS_LABELS = {/* same keys 3 entries */};

    export async function seedSystemConfig() {
      // SLA params (1 row)
      await prisma.systemConfig.upsert({
        where: { key: 'sla.params' },
        update: { valueJson: JSON.stringify(SLA_THRESHOLDS) },
        create: { key:'sla.params', valueJson: JSON.stringify(SLA_THRESHOLDS), category:'SLA', label:'Tham số cảnh báo SLA' },
      });
      // Email templates (5 rows)
      for (const [k, v] of Object.entries(EMAIL_DEFAULTS)) {
        await prisma.systemConfig.upsert({
          where: { key: `email.template.${k}` },
          update: { valueJson: JSON.stringify(v) },
          create: { key:`email.template.${k}`, valueJson: JSON.stringify(v), category:'EMAIL', label: EMAIL_LABELS[k] },
        });
      }
      // SMS templates (3 rows)
      for (const [k, body] of Object.entries(SMS_DEFAULTS)) {
        await prisma.systemConfig.upsert({
          where: { key: `sms.template.${k}` },
          update: { valueJson: JSON.stringify({body}) },
          create: { key:`sms.template.${k}`, valueJson: JSON.stringify({body}), category:'SMS', label: SMS_LABELS[k] },
        });
      }
      logSeedStep('SystemConfig', await prisma.systemConfig.count());
    }
    ```

    **Update `prisma/seed.ts`** to call seedSystemConfig() last:
    ```typescript
    await seedSystemConfig();
    ```

    **`lib/system-config.ts`**:
    ```typescript
    import { prisma } from './prisma';
    import { SLA_THRESHOLDS } from './constants';

    export type SLAParams = {
      CONTRACT_DAYS: number;
      REPORT_DAYS: number;
      CONSULATE_DAYS: number;
      REGISTRATION_DEADLINE_MMDD: string;
    };
    export type EmailTemplate = {
      subject: string;
      honorific: string;
      bodyHtml: string;
    };
    export type SmsTemplate = {
      body: string;
    };

    type Cache = {
      sla?: SLAParams;
      email?: Record<string, EmailTemplate>;
      sms?: Record<string, SmsTemplate>;
      loadedAt?: number;
    };
    const cache: Cache = {};
    const TTL_MS = 30_000;

    export async function getSLAThresholds(): Promise<SLAParams> {
      const now = Date.now();
      if (cache.sla && cache.loadedAt && now - cache.loadedAt < TTL_MS) return cache.sla;
      try {
        const cfg = await prisma.systemConfig.findUnique({where:{key:'sla.params'}});
        const params = cfg ? JSON.parse(cfg.valueJson) : SLA_THRESHOLDS;
        cache.sla = params;
        cache.loadedAt = now;
        return params;
      } catch (e) {
        console.error('[system-config] fallback to constants', e);
        return SLA_THRESHOLDS;
      }
    }

    export async function getEmailTemplate(key: string): Promise<EmailTemplate | null> {
      // similar with cache.email map
    }
    export async function getSmsTemplate(key: string): Promise<SmsTemplate | null> {...}
    export async function getSystemConfig() {/* aggregate all */}
    export function invalidateConfigCache(): void { cache.sla = undefined; cache.email = undefined; cache.sms = undefined; cache.loadedAt = undefined; }
    ```
  </action>
  <acceptance_criteria>
    - `grep "^model SystemConfig" prisma/schema.prisma` returns 1
    - `grep -c "^model " prisma/schema.prisma` returns 23 (was 22 after Plan 02-02; +1 SystemConfig)
    - `npx prisma format` exit 0
    - `npx prisma db push --accept-data-loss=false` exit 0
    - `prisma/seed/system-config.ts` exports `seedSystemConfig`
    - `prisma/seed.ts` import + call seedSystemConfig
    - `npm run db:seed` exit 0; log shows "SystemConfig 9" (1 SLA + 5 email + 3 SMS)
    - Idempotent: chạy lần 2 count vẫn 9
    - `lib/system-config.ts` exports đúng 5 names: `getSystemConfig`, `getSLAThresholds`, `getEmailTemplate`, `getSmsTemplate`, `invalidateConfigCache`
    - `npx tsc --noEmit` exit 0
    - Smoke: `tsx -e "import {getSLAThresholds} from './lib/system-config'; getSLAThresholds().then(console.log)"` returns `{CONTRACT_DAYS:60, REPORT_DAYS:15, CONSULATE_DAYS:30, REGISTRATION_DEADLINE_MMDD:'05-30'}`
  </acceptance_criteria>
  <verify>
    <automated>npx prisma format && npx prisma db push --accept-data-loss=false && npm run db:seed && npx tsc --noEmit</automated>
  </verify>
  <done>SystemConfig model added, 9 default rows seeded idempotent, lib/system-config.ts cached helpers (30s TTL) với fallback constants.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Server actions update SLA + email/sms templates với schemas</name>
  <files>app/(app)/cau-hinh/_actions/schemas.ts, app/(app)/cau-hinh/_actions/sla.ts, app/(app)/cau-hinh/_actions/template.ts</files>
  <read_first>
    - lib/audit.ts withAuditLog
    - lib/permissions.ts can()
    - lib/system-config.ts (Task 1) invalidateConfigCache
    - prisma/seed/system-config.ts (defaults reference)
  </read_first>
  <action>
    **`schemas.ts`** (pure Zod):
    ```typescript
    export const slaParamsSchema = z.object({
      CONTRACT_DAYS: z.coerce.number().int().min(1, 'Tối thiểu 1 ngày').max(365),
      REPORT_DAYS: z.coerce.number().int().min(1).max(180),
      CONSULATE_DAYS: z.coerce.number().int().min(1).max(180),
      REGISTRATION_DEADLINE_MMDD: z.string().regex(/^\d{2}-\d{2}$/, 'Định dạng MM-DD (vd 05-30)'),
    });

    export const emailTemplateSchema = z.object({
      subject: z.string().min(1, 'Vui lòng nhập tiêu đề').max(200),
      honorific: z.enum(['KINH_GUI_QUY_DON_VI','KINH_GUI_QUY_ONG','KINH_GUI_QUY_BA','KINH_CHAO_ANH_CHI','TRAN_TRONG_KINH_GUI']),
      bodyHtml: z.string().min(10, 'Nội dung quá ngắn'),
    });

    export const smsTemplateSchema = z.object({
      body: z.string().min(1).max(160, 'SMS tối đa 160 ký tự'),
    });
    ```

    **`sla.ts`** — `'use server'`:
    ```typescript
    async function updateSLAImpl(input: SLAInput) {
      const session = await auth();
      if (!session) throw new Error('Yêu cầu đăng nhập');
      if (!can(session.user.role, 'cau-hinh', 'update')) throw new Error('Bạn không có quyền');
      const parsed = slaParamsSchema.parse(input);
      const before = await prisma.systemConfig.findUnique({where:{key:'sla.params'}});
      const beforeValue = before ? JSON.parse(before.valueJson) : null;
      const updated = await prisma.systemConfig.upsert({
        where: {key:'sla.params'},
        update: {valueJson: JSON.stringify(parsed), updatedById: session.user.id},
        create: {key:'sla.params', valueJson: JSON.stringify(parsed), category:'SLA', label:'Tham số cảnh báo SLA', updatedById: session.user.id},
      });
      invalidateConfigCache();
      revalidatePath('/cau-hinh');
      return { before: beforeValue, after: parsed };
    }
    export const updateSLAConfig = withAuditLog(
      { action:'UPDATE', resource:'cau-hinh', resourceIdFromResult: () => 'sla.params',
        captureAfter: r => ({key:'sla.params', diff: r}) },
      updateSLAImpl
    );
    ```

    **`template.ts`** — `'use server'`:
    Two functions:
    - `updateEmailTemplate(key, input)`: validate emailTemplateSchema, upsert key=`email.template.${key}`. Log audit.
    - `updateSmsTemplate(key, input)`: validate smsTemplateSchema, upsert key=`sms.template.${key}`. Log audit.
    Both check RBAC `can(role, 'cau-hinh', 'update')` + invalidateConfigCache + revalidatePath.
    Whitelist `key`: must match one of email keys (5) hoặc sms keys (3); throw nếu khác (T-02-07-04 mass assignment guard).
  </action>
  <acceptance_criteria>
    - 3 files tạo (schemas + 2 server actions)
    - `grep "^'use server'" app/(app)/cau-hinh/_actions/sla.ts app/(app)/cau-hinh/_actions/template.ts` returns ≥2
    - `grep "withAuditLog" app/(app)/cau-hinh/_actions/*.ts | wc -l` ≥ 3 (sla + email + sms wraps)
    - `grep "can(.*'cau-hinh'.*'update')" app/(app)/cau-hinh/_actions/*.ts | wc -l` ≥ 3
    - `grep "invalidateConfigCache" app/(app)/cau-hinh/_actions/*.ts | wc -l` ≥ 3
    - `grep "INVITE_REGISTRATION\\|APPROVAL_RESULT\\|key whitelist" app/(app)/cau-hinh/_actions/template.ts` returns ≥1 (whitelist guard)
    - `npx tsc --noEmit` exit 0
    - Smoke: `tsx -e` test updateSLAConfig({CONTRACT_DAYS:90, REPORT_DAYS:15, CONSULATE_DAYS:30, REGISTRATION_DEADLINE_MMDD:'05-30'}) → success → `getSLAThresholds()` returns CONTRACT_DAYS:90 (cache invalidated). Sau test: revert về 60.
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit && grep -c "withAuditLog" "app/(app)/cau-hinh/_actions/sla.ts" "app/(app)/cau-hinh/_actions/template.ts"</automated>
  </verify>
  <done>3 server actions (SLA + email + sms templates), Zod validation + RBAC + audit + cache invalidation, key whitelist cho template actions.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Page với 3 tabs (SLA + Email + SMS) + form components</name>
  <files>app/(app)/cau-hinh/page.tsx, app/(app)/cau-hinh/_components/SLAConfigForm.tsx, app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx, app/(app)/cau-hinh/_components/SmsTemplateEditor.tsx</files>
  <read_first>
    - components/ui/tabs.tsx, select.tsx, input.tsx, textarea.tsx, form.tsx
    - components/shared/RichTextEditor.tsx (Plan 02-03)
    - components/shared/ConfirmDialog.tsx
    - lib/system-config.ts (Task 1)
    - app/(app)/cau-hinh/_actions/sla.ts, template.ts (Task 2)
    - .planning/phases/02-m1-quan-tri-danh-muc/02-CONTEXT.md (CONFIG decisions)
    - .planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
  </read_first>
  <action>
    **`page.tsx`** — Server Component:
    - auth + can('cau-hinh','read') redirect
    - Pre-fetch SystemConfig data: `getSLAThresholds()` + 5 email templates + 3 sms templates qua `prisma.systemConfig.findMany({where:{category:{in:['SLA','EMAIL','SMS']}}})` then group by category
    - Heading "Cấu hình hệ thống" + description "Tham số cảnh báo SLA và mẫu thông báo email/SMS"
    - shadcn Tabs với 3 trigger:
      - "Tham số SLA" → `<SLAConfigForm initialData={sla} />`
      - "Mẫu Email" → `<EmailTemplateEditor templates={emailTemplates} />`
      - "Mẫu SMS" → `<SmsTemplateEditor templates={smsTemplates} />`

    **`SLAConfigForm.tsx`** — `'use client'`:
    - useForm RHF + slaParamsSchema
    - Layout: Card với 4 form fields trong grid 2 cột:
      - "Cảnh báo chậm ký hợp đồng (ngày)" — Input number, helper "Mặc định 60 ngày — sau quyết định phê duyệt mà chưa ký HĐ"
      - "Cảnh báo liên hệ thương vụ (ngày)" — Input number, helper "Mặc định 30 ngày — trước sự kiện quốc tế"
      - "Hạn nộp báo cáo sau hoạt động (ngày)" — Input number, helper "Mặc định 15 ngày"
      - "Hạn nộp đề án (MM-DD)" — Input pattern `\d{2}-\d{2}`, helper "Mặc định 05-30 (hết tháng 5)"
    - Footer: button "Lưu" + button "Khôi phục mặc định" (ConfirmDialog → reset values to SLA_THRESHOLDS).
    - onSubmit: `await updateSLAConfig(values)` → toast.success "Đã cập nhật tham số SLA" + form.reset(values).

    **`EmailTemplateEditor.tsx`** — `'use client'`:
    - Inner shadcn Tabs với 5 sub-tabs (1 per email template key)
    - Mỗi sub-tab content:
      - useForm RHF cho template hiện tại
      - Field "Tiêu đề" — Input
      - Field "Lời chào" — Select 5 honorific options với labels
      - Field "Nội dung" — Tabs "Soạn thảo" / "Xem trước":
        - Soạn thảo: `<RichTextEditor variables={EMAIL_VARIABLES} ... />` với variable list (honorific, tenChuongTrinh, namKy, ngayMo, hanNopDeAn, tenDonVi, tenDeAn, soQuyetDinh, ngayKy, nguoiKy, soHopDong, loaiCanhBao, ngayCanhBao)
        - Xem trước: iframe sandbox render với mock substitution (T-02-06-04 mitigation reuse)
      - Footer: "Lưu" button + tự động save indicator
    - onSubmit: `await updateEmailTemplate(currentKey, values)` → toast

    **`SmsTemplateEditor.tsx`** — `'use client'`:
    - Inner Tabs với 3 sub-tabs (3 SMS templates)
    - Mỗi sub-tab:
      - Field "Nội dung tin nhắn" — Textarea với character count realtime "{n}/160 ký tự"
      - Helper "SMS bắt buộc ≤ 160 ký tự không dấu — gateway brand SMS Việt thường strip dấu khi gửi"
      - Variable insertion: dropdown menu "Chèn biến" → click insert `{{var}}` ở cursor position (manually splice into textarea)
      - Live preview với mock substitution
    - Footer: "Lưu"
  </action>
  <acceptance_criteria>
    - 4 files tạo
    - `app/(app)/cau-hinh/page.tsx` chứa 3 Tabs trigger labels: "Tham số SLA", "Mẫu Email", "Mẫu SMS" (`grep "Tham số SLA\\|Mẫu Email\\|Mẫu SMS" app/(app)/cau-hinh/page.tsx` returns ≥3)
    - `grep "Cảnh báo chậm ký\\|Hạn nộp đề án" app/(app)/cau-hinh/_components/SLAConfigForm.tsx` returns ≥2 (Vietnamese helpers)
    - `grep "RichTextEditor\\|EMAIL_VARIABLES" app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx` returns ≥2
    - `grep "Kính gửi Quý đơn vị\\|honorific" app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx` returns ≥1
    - `grep "160\\|character count" app/(app)/cau-hinh/_components/SmsTemplateEditor.tsx` returns ≥1
    - `grep "iframe\\|sandbox" app/(app)/cau-hinh/_components/EmailTemplateEditor.tsx` returns ≥1 (XSS-safe preview)
    - `npm run typecheck && npm run lint && npm run build` exit 0
    - Smoke manual: dev → admin → /cau-hinh → 3 tabs hiển thị; tab SLA → 4 inputs prefilled với defaults (60/30/15/05-30); thay 60 → 90 → Lưu → toast → refresh trang giữ 90; tab Email → 5 sub-tabs; chọn "Mời đăng ký" → Tiptap render bodyHtml; tab SMS → 3 sub-tabs với character count.
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
  </verify>
  <done>3-tab page (SLA + Email + SMS), SLA form 4 fields với defaults, Email editor 5 sub-tabs với honorific Select + RichTextEditor + iframe preview, SMS editor 3 sub-tabs với character count + variable insert.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Admin → systemConfig table | Key-value store; admin có thể modify mọi key, risk arbitrary key write nếu không whitelist |
| Email/SMS template HTML/text → DB → Phase 3+ render | Templates dùng để render email Phase 3+, dispatch mock; risk XSS qua bodyHtml nếu render chưa sanitize |
| SLA params → Phase 8/9/10 alerts | Thay SLA params ảnh hưởng cảnh báo Phase 8 chậm ký HĐ, Phase 9 hạn báo cáo, Phase 10 dashboard SLA widgets |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-07-01 | E (Authorization bypass) | Server actions | mitigate | First lines `auth()` + `can(role, 'cau-hinh', 'update')`; chỉ ADMIN |
| T-02-07-02 | T (Mass assignment via key) | updateEmailTemplate, updateSmsTemplate | mitigate | Key whitelist hardcoded 5 email + 3 sms; throw "Khóa không hợp lệ" nếu khác |
| T-02-07-03 | T (Invalid SLA values cascade) | updateSLAConfig | mitigate | Zod min/max bounds (1-365 days for CONTRACT_DAYS); regex MM-DD; UI Input number type=number; Phase 8/9/10 nên defensive read with fallback to SLA_THRESHOLDS constants nếu DB value invalid |
| T-02-07-04 | I (XSS via email bodyHtml) | EmailTemplateEditor preview + Phase 3 render | mitigate | iframe sandbox cho preview (Plan 02-06 reuse); production phase 2 sanitize qua DOMPurify trước khi render PDF/dispatch email |
| T-02-07-05 | I (Honorific enum injection) | emailTemplateSchema | mitigate | Zod `.enum()` whitelist 5 values; throw nếu khác |
| T-02-07-06 | T (Cache stale across instances) | invalidateConfigCache | accept | In-memory cache per-process, dev single instance OK; production phase 2 thay Redis pub/sub; POC scope acceptable |
| T-02-07-07 | I (SMS body leak via audit log) | template.ts withAuditLog | accept | SMS body là template, không phải PII; audit log capture diff acceptable |
| T-02-07-08 | E (Variable injection trong SMS plain-text) | SMS preview substitution | mitigate | Dùng `String.split().join()` thay regex để tránh regex injection (consistent với Plan 02-06 DocumentTemplate preview) |
| T-02-07-09 | T (FK on updatedById invalid user) | SystemConfig.updatedById | mitigate | Set từ session.user.id (real user); FK soft (no constraint at DB level vì SystemConfig.updatedById là String? — accepted POC scope) |
</threat_model>

<verification>
- `npx prisma db push --accept-data-loss=false` exit 0; `npm run db:seed` log "SystemConfig 9"
- `npm run typecheck && npm run lint && npm run build` exit 0
- Đăng nhập admin → /cau-hinh:
  - Tab "Tham số SLA": 4 inputs prefilled 60/30/15/05-30; thay 60→90 → Lưu → toast "Đã cập nhật tham số SLA"; audit log /nhat-ky có entry UPDATE resource='cau-hinh'
  - Refresh trang → 4 inputs vẫn 90/30/15/05-30 (DB persisted)
  - Click "Khôi phục mặc định" → ConfirmDialog → confirm → reset về 60/30/15/05-30
  - Tab "Mẫu Email": 5 sub-tabs; chọn "Mời đăng ký"; Tiptap render bodyHtml prefilled; thay subject "Mời tham gia..." → "Mời tham gia 2026" → Lưu → DB updated; tab "Xem trước" iframe render với mock {{namKy}}→2026
  - Tab "Mẫu SMS": 3 sub-tabs; "Mời đăng ký" textarea với character count "120/160"; thay text → Lưu → DB updated
- Đăng nhập DONVI → /cau-hinh middleware redirect (sidebar không show)
- Sau khi update SLA, gọi `getSLAThresholds()` từ Plan 03+ context (smoke trong tsx) → returns DB values, không phải hardcoded
</verification>

<success_criteria>
- CONFIG-01: Admin cấu hình tham số SLA 4 fields với validation, save/restore, audit log
- CONFIG-02: Admin cấu hình 5 email templates (subject + honorific + bodyHtml + preview iframe) + 3 SMS templates (body 160 chars + character count + variables) — all với honorific Việt formal
- lib/system-config.ts ready cho Phase 3+ consume (getSLAThresholds, getEmailTemplate, getSmsTemplate)
- Reachability: route `/cau-hinh` reachable qua sidebar (đã có trong Phase 1 ALL_MENU_ITEMS với `resource: 'cau-hinh'` — chỉ admin thấy)
</success_criteria>

<output>
Sau khi complete tạo `.planning/phases/02-m1-quan-tri-danh-muc/02-07-system-config-SUMMARY.md`
</output>
