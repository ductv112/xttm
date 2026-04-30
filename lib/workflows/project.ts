// Project state machine — Phase 5 (M2.3 Khai báo & Nộp Đề án HERO).
// PITFALLS R3 mitigation: TRANSITIONS table is the SOLE source of truth;
// every server action and UI button MUST consult canTransitionProject /
// validateGuards / ALLOWED_NEXT_STATES instead of hardcoding allowed transitions.
//
// State machine spec (CONTEXT.md + plan must_haves):
//   DRAFT
//     → SUBMITTED  (đơn vị nộp — guard validateGuards + chu kỳ OPEN_REGISTRATION)
//     → CANCELLED
//   SUBMITTED
//     → DRAFT      (rút hồ sơ — chỉ khi assignedToUserId === null)
//     → ASSIGNED   (BQL phân công)
//     → CANCELLED
//   ASSIGNED
//     → IN_REVIEW  (chuyên viên bắt đầu kiểm tra)
//   IN_REVIEW
//     → SUPPLEMENT_REQUIRED  (chuyên viên trả bổ sung)
//     → VALID                (chuyên viên xác nhận hợp lệ)
//   SUPPLEMENT_REQUIRED
//     → RESUBMITTED  (đơn vị nộp lại sau bổ sung)
//   RESUBMITTED
//     → IN_REVIEW    (chuyên viên kiểm tra lại)
//   VALID
//     → EVALUATING   (BQL chuyển sang hội đồng)
//   EVALUATING
//     → APPROVED        (lãnh đạo phê duyệt)
//     → REJECTED        (legacy term — Phase 6 trở về trước)
//     → REJECTED_FINAL  (Phase 7 — Bộ ra quyết định không phê duyệt)
//   APPROVED
//     → IN_PROGRESS  (sau khi ký HĐ + bắt đầu triển khai)
//   IN_PROGRESS
//     → COMPLETED    (đã nghiệm thu)
//   COMPLETED       — terminal
//   REJECTED        — terminal
//   REJECTED_FINAL  — terminal (Phase 7 — Bộ không phê duyệt)
//   CANCELLED       — terminal
//   TENTATIVE   — đề án 2 năm: record năm 2 placeholder
//     → DRAFT        (khi chu kỳ năm sau OPEN_REGISTRATION, đơn vị bắt đầu khai báo)

export type ProjectStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_REVIEW'
  | 'SUPPLEMENT_REQUIRED'
  | 'RESUBMITTED'
  | 'VALID'
  | 'EVALUATING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REJECTED_FINAL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'TENTATIVE';

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'ASSIGNED',
  'IN_REVIEW',
  'SUPPLEMENT_REQUIRED',
  'RESUBMITTED',
  'VALID',
  'EVALUATING',
  'APPROVED',
  'REJECTED',
  'REJECTED_FINAL',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'TENTATIVE',
] as const;

/**
 * Allowed transitions table — frozen contract.
 * Phase 5+ server actions submitProject / withdrawProject / etc. MUST consult
 * canTransitionProject. UI MUST consult ALLOWED_NEXT_STATES to render action buttons.
 */
export const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['DRAFT', 'ASSIGNED', 'CANCELLED'], // SUBMITTED → DRAFT = rút hồ sơ
  ASSIGNED: ['IN_REVIEW'],
  IN_REVIEW: ['SUPPLEMENT_REQUIRED', 'VALID', 'REJECTED'],
  SUPPLEMENT_REQUIRED: ['RESUBMITTED'],
  RESUBMITTED: ['IN_REVIEW'],
  VALID: ['EVALUATING'],
  EVALUATING: ['APPROVED', 'REJECTED', 'REJECTED_FINAL'],
  APPROVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  REJECTED_FINAL: [],
  CANCELLED: [],
  TENTATIVE: ['DRAFT'],
};

export function canTransitionProject(
  from: ProjectStatus,
  to: ProjectStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALLOWED_NEXT_STATES = (status: ProjectStatus): ProjectStatus[] =>
  TRANSITIONS[status] ?? [];

// =============================================================================
// LABELS + THEME — consumed by StatusBadge + UI lists
// =============================================================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  ASSIGNED: 'Đã phân công',
  IN_REVIEW: 'Đang kiểm tra',
  SUPPLEMENT_REQUIRED: 'Yêu cầu bổ sung',
  RESUBMITTED: 'Đã nộp lại',
  VALID: 'Hợp lệ',
  EVALUATING: 'Đang thẩm định',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Bị từ chối',
  REJECTED_FINAL: 'Không được phê duyệt',
  IN_PROGRESS: 'Đang triển khai',
  COMPLETED: 'Đã nghiệm thu',
  CANCELLED: 'Đã hủy',
  TENTATIVE: 'Dự kiến (năm sau)',
};

