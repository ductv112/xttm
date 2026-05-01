'use client';

// DashboardFilterBar — year select + Excel/PDF export buttons.
// Uses URL search params (year=) as source of truth (no useState mirror).

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportDashboardExcel } from '../_actions/export-excel';
import { exportDashboardPdf } from '../_actions/export-pdf';

type Props = {
  years: number[];
  currentYear: number;
};

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function DashboardFilterBar({ years, currentYear }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const handleYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', next);
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const result = await exportDashboardExcel(currentYear);
      const blob = base64ToBlob(
        result.base64,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      triggerDownload(blob, result.filename);
      toast.success('Đã xuất báo cáo Excel');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xuất file thất bại';
      toast.error(msg);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const result = await exportDashboardPdf(currentYear);
      const blob = base64ToBlob(result.base64, 'application/pdf');
      triggerDownload(blob, result.filename);
      toast.success('Đã xuất báo cáo PDF');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xuất file thất bại';
      toast.error(msg);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Năm:</span>
        <Select
          value={String(currentYear)}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={isExportingExcel || isExportingPdf}
        >
          {isExportingExcel ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Xuất Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={isExportingExcel || isExportingPdf}
        >
          {isExportingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Xuất PDF
        </Button>
      </div>
    </div>
  );
}
