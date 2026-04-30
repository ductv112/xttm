// ProjectDetailHeader — sticky header cho /de-an/[id] page.
// Plan 05-03 hero detail page entry point. Hiển thị tên đề án + StatusBadge + meta
// (chu kỳ, năm, mã đơn vị) + parent/child link cho đề án 2 năm + action buttons
// theo trạng thái (Tiếp tục soạn thảo / Rút hồ sơ / Chỉnh sửa và nộp lại / In PDF).

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  FileEdit,
  Printer,
} from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import {
  PROJECT_KIND_LABELS,
  type ProjectStatus,
} from '@/lib/workflows/project';

import type { ProjectDetail } from '../../_actions/get-detail';
import { WithdrawDialog } from './WithdrawDialog';
import { ResubmitButton } from './ResubmitButton';

export type ProjectDetailHeaderProps = {
  project: ProjectDetail;
  /** Whether viewer is the owning DONVI — gates owner-only actions */
  isOwner: boolean;
};

export function ProjectDetailHeader({
  project,
  isOwner,
}: ProjectDetailHeaderProps) {
  const status = project.status as ProjectStatus;
  const kindLabel = PROJECT_KIND_LABELS[project.kind] ?? project.kind;

  // Action visibility flags
  const canContinueDraft = isOwner && status === 'DRAFT';
  const canWithdraw =
    isOwner && status === 'SUBMITTED' && !project.assignedToUserId;
  const canResubmit = isOwner && status === 'SUPPLEMENT_REQUIRED';
  // PDF available for any non-DRAFT (saved) status — DRAFT may still be
  // exportable as preview; we allow all states.
  const canExportPdf = true;

  return (
    <header className="sticky top-14 z-10 -mx-4 mb-2 border-b border-slate-200 bg-white px-4 py-4 sm:-mx-6 sm:px-6">
      <div className="mb-2">
        <Link
          href="/de-an"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Danh sách đề án
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {project.name}
            </h1>
            <StatusBadge entity="PROJECT" status={project.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="font-mono text-xs text-slate-500">
              {project.code}
            </span>
            <span className="text-slate-300">·</span>
            <span>
              <span className="font-medium">Năm {project.year}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span>{kindLabel}</span>
            <span className="text-slate-300">·</span>
            <Link
              href={`/chuong-trinh/${project.programCycleId}`}
              className="inline-flex items-center gap-1 text-blue-700 hover:underline"
            >
              {project.programCycleName}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
            <span className="text-slate-300">·</span>
            <span className="text-slate-700">{project.organizationName}</span>
            {project.submittedAt ? (
              <>
                <span className="text-slate-300">·</span>
                <span>
                  Nộp ngày{' '}
                  <span className="font-medium">
                    {formatDate(project.submittedAt)}
                  </span>
                </span>
              </>
            ) : null}
            {project.currentVersion > 1 ? (
              <>
                <span className="text-slate-300">·</span>
                <span>
                  Phiên bản{' '}
                  <span className="font-medium">v{project.currentVersion}</span>
                </span>
              </>
            ) : null}
          </p>

          {/* Parent / Child badges — đề án 2 năm */}
          {(project.parent || project.children.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {project.parent ? (
                <Link
                  href={`/de-an/${project.parent.id}`}
                  className="inline-flex"
                  aria-label={`Đề án năm trước: ${project.parent.name}`}
                >
                  <Badge
                    variant="secondary"
                    className="gap-1 border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100"
                  >
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    Tiếp nối từ: {project.parent.name} (Năm {project.parent.year})
                  </Badge>
                </Link>
              ) : null}
              {project.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/de-an/${child.id}`}
                  className="inline-flex"
                  aria-label={`Đề án năm sau: ${child.name}`}
                >
                  <Badge
                    variant="secondary"
                    className="gap-1 border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100"
                  >
                    Đề án năm sau: {child.name} (Năm {child.year})
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canContinueDraft ? (
            <Button asChild variant="default" size="sm">
              <Link href="/de-an/new">
                <FileEdit className="h-4 w-4" aria-hidden="true" />
                Tiếp tục soạn thảo
              </Link>
            </Button>
          ) : null}
          {canWithdraw ? (
            <WithdrawDialog projectId={project.id} projectCode={project.code} />
          ) : null}
          {canResubmit ? (
            <ResubmitButton
              projectId={project.id}
              projectCode={project.code}
            />
          ) : null}
          {canExportPdf ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={`/api/pdf/project/${project.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                In/Xuất PDF
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default ProjectDetailHeader;
