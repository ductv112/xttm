'use client';

// CatalogEditSheet — placeholder stub. Full implementation in Task 3.
// TODO(02-06 Task 3): Replace with full Sheet drawer + RHF form switching by kind.

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CatalogKind } from '@/lib/catalog-types';
import type { CatalogListRow } from '../_actions/list';

type Props = {
  kind: CatalogKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogListRow | null;
  onSaved: () => void;
};

export function CatalogEditSheet({ kind, open, onOpenChange, item }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] !max-w-none sm:!max-w-none"
      >
        <SheetHeader>
          <SheetTitle>
            {item ? `Chỉnh sửa: ${item.name}` : `Thêm ${kind}`}
          </SheetTitle>
          <SheetDescription>
            Form sẽ được hoàn thiện ở Task 3
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