/**
 * Color theme keys for StatusBadge component (consistent with Phase 3 cycle theme).
 *   slate     = neutral / draft / cancelled
 *   blue      = active workflow
 *   amber     = needs action (supplement_required)
 *   green     = positive (valid / approved / completed)
 *   red       = rejected
 *   purple    = tentative (đề án 2 năm placeholder)
 */
export const PROJECT_STATUS_BADGE_THEME: Record<
  ProjectStatus,
  'slate' | 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'emerald' | 'slateDark'
> = {
  DRAFT: 'slate',
  SUBMITTED: 'blue',
  ASSIGNED: 'blue',
  IN_REVIEW: 'blue',
  SUPPLEMENT_REQUIRED: 'amber',
  RESUBMITTED: 'blue',
  VALID: 'green',
  EVALUATING: 'blue',
  APPROVED: 'emerald',
  REJECTED: 'red',
  REJECTED_FINAL: 'red',
  IN_PROGRESS: 'blue',
  COMPLETED: 'slateDark',
  CANCELLED: 'slate',
  TENTATIVE: 'purple',
};

// =============================================================================
// GUARD VALIDATION — domain rules beyond transition table
// =============================================================================

export type ProjectGeneralInfo = {
  industrySectorIds?: string[];
  marketIds?: string[];
  countryIds?: string[];
  promotionTypeIds?: string[];
  timeRange?: {
    start?: string | null;
    end?: string | null;
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  } | null;
  isTwoYear?: boolean;
  nextYear?: number | null;
};

export type ProjectObjectives = {
  objective?: string; // Tiptap HTML
  content?: string; // Tiptap HTML
};

export type ProjectPlanRow = {
  id?: string;
  task: string;
  deliverable?: string;
  dueDate?: string | null;
  owner?: string;
};

export type ProjectPlan = {
  rows?: ProjectPlanRow[];
};

export type ProjectBudgetRow = {
  id?: string;
  item: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  source?: 'STATE' | 'SELF';
  note?: string;
};

export type ProjectBudget = {
  rows?: ProjectBudgetRow[];
  totalState?: number;
  totalSelf?: number;
  total?: number;
};

export type ProjectGuardSubject = {
  status: ProjectStatus;
  name: string;
  kind: string | null;
  pmContactId: string | null;
  generalInfo: ProjectGeneralInfo | null;
  objectives: ProjectObjectives | null;
  plan: ProjectPlan | null;
  budget: ProjectBudget | null;
  programCycleStatus?: string | null;
  assignedToUserId?: string | null;
};

export type ProjectGuardResult = { ok: boolean; errors: string[] };

const MIN_NAME_LENGTH = 5;

/**
 * Strip HTML tags + entities (Tiptap output) and return printable text length.
 */
