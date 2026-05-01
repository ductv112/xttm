'use server';

// getContractDetail — Phase 8 Plan 08-01 Task 2.

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import type { Role } from '@/lib/constants';

export type ContractDetail = {
  id: string;
  contractNo: string;
  status: string;
  totalValue: number;
  signedDate: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  termsHtml: string | null;
  scanFileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  project: {
    id: string;
    code: string;
    name: string;
    kind: string;
    status: string;
    plannedStartAt: Date | null;
    plannedEndAt: Date | null;
    approvedBudget: number | null;
  };

  organization: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    taxCode: string | null;
  };

  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number | null;
    mimeType: string | null;
    createdAt: Date;
    uploaderName: string | null;
  }>;

  decision: {
    decisionNumber: string;
    decisionDate: Date;
    approvedBudget: number;
  } | null;
};

export async function getContractDetail(
  contractId: string,
): Promise<ContractDetail | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'read'))) return null;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      project: true,
      organization: true,
    },
  });
  if (!contract) return null;

  // RBAC scope: DONVI only own org
  if (
    role === 'DONVI' &&
    contract.organizationId !== session.user.organizationId
  ) {
    return null;
  }

  const attachments = await prisma.attachment.findMany({
    where: { entityType: 'Contract', entityId: contractId },
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { fullName: true } } },
  });

  // Find decision for this project
  let decision: ContractDetail['decision'] = null;
  const decisions = await prisma.approvalDecision.findMany({
    select: {
      decisionNumber: true,
      decisionDate: true,
      approvedItemsJson: true,
    },
  });
  for (const d of decisions) {
    try {
      const items = JSON.parse(d.approvedItemsJson);
      if (Array.isArray(items)) {
        const found = items.find(
          (item: { projectId?: string }) =>
            item?.projectId === contract.projectId,
        );
        if (found) {
          decision = {
            decisionNumber: d.decisionNumber,
            decisionDate: d.decisionDate,
            approvedBudget:
              typeof found.approvedBudget === 'number' ? found.approvedBudget : 0,
          };
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    id: contract.id,
    contractNo: contract.contractNo,
    status: contract.status,
    totalValue: contract.totalValue,
    signedDate: contract.signedDate,
    effectiveFrom: contract.effectiveFrom,
    effectiveTo: contract.effectiveTo,
    termsHtml: contract.termsHtml,
    scanFileUrl: contract.scanFileUrl,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    project: {
      id: contract.project.id,
      code: contract.project.code,
      name: contract.project.name,
      kind: contract.project.kind,
      status: contract.project.status,
      plannedStartAt: contract.project.plannedStartAt,
      plannedEndAt: contract.project.plannedEndAt,
      approvedBudget: contract.project.approvedBudget,
    },
    organization: {
      id: contract.organization.id,
      name: contract.organization.name,
      address: contract.organization.address,
      phone: contract.organization.phone,
      email: contract.organization.email,
      taxCode: contract.organization.taxCode,
    },
    attachments: attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      createdAt: a.createdAt,
      uploaderName: a.uploader?.fullName ?? null,
    })),
    decision,
  };
}
