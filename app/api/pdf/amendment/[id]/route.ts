// /api/pdf/amendment/[id] — Phase 8 Plan 08-01 Task 4.
// Render quyết định điều chỉnh PDF từ ProjectAmendment.

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { prisma } from '@/lib/prisma';
import { renderAmendmentDecisionPdf } from '@/lib/pdf/render';
import {
  AMENDMENT_TYPE_LABELS,
  type AmendmentType,
} from '@/lib/amendment-rules';
import type { Role } from '@/lib/constants';
import { formatVND } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'de-an', 'read'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const a = await prisma.projectAmendment.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          code: true,
          name: true,
          organization: { select: { name: true } },
        },
      },
    },
  });
  if (!a) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  if (a.status !== 'APPROVED' || !a.decisionNumber || !a.decisionDate) {
    return NextResponse.json(
      { error: 'not-approved', message: 'Yêu cầu chưa được phê duyệt' },
      { status: 404 },
    );
  }

  const typeKey = a.amendmentType as AmendmentType;
  const typeLabel = AMENDMENT_TYPE_LABELS[typeKey] ?? a.amendmentType;

  let oldValue: unknown = null;
  let newValue: unknown = null;
  try {
    oldValue = a.oldValueJson ? JSON.parse(a.oldValueJson) : null;
  } catch {
    oldValue = a.oldValueJson;
  }
  try {
    newValue = a.newValueJson ? JSON.parse(a.newValueJson) : null;
  } catch {
    newValue = a.newValueJson;
  }

  try {
    const buffer = await renderAmendmentDecisionPdf({
      decisionNumber: a.decisionNumber,
      decisionDate: a.decisionDate,
      signedByName: 'Nguyễn Thanh Hải',
      signedByTitle: 'CỤC TRƯỞNG\nCỤC XÚC TIẾN THƯƠNG MẠI',
      projectCode: a.project.code,
      projectName: a.project.name,
      organizationName: a.project.organization.name,
      amendmentType: a.amendmentType,
      amendmentTypeLabel: typeLabel,
      isCritical: a.isCritical,
      oldValueDisplay: formatValue(typeKey, oldValue),
      newValueDisplay: formatValue(typeKey, newValue),
      reason: a.reason,
    });

    const body = new Uint8Array(buffer);
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';
    const filename = `quyet-dinh-dieu-chinh-${a.decisionNumber
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
    console.error('[/api/pdf/amendment/[id]] render failed:', err);
    return NextResponse.json(
      { error: 'PDF render failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}

function formatValue(type: AmendmentType, value: unknown): string {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'TIME': {
      if (typeof value === 'object' && value !== null) {
        const v = value as { start?: string; end?: string };
        return [v.start, v.end].filter(Boolean).join(' → ');
      }
      return String(value);
    }
    case 'BUDGET': {
      if (typeof value === 'object' && value !== null) {
        const v = value as { total?: number };
        if (typeof v.total === 'number') return formatVND(v.total);
      }
      if (typeof value === 'number') return formatVND(value);
      return String(value);
    }
    default:
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
  }
}
