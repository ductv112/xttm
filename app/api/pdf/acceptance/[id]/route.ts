// /api/pdf/acceptance/[id] — Phase 9 Plan 09-01.
// Render biên bản nghiệm thu PDF từ AcceptanceRecord.

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { prisma } from '@/lib/prisma';
import { renderAcceptanceRecordPdf } from '@/lib/pdf/render';
import {
  ACCEPTANCE_RESULT_LABELS,
  type AcceptanceResult,
} from '@/lib/workflows/acceptance';
import type { Role } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'nghiem-thu', 'read'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const record = await prisma.acceptanceRecord.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          code: true,
          name: true,
          organization: { select: { name: true } },
          contract: { select: { contractNo: true } },
        },
      },
      report: {
        select: {
          quantitativeJson: true,
          qualitativeHtml: true,
          attendingCompaniesCount: true,
        },
      },
    },
  });
  if (!record) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  // Parse quantitative rows
  let quantitativeRows: Array<{
    name: string;
    unit: string;
    planned: number | null;
    actual: number | null;
    note?: string;
  }> = [];
  if (record.report.quantitativeJson) {
    try {
      const parsed = JSON.parse(record.report.quantitativeJson);
      if (parsed && Array.isArray(parsed.rows)) {
        quantitativeRows = parsed.rows.map(
          (r: {
            name?: string;
            unit?: string;
            planned?: number | null;
            actual?: number | null;
            note?: string;
          }) => ({
            name: r.name ?? '',
            unit: r.unit ?? '',
            planned: r.planned ?? null,
            actual: r.actual ?? null,
            note: r.note,
          }),
        );
      }
    } catch {
      quantitativeRows = [];
    }
  }

  try {
    const buffer = await renderAcceptanceRecordPdf({
      recordNumber: record.recordNumber,
      recordDate: record.recordDate,
      projectCode: record.project.code,
      projectName: record.project.name,
      organizationName: record.project.organization.name,
      contractNo: record.project.contract?.contractNo ?? null,
      resultLabel:
        ACCEPTANCE_RESULT_LABELS[record.result as AcceptanceResult] ??
        record.result,
      comments: record.comments,
      quantitativeRows,
      attendingCompaniesCount: record.report.attendingCompaniesCount,
      qualitativeText: stripHtml(record.report.qualitativeHtml),
      signedAOrgName: 'Cục Xúc tiến Thương mại',
      signedAName: 'Trần Thị Bích Ngọc',
      signedATitle: 'Trưởng Ban quản lý CT XTTM',
      signedBOrgName: record.project.organization.name,
      signedBName: 'Hoàng Mai Linh',
      signedBTitle: 'Đại diện đơn vị chủ trì',
    });

    const body = new Uint8Array(buffer);
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';
    const filename = `bien-ban-nghiem-thu-${record.recordNumber
      .replace(/[^A-Za-z0-9-_.]+/g, '-')
      .slice(0, 80)}.pdf`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${
          isDownload ? 'attachment' : 'inline'
        }; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[/api/pdf/acceptance/[id]] render failed:', err);
    return NextResponse.json(
      { error: 'PDF render failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
