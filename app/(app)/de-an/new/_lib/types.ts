// Project wizard form data shape — 6 steps (PROJ-04 / PROJ-05).
// Plan 05-02. Mirrors server-side Zod (de-an/_actions/types.ts) but client-side
// types: dueDate stays string ISO (DatePicker writes back ISO), Date objects
// only on the wire of DateRangePicker for Step 1 timeRange (Date in/out).
//
// Persistence: store toàn bộ partial vào localStorage qua Zustand persist;
// clear sau submit thành công. Hydration: ISO date strings revived to Date
// where needed (Step 1 timeRange.start/end).
//
// Pattern mirror: app/(app)/chuong-trinh/new/_lib/types.ts.

export type ProjectKindCode =
  | 'EXPORT_EXHIBITION'
  | 'INTL_CONFERENCE'
  | 'DOMESTIC_FAIR'
  | 'TRADE_DELEGATION_OUT'
  | 'TRADE_DELEGATION_IN'
  | 'TRADE_INFO_EXPORT'
  | 'TRADE_INFO_DOMESTIC'
  | 'TRAINING'
  | 'OTHER';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type Step1Data = {
  name: string;
  kind: string; // ProjectKindCode (string for shadcn Select compatibility)
  industrySectorIds: string[];
  marketIds: string[];
  countryIds: string[];
  promotionTypeIds: string[];
  /** Time range — start/end ISO strings (revived to Date where DateRangePicker is used). */
  timeRange: {
    start?: string | null;
    end?: string | null;
    quarter?: Quarter | null;
  } | null;
  isTwoYear: boolean;
  nextYear: number | null;
};

export type Step2PlanRow = {
  id: string; // client-side stable uuid
  task: string;
  deliverable: string;
  dueDate: string | null; // ISO date string yyyy-mm-dd
  owner: string;
};

export type Step2Data = {
  objective: string; // Tiptap HTML
  content: string; // Tiptap HTML
  planRows: Step2PlanRow[];
};

export type Step3BudgetRow = {
  id: string; // client-side stable uuid
  item: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number; // auto-calc qty * unitPrice
  source: 'STATE' | 'SELF';
  note: string;
};

export type Step3Data = {
  rows: Step3BudgetRow[];
  totalState: number;
  totalSelf: number;
  total: number;
  /** Tổng ngân sách đề xuất (manual nhập tham chiếu, validate >= total). */
  proposedTotalReference: number | null;
};

export type Step4Data = {
  pmContactId: string | null; // contact UUID từ OrganizationProfile.contactsJson
};

export type Step5DocumentEntry = {
  attachmentId: string;
  fileName: string;
  category: 'PLAN' | 'CAPABILITY' | 'EVIDENCE' | 'OTHER';
  fileSize: number | null;
  fileUrl: string;
  uploadedAt: string; // ISO
};

export type Step5Data = {
  documents: Step5DocumentEntry[];
};

export type Step6Data = {
  declarationConfirmed: boolean;
};

export type ProjectWizardData = {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
};

// =============================================================================
// Catalog options — passed từ RSC page → Shell → Step components (avoid client fetch)
// =============================================================================

export type CatalogOption = {
  id: string;
  code: string;
  name: string;
};

export type ProjectKindOption = {
  code: string;
  name: string;
};

export type ContactOption = {
  id: string;
  name: string;
  title: string;
  role: string;
  email: string;
  phone: string;
};

export type PreviousProjectOption = {
  id: string;
  code: string;
  name: string;
  year: number;
  kind: string;
};

export type WizardCatalogData = {
  projectKinds: ProjectKindOption[];
  industrySectors: CatalogOption[];
  markets: CatalogOption[];
  countries: CatalogOption[];
  promotionTypes: CatalogOption[];
};
