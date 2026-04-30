// DuToanTab — Tab Dự toán (Plan 05-03 Batch B).
// Bảng dự toán readonly từ budgetJson (PROJ-04 step 3 budget rows).
// Cột: STT / Hạng mục / ĐVT / SL / Đơn giá / Thành tiền / Nguồn / Ghi chú.
// Footer summary: tổng nhà nước + tổng đối ứng + tổng cộng.
// Source breakdown chart: pie/donut hiển thị tỉ lệ Nhà nước vs Đối ứng (POC: bar visual đơn giản).

import * as React from 'react';
import { Wallet, PieChart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatNumber, formatVND } from '@/lib/format';

import type { ProjectDetail } from '../../_actions/get-detail';

export type DuToanTabProps = {
  project: ProjectDetail;
};

export function DuToanTab({ project }: DuToanTabProps) {
  const rows = project.budget.rows ?? [];
  const totalState = project.budget.totalState ?? 0;
  const totalSelf = project.budget.totalSelf ?? 0;
  const total = project.budget.total ?? totalState + totalSelf;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon="file-x"
            heading="Chưa có dự toán kinh phí"
            description="Đề án chưa khai báo các khoản chi phí và nguồn kinh phí."
          />
        </CardContent>
      </Card>
    );
  }

  const statePct = total > 0 ? Math.round((totalState / total) * 100) : 0;
  const selfPct = total > 0 ? 100 - statePct : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards + source breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Tổng dự toán
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatVND(total)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Đề nghị Nhà nước hỗ trợ
            </p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">
              {formatVND(totalState)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {statePct}% tổng dự toán
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Đối ứng đơn vị
            </p>
            <p className="mt-1 text-xl font-semibold text-amber-700">
              {formatVND(totalSelf)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {selfPct}% tổng dự toán
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Source breakdown bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-4 w-4" aria-hidden="true" />
            Cơ cấu nguồn kinh phí
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-6 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="flex h-full">
              <div
                className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white"
                style={{ width: `${statePct}%` }}
                title={`Nhà nước: ${formatVND(totalState)}`}
              >
                {statePct >= 12 ? `Nhà nước ${statePct}%` : null}
              </div>
              <div
                className="flex items-center justify-center bg-amber-500 text-xs font-medium text-white"
                style={{ width: `${selfPct}%` }}
                title={`Đối ứng: ${formatVND(totalSelf)}`}
              >
                {selfPct >= 12 ? `Đối ứng ${selfPct}%` : null}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Đề nghị Nhà nước hỗ trợ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Đối ứng đơn vị
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Chi tiết các khoản chi
            <span className="ml-2 text-xs font-normal text-slate-500">
              {rows.length} hạng mục
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Hạng mục chi phí</TableHead>
                  <TableHead className="w-20">ĐVT</TableHead>
                  <TableHead className="w-20 text-right">SL</TableHead>
                  <TableHead className="w-32 text-right">Đơn giá</TableHead>
                  <TableHead className="w-36 text-right">Thành tiền</TableHead>
                  <TableHead className="w-24">Nguồn</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => {
                  const amount =
                    typeof r.amount === 'number'
                      ? r.amount
                      : (r.quantity ?? 0) * (r.unitPrice ?? 0);
                  return (
                    <TableRow key={r.id ?? idx}>
                      <TableCell className="text-center text-sm text-slate-500">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {r.item || <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {r.unit || '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-700 tabular-nums">
                        {typeof r.quantity === 'number'
                          ? formatNumber(r.quantity)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-700 tabular-nums">
                        {typeof r.unitPrice === 'number'
                          ? formatNumber(r.unitPrice)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900 tabular-nums">
                        {formatNumber(amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            r.source === 'SELF'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          }
                        >
                          {r.source === 'SELF' ? 'Đối ứng' : 'Nhà nước'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {r.note || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Footer rows: totals */}
                <TableRow className="border-t-2 border-slate-300 bg-slate-50">
                  <TableCell colSpan={5} className="text-right font-medium">
                    Tổng đề nghị Nhà nước hỗ trợ
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-700 tabular-nums">
                    {formatNumber(totalState)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
                <TableRow className="bg-slate-50">
                  <TableCell colSpan={5} className="text-right font-medium">
                    Tổng đối ứng đơn vị
                  </TableCell>
                  <TableCell className="text-right font-semibold text-amber-700 tabular-nums">
                    {formatNumber(totalSelf)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
                <TableRow className="border-t-2 border-slate-400 bg-blue-50">
                  <TableCell colSpan={5} className="text-right text-base font-semibold">
                    TỔNG CỘNG
                  </TableCell>
                  <TableCell className="text-right text-base font-bold text-blue-900 tabular-nums">
                    {formatNumber(total)}
                  </TableCell>
                  <TableCell colSpan={2} className="text-xs text-slate-600">
                    đồng
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DuToanTab;
