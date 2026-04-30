export type ProgramCycleStatus =
  | 'DRAFT'
  | 'READY'
  | 'OPEN_REGISTRATION'
  | 'CLOSED_REGISTRATION'
  | 'EVALUATING'
  | 'APPROVED'
  | 'COMPLETED';

const TRANSITIONS: Record<ProgramCycleStatus, ProgramCycleStatus[]> = {
  DRAFT: ['READY'],
  READY: ['OPEN_REGISTRATION', 'DRAFT'],
  OPEN_REGISTRATION: ['CLOSED_REGISTRATION'],
  CLOSED_REGISTRATION: ['EVALUATING', 'OPEN_REGISTRATION'],
  EVALUATING: ['APPROVED'],
  APPROVED: ['COMPLETED'],
  COMPLETED: [],
};

export function canTransitionCycle(from: ProgramCycleStatus, to: ProgramCycleStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const CYCLE_STATUS_LABELS: Record<ProgramCycleStatus, string> = {
  DRAFT: 'Bản nháp',
  READY: 'Sẵn sàng',
  OPEN_REGISTRATION: 'Đang mở đăng ký',
  CLOSED_REGISTRATION: 'Đã đóng đăng ký',
  EVALUATING: 'Đang thẩm định',
  APPROVED: 'Đã phê duyệt',
  COMPLETED: 'Hoàn thành',
};
