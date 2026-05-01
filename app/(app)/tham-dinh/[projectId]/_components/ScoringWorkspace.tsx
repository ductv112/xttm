'use client';

// ScoringWorkspace — split-screen layout (50/50): ScoringPanel left, ProjectReadonlyPanel right.

import * as React from 'react';

import { ScoringPanel } from './ScoringPanel';
import { ProjectReadonlyPanel } from './ProjectReadonlyPanel';
import type { EvaluationDetail } from '../../_actions/get-detail';

type Props = {
  detail: EvaluationDetail;
};

export function ScoringWorkspace({ detail }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="order-2 xl:order-1">
        <ScoringPanel detail={detail} />
      </div>
      <div className="order-1 xl:order-2">
        <ProjectReadonlyPanel detail={detail} />
      </div>
    </div>
  );
}
