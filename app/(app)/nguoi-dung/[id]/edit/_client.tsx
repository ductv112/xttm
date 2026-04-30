'use client';

// Edit user form — prefilled from server, username readonly, role disabled khi self.

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUser } from '../../_actions/update';
import {
  updateUserSchema,
  type UpdateUserInput,
} from '../../_actions/schemas';
import type { OrgOption, UserListRow } from '../../_actions/list';
import { UserFormFields } from '../../_components/UserFormFields';

type Props = {
  user: UserListRow;
  orgs: OrgOption[];
  isSelf: boolean;
};

export function EditUserClient({ user, orgs, isSelf }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email ?? '',
      phone: user.phone ?? '',
      role: user.role,
      organizationId: user.organizationId ?? null,
      isActive: user.isActive,
    },
  });

  async function onSubmit(values: UpdateUserInput) {
    setSubmitting(true);
    try {
      const updated = await updateUser(user.id, values);
      toast.success(`Đã cập nhật thông tin ${updated.fullName}`);
      router.push('/nguoi-dung');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/nguoi-dung">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Quay lại danh sách
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">
          Chỉnh sửa người dùng: {user.fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cập nhật thông tin tài khoản. Tên đăng nhập và mật khẩu không thể thay
          đổi tại đây.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 rounded-md border border-slate-200 bg-white p-6"
        >
          {/* Read-only username display — keep visible for context but not editable */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <Label className="text-sm">Tên đăng nhập</Label>
              <Input
                value={user.username}
                readOnly
                disabled
                className="mt-2 bg-slate-50"
              />
              <p className="mt-1 text-sm text-slate-500">
                Không thể thay đổi sau khi tạo
              </p>
            </div>
          </div>

          <UserFormFields
            form={form}
            mode="edit"
            orgs={orgs}
            disableRoleSelect={isSelf}
            disableRoleReason={
              isSelf
                ? 'Không thể tự thay đổi vai trò của chính mình'
                : undefined
            }
          />

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/nguoi-dung')}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
