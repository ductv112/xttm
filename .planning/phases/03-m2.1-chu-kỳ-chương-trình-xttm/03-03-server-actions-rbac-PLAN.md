---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 03
type: execute
wave: 2
depends_on: [01]
files_modified:
  - app/(app)/chuong-trinh/_actions/types.ts
  - app/(app)/chuong-trinh/_actions/list.ts
  - app/(app)/chuong-trinh/_actions/get-detail.ts
  - app/(app)/chuong-trinh/_actions/create.ts
  - app/(app)/chuong-trinh/_actions/update.ts
  - app/(app)/chuong-trinh/_actions/transition.ts
  - app/(app)/chuong-trinh/_actions/extend.ts
  - app/(app)/chuong-trinh/_actions/upload-cong-van.ts
  - app/(app)/chuong-trinh/_actions/send-invitation.ts
  - app/(app)/chuong-trinh/_actions/index.ts
  - lib/audit-types.ts
autonomous: true
requirements:
  - CYCLE-02
  - CYCLE-07
  - CYCLE-08
  - CYCLE-09
  - CYCLE-10
  - CYCLE-11
  - CYCLE-13
tags: [server-actions, rbac, zod, audit, file-upload, rate-limit]
user_setup: []

must_haves:
  truths:
    - "createCycle reject duplicate năm với VN message — Zod async refine + DB unique constraint"
    - "transitionCycle authoritative: validates canTransitionCycle + validateGuards trước update; throw VN error nếu thất bại"
    - "uploadCongVan accept PDF only ≤10MB, save tới storage/uploads/cong-van/{cycleId}/, create Attachment + link invitationLetterAttachmentId"
    - "extendCycle CLOSED→OPEN với reason + newDeadline; ghi audit log với diff bao gồm reason"
    - "sendInvitation rate-limited (max 1 send per 5 min per cycleId qua Map in-memory) + Zod validate recipientOrgIds.length 1-50"
    - "All 9 server actions có 'use server' + RBAC dòng đầu via canFromDB('chuong-trinh', action) throw VN message"
    - "All mutations wrapped qua withAuditLog với resource='chuong-trinh' + audit action enum đúng"
  artifacts:
    - path: "app/(app)/chuong-trinh/_actions/transition.ts"
      provides: "transitionCycle authoritative state machine call"
      exports: ["transitionCycle"]
      min_lines: 90
    - path: "app/(app)/chuong-trinh/_actions/upload-cong-van.ts"
      provides: "uploadCongVan save PDF + Attachment + link cycle"
      exports: ["uploadCongVan"]
      min_lines: 90
    - path: "app/(app)/chuong-trinh/_actions/send-invitation.ts"
      provides: "sendInvitation wraps lib/notifications.sendCycleInvitation + RBAC + rate limit + audit"
      exports: ["sendInvitation"]
      min_lines: 80
  key_links:
    - from: "app/(app)/chuong-trinh/_actions/transition.ts"
      to: "lib/workflows/programCycle.ts"
      via: "import canTransitionCycle + validateGuards"
      pattern: "from '@/lib/workflows/programCycle'"
    - from: "app/(app)/chuong-trinh/_actions/transition.ts"
      to: "lib/audit.ts"
      via: "withAuditLog wrapper"
      pattern: "withAuditLog"
    - from: "app/(app)/chuong-trinh/_actions/upload-cong-van.ts"
      to: "node:fs/promises"
      via: "writeFile to disk + Attachment.create"
      pattern: "fs/promises"
    - from: "app/(app)/chuong-trinh/_actions/send-invitation.ts"
      to: "lib/notifications.ts"
      via: "import sendCycleInvitation"
      pattern: "sendCycleInvitation"
---

<objective>
Tạo 9 server actions cho ProgramCycle CRUD + lifecycle, mỗi action: 'use server' directive, RBAC check dòng đầu via canFromDB('chuong-trinh', action), Zod validation, withAuditLog wrap, Vietnamese error messages.

Purpose:
- Backend logic Wave 2 độc lập trước UI plans
- Authoritative state machine (PITFALLS R3): mọi transition đi qua transitionCycle
- Mock dispatch (CYCLE-13) tập trung tại sendInvitation với rate limit chống abuse demo
- Upload công văn (CYCLE-07) handle file IO + metadata transactional

