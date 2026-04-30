'use client';

// RoleListCard — tab "Danh sách vai trò".
// Grid 3 cột (responsive). Mỗi role render Card với:
// - Badge "Hệ thống" (slate) hoặc "Tùy chỉnh" (blue)
// - Title: ROLE_LABELS[code] hoặc role.name
// - Description: role.description hoặc placeholder
// - Stats: N người dùng + M quyền chức năng
// - Footer: "Xem ma trận" + (custom only) "Chỉnh sửa" + "Xóa"
// - Top-right: "Tạo vai trò mới"

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Shield, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ROLE_LABELS } from '@/lib/constants';

import { listRoles, type RoleSummary } from '../_actions/list';
import { deleteCustomRole } from '../_actions/custom-role';
import { CustomRoleDialog } from './CustomRoleDialog';

export type RoleListCardProps = {
  initialRoles: RoleSummary[];
  /** Khi user click "Xem ma trận" — chuyển sang tab matrix */
  onSwitchToMatrix?: () => void;
};

export function RoleListCard({
  initialRoles,
  onSwitchToMatrix,
}: RoleListCardProps) {
  const queryClient = useQueryClient();
  const { confirm, dialog: confirmDialogElement } = useConfirmDialog();

  const { data: roles } = useQuery<RoleSummary[]>({
    queryKey: ['roles'],
    queryFn: () => listRoles(),
    initialData: initialRoles,
    staleTime: 5_000,
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<RoleSummary | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteCustomRole(id),
    onSuccess: (result) => {
      toast.success(`Đã xóa vai trò "${result.code}"`);
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
      void queryClient.invalidateQueries({ queryKey: ['matrix'] });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Xóa vai trò thất bại';
      toast.error(message);
    },
  });

  const handleDelete = async (role: RoleSummary) => {
    const ok = await confirm({
      title: `Xác nhận xóa vai trò "${role.name}"`,
      description:
        role.userCount > 0
          ? `Vai trò đang được gán cho ${role.userCount} người dùng. Vui lòng chuyển vai trò khác trước khi xóa.`
          : 'Hành động này sẽ xóa vĩnh viễn vai trò và mọi cấu hình quyền liên quan.',
      confirmLabel: 'Xóa vai trò',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(role.id);
  };

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          Hệ thống có {systemRoles.length} vai trò mặc định và{' '}
          {customRoles.length} vai trò tùy chỉnh.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tạo vai trò mới
        </Button>
      </div>

      {/* System roles */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Vai trò hệ thống
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systemRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onSwitchToMatrix={onSwitchToMatrix}
            />
          ))}
        </div>
      </section>

      {/* Custom roles */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Vai trò tùy chỉnh
        </h3>
        {customRoles.length === 0 ? (
          <EmptyState
            icon="shield"
            heading="Chưa có vai trò tùy chỉnh"
            description="Tạo vai trò tùy chỉnh để gán nhóm quyền riêng ngoài 7 vai trò hệ thống."
            action={{
              label: 'Tạo vai trò mới',
              onClick: () => setCreateOpen(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onSwitchToMatrix={onSwitchToMatrix}
                onEdit={() => setEditTarget(role)}
                onDelete={() => handleDelete(role)}
              />
            ))}
          </div>
        )}
      </section>

      <CustomRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
      {editTarget ? (
        <CustomRoleDialog
          open={editTarget !== null}
          onOpenChange={(o) => {
            if (!o) setEditTarget(null);
          }}
          mode="edit"
          role={{
            id: editTarget.id,
            code: editTarget.code,
            name: editTarget.name,
            description: editTarget.description,
          }}
        />
      ) : null}

      {confirmDialogElement}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RoleCard — single role tile
// ---------------------------------------------------------------------------

type RoleCardProps = {
  role: RoleSummary;
  onSwitchToMatrix?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

function RoleCard({ role, onSwitchToMatrix, onEdit, onDelete }: RoleCardProps) {
  const displayName =
    role.isSystem && (ROLE_LABELS as Record<string, string>)[role.code]
      ? (ROLE_LABELS as Record<string, string>)[role.code]
      : role.name;
  const description = role.description?.trim() || 'Chưa có mô tả vai trò';

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
              <Shield
                className="h-4 w-4 text-slate-600"
                aria-hidden="true"
              />
            </div>
            <Badge
              variant={role.isSystem ? 'secondary' : 'outline'}
              className={
                role.isSystem
                  ? 'bg-slate-100 text-slate-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }
            >
              {role.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-base font-semibold text-slate-900">
          {displayName}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {description}
        </CardDescription>
        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
          {role.code}
        </p>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className="font-medium">{role.userCount}</span>
            <span className="text-slate-500">người dùng</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Shield className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className="font-medium">{role.grantCount}</span>
            <span className="text-slate-500">quyền chức năng</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2 px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onSwitchToMatrix}
          className="flex-1"
        >
          Xem ma trận
        </Button>
        {!role.isSystem ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onEdit}
              title="Chỉnh sửa"
              aria-label={`Chỉnh sửa ${displayName}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              title="Xóa vai trò"
              aria-label={`Xóa ${displayName}`}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        ) : null}
      </CardFooter>
    </Card>
  );
}
