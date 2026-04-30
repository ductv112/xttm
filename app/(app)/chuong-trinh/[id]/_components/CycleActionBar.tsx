'use client';

// CycleActionBar — Plan 03-07 hero action surface.
//
// Renders contextual action buttons trong sticky header right-side dựa theo
// cycle.status hiện tại + canEdit của user. Mỗi button tương ứng 1 transition
// hợp lệ trong TRANSITIONS table (lib/workflows/programCycle.ts) hoặc đặc thù
// (EXTEND, NOOP-NOTIFY redirect).
//
// Status → button matrix (CYCLE-08/09/11):
//   DRAFT               → "Hoàn thành cấu hình" (→ READY) — guard: cần mốc thời gian
//   READY               → "Mở cổng nhận đăng ký" (→ OPEN_REGISTRATION) — guard: cần công văn
//   OPEN_REGISTRATION   → "Đóng cổng đăng ký" (→ CLOSED_REGISTRATION) + "Gửi thông báo cập nhật" (redirect tab)
//   CLOSED_REGISTRATION → "Mở lại để gia hạn" (EXTEND dialog) + "Chuyển sang thẩm định" (→ EVALUATING)
//   EVALUATING/APPROVED/COMPLETED → empty banner "Phase 7 sẽ xử lý"
//
// Threat T-03-07-01 mitigation: canEdit=false (DONVI/lanhdao đọc-only) → toàn
// bộ buttons hidden. Server actions (Plan 03-03) là layer authoritative.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CYCLE_STATUS_LABELS,
  type ProgramCycleStatus,
} from '@/lib/workflows/programCycle';

import type { CycleDetail } from '../../_actions/types';
import { TransitionDialog } from './TransitionDialog';
import { ExtendCycleDialog } from './ExtendCycleDialog';

// =============================================================================
// ACTION CONFIG TABLE — single source of truth cho UI
// =============================================================================

type ActionTarget = ProgramCycleStatus | 'EXTEND' | 'NOOP-NOTIFY';

type ActionConfig = {
  key: string;
  label: string;
  target: ActionTarget;
  variant: 'default' | 'outline' | 'destructive';
  /** Return Vietnamese error message khi disabled, null khi enabled */
  guard?: (cycle: CycleDetail) => string | null;
};

const ACTION_CONFIGS: Record<ProgramCycleStatus, ActionConfig[]> = {
  DRAFT: [
    {
      key: 'to-ready',
      label: 'Hoàn thành cấu hình',
      target: 'READY',
      variant: 'default',
      guard: (c) =>
        c.registrationOpenAt && c.registrationCloseAt && c.totalBudget && c.totalBudget > 0
          ? null
          : 'Vui lòng cấu hình mốc thời gian và tổng kinh phí ở tab Cấu hình kỳ trước',
    },
  ],
  READY: [
    {
      key: 'open-cong',
      label: 'Mở cổng nhận đăng ký',
      target: 'OPEN_REGISTRATION',
      variant: 'default',
      guard: (c) =>
        c.invitationLetterAttachmentId
          ? null
          : 'Vui lòng upload công văn ban hành ở tab Công văn trước',
    },
    // Cho phép rollback về DRAFT nếu phát hiện thiếu sót — TRANSITIONS table cho phép
    {
      key: 'back-to-draft',
      label: 'Quay lại Bản nháp',
      target: 'DRAFT',
      variant: 'outline',
    },
  ],
  OPEN_REGISTRATION: [
    {
      key: 'close-cong',
      label: 'Đóng cổng đăng ký',
      target: 'CLOSED_REGISTRATION',
      variant: 'outline',
    },
    {
      key: 'send-update',
      label: 'Gửi thông báo cập nhật',
      target: 'NOOP-NOTIFY',
      variant: 'outline',
    },
  ],
  CLOSED_REGISTRATION: [
    {
      key: 'extend',
      label: 'Mở lại để gia hạn',
      target: 'EXTEND',
      variant: 'outline',
    },
    {
      key: 'to-evaluating',
      label: 'Chuyển sang thẩm định',
      target: 'EVALUATING',
      variant: 'default',
    },
  ],
  EVALUATING: [],
  APPROVED: [],
  COMPLETED: [],
};

// =============================================================================
// COMPONENT
// =============================================================================

export type CycleActionBarProps = {
  cycle: CycleDetail;
  canEdit: boolean;
};

export function CycleActionBar({ cycle, canEdit }: CycleActionBarProps) {
  const router = useRouter();
  const [transitionTarget, setTransitionTarget] =
    React.useState<ProgramCycleStatus | null>(null);
  const [extendOpen, setExtendOpen] = React.useState(false);

  const configs = ACTION_CONFIGS[cycle.status] ?? [];
  const hasActions = configs.length > 0;

  // Empty state: EVALUATING/APPROVED/COMPLETED — show banner thay buttons
  if (!hasActions) {
    return (
      <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <span>
          Chu kỳ đang ở trạng thái{' '}
          <span className="font-medium text-slate-900">
            {CYCLE_STATUS_LABELS[cycle.status]}
          </span>
          {' '}— Phase 7 sẽ xử lý
        </span>
      </div>
    );
  }

  // No edit permission → don't render buttons (T-03-07-01 mitigation)
  if (!canEdit) {
    return (
      <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Bạn không có quyền thao tác trên chu kỳ này
      </div>
    );
  }

  const handleClick = (config: ActionConfig) => {
    if (config.target === 'EXTEND') {
      setExtendOpen(true);
      return;
    }
    if (config.target === 'NOOP-NOTIFY') {
      router.push(`/chuong-trinh/${cycle.id}/don-vi-moi`);
      return;
    }
    setTransitionTarget(config.target);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2">
        {configs.map((config) => {
          const guardError = config.guard?.(cycle) ?? null;
          const disabled = guardError !== null;

          const button = (
            <Button
              key={config.key}
              variant={config.variant}
              disabled={disabled}
              onClick={() => handleClick(config)}
              className="gap-1.5"
            >
              {config.target === 'NOOP-NOTIFY' ? (
                <Send className="h-4 w-4" aria-hidden="true" />
              ) : null}
              {config.label}
            </Button>
          );

          // Wrap với tooltip nếu disabled để giải thích lý do
          if (disabled && guardError) {
            return (
              <Tooltip key={config.key}>
                <TooltipTrigger asChild>
                  {/* span wrapper — disabled buttons không nhận pointer events */}
                  <span className="inline-flex" tabIndex={0}>
                    {button}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {guardError}
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>

      <TransitionDialog
        open={transitionTarget !== null}
        onOpenChange={(v) => !v && setTransitionTarget(null)}
        cycle={cycle}
        target={transitionTarget}
      />

      <ExtendCycleDialog
        open={extendOpen}
        onOpenChange={setExtendOpen}
        cycle={cycle}
      />
    </TooltipProvider>
  );
}

export default CycleActionBar;
