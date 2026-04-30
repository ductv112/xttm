// TaiLieuTab — Tab Tài liệu (Plan 05-03 Batch B).
// List documents grouped by category với download link qua /api/file/[id].
// Categories: PLAN / CAPABILITY / EVIDENCE / OTHER (mapping từ uploadDocument category code).

import * as React from 'react';
import { FolderOpen, FileText, Download } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/format';

import type {
  ProjectDetail,
  ProjectDocument,
} from '../../_actions/get-detail';

export type TaiLieuTabProps = {
  project: ProjectDetail;
};

const CATEGORY_LABELS: Record<string, string> = {
  PLAN: 'Đề án/Kế hoạch',
  CAPABILITY: 'Năng lực đơn vị',
  EVIDENCE: 'Tài liệu chứng minh',
  OTHER: 'Tài liệu khác',
};

const CATEGORY_ORDER = ['PLAN', 'CAPABILITY', 'EVIDENCE', 'OTHER'];

const CATEGORY_BADGE: Record<string, string> = {
  PLAN: 'border-blue-200 bg-blue-50 text-blue-800',
  CAPABILITY: 'border-purple-200 bg-purple-50 text-purple-800',
  EVIDENCE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  OTHER: 'border-slate-200 bg-slate-50 text-slate-700',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function groupByCategory(
  documents: ReadonlyArray<ProjectDocument>,
): Record<string, ProjectDocument[]> {
  const groups: Record<string, ProjectDocument[]> = {};
  for (const d of documents) {
    const cat = d.category && CATEGORY_LABELS[d.category] ? d.category : 'OTHER';
    if (!groups[cat]) groups[cat] = [];
    groups[cat]!.push(d);
  }
  return groups;
}

export function TaiLieuTab({ project }: TaiLieuTabProps) {
  const documents = project.documents;

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon="file-x"
            heading="Chưa có tài liệu đính kèm"
            description="Đề án chưa upload tài liệu nào. Tài liệu được upload qua bước 5 của trình khai báo đề án."
          />
        </CardContent>
      </Card>
    );
  }

  const grouped = groupByCategory(documents);
  const categoryKeys = CATEGORY_ORDER.filter((k) => grouped[k]?.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
          Tài liệu đính kèm
          <span className="ml-2 text-xs font-normal text-slate-500">
            {documents.length} tệp
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categoryKeys.map((cat) => {
          const docs = grouped[cat] ?? [];
          return (
            <section key={cat} aria-labelledby={`category-${cat}`}>
              <div className="mb-3 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={CATEGORY_BADGE[cat] ?? CATEGORY_BADGE.OTHER}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </Badge>
                <span
                  id={`category-${cat}`}
                  className="text-xs text-slate-500"
                >
                  {docs.length} tệp
                </span>
              </div>
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50"
                  >
                    <div className="rounded-md bg-slate-100 p-2 text-slate-600">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {d.fileName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatBytes(d.fileSize)}
                        {d.uploaderName ? (
                          <>
                            {' · Tải lên bởi '}
                            <span className="font-medium text-slate-700">
                              {d.uploaderName}
                            </span>
                          </>
                        ) : null}
                        {' · '}
                        {formatDateTime(d.uploadedAt)}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-blue-700 hover:text-blue-800"
                    >
                      <a
                        href={`/api/file/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Tải xuống ${d.fileName}`}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Tải xuống
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default TaiLieuTab;
