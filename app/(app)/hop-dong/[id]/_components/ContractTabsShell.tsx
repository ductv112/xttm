'use client';

// ContractTabsShell — Phase 8 Plan 08-01 Task 2.

import * as React from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import type { ContractDetail } from '../../_actions/get-detail';
import { ContractInfoTab } from './ContractInfoTab';
import { ContractScanTab } from './ContractScanTab';

const TAB_VALUES = ['thong-tin', 'ban-scan'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTab(v: string): v is TabValue {
  return (TAB_VALUES as readonly string[]).includes(v);
}

export function ContractTabsShell({
  contract,
  canUpdate,
}: {
  contract: ContractDetail;
  canUpdate: boolean;
}) {
  const [tab, setTab] = React.useState<TabValue>('thong-tin');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash === 'scan') setTab('ban-scan');
    else if (hash && isTab(hash)) setTab(hash);
  }, []);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => isTab(v) && setTab(v)}
      className="w-full"
    >
      <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-slate-100 p-1">
        <TabsTrigger value="thong-tin">Thông tin & điều khoản</TabsTrigger>
        <TabsTrigger value="ban-scan">
          Bản scan {contract.scanFileUrl ? '✓' : ''}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="thong-tin">
        <ContractInfoTab contract={contract} canUpdate={canUpdate} />
      </TabsContent>
      <TabsContent value="ban-scan">
        <ContractScanTab contract={contract} canUpdate={canUpdate} />
      </TabsContent>
    </Tabs>
  );
}
