---
phase: 03-m2.1-chu-kỳ-chương-trình-xttm
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx
  - components/shared/program-cycle/Stepper.tsx
  - components/shared/program-cycle/StatCard.tsx
  - components/shared/program-cycle/index.ts
  - components/shared/program-cycle/types.ts
autonomous: false
requirements:
  - CYCLE-06
tags: [react-flow, visual-state-machine, stepper, stat-card, hero-visual, design-system]
user_setup: []

must_haves:
  truths:
    - "ProgramCycleStateMachineVisual render 7 nodes ngang theo dòng thời gian, current state có ring blue-700 + pulse animation"
    - "Stepper render N steps với states completed/current/upcoming, click vào completed step trigger callback"
    - "StatCard render label + value + optional trend/icon, dùng cho Tab Tổng quan 4-card grid"
    - "@xyflow/react installed and working with no SSR hydration mismatch"
    - "All 3 components are 'use client' với typed props using Plan 03-01 ProgramCycleStatus type"
  artifacts:
    - path: "components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx"
      provides: "React Flow 7-node horizontal state machine với current highlight + transition edges"
      exports: ["ProgramCycleStateMachineVisual"]
      min_lines: 200
    - path: "components/shared/program-cycle/Stepper.tsx"
      provides: "5-step wizard stepper clickable với progress visualization"
      exports: ["Stepper"]
      min_lines: 80
    - path: "components/shared/program-cycle/StatCard.tsx"
      provides: "Statistics card với value + label + icon + optional change indicator"
      exports: ["StatCard"]
      min_lines: 50
  key_links:
    - from: "components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx"
      to: "lib/workflows/programCycle.ts"
      via: "import TRANSITIONS + CYCLE_STATUS_LABELS + CYCLE_STATUS_BADGE_THEME"
      pattern: "from '@/lib/workflows/programCycle'"
    - from: "components/shared/program-cycle/Stepper.tsx"
      to: "design system slate/blue palette"
      via: "Tailwind classes per UI-SPEC Phase 1"
      pattern: "bg-blue-700|text-blue-700|bg-slate-100"
---

<objective>
Xây 3 visual components reusable đặc thù Phase 3 HERO mà mọi plan downstream cần consume:
1. **ProgramCycleStateMachineVisual** — React Flow diagram 7 nodes ngang (DRAFT→READY→OPEN→CLOSED→EVALUATING→APPROVED→COMPLETED) với current state glow ring + pulse, transitions có sẵn highlight; render trên Tab Tổng quan của detail page (Plan 03-06) — đây là wow factor cho IT audience
2. **Stepper** — 5-step horizontal stepper với clickable completed steps + current ring + upcoming muted; render trên Wizard 5 bước (Plan 03-04)
3. **StatCard** — card hiển thị statistics đơn giản (label + value + icon + optional trend); render 4-col grid trên Tab Tổng quan (Plan 03-06) — số đề án, tổng kinh phí, số đơn vị, ngày còn lại countdown

Purpose:
- Tách visual primitives thành Wave 1 độc lập với schema/server actions để parallel với Plan 03-01
- Mọi component là 'use client' và parameterized — Plan 03-04+ chỉ pass props, không phải build từ scratch
- React Flow setup correct trong Next 15 App Router (SSR safe — render only after mount để tránh hydration mismatch — phải xử lý đúng tại đây để Plan 03-06 không phải debug)

Output: 3 components ~200+80+50 LOC + barrel export + types file ~20 LOC, all production-ready với design system slate/blue 60/30/10 từ UI-SPEC Phase 1.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-CONTEXT.md
@.planning/phases/01-m0-bootstrap-h-t-ng/01-UI-SPEC.md
@components/shared/StatusBadge.tsx
@components/shared/EmptyState.tsx
@lib/utils.ts
@CLAUDE.md

<interfaces>
<!-- Phase 3 visual components consume Plan 03-01 outputs (parallel wave — types lock at start). -->

From lib/workflows/programCycle.ts (Plan 03-01 will provide; Plan 03-02 imports as types):
```typescript
export type ProgramCycleStatus = 'DRAFT' | 'READY' | 'OPEN_REGISTRATION' | 'CLOSED_REGISTRATION'
  | 'EVALUATING' | 'APPROVED' | 'COMPLETED';
export const TRANSITIONS: Record<ProgramCycleStatus, ProgramCycleStatus[]>;
export const CYCLE_STATUS_LABELS: Record<ProgramCycleStatus, string>;
export const CYCLE_STATUS_BADGE_THEME: Record<ProgramCycleStatus, 'slate'|'blue'|'green'|'amber'|'emerald'|'slateDark'>;
```

