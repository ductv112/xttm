// Zod schemas cho user management — pure schemas, importable từ client.
// KHÔNG có 'use server' directive ở đây để client component có thể import.

import { z } from 'zod';
import { ROLES } from '@/lib/constants';

// Tuple type [string, ...string[]] required by z.enum
const ROLE_VALUES = Object.values(ROLES) as [string, ...string[]];

export const createUserSchema = z.object({
  fullName: z
    .string({ message: 'Vui lòng nhập họ và tên' })
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự'),
  username: z
    .string({ message: 'Vui lòng nhập tên đăng nhập' })
    .trim()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự')
    .regex(
      /^[a-z0-9_-]+$/i,
      'Tên đăng nhập chỉ chứa chữ, số, gạch dưới, gạch ngang',
    ),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Số điện thoại quá dài')
    .optional()
    .or(z.literal('')),
  password: z
    .string({ message: 'Vui lòng nhập mật khẩu' })
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự'),
  role: z.enum(ROLE_VALUES, { message: 'Vui lòng chọn vai trò' }),
  organizationId: z.string().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});

export type CreateUserInput = z.input<typeof createUserSchema>;

// Update — username + password not editable; email/phone/orgId optional & nullable.
export const updateUserSchema = z.object({
  fullName: z
    .string({ message: 'Vui lòng nhập họ và tên' })
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự'),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Số điện thoại quá dài')
    .optional()
    .or(z.literal('')),
  role: z.enum(ROLE_VALUES, { message: 'Vui lòng chọn vai trò' }),
  organizationId: z.string().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});

export type UpdateUserInput = z.input<typeof updateUserSchema>;

// List filter
export const listUsersFilterSchema = z.object({
  keyword: z.string().optional(),
  roles: z.array(z.string()).optional(),
  organizationIds: z.array(z.string()).optional(),
  status: z.enum(['all', 'active', 'locked']).default('all').optional(),
});

export type ListUsersFilterInput = z.input<typeof listUsersFilterSchema>;
export type ListUsersFilter = z.output<typeof listUsersFilterSchema>;
