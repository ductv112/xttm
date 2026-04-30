'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ConfirmDialogVariant = 'default' | 'destructive';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  /** Called khi user click confirm. Có thể async — dialog tự manage loading state nội bộ */
  onConfirm: () => Promise<void> | void;
  /** External loading override — useful khi parent muốn block confirm during pending mutation */
  loading?: boolean;
};

/**
 * Confirmation dialog wrapper trên shadcn AlertDialog.
 *
 * - Variant `destructive`: confirm button đỏ (`bg-destructive`), dùng cho xóa/huỷ/khoá tài khoản.
 * - Variant `default`: confirm button primary navy.
 * - Cancel button auto-focused (via shadcn AlertDialogCancel default behaviour) → ESC dismiss + nhấn Enter không trigger confirm bừa.
 * - Loading state: tự track internal `isPending` khi `onConfirm` trả Promise; combined với `loading` prop từ parent.
 *
 * @example
 *   <ConfirmDialog
 *     open={openDelete}
 *     onOpenChange={setOpenDelete}
 *     title="Xác nhận xóa người dùng"
 *     description="Hành động này không thể hoàn tác."
 *     confirmLabel="Xóa"
 *     variant="destructive"
 *     onConfirm={async () => { await deleteUser(id); }}
 *   />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Hủy',
  variant = 'default',
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const isLoading = isPending || loading === true;

  const handleConfirm = async (event: React.MouseEvent) => {
    // Prevent default close-on-action so we can keep dialog open during async work
    event.preventDefault();
    if (isLoading) return;

    try {
      setIsPending(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            disabled={isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Imperative hook — useConfirmDialog
// ---------------------------------------------------------------------------

type ImperativeOptions = Omit<
  ConfirmDialogProps,
  'open' | 'onOpenChange' | 'onConfirm'
>;

type PendingResolver = ((value: boolean) => void) | null;

/**
 * Imperative hook trả về { confirm, dialog }.
 *
 * - `confirm(opts)` mở dialog, trả Promise<boolean> resolves true khi user confirm,
 *   false khi cancel/ESC/click outside.
 * - `dialog` — JSX element phải render ở đâu đó trong tree (thường là root layout).
 *
 * @example
 *   const { confirm, dialog } = useConfirmDialog();
 *
 *   const handleDelete = async () => {
 *     const ok = await confirm({
 *       title: 'Xác nhận xóa',
 *       description: '...',
 *       confirmLabel: 'Xóa',
 *       variant: 'destructive',
 *     });
 *     if (ok) await mutation();
 *   };
 *
 *   return <>{dialog}<Button onClick={handleDelete}>Xóa</Button></>;
 */
export function useConfirmDialog() {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ImperativeOptions | null>(null);
  const resolverRef = React.useRef<PendingResolver>(null);

  const confirm = React.useCallback(
    (opts: ImperativeOptions): Promise<boolean> => {
      setOptions(opts);
      setOpen(true);
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    []
  );

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next);
    // Closed without confirm → resolve false
    if (!next && resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleConfirm = React.useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const dialog = options ? (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      onConfirm={handleConfirm}
      {...options}
    />
  ) : null;

  return { confirm, dialog };
}

export default ConfirmDialog;
