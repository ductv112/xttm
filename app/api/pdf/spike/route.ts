import { NextResponse } from 'next/server';
import { renderOfficialDocumentPdf } from '@/lib/pdf/render';
import { SMOKE_STRING } from '@/lib/pdf/templates/OfficialDocument';

/**
 * GET /api/pdf/spike
 *
 * M0 spike route — renders a sample Quyết định PDF using the OfficialDocument template
 * with SMOKE_STRING as body content. Verifies that @react-pdf/renderer + Be Vietnam Pro
 * static TTF correctly render Vietnamese diacritics.
 *
 * Public access (no auth) at M0 per threat model T-06-01: spike serves placeholder content
 * with "BẢN MẪU" watermark — no real user data exposed. Phase 5+ wraps real PDF routes
 * with auth().
 */
export const runtime = 'nodejs'; // @react-pdf/renderer needs Node runtime, NOT Edge
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buffer = await renderOfficialDocumentPdf({
      documentNumber: '12/QĐ-XTTM',
      signedDate: new Date(),
      title: 'Phê duyệt đề án xúc tiến thương mại quốc gia năm 2026',
      body: SMOKE_STRING,
      signerTitle: 'KT. CỤC TRƯỞNG\nPHÓ CỤC TRƯỞNG',
      signerName: 'Nguyễn Văn An',
    });

    // Convert Node Buffer to Uint8Array view for the Web Response constructor.
    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="quyet-dinh-mau-spike.pdf"',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[/api/pdf/spike] render failed:', err);
    return NextResponse.json(
      {
        error: 'PDF render failed',
        message: (err as Error).message,
      },
      { status: 500 },
    );
  }
}
