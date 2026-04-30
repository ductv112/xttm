'use client';

// Permission Matrix Grid — 18 resource sections (accordion) × 7+ rows × 8 cols
//
// Decision: split 144 cells per row × 7+ rows = 1008+ checkboxes vào 18
// mini-tables (7×8 = 56 cells / group), accordion expand từng resource. UX
// reasoning: 1 grid 1008 checkboxes quá rộng + scroll khó; grouped by resource
// matches mental model "tôi cần phân quyền cho phân hệ X".

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AUDIT_RESOURCE_LABELS } from '@/lib/audit-types';
import type { AuditResource } from '@/lib/audit-types';
import { removeDiacritics } from '@/lib/vi-search';

import { listMatrix, type MatrixData } from '../_actions/list';
import { MatrixCell } from './MatrixCell';

import type { MatrixActionKey } from './MatrixCell';

const ACTIONS: ReadonlyArray<{ key: MatrixActionKey; label: string }> = [
  { key: 'read', label: 'Xem' },
  { key: 'create', label: 'Thêm' },
  { key: 'update', label: 'Sửa' },
  { key: 'delete', label: 'Xóa' },
  { key: 'submit', label: 'Nộp' },
  { key: 'approve', label: 'Phê duyệt' },
  { key: 'assign', label: 'Phân công' },
  { key: 'score', label: 'Chấm điểm' },
];

// Resource → section mapping (per lib/permissions.ts ALL_MENU_ITEMS section field)
const RESOURCE_SECTION: Record<string, 'NGHIEP_VU' | 'QUAN_TRI'> = {
  dashboard: 'NGHIEP_VU',
  'chuong-trinh': 'NGHIEP_VU',
  'don-vi-chu-tri': 'NGHIEP_VU',
  'de-an': 'NGHIEP_VU',
  'tiep-nhan': 'NGHIEP_VU',
  'tham-dinh': 'NGHIEP_VU',
  'phe-duyet': 'NGHIEP_VU',
  'hop-dong': 'NGHIEP_VU',
  'trien-khai': 'NGHIEP_VU',
  'bao-cao': 'NGHIEP_VU',
  'nghiem-thu': 'NGHIEP_VU',
  'tai-chinh': 'NGHIEP_VU',
  'thong-bao': 'NGHIEP_VU',
  'danh-muc': 'QUAN_TRI',
  'nguoi-dung': 'QUAN_TRI',
  'vai-tro': 'QUAN_TRI',
  'cau-hinh': 'QUAN_TRI',
  'audit-log': 'QUAN_TRI',
};

export type PermissionMatrixGridProps = {
  initialData: MatrixData;
};

