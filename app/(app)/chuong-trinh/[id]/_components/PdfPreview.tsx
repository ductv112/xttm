'use client';

// PdfPreview — iframe sandbox PDF preview tham chiếu API /api/file/[attachmentId].
// Plan 03-06 Tab Công văn — defense-in-depth sandbox="" (T-03-06-03 mitigation).

import * as React from 'react';

export type PdfPreviewProps = {
  attachmentId: string;
  height?: number;
  title?: string;
};

export function PdfPreview({
  attachmentId,
  height = 600,
  title = 'Xem trước công văn',
}: PdfPreviewProps) {
  return (
    <iframe
      src={`/api/file/${attachmentId}`}
      className="w-full rounded-lg border border-slate-200"
      style={{ height: `${height}px` }}
      title={title}
      // Note: PDF rendering needs the PDF viewer plugin which requires `allow-same-origin`
      // OR the browser native viewer. Most browsers render PDFs via plugin even without
      // sandbox; we keep sandbox empty (`""`) to disable scripts/forms — defense-in-depth.
      sandbox=""
    />
  );
}

export default PdfPreview;
