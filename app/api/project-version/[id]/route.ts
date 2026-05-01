// /api/project-version/[id] — return ProjectVersion snapshot JSON for LichSuTab.
// Plan 05-03: GET endpoint with auth + cross-tenant guard (must own project OR
// have de-an:read permission). Returns parsed snapshotJson.
//
// T-05-03-01 mitigation: same authorization logic as getProjectDetail.

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const version = await prisma.projectVersion.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          organizationId: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!version || !version.project || version.project.deletedAt) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  // ADMIN bypass: full data access — admin can view any project version snapshot
  const isAdmin = session.user.role === 'ADMIN';
  const isOwnOrg =
    session.user.organizationId &&
    session.user.organizationId === version.project.organizationId;
  const canRead = await canFromDB(session.user.role, 'de-an', 'read');
  if (!isAdmin && !isOwnOrg && !canRead) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let snapshot: unknown = null;
  if (version.snapshotJson) {
    try {
      snapshot = JSON.parse(version.snapshotJson);
    } catch {
      snapshot = { raw: version.snapshotJson };
    }
  }

  return NextResponse.json({
    versionNumber: version.versionNumber,
    reason: version.reason,
    createdAt: version.createdAt,
    snapshot,
  });
}
