'use client';

// CongVanUploadTab — drag-drop PDF upload + metadata form + iframe preview.
// Plan 03-06 CYCLE-07. Phase 3 simplification: only allow upload if no attachment yet
// (else show "Đã upload" với metadata table + iframe + Tải về button — Phase 8 amendment).

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Download, FileText, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

import { uploadCongVan } from '../../_actions';
import type { CycleDetail } from '../../_actions/types';
import { PdfPreview } from './PdfPreview';

const MetadataSchema = z.object({
  signedNumber: z
    .string({ message: 'Vui lòng nhập số công văn' })
    .trim()
    .min(1, 'Số công văn không được để trống')
    .max(100, 'Số công văn tối đa 100 ký tự'),
  signedDate: z
    .date({ message: 'Vui lòng chọn ngày ký công văn' })
    .refine((d) => d.getTime() <= Date.now(), 'Ngày ký phải nhỏ hơn hoặc bằng hôm nay'),
  signedByName: z
    .string({ message: 'Vui lòng nhập họ tên người ký' })
    .trim()
    .min(2, 'Họ tên người ký tối thiểu 2 ký tự'),
  signedByTitle: z
    .string({ message: 'Vui lòng nhập chức vụ người ký' })
    .trim()
    .min(2, 'Chức vụ tối thiểu 2 ký tự'),
});

type MetadataInput = z.infer<typeof MetadataSchema>;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col py-2 border-b border-slate-100 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function SignedDatePicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const display = value ? format(value, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}

export type CongVanUploadTabProps = {
  cycle: CycleDetail;
  canEdit: boolean;
};

export function CongVanUploadTab({ cycle, canEdit }: CongVanUploadTabProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const attachment = cycle.invitationLetterAttachment;
  const showUploadArea = !attachment && canEdit;

  const form = useForm<MetadataInput>({
    resolver: zodResolver(MetadataSchema),
    mode: 'onBlur',
    defaultValues: {
      signedNumber: '',
      signedDate: undefined,
      signedByName: '',
      signedByTitle: '',
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  const handleFileSelect = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== 'application/pdf') {
      toast.error('Chỉ chấp nhận tệp PDF');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      toast.error('Tệp vượt quá 10MB');
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const onSubmit = async (data: MetadataInput) => {
    if (!file) {
      toast.error('Vui lòng chọn tệp công văn');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('signedNumber', data.signedNumber);
      fd.append('signedDate', data.signedDate.toISOString());
      fd.append('signedByName', data.signedByName);
      fd.append('signedByTitle', data.signedByTitle);

      const result = await uploadCongVan(cycle.id, fd);
      toast.success(`Đã tải lên công văn ${result.signedNumber}`);
      setFile(null);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải lên công văn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== Upload area (shown only when no attachment exists yet) ===== */}
      {showUploadArea ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-1 text-base font-semibold text-slate-900">
            Tải lên công văn ban hành
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Bản scan PDF công văn mời đăng ký do Cục XTTM ban hành. Định dạng PDF, tối đa 10MB.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                dragActive
                  ? 'border-blue-700 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-700 hover:bg-blue-50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-700" aria-hidden="true" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Xóa tệp đã chọn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mb-3 h-10 w-10 text-slate-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-700">
                    Kéo thả PDF vào đây hoặc click để chọn
                  </p>
                  <p className="mt-1 text-xs text-slate-500">PDF tối đa 10MB</p>
                </>
              )}
            </div>

            {/* Metadata form */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cv-number">
                  Số công văn <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="cv-number"
                  {...register('signedNumber')}
                  placeholder="VD: 1234/CV-XTTM"
                  disabled={submitting}
                />
                {errors.signedNumber ? (
                  <p className="text-sm text-red-600">{errors.signedNumber.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-date">
                  Ngày ký công văn <span className="text-red-600">*</span>
                </Label>
                <Controller
                  control={control}
                  name="signedDate"
                  render={({ field }) => (
                    <SignedDatePicker
                      id="cv-date"
                      value={field.value as Date | undefined}
                      onChange={field.onChange}
                      disabled={submitting}
                    />
                  )}
                />
                {errors.signedDate ? (
                  <p className="text-sm text-red-600">{errors.signedDate.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-name">
                  Họ tên người ký <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="cv-name"
                  {...register('signedByName')}
                  placeholder="VD: Vũ Bá Phú"
                  disabled={submitting}
                />
                {errors.signedByName ? (
                  <p className="text-sm text-red-600">{errors.signedByName.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-title">
                  Chức vụ người ký <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="cv-title"
                  {...register('signedByTitle')}
                  placeholder="VD: Cục trưởng"
                  disabled={submitting}
                />
                {errors.signedByTitle ? (
                  <p className="text-sm text-red-600">{errors.signedByTitle.message}</p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !file}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
                    Tải lên công văn
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {/* ===== Existing attachment view ===== */}
      {attachment ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="text-base font-semibold text-slate-900">Công văn hiện tại</h3>
            <Button asChild variant="outline" size="sm">
              <a
                href={`/api/file/${attachment.id}`}
                download={attachment.fileName}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-1 h-4 w-4" aria-hidden="true" />
                Tải về
              </a>
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PdfPreview attachmentId={attachment.id} />
            <dl className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <MetaRow
                label="Số công văn"
                value={attachment.signedNumber ?? <span className="text-slate-400">—</span>}
              />
              <MetaRow
                label="Ngày ký"
                value={
                  attachment.signedDate ? (
                    formatDate(attachment.signedDate)
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                }
              />
              <MetaRow
                label="Người ký"
                value={attachment.signedByName ?? <span className="text-slate-400">—</span>}
              />
              <MetaRow
                label="Chức vụ"
                value={attachment.signedByTitle ?? <span className="text-slate-400">—</span>}
              />
              <MetaRow label="Tên tệp" value={attachment.fileName} />
              <MetaRow
                label="Kích thước"
                value={
                  attachment.fileSize != null
                    ? formatFileSize(attachment.fileSize)
                    : '—'
                }
              />
            </dl>
          </div>
          {!showUploadArea && canEdit ? (
            <p className="mt-4 text-xs text-slate-500">
              Công văn ban hành đã được tải lên — không cho phép thay đổi trực tiếp. Mọi điều
              chỉnh sẽ phát hành công văn bổ sung trong quy trình điều chỉnh (Phase 8).
            </p>
          ) : null}
        </section>
      ) : null}

      {!attachment && !canEdit ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Chưa có công văn ban hành. Liên hệ Ban quản lý để tải lên.
        </div>
      ) : null}
    </div>
  );
}

export default CongVanUploadTab;
