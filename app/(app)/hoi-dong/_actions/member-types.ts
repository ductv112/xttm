// Pure types/constants for council member roles. Imported by client components
// (cannot live in 'use server' module — server modules require all exports async).

export const COUNCIL_MEMBER_ROLES = [
  'CHU_TICH',
  'PHO',
  'UY_VIEN',
  'THU_KY',
] as const;
export type CouncilMemberRole = (typeof COUNCIL_MEMBER_ROLES)[number];

export const COUNCIL_MEMBER_ROLE_LABELS: Record<CouncilMemberRole, string> = {
  CHU_TICH: 'Chủ tịch',
  PHO: 'Phó Chủ tịch',
  UY_VIEN: 'Ủy viên',
  THU_KY: 'Thư ký',
};
