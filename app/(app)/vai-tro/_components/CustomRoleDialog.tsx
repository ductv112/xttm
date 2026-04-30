'use client';

// CustomRoleDialog — create/edit dialog cho vai trò tùy chỉnh.
// Mode 'create': nhập code + name + description; submit gọi createCustomRole
// Mode 'edit': code immutable (disabled input), chỉ name + description; submit gọi updateCustomRole

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  customRoleCreateSchema,
  customRoleUpdateSchema,
  type CustomRoleCreateInput,
  type CustomRoleUpdateInput,
} from '../_actions/schemas';
import {
  createCustomRole,
  updateCustomRole,
} from '../_actions/custom-role';

export type CustomRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  /** Required khi mode='edit' */
  role?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
};

export function CustomRoleDialog({
  open,
  onOpenChange,
  mode,
  role,
}: CustomRoleDialogProps) {
  if (mode === 'edit' && !role) {
    // Defensive — render nothing nếu mode edit thiếu role
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {mode === 'create' ? (
          <CreateRoleForm onClose={() => onOpenChange(false)} />
        ) : (
          <EditRoleForm
            role={role!}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

function CreateRoleForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const form = useForm<CustomRoleCreateInput>({
    resolver: zodResolver(customRoleCreateSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const mutation = useMutation({
    mutationFn: async (input: CustomRoleCreateInput) =>
      createCustomRole(input),
    onSuccess: (result) => {
      toast.success(`Đã tạo vai trò "${result.name}"`);
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
      void queryClient.invalidateQueries({ queryKey: ['matrix'] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Tạo vai trò thất bại';
      toast.error(message);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tạo vai trò mới</DialogTitle>
        <DialogDescription>
          Vai trò tùy chỉnh sẽ xuất hiện trong ma trận phân quyền và có thể gán
          quyền chi tiết cho từng phân hệ.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="role-code">
            Mã vai trò <span className="text-red-600">*</span>
          </Label>
          <Input
            id="role-code"
            placeholder="VD: NHANVIEN_NHAP_LIEU"
            autoComplete="off"
            {...form.register('code')}
            disabled={mutation.isPending}
            className="font-mono"
          />
          <p className="text-xs text-slate-500">
            Chữ in hoa, số, gạch dưới; bắt đầu bằng chữ. Không trùng vai trò
            hệ thống.
          </p>
          {form.formState.errors.code ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.code.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role-name">
            Tên hiển thị <span className="text-red-600">*</span>
          </Label>
          <Input
            id="role-name"
            placeholder="VD: Nhân viên nhập liệu"
            {...form.register('name')}
            disabled={mutation.isPending}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role-description">Mô tả</Label>
          <Textarea
            id="role-description"
            rows={3}
            placeholder="Mô tả ngắn gọn phạm vi trách nhiệm của vai trò này"
            {...form.register('description')}
            disabled={mutation.isPending}
          />
          {form.formState.errors.description ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Đang tạo...
              </>
            ) : (
              'Tạo vai trò'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// Edit form
// ---------------------------------------------------------------------------

function EditRoleForm({
  role,
  onClose,
}: {
  role: NonNullable<CustomRoleDialogProps['role']>;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<CustomRoleUpdateInput>({
    resolver: zodResolver(customRoleUpdateSchema),
    defaultValues: {
      name: role.name,
      description: role.description ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (input: CustomRoleUpdateInput) =>
      updateCustomRole(role.id, input),
    onSuccess: (result) => {
      toast.success(`Đã cập nhật vai trò "${result.name}"`);
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
      void queryClient.invalidateQueries({ queryKey: ['matrix'] });
      onClose();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Cập nhật vai trò thất bại';
      toast.error(message);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Chỉnh sửa vai trò</DialogTitle>
        <DialogDescription>
          Mã vai trò không thể thay đổi sau khi tạo. Bạn có thể chỉnh tên hiển
          thị và mô tả.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="role-code-edit">Mã vai trò</Label>
          <Input
            id="role-code-edit"
            value={role.code}
            disabled
            className="font-mono"
          />
          <p className="text-xs text-slate-500">
            Mã vai trò không thể thay đổi sau khi tạo.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role-name-edit">
            Tên hiển thị <span className="text-red-600">*</span>
          </Label>
          <Input
            id="role-name-edit"
            {...form.register('name')}
            disabled={mutation.isPending}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role-description-edit">Mô tả</Label>
          <Textarea
            id="role-description-edit"
            rows={3}
            {...form.register('description')}
            disabled={mutation.isPending}
          />
          {form.formState.errors.description ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
