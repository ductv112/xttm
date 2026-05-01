---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - lib/workflows/programCycle.ts
  - lib/notifications.ts
  - lib/notification-types.ts
  - prisma/seed.ts
  - prisma/seed/program-cycles.ts
  - prisma/seed/notifications.ts
  - storage/uploads/cong-van/.gitkeep
autonomous: true
requirements:
  - CYCLE-05
tags: [program-cycle, state-machine, schema, notification-mock, seed, hero-foundation]
user_setup: []

must_haves:
  truths:
    - "Schema có model Notification + NotificationDispatch + Attachment đầy đủ field cho dispatch flow"
    - "lib/workflows/programCycle.ts export TRANSITIONS table 7-state + canTransitionCycle + validateGuards + transitionCycle async"
    - "lib/notifications.ts export sendCycleInvitation(...) tạo Notification + N dispatches mock"
    - "DB sau seed có 3 ProgramCycle: 2025 COMPLETED, 2026 OPEN_REGISTRATION (mở 28 ngày trước, hạn còn 12 ngày), 2027 DRAFT — dùng daysAgo/daysFromNow"
    - "TRANSITIONS table khớp 100% với CONTEXT.md state machine spec (DRAFT→READY, READY→OPEN, OPEN↔CLOSED gia hạn 2 chiều, CLOSED→EVALUATING, EVALUATING→APPROVED, APPROVED→COMPLETED)"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Notification + NotificationDispatch models appended; Attachment model already exists from M0"
      contains: "model Notification"
    - path: "lib/workflows/programCycle.ts"
      provides: "Complete state machine với TRANSITIONS + canTransitionCycle + validateGuards + transitionCycle"
      contains: "export const TRANSITIONS"
      min_lines: 120
    - path: "lib/notifications.ts"
      provides: "sendCycleInvitation + listDispatches mock dispatch logic"
      exports: ["sendCycleInvitation", "listCycleDispatches"]
      min_lines: 60
    - path: "prisma/seed/program-cycles.ts"
      provides: "Seed 3 cycles realistic relative dates"
      contains: "year: 2026"
  key_links:
    - from: "lib/workflows/programCycle.ts"
      to: "prisma.programCycle"
      via: "transitionCycle reads existing cycle + writes status"
      pattern: "prisma\\.programCycle\\.(findUnique|update)"
    - from: "lib/notifications.ts"
      to: "prisma.notification + prisma.notificationDispatch"
      via: "sendCycleInvitation creates parent + N children"
      pattern: "prisma\\.notification\\.create"
    - from: "prisma/seed.ts"
      to: "prisma/seed/program-cycles.ts"
      via: "import seedProgramCycles + call after orgs"
      pattern: "seedProgramCycles"
---

<objective>
Đặt nền móng dữ liệu + nghiệp vụ cho Phase 3 HERO: hoàn thiện state machine 7 trạng thái cho ProgramCycle (PITFALLS R3 mitigation), append schema cho Notification + NotificationDispatch (CYCLE-13 mock dispatch), tạo lib/notifications.ts mock dispatch helper, và seed 3 chu kỳ realistic cover đủ 3 góc nhìn demo (COMPLETED quá khứ / OPEN_REGISTRATION hiện tại / DRAFT tương lai) với relative dates (PITFALLS R5 mitigation).

Purpose:
- Mọi plan Phase 3 sau đều dependency trực tiếp lên schema mới + workflow hoàn chỉnh + 3 cycle seed sẵn để test UI
- State machine sai = bug crit suốt vòng đời (PITFALLS §4.1) → lock authoritative tại đây, mọi server action plan 03-03 sẽ import canTransitionCycle/transitionCycle
- Mock dispatch system tách từ ALERT-08 (Phase 10) cho phép composer email mời (CYCLE-13) hoạt động ở Phase 3 mà không cần đợi inbox UI

Output: schema.prisma đã `prisma db push` xong với 2 model mới + workflow file ~120 LOC + notifications helper ~80 LOC + seed file ~150 LOC chạy thành công cho 3 cycles + 2 mock dispatches lịch sử.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-CONTEXT.md
@.planning/research/PITFALLS.md
@prisma/schema.prisma
@lib/workflows/programCycle.ts
@lib/audit-types.ts
@lib/audit.ts
@lib/date.ts
@lib/constants.ts
@prisma/seed.ts

