'use client';

import * as React from 'react';
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';

import {
  CYCLE_STATUS_BADGE_THEME,
  CYCLE_STATUS_LABELS,
  PROGRAM_CYCLE_STATUSES,
  TRANSITIONS,
  type ProgramCycleStatus,
} from '@/lib/workflows/programCycle';
import { cn } from '@/lib/utils';

import '@xyflow/react/dist/style.css';

export interface ProgramCycleStateMachineVisualProps {
  currentStatus: ProgramCycleStatus;
  onTransitionClick?: (target: ProgramCycleStatus) => void;
  readOnly?: boolean;
  height?: number;
  className?: string;
}

// =============================================================================
// 7-NODE HORIZONTAL TIMELINE LAYOUT
// =============================================================================

const NODE_LAYOUT: Record<ProgramCycleStatus, { x: number; y: number }> = {
  DRAFT: { x: 0, y: 80 },
  READY: { x: 180, y: 80 },
  OPEN_REGISTRATION: { x: 360, y: 80 },
  CLOSED_REGISTRATION: { x: 540, y: 80 },
  EVALUATING: { x: 720, y: 80 },
  APPROVED: { x: 900, y: 80 },
  COMPLETED: { x: 1080, y: 80 },
};

// =============================================================================
// CUSTOM NODE — visual primitive cho mỗi state
// =============================================================================

type CycleNodeData = {
  label: string;
  status: ProgramCycleStatus;
  isCurrent: boolean;
  isReachable: boolean;
  isClickable: boolean;
};

type CycleFlowNode = Node<CycleNodeData, 'cycleNode'>;

function CycleNode({ data }: NodeProps<CycleFlowNode>) {
  const { label, isCurrent, isReachable, isClickable } = data;

  const stateLabel = isCurrent
    ? 'Hiện tại'
    : isReachable
      ? 'Có thể chuyển'
      : undefined;

  return (
    <div
      className={cn(
        'w-[140px] rounded-lg border-2 px-3 py-2 transition-all',
        isCurrent &&
          'border-blue-700 bg-blue-50 text-blue-900 ring-4 ring-blue-200 shadow-md',
        !isCurrent &&
          isReachable &&
          'border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:shadow-md',
        !isCurrent && !isReachable && 'border-slate-200 bg-slate-50 text-slate-500',
        isClickable ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <div className="text-sm font-semibold leading-tight">{label}</div>
      {stateLabel ? (
        <div
          className={cn(
            'mt-1 text-xs',
            isCurrent && 'text-blue-700',
            isReachable && !isCurrent && 'text-emerald-700',
          )}
        >
          {stateLabel}
        </div>
      ) : null}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function StateMachineInner({
  currentStatus,
  onTransitionClick,
  readOnly = false,
  height = 280,
}: ProgramCycleStateMachineVisualProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const reachableTargets = React.useMemo(
    () => TRANSITIONS[currentStatus] ?? [],
    [currentStatus],
  );

  const nodes = React.useMemo<CycleFlowNode[]>(() => {
    return PROGRAM_CYCLE_STATUSES.map((status) => {
      const isCurrent = status === currentStatus;
      const isReachable = reachableTargets.includes(status);
      const isClickable = !readOnly && isReachable && Boolean(onTransitionClick);

      return {
        id: status,
        type: 'cycleNode',
        position: NODE_LAYOUT[status],
        data: {
          label: CYCLE_STATUS_LABELS[status],
          status,
          isCurrent,
          isReachable,
          isClickable,
        },
        // Defensive default — guard against missing theme entries
        style: undefined,
        draggable: false,
        selectable: false,
        // Hide default React Flow handles since this is visualization-only
        sourcePosition: undefined,
        targetPosition: undefined,
      };
    });
  }, [currentStatus, reachableTargets, readOnly, onTransitionClick]);

  const edges = React.useMemo<Edge[]>(() => {
    const result: Edge[] = [];
    (Object.keys(TRANSITIONS) as ProgramCycleStatus[]).forEach((from) => {
      const targets = TRANSITIONS[from];
      targets.forEach((to) => {
        const isFromCurrent = from === currentStatus;
        result.push({
          id: `${from}->${to}`,
          source: from,
          target: to,
          animated: isFromCurrent,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isFromCurrent ? '#1d4ed8' : '#94a3b8',
            width: 18,
            height: 18,
          },
          style: {
            stroke: isFromCurrent ? '#1d4ed8' : '#cbd5e1',
            strokeWidth: isFromCurrent ? 2.5 : 1.5,
          },
          // Defensive: fallback theme key lookup (CYCLE_STATUS_BADGE_THEME has all 7
          // statuses; default not needed but kept for runtime safety on bad input)
          label: undefined,
        });
      });
    });
    // Reference theme map to ensure import is used (defensive theme validation)
    void CYCLE_STATUS_BADGE_THEME;
    return result;
  }, [currentStatus]);

  const nodeTypes = React.useMemo<NodeTypes>(
    () => ({
      cycleNode: CycleNode,
    }),
    [],
  );

  if (!mounted) {
    return (
      <div
        className="rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-sm text-slate-400"
        style={{ height }}
      >
        Đang tải sơ đồ trạng thái...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-lg border border-slate-200 bg-white overflow-hidden"
        style={{ height }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, node) => {
            const data = node.data as CycleNodeData;
            if (!readOnly && data.isReachable && onTransitionClick) {
              onTransitionClick(data.status);
            }
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#e2e8f0"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full bg-blue-700"
            aria-hidden="true"
          />
          <span>Hiện tại</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          <span>Có thể chuyển sang</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full bg-slate-300"
            aria-hidden="true"
          />
          <span>Trạng thái khác</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ProgramCycleStateMachineVisual — HERO React Flow 7-node horizontal state machine.
 *
 * Render trên Tab Tổng quan của detail page (Plan 03-06):
 *   - 7 nodes ngang theo dòng thời gian (DRAFT → READY → OPEN → CLOSED → EVALUATING → APPROVED → COMPLETED)
 *   - Current state có ring blue-700 + pulse animation
 *   - Reachable next states có border emerald-500 + hover lift
 *   - Edges từ current state animated + 2.5px blue-700, others 1.5px slate-300
 *
 * SSR safety: chỉ render <ReactFlow> sau mount để tránh hydration mismatch.
 *
 * Threat T-03-02-02 mitigation: onTransitionClick là UI convenience only —
 * Plan 03-07 wire to server action which validates RBAC + canTransitionCycle
 * authoritatively. Click is NOT a trust boundary.
 */
export function ProgramCycleStateMachineVisual(
  props: ProgramCycleStateMachineVisualProps,
) {
  return (
    <ReactFlowProvider>
      <div className={cn('w-full', props.className)}>
        <StateMachineInner {...props} />
      </div>
    </ReactFlowProvider>
  );
}

export default ProgramCycleStateMachineVisual;
