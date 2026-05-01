// /api/pdf/decision/[id] — Plan 07-02 APPROVE-06.
// id = SubmissionDraft.id (1:1 with ApprovalDecision via FK unique).
// GET endpoint: auth + canFromDB('phe-duyet','read') → load submission + decision +
// render ApprovalDecision PDF buffer → stream as inline application/pdf.

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { renderApprovalDecisionPdf } from '@/lib/pdf/render';
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
  if (!detail.decision) {
    return NextResponse.json(
      { error: 'no-decision', message: 'Tờ trình chưa có quyết định phê duyệt' },
      { status: 404 },
    );
  }

  // Build approvedItems with project info
  const approvedItems = detail.decision.approvedItems.map((item, idx) => {
    const proj = detail.projects.find((p) => p.id === item.projectId);
    return {
      rank: idx + 1,
      projectCode: proj?.code ?? '—',
      projectName: proj?.name ?? '—',
      organizationName: proj?.organizationName ?? '—',
      approvedBudget: item.approvedBudget,
      comments: item.comments,
    };
  });

  try {
    const buffer = await renderApprovalDecisionPdf({
      decisionNumber: detail.decision.decisionNumber,
      decisionDate: detail.decision.decisionDate,
      signedByName: detail.decision.signedByName,
      signedByTitle: detail.decision.signedByTitle,
      programCycleYear: detail.programCycleYear,
      approvedItems,
      totalApprovedBudget: detail.decision.totalApprovedBudget,
      submissionDraftNumber: detail.draftNumber,
      watermark: '',
    });

    const body = new Uint8Array(buffer);
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';
    const filename = `quyet-dinh-${detail.decision.decisionNumber
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
    console.error('[/api/pdf/decision/[id]] render failed:', err);
    return NextResponse.json(
      { error: 'PDF render failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
