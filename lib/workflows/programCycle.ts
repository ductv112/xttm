// ProgramCycle state machine — authoritative for Phase 3+ server actions + UI.
// PITFALLS R3 mitigation: TRANSITIONS table is the SOLE source of truth;
// every server action and UI button MUST consult canTransitionCycle / validateGuards
// / ALLOWED_NEXT_STATES instead of hardcoding allowed transitions.
//
// 7-state lifecycle (CONTEXT.md spec):
//   DRAFT → READY → OPEN_REGISTRATION ↔ CLOSED_REGISTRATION → EVALUATING → APPROVED → COMPLETED
//   READY → DRAFT (rollback nếu phát hiện thiếu cấu hình)
//   OPEN ↔ CLOSED gia hạn 2 chiều — both ways audited via extendCycle wrapper

export type ProgramCycleStatus =
  | 'DRAFT'
  | 'READY'
  | 'OPEN_REGISTRATION'
  | 'CLOSED_REGISTRATION'
  | 'EVALUATING'
  | 'APPROVED'
  | 'COMPLETED';

export const PROGRAM_CYCLE_STATUSES: readonly ProgramCycleStatus[] = [
  'DRAFT',
  'READY',
  'OPEN_REGISTRATION',
  'CLOSED_REGISTRATION',
  'EVALUATING',
  'APPROVED',
  'COMPLETED',
] as const;

/**
 * Allowed transitions table — frozen contract.
 * Plan 03-03 server action transitionCycle MUST consult canTransitionCycle.
 * Plan 03-07 UI MUST consult ALLOWED_NEXT_STATES to render action buttons.
 */
export const TRANSITIONS: Record<ProgramCycleStatus, ProgramCycleStatus[]> = {
  DRAFT: ['READY'],
  READY: ['OPEN_REGISTRATION', 'DRAFT'],
  OPEN_REGISTRATION: ['CLOSED_REGISTRATION'],
  CLOSED_REGISTRATION: ['OPEN_REGISTRATION', 'EVALUATING'],
  EVALUATING: ['APPROVED'],
  APPROVED: ['COMPLETED'],
  COMPLETED: [],
};

export function canTransitionCycle(
  from: ProgramCycleStatus,
  to: ProgramCycleStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALLOWED_NEXT_STATES = (
  status: ProgramCycleStatus,
): ProgramCycleStatus[] => TRANSITIONS[status] ?? [];

// =============================================================================
// LABELS + THEME — consumed by Plan 03-02 StatusBadge + Plan 03-05 list view
// =============================================================================

export const CYCLE_STATUS_LABELS: Record<ProgramCycleStatus, string> = {
  DRAFT: 'Bản nháp',
  READY: 'Sẵn sàng',
  OPEN_REGISTRATION: 'Đang mở đăng ký',
  CLOSED_REGISTRATION: 'Đã đóng đăng ký',
  EVALUATING: 'Đang thẩm định',
  APPROVED: 'Đã phê duyệt',
  COMPLETED: 'Hoàn thành',
};

/**
 * Color theme keys for StatusBadge component (Plan 03-02 consume).
 * Mapping rationale:
 *   slate     = neutral / draft (chưa hoạt động)
 *   blue      = active workflow (READY, EVALUATING)
 *   green     = open call (đang nhận đăng ký — call-to-action visible)
 *   amber     = transitional (closed but not yet evaluating — gia hạn possible)
 *   emerald   = approved (positive terminal-ish)
 *   slateDark = completed (terminal — past)
 */
export const CYCLE_STATUS_BADGE_THEME: Record<
  ProgramCycleStatus,
  'slate' | 'blue' | 'green' | 'amber' | 'emerald' | 'slateDark'
> = {
  DRAFT: 'slate',
  READY: 'blue',
  OPEN_REGISTRATION: 'green',
  CLOSED_REGISTRATION: 'amber',
  EVALUATING: 'blue',
  APPROVED: 'emerald',
  COMPLETED: 'slateDark',
};

// =============================================================================
// GUARD VALIDATION — domain rules beyond transition table
// =============================================================================

export type GuardResult = { ok: boolean; reason?: string };

export type CycleGuardSubject = {
  status: ProgramCycleStatus;
  invitationLetterAttachmentId?: string | null;
  registrationOpenAt?: Date | null;
  registrationCloseAt?: Date | null;
  totalBudget?: number | null;
};

/**
 * Domain rules per CONTEXT.md state machine spec:
 *   - DRAFT → READY: phải có registrationOpenAt + registrationCloseAt + totalBudget
 *   - READY → OPEN_REGISTRATION: phải có invitationLetterAttachmentId (công văn ban hành)
 *   - OPEN_REGISTRATION → CLOSED_REGISTRATION: chỉ check transition table
 *   - CLOSED_REGISTRATION → OPEN_REGISTRATION (gia hạn): caller wraps via extendCycle với reason
 *   - other transitions: chỉ check transition table
 *
 * Always validates transition table first; domain rules layered on top.
 * Returns Vietnamese-localized reason for UI display.
 */
export function validateGuards(
  cycle: CycleGuardSubject,
  target: ProgramCycleStatus,
): GuardResult {
  // Transition table is the floor — must always pass first
  if (!canTransitionCycle(cycle.status, target)) {
    return {
      ok: false,
      reason: `Không thể chuyển trực tiếp từ "${CYCLE_STATUS_LABELS[cycle.status]}" sang "${CYCLE_STATUS_LABELS[target]}"`,
    };
  }

  if (target === 'READY') {
    if (!cycle.registrationOpenAt || !cycle.registrationCloseAt) {
      return {
        ok: false,
        reason:
          'Vui lòng cấu hình mốc thời gian (ngày mở và ngày đóng đăng ký) trước khi chuyển sang trạng thái Sẵn sàng',
      };
    }
    if (
      cycle.totalBudget === undefined ||
      cycle.totalBudget === null ||
      cycle.totalBudget <= 0
    ) {
      return {
        ok: false,
        reason: 'Vui lòng cấu hình tổng kinh phí trước khi chuyển sang trạng thái Sẵn sàng',
      };
    }
  }

  if (target === 'OPEN_REGISTRATION') {
    if (!cycle.invitationLetterAttachmentId) {
      return {
        ok: false,
        reason: 'Vui lòng upload công văn ban hành trước khi mở cổng',
      };
    }
  }

  return { ok: true };
}
