export type OrgProfileStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

const TRANSITIONS: Record<OrgProfileStatus, OrgProfileStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['DRAFT'],
  REJECTED: ['DRAFT'],
};

export function canTransitionOrgProfile(from: OrgProfileStatus, to: OrgProfileStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const ORG_PROFILE_STATUS_LABELS: Record<OrgProfileStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã gửi',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Bị từ chối',
};
