'use client';

// DocumentsManager — Section 4: drag-drop upload + grid hiển thị tài liệu pháp lý.
// Categories: GIAY_DKKD / DIEU_LE / QUYET_DINH / KHAC.
// Constraints: PDF/JPG/PNG, ≤10MB/file, ≤10 docs/profile (server enforced).

import * as React from 'react';
import { FileText, Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import {
  deleteProfileDocument,
  uploadProfileDocument,
} from '../_actions/upload-document';
import type { OrgProfileDocument } from '../_actions/types';

const CATEGORY_LABELS: Record<string, string> = {
  GIAY_DKKD: 'Giấy đăng ký kinh doanh',
  DIEU_LE: 'Điều lệ',
  QUYET_DINH: 'Quyết định thành lập',
  KHAC: 'Tài liệu khác',
};

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_HINT = 'PDF, JPG, PNG (tối đa 10MB / tệp)';
const MAX_DOCS = 10;

export type DocumentsManagerProps = {
  initial: OrgProfileDocument[];
  readOnly: boolean;
};

export function DocumentsManager({ initial, readOnly }: DocumentsManagerProps) {
  const [documents, setDocuments] = React.useState<OrgProfileDocument[]>(initial);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = React.useState<string>('GIAY_DKKD');
  const [uploading, setUploading] = React.useState(false);
  const [deleting, setDeleting] = React.useState<OrgProfileDocument | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error('Chỉ chấp nhận tệp PDF, JPG hoặc PNG');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Tệp vượt quá kích thước cho phép 10MB');
      return;
    }
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('category', pendingCategory);
      const res = await uploadProfileDocument(formData);
      // Optimistic insert
      const newDoc: OrgProfileDocument = {
        id: res.attachmentId,
        fileName: res.fileName,
        fileUrl: res.fileUrl,
        fileSize: pendingFile.size,
        mimeType: pendingFile.type,
        category: res.category,
        uploadedAt: new Date(),
        uploaderName: null,
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setPendingFile(null);
      toast.success('Đã tải lên tài liệu');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể tải lên tài liệu. Vui lòng thử lại.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProfileDocument(deleting.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleting.id));
      toast.success('Đã xóa tài liệu');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể xóa tài liệu. Vui lòng thử lại.',
      );
    } finally {
      setDeleting(null);
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const formatBytes = (n: number | null) => {
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  const docCount = documents.length;
  const canUploadMore = docCount < MAX_DOCS && !readOnly;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tài liệu pháp lý</CardTitle>
        <CardDescription>
          Tải lên các tài liệu chứng minh tư cách pháp nhân: giấy ĐKKD, điều lệ, quyết định thành lập...
          Đã tải: <strong>{docCount} / {MAX_DOCS}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canUploadMore ? (
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={
              'rounded-md border-2 border-dashed p-6 text-center transition ' +
              (isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50')
            }
          >
            <Upload className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-2 text-sm text-slate-700">
              Kéo & thả tệp vào đây, hoặc{' '}
              <button
                type="button"
                className="text-blue-700 underline hover:text-blue-900"
                onClick={() => inputRef.current?.click()}
              >
                chọn tệp từ máy
              </button>
            </p>
            <p className="mt-1 text-xs text-slate-500">{ACCEPTED_HINT}</p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                if (e.target) e.target.value = '';
              }}
            />
          </div>
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {readOnly
              ? 'Hồ sơ đang ở trạng thái không thể chỉnh sửa — không thể tải thêm tài liệu.'
              : `Đã đạt giới hạn ${MAX_DOCS} tài liệu. Vui lòng xóa bớt trước khi tải thêm.`}
          </p>
        )}

        {pendingFile ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0 text-blue-700" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {pendingFile.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {formatBytes(pendingFile.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPendingFile(null)}
                aria-label="Hủy tệp"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="pending-category" className="text-xs">
                  Loại tài liệu
                </Label>
                <Select value={pendingCategory} onValueChange={setPendingCategory}>
                  <SelectTrigger id="pending-category" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Đang tải...' : 'Tải lên'}
              </Button>
            </div>
          </div>
        ) : null}

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3"
              >
                {doc.mimeType?.startsWith('image/') ? (
                  <ImageIcon className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
                ) : (
                  <FileText className="h-5 w-5 flex-shrink-0 text-blue-700" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {(doc.category && CATEGORY_LABELS[doc.category]) || 'Khác'} ·{' '}
                    {formatBytes(doc.fileSize)}
                  </p>
                </div>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => setDeleting(doc)}
                    aria-label="Xóa tài liệu"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xác nhận xóa tài liệu"
        description={
          deleting
            ? `Bạn xác nhận xóa "${deleting.fileName}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </Card>
  );
}

export default DocumentsManager;
