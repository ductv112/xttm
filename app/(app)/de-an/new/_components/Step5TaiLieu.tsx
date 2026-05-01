'use client';

// Step 5 — Tài liệu đính kèm (PROJ-09 / PROJ-10).
// Multi-file upload với:
//   - drag-and-drop support (HTML5)
//   - per-file category Select (PLAN / CAPABILITY / EVIDENCE / OTHER)
//   - upload via uploadProjectDocument server action (FormData)
//   - first-upload triggers force-autosave để có projectId
//   - delete via deleteProjectDocument
//   - quota: 20 files / 10MB per file
//   - listing với fileSize, category badge, uploaded timestamp

import * as React from 'react';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

import { useProjectWizardStore } from '../_lib/wizardStore';
import type { Step5DocumentEntry } from '../_lib/types';
import {
  uploadProjectDocument,
  deleteProjectDocument,
} from '@/app/(app)/de-an/_actions/upload-document';
import type { StepHandle } from './ProjectWizardShell';

const MAX_DOCS = 20;
const MAX_BYTES = 10 * 1024 * 1024;

const CATEGORY_OPTIONS: Array<{
  value: Step5DocumentEntry['category'];
  label: string;
}> = [
  { value: 'PLAN', label: 'Kế hoạch chi tiết' },
  { value: 'CAPABILITY', label: 'Hồ sơ năng lực' },
  { value: 'EVIDENCE', label: 'Bằng chứng kinh nghiệm' },
  { value: 'OTHER', label: 'Khác' },
];

const ACCEPTED_EXTS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';

function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export type Step5Props = {
  /** Server draft id once autosave succeeds. Required to upload. */
  projectId: string | null;
  /** Force-autosave before first upload — returns the (possibly new) projectId. */
  onAutosaveBeforeUpload: () => Promise<string | null>;
};