Output: 9 server action files + types + index barrel + audit-types update; ~700 LOC tổng; consistent return shape { success: true, data } | throw VN Error.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-CONTEXT.md
@.planning/phases/02-m1-quan-tri-danh-muc/02-01-audit-log-infrastructure-SUMMARY.md
@.planning/phases/02-m1-quan-tri-danh-muc/02-04-user-management-SUMMARY.md
@lib/workflows/programCycle.ts
@lib/notifications.ts
@lib/audit.ts
@lib/audit-types.ts
@lib/permissions.ts
@lib/permissions-db.ts
@lib/auth.ts
@lib/prisma.ts
@lib/notification-types.ts
@prisma/schema.prisma

<interfaces>
<!-- Plan 03-01 outputs -->

From lib/workflows/programCycle.ts:
- export type ProgramCycleStatus
- export const TRANSITIONS, CYCLE_STATUS_LABELS, CYCLE_STATUS_BADGE_THEME
- export function canTransitionCycle(from, to): boolean
- export function validateGuards(cycle, target): { ok, reason? }
- export function ALLOWED_NEXT_STATES(status): ProgramCycleStatus[]

From lib/notifications.ts:
- export async function sendCycleInvitation(input): Promise of { notificationId, dispatchCount }
- export async function listCycleDispatches(cycleId, options?)

From lib/audit.ts:
- export function withAuditLog(meta, fn) — meta has action, resource, resourceIdFromArgs?, resourceIdFromResult?, captureBefore?, captureAfter?

From lib/permissions-db.ts:
- export async function canFromDB(role, resource, action): Promise of boolean