<interfaces>
<!-- Existing exports — Plan 03-01 builds on these -->

From lib/workflows/programCycle.ts (existing, will be replaced/extended):
```typescript
export type ProgramCycleStatus = 'DRAFT' | 'READY' | 'OPEN_REGISTRATION' | 'CLOSED_REGISTRATION'
  | 'EVALUATING' | 'APPROVED' | 'COMPLETED';
export function canTransitionCycle(from, to): boolean;
export const CYCLE_STATUS_LABELS: Record<ProgramCycleStatus, string>;
```

From lib/audit.ts:
```typescript
export function withAuditLog<TArgs, TReturn>(meta, fn): (args) => Promise<TReturn>;
export function logAudit(entry, userId, ip?, userAgent?): Promise<void>;
```

From lib/date.ts:
```typescript
export function daysAgo(n: number): Date;
export function daysFromNow(n: number): Date;
```

From lib/constants.ts:
```typescript
export const PROGRAM_CYCLE_STATUS: Record<...>; // 7 string keys
export const ORG_CODES: { CUC_XTTM, BO_CT, VITAS, LEFASO, VINATEX, VASEP, VCCI };
export const HARDCODED_USERS: ReadonlyArray<{username, role, ...}>;
```

From prisma/schema.prisma (existing):
```prisma
model ProgramCycle {
  id, year (unique), name, status (default "DRAFT"), totalBudget,
  registrationOpenAt, registrationCloseAt, evaluationStartAt, evaluationEndAt, approvalDeadline,
  scanDocumentUrl, emailTemplateId, invitedOrganizations (JSON), createdById, createdAt, updatedAt
}

model Attachment {
  id, entityType, entityId, fileName, fileUrl, fileSize, mimeType, uploadedById, createdAt
  uploader User @relation("AttachmentUploader")
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Schema + workflow state machine hoàn chỉnh + Attachment metadata fields</name>
  <files>prisma/schema.prisma, lib/workflows/programCycle.ts, lib/notification-types.ts</files>
  <behavior>
    - schema.prisma append 2 models mới: Notification (id, programCycleId?, projectId?, type ENUM-string, subject, content TEXT, recipientType, createdById, createdAt, indexes [programCycleId], [type]) + NotificationDispatch (id, notificationId, recipientUserId?, recipientOrgId?, status default SENT, sentAt default now, readAt? + relations cascade với Notification on delete + indexes [notificationId], [recipientUserId], [status])
    - schema.prisma EXTEND Attachment model: append optional fields signedNumber String? (số công văn), signedDate DateTime? (ngày ký), signedByName String? (người ký), signedByTitle String? (chức vụ); KHÔNG đổi existing fields để không break Phase 1 PDF spike
    - schema.prisma EXTEND ProgramCycle: append fields invitationLetterAttachmentId String? (link to Attachment uploaded as công văn), supplementDeadline DateTime? (hạn nộp bổ sung — CYCLE-03 spec), configJson String? (JSON lưu scoringCriteriaIds + evaluationCriteriaIds + emailTemplateIds + extendReason history — Plan 03-03+ consume)
    - schema.prisma EXTEND ProgramCycle relation: notifications Notification[] (back-relation từ Notification.programCycleId)
    - Run `npx prisma db push` (idempotent, KHÔNG dùng migrate vì M0 lock dùng db push) sau khi sửa schema
    - lib/notification-types.ts tạo mới: export type NotificationType = 'CYCLE_INVITATION' | 'CYCLE_CONFIG_CHANGED' | 'CYCLE_EXTENDED' | 'CYCLE_OPENED' | 'CYCLE_CLOSED'; export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> tiếng Việt; export type DispatchStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED'
    - lib/workflows/programCycle.ts REPLACE toàn bộ file: keep export type ProgramCycleStatus + CYCLE_STATUS_LABELS as before; add export const TRANSITIONS: Record<ProgramCycleStatus, ProgramCycleStatus[]> với spec EXACT: DRAFT:['READY'], READY:['OPEN_REGISTRATION','DRAFT'], OPEN_REGISTRATION:['CLOSED_REGISTRATION'], CLOSED_REGISTRATION:['OPEN_REGISTRATION','EVALUATING'], EVALUATING:['APPROVED'], APPROVED:['COMPLETED'], COMPLETED:[]
    - Add export function canTransitionCycle(from, to): boolean (return TRANSITIONS[from]?.includes(to) ?? false) — keep signature backward compat
    - Add export type GuardResult = { ok: boolean; reason?: string }
    - Add export function validateGuards(cycle: { status: ProgramCycleStatus; invitationLetterAttachmentId?: string | null; registrationOpenAt?: Date | null; registrationCloseAt?: Date | null }, target: ProgramCycleStatus): GuardResult — ENFORCE: target='READY' requires registrationOpenAt + registrationCloseAt set; target='OPEN_REGISTRATION' requires invitationLetterAttachmentId not null (must have công văn) + canTransitionCycle(cycle.status, target); target='CLOSED_REGISTRATION' requires status='OPEN_REGISTRATION'; target='OPEN_REGISTRATION' from CLOSED requires reason (handled in extendCycle wrapper); other transitions only check canTransitionCycle. Return {ok: false, reason: 'Vui lòng upload công văn ban hành trước khi mở cổng'} với reason tiếng Việt cụ thể
    - Add export const CYCLE_STATUS_BADGE_THEME: Record<ProgramCycleStatus, 'slate'|'blue'|'green'|'amber'|'emerald'|'slateDark'> mapping cho StatusBadge component (slate=DRAFT, blue=READY|EVALUATING, green=OPEN_REGISTRATION, amber=CLOSED_REGISTRATION, emerald=APPROVED, slateDark=COMPLETED) — Plan 03-02 sẽ consume
    - Add export const ALLOWED_NEXT_STATES = (status: ProgramCycleStatus) => TRANSITIONS[status] ?? [] — used by UI để render available action buttons
    - **DO NOT** add transitionCycle async function in this task — that's a server action lives in Plan 03-03 (separation: workflow = pure logic, server action = transactional w/ audit)
  </behavior>
  <action>
    1. Read current prisma/schema.prisma (file rất dài — chỉ cần navigate vùng cần sửa)
    2. Append 2 models Notification + NotificationDispatch SAU SystemConfig section ở cuối file
    3. Modify Attachment model: thêm 4 optional fields công văn metadata
    4. Modify ProgramCycle model: thêm invitationLetterAttachmentId + supplementDeadline + back-relation notifications
    5. Save schema.prisma; run `npx prisma db push --skip-generate` (use existing client) hoặc `npx prisma db push` (regen client) để sync DB. Nếu prompt hỏi reset, ANSWER NO — chỉ append fields nên non-destructive
    6. Create lib/notification-types.ts với 3 export
    7. REPLACE lib/workflows/programCycle.ts với phiên bản mở rộng (giữ existing exports + thêm new ones theo behavior list trên)
    8. Run `npx tsc --noEmit` verify type clean
    9. Run smoke test inline: `npx tsx -e "import {canTransitionCycle, validateGuards, ALLOWED_NEXT_STATES} from './lib/workflows/programCycle'; console.log(canTransitionCycle('OPEN_REGISTRATION','CLOSED_REGISTRATION')); console.log(validateGuards({status:'READY'}, 'OPEN_REGISTRATION')); console.log(ALLOWED_NEXT_STATES('CLOSED_REGISTRATION'));"` — expect: true, {ok:false, reason:'Vui lòng upload công văn ban hành trước khi mở cổng'}, ['OPEN_REGISTRATION','EVALUATING']
  </action>
  <verify>
    <automated>npx prisma db push --skip-generate &amp;&amp; npx tsc --noEmit &amp;&amp; npx tsx -e "const w=require('./lib/workflows/programCycle');console.log(w.canTransitionCycle('OPEN_REGISTRATION','CLOSED_REGISTRATION')===true);console.log(w.validateGuards({status:'READY'},'OPEN_REGISTRATION').ok===false);console.log(JSON.stringify(w.ALLOWED_NEXT_STATES('CLOSED_REGISTRATION')))"</automated>
  </verify>
  <done>
    - schema.prisma có model Notification + NotificationDispatch
    - Attachment có 4 fields công văn metadata
    - ProgramCycle có invitationLetterAttachmentId + supplementDeadline
    - prisma db push pass (không lỗi schema)
    - lib/workflows/programCycle.ts exports đủ 6: ProgramCycleStatus, CYCLE_STATUS_LABELS, TRANSITIONS, canTransitionCycle, validateGuards, ALLOWED_NEXT_STATES, CYCLE_STATUS_BADGE_THEME
    - tsc --noEmit pass
    - Smoke test 3 assertion all true
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: lib/notifications.ts mock dispatch helper + invitation logic</name>
  <files>lib/notifications.ts</files>
  <behavior>
    - lib/notifications.ts NEW file ('use server' NOT needed — lib utility, server actions wrap nó)
    - Import prisma từ @/lib/prisma
    - Import { NotificationType, DispatchStatus } từ @/lib/notification-types
    - Export type SendInvitationInput = { cycleId: string; subject: string; contentHtml: string; recipientOrgIds: string[]; createdById: string; type?: NotificationType }
    - Export async function sendCycleInvitation(input: SendInvitationInput): Promise<{ notificationId: string; dispatchCount: number }> — tạo 1 Notification record + N NotificationDispatch records (1 per recipientOrgId) với status='SENT', sentAt=now, recipientUserId=null (recipient identified by org), recipientOrgId set; transaction wrap qua prisma.$transaction([...])
    - Export async function listCycleDispatches(cycleId: string, options?: { limit?: number }): Promise<Array<{ id: string; subject: string; type: string; createdAt: Date; dispatchCount: number; sentAt: Date | null }>> — group qua prisma.notification.findMany where programCycleId + include _count.dispatches; default limit 20 most recent
    - Export async function markDispatchRead(dispatchId: string): Promise<void> — update readAt=now (Plan 04 inbox sẽ dùng)
    - Export async function getCycleNotificationStats(cycleId: string): Promise<{ totalNotifications: number; totalDispatches: number; readDispatches: number }> — for tab "Đơn vị mời + thông báo" badge counter
    - **NO permission check trong lib** — caller server action (Plan 03-03) handle RBAC; lib/notifications.ts is pure data helper
    - **NO audit log inside** — caller server action wrap qua withAuditLog (separation of concerns)
  </behavior>
  <action>
    1. Create lib/notifications.ts theo behavior list trên
    2. Use Prisma transactional create: `await prisma.$transaction(async (tx) => { const n = await tx.notification.create(...); await tx.notificationDispatch.createMany({ data: input.recipientOrgIds.map(orgId => ({ notificationId: n.id, recipientOrgId: orgId, status: 'SENT', sentAt: new Date() })) }); return n; })`
    3. Run tsc --noEmit verify
    4. Smoke test inline: tạo 1 cycle giả + 1 user giả + call sendCycleInvitation với 2 fake orgIds, verify count=2 + listCycleDispatches return 1 entry với dispatchCount=2; cleanup test data sau khi xong (use try/finally)
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; npx tsx -e "(async()=>{const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();const{sendCycleInvitation,listCycleDispatches}=require('./lib/notifications');try{const o1=await p.organization.findFirst({where:{code:'VITAS'}});const o2=await p.organization.findFirst({where:{code:'LEFASO'}});const u=await p.user.findFirst({where:{username:'banql'}});if(!o1||!o2||!u){console.log('SKIP no seed yet');return}const c=await p.programCycle.create({data:{year:9999,name:'Test',createdById:u.id}});const r=await sendCycleInvitation({cycleId:c.id,subject:'Test',contentHtml:'&lt;p&gt;Test&lt;/p&gt;',recipientOrgIds:[o1.id,o2.id],createdById:u.id});console.log('dispatchCount=2:',r.dispatchCount===2);const list=await listCycleDispatches(c.id);console.log('listCount=1:',list.length===1);await p.notification.delete({where:{id:r.notificationId}});await p.programCycle.delete({where:{id:c.id}})}finally{await p.\$disconnect()}})()"</automated>
  </verify>
  <done>
    - lib/notifications.ts exports 4 functions: sendCycleInvitation, listCycleDispatches, markDispatchRead, getCycleNotificationStats
    - tsc --noEmit pass
    - Smoke test (or skip if seed empty) prints "dispatchCount=2: true" + "listCount=1: true"
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Seed 3 ProgramCycles realistic + 2 mock dispatch history + storage dir</name>
  <files>prisma/seed/program-cycles.ts, prisma/seed/notifications.ts, prisma/seed.ts, storage/uploads/cong-van/.gitkeep</files>
  <behavior>
    - prisma/seed/program-cycles.ts NEW file: export async function seedProgramCycles(prisma: PrismaClient): Promise<{ cycle2025Id: string; cycle2026Id: string; cycle2027Id: string }>
    - Cycle 2025 — COMPLETED (demo lịch sử): year=2025, name="Chương trình XTTM Quốc gia 2025", status='COMPLETED', totalBudget=85_000_000_000 (85 tỷ VND), registrationOpenAt=new Date(2025,2,1) (1/3/2025), registrationCloseAt=new Date(2025,4,30) (30/5/2025), evaluationStartAt=new Date(2025,5,15), evaluationEndAt=new Date(2025,6,30), approvalDeadline=new Date(2025,7,15), supplementDeadline=new Date(2025,5,10), invitedOrganizations=JSON.stringify(['VITAS','LEFASO','VINATEX','VASEP','VCCI']) — store codes resolved to ids in actual seed code
    - Cycle 2026 — OPEN_REGISTRATION (HERO demo cycle): year=2026, name="Chương trình XTTM Quốc gia 2026", status='OPEN_REGISTRATION', totalBudget=95_000_000_000, registrationOpenAt=daysAgo(28), registrationCloseAt=daysFromNow(12) (=>40 ngày tổng cycle, đã trôi qua 28 ngày, còn 12 — phù hợp banner "hạn 30/05/2026 còn 12 ngày" + trigger hiển thị "Đang mở đăng ký"), supplementDeadline=daysFromNow(20), evaluationStartAt=daysFromNow(15), evaluationEndAt=daysFromNow(45), approvalDeadline=daysFromNow(60), invitationLetterAttachmentId set sau khi tạo Attachment + invitedOrganizations=JSON of 5 org codes
    - Cycle 2026 cần thêm 1 Attachment record kiểu công văn: entityType='ProgramCycle', entityId=cycle2026.id, fileName='cong-van-moi-2026.pdf', fileUrl='storage/uploads/cong-van/cycle-2026-mock.pdf' (file mock không cần tồn tại physical, chỉ ghi nhận metadata cho demo), fileSize=245678, mimeType='application/pdf', signedNumber='1234/CV-XTTM', signedDate=daysAgo(35), signedByName='Bùi Xuân Hồng', signedByTitle='Cục trưởng Cục XTTM', uploadedById=user banql; sau đó update cycle2026.invitationLetterAttachmentId=attachment.id
    - Cycle 2027 — DRAFT (chuẩn bị tương lai): year=2027, name="Chương trình XTTM Quốc gia 2027", status='DRAFT', totalBudget=null (chưa cấu hình), registrationOpenAt=null, registrationCloseAt=null, supplementDeadline=null, evaluationStartAt=null, evaluationEndAt=null, approvalDeadline=null, invitedOrganizations=null
    - Use upsert pattern: prisma.programCycle.upsert({ where: { year: 2025|2026|2027 }, create: {...}, update: {} }) — idempotent rerun safe
    - Resolve org codes (VITAS, LEFASO,...) thành actual organization.id via prisma.organization.findUnique({where:{code}}) trước khi build invitedOrganizations JSON
    - prisma/seed/notifications.ts NEW file: export async function seedCycleNotifications(prisma, { cycle2025Id, cycle2026Id }, banqlUserId): Promise<void>
    - Cycle 2025 lịch sử: 1 Notification type='CYCLE_INVITATION', subject='Mời tham gia Chương trình XTTM Quốc gia 2025', contentHtml='&lt;p&gt;Kính gửi Quý đơn vị, Cục XTTM trân trọng kính mời...&lt;/p&gt;', programCycleId=cycle2025Id, createdById=banqlUserId, createdAt=new Date(2025,2,2); plus 5 dispatches (1 cho mỗi VITAS/LEFASO/VINATEX/VASEP/VCCI) status='READ' (đã đọc)
    - Cycle 2026 hiện tại: 1 Notification type='CYCLE_INVITATION', subject='Mời tham gia Chương trình XTTM Quốc gia 2026 — Hạn nộp 30/05/2026', contentHtml=mock 4 dòng VN với honorific 'Kính gửi Quý đơn vị', programCycleId=cycle2026Id, createdAt=daysAgo(27); 5 dispatches mix: 3 status='READ' (LEFASO,VITAS,VINATEX đã đọc), 2 status='SENT' (VASEP,VCCI chưa đọc) — tạo realistic readiness state
    - Use prisma.notification.upsert by composite query (findFirst by subject+programCycleId, then create if missing) — vì không có @unique trên subject; idempotent qua check trước
    - Modify prisma/seed.ts: import seedProgramCycles + seedCycleNotifications; call SAU khi seed users + organizations + catalogs nhưng TRƯỚC khi end (vì các phase sau seed projects sẽ FK về cycle); pattern: const cycleIds = await seedProgramCycles(prisma); const banqlUser = await prisma.user.findUnique({where:{username:'banql'}}); if(banqlUser) await seedCycleNotifications(prisma, cycleIds, banqlUser.id)
    - Create storage/uploads/cong-van/.gitkeep empty file để git track dir; ensure storage/uploads/ và cong-van/ exist (mkdir -p qua node fs trong seed, hoặc git track via .gitkeep)
    - Add storage/uploads/* vào .gitignore (verify đã có; nếu chưa, append; nhưng giữ .gitkeep tracked qua exception "!.gitkeep" pattern)
    - Run `npm run db:seed` — verify console log "Seeded 3 program cycles" + "Seeded 2 cycle notifications with 10 dispatches"
  </behavior>
  <action>
    1. Create prisma/seed/program-cycles.ts theo spec; import { daysAgo, daysFromNow } from '../../lib/date'; resolve org ids từ ORG_CODES catalog
    2. Create prisma/seed/notifications.ts theo spec; check existing notification by where { programCycleId, subject } + skip if found
    3. Modify prisma/seed.ts để call 2 seeders mới sau orgs/users/catalogs/system-config, before end
    4. Tạo storage/uploads/cong-van/.gitkeep (touch file)
    5. Verify .gitignore có line "storage/uploads/*" và "!storage/uploads/**/.gitkeep" (add nếu thiếu)
    6. Run npm run db:seed; verify exit 0 + console output mentions 3 cycles + dispatches
    7. Verify DB state: `npx tsx -e "(async()=>{const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();const cycles=await p.programCycle.findMany({orderBy:{year:'asc'}});console.log('cycles count:',cycles.length);console.log('years:',cycles.map(c=>c.year).join(','));console.log('statuses:',cycles.map(c=>c.status).join(','));const notif=await p.notification.findMany({include:{_count:{select:{dispatches:true}}}});console.log('notifications:',notif.length);console.log('total dispatches:',notif.reduce((a,n)=>a+n._count.dispatches,0));await p.\$disconnect()})()`
  </action>
  <verify>
    <automated>npm run db:seed &amp;&amp; npx tsx -e "(async()=>{const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();try{const cs=await p.programCycle.findMany({orderBy:{year:'asc'}});console.log('cycles=3:',cs.length===3);console.log('years=2025,2026,2027:',cs.map(c=>c.year).join(',')==='2025,2026,2027');console.log('open2026:',cs.find(c=>c.year===2026)?.status==='OPEN_REGISTRATION');const ns=await p.notification.findMany();console.log('notifs=2:',ns.length===2);const ds=await p.notificationDispatch.findMany();console.log('dispatches=10:',ds.length===10);const att=await p.attachment.findFirst({where:{entityType:'ProgramCycle'}});console.log('attachment:',att?.signedNumber==='1234/CV-XTTM')}finally{await p.\$disconnect()}})()"</automated>
  </verify>
  <done>
    - 3 ProgramCycles in DB với year 2025/2026/2027 và status COMPLETED/OPEN_REGISTRATION/DRAFT
    - 1 Attachment công văn linked tới cycle 2026 với signedNumber + signedDate + signedByName
    - 2 Notifications + 10 Dispatches in DB
    - storage/uploads/cong-van/ tồn tại với .gitkeep tracked
    - Re-run seed idempotent (không duplicate)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| seed script → DB | Trusted dev-only operation, run by developer locally |
