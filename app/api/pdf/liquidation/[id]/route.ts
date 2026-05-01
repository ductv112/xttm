// /api/pdf/liquidation/[id] — Phase 9 Plan 09-01.
// Render biên bản thanh lý hợp đồng PDF từ AcceptanceRecord (làm gốc).

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { prisma } from '@/lib/prisma';
import { renderLiquidationRecordPdf } from '@/lib/pdf/render';
import {
  ACCEPTANCE_RESULT_LABELS,
  type AcceptanceResult,
} from '@/lib/workflows/acceptance';
import type { Role } from '@/lib/constants';

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
          contract: {
            select: {
              contractNo: true,
              signedDate: true,
              totalValue: true,
            },
          },
        },
      },
    },
  });
  if (!record) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  if (!record.project.contract) {
    return NextResponse.json(
      {
        error: 'no-contract',
        message: 'Đề án không có hợp đồng — không thể sinh biên bản thanh lý',
      },
      { status: 400 },
    );
  }

  // Sum disbursed financial records
  const disbursedSum = await prisma.financialRecord.aggregate({
    where: {
      projectId: record.projectId,
      status: { in: ['DISBURSED', 'SETTLED'] },
    },
    _sum: { amount: true },
  });
  const totalDisbursed = disbursedSum._sum.amount ?? 0;

  // Liquidation record number — derived from acceptance record number
  const liquidationNumber = record.recordNumber.replace('BB-NT', 'BB-TL');

  try {
    const buffer = await renderLiquidationRecordPdf({
      recordNumber: liquidationNumber,
      recordDate: record.liquidationDate ?? new Date(),
      contractNo: record.project.contract.contractNo,
      contractSignedDate: record.project.contract.signedDate,
      projectCode: record.project.code,
      projectName: record.project.name,
      organizationName: record.project.organization.name,
      totalContractValue: record.project.contract.totalValue,
      totalDisbursed,
      acceptanceRecordNumber: record.recordNumber,
      acceptanceDate: record.recordDate,
      acceptanceResultLabel:
        ACCEPTANCE_RESULT_LABELS[record.result as AcceptanceResult] ??
        record.result,
      notes: record.comments,
      signedAName: 'Trần Thị Bích Ngọc',
      signedATitle: 'Trưởng Ban quản lý CT XTTM',
      signedBName: 'Hoàng Mai Linh',
      signedBTitle: 'Đại diện đơn vị chủ trì',
    });

    const body = new Uint8Array(buffer);
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';
    const filename = `bien-ban-thanh-ly-${liquidationNumber
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
    console.error('[/api/pdf/liquidation/[id]] render failed:', err);
    return NextResponse.json(
      { error: 'PDF render failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
