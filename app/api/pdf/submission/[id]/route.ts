// /api/pdf/submission/[id] — Plan 07-02 APPROVE-03.
// GET endpoint: auth + canFromDB('phe-duyet','read') → load submission detail →
// render Submission PDF buffer → stream as inline application/pdf.

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { renderSubmissionPdf } from '@/lib/pdf/render';
import type { Role } from '@/lib/constants';

import { getSubmissionDetail } from '@/app/(app)/phe-duyet/_actions/save-submission';

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
  if (!(await canFromDB(role, 'phe-duyet', 'read'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const detail = await getSubmissionDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const totalProposed = detail.projects.reduce(
    (acc, p) => acc + (p.proposedBudget ?? 0),
    0,
  );

  try {
    const buffer = await renderSubmissionPdf({
      draftNumber: detail.draftNumber ?? '......./TTr-XTTM',
      programCycleYear: detail.programCycleYear,
      draftedAt: detail.draftedAt,
      contentHtml: detail.contentHtml,
      projects: detail.projects.map((p) => ({
        rank: p.rank,
        projectCode: p.code,
        projectName: p.name,
        organizationName: p.organizationName,
        proposedBudget: p.proposedBudget ?? 0,
        averageScore: p.averageScore,
      })),
      totalProposedBudget: totalProposed,
      watermark: detail.decision ? '' : 'BẢN MẪU',
    });

    const body = new Uint8Array(buffer);
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';
    const filename = `to-trinh-${(detail.draftNumber ?? detail.id)
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
    console.error('[/api/pdf/submission/[id]] render failed:', err);
    return NextResponse.json(
      { error: 'PDF render failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
