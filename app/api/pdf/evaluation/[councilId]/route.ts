// /api/pdf/evaluation/[councilId] — Plan 07-01 COUNCIL-14.
// GET endpoint: auth + canFromDB('tham-dinh','read') → resolve aggregate +
// render EvaluationReport PDF buffer → stream as inline application/pdf.

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { renderEvaluationReportPdf } from '@/lib/pdf/render';
import type { Role } from '@/lib/constants';

import { COUNCIL_MEMBER_ROLE_LABELS } from '@/app/(app)/hoi-dong/_actions/member-types';
import type { CouncilMemberRole } from '@/app/(app)/hoi-dong/_actions/member-types';
import { getAggregateScores } from '@/app/(app)/hoi-dong/_actions/aggregate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ councilId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'tham-dinh', 'read'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { councilId } = await params;
  const aggregate = await getAggregateScores(councilId);
  if (!aggregate) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  // Compute total submitted sheets
  let totalSubmittedSheets = 0;
  for (const arr of Object.values(aggregate.sheetsByProject)) {
    totalSubmittedSheets += arr.filter((s) => s.status === 'SUBMITTED').length;
  }

  const projectComments = aggregate.projects.map((p) => {
    const sheets = (aggregate.sheetsByProject[p.projectId] ?? [])
      .filter((s) => s.status === 'SUBMITTED')
      .map((s) => ({
        reviewerName: s.reviewerName,
        reviewerRoleLabel: s.reviewerRole
          ? COUNCIL_MEMBER_ROLE_LABELS[s.reviewerRole as CouncilMemberRole] ??
            s.reviewerRole
          : 'Thành viên',
        totalScore: s.totalScore,
        conflictOfInterest: s.conflictOfInterest,
        comment: s.comment,
      }));
    return {
      projectCode: p.projectCode,
      projectName: p.projectName,
      scoreSheets: sheets,
    };
  });

  // Council program cycle decision document attachment count (POC: not used)
  // Map members for the report
  const members = aggregate.members.map((m) => ({
    fullName: m.fullName,
    role: m.role,
    roleLabel:
      COUNCIL_MEMBER_ROLE_LABELS[m.role as CouncilMemberRole] ?? m.role,
    submittedSheetCount: m.submittedSheetCount,
  }));

  const projects = aggregate.projects.map((p) => ({
    rank: p.rank,
    projectCode: p.projectCode,
    projectName: p.projectName,
    organizationName: p.organizationName,
    proposedBudget: p.proposedBudget,
    submittedCount: p.submittedCount,
    totalMembers: p.totalMembers,
    coiCount: p.coiCount,
    averageScore: p.averageScore,
    minScore: p.minScore,
    maxScore: p.maxScore,
  }));

  try {
    const buffer = await renderEvaluationReportPdf({
      councilName: aggregate.council.name,
      councilTerm: aggregate.council.term,
      programCycleYear: aggregate.council.programCycleYear,
      members,
      projects,
      projectComments,
      lockStatus: aggregate.council.lockStatus,
      totalSubmittedSheets,
    });

    const body = new Uint8Array(buffer);
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';
    const safeName = aggregate.council.name
      .replace(/[^A-Za-z0-9-_.]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    const filename = `bao-cao-tham-dinh-${safeName || aggregate.council.id}.pdf`;
    void prisma; // keep import (no further mutation)
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
    console.error('[/api/pdf/evaluation/[councilId]] render failed:', err);
    return NextResponse.json(
      { error: 'PDF render failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
