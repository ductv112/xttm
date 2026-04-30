'use client';

// Shared form fields cho create + edit user. RHF Controller pattern via shadcn Form.

import * as React from 'react';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/constants';
import type { OrgOption } from '../_actions/list';

// Generic over field values shape so create + edit forms can reuse this
// component while staying type-safe per their own schema.
export type UserFormFieldsProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  mode: 'create' | 'edit';
  orgs: OrgOption[];
  /** When true, the role select is disabled with a helper note (used khi user đang edit chính mình) */
  disableRoleSelect?: boolean;
  /** Reason text shown next to disabled role (eg "Không thể tự thay đổi vai trò của mình") */
  disableRoleReason?: string;
};

const ROLE_OPTIONS = (Object.values(ROLES) as Role[]).map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

const NO_ORG = '__none__';

export function UserFormFields<T extends FieldValues>({
  form,
  mode,
  orgs,
  disableRoleSelect,
  disableRoleReason,
}: UserFormFieldsProps<T>) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Họ và tên */}
      <FormField
        control={form.control}
        name={'fullName' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Họ và tên <span className="text-red-600">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Nguyễn Văn A" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tên đăng nhập — readonly khi edit */}
      {mode === 'create' ? (
        <FormField
          control={form.control}
          name={'username' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tên đăng nhập <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="username"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Chỉ chữ thường, số, dấu gạch dưới và gạch ngang. Không thể thay
                đổi sau khi tạo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {/* Email */}
      <FormField
        control={form.control}
        name={'email' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="user@xttm.gov.vn"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Số điện thoại */}
      <FormField
        control={form.control}
        name={'phone' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Số điện thoại</FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder="+84 ..."
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mật khẩu — chỉ render khi create */}
      {mode === 'create' ? (
        <FormField
          control={form.control}
          name={'password' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mật khẩu <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Người dùng có thể đổi mật khẩu sau khi đăng nhập.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {/* Vai trò */}
      <FormField
        control={form.control}
        name={'role' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Vai trò <span className="text-red-600">*</span>
            </FormLabel>
            <FormControl>
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
                disabled={disableRoleSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Chọn vai trò --" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            {disableRoleSelect && disableRoleReason ? (
              <FormDescription>{disableRoleReason}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Đơn vị */}
      <FormField
        control={form.control}
        name={'organizationId' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Đơn vị</FormLabel>
            <FormControl>
              <Select
                value={field.value && field.value.length > 0 ? field.value : NO_ORG}
                onValueChange={(val) =>
                  field.onChange(val === NO_ORG ? null : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ORG}>Không thuộc đơn vị nào</SelectItem>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Trạng thái */}
      <FormField
        control={form.control}
        name={'isActive' as Path<T>}
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <FormLabel>Trạng thái</FormLabel>
            <FormControl>
              <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                <Switch
                  checked={field.value === true}
                  onCheckedChange={field.onChange}
                  aria-label="Trạng thái hoạt động"
                />
                <span className="text-sm text-slate-700">
                  {field.value === true ? 'Đang hoạt động' : 'Đã khóa'}
                </span>
              </div>
            </FormControl>
            <FormDescription>
              Tài khoản bị khóa sẽ không thể đăng nhập.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
