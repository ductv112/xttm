'use client';

// CycleTabsNav — 6-tab navigation cho /chuong-trinh/[id] sub-routes.
// Plan 03-06 deep-linkable tabs (sub-routes thay vì client tabs để bookmark + RSC initial fetch).
//
// Active tab detection: tab href === pathname (exact match for default tab) hoặc
// pathname starts with sub-segment (cau-hinh / cong-van / don-vi-moi / de-an / nhat-ky).

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type CycleTabsNavProps = {
  cycleId: string;
};

type TabDef = {
  /** Sub-segment after /chuong-trinh/[id]/ — empty string for default Tổng quan tab */
  segment: '' | 'cau-hinh' | 'cong-van' | 'don-vi-moi' | 'de-an' | 'nhat-ky';
  label: string;
};

const TABS: readonly TabDef[] = [
  { segment: '', label: 'Tổng quan' },
  { segment: 'cau-hinh', label: 'Cấu hình kỳ' },
  { segment: 'cong-van', label: 'Công văn' },
  { segment: 'don-vi-moi', label: 'Đơn vị mời' },
  { segment: 'de-an', label: 'Đề án đăng ký' },
  { segment: 'nhat-ky', label: 'Nhật ký' },
] as const;

export function CycleTabsNav({ cycleId }: CycleTabsNavProps) {
  const pathname = usePathname();
  const basePath = `/chuong-trinh/${cycleId}`;

  // Determine active segment from pathname.
  const remaining = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length).replace(/^\/+/, '')
    : '';
  // Map to tab segment ('' | 'cau-hinh' | ...). Unknown sub-paths fall through to default.
  const activeSegment: TabDef['segment'] = (() => {
    if (remaining === '') return '';
    for (const t of TABS) {
      if (t.segment !== '' && remaining === t.segment) return t.segment;
    }
    return '';
  })();

  return (
    <nav
      role="tablist"
      aria-label="Tab chi tiết chu kỳ"
      className="flex flex-wrap items-center gap-1 border-b border-slate-200"
    >
      {TABS.map((tab) => {
        const href = tab.segment === '' ? basePath : `${basePath}/${tab.segment}`;
        const active = activeSegment === tab.segment;
        return (
          <Link
            key={tab.segment || 'default'}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors',
              active
                ? '-mb-px border-b-2 border-blue-700 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default CycleTabsNav;
