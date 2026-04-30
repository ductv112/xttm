// Pure Zod schemas — no 'use server' directive (importable từ client RHF forms).

import { z } from 'zod';

const ACTION_VALUES = [
  'read',
  'create',
  'update',
  'delete',
  'submit',
  'approve',
  'assign',
  'score',
] as const;

export const grantPermissionSchema = z.object({
  roleCode: z
    .string({ message: 'Thiếu mã vai trò' })
    .min(1, 'Thiếu mã vai trò'),
  resource: z
    .string({ message: 'Thiếu tài nguyên' })
    .min(1, 'Thiếu tài nguyên'),
  action: z.enum(ACTION_VALUES, { message: 'Hành động không hợp lệ' }),
  granted: z.boolean(),
});

export type GrantPermissionInput = z.input<typeof grantPermissionSchema>;
export type GrantPermissionParsed = z.output<typeof grantPermissionSchema>;

export const customRoleCreateSchema = z.object({
  code: z
    .string({ message: 'Vui lòng nhập mã vai trò' })
    .trim()
    .regex(
      /^[A-Z][A-Z0-9_]{2,49}$/,
      'Mã vai trò: chữ in hoa, số, gạch dưới; bắt đầu bằng chữ; 3-50 ký tự',
    ),
  name: z
    .string({ message: 'Vui lòng nhập tên hiển thị' })
    .trim()
    .min(2, 'Tên hiển thị tối thiểu 2 ký tự')
    .max(100, 'Tên hiển thị tối đa 100 ký tự'),
  description: z
    .string()
    .trim()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
});

export type CustomRoleCreateInput = z.input<typeof customRoleCreateSchema>;

export const customRoleUpdateSchema = z.object({
  name: z
    .string({ message: 'Vui lòng nhập tên hiển thị' })
    .trim()
    .min(2, 'Tên hiển thị tối thiểu 2 ký tự')
    .max(100, 'Tên hiển thị tối đa 100 ký tự'),
  description: z
    .string()
    .trim()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
});

export type CustomRoleUpdateInput = z.input<typeof customRoleUpdateSchema>;
