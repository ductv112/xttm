export type ProjectStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'RETURNED_FOR_REVISION'
  | 'VALIDATED'
  | 'EVALUATING'
  | 'EVALUATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONTRACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'LIQUIDATED'
  | 'CANCELLED';

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['ASSIGNED'],
  ASSIGNED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['RETURNED_FOR_REVISION', 'VALIDATED'],
  RETURNED_FOR_REVISION: ['SUBMITTED'],
  VALIDATED: ['EVALUATING'],
  EVALUATING: ['EVALUATED'],
  EVALUATED: ['APPROVED', 'REJECTED'],
  APPROVED: ['CONTRACTED'],
  REJECTED: [],
  CONTRACTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['LIQUIDATED'],
  LIQUIDATED: [],
  CANCELLED: [],
};

export function canTransitionProject(from: ProjectStatus, to: ProjectStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Đang khai báo',
  SUBMITTED: 'Đã nộp',
  RECEIVED: 'Đã tiếp nhận',
  ASSIGNED: 'Đã phân công',
  UNDER_REVIEW: 'Đang kiểm tra',
  RETURNED_FOR_REVISION: 'Yêu cầu bổ sung',
  VALIDATED: 'Hợp lệ',
  EVALUATING: 'Đang thẩm định',
  EVALUATED: 'Đã thẩm định',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Bị từ chối',
  CONTRACTED: 'Đã ký HĐ',
  IN_PROGRESS: 'Đang triển khai',
  COMPLETED: 'Đã nghiệm thu',
  LIQUIDATED: 'Đã thanh lý',
  CANCELLED: 'Đã hủy',
};