function stripHtmlTextLength(html: string | undefined | null): number {
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
 * Domain rules for DRAFT → SUBMITTED transition (called server-side before submit):
 *   - name.trim().length >= 5
 *   - kind set
 *   - pmContactId set
 *   - generalInfo.industrySectorIds.length >= 1
 *   - plan.rows.length >= 1
 *   - budget.rows.length >= 1
 *   - programCycle.status === 'OPEN_REGISTRATION' (when target=SUBMITTED)
 *
 * Returns Vietnamese-localized error messages for UI display.
 */
export function validateGuards(
  project: ProjectGuardSubject,
  target: ProjectStatus = 'SUBMITTED',
): ProjectGuardResult {
  const errors: string[] = [];

  if (!project.name || project.name.trim().length < MIN_NAME_LENGTH) {
    errors.push(`Tên đề án tối thiểu ${MIN_NAME_LENGTH} ký tự`);
  }

  if (!project.kind || project.kind.trim().length === 0) {
    errors.push('Vui lòng chọn loại đề án');
  }

  if (!project.pmContactId) {
    errors.push('Vui lòng chọn chủ nhiệm đề án');
  }

  const general = project.generalInfo ?? {};
  const sectors = Array.isArray(general.industrySectorIds)
    ? general.industrySectorIds
    : [];
  if (sectors.length === 0) {
    errors.push('Vui lòng chọn ít nhất 1 ngành hàng');
  }

  const objectives = project.objectives ?? {};
  if (stripHtmlTextLength(objectives.objective) < 10) {
    errors.push('Vui lòng khai báo mục tiêu đề án (tối thiểu 10 ký tự)');
  }

  const plan = project.plan ?? {};
  const planRows = Array.isArray(plan.rows) ? plan.rows : [];
  if (planRows.length === 0) {
    errors.push('Vui lòng khai báo ít nhất 1 dòng kế hoạch chi tiết');
  } else {
    const blank = planRows.some(
      (r) => !r || typeof r.task !== 'string' || r.task.trim().length === 0,
    );
    if (blank) {
      errors.push('Mỗi dòng kế hoạch phải có "hạng mục công việc"');
    }
  }

  const budget = project.budget ?? {};
  const budgetRows = Array.isArray(budget.rows) ? budget.rows : [];
  if (budgetRows.length === 0) {
    errors.push('Vui lòng khai báo ít nhất 1 dòng dự toán kinh phí');
  } else {
    const invalidRow = budgetRows.some(
      (r) => !r || typeof r.item !== 'string' || r.item.trim().length === 0,
    );
    if (invalidRow) {
      errors.push('Mỗi dòng dự toán phải có tên hạng mục');
    }
    const totalSum = budgetRows.reduce(
      (acc, r) => acc + (typeof r.amount === 'number' ? r.amount : 0),
      0,
    );
    if (totalSum <= 0) {
      errors.push('Tổng dự toán kinh phí phải lớn hơn 0');
    }
  }

  // Cycle gating — only enforced when the target requires the cycle to be open.
  if (target === 'SUBMITTED' || target === 'RESUBMITTED') {
    if (
      project.programCycleStatus &&
      project.programCycleStatus !== 'OPEN_REGISTRATION'
    ) {
      errors.push(
        'Chu kỳ chương trình hiện không mở đăng ký — không thể nộp đề án',
      );
    }
  }

  // Withdraw guard — only if target is DRAFT from SUBMITTED, must not be assigned.
  if (project.status === 'SUBMITTED' && target === 'DRAFT') {
    if (project.assignedToUserId) {
      errors.push(
        'Đề án đã được phân công cho chuyên viên — không thể rút hồ sơ',
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

// =============================================================================
// JSON helpers — DB stores TEXT (SQLite); helpers parse/stringify with safe defaults
// =============================================================================

export function parseGeneralInfo(
  raw: string | null | undefined,
): ProjectGeneralInfo {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as ProjectGeneralInfo) : {};
  } catch {
    return {};
  }
}

export function parseObjectives(
  raw: string | null | undefined,
): ProjectObjectives {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as ProjectObjectives) : {};
  } catch {
    return {};
  }
}

export function parsePlan(raw: string | null | undefined): ProjectPlan {
  if (!raw) return { rows: [] };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      const plan = v as ProjectPlan;
      if (!Array.isArray(plan.rows)) plan.rows = [];
      return plan;
    }
    return { rows: [] };
  } catch {
    return { rows: [] };
  }
}

export function parseBudget(raw: string | null | undefined): ProjectBudget {
  if (!raw) return { rows: [], totalState: 0, totalSelf: 0, total: 0 };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      const budget = v as ProjectBudget;
      if (!Array.isArray(budget.rows)) budget.rows = [];
      return budget;
    }
    return { rows: [], totalState: 0, totalSelf: 0, total: 0 };
  } catch {
    return { rows: [], totalState: 0, totalSelf: 0, total: 0 };
  }
}

/**
 * Compute totals from budget rows. Pure helper used by guards + UI live calc.
 */
export function computeBudgetTotals(rows: ProjectBudgetRow[]): {
  totalState: number;
  totalSelf: number;
  total: number;
} {
  let totalState = 0;
  let totalSelf = 0;
  for (const row of rows) {
    const amount =
      typeof row.amount === 'number'
        ? row.amount
        : (row.quantity ?? 0) * (row.unitPrice ?? 0);
    if (row.source === 'SELF') totalSelf += amount;
    else totalState += amount;
  }
  return { totalState, totalSelf, total: totalState + totalSelf };
}

/**
 * Project kind labels (CAT-01 ProjectKind seed) — used by UI for display.
 * Same 8 codes as ProjectKind catalog seed.
 */
export const PROJECT_KIND_LABELS: Record<string, string> = {
  EXPORT_EXHIBITION: 'Triển lãm xuất khẩu',
  INTL_CONFERENCE: 'Hội nghị quốc tế',
  DOMESTIC_FAIR: 'Hội chợ trong nước',
  TRADE_DELEGATION_OUT: 'Đoàn XTTM ra nước ngoài',
  TRADE_DELEGATION_IN: 'Đoàn XTTM vào Việt Nam',
  TRADE_INFO_EXPORT: 'Thông tin XTTM xuất khẩu',
  TRADE_INFO_DOMESTIC: 'Thông tin XTTM trong nước',
  TRAINING: 'Đào tạo, tập huấn XTTM',
  OTHER: 'Khác',
};
