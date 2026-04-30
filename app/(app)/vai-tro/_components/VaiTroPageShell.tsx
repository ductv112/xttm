'use client';

// Client wrapper combining RoleListCard + PermissionMatrixGrid trong shadcn Tabs
// + button "Đồng bộ từ mặc định" (gọi seedPermissionsFromMatrix với confirm).

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { toast } from 'sonner';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';

import type { RoleSummary, MatrixData } from '../_actions/list';
import { seedPermissionsFromMatrix } from '../_actions/seed-from-matrix';
import { RoleListCard } from './RoleListCard';
import { PermissionMatrixGrid } from './PermissionMatrixGrid';

export type VaiTroPageShellProps = {
  initialRoles: RoleSummary[];
  initialMatrix: MatrixData;
};

export function VaiTroPageShell({
  initialRoles,
  initialMatrix,
}: VaiTroPageShellProps) {
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = React.useState<'roles' | 'matrix'>('roles');

  const reSyncMutation = useMutation({
    mutationFn: async () => seedPermissionsFromMatrix(),
    onSuccess: (result) => {
      toast.success(
        `Đã đồng bộ ma trận: ${result.roleCount} vai trò, ${result.permissionCount} quyền, ${result.grantCount} ô đã cấp`,
      );
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
      void queryClient.invalidateQueries({ queryKey: ['matrix'] });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Đồng bộ thất bại';
      toast.error(message);
    },
  });

  const handleReSync = async () => {
    const ok = await confirm({
      title: 'Đồng bộ ma trận về cấu hình mặc định?',
      description:
        'Hành động này sẽ thiết lập lại quyền cho 7 vai trò hệ thống về giá trị mặc định trong code (lib/permissions.ts MATRIX). Quyền tùy chỉnh đã thêm sẽ được giữ nguyên, nhưng các thay đổi đã thu hồi sẽ bị reset.',
      confirmLabel: 'Đồng bộ',
      variant: 'destructive',
    });
    if (ok) reSyncMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Vai trò &amp; Phân quyền
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý vai trò người dùng và ma trận phân quyền chi tiết theo từng
            phân hệ và hành động.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleReSync}
          disabled={reSyncMutation.isPending}
        >
          <RotateCw
            className={
              reSyncMutation.isPending
                ? 'h-4 w-4 animate-spin'
                : 'h-4 w-4'
            }
            aria-hidden="true"
          />
          {reSyncMutation.isPending ? 'Đang đồng bộ...' : 'Đồng bộ từ mặc định'}
        </Button>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'roles' | 'matrix')}
      >
        <TabsList>
          <TabsTrigger value="roles">Danh sách vai trò</TabsTrigger>
          <TabsTrigger value="matrix">Ma trận phân quyền</TabsTrigger>
        </TabsList>
        <TabsContent value="roles">
          <RoleListCard
            initialRoles={initialRoles}
            onSwitchToMatrix={() => setActiveTab('matrix')}
          />
        </TabsContent>
        <TabsContent value="matrix">
          <PermissionMatrixGrid initialData={initialMatrix} />
        </TabsContent>
      </Tabs>

      {dialog}
    </div>
  );
}
