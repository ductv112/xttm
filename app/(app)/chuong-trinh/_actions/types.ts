// Shared types for Chu kỳ Chương trình XTTM server actions.
// Consumed by list/get-detail/create/update/transition/extend/upload/send-invitation actions
// + Plan 03-05 list page + Plan 03-06 detail tabs.

import type { ProgramCycleStatus } from '@/lib/workflows/programCycle';

// =============================================================================
// FILTERS
// =============================================================================

export type CycleListFilter = {
  year?: number;
  statuses?: ProgramCycleStatus[];
};

// =============================================================================
// LIST ITEM (card view consume)
// =============================================================================

export type CycleListItem = {
  id: string;
  year: number;
  name: string;
  status: ProgramCycleStatus;
  totalBudget: number | null;
  registrationOpenAt: Date | null;
  registrationCloseAt: Date | null;
  supplementDeadline: Date | null;
  createdAt: Date;
  projectCount: number;
  invitedOrgCount: number;
  daysRemaining: number | null;
};

// =============================================================================
// CREATE / UPDATE INPUT
// =============================================================================

export type CreateCycleInput = {
  year: number;
  name: string;
  description?: string | null;
  totalBudget?: number | null;
  registrationOpenAt?: Date | null;
  registrationCloseAt?: Date | null;
  supplementDeadline?: Date | null;
  evaluationStartAt?: Date | null;
  evaluationEndAt?: Date | null;
  approvalDeadline?: Date | null;
  scoringCriteriaIds?: string[];
  evaluationCriteriaIds?: string[];
  emailTemplateIds?: string[];
  invitedOrganizationIds?: string[];
};

export type UpdateCycleInput = Partial<CreateCycleInput> & {
  id: string;
};

// =============================================================================
// DETAIL — feeds Plan 03-06 6 tabs
// =============================================================================

export type CycleAttachmentSummary = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  signedNumber: string | null;
  signedDate: Date | null;
  signedByName: string | null;
  signedByTitle: string | null;
  uploadedById: string;
  createdAt: Date;
};

export type CycleOrganizationSummary = {
  id: string;
  name: string;
  code: string;
};

export type CycleDispatchSummaryRow = {
  id: string;
  subject: string;
  type: string;
  createdAt: Date;
  dispatchCount: number;
  sentAt: Date | null;
};

export type CycleDetail = {
  id: string;
  year: number;
  name: string;
  description: string | null; // stored inside configJson.description (ProgramCycle model has no description column)
  status: ProgramCycleStatus;
  totalBudget: number | null;
  registrationOpenAt: Date | null;
  registrationCloseAt: Date | null;
  supplementDeadline: Date | null;
  evaluationStartAt: Date | null;
  evaluationEndAt: Date | null;
  approvalDeadline: Date | null;
  invitationLetterAttachmentId: string | null;
  invitationLetterAttachment: CycleAttachmentSummary | null;
  invitedOrganizationIds: string[];
  invitedOrganizations: CycleOrganizationSummary[];
  scoringCriteriaIds: string[];
  evaluationCriteriaIds: string[];
  emailTemplateIds: string[];
  configJson: Record<string, unknown> | null;
  dispatchSummary: CycleDispatchSummaryRow[];
  projectCount: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};
