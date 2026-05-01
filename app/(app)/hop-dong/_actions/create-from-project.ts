'use server';

// createContractFromProject — Phase 8 Plan 08-01 Task 2.
// Sinh hợp đồng từ đề án APPROVED (1 contract per project unique).
// Auto-fill: contractNo (atomic), totalValue (approvedBudget), organizationId,
//   effectiveFrom/To from project plannedStartAt/plannedEndAt, default termsHtml.

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canFromDB } from '@/lib/permissions-db';
import { logAudit } from '@/lib/audit';
import { CONTRACT_AUDIT_TYPES } from '@/lib/audit-types';
import type { Role } from '@/lib/constants';

import { generateContractNumber } from './generate-number';

const DEFAULT_TERMS_HTML = `
<h3>Điều 1. Đối tượng và phạm vi hợp đồng</h3>
<p>Bên A (Cục Xúc tiến Thương mại - Bộ Công Thương) ký kết với Bên B (đơn vị chủ trì) để triển khai đề án Xúc tiến Thương mại Quốc gia đã được phê duyệt theo Quyết định của Bộ Công Thương.</p>

<h3>Điều 2. Tổng kinh phí và nguồn kinh phí</h3>
<p>Tổng kinh phí thực hiện đề án theo dự toán đã được phê duyệt, bao gồm phần ngân sách nhà nước hỗ trợ và phần đối ứng của đơn vị chủ trì theo tỷ lệ quy định.</p>

<h3>Điều 3. Thời gian thực hiện</h3>
<p>Thời gian thực hiện theo kế hoạch đã được phê duyệt trong đề án.</p>

<h3>Điều 4. Trách nhiệm của các bên</h3>
<p><strong>Bên A:</strong> Cấp kinh phí theo tiến độ, kiểm tra giám sát, nghiệm thu kết quả.</p>
<p><strong>Bên B:</strong> Triển khai theo đúng kế hoạch, báo cáo định kỳ, sử dụng kinh phí đúng mục đích.</p>

<h3>Điều 5. Tạm ứng và thanh quyết toán</h3>
<p>Tạm ứng theo Thông tư hướng dẫn của Bộ Tài chính. Thanh quyết toán sau khi nghiệm thu hoàn thành đề án.</p>

<h3>Điều 6. Báo cáo</h3>
<p>Bên B báo cáo định kỳ theo lịch và báo cáo tổng hợp trong vòng 15 ngày sau khi kết thúc hoạt động.</p>

<h3>Điều 7. Điều chỉnh hợp đồng</h3>
<p>Mọi điều chỉnh phải được thông báo bằng văn bản và được Bên A chấp thuận theo quy định Điều 13 NĐ 28/2018/NĐ-CP.</p>

<h3>Điều 8. Hiệu lực hợp đồng</h3>
<p>Hợp đồng có hiệu lực kể từ ngày ký và kết thúc khi hai bên hoàn thành nghĩa vụ thanh quyết toán.</p>
`;

export type CreateContractResult =
  | { ok: true; contractId: string; contractNo: string }
  | { ok: false; error: string };

/**
 * Sinh hợp đồng mới từ đề án APPROVED. Idempotent: nếu đề án đã có HĐ, trả về error.
 */
export async function createContractFromProject(
  projectId: string,
): Promise<CreateContractResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'Yêu cầu đăng nhập' };
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'hop-dong', 'create'))) {
    return { ok: false, error: 'Bạn không có quyền tạo hợp đồng' };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      contract: true,
      organization: { select: { id: true, name: true } },
    },
  });

  if (!project || project.deletedAt) {
    return { ok: false, error: 'Không tìm thấy đề án' };
  }
  if (project.contract) {
    return {
      ok: false,
      error: `Đề án đã có hợp đồng ${project.contract.contractNo}`,
    };
  }
  if (!['APPROVED', 'IN_PROGRESS'].includes(project.status)) {
    return {
      ok: false,
      error: 'Chỉ tạo hợp đồng từ đề án đã phê duyệt',
    };
  }

  // Find approved budget from decision
  let totalValue = project.approvedBudget ?? project.proposedBudget ?? 0;
  const decisions = await prisma.approvalDecision.findMany({
    select: { decisionDate: true, approvedItemsJson: true },
  });
  for (const d of decisions) {
    try {
      const items = JSON.parse(d.approvedItemsJson);
      if (Array.isArray(items)) {
        const found = items.find(
          (item: { projectId?: string }) => item?.projectId === projectId,
        );
        if (found && typeof found.approvedBudget === 'number') {
          totalValue = found.approvedBudget;
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  // Determine year for contract number — current year or project year
  const year = new Date().getFullYear();
  const contractNo = await generateContractNumber(year);

  let contract;
  try {
    contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        organizationId: project.organizationId,
        contractNo,
        totalValue,
        status: 'DRAFT',
        termsHtml: DEFAULT_TERMS_HTML,
        effectiveFrom: project.plannedStartAt,
        effectiveTo: project.plannedEndAt,
      },
    });
  } catch (err) {
    // Race: contractNo collision — retry once
    const retryNo = await generateContractNumber(year);
    contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        organizationId: project.organizationId,
        contractNo: retryNo,
        totalValue,
        status: 'DRAFT',
        termsHtml: DEFAULT_TERMS_HTML,
        effectiveFrom: project.plannedStartAt,
        effectiveTo: project.plannedEndAt,
      },
    });
    console.warn('[createContractFromProject] retry succeeded:', err);
  }

  void logAudit(
    {
      ...CONTRACT_AUDIT_TYPES.CONTRACT_CREATE,
      resourceId: contract.id,
      after: {
        contractNo: contract.contractNo,
        projectId: contract.projectId,
        totalValue: contract.totalValue,
        status: contract.status,
      },
      metadata: {
        projectCode: project.code,
        organizationName: project.organization.name,
      },
    },
    session.user.id,
  );

  revalidatePath('/hop-dong');
  revalidatePath(`/de-an/${projectId}`);
  return { ok: true, contractId: contract.id, contractNo: contract.contractNo };
}
