// Wizard form data shape — 5 steps (CYCLE-01..04).
// Plan 03-04 — consumed bởi Zustand store + RHF resolvers + Step components.
//
// All step keys are independent objects (Step1..Step4); Step 5 is read-only review,
// chỉ đọc lại 4 step trước. Persistence: store toàn bộ partial vào localStorage
// qua Zustand persist; clear sau submit thành công.

export type Step1Data = {
  year: number;
  name: string;
  description?: string | null;
  totalBudget?: number | null;
};

export type Step2Data = {
  registrationOpenAt?: Date | null;
  registrationCloseAt?: Date | null;
  supplementDeadline?: Date | null;
  evaluationStartAt?: Date | null;
  evaluationEndAt?: Date | null;
  approvalDeadline?: Date | null;
};

export type Step3Data = {
  scoringCriteriaIds: string[];
  evaluationCriteriaIds: string[];
};

export type Step4Data = {
  invitedOrganizationIds: string[];
  emailTemplateIds: string[];
};

export type CycleWizardData = {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
};

// Catalog options passed từ RSC page → Shell → Step components (avoid client fetch).
// Step 3 picks from cùng pool ScoringCriterion (catalog tieu-chi-cham-diem) —
// scoringCriteriaIds dùng cho chấm điểm sơ bộ (chuyên viên kiểm tra hồ sơ)
// vs evaluationCriteriaIds dùng cho hội đồng thẩm định. Cùng catalog, khác use-case.

export type ScoringCriterionOption = {
  id: string;
  name: string;
  weight: number;
  parentName: string | null; // group cha (vd "Tính phù hợp") để hiển thị nhãn nhóm
};

export type OrganizationOption = {
  id: string;
  name: string;
  type: string;
};

export type EmailTemplateOption = {
  id: string;
  name: string;
  category: string;
};

export type WizardCatalogData = {
  scoringCriteria: ScoringCriterionOption[];
  organizations: OrganizationOption[];
  emailTemplates: EmailTemplateOption[];
};
