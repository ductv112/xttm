'use client';

// DonViMoiManager — 2-section layout cho tab Đơn vị mời + thông báo.
// Plan 03-06 CYCLE-04 + CYCLE-13:
//   1. Left: danh sách đơn vị mời (CRUD: × remove, MultiSelect "Thêm đơn vị")
//   2. Right: InvitationComposer (Tiptap + variables + send)
// Bottom: DispatchHistoryList — lịch sử thông báo đã gửi.
//
// Edit-orgs flow:
//   - Click "Thêm/sửa đơn vị" opens Sheet với MultiSelect organizations
//   - Apply gọi updateCycle({id, invitedOrganizationIds}) — server revalidates path
//   - Per-row × button removes single org tương tự (also via updateCycle)

import * as React from 'react';
import { Building2, Loader2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/shared/MultiSelect';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { updateCycle } from '../../_actions';
import type { CycleDetail } from '../../_actions/types';
import { InvitationComposer } from './InvitationComposer';
import { DispatchHistoryList } from './DispatchHistoryList';

export type DonViMoiManagerProps = {
  cycle: CycleDetail;
  allOrganizations: ReadonlyArray<{ id: string; name: string; code: string }>;
  canEdit: boolean;
};

export function DonViMoiManager({
  cycle,
  allOrganizations,
  canEdit,
}: DonViMoiManagerProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [pendingIds, setPendingIds] = React.useState<string[]>(
    cycle.invitedOrganizationIds.slice()
  );
  const [submitting, setSubmitting] = React.useState(false);

  const orgOptions = React.useMemo(
    () =>
      allOrganizations.map((o) => ({
        value: o.id,
        label: o.name,
      })),
    [allOrganizations]
  );

  React.useEffect(() => {
    if (editOpen) {
      setPendingIds(cycle.invitedOrganizationIds.slice());
    }
  }, [editOpen, cycle.invitedOrganizationIds]);

  const handleApplyEdit = async () => {
    setSubmitting(true);
    try {
      await updateCycle({
        id: cycle.id,
        invitedOrganizationIds: pendingIds,
      });
      toast.success('Đã cập nhật danh sách đơn vị mời');
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật danh sách');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOne = async (orgId: string) => {
    if (!canEdit) return;
    setSubmitting(true);
    try {
      const next = cycle.invitedOrganizationIds.filter((id) => id !== orgId);
      await updateCycle({
        id: cycle.id,
        invitedOrganizationIds: next,
      });
      toast.success('Đã xóa đơn vị khỏi danh sách');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa đơn vị');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ===== Left: Danh sách đơn vị mời ===== */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Danh sách đơn vị mời
              </h3>
              <p className="text-xs text-slate-500">
                {cycle.invitedOrganizations.length} đơn vị được mời tham gia
              </p>
            </div>
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                disabled={submitting}
              >
                <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
                Sửa danh sách
              </Button>
            ) : null}
          </div>

          {cycle.invitedOrganizations.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <Building2
                className="mx-auto mb-2 h-8 w-8 text-slate-400"
                aria-hidden="true"
              />
              <p className="text-sm text-slate-600">Chưa có đơn vị nào được mời</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cycle.invitedOrganizations.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2
                      className="h-4 w-4 shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {org.name}
                      </p>
                      <p className="text-xs text-slate-500">{org.code}</p>
                    </div>
                  </div>
                  {canEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Xóa ${org.name}`}
                      onClick={() => handleRemoveOne(org.id)}
                      disabled={submitting}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ===== Right: Composer ===== */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Soạn thông báo gửi
          </h3>
          {canEdit ? (
            <InvitationComposer cycle={cycle} />
          ) : (
            <p className="text-sm text-slate-600">
              Bạn không có quyền gửi thông báo từ chu kỳ này.
            </p>
          )}
        </section>
      </div>

      {/* ===== Bottom: Lịch sử dispatch ===== */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          Lịch sử thông báo đã gửi
        </h3>
        <DispatchHistoryList dispatches={cycle.dispatchSummary} />
      </section>

      {/* ===== Edit orgs sheet ===== */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" size="lg">
          <SheetHeader>
            <SheetTitle>Sửa danh sách đơn vị mời</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-1">
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Chọn các đơn vị được mời tham gia chu kỳ. Các đơn vị bị bỏ tích sẽ
                được xóa khỏi danh sách mời.
              </p>
              <MultiSelect
                options={orgOptions}
                values={pendingIds}
                onChange={setPendingIds}
                placeholder="Chọn đơn vị mời"
                searchPlaceholder="Tìm theo tên đơn vị..."
                maxBadgesShown={6}
              />
              <p className="text-xs text-slate-500">
                Đã chọn {pendingIds.length} / {allOrganizations.length} đơn vị
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleApplyEdit}
                disabled={submitting || pendingIds.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                    Đang lưu...
                  </>
                ) : (
                  'Áp dụng'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default DonViMoiManager;
