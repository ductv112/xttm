// OrganizationProfile state machine — Phase 4 (M2.2 Hồ sơ Đơn vị Chủ trì).
// PITFALLS R3 mitigation: TRANSITIONS table is the SOLE source of truth;
// every server action and UI button MUST consult canTransitionOrgProfile / validateGuards
// / ALLOWED_NEXT_STATES instead of hardcoding allowed transitions.
//
// 4-state lifecycle (CONTEXT.md spec):
//   DRAFT → SUBMITTED → APPROVED / REJECTED
//   REJECTED → DRAFT (đơn vị bổ sung và nộp lại)
//   APPROVED → DRAFT (đơn vị cập nhật, nhưng giữ APPROVED status — Phase 5 check approved=true)

export type OrgProfileStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export const ORG_PROFILE_STATUSES: readonly OrgProfileStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
] as const;

/**
 * Allowed transitions table — frozen contract.
 * Server actions submit/approve/reject MUST consult canTransitionOrgProfile.
 * UI MUST consult ALLOWED_NEXT_STATES to render action buttons.
 */
export const TRANSITIONS: Record<OrgProfileStatus, OrgProfileStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['DRAFT'],
  REJECTED: ['DRAFT'],
};

export function canTransitionOrgProfile(
  from: OrgProfileStatus,
  to: OrgProfileStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALLOWED_NEXT_STATES = (
  status: OrgProfileStatus,
): OrgProfileStatus[] => TRANSITIONS[status] ?? [];

// =============================================================================
// LABELS + THEME — consumed by StatusBadge + UI
// =============================================================================

export const ORG_PROFILE_STATUS_LABELS: Record<OrgProfileStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã gửi xác nhận',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Bị từ chối',
};

/**
 * Color theme keys for StatusBadge component (Plan 03-02 lock).
 * Mapping rationale matches CYCLE_STATUS_BADGE_THEME conventions:
 *   default     = neutral / draft
 *   warning     = transitional (đã gửi, đợi phê duyệt)
 *   success     = approved (positive)
 *   destructive = rejected
 */
export const ORG_PROFILE_STATUS_BADGE_THEME: Record<
  OrgProfileStatus,
  'default' | 'success' | 'destructive' | 'warning'
> = {
  DRAFT: 'default',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

// =============================================================================
// GUARD VALIDATION — domain rules beyond transition table
// =============================================================================

export type OrgProfileLegalInfo = {
  taxCode?: string;
  address?: string;
  representativeName?: string;
  representativeTitle?: string;
  businessType?: string;
  businessField?: string;
};

export type OrgProfilePastProject = {
  name: string;
  year: number | null;
  outcome: string;
};

export type OrgProfileCapabilities = {
  description?: string; // Tiptap HTML
  achievements?: string;
  pastProjects?: OrgProfilePastProject[];
};

export const ORG_PROFILE_CONTACT_ROLES = [
  'CHU_TICH',
  'PHO_CHU_TICH',
  'CHU_NHIEM',
  'DIEU_PHOI_VIEN',
  'KHAC',
] as const;
export type OrgProfileContactRole = (typeof ORG_PROFILE_CONTACT_ROLES)[number];

export const ORG_PROFILE_CONTACT_ROLE_LABELS: Record<OrgProfileContactRole, string> = {
  CHU_TICH: 'Chủ tịch',
  PHO_CHU_TICH: 'Phó chủ tịch',
  CHU_NHIEM: 'Chủ nhiệm',
  DIEU_PHOI_VIEN: 'Điều phối viên',
  KHAC: 'Khác',
};

export type OrgProfileContact = {
  id: string; // client-side stable id (uuid) for inline CRUD
  name: string;
  title: string; // học vị / chức danh: TS./PGS./CN./Th.S.
  role: OrgProfileContactRole;
  email: string;
  phone: string;
};

export type OrgProfileGuardSubject = {
  legalInfo: OrgProfileLegalInfo | null;
  capabilities: OrgProfileCapabilities | null;
  contacts: OrgProfileContact[];
};

export type OrgProfileGuardResult = { ok: boolean; errors: string[] };

const MIN_CAPABILITIES_DESCRIPTION_CHARS = 50;

/**
 * Strip HTML tags + entities (Tiptap output) and return printable text length.
 * Used by validateGuards on capabilities.description (rich text field).
 */
function stripHtmlTextLength(html: string | undefined): number {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length;
}

/**
 * Domain rules per CONTEXT.md state machine spec (called before DRAFT→SUBMITTED):
 *   - legalInfo.taxCode required (mã số thuế)
 *   - legalInfo.address required
 *   - legalInfo.representativeName required
 *   - capabilities.description min 50 chars (printable text, sau khi strip HTML)
 *   - contacts.length >= 1 (ít nhất 1 đầu mối liên hệ)
 *
 * Returns Vietnamese-localized error messages for UI display.
 */
export function validateGuards(
  profile: OrgProfileGuardSubject,
): OrgProfileGuardResult {
  const errors: string[] = [];

  const legal = profile.legalInfo ?? {};
  if (!legal.taxCode || legal.taxCode.trim().length === 0) {
    errors.push('Vui lòng nhập mã số thuế (MST) của đơn vị');
  }
  if (!legal.address || legal.address.trim().length === 0) {
    errors.push('Vui lòng nhập địa chỉ trụ sở');
  }
  if (!legal.representativeName || legal.representativeName.trim().length === 0) {
    errors.push('Vui lòng nhập họ tên người đại diện theo pháp luật');
  }

  const capabilities = profile.capabilities ?? {};
  const descLen = stripHtmlTextLength(capabilities.description);
  if (descLen < MIN_CAPABILITIES_DESCRIPTION_CHARS) {
    errors.push(
      `Mô tả năng lực hoạt động cần tối thiểu ${MIN_CAPABILITIES_DESCRIPTION_CHARS} ký tự (hiện ${descLen})`,
    );
  }

  if (!Array.isArray(profile.contacts) || profile.contacts.length === 0) {
    errors.push('Vui lòng khai báo ít nhất 1 đầu mối liên hệ của đơn vị');
  }

  return { ok: errors.length === 0, errors };
}

// =============================================================================
// JSON helpers — DB stores TEXT (SQLite); helpers parse/stringify with safe defaults
// =============================================================================

export function parseLegalInfo(raw: string | null | undefined): OrgProfileLegalInfo {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as OrgProfileLegalInfo) : {};
  } catch {
    return {};
  }
}

export function parseCapabilities(
  raw: string | null | undefined,
): OrgProfileCapabilities {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      const cap = v as OrgProfileCapabilities;
      // Defensive: ensure pastProjects is always array
      if (cap.pastProjects && !Array.isArray(cap.pastProjects)) {
        cap.pastProjects = [];
      }
      return cap;
    }
    return {};
  } catch {
    return {};
  }
}

export function parseContacts(raw: string | null | undefined): OrgProfileContact[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) {
      return v.filter(
        (c): c is OrgProfileContact =>
          c && typeof c === 'object' && typeof c.name === 'string',
      );
    }
    return [];
  } catch {
    return [];
  }
}
