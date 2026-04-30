import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OfficialDocument, type OfficialDocumentProps } from './templates/OfficialDocument';
import { registerPdfFonts } from './fonts';

/**
 * Render the OfficialDocument template to a PDF Buffer.
 *
 * Calls registerPdfFonts() before render — the call is idempotent so wrapper consumers
 * never need to register fonts manually. Returns a Node Buffer suitable for
 * `new Response(buffer, { headers: { 'Content-Type': 'application/pdf' } })`.
 *
 * NOTE: This file uses `.ts` extension (per plan interface contract) and therefore uses
 * `React.createElement` instead of JSX syntax. Phase 5/7/9 will reuse this wrapper with
 * different props for đề án, tờ trình, biên bản nghiệm thu — all use the same
 * OfficialDocument template shape.
 */
export async function renderOfficialDocumentPdf(
  props: OfficialDocumentProps,
): Promise<Buffer> {
  registerPdfFonts();
  const buffer = await renderToBuffer(createElement(OfficialDocument, props));
  return buffer;
}
