// /api/pdf/project/[id] — Plan 05-03 PROJ-16.
// GET endpoint: auth + cross-tenant guard (reuse getProjectDetail authorization)
// → resolve catalog names → render ProjectProposal PDF buffer → stream as
// inline application/pdf.
//
// Threat mitigation T-05-03-02: same authorization logic as detail page.
// Audit log: this is a READ-only export — no mutation.

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderProjectProposalPdf } from '@/lib/pdf/render';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';
import { formatDate } from '@/lib/format';

import { getProjectDetail } from '@/app/(app)/de-an/_actions/get-detail';

export const runtime = 'nodejs'; // @react-pdf/renderer needs Node runtime
export const dynamic = 'force-dynamic';

function resolveNames(
  ids: string[] | undefined,
  catalog: ReadonlyArray<{ id: string; name: string }>,
): string[] {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const map = new Map(catalog.map((c) => [c.id, c.name]));
  return ids.map((id) => map.get(id) ?? id);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let project;
  try {
    project = await getProjectDetail(id);
  } catch (err) {
    return NextResponse.json(
      { error: 'forbidden', message: (err as Error).message },
      { status: 403 },
    );
  }
  if (!project) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  // Resolve catalog names for richer PDF content
  const [industrySectors, markets, countries, promotionTypes] = await Promise.all([
    prisma.industrySector.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    prisma.market.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    prisma.country.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    prisma.promotionType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const general = project.generalInfo;
  const sectorNames = resolveNames(general.industrySectorIds, industrySectors);
  const marketNames = resolveNames(general.marketIds, markets);
  const countryNames = resolveNames(general.countryIds, countries);
  const promotionTypeNames = resolveNames(
    general.promotionTypeIds,
    promotionTypes,
  );

  const timeStart = general.timeRange?.start;
  const timeEnd = general.timeRange?.end;
  const quarter = general.timeRange?.quarter;
  let timeRangeLabel = '(chưa khai báo)';
  if (quarter) {
    timeRangeLabel = quarter;
  } else if (timeStart && timeEnd) {
    timeRangeLabel = `${formatDate(timeStart)} đến ${formatDate(timeEnd)}`;
  } else if (timeStart) {
    timeRangeLabel = `Từ ${formatDate(timeStart)}`;
  } else if (timeEnd) {
    timeRangeLabel = `Đến ${formatDate(timeEnd)}`;
  }

  try {
    const buffer = await renderProjectProposalPdf({
      projectCode: project.code,
      projectName: project.name,
      projectYear: project.year,
      projectKindLabel: PROJECT_KIND_LABELS[project.kind] ?? project.kind,
      projectStatus: project.status,
      organizationName: project.organizationName,
      programCycleName: project.programCycleName,
      programCycleYear: project.programCycleYear,
      industrySectorNames: sectorNames,
      marketNames,
      countryNames,
      promotionTypeNames,
      timeRangeLabel,
      objectiveHtml: project.objectives.objective ?? '',
      contentHtml: project.objectives.content ?? '',
      planRows: (project.plan.rows ?? []).map((r) => ({
        task: r.task ?? '',
        deliverable: r.deliverable,
        dueDate: r.dueDate ? formatDate(r.dueDate) : null,
        owner: r.owner,
      })),
      budgetRows: (project.budget.rows ?? []).map((r) => ({
        item: r.item ?? '',
        unit: r.unit,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        amount: r.amount,
        source: r.source,
        note: r.note,
      })),
      totalState: project.budget.totalState ?? 0,
      totalSelf: project.budget.totalSelf ?? 0,
      totalAll:
        project.budget.total ??
        (project.budget.totalState ?? 0) + (project.budget.totalSelf ?? 0),
      pmContact: project.pmContactSnapshot,
    });

    const body = new Uint8Array(buffer);
    const filename = `de-an-${project.code}.pdf`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[/api/pdf/project/[id]] render failed:', err);
    return NextResponse.json(
      {
        error: 'PDF render failed',
        message: (err as Error).message,
      },
      { status: 500 },
    );
  }
}