From lib/auth.ts:
- export const auth — returns Session with user.id, user.role
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Setup audit-types + types.ts + listCycles + getCycleDetail server actions</name>
  <files>lib/audit-types.ts, app/(app)/chuong-trinh/_actions/types.ts, app/(app)/chuong-trinh/_actions/list.ts, app/(app)/chuong-trinh/_actions/get-detail.ts</files>
  <behavior>
    - lib/audit-types.ts: verify AUDIT_ACTIONS contains TRANSITION, UPLOAD, DISPATCH, EXTEND. If missing, append with VN labels (TRANSITION=Chuyển trạng thái, UPLOAD=Tải lên tệp, DISPATCH=Gửi thông báo, EXTEND=Gia hạn) + AUDIT_ACTION_BADGE colors (TRANSITION=blue, UPLOAD=slate, DISPATCH=emerald, EXTEND=amber)
    - app/(app)/chuong-trinh/_actions/types.ts NEW exports: CycleListFilter (year? + statuses?: ProgramCycleStatus[]), CycleListItem (id, year, name, status, totalBudget, registrationOpenAt, registrationCloseAt, supplementDeadline, createdAt, projectCount, invitedOrgCount, daysRemaining), CreateCycleInput, UpdateCycleInput, CycleDetail (cycle + invitationLetterAttachment + invitedOrganizations array + dispatchSummary)
    - list.ts: 'use server', RBAC line 1-3 (auth + canFromDB('chuong-trinh','read') + throw 'Bạn không có quyền truy cập danh sách chu kỳ chương trình'), prisma.programCycle.findMany với filter year + statuses, include _count.projects, parse invitedOrganizations JSON cho count, daysRemaining = registrationCloseAt ? Math.max(0, ceil((close - now)/86400000)) : null, return CycleListItem[]. orderBy year desc.
    - get-detail.ts: getCycleDetail(id): RBAC read, prisma.programCycle.findUnique with include (no Attachment relation in schema — fetch separately by entityType=ProgramCycle + entityId=cycleId for invitationLetter), parse configJson + invitedOrganizations JSON arrays, fetch organizations from invitedOrganizationIds, fetch dispatchSummary qua listCycleDispatches(id, {limit:5}); throw 'Không tìm thấy chu kỳ chương trình' if not found
  </behavior>
  <action>
    1. Read lib/audit-types.ts; verify TRANSITION/UPLOAD/DISPATCH/EXTEND exist; if any missing, append + update AUDIT_ACTION_BADGE
    2. Create types.ts với 5 type exports
    3. Create list.ts với listCycles
    4. Create get-detail.ts với getCycleDetail
    5. Run npx tsc --noEmit
    6. Smoke: tsx node call listCycles({}) — expect 3 cycles seeded; getCycleDetail with cycle 2026 id — expect detail with invitedOrganizations array length 5 + invitationLetterAttachment object signedNumber 1234/CV-XTTM
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['list','get-detail','types'].forEach(f=>{const e=require('fs').existsSync('app/(app)/chuong-trinh/_actions/'+f+'.ts');console.log(f+':',e)})"</automated>
  </verify>
  <done>
    - lib/audit-types.ts has all 4 actions
    - types.ts + list.ts + get-detail.ts created
    - tsc pass
    - Smoke verify 3 cycles + cycle 2026 detail có invitationLetter + 5 invitedOrgs
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: createCycle + updateCycle server actions với Zod year-unique validation</name>
  <files>app/(app)/chuong-trinh/_actions/create.ts, app/(app)/chuong-trinh/_actions/update.ts</files>
  <behavior>
    - create.ts: 'use server', import zod, withAuditLog, prisma, auth, canFromDB
    - Zod CreateCycleSchema: year (int, 2020-2050), name (5-200 chars), description (max 2000, optional), totalBudget (nonnegative number, optional nullable), registrationOpenAt/CloseAt/supplementDeadline/evaluationStartAt/EndAt/approvalDeadline (date optional), scoringCriteriaIds + evaluationCriteriaIds + emailTemplateIds + invitedOrganizationIds (string array of cuid, default empty)
    - Refine: registrationCloseAt > registrationOpenAt nếu cả 2 set; supplementDeadline > registrationCloseAt nếu cả 2 set
    - Inside fn: parse via schema → if fail throw 'Dữ liệu không hợp lệ: ' + first issue message in VN; pre-check year uniqueness via prisma.programCycle.findUnique({where:{year}}) → throw 'Chu kỳ năm ' + year + ' đã tồn tại. Mỗi năm chỉ có 1 chu kỳ chương trình duy nhất' (CYCLE-02)
    - export createCycle(input): 'use server', RBAC canFromDB('chuong-trinh','create'), wrap qua withAuditLog with action CREATE, captureAfter returning {year, status}. Build prisma.programCycle.create data với configJson = JSON.stringify({scoringCriteriaIds, evaluationCriteriaIds, emailTemplateIds}), invitedOrganizations = JSON.stringify(invitedOrganizationIds), status='DRAFT', createdById from session
    - revalidatePath('/chuong-trinh') sau mutation
    - update.ts: UpdateCycleSchema = CreateCycleSchema.partial().extend({id: z.string().cuid()})
    - export updateCycle(input): RBAC update, captureBefore loads existing cycle, year-change check (if input.year != existing.year, validate uniqueness manual), apply partial update via prisma.programCycle.update, capture diff via withAuditLog
    - significantChange detection: if status='OPEN_REGISTRATION' AND (registrationCloseAt OR scoringCriteriaIds OR evaluationCriteriaIds changed) → set significantChange=true (Plan 03-06 cấu hình tab dùng để prompt confirm gửi thông báo)
    - Return { id, year, status, significantChange }
    - revalidatePath('/chuong-trinh') + revalidatePath('/chuong-trinh/'+input.id)
  </behavior>
  <action>
    1. Create create.ts với Zod schema + createCycle action
    2. Create update.ts với updateCycle + significantChange detection
    3. Run npx tsc --noEmit
    4. Smoke test: simulate session via direct prisma fetch banql user, then call createCycle({year:2030, name:'Smoke Test 2030'}); verify returns id, then prisma.programCycle.delete cleanup. Then call createCycle({year:2026,name:'Dup'}) — expect throw 'Chu kỳ năm 2026 đã tồn tại'. (Note: actions throw if no session — smoke may need to skip auth check; document expected SKIP message)
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['create','update'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/_actions/'+f+'.ts')))"</automated>
  </verify>
  <done>
    - create.ts + update.ts exist
    - Zod schemas implemented + year unique check + significantChange flag
    - tsc pass
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: transitionCycle + extendCycle server actions với guard validation</name>
  <files>app/(app)/chuong-trinh/_actions/transition.ts, app/(app)/chuong-trinh/_actions/extend.ts</files>
  <behavior>
    - transition.ts: 'use server', import canTransitionCycle, validateGuards, withAuditLog, prisma, audit constants
    - Zod TransitionInput: cycleId (cuid), target (enum 7 statuses), reason (string optional, used for CLOSED→OPEN re-open which is gia hạn but allowed via this action too)
    - export transitionCycle(input): RBAC canFromDB('chuong-trinh','update') (TRANSITION uses update permission), load cycle by id (throw 'Không tìm thấy chu kỳ chương trình' nếu null), validate canTransitionCycle(cycle.status, target) (throw 'Không thể chuyển từ ' + CYCLE_STATUS_LABELS[cycle.status] + ' sang ' + CYCLE_STATUS_LABELS[target]), then validateGuards(cycle, target) — if !ok, throw guardResult.reason (already VN message)
    - Special case: if target === 'OPEN_REGISTRATION' AND cycle.status === 'CLOSED_REGISTRATION', this is re-open scenario — DEFER to extendCycle action; throw 'Vui lòng dùng chức năng Gia hạn để mở lại cổng đăng ký' to force correct path
    - Wrap qua withAuditLog with action TRANSITION + captureBefore loads cycle + captureAfter returns {from: before.status, to: target} + resourceIdFromArgs args=>args.cycleId
    - Inside wrapped fn: prisma.programCycle.update({where:{id: cycleId}, data: {status: target}}); if target === 'EVALUATING', also update closeAt for record-keeping nếu cần (defer for now)
    - revalidatePath('/chuong-trinh') + revalidatePath('/chuong-trinh/'+cycleId)
    - Return { id: cycleId, fromStatus: before.status, toStatus: target }
    - extend.ts: 'use server', for CYCLE-10 gia hạn (CLOSED → OPEN với reason + newDeadline)
    - Zod ExtendInput: cycleId (cuid), reason (string min 10 chars max 1000), newDeadline (date, must be > Date.now())
    - export extendCycle(input): RBAC canFromDB('chuong-trinh','update'), load cycle (throw if not found), require cycle.status === 'CLOSED_REGISTRATION' else throw 'Chỉ có thể gia hạn chu kỳ đã đóng cổng'
    - Wrap qua withAuditLog action=EXTEND, captureBefore + captureAfter capture {status, registrationCloseAt, extendReason: reason}
    - Inside: parse configJson existing → append extension entry to JSON array [{date: now, reason, oldCloseAt: cycle.registrationCloseAt, newCloseAt: newDeadline}], stringify back into configJson; prisma.programCycle.update data: status='OPEN_REGISTRATION', registrationCloseAt: newDeadline, configJson updated
    - Optional: post-extend, schedule notification dispatch (defer to Plan 03-07 UI flow — extendCycle returns flag autoNotify=true if configJson invitedOrgs array exists, UI prompts confirm gửi thông báo)
    - Return { id: cycleId, newDeadline, fromStatus: 'CLOSED_REGISTRATION', toStatus: 'OPEN_REGISTRATION' }
    - revalidatePath like transitionCycle
  </behavior>
  <action>
    1. Create transition.ts theo spec
    2. Create extend.ts theo spec
    3. Run npx tsc --noEmit
    4. Smoke: load cycle 2027 (DRAFT), call transitionCycle({cycleId, target:'OPEN_REGISTRATION'}) — expect throw guard message 'Vui lòng upload công văn ban hành...' since 2027 has no attachment and no dates set
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['transition','extend'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/_actions/'+f+'.ts')))"</automated>
  </verify>
  <done>
    - transition.ts + extend.ts exist với Zod validation
    - Guard logic delegates to lib/workflows.validateGuards (no duplication)
    - Audit log wrapped với captureBefore/After
    - tsc pass
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: uploadCongVan + sendInvitation + index barrel</name>
  <files>app/(app)/chuong-trinh/_actions/upload-cong-van.ts, app/(app)/chuong-trinh/_actions/send-invitation.ts, app/(app)/chuong-trinh/_actions/index.ts</files>
  <behavior>
    - upload-cong-van.ts: 'use server', uses node:fs/promises (writeFile, mkdir), node:path (join, extname), node:crypto (randomUUID for filename safety)
    - export uploadCongVan(cycleId: string, formData: FormData): RBAC canFromDB('chuong-trinh','update')
    - Zod schema for metadata: signedNumber (string min 1 max 100, e.g. "1234/CV-XTTM"), signedDate (date in past or today — Z.date().refine(d => d <= new Date(), 'Ngày ký phải nhỏ hơn hoặc bằng ngày hôm nay')), signedByName (string 2-200), signedByTitle (string 2-200)
    - Extract from formData: file = formData.get('file') as File, plus metadata fields
    - File validation: file.type must be 'application/pdf' (throw 'Chỉ chấp nhận tệp định dạng PDF'); file.size <= 10*1024*1024 (10MB, throw 'Tệp vượt quá kích thước cho phép 10MB')
    - Magic byte check: read first 5 bytes, must be %PDF- (0x25,0x50,0x44,0x46,0x2D) — throw 'Tệp không hợp lệ — không phải PDF thực' (T-03-03 mitigation)
    - Path safety: storedFileName = randomUUID() + '.pdf' (NEVER use original filename — path traversal mitigation); dirPath = storage/uploads/cong-van/{cycleId}/; ensure cycleId is valid cuid via Zod (no .. or /) before use
    - mkdir({recursive: true}) dirPath; writeFile(join(dirPath, storedFileName), Buffer.from(await file.arrayBuffer()))
    - prisma.$transaction: create Attachment (entityType='ProgramCycle', entityId=cycleId, fileName=file.name, fileUrl='storage/uploads/cong-van/'+cycleId+'/'+storedFileName, fileSize=file.size, mimeType='application/pdf', signedNumber, signedDate, signedByName, signedByTitle, uploadedById=session.user.id) + update programCycle.invitationLetterAttachmentId = newAttachment.id
    - Wrap qua withAuditLog action=UPLOAD, resource=chuong-trinh, captureAfter returning {attachmentId, fileName, signedNumber}
    - Return { attachmentId, fileName: file.name, fileUrl, signedNumber }
    - revalidatePath('/chuong-trinh/'+cycleId)
    - send-invitation.ts: 'use server', for CYCLE-13 composer dispatch
    - In-memory rate limit: const RATE_LIMIT = new Map<string, number>() (cycleId -> last-sent timestamp)
    - Zod SendInvitationInput: cycleId (cuid), subject (string 5-300), contentHtml (string 50-50000), recipientOrgIds (array of cuid, length 1-50), notificationType (enum 'CYCLE_INVITATION'|'CYCLE_CONFIG_CHANGED'|'CYCLE_EXTENDED' default CYCLE_INVITATION)
    - export sendInvitation(input): RBAC canFromDB('chuong-trinh','update'), parse via Zod
    - Rate limit check: const last = RATE_LIMIT.get(cycleId); if last && Date.now() - last < 5*60*1000 throw 'Vui lòng đợi ít nhất 5 phút trước khi gửi đợt thông báo tiếp theo' (T-03-04 mitigation)
    - Validate cycle exists + status not DRAFT (throw 'Chu kỳ ở trạng thái nháp không thể gửi thông báo')
    - Wrap qua withAuditLog action=DISPATCH, captureAfter returning {notificationId, dispatchCount, recipientCount: recipientOrgIds.length}
    - Inside: call lib/notifications.sendCycleInvitation({cycleId, subject, contentHtml, recipientOrgIds, createdById: session.user.id, type: notificationType})
    - On success, RATE_LIMIT.set(cycleId, Date.now())
    - Return { notificationId, dispatchCount, sentAt: new Date() }
    - revalidatePath('/chuong-trinh/'+cycleId)
    - index.ts barrel re-export all 9 actions: listCycles, getCycleDetail, createCycle, updateCycle, transitionCycle, extendCycle, uploadCongVan, sendInvitation + types
  </behavior>
  <action>
    1. Create upload-cong-van.ts theo spec — careful with magic byte check (read 5 bytes after arrayBuffer)
    2. Create send-invitation.ts với Map rate limit + Zod
    3. Create index.ts barrel
    4. Run npx tsc --noEmit
    5. Smoke (skip if needs auth): mock formData with PDF file in tests dir, call uploadCongVan and verify Attachment created
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "['upload-cong-van','send-invitation','index'].forEach(f=>console.log(f+':',require('fs').existsSync('app/(app)/chuong-trinh/_actions/'+f+'.ts')))" &amp;&amp; npm run build 2&gt;&amp;1 | tail -10</automated>
  </verify>
  <done>
    - All 9 server actions + index barrel exist
    - Magic byte PDF check + 10MB limit + PDF MIME check implemented
    - Rate limit Map for sendInvitation
    - All actions have 'use server' + RBAC dòng đầu + withAuditLog wrap
    - npm run build pass — no SSR/runtime errors
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client → Server Action | Untrusted formData/JSON; Zod parses + RBAC enforces |
| Server Action → Storage filesystem | Trusted but path validation required (cycleId is cuid, storedFileName is UUID — no traversal) |
| Server Action → Prisma | Trusted; Prisma parameterized queries |
| Server Action → Audit log (fire-and-forget) | Best-effort; audit failures don't block business action (PITFALLS audit volume) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-03-01 | E (Elevation) | Direct server action call without RBAC | mitigate | All 9 actions have canFromDB('chuong-trinh', action) on line 1-3 throw VN message; UI is layer 2 only |
| T-03-03-02 | T (State machine bypass) | UI calls update directly skipping state check | mitigate | Updates allow only schema fields not status; status changes ONLY via transitionCycle/extendCycle which validate canTransitionCycle + validateGuards authoritatively (PITFALLS R3) |
| T-03-03-03 | S (Spoofing) | uploadCongVan accepts non-PDF binary | mitigate | Triple validation: file.type === 'application/pdf' + file.size ≤ 10MB + magic byte 0x25504446 (%PDF-) check on first 5 bytes |
| T-03-03-04 | D (Denial) | sendInvitation spammed N times burst | mitigate | In-memory Map rate limit per cycleId, 5-min cooldown; recipientOrgIds.length capped at 50 |
| T-03-03-05 | T (Path traversal) | uploadCongVan filename injected with ../../etc | mitigate | storedFileName = randomUUID() + '.pdf' — original filename only stored in DB metadata, not used in disk path; cycleId is cuid via Zod |
| T-03-03-06 | I (Info disclosure) | Audit log diff captures sensitive content | accept | configJson + invitedOrganizations not sensitive (admin POC scope); contentHtml of email captured but admin-authored content |
| T-03-03-07 | T (Race year unique) | Two simultaneous createCycle for same year | mitigate | Prisma @unique on year column at DB level catches race; Zod async pre-check is just UX nicety |
</threat_model>

<verification>
- All 9 action files exist + index barrel
- Each file starts with 'use server' (verify grep)
- Each file has canFromDB on line 1-5 of body (verify grep)
- Each mutation file has withAuditLog import (verify grep)
- npx tsc --noEmit pass
- npm run build pass
- audit-types.ts has TRANSITION, UPLOAD, DISPATCH, EXTEND in AUDIT_ACTIONS array
</verification>

<success_criteria>
1. 9 server actions tạo đầy đủ, mỗi action 'use server' + RBAC line 1-3 + Zod validation + withAuditLog wrap
2. transitionCycle authoritative: canTransitionCycle + validateGuards check trước khi update status (PITFALLS R3 mitigation lock)
3. uploadCongVan triple-check PDF: MIME type + size ≤10MB + magic byte; save UUID filename không dùng original; create Attachment + link cycle
4. sendInvitation rate-limited 5 min/cycleId + recipient count ≤50 (T-03-04)
5. extendCycle CLOSED→OPEN với reason + newDeadline; configJson lưu lịch sử extension; audit log entry với diff
6. revalidatePath gọi sau mọi mutation để Next 15 cache invalidate
</success_criteria>

<output>
After completion, create `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-03-SUMMARY.md` theo template.
</output>
