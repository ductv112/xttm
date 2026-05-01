---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 07
type: execute
wave: 4
depends_on: [03, 06]
files_modified:
  - app/(app)/chuong-trinh/[id]/_components/CycleActionBar.tsx
  - app/(app)/chuong-trinh/[id]/_components/TransitionDialog.tsx
  - app/(app)/chuong-trinh/[id]/_components/ExtendCycleDialog.tsx
  - app/(app)/chuong-trinh/[id]/_components/CycleDetailHeader.tsx
  - app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx
autonomous: false
requirements:
  - CYCLE-08
  - CYCLE-09
  - CYCLE-10
  - CYCLE-11
tags: [action-buttons, state-transitions, dialogs, workflow-ui]
user_setup: []

must_haves:
  truths:
    - "CycleActionBar render trong header right side, hiển thị action buttons theo trạng thái cycle hiện tại + permission của user"
    - "DRAFT: button 'Hoàn thành cấu hình' (chuyển → READY) — disabled với tooltip nếu validateGuards fail"
    - "READY: button 'Mở cổng nhận đăng ký' (→ OPEN) — disabled tooltip nếu chưa có công văn upload"
    - "OPEN_REGISTRATION: 2 buttons 'Đóng cổng' + 'Gửi thông báo bổ sung' (dispatch via composer in tab)"
    - "CLOSED_REGISTRATION: 2 buttons 'Mở lại để gia hạn' (opens ExtendCycleDialog) + 'Chuyển sang thẩm định'"
    - "EVALUATING+: read-only — message 'Phase 7 sẽ xử lý' hiển thị thay action buttons"
    - "ProgramCycleStateMachineVisual onTransitionClick wired qua TongQuanTab — click vào reachable node opens TransitionDialog"
    - "All transition actions show ConfirmDialog với VN message + audit log captured automatically (Plan 03-03 wraps)"
  artifacts:
    - path: "app/(app)/chuong-trinh/[id]/_components/CycleActionBar.tsx"
      provides: "Action button bar rendered theo cycle.status với permissions"
      exports: ["CycleActionBar"]
      min_lines: 130
    - path: "app/(app)/chuong-trinh/[id]/_components/TransitionDialog.tsx"
      provides: "Confirmation dialog cho state transition (non-extend) với VN message theo target"
      exports: ["TransitionDialog"]
      min_lines: 80
    - path: "app/(app)/chuong-trinh/[id]/_components/ExtendCycleDialog.tsx"
      provides: "Form dialog gia hạn cycle với reason textarea + newDeadline date picker"
      exports: ["ExtendCycleDialog"]
      min_lines: 100
  key_links:
    - from: "app/(app)/chuong-trinh/[id]/_components/CycleActionBar.tsx"
      to: "lib/workflows/programCycle.ts"
      via: "ALLOWED_NEXT_STATES + validateGuards (read-only checks for UI hint)"
      pattern: "ALLOWED_NEXT_STATES"
    - from: "app/(app)/chuong-trinh/[id]/_components/TransitionDialog.tsx"
      to: "app/(app)/chuong-trinh/_actions/transition"
      via: "transitionCycle server action call"
      pattern: "transitionCycle"
    - from: "app/(app)/chuong-trinh/[id]/_components/ExtendCycleDialog.tsx"
      to: "app/(app)/chuong-trinh/_actions/extend"
      via: "extendCycle server action call"
      pattern: "extendCycle"
---

<objective>
Wire action buttons + transition dialogs vào detail page hoàn thiện vòng đời chu kỳ. Plan này khép kín 4 requirement còn lại của Phase 3 (CYCLE-08/09/10/11) và làm cho state machine có thực sự dùng được — không chỉ hiển thị visual.

Purpose:
- Plan 03-06 setup detail page shell + tabs nhưng chỉ render hiển thị; Plan 03-07 thêm interaction layer (action buttons + dialogs)
- ProgramCycleStateMachineVisual onTransitionClick prop wired tại đây (Plan 03-02 component đã có prop nhưng chưa wire)
- Header right side hiển thị contextual action bar — đây là điểm trông quan trọng cho demo BQL flow

Output: 3 component mới + update CycleDetailHeader + update TongQuanTab; ~350 LOC tổng. Plan 03-06 modifications minimal — chỉ pass action handlers xuống.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-CONTEXT.md
@components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx
@components/shared/ConfirmDialog.tsx
@lib/workflows/programCycle.ts

