'use client';

// CopyFromPreviousDialog — Dialog mở khi user click "Sao chép từ đề án cũ" (PROJ-13).
// Placeholder shell for Task 2 — full impl in Task 3 (uses copyFromPrevious server
// action, redirects to /de-an/[newId] hoặc replaces store data).

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

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
  const [loading] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sao chép từ đề án cũ</DialogTitle>
          <DialogDescription>
            Chọn một đề án đã được phê duyệt từ năm trước để sao chép các thông
            tin (trừ thời gian và năm) sang đề án mới.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {previousProjects.length === 0 ? (
            <EmptyState
              icon="file-x"
              heading="Chưa có đề án cũ phù hợp"
              description="Chỉ những đề án đã phê duyệt hoặc nghiệm thu mới có thể được sao chép."
            />
          ) : (
            <div className="space-y-2 text-sm text-slate-600">
              <p>Có {previousProjects.length} đề án có thể sao chép:</p>
              <ul className="list-disc pl-6">
                {previousProjects.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <span className="font-mono text-xs">{p.code}</span> —{' '}
                    <span>{p.name}</span>{' '}
                    <span className="text-slate-500">(năm {p.year})</span>
                  </li>
                ))}
                {previousProjects.length > 5 ? (
                  <li className="text-slate-500">
                    ... và {previousProjects.length - 5} đề án khác.
                  </li>
                ) : null}
              </ul>
              <p className="text-xs text-slate-500 italic">
                Form chọn và sao chép đầy đủ sẽ được hoàn thiện trong Task 3 của
                plan 05-02.
              </p>
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
            Đóng
          </Button>
          <Button type="button" disabled>
            {loading ? (
              <Loader2
                className="mr-1.5 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            Sao chép
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CopyFromPreviousDialog;
