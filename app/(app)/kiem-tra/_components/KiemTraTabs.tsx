'use client';

// KiemTraTabs — 2-tab shell cho /kiem-tra (gộp Kiểm tra hành chính + Chấm điểm sơ bộ).
// Tab 1: ReviewQueueTable (status IN_REVIEW/SUPPLEMENT_REQUIRED/VALID — giai đoạn kiểm tra hồ sơ).
// Tab 2: ScoringQueueTable (status VALID — giai đoạn chấm điểm sơ bộ).
// Cả 2 tab đều xem các đề án assigned cho chuyên viên hiện tại.
// URL hash giữ trạng thái tab (#kiem-tra | #cham-diem) để bookmarkable.

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ReviewQueueTable } from './ReviewQueueTable';
import { ScoringQueueTable } from '../../cham-diem-so-bo/_components/ScoringQueueTable';
import type { MyReviewProjectRow } from '../_actions/list-mine';
import type { ValidProjectRow } from '../../cham-diem-so-bo/_actions/list-valid';

const TAB_VALUES = ['kiem-tra', 'cham-diem'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(value: string): value is TabValue {
  return (TAB_VALUES as readonly string[]).includes(value);
}

type Props = {
  reviewRows: MyReviewProjectRow[];
  scoringRows: ValidProjectRow[];
};

export function KiemTraTabs({ reviewRows, scoringRows }: Props) {
  const [tab, setTab] = React.useState<TabValue>('kiem-tra');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && isTabValue(hash)) {
      setTab(hash);
    }
  }, []);

  const handleChange = (value: string) => {
    if (isTabValue(value)) {
      setTab(value);
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}#${value}`,
        );
      }
    }
  };

  const reviewPendingCount = reviewRows.filter(
    (r) => r.status === 'IN_REVIEW' || r.status === 'SUPPLEMENT_REQUIRED',
  ).length;
  const scoringPendingCount = scoringRows.filter(
    (r) => r.scoreSheetStatus === null || r.scoreSheetStatus === 'DRAFT',
  ).length;

  return (
    <Tabs value={tab} onValueChange={handleChange} className="w-full">
      <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="kiem-tra" className="gap-2">
          Kiểm tra hành chính
          {reviewPendingCount > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {reviewPendingCount}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="cham-diem" className="gap-2">
          Chấm điểm sơ bộ
          {scoringPendingCount > 0 ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {scoringPendingCount}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="kiem-tra" className="mt-0">
        <ReviewQueueTable rows={reviewRows} />
      </TabsContent>

      <TabsContent value="cham-diem" className="mt-0">
        <ScoringQueueTable rows={scoringRows} />
      </TabsContent>
    </Tabs>
  );
}
