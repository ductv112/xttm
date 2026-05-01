'use client';

// ContractScanTab — Phase 8 Plan 08-01 Task 2.
// Upload + preview bản scan PDF hợp đồng.
// POC: file upload mock — chấp nhận file URL nhập tay (gắn với public/mock-files/)
// hoặc file picker giả lập.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  Download,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/format';

import type { ContractDetail } from '../../_actions/get-detail';
import { uploadContractScan } from '../../_actions/upload-scan';

const MOCK_FILE_URL = '/mock-files/hop-dong-mau.pdf';

export function ContractScanTab({
  contract,
  canUpdate,
}: {
  contract: ContractDetail;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [fileName, setFileName] = React.useState(
    `HopDong_${contract.contractNo.replace(/\//g, '-')}_DaKy.pdf`,
  );

  async function handleUpload() {
    setPending(true);
    try {
      const result = await uploadContractScan(contract.id, {
        fileName,
        fileUrl: MOCK_FILE_URL,
        fileSize: 245_000,
        mimeType: 'application/pdf',
      });
      if (result.ok) {
        toast.success('Đã tải lên bản scan hợp đồng');
        router.refresh();
      } else {
        toast.error('Tải lên thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6" id="scan">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="mb-2 font-semibold text-slate-900">
          Bản scan hợp đồng đã ký
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Sau khi hợp đồng được hai bên ký, hãy upload bản scan PDF (đã có chữ
          ký + dấu) lên hệ thống để lưu trữ và đối chiếu.
        </p>

        {contract.scanFileUrl ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <FileText
                className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-700"
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="font-medium text-emerald-900">
                  Đã có bản scan hợp đồng
                </div>
                <div className="mt-1 text-xs text-emerald-700">
                  File: <strong>{contract.scanFileUrl}</strong>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={contract.scanFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink
                        className="mr-1 h-4 w-4"
                        aria-hidden="true"
                      />
                      Mở bản scan
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={contract.scanFileUrl} download>
                      <Download
                        className="mr-1 h-4 w-4"
                        aria-hidden="true"
                      />
                      Tải về
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="file-x"
            heading="Chưa có bản scan hợp đồng"
            description="Hãy tải lên bản scan PDF của hợp đồng đã được ký."
          />
        )}

        {canUpdate ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Upload className="h-4 w-4" aria-hidden="true" />
              {contract.scanFileUrl ? 'Cập nhật bản scan' : 'Tải lên bản scan'}
            </div>
            <p className="mb-3 text-xs text-slate-500">
              POC mode: hệ thống dùng PDF mẫu trong{' '}
              <code>public/mock-files/</code>. Production sẽ dùng file picker
              thật.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-64">
                <Label htmlFor="fileName">Tên file</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleUpload} disabled={pending}>
                <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {pending ? 'Đang tải...' : 'Tải lên'}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {contract.attachments.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-slate-900">
            Lịch sử tải lên ({contract.attachments.length})
          </h3>
          <ul className="space-y-2">
            {contract.attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Paperclip
                    className="h-4 w-4 text-slate-500"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {a.fileName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(a.createdAt)}
                      {a.uploaderName ? ` · ${a.uploaderName}` : ''}
                    </div>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <a href={a.fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