NOTE: Wave 1 parallelism — Plan 03-02 may run BEFORE Plan 03-01 finishes. To avoid blocking, Plan 03-02 defines local fallback constants if @/lib/workflows/programCycle imports fail; verification step runs AFTER both plans done. In practice, executor should run 03-01 first within the wave (sequential within agent).

From lib/utils.ts:
```typescript
export function cn(...inputs: ClassValue[]): string;
```

Tailwind v4 design tokens (UI-SPEC Phase 1):
- text-sm (14px) body, text-base (16px) subheading, text-2xl (24px) heading, text-4xl (36px) display
- weights 400 / 600 / 700
- slate scale: 50/100/200/600/700/900 — dominant 60% / secondary 30%
- blue-700 accent (10%) — current state ring + active stepper
- green-600 success, amber-500 warning, red-600 destructive (reserved)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Install @xyflow/react + types file + Stepper + StatCard (no React Flow yet)</name>
  <files>package.json, components/shared/program-cycle/types.ts, components/shared/program-cycle/Stepper.tsx, components/shared/program-cycle/StatCard.tsx, components/shared/program-cycle/index.ts</files>
  <behavior>
    - Install @xyflow/react latest stable (^12.x.x — 2026-04 stable line) qua `npm install @xyflow/react`
    - Verify package.json updated; @xyflow/react has peer deps react@^18 || ^19 (Phase 1 dùng React 19) — should resolve clean
    - Create components/shared/program-cycle/types.ts: export interface StepperStep { id: string; label: string; description?: string }; export type StepStatus = 'completed' | 'current' | 'upcoming'; export interface StatCardProps { label: string; value: string | number; icon?: LucideIcon; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'; subtitle?: string; trend?: { direction: 'up' | 'down' | 'flat'; label: string } }
    - Create components/shared/program-cycle/Stepper.tsx ('use client'):
      - Props: { steps: StepperStep[]; currentIndex: number; onStepClick?: (index: number) => void; orientation?: 'horizontal' | 'vertical' (default horizontal); className?: string }
      - Layout horizontal: flex with gap-0 connecting circles + lines; mỗi step = circle 40px (h-10 w-10 rounded-full) + label below
      - Step status logic: index < currentIndex → 'completed' (bg-blue-700 text-white với check icon Lucide CheckIcon 18px), index === currentIndex → 'current' (bg-blue-700 text-white với ring-4 ring-blue-200 + step number 14px font-semibold), index > currentIndex → 'upcoming' (bg-slate-100 text-slate-500 với step number)
      - Connecting line giữa steps: h-0.5 flex-1 bg-blue-700 nếu step trước đã completed, bg-slate-200 nếu chưa
      - Label below circle: text-sm font-semibold text-slate-900 nếu current, text-sm text-slate-600 nếu completed, text-sm text-slate-400 nếu upcoming
      - Description (nếu có): text-sm text-slate-500 line-2 dưới label
      - Click handler: cho phép click vào completed steps (index < currentIndex) gọi onStepClick(index); click upcoming steps DISABLED (cursor-not-allowed)
      - Vertical orientation: stack flex-col gap-3, circle bên trái + label bên phải; line vertical w-0.5 ở giữa
      - Aria: role="tablist" cho parent, role="tab" + aria-current="step" cho current
    - Create components/shared/program-cycle/StatCard.tsx ('use client' OK but pure render — could be RSC; mark 'use client' for safety nếu icon imports cần):
      - Layout: rounded-lg border border-slate-200 bg-white p-6 flex items-start justify-between gap-4
      - Left: label text-sm text-slate-600 + value text-2xl font-bold text-slate-900 mt-2 + optional subtitle text-sm text-slate-500 mt-1
      - Right: nếu icon, render `<Icon size={32} className={cn('text-slate-400', tone === 'success' && 'text-green-600', tone === 'warning' && 'text-amber-500', tone === 'danger' && 'text-red-600', tone === 'info' && 'text-blue-700')} />`
      - Trend: nếu trend, render below value, flex items-center gap-1: TrendingUp/TrendingDown/Minus icon 14px + label text-sm; color theo direction (up=green-600, down=red-600, flat=slate-500)
      - Format value: nếu number, dùng formatNumber from @/lib/format; nếu string, render as-is — caller responsibility format trước
    - Create components/shared/program-cycle/index.ts barrel export: re-export Stepper, StatCard, StatCardProps, StepperStep, StepStatus
  </behavior>
  <action>
    1. Run `npm install @xyflow/react` (latest stable, e.g. ^12.4.x)
    2. Verify install: `npx tsc --noEmit` should still pass
    3. Create types.ts with 3 type exports
    4. Create Stepper.tsx — use Lucide CheckIcon từ 'lucide-react'
    5. Create StatCard.tsx — import LucideIcon type from 'lucide-react'
    6. Create index.ts barrel
    7. Smoke test render: tạo file scratch d:/Thaodnp/XTTM/scratch-stepper-test.tsx (tạm thời, không commit) import Stepper + render trong test page hoặc skip nếu khó setup; thay vào đó verify qua tsc
    8. Run `npx tsc --noEmit` — all pass
  </action>
  <verify>
    <automated>npm install @xyflow/react &amp;&amp; npx tsc --noEmit &amp;&amp; node -e "const fs=require('fs');console.log('Stepper:',fs.existsSync('components/shared/program-cycle/Stepper.tsx'));console.log('StatCard:',fs.existsSync('components/shared/program-cycle/StatCard.tsx'));console.log('types:',fs.existsSync('components/shared/program-cycle/types.ts'));console.log('index:',fs.existsSync('components/shared/program-cycle/index.ts'));console.log('xyflow:',fs.existsSync('node_modules/@xyflow/react/package.json'))"</automated>
  </verify>
  <done>
    - @xyflow/react in package.json + node_modules
    - Stepper.tsx, StatCard.tsx, types.ts, index.ts all exist
    - tsc --noEmit pass — Stepper/StatCard typed correctly với props
    - Index barrel exports Stepper + StatCard + types
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: ProgramCycleStateMachineVisual (React Flow 7-node horizontal state machine)</name>
  <files>components/shared/program-cycle/ProgramCycleStateMachineVisual.tsx, components/shared/program-cycle/index.ts</files>
  <behavior>
    - Component file ProgramCycleStateMachineVisual.tsx ('use client' bắt buộc — React Flow needs DOM):
      - Props: { currentStatus: ProgramCycleStatus; onTransitionClick?: (target: ProgramCycleStatus) => void; readOnly?: boolean; height?: number (default 280) }
      - Import { ProgramCycleStatus, TRANSITIONS, CYCLE_STATUS_LABELS, CYCLE_STATUS_BADGE_THEME } từ '@/lib/workflows/programCycle'
      - Import { ReactFlow, Background, ReactFlowProvider, type Node, type Edge, MarkerType } từ '@xyflow/react'
      - Import '@xyflow/react/dist/style.css' (one-time css import — Plan 03-02 owns)
      - Define const NODE_LAYOUT: Record<ProgramCycleStatus, { x: number; y: number }> với 7 nodes ngang dòng:
        DRAFT: {x: 0, y: 80}, READY: {x: 180, y: 80}, OPEN_REGISTRATION: {x: 360, y: 80},
        CLOSED_REGISTRATION: {x: 540, y: 80}, EVALUATING: {x: 720, y: 80},
        APPROVED: {x: 900, y: 80}, COMPLETED: {x: 1080, y: 80}
      - Build nodes via useMemo: 7 nodes type='default', position từ NODE_LAYOUT, data: { label: CYCLE_STATUS_LABELS[status], status, isCurrent: status === currentStatus, isReachable: TRANSITIONS[currentStatus]?.includes(status) ?? false, theme: CYCLE_STATUS_BADGE_THEME[status] }; class names: width 140px, padding 12px, border-2 rounded-lg cursor-default; current state: ring-4 ring-blue-200 border-blue-700 bg-blue-50 text-blue-900 + animate-pulse on the ring (CSS class .animate-pulse-ring tự define inline); reachable next state: border-emerald-500 bg-emerald-50 cursor-pointer hover:bg-emerald-100; other states: border-slate-200 bg-slate-50 text-slate-500
      - Build edges via useMemo: iterate over TRANSITIONS keys, for each [from, [to1, to2,...]] tạo edge { id: `${from}->${to}`, source: from, target: to, animated: from === currentStatus (highlight outgoing edges from current), markerEnd: { type: MarkerType.ArrowClosed, color: from === currentStatus ? '#1d4ed8' : '#94a3b8' }, style: { stroke: from === currentStatus ? '#1d4ed8' : '#cbd5e1', strokeWidth: from === currentStatus ? 2.5 : 1.5 }, label: optional empty string }
      - SSR safety: useEffect setMounted(true) sau khi mount; if (!mounted) return <div className="h-{height}px bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-sm">Đang tải sơ đồ trạng thái...</div>; chỉ render <ReactFlow> sau mount để tránh hydration mismatch
      - ReactFlow props: nodes, edges, fitView, fitViewOptions={padding:0.2}, nodesDraggable={false}, nodesConnectable={false}, edgesFocusable={false}, panOnDrag={false}, zoomOnScroll={false}, zoomOnPinch={false}, panOnScroll={false}, preventScrolling={false}, proOptions={hideAttribution: true} — visualization purpose only, không cho user manipulate; minHeight={height}
      - Background variant="dots" gap={16} size={1} color="#e2e8f0" (slate-200)
      - Wrap với <ReactFlowProvider> để safe nesting
      - Node click handler (onNodeClick): if !readOnly && node.data.isReachable && onTransitionClick → onTransitionClick(node.data.status); show subtle hover lift via shadow trên reachable nodes
      - Custom node component: tạo function CycleNode({ data }: NodeProps<{ label: string; status: ProgramCycleStatus; isCurrent: boolean; isReachable: boolean; theme: string }>) render div với className conditional; show small badge dưới label tiếng Việt cho theme info: 'Hiện tại' (current) / 'Có thể chuyển' (reachable) / undefined (other) với text-xs (waiver — chỉ legend visual, không affect Phase 1 typography rule cho main UI)
      - Register custom node type: nodeTypes={{ default: CycleNode }} via useMemo (avoid React Flow warning)
      - Add legend below diagram: small flex row gap-4 với 3 dots (blue=Hiện tại, emerald=Có thể chuyển sang, slate=Trạng thái khác) text-sm text-slate-600
    - Update components/shared/program-cycle/index.ts: append export { ProgramCycleStateMachineVisual } from './ProgramCycleStateMachineVisual'
    - Smoke test: tạo temporary page app/(app)/dev/state-machine-test/page.tsx (DEV only, sẽ delete sau task) render <ProgramCycleStateMachineVisual currentStatus="OPEN_REGISTRATION" />; visit http://localhost:3000/dev/state-machine-test sau npm run dev; expect: 7 nodes hiển thị, OPEN_REGISTRATION có ring blue, CLOSED_REGISTRATION có border emerald (reachable from OPEN), edges from OPEN highlighted
  </behavior>
  <action>
    1. Read import patterns trong @xyflow/react v12 docs: import từ '@xyflow/react' (not 'reactflow' v11 path); base CSS '@xyflow/react/dist/style.css' import 1 lần
    2. Create ProgramCycleStateMachineVisual.tsx theo behavior spec
    3. Update components/shared/program-cycle/index.ts để re-export
    4. Run `npx tsc --noEmit` — all pass
    5. Run `npm run build` — verify @xyflow/react bundle splits correctly không vỡ build
    6. (Optional smoke) Create app/(app)/dev/state-machine-test/page.tsx + visit qua `npm run dev`; verify visual render đúng — DELETE file sau verify
    7. Commit incrementally
  </action>
  <verify>
    <automated>npx tsc --noEmit &amp;&amp; npm run build 2&gt;&amp;1 | tail -20</automated>
  </verify>
  <done>
    - ProgramCycleStateMachineVisual.tsx exists, 'use client' directive, exports component
    - index.ts re-exports
    - tsc --noEmit pass
    - npm run build pass với @xyflow/react chunked correctly (no SSR error)
    - Manual visual smoke (if time): render ở /dev/state-machine-test page với currentStatus='OPEN_REGISTRATION' shows 7 nodes, ring blue trên OPEN, edges from OPEN→CLOSED highlighted blue 2.5px
  </done>
</task>

<task type="checkpoint:human-verify" gate="non-blocking">
  <name>Task 3: Visual smoke test 3 components (manual UAT)</name>
  <files>app/(app)/dev/components-test/page.tsx (temporary, delete after verify)</files>
  <action>Manual UAT — render 3 components in sandbox page; verify visual đúng spec UI-SPEC Phase 1; delete sandbox sau khi xong</action>
  <verify><automated>echo "Manual checkpoint — see how-to-verify"</automated></verify>
  <done>User type "approved" hoặc record issues</done>
  <what-built>3 visual primitives sẵn sàng cho Plan 03-04+: Stepper (5-step horizontal), StatCard (label+value+icon), ProgramCycleStateMachineVisual (React Flow 7-node với current state ring + reachable highlight)</what-built>
  <how-to-verify>
    1. (Tự động — đã chạy trong Task 1+2) tsc + build pass
    2. (Manual — opt-in) Run `npm run dev`, tạo trang sandbox `app/(app)/dev/components-test/page.tsx` import 3 components và render lần lượt:
       - <Stepper steps={[{id:'1',label:'Thông tin chung'},{id:'2',label:'Mốc thời gian'},{id:'3',label:'Tiêu chí'},{id:'4',label:'Đơn vị mời'},{id:'5',label:'Xem lại'}]} currentIndex={2} />
       - <div className="grid grid-cols-4 gap-4"><StatCard label="Số đề án" value={12} subtitle="Trong kỳ 2026" /><StatCard label="Tổng kinh phí" value="95 tỷ VND" tone="info" /><StatCard label="Đơn vị mời" value="5" subtitle="3 đã phản hồi" /><StatCard label="Còn lại" value="12 ngày" tone="warning" /></div>
       - <ProgramCycleStateMachineVisual currentStatus="OPEN_REGISTRATION" onTransitionClick={(t)=>alert('Click '+t)} />
    3. Verify visually: Stepper step 3 highlighted với ring; StatCards layout 4 columns desktop; State machine 7 nodes với OPEN_REGISTRATION ring blue + animation, CLOSED_REGISTRATION emerald border (reachable click), edge OPEN→CLOSED highlighted blue
    4. Click CLOSED_REGISTRATION node → alert "Click CLOSED_REGISTRATION" trigger
    5. Resize window mobile width — Stepper vẫn render OK (waiver — Phase 1 layout 1366×768 baseline)
    6. Delete /dev/components-test/ folder sau verify
  </how-to-verify>
  <resume-signal>Type "approved" hoặc "issues: ..."</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client component → React Flow lib | Trusted — visualization only, no user input flows back to server |
| StatCard value prop | Caller responsible for sanitizing — JSX auto-escapes string values |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-02-01 | I (Info disclosure) | StateMachineVisual reveals all 7 states to all roles | accept | All roles seeing the same state machine is intentional — labels are public domain knowledge ("Đang mở đăng ký"); no sensitive data in node labels |
| T-03-02-02 | T (Tampering) | onTransitionClick handler trusted to call server action | mitigate | Plan 03-07 wires onTransitionClick → server action which validates RBAC + canTransitionCycle authoritatively; UI click is convenience only |
| T-03-02-03 | D (Denial) | React Flow heavy lib (~150KB) bundled in client | accept | POC scope — performance audit deferred to Phase 11; lazy-load via dynamic import deferred |
| T-03-02-04 | S (Spoofing) | Custom node component receives untyped data | mitigate | TypeScript NodeProps&lt;T&gt; generics enforce data shape; theme/status validated via CYCLE_STATUS_BADGE_THEME lookup (returns undefined for invalid status — defensive default to 'slate') |
</threat_model>

<verification>
- npm install @xyflow/react exits 0; package.json contains "@xyflow/react"
- components/shared/program-cycle/{Stepper,StatCard,ProgramCycleStateMachineVisual,types,index}.tsx — 5 files exist
- All component files have 'use client' directive (or RSC-safe rendering for StatCard)
- npx tsc --noEmit pass
- npm run build pass; @xyflow/react chunk created in .next output
- Stepper: grep "role=\"tablist\"" hit
- ProgramCycleStateMachineVisual: grep "ReactFlowProvider" hit; grep "TRANSITIONS" hit (uses workflow constant, not hardcoded)
- index.ts: grep "ProgramCycleStateMachineVisual\\|Stepper\\|StatCard" — all 3 exports present
</verification>

<success_criteria>
1. @xyflow/react installed; npm run build và npx tsc --noEmit pass
2. Stepper component render N steps với 3 states completed/current/upcoming, completed steps clickable, design tokens slate/blue khớp UI-SPEC Phase 1
3. StatCard render label + value + optional icon/trend/subtitle với 5 tone options (default/success/warning/danger/info) — palette đúng UI-SPEC
4. ProgramCycleStateMachineVisual render 7 horizontal nodes via React Flow, current state có ring blue-700 + animate-pulse, reachable nodes border emerald-500 với hover effect, edges từ current state animated + 2.5px blue, others 1.5px slate-300
5. Manual UAT (Task 3) verify visual đúng spec hoặc record issues để fix trước khi merge
</success_criteria>

<output>
After completion, create `.planning/phases/03-m2.1-chu-kỳ-chương-trình-xttm/03-02-SUMMARY.md` theo template.
</output>
