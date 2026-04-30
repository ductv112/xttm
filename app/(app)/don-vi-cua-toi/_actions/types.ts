// Shared types + Zod schemas for OrganizationProfile server actions.
// 'use server' modules can ONLY export async functions — Zod schemas live here
// (no 'use server' marker) and are imported into per-action modules where they
// are used internally for validation. Schemas are NOT re-exported across the
// 'use server' boundary (Next 15 rule).

import { z } from 'zod';
import {
  ORG_PROFILE_CONTACT_ROLES,
  type OrgProfileCapabilities,
  type OrgProfileContact,
  type OrgProfileLegalInfo,
  type OrgProfileStatus,
} from '@/lib/workflows/orgProfile';

// =============================================================================
// VALIDATION REGEX (Vietnamese phone, email)
// =============================================================================

// VN phone: +84xxxxxxxxx hoặc 0[3|5|7|8|9]xxxxxxxx (10 digits)
export const VN_PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

// Vietnamese tax code: 10 digits or 10-3 (chi nhánh)
export const VN_TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/;

// =============================================================================
// INTERNAL ZOD SCHEMAS (consumed by update.ts + contacts.ts)
// =============================================================================

export const legalInfoInternal = z.object({
  taxCode: z
    .string()
    .trim()
    .max(20, 'Mã số thuế tối đa 20 ký tự')
    .regex(VN_TAX_CODE_REGEX, 'Mã số thuế không đúng định dạng (10 chữ số, có thể có -xxx chi nhánh)')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, 'Địa chỉ tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
  representativeName: z
    .string()
    .trim()
    .max(200, 'Họ tên người đại diện tối đa 200 ký tự')
    .optional()
    .or(z.literal('')),
  representativeTitle: z
    .string()
    .trim()
    .max(100, 'Chức danh tối đa 100 ký tự')
    .optional()
    .or(z.literal('')),
  businessType: z
    .string()
    .trim()
    .max(100, 'Loại hình tổ chức tối đa 100 ký tự')
    .optional()
    .or(z.literal('')),
  businessField: z
    .string()
    .trim()
    .max(300, 'Lĩnh vực hoạt động tối đa 300 ký tự')
    .optional()
    .or(z.literal('')),
});

export const pastProjectInternal = z.object({
  name: z
    .string({ message: 'Vui lòng nhập tên đề án' })
    .trim()
    .min(2, 'Tên đề án tối thiểu 2 ký tự')
    .max(300, 'Tên đề án tối đa 300 ký tự'),
  year: z
    .number()
    .int('Năm phải là số nguyên')
    .min(2000, 'Năm tối thiểu 2000')
    .max(2100, 'Năm tối đa 2100')
    .nullable(),
  outcome: z
    .string()
    .trim()
    .max(500, 'Kết quả tối đa 500 ký tự'),
});

export const capabilitiesInternal = z.object({
  description: z
    .string()
    .max(20_000, 'Mô tả năng lực tối đa 20.000 ký tự')
    .optional()
    .or(z.literal('')),
  achievements: z
    .string()
    .trim()
    .max(2000, 'Thành tích tối đa 2000 ký tự')
    .optional()
    .or(z.literal('')),
  pastProjects: z.array(pastProjectInternal).max(20, 'Tối đa 20 đề án trong danh sách').optional(),
});

export const contactInternal = z.object({
  id: z.string().min(1).max(64),
  name: z
    .string({ message: 'Vui lòng nhập họ tên đầu mối' })
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(200, 'Họ tên tối đa 200 ký tự'),
  title: z
    .string()
    .trim()
    .max(50, 'Chức danh tối đa 50 ký tự')
    .optional()
    .or(z.literal('')),
  role: z.enum(ORG_PROFILE_CONTACT_ROLES, {
    message: 'Vui lòng chọn vai trò đầu mối',
  }),
  email: z
    .string({ message: 'Vui lòng nhập email' })
    .trim()
    .email('Email không đúng định dạng')
    .max(200, 'Email tối đa 200 ký tự'),
  phone: z
    .string({ message: 'Vui lòng nhập số điện thoại' })
    .trim()
    .regex(VN_PHONE_REGEX, 'Số điện thoại Việt Nam không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)'),
});

export const contactsInternal = z
  .array(contactInternal)
  .max(20, 'Tối đa 20 đầu mối liên hệ');

// =============================================================================
// EXTERNAL TYPES (RSC / client consumer)
// =============================================================================

export type OrgProfileSummary = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  status: OrgProfileStatus;
  legalInfo: OrgProfileLegalInfo;
  capabilities: OrgProfileCapabilities;
  contacts: OrgProfileContact[];
  rejectionReason: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  approvedById: string | null;
  approvedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrgProfileDocument = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  category: string | null; // signedNumber column repurposed for category in this entity
  uploadedAt: Date;
  uploaderName: string | null;
};

export type OrgProfileWithDocuments = OrgProfileSummary & {
  documents: OrgProfileDocument[];
};

export type UpdateMyProfileInput = {
  legalInfo?: z.infer<typeof legalInfoInternal>;
  capabilities?: z.infer<typeof capabilitiesInternal>;
  contacts?: z.infer<typeof contactsInternal>;
};

// =============================================================================
// LIST FILTER (BQL)
// =============================================================================

export type OrgProfileListFilter = {
  status?: OrgProfileStatus | 'ALL';
  search?: string;
};

export type OrgProfileListItem = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  organizationType: string;
  status: OrgProfileStatus;
  taxCode: string | null;
  representativeName: string | null;
  contactCount: number;
  documentCount: number;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  updatedAt: Date;
};
