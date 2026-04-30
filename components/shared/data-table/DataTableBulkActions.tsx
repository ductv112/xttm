'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  type ConfirmDialogVariant,
} from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

import type { BulkAction } from './types';

export type DataTableBulkActionsProps<TData> = {
  selected: TData[];
  actions: BulkAction<TData>[];
  onClear: () => void;
};

/**
 * Sticky-bottom bulk action toolbar.
 *
 * Visible khi có row selection > 0; slide-up từ dưới qua motion v12.
 * Render `[N] đã chọn | actions | × clear` layout per UI-SPEC.
 */
export function DataTableBulkActions<TData>({
  selected,
  actions,
  onClear,
}: DataTableBulkActionsProps<TData>) {
  const [pendingAction, setPendingAction] = React.useState<BulkAction<TData> | null>(
    null
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const visible = selected.length > 0;

  const runAction = async (action: BulkAction<TData>) => {
    if (busyId) return;
    try {
      setBusyId(action.id);
      await action.onClick(selected);
    } finally {
      setBusyId(null);
    }
  };

  const handleActionClick = (action: BulkAction<TData>) => {
    if (action.requireConfirm) {
      setPendingAction(action);
      return;
    }
    void runAction(action);
  };

  return (
    <>
      <AnimatePresence>
        {visible ? (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-md bg-slate-900 px-6 py-3 text-white shadow-lg"
            role="region"
            aria-label="Hành động hàng loạt"
          >
            <span className="text-sm font-medium">
              Đã chọn{' '}
              <span className="font-semibold">{formatNumber(selected.length)}</span> mục
            </span>

            <div className="mx-2 h-5 w-px bg-slate-700" aria-hidden="true" />

            <div className="flex items-center gap-2">
              {actions.map((action) => {
                const isBusy = busyId === action.id;
                const disabled =
                  typeof action.disabled === 'function'
                    ? action.disabled(selected)
                    : action.disabled === true;

                return (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                    onClick={() => handleActionClick(action)}
                    disabled={disabled || isBusy}
                    className={cn(
                      action.variant !== 'destructive' &&
                        'bg-white text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="ml-1 h-8 w-8 text-white hover:bg-slate-800 hover:text-white"
              aria-label="Bỏ chọn tất cả"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {pendingAction ? (
        <ConfirmDialog
          open={pendingAction !== null}
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
          title={pendingAction.requireConfirm!.title}
          description={pendingAction.requireConfirm!.description}
          confirmLabel={pendingAction.requireConfirm!.confirmLabel ?? pendingAction.label}
          variant={
            (pendingAction.variant === 'destructive'
              ? 'destructive'
              : 'default') as ConfirmDialogVariant
          }
          onConfirm={async () => {
            const action = pendingAction;
            setPendingAction(null);
            await runAction(action);
          }}
        />
      ) : null}
    </>
  );
}

export default DataTableBulkActions;
