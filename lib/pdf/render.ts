import * as React from 'react';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OfficialDocument, type OfficialDocumentProps } from './templates/OfficialDocument';
import {
  ProjectProposal,
  type ProjectProposalProps,
} from './templates/ProjectProposal';
import {
  EvaluationReport,
  type EvaluationReportProps,
} from './templates/EvaluationReport';
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

/**
 * Render the ProjectProposal template (Phase 5 đề án PDF) to a PDF Buffer.
 * Idempotent font registration. Returns Node Buffer for streaming via NextResponse.
 */
export async function renderProjectProposalPdf(
  props: ProjectProposalProps,
): Promise<Buffer> {
  registerPdfFonts();
  // Type cast: createElement loses Document narrowing when component is .tsx;
  // ProjectProposal returns <Document> at runtime. Same pattern as OfficialDocument.
  const element = createElement(
    ProjectProposal as unknown as React.ComponentType<ProjectProposalProps>,
    props,
  ) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);
  return buffer;
}

/**
 * Render the EvaluationReport template (Phase 7 báo cáo thẩm định PDF) to a Buffer.
 */
export async function renderEvaluationReportPdf(
  props: EvaluationReportProps,
): Promise<Buffer> {
  registerPdfFonts();
  const element = createElement(
    EvaluationReport as unknown as React.ComponentType<EvaluationReportProps>,
    props,
  ) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);
  return buffer;
}
