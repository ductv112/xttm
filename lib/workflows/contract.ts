export type ContractStatus = 'DRAFT' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'LIQUIDATED' | 'OVERDUE';

const TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['SIGNED', 'OVERDUE'],
  SIGNED: ['ACTIVE'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: ['LIQUIDATED'],
  LIQUIDATED: [],
  OVERDUE: ['SIGNED'],
};

export function canTransitionContract(from: ContractStatus, to: ContractStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Bản nháp',
  SIGNED: 'Đã ký',
  ACTIVE: 'Đang triển khai',
  COMPLETED: 'Hoàn thành',
  LIQUIDATED: 'Đã thanh lý',
  OVERDUE: 'Quá hạn ký',
};
