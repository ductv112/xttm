'use client';

// CopyFromPreviousDialog — Dialog mở khi user click "Sao chép từ đề án cũ" (PROJ-13).
// Behavior:
//   1. User chọn 1 đề án nguồn (radio list)
//   2. Click "Sao chép" → call copyFromPrevious server action (clones to new DRAFT)
//   3. Server returns new project id → router.push('/de-an/[newId]') để mở wizard cho
//      đề án mới (URL change resets store via wizardStore initial state).
//
// Note: copyFromPrevious creates a NEW Project record server-side; client redirects
// vào URL chi tiết — Phase 5 plan 05-03 sẽ wire detail page. Tạm thời redirect về
// /de-an để đơn vị thấy đề án mới trong list.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

import { copyFromPrevious } from '@/app/(app)/de-an/_actions/copy-from-previous';
import { useProjectWizardStore } from '../_lib/wizardStore';
import type { PreviousProjectOption } from '../_lib/types';

export type CopyFromPreviousDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousProjects: PreviousProjectOption[];
};

export function CopyFromPreviousDialog({
  open,
  onOpenChange,
  previousProjects,
}: CopyFromPreviousDialogProps) {
  const router = useRouter();
  const resetWizard = useProjectWizardStore((s) => s.resetWizard);
  const setCopyFromProjectId = useProjectWizardStore(
    (s) => s.setCopyFromProjectId,
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setLoading(false);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!selectedId) {
      toast.warning('Vui lòng chọn đề án nguồn trước khi sao chép');
      return;
    }
    setLoading(true);
    try {
      const result = await copyFromPrevious(selectedId);
      toast.success(
        `Đã sao chép sang đề án mới: ${result.code} — ${result.name}`,
      );
      // Reset wizard state so the user starts the new draft fresh; server-side
      // already populated all fields, navigation to /de-an surfaces the new draft
      // and the user can re-enter wizard via "Tiếp tục khai báo".
      setCopyFromProjectId(selectedId);
      resetWizard();
      onOpenChange(false);
      router.push('/de-an');
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Không thể sao chép đề án';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sao chép từ đề án cũ</DialogTitle>
          <DialogDescription>
            Chọn một đề án đã được phê duyệt hoặc nghiệm thu để sao chép thông
            tin (loại đề án, ngành hàng, mục tiêu, kế hoạch, dự toán). Thời gian
            và năm sẽ được đặt lại theo chu kỳ hiện hành.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {previousProjects.length === 0 ? (
            <EmptyState
              icon="file-x"
              heading="Chưa có đề án cũ phù hợp"
              description="Chỉ những đề án đã phê duyệt, đang triển khai hoặc đã nghiệm thu mới có thể được sao chép."
            />
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
              {previousProjects.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    )}
                    aria-pressed={isSelected}
                  >
                    <FileText
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0',
                        isSelected ? 'text-blue-600' : 'text-slate-400',
                      )}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-700">
                          {p.code}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Năm {p.year}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900 line-clamp-2">
                        {p.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={
              loading || !selectedId || previousProjects.length === 0
            }
          >
            {loading ? (
              <Loader2
                className="mr-1.5 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            Sao chép sang đề án mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CopyFromPreviousDialog;