| lib/workflows logic → calling server actions | Pure functions, no I/O, callers responsible for permission |
| lib/notifications → DB | Lib utility, callers responsible for RBAC + audit |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01-01 | T (Tampering) | TRANSITIONS table — incorrect transition allowed | mitigate | TRANSITIONS const frozen in lib/workflows; canTransitionCycle is the SOLE source of truth; every server action in Plan 03-03 MUST validate via canTransitionCycle/validateGuards before update; Plan 03-07 UI also reads ALLOWED_NEXT_STATES so users only see valid actions |
| T-03-01-02 | I (Info disclosure) | NotificationDispatch.recipientOrgId leak across orgs | accept | POC scope — all roles with read access to /chuong-trinh see invitation history; production would scope per-org |
| T-03-01-03 | E (Elevation) | seed runs as superuser without RBAC | accept | Seed is dev-only, run by developer; not exposed via HTTP |
| T-03-01-04 | D (Denial of service) | $transaction in sendCycleInvitation locks DB if N huge | mitigate | POC max 5-10 orgs; Plan 03-03 server action will validate recipientOrgIds.length ≤ 50 before calling sendCycleInvitation; if larger, batch — but defer optimization to Phase 11 polish |
| T-03-01-05 | T (Tampering) | Attachment metadata signedDate could be in future | mitigate | Plan 03-03 uploadCongVan server action will Zod validate signedDate ≤ today; this plan only seeds, sets fixed past dates |
| T-03-01-06 | S (Spoofing) | seed creates Attachment without uploadedById verification | mitigate | Seed assigns uploadedById = banqlUser.id (resolved from username); banqlUser must exist (Phase 1 seed prereq) — fail fast if missing |
</threat_model>

