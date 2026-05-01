'use client';

// ProjectReadonlyPanel — right half: tabs (Tổng quan / Kế hoạch / Dự toán / Tài liệu / Chủ nhiệm).
// Renders project data readonly cho thành viên hội đồng tham khảo khi chấm.

import * as React from 'react';
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  Phone,
  Target,
  User,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatVND, formatVNDCompact, formatDate } from '@/lib/format';

import type { EvaluationDetail } from '../../_actions/get-detail';

type Props = {
  detail: EvaluationDetail;
};

export function ProjectReadonlyPanel({ detail }: Props) {
  const { project, catalogs } = detail;
  const general = project.generalInfo;
  const sectorMap = new Map(
    catalogs.industrySectors.map((c) => [c.id, c.name]),
  );
  const marketMap = new Map(catalogs.markets.map((c) => [c.id, c.name]));
  const countryMap = new Map(catalogs.countries.map((c) => [c.id, c.name]));
  const promotionMap = new Map(
    catalogs.promotionTypes.map((c) => [c.id, c.name]),
  );

  return (
    <div className="rounded-md border border-slate-200 bg-white xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-slate-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-700">
            Hồ sơ đề án (chế độ chỉ đọc)
          </h3>
        </div>
        <Button asChild size="sm" variant="outline">
          <a
            href={`/de-an/${project.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
            Xem đầy đủ
          </a>
        </Button>
      </header>
      <Tabs defaultValue="overview" className="p-3">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex-1">
            Kế hoạch
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex-1">
            Dự toán
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex-1">
            Chủ nhiệm
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-3">
          <Section title="Thông tin chung" icon={<Target className="h-4 w-4" />}>
            <InfoRow label="Tên đề án" value={project.name} />
            <InfoRow label="Đơn vị chủ trì" value={project.organizationName} />
            <InfoRow
              label="Thời gian thực hiện"
              value={formatTimeRange(general.timeRange)}
            />
            <InfoRow
              label="Ngành hàng"
              value={namesFromIds(general.industrySectorIds, sectorMap)}
            />
            <InfoRow
              label="Thị trường"
              value={namesFromIds(general.marketIds, marketMap)}
            />
            <InfoRow
              label="Quốc gia"
              value={namesFromIds(general.countryIds, countryMap)}
            />
            <InfoRow
              label="Loại hình XTTM"
              value={namesFromIds(general.promotionTypeIds, promotionMap)}
            />
            {general.isTwoYear ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <CalendarDays
                  className="mr-1 inline h-3 w-3"
                  aria-hidden="true"
                />
                Đề án 2 năm — kéo dài sang năm{' '}
                <strong>{general.nextYear ?? '—'}</strong>
              </div>
            ) : null}
          </Section>

          <Section
            title="Mục tiêu & nội dung"
            icon={<Target className="h-4 w-4" />}
          >
            {project.objectives.objective ? (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mục tiêu
                </h5>
                <div
                  className="prose prose-sm mt-1 max-w-none text-sm text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: project.objectives.objective,
                  }}
                />
              </div>
            ) : null}
            {project.objectives.content ? (
              <div className="mt-3">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nội dung chính
                </h5>
                <div
                  className="prose prose-sm mt-1 max-w-none text-sm text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: project.objectives.content,
                  }}
                />
              </div>
            ) : null}
            {!project.objectives.objective && !project.objectives.content ? (
              <p className="text-sm italic text-slate-400">
                (Chưa khai báo)
              </p>
            ) : null}
          </Section>
        </TabsContent>

        <TabsContent value="plan" className="mt-3">
          <Section
            title="Kế hoạch triển khai"
            icon={<ClipboardList className="h-4 w-4" />}
          >
            {project.plan.rows && project.plan.rows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Hạng mục công việc</TableHead>
                    <TableHead>Sản phẩm bàn giao</TableHead>
                    <TableHead>Hạn</TableHead>
                    <TableHead>Phụ trách</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.plan.rows.map((r, idx) => (
                    <TableRow key={r.id ?? idx}>
                      <TableCell className="tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="text-sm">{r.task}</TableCell>
                      <TableCell className="text-sm">
                        {r.deliverable ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {r.dueDate ? formatDate(r.dueDate) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {r.owner ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm italic text-slate-400">
                (Chưa khai báo kế hoạch)
              </p>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="budget" className="mt-3">
          <Section title="Dự toán kinh phí" icon={<Wallet className="h-4 w-4" />}>
            {project.budget.rows && project.budget.rows.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Hạng mục</TableHead>
                      <TableHead className="text-center">ĐVT</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                      <TableHead className="text-center">Nguồn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.budget.rows.map((r, idx) => {
                      const amount =
                        typeof r.amount === 'number'
                          ? r.amount
                          : (r.quantity ?? 0) * (r.unitPrice ?? 0);
                      return (
                        <TableRow key={r.id ?? idx}>
                          <TableCell className="tabular-nums">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-sm">{r.item}</TableCell>
                          <TableCell className="text-center text-xs">
                            {r.unit ?? ''}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {r.quantity ?? 0}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {r.unitPrice
                              ? r.unitPrice.toLocaleString('vi-VN')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {amount ? amount.toLocaleString('vi-VN') : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={
                                r.source === 'SELF'
                                  ? 'border-amber-200 bg-amber-50 text-xs text-amber-700'
                                  : 'border-blue-200 bg-blue-50 text-xs text-blue-700'
                              }
                            >
                              {r.source === 'SELF' ? 'Đối ứng' : 'Nhà nước'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <dl className="mt-4 space-y-1 rounded-md bg-slate-50 p-3 text-sm">
                  <BudgetTotalRow
                    label="Đề nghị Nhà nước hỗ trợ"
                    value={project.budget.totalState ?? 0}
                    tone="blue"
                  />
                  <BudgetTotalRow
                    label="Đối ứng đơn vị"
                    value={project.budget.totalSelf ?? 0}
                    tone="amber"
                  />
                  <BudgetTotalRow
                    label="Tổng cộng"
                    value={project.budget.total ?? 0}
                    tone="emerald"
                    bold
                  />
                </dl>
              </>
            ) : (
              <p className="text-sm italic text-slate-400">
                (Chưa khai báo dự toán)
              </p>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="manager" className="mt-3">
          <Section title="Chủ nhiệm đề án" icon={<User className="h-4 w-4" />}>
            {project.pmSnapshot ? (
              <div className="space-y-2">
                <InfoRow label="Họ và tên" value={project.pmSnapshot.name} />
                {project.pmSnapshot.title ? (
                  <InfoRow label="Chức danh" value={project.pmSnapshot.title} />
                ) : null}
                {project.pmSnapshot.role ? (
                  <InfoRow label="Vai trò" value={project.pmSnapshot.role} />
                ) : null}
                {project.pmSnapshot.email ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    <a
                      href={`mailto:${project.pmSnapshot.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {project.pmSnapshot.email}
                    </a>
                  </div>
                ) : null}
                {project.pmSnapshot.phone ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    <a
                      href={`tel:${project.pmSnapshot.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {project.pmSnapshot.phone}
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm italic text-slate-400">
                (Chưa chỉ định chủ nhiệm)
              </p>
            )}
          </Section>
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            <FileText
              className="mr-1 inline h-3 w-3"
              aria-hidden="true"
            />
            Để xem tài liệu đính kèm + hồ sơ đầy đủ, vui lòng nhấn{' '}
            <strong>“Xem đầy đủ”</strong> ở góc trên bên phải.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function namesFromIds(
  ids: string[] | undefined,
  map: Map<string, string>,
): string {
  if (!ids || ids.length === 0) return '—';
  return ids
    .map((id) => map.get(id) ?? '—')
    .filter((s) => s !== '—')
    .join(', ') || '—';
}

function formatTimeRange(
  range:
    | {
        start?: string | null;
        end?: string | null;
        quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
      }
    | null
    | undefined,
): string {
  if (!range) return '—';
  if (range.quarter) return range.quarter;
  if (range.start && range.end) {
    return `${formatDate(range.start)} → ${formatDate(range.end)}`;
  }
  if (range.start) return `Từ ${formatDate(range.start)}`;
  if (range.end) return `Đến ${formatDate(range.end)}`;
  return '—';
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
        {icon}
        {title}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <dt className="w-32 shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium text-slate-900">
        {value || '—'}
      </dd>
    </div>
  );
}

function BudgetTotalRow({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: number;
  tone: 'blue' | 'amber' | 'emerald';
  bold?: boolean;
}) {
  const map: Record<typeof tone, string> = {
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
  };
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        bold ? 'border-t border-slate-300 pt-1' : '',
      )}
    >
      <span className={cn('text-xs', bold ? 'font-semibold' : '', map[tone])}>
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          bold ? 'text-base font-bold' : 'text-sm font-medium',
          map[tone],
        )}
      >
        {bold ? formatVND(value) : formatVNDCompact(value)}
      </span>
    </div>
  );
}
