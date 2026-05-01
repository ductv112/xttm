'use client';

import * as React from 'react';
import {
  ClipboardList,
  Mail,
  Stamp,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { SubmissionDetail } from '../../_actions/save-submission';
import type { SubmissionCandidate } from '../../_actions/list-candidates';
import { SubmissionDraftForm } from './SubmissionDraftForm';
import { DecisionForm } from './DecisionForm';
import { NotifyComposer } from './NotifyComposer';

type Props = {
  detail: SubmissionDetail;
  candidates: SubmissionCandidate[];
  canCreate: boolean;
};

export function SubmissionTabsShell({ detail, candidates, canCreate }: Props) {
  const defaultTab = detail.decision
    ? 'notify'
    : detail.status === 'SUBMITTED_TO_BO'
      ? 'decision'
      : 'draft';

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="draft">
          <ClipboardList className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Soạn tờ trình
        </TabsTrigger>
        <TabsTrigger value="decision">
          <Stamp className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Quyết định phê duyệt
          {detail.decision ? (
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="notify" disabled={!detail.decision}>
          <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Thông báo kết quả
        </TabsTrigger>
      </TabsList>

      <TabsContent value="draft" className="mt-4">
        <SubmissionDraftForm
          mode="edit"
          candidates={candidates}
          initial={detail}
          canEdit={canCreate && !detail.decision}
        />
      </TabsContent>

      <TabsContent value="decision" className="mt-4">
        <DecisionForm detail={detail} canCreate={canCreate} />
      </TabsContent>

      <TabsContent value="notify" className="mt-4">
        {detail.decision ? (
          <NotifyComposer detail={detail} canCreate={canCreate} />
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Vui lòng nhập quyết định phê duyệt trước khi gửi thông báo kết quả.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
