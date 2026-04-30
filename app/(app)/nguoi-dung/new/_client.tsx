'use client';

// Create user form — RHF + Zod resolver + redirect on success.

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { createUser } from '../_actions/create';
import {
  createUserSchema,
  type CreateUserInput,
} from '../_actions/schemas';
import type { OrgOption } from '../_actions/list';
import { UserFormFields } from '../_components/UserFormFields';

type Props = {
  orgs: OrgOption[];
};

export function CreateUserClient({ orgs }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      role: undefined,
      organizationId: null,
      isActive: true,
    },
  });

  async function onSubmit(values: CreateUserInput) {
    setSubmitting(true);
    try {
      const created = await createUser(values);
      toast.success(`Đã tạo người dùng ${created.fullName}`);
      router.push('/nguoi-dung');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tạo người dùng thất bại';
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
          Tạo người dùng mới
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Khai báo thông tin tài khoản và phân vai trò trong hệ thống
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 rounded-md border border-slate-200 bg-white p-6"
        >
          <UserFormFields form={form} mode="create" orgs={orgs} />

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
                  Đang tạo...
                </>
              ) : (
                'Tạo người dùng'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