<verification>
- prisma/schema.prisma: grep "model Notification " returns hit; grep "model NotificationDispatch" returns hit; grep "invitationLetterAttachmentId" returns hit
- lib/workflows/programCycle.ts: grep "export const TRANSITIONS" returns hit; line count ≥ 120
- lib/notifications.ts: grep "export async function sendCycleInvitation" returns hit; export count ≥ 4
- npx prisma db push exits 0
- npx tsc --noEmit exits 0
- npm run db:seed exits 0; verification query shows 3 cycles + 1 attachment with signedNumber + 2 notifications + 10 dispatches
- Re-run npm run db:seed twice — second run does NOT throw "Unique constraint violation" on year
</verification>

<success_criteria>
1. Schema appended với Notification + NotificationDispatch models, Attachment thêm 4 metadata fields, ProgramCycle thêm invitationLetterAttachmentId + supplementDeadline — `npx prisma db push` exits 0 trên DB hiện tại không destroy data Phase 1-2
2. lib/workflows/programCycle.ts exports đầy đủ: ProgramCycleStatus type, CYCLE_STATUS_LABELS, TRANSITIONS object, canTransitionCycle, validateGuards, ALLOWED_NEXT_STATES, CYCLE_STATUS_BADGE_THEME — tất cả callable từ Plan 03-03+
3. lib/notifications.ts hoạt động cho mock dispatch flow: sendCycleInvitation → listCycleDispatches có thể chain trong Plan 03-03
4. DB sau seed có 3 cycles realistic dùng daysAgo/daysFromNow (PITFALLS R5 mitigation): cycle 2025 COMPLETED, cycle 2026 OPEN_REGISTRATION với invitationLetterAttachmentId set + 5 dispatches (3 read / 2 sent), cycle 2027 DRAFT
5. Seed idempotent — re-run npm run db:seed nhiều lần không error
</success_criteria>

<output>
After completion, create `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-01-SUMMARY.md` theo template.
</output>