export function PermissionMatrixGrid({
  initialData,
}: PermissionMatrixGridProps) {
  const { data: matrix } = useQuery<MatrixData>({
    queryKey: ['matrix'],
    queryFn: () => listMatrix(),
    initialData,
    staleTime: 5_000,
  });

  const [searchQuery, setSearchQuery] = React.useState('');
  const normalizedQuery = React.useMemo(
    () => removeDiacritics(searchQuery.trim().toLowerCase()),
    [searchQuery],
  );

  // Build resource list: extract unique resources từ matrix.permissions
  // Sort: Nghiệp vụ first, then Quản trị; trong mỗi nhóm sort theo label VN
  const sections = React.useMemo(() => {
    const resources = Array.from(
      new Set(matrix.permissions.map((p) => p.resource)),
    );

    const filtered = normalizedQuery
      ? resources.filter((r) => {
          const label = AUDIT_RESOURCE_LABELS[r as AuditResource] ?? r;
          return removeDiacritics(label.toLowerCase()).includes(normalizedQuery);
        })
      : resources;

    return filtered.sort((a, b) => {
      const sectionA = RESOURCE_SECTION[a] ?? 'QUAN_TRI';
      const sectionB = RESOURCE_SECTION[b] ?? 'QUAN_TRI';
      if (sectionA !== sectionB) {
        return sectionA === 'NGHIEP_VU' ? -1 : 1;
      }
      const labelA = AUDIT_RESOURCE_LABELS[a as AuditResource] ?? a;
      const labelB = AUDIT_RESOURCE_LABELS[b as AuditResource] ?? b;
      return labelA.localeCompare(labelB, 'vi');
    });
  }, [matrix.permissions, normalizedQuery]);

  // Group sections by NGHIEP_VU / QUAN_TRI
  const grouped = React.useMemo(() => {
    const nghiepVu: string[] = [];
    const quanTri: string[] = [];
    for (const r of sections) {
      if (RESOURCE_SECTION[r] === 'NGHIEP_VU') nghiepVu.push(r);
      else quanTri.push(r);
    }
    return { nghiepVu, quanTri };
  }, [sections]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Tìm phân hệ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {sections.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Không tìm thấy phân hệ phù hợp với từ khóa &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.nghiepVu.length > 0 ? (
            <SectionGroup
              title="Nghiệp vụ"
              resources={grouped.nghiepVu}
              matrix={matrix}
            />
          ) : null}
          {grouped.quanTri.length > 0 ? (
            <SectionGroup
              title="Quản trị"
              resources={grouped.quanTri}
              matrix={matrix}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionGroup — wraps an Accordion of resource sub-tables
// ---------------------------------------------------------------------------

type SectionGroupProps = {
  title: string;
  resources: string[];
  matrix: MatrixData;
};

function SectionGroup({ title, resources, matrix }: SectionGroupProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="rounded-lg border border-slate-200 bg-white">
        <Accordion type="multiple" className="w-full">
          {resources.map((resource) => (
            <ResourceAccordionItem
              key={resource}
              resource={resource}
              matrix={matrix}
            />
          ))}
        </Accordion>
      </div>
    </div>
  );
}

type ResourceAccordionItemProps = {
  resource: string;
  matrix: MatrixData;
};

function ResourceAccordionItem({
  resource,
  matrix,
}: ResourceAccordionItemProps) {
  const label = AUDIT_RESOURCE_LABELS[resource as AuditResource] ?? resource;

  // Count grants for this resource (across all roles + actions)
  let totalCellsGranted = 0;
  for (const role of matrix.roles) {
    const grants = matrix.grants[role.code] ?? [];
    for (const action of ACTIONS) {
      if (grants.includes(`${resource}:${action.key}`)) totalCellsGranted++;
    }
  }
  const totalCells = matrix.roles.length * ACTIONS.length;

  return (
    <AccordionItem value={resource} className="border-b border-slate-200">
      <AccordionTrigger className="px-4 hover:no-underline hover:bg-slate-50">
        <div className="flex flex-1 items-center justify-between gap-4 pr-2">
          <div className="text-left">
            <div className="text-sm font-medium text-slate-900">{label}</div>
            <div className="mt-0.5 text-xs text-slate-500">
              Mã: <code className="font-mono text-[11px]">{resource}</code>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {totalCellsGranted}/{totalCells} ô đã cấp
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700">
                  Vai trò
                </th>
                {ACTIONS.map((a) => (
                  <th
                    key={a.key}
                    className="px-3 py-2 text-center text-xs font-medium text-slate-700"
                  >
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.roles.map((role) => {
                const grants = matrix.grants[role.code] ?? [];
                return (
                  <tr key={role.id} className="border-t border-slate-200">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {!role.isSystem ? (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-medium text-blue-700">
                            Tùy chỉnh
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {role.code}
                      </div>
                    </td>
                    {ACTIONS.map((a) => {
                      const code = `${resource}:${a.key}`;
                      const granted = grants.includes(code);
                      return (
                        <td
                          key={a.key}
                          className="px-3 py-2 text-center"
                        >
                          <MatrixCell
                            roleCode={role.code}
                            resource={resource}
                            action={a.key}
                            granted={granted}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
