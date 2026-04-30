/**
 * Smoke test: render PDF from CLI, verify size + magic header.
 * Saves sample to .planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf for retrospective.
 *
 * Usage: npx tsx scripts/pdf-smoke-test.mts
 */
import { writeFile, mkdir } from 'node:fs/promises';

// Use star-import to dodge tsx ESM named-export edge case with .tsx files.
const renderModule = await import('../lib/pdf/render');
const templateModule = await import('../lib/pdf/templates/OfficialDocument');

const renderOfficialDocumentPdf = renderModule.renderOfficialDocumentPdf;
const SMOKE_STRING = templateModule.SMOKE_STRING;

const t0 = Date.now();
const buffer = await renderOfficialDocumentPdf({
  documentNumber: '12/QĐ-XTTM',
  signedDate: new Date('2026-04-30'),
  title: 'Phê duyệt đề án xúc tiến thương mại quốc gia năm 2026',
  body: SMOKE_STRING,
  signerTitle: 'KT. CỤC TRƯỞNG\nPHÓ CỤC TRƯỞNG',
  signerName: 'Nguyễn Văn An',
});
const duration = Date.now() - t0;

console.log('PDF_SIZE:', buffer.length, 'bytes');
const header = buffer.slice(0, 5).toString();
console.log('PDF_HEADER:', header);
console.log('RENDER_DURATION_MS:', duration);

await mkdir('.planning/phases/01-m0-bootstrap-h-t-ng', { recursive: true });
await writeFile('.planning/phases/01-m0-bootstrap-h-t-ng/01-06-spike-output.pdf', buffer);
console.log('Saved sample PDF.');

if (buffer.length < 30000) {
  console.error('FAIL: PDF too small');
  process.exit(1);
}
if (header !== '%PDF-') {
  console.error('FAIL: bad magic header');
  process.exit(1);
}
console.log('SMOKE TEST PASSED');