<interfaces>
From Plan 03-01 lib/workflows/programCycle.ts:
- ALLOWED_NEXT_STATES(status): ProgramCycleStatus[]
- validateGuards(cycle, target): { ok, reason? }
- CYCLE_STATUS_LABELS

From Plan 03-03 server actions:
- transitionCycle(input: { cycleId, target, reason? }): Promise of { id, fromStatus, toStatus }
- extendCycle(input: { cycleId, reason, newDeadline }): Promise of { id, newDeadline, fromStatus, toStatus }

From Plan 03-06 detail page:
- CycleDetail type from getCycleDetail (has cycle.status, cycle.invitationLetterAttachmentId, cycle.registrationCloseAt, etc.)
- Components rendered in layout/page: CycleDetailHeader (header right side has placeholder for actions), TongQuanTab (renders state machine visual)

From Phase 2:
- ConfirmDialog ({open, onOpenChange, title, description, variant, confirmLabel, onConfirm, loading?})
- shadcn AlertDialog primitives + Dialog primitives
- Form, Input, Textarea, Calendar, Popover from shadcn ui
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: CycleActionBar component với conditional buttons theo status</name>
  <files>app/(app)/chuong-trinh/[id]/_components/CycleActionBar.tsx</files>
  <behavior>
    - 'use client'; props: { cycle: CycleDetail; canEdit: boolean }
    - Define ACTION_CONFIGS lookup: per ProgramCycleStatus → array of { key: string; label: string; target: ProgramCycleStatus | 'EXTEND'; variant: 'default' | 'outline' | 'destructive'; guard?: (cycle) => string | null (return error message if disabled, null if enabled) }
    - DRAFT: [{ key:'to-ready', label:'Hoàn thành cấu hình', target:'READY', variant:'default', guard: c => (c.registrationOpenAt && c.registrationCloseAt) ? null : 'Vui lòng cấu hình mốc thời gian trước'}]
    - READY: [{ key:'open-cong', label:'Mở cổng nhận đăng ký', target:'OPEN_REGISTRATION', variant:'default', guard: c => c.invitationLetterAttachmentId ? null : 'Vui lòng upload công văn ban hành ở tab Công văn trước'}]
    - OPEN_REGISTRATION: [{ key:'close-cong', label:'Đóng cổng đăng ký', target:'CLOSED_REGISTRATION', variant:'outline'}, {key:'send-update', label:'Gửi thông báo cập nhật', target:'NOOP-NOTIFY', variant:'outline'}] — second button is link to /don-vi-moi tab anchor
    - CLOSED_REGISTRATION: [{ key:'extend', label:'Mở lại để gia hạn', target:'EXTEND', variant:'outline'}, {key:'to-evaluating', label:'Chuyển sang thẩm định', target:'EVALUATING', variant:'default'}]
    - EVALUATING / APPROVED / COMPLETED: [] empty array; render banner "Chu kỳ đang ở trạng thái {label} — Phase 7 sẽ xử lý" (chip text-sm text-slate-500)
    - State: open dialog flag for which action; pendingTarget: ProgramCycleStatus | 'EXTEND' | null
    - Render: <div className="flex items-center gap-2">
      - If actions empty + status >= EVALUATING, render <Chip /> banner instead of buttons
      - Else for each config, render <Button variant={config.variant} disabled={config.guard?.(cycle) != null OR !canEdit}>{config.label}</Button>; nếu disabled, wrap với Tooltip showing guard message
    - On button click:
      - If config.target === 'EXTEND' → setExtendDialogOpen(true)
      - If config.target === 'NOOP-NOTIFY' → router.push('/chuong-trinh/' + cycle.id + '/don-vi-moi')
      - Else → setPendingTarget(config.target); setTransitionDialogOpen(true)
    - Render <TransitionDialog open={...} cycle={cycle} target={pendingTarget} onClose={...} /> + <ExtendCycleDialog open={...} cycle={cycle} onClose={...} />
    - On any dialog success → router.refresh() để re-fetch cycle data
  </behavior>
  <action>
    1. Create CycleActionBar.tsx
    2. tsc --noEmit
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "console.log(require('fs').existsSync('app/(app)/chuong-trinh/[id]/_components/CycleActionBar.tsx'))"</automated>
  </verify>
  <done>
    - CycleActionBar có conditional buttons theo 7 status
    - Tooltip showing guard message khi disabled
    - Each button triggers appropriate dialog or redirect
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: TransitionDialog (confirm transitions ngoài extend)</name>
  <files>app/(app)/chuong-trinh/[id]/_components/TransitionDialog.tsx</files>
  <behavior>
    - 'use client'; props: { open: boolean; onOpenChange: (v: boolean) => void; cycle: CycleDetail; target: ProgramCycleStatus | null }
    - Use shadcn AlertDialog (or wrap Phase 2 ConfirmDialog imperatively but for variability prefer custom AlertDialog here for richer message)
    - Compute message dynamically per target:
      - target='READY': title "Hoàn thành cấu hình chu kỳ?" body "Sau khi chuyển sang trạng thái Sẵn sàng, bạn cần upload công văn ban hành để có thể mở cổng nhận đăng ký. Tiếp tục?"
      - target='OPEN_REGISTRATION' (from READY): title "Mở cổng nhận đăng ký?" body "Sau khi mở cổng, các đơn vị chủ trì có thể bắt đầu nộp đề án từ {formatDate(registrationOpenAt)} đến {formatDate(registrationCloseAt)}. Hành động này sẽ thông báo đến danh sách đơn vị mời. Tiếp tục?"
      - target='CLOSED_REGISTRATION': title "Đóng cổng đăng ký?" body "Đơn vị chủ trì sẽ không thể nộp đề án mới. Bạn có thể gia hạn (mở lại) sau khi đóng. Tiếp tục?"
      - target='EVALUATING': title "Chuyển sang thẩm định?" body "Tất cả đề án đã nộp sẽ được chuyển vào quy trình thẩm định (Phase 7). Sau bước này không thể quay lại trạng thái cổng đăng ký. Tiếp tục?"
    - Confirm button: variant='default' (or 'destructive' for CLOSED), label theo action
    - On confirm: useTransition(() => { try { await transitionCycle({cycleId: cycle.id, target}); toast.success('Đã chuyển trạng thái sang ' + CYCLE_STATUS_LABELS[target]); onOpenChange(false); router.refresh(); } catch (e) { toast.error(e.message); } })
    - Auto-fetch send invitation prompt: cho transition READY→OPEN_REGISTRATION, after success show secondary toast "Gửi thông báo mời đăng ký?" với button "Gửi ngay" → redirect /don-vi-moi tab; defer for v1: just show success toast.
  </behavior>
  <action>
    1. Create TransitionDialog
    2. tsc verify
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "console.log(require('fs').existsSync('app/(app)/chuong-trinh/[id]/_components/TransitionDialog.tsx'))"</automated>
  </verify>
  <done>
    - TransitionDialog renders dynamic messages per target
    - Calls transitionCycle với appropriate target
    - Toast feedback + router.refresh on success
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: ExtendCycleDialog với form reason + newDeadline</name>
  <files>app/(app)/chuong-trinh/[id]/_components/ExtendCycleDialog.tsx</files>
  <behavior>
    - 'use client'; props: { open; onOpenChange; cycle: CycleDetail }
    - shadcn Dialog (not AlertDialog — needs form input)
    - Form using RHF + Zod (ExtendSchema: reason min 10 max 1000 'Lý do tối thiểu 10 ký tự', newDeadline z.date().refine(d => d > Date.now(), 'Ngày hạn mới phải sau ngày hôm nay'))
    - Layout: <DialogContent className="sm:max-w-lg">
      - <DialogHeader><DialogTitle>Mở lại để gia hạn chu kỳ</DialogTitle><DialogDescription>Sau khi gia hạn, đơn vị chủ trì có thể nộp đề án trở lại đến hạn mới. Lý do gia hạn sẽ được ghi vào nhật ký truy cập.</DialogDescription></DialogHeader>
      - Form fields:
        - reason Textarea label "Lý do gia hạn *" placeholder "Ví dụ: Theo đề xuất của các hiệp hội ngành hàng, gia hạn thêm 14 ngày để chuẩn bị hồ sơ chu đáo hơn" rows={4} với character counter "{n}/1000"
        - newDeadline DatePicker label "Hạn nộp mới *" — calendar inside Popover, disabled past dates via Calendar.disabled prop (disabled past)
      - <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang gia hạn...' : 'Xác nhận gia hạn'}</Button></DialogFooter>
    - On submit: useTransition( async () => { try { const result = await extendCycle({cycleId: cycle.id, reason, newDeadline}); toast.success('Đã gia hạn chu kỳ. Hạn mới: ' + formatDate(newDeadline)); onOpenChange(false); reset form; router.refresh(); /* TODO Phase 11 polish: prompt send notification dispatch */ } catch (e) { toast.error(e.message) } })
    - Auto-clear form on close
  </behavior>
  <action>
    1. Create ExtendCycleDialog với RHF + Zod
    2. tsc verify
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; node -e "console.log(require('fs').existsSync('app/(app)/chuong-trinh/[id]/_components/ExtendCycleDialog.tsx'))"</automated>
  </verify>
  <done>
    - ExtendCycleDialog form với 2 fields validated
    - Calls extendCycle on submit
    - Calendar disabled past dates
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Wire CycleActionBar vào CycleDetailHeader + onTransitionClick vào TongQuanTab</name>
  <files>app/(app)/chuong-trinh/[id]/_components/CycleDetailHeader.tsx, app/(app)/chuong-trinh/[id]/_components/TongQuanTab.tsx</files>
  <behavior>
    - CycleDetailHeader: edit existing component
    - Add prop: cycle (already has) + canEdit boolean
    - In header right side, render <CycleActionBar cycle={cycle} canEdit={canEdit} /> replacing existing placeholder
    - layout.tsx (Plan 03-06) needs to fetch canEdit + pass to CycleDetailHeader — add this here in Plan 03-07: edit layout.tsx if canEdit not passed (cross-plan edit acceptable for wiring)
    - TongQuanTab: edit existing
    - State: pendingTransitionTarget: ProgramCycleStatus | null
    - Pass onTransitionClick prop tới ProgramCycleStateMachineVisual: (target) => setPendingTransitionTarget(target)
    - Render <TransitionDialog open={pendingTransitionTarget != null} onOpenChange={(v) => !v && setPendingTransitionTarget(null)} cycle={cycle} target={pendingTransitionTarget} />
    - This means: clicking reachable node in state machine opens dialog same as clicking action bar button — consistent UX
    - readOnly prop của ProgramCycleStateMachineVisual: pass !canEdit (if user không có edit permission, don't allow transition click)
  </behavior>
  <action>
    1. Read existing CycleDetailHeader.tsx to confirm structure
    2. Edit CycleDetailHeader to render CycleActionBar
    3. Edit TongQuanTab to wire onTransitionClick + render TransitionDialog
    4. Edit layout.tsx (from Plan 03-06) if needed to fetch canEdit + pass to CycleDetailHeader. Consult that file first, ADD canEdit prop pass if missing
    5. tsc + build
    6. Manual smoke (defer to Task 5 checkpoint)
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; npm run build 2&gt;&amp;1 | tail -10</automated>
  </verify>
  <done>
    - CycleDetailHeader hiển thị CycleActionBar with appropriate buttons
    - TongQuanTab wires onTransitionClick → TransitionDialog
    - npm run build pass
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 5: Manual UAT vòng đời lifecycle hoàn chỉnh</name>
  <files>app/(app)/chuong-trinh/[id]/_components/CycleActionBar.tsx, TransitionDialog.tsx, ExtendCycleDialog.tsx</files>
  <action>Manual UAT — drive cycle 2027 qua đầy đủ lifecycle DRAFT → READY → OPEN → CLOSED → OPEN (extend) → CLOSED → EVALUATING; verify state machine visual click + audit entries + DONVI permission gating</action>
  <verify><automated>echo "Manual checkpoint — see how-to-verify"</automated></verify>
  <done>User type "approved" hoặc record issues; cycle 2027 final state EVALUATING với ≥4 audit entries</done>
  <what-built>Action handlers wired vào detail page: CycleActionBar header với buttons theo status, TransitionDialog confirm cho 4 transitions, ExtendCycleDialog cho gia hạn CLOSED→OPEN. State machine visual click reachable node = same UX as click button. Toàn bộ Phase 3 HERO flow vận hành end-to-end.</what-built>
  <how-to-verify>
    1. npm run dev; login banql
    2. Visit cycle 2027 (DRAFT): tab Tổng quan visual show DRAFT ring + READY emerald reachable; action bar show "Hoàn thành cấu hình" button DISABLED với tooltip "Vui lòng cấu hình mốc thời gian trước". Click tab Cấu hình kỳ → fill registrationOpenAt + registrationCloseAt → save. Quay lại Tổng quan: button now enabled. Click → TransitionDialog opens "Hoàn thành cấu hình chu kỳ?" → confirm → toast 'Đã chuyển trạng thái sang Sẵn sàng' → page refresh. Visual now shows READY ring.
    3. (continue 2027 cycle): action bar show "Mở cổng nhận đăng ký" DISABLED tooltip "Vui lòng upload công văn ban hành ở tab Công văn trước". Visit tab Công văn → upload mock PDF (any small PDF file from disk) + fill metadata → submit. Quay lại Tổng quan: button enabled → click → confirm dialog → toast 'Đã chuyển trạng thái sang Đang mở đăng ký' → visual shows OPEN ring + CLOSED emerald reachable.
    4. (cycle 2027 OPEN): action bar show "Đóng cổng đăng ký" + "Gửi thông báo cập nhật". Click "Gửi thông báo cập nhật" → redirect /don-vi-moi tab. Quay lại Tổng quan; click "Đóng cổng đăng ký" → confirm → toast → CLOSED.
    5. (cycle 2027 CLOSED): action bar show "Mở lại để gia hạn" + "Chuyển sang thẩm định". Click "Mở lại để gia hạn" → ExtendCycleDialog opens. Fill reason "Test gia hạn — UAT Phase 3" + newDeadline +14 days → confirm → toast 'Đã gia hạn chu kỳ. Hạn mới: ...' → visual back to OPEN ring.
    6. Click "Chuyển sang thẩm định" (after closing again): confirm dialog → success → visual EVALUATING ring + action bar replaced with banner "Chu kỳ đang ở trạng thái Đang thẩm định — Phase 7 sẽ xử lý"
    7. Open cycle 2026 OPEN_REGISTRATION (existing seed): in state machine visual, click CLOSED_REGISTRATION node (reachable) → TransitionDialog opens → cancel. Verify same UX as clicking action bar button.
    8. Login as donvi1: visit /chuong-trinh/{cycle 2026} → action bar buttons HIDDEN (canEdit=false), state machine readOnly (click không trigger dialog), tabs tabs nav still visible
    9. Visit tab Nhật ký after lifecycle steps: verify entries TRANSITION (4-5 entries), EXTEND (1 entry với reason captured), UPLOAD (1 entry from step 3), CREATE (seed)
  </how-to-verify>
  <resume-signal>Type "approved" hoặc "issues: ..."</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Action button click → server action | UI guard is layer 2; transitionCycle/extendCycle (Plan 03-03) authoritative RBAC + state validation |
| State machine onTransitionClick → server action | Same as button — server validates everything |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-07-01 | E (Elevation) | DONVI sees action buttons | mitigate | CycleActionBar reads canEdit prop (false for DONVI) → buttons not rendered; state machine visual readOnly={!canEdit} ignores click |
| T-03-07-02 | T (Bypassing UI guards) | User crafts URL or DevTools to call transitionCycle directly | mitigate | Server action validates RBAC + canTransitionCycle + validateGuards authoritatively (Plan 03-03 line 1-3) — UI guard is convenience |
| T-03-07-03 | I (Reason text leak) | extendCycle reason captured in audit log | accept | Reason is admin-authored, audit log accessible only to admin/lanhdao roles per Phase 2 RBAC |
| T-03-07-04 | D (Rapid transition spam) | User clicks transition button rapidly | mitigate | useTransition isPending + button disabled during pending; server action idempotent — second call sees status already changed, throws "Không thể chuyển từ X sang Y" |
</threat_model>

<verification>
- All 5 files (3 new + 2 modified) — verify creates exist + edits applied
- npx tsc --noEmit pass
- npm run build pass
- Each dialog uses appropriate shadcn primitive (AlertDialog for confirm-only, Dialog for form-input ExtendCycle)
- Manual UAT 9 steps all pass
- Lifecycle test: DRAFT → READY → OPEN → CLOSED → OPEN (extend) → CLOSED → EVALUATING — full transition chain works
</verification>

<success_criteria>
1. CycleActionBar render contextual buttons theo status với guard tooltips (CYCLE-08/09/11)
2. TransitionDialog confirm với VN message dynamic per target
3. ExtendCycleDialog form gia hạn với reason + newDeadline (CYCLE-10) — calls extendCycle, audit log capture reason
4. ProgramCycleStateMachineVisual onTransitionClick wired tại TongQuanTab — click reachable node = same UX as button
5. canEdit từ layout.tsx được pass đúng — DONVI không thấy buttons, BANQL/Admin thấy
6. router.refresh() sau mỗi transition để page render trạng thái mới
7. Toàn bộ lifecycle DRAFT → COMPLETED test được trên cycle 2027 (test cycle); cycle 2026 vẫn ở OPEN_REGISTRATION cho demo
</success_criteria>

<output>
After completion, create `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-07-SUMMARY.md` theo template.
</output>