export const Step5TaiLieu = React.forwardRef<StepHandle, Step5Props>(
  function Step5TaiLieu({ projectId, onAutosaveBeforeUpload }, ref) {
    const documentsRaw = useProjectWizardStore(
      (s) => s.formData.step5?.documents,
    );
    const documents = React.useMemo(
      () => documentsRaw ?? [],
      [documentsRaw],
    );
    const setStepData = useProjectWizardStore((s) => s.setStepData);
    const addDocument = useProjectWizardStore((s) => s.addDocument);
    const removeDocument = useProjectWizardStore((s) => s.removeDocument);

    const [defaultCategory, setDefaultCategory] = React.useState<
      Step5DocumentEntry['category']
    >('PLAN');
    const [uploading, setUploading] = React.useState(false);
    const [dragOver, setDragOver] = React.useState(false);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [deletingPending, setDeletingPending] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        async validateAndCommit() {
          // Step 5 documents are managed inline by server actions; ensure store
          // has at least an entry for step5 so submit-time review can read it.
          setStepData('step5', { documents });
          return true;
        },
      }),
      [documents, setStepData],
    );

    const handleFiles = async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      if (documents.length + arr.length > MAX_DOCS) {
        toast.error(
          `Vượt quá giới hạn ${MAX_DOCS} tài liệu/đề án. Vui lòng xóa bớt trước khi tải thêm.`,
        );
        return;
      }
      // Pre-flight size check
      for (const f of arr) {
        if (f.size > MAX_BYTES) {
          toast.error(
            `Tệp "${f.name}" vượt quá kích thước cho phép 10MB`,
          );
          return;
        }
      }

      setUploading(true);
      try {
        // Ensure draft exists server-side (assigns projectId if not yet)
        let pid = projectId;
        if (!pid) {
          pid = await onAutosaveBeforeUpload();
          if (!pid) {
            toast.error(
              'Vui lòng nhập tối thiểu tên đề án và loại đề án ở Bước 1 trước khi tải tài liệu',
            );
            return;
          }
        }

        for (const file of arr) {
          const formData = new FormData();
          formData.set('projectId', pid);
          formData.set('file', file);
          formData.set('category', defaultCategory);
          try {
            const res = await uploadProjectDocument(formData);
            const entry: Step5DocumentEntry = {
              attachmentId: res.attachmentId,
              fileName: res.fileName,
              category: res.category as Step5DocumentEntry['category'],
              fileSize: file.size,
              fileUrl: res.fileUrl,
              uploadedAt: new Date().toISOString(),
            };
            addDocument(entry);
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : `Không thể tải lên tệp ${file.name}`;
            toast.error(msg);
          }
        }
        toast.success('Đã tải lên tài liệu');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) {
        void handleFiles(e.dataTransfer.files);
      }
    };

    const handleUpdateCategory = async (
      attachmentId: string,
      _newCategory: Step5DocumentEntry['category'],
    ) => {
      // Note: server-side category swap not implemented yet (would require an
      // updateDocumentCategory action). For POC, category is locked at upload —
      // user can delete + re-upload to change. We keep UI read-only for now.
      void attachmentId;
      toast.info(
        'Để đổi loại tài liệu, vui lòng xóa và tải lên lại với loại mới',
      );
    };

    const handleConfirmDelete = async () => {
      if (!deletingId) return;
      setDeletingPending(true);
      try {
        await deleteProjectDocument(deletingId);
        removeDocument(deletingId);
        toast.success('Đã xóa tài liệu');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Không thể xóa tài liệu';
        toast.error(msg);
      } finally {
        setDeletingPending(false);
        setDeletingId(null);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bước 5: Tài liệu đính kèm
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Tải lên các tài liệu liên quan: kế hoạch chi tiết, hồ sơ năng lực,
            bằng chứng kinh nghiệm... Định dạng PDF/DOC/DOCX/XLS/XLSX/JPG/PNG,
            tối đa 10MB/tệp, {MAX_DOCS} tệp/đề án.
          </p>
        </div>

        {/* Category default + dropzone */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <Label htmlFor="step5-default-cat" className="text-sm">
                Loại tài liệu (áp dụng cho lần tải tới)
              </Label>
              <Select
                value={defaultCategory}
                onValueChange={(v) =>
                  setDefaultCategory(v as Step5DocumentEntry['category'])
                }
              >
                <SelectTrigger id="step5-default-cat" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-slate-500">
              Đã tải: <strong>{documents.length}</strong> / {MAX_DOCS} tệp
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
              dragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 bg-slate-50',
              uploading && 'opacity-60 pointer-events-none',
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2
                  className="h-8 w-8 animate-spin text-blue-600"
                  aria-hidden="true"
                />
                <p className="text-sm text-slate-600">Đang tải tệp...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload
                  className="h-10 w-10 text-slate-400"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    Kéo & thả tệp vào đây hoặc bấm để chọn
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF · DOC · DOCX · XLS · XLSX · JPG · PNG (≤ 10MB / tệp)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_EXTS}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      void handleFiles(e.target.files);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Chọn tệp
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded list */}
        {documents.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Chưa có tài liệu nào được tải lên.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Tên tệp</th>
                  <th className="px-3 py-2 text-left font-medium">Loại</th>
                  <th className="px-3 py-2 text-right font-medium">Kích thước</th>
                  <th className="px-3 py-2 text-left font-medium">Tải lúc</th>
                  <th className="px-3 py-2 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.attachmentId} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          className="h-4 w-4 shrink-0 text-slate-500"
                          aria-hidden="true"
                        />
                        <span className="truncate font-medium text-slate-900">
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={doc.category}
                        onValueChange={(v) =>
                          handleUpdateCategory(
                            doc.attachmentId,
                            v as Step5DocumentEntry['category'],
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatDateTime(doc.uploadedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeletingId(doc.attachmentId)}
                        aria-label="Xóa tài liệu"
                      >
                        <Trash2
                          className="h-4 w-4 text-red-600"
                          aria-hidden="true"
                        />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Khuyến khích đính kèm ít nhất kế hoạch chi tiết và hồ sơ năng lực
              để Ban quản lý có đủ căn cứ thẩm định. Không bắt buộc ở bước này
              — bạn có thể bổ sung sau khi nộp.
            </span>
          </div>
        ) : null}

        <ConfirmDialog
          open={!!deletingId}
          onOpenChange={(open) => {
            if (!open && !deletingPending) setDeletingId(null);
          }}
          title="Xác nhận xóa tài liệu"
          description="Tài liệu sẽ bị xóa khỏi đề án và không thể khôi phục. Bạn có chắc chắn không?"
          confirmLabel="Xóa"
          variant="destructive"
          onConfirm={handleConfirmDelete}
        />
      </div>
    );
  },
);

export default Step5TaiLieu;
