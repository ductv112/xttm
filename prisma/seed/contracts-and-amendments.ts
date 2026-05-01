// Phase 8 (M4) seed — Hợp đồng + Triển khai + Điều chỉnh.
// Demo state cover toàn bộ trạng thái:
//   Contracts:
//     - 1 DRAFT (mới sinh, chưa upload scan)
//     - 1 SIGNED (đã ký + scan)
//     - 1 IN_PROGRESS (project đã chuyển IN_PROGRESS, có implementation data)
//     - 1 đề án APPROVED quá 60 ngày chưa có HĐ (warning case)
//   Amendments:
//     - 1 PENDING loại nhỏ (TIME)
//     - 1 PENDING loại trọng yếu (BUDGET)
//     - 1 APPROVED loại nhỏ với decisionNumber (đã sinh QĐ điều chỉnh)
//
// Idempotent — safe to re-run.

import type { PrismaClient } from '@prisma/client';

import { daysAgo } from '../../lib/date';
import { formatContractNumber } from '../../lib/amendment-rules';
import { logSeedStep } from './helpers';

const MOCK_SCAN_URL = '/mock-files/hop-dong-mau.pdf';

const DEFAULT_TERMS_HTML = `
<h3>Điều 1. Đối tượng và phạm vi hợp đồng</h3>
<p>Bên A (Cục Xúc tiến Thương mại - Bộ Công Thương) ký kết với Bên B để triển khai đề án Xúc tiến Thương mại Quốc gia đã được phê duyệt.</p>
<h3>Điều 2. Tổng kinh phí</h3>
<p>Tổng kinh phí thực hiện đề án theo dự toán đã phê duyệt, bao gồm phần ngân sách nhà nước hỗ trợ và phần đối ứng của đơn vị chủ trì.</p>
<h3>Điều 3. Thời gian thực hiện</h3>
<p>Thời gian thực hiện theo kế hoạch trong đề án.</p>
<h3>Điều 4. Trách nhiệm các bên</h3>
<p>Bên A: cấp kinh phí + giám sát + nghiệm thu. Bên B: triển khai đúng kế hoạch + báo cáo định kỳ.</p>
`;

export async function seedContractsAndAmendments(
  prisma: PrismaClient,
): Promise<void> {
  // Resolve users
  const banql = await prisma.user.findUnique({
    where: { username: 'banql' },
    select: { id: true },
  });
  const donvi1 = await prisma.user.findUnique({
    where: { username: 'donvi1' },
    select: { id: true },
  });
  const donvi2 = await prisma.user.findUnique({
    where: { username: 'donvi2' },
    select: { id: true },
  });

  if (!banql || !donvi1) {
    console.warn('[seedContractsAndAmendments] missing users — skip');
    return;
  }

  // Cleanup: remove all existing contracts + amendments to avoid orphan FK
  // mismatches when promoted projects change between seed runs (idempotency).
  await prisma.projectAmendment.deleteMany({});
  await prisma.contract.deleteMany({});

  // We need at least 1 APPROVED project. If seed-projects.ts hasn't created
  // additional APPROVED projects beyond 2025 historical, escalate by promoting
  // 2-3 EVALUATING projects to APPROVED for demo coverage.
  // Don't touch SUBMITTED — Phase 6 demo requires ≥2 SUBMITTED projects.
  // Keep ≥1 VALID — Phase 6 demo requires ≥1 VALID Project.
  // Strategy: promote up to 3 VALID/EVALUATING projects but always leave 1 VALID.
  const validProjects = await prisma.project.findMany({
    where: { status: 'VALID', programCycle: { year: 2026 } },
    select: { id: true },
  });
  const evaluatingProjects = await prisma.project.findMany({
    where: { status: 'EVALUATING', programCycle: { year: 2026 } },
    select: { id: true },
  });
  // Always leave at least 1 VALID project for Phase 6/7 demo
  const validToPromote = validProjects.slice(0, Math.max(0, validProjects.length - 1));
  const promoteCandidates = [...evaluatingProjects, ...validToPromote].slice(0, 4);

  // Promote up to 4 projects to APPROVED for Phase 8 demo (need enough to cover
  // 4 contract states + 1 amendment-source).
  const PROMOTE_COUNT = 4;
  const toPromote = promoteCandidates.slice(0, PROMOTE_COUNT);
  for (const p of toPromote) {
    await prisma.project.update({
      where: { id: p.id },
      data: { status: 'APPROVED' },
    });
  }

  // Re-fetch approved projects after promotion
  const allApproved = await prisma.project.findMany({
    where: {
      status: { in: ['APPROVED', 'IN_PROGRESS'] },
    },
    include: {
      organization: true,
      contract: true,
    },
  });

  if (allApproved.length === 0) {
    console.warn('[seedContractsAndAmendments] no APPROVED projects — skip');
    return;
  }

  // Now seed approval decisions for promoted projects so /hop-dong list shows
  // decision metadata + 60d overdue warning works.
  const existingDecisions = await prisma.approvalDecision.findMany({
    select: { id: true, approvedItemsJson: true },
  });
  const decidedSet = new Set<string>();
  for (const d of existingDecisions) {
    try {
      const items = JSON.parse(d.approvedItemsJson);
      if (Array.isArray(items)) {
        for (const it of items) {
          if (typeof it?.projectId === 'string') decidedSet.add(it.projectId);
        }
      }
    } catch {
      // ignore
    }
  }

  // For projects without decision, create a synthetic SubmissionDraft+ApprovalDecision
  // so /hop-dong page can compute warnings + AwaitingContractList.
  const cycle2026 = await prisma.programCycle.findFirst({
    where: { year: 2026 },
    select: { id: true },
  });
  if (cycle2026) {
    const orphans = allApproved.filter((p) => !decidedSet.has(p.id));
    if (orphans.length > 0) {
      // Create a single submission draft + decision covering all orphans
      const existingSeed = await prisma.submissionDraft.findFirst({
        where: { draftNumber: 'TEST-08-01-SEED' },
      });
      let submissionId: string;
      if (existingSeed) {
        submissionId = existingSeed.id;
        await prisma.submissionDraft.update({
          where: { id: existingSeed.id },
          data: {
            projectIdsJson: JSON.stringify(orphans.map((p) => p.id)),
            status: 'SUBMITTED_TO_BO',
            submittedToBoAt: daysAgo(75),
          },
        });
      } else {
        const draft = await prisma.submissionDraft.create({
          data: {
            programCycleId: cycle2026.id,
            draftNumber: 'TEST-08-01-SEED',
            draftedAt: daysAgo(80),
            draftedById: banql.id,
            projectIdsJson: JSON.stringify(orphans.map((p) => p.id)),
            contentHtml:
              '<p>Tờ trình tổng hợp đề án đã thẩm định trình Bộ Công Thương phê duyệt (seed Phase 8).</p>',
            status: 'SUBMITTED_TO_BO',
            submittedToBoAt: daysAgo(75),
          },
        });
        submissionId = draft.id;
      }

      const existingDec = await prisma.approvalDecision.findUnique({
        where: { submissionId },
      });
      const approvedItems = orphans.map((p) => ({
        projectId: p.id,
        approvedBudget: p.proposedBudget ?? 0,
        comments: '',
      }));
      const totalBudget = approvedItems.reduce(
        (a, i) => a + (i.approvedBudget ?? 0),
        0,
      );

      // Decision date: vary so different projects have different warning states
      const decisionDate = daysAgo(70);

      if (existingDec) {
        await prisma.approvalDecision.update({
          where: { id: existingDec.id },
          data: {
            approvedItemsJson: JSON.stringify(approvedItems),
            totalApprovedBudget: totalBudget,
            decisionDate,
          },
        });
      } else {
        await prisma.approvalDecision.create({
          data: {
            submissionId,
            decisionNumber: '1234/QĐ-BCT-SEED',
            decisionDate,
            signedByName: 'Nguyễn Hồng Diên',
            signedByTitle: 'BỘ TRƯỞNG\nBỘ CÔNG THƯƠNG',
            approvedItemsJson: JSON.stringify(approvedItems),
            totalApprovedBudget: totalBudget,
            createdById: banql.id,
          },
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Seed CONTRACTS — 3 projects get contracts với states khác nhau, 1 stays
  // approved-without-contract (warning).
  // -----------------------------------------------------------------------
  const yearNow = new Date().getFullYear();

  type ContractSeed = {
    projectId: string;
    sequence: number;
    status: 'DRAFT' | 'SIGNED' | 'IN_PROGRESS';
    signedDaysAgo: number | null;
    hasScan: boolean;
    impl?: {
      milestones: number;
      withProgress: boolean;
    };
    consulate?: {
      countryName: string;
    };
  };

  const contractSeeds: ContractSeed[] = [];
  if (allApproved[0]) {
    contractSeeds.push({
      projectId: allApproved[0].id,
      sequence: 1,
      status: 'DRAFT',
      signedDaysAgo: null,
      hasScan: false,
    });
  }
  if (allApproved[1]) {
    contractSeeds.push({
      projectId: allApproved[1].id,
      sequence: 2,
      status: 'SIGNED',
      signedDaysAgo: 30,
      hasScan: true,
    });
  }
  if (allApproved[2]) {
    contractSeeds.push({
      projectId: allApproved[2].id,
      sequence: 3,
      status: 'IN_PROGRESS',
      signedDaysAgo: 50,
      hasScan: true,
      impl: { milestones: 4, withProgress: true },
      consulate: { countryName: 'Hàn Quốc' },
    });
  }
  // 4th project (if exists) stays APPROVED without contract — demo
  // AwaitingContractList + 60d warning case.

  for (const s of contractSeeds) {
    const project = allApproved.find((p) => p.id === s.projectId)!;
    if (project.contract) {
      // Contract already exists — update state for idempotency
      await prisma.contract.update({
        where: { id: project.contract.id },
        data: {
          status: s.status,
          signedDate:
            s.signedDaysAgo !== null ? daysAgo(s.signedDaysAgo) : null,
          signedById: s.status !== 'DRAFT' ? banql.id : null,
          scanFileUrl: s.hasScan ? MOCK_SCAN_URL : null,
        },
      });
    } else {
      // Generate contractNo, retry on collision
      let contractNo = formatContractNumber(yearNow, s.sequence);
      const existingByNo = await prisma.contract.findUnique({
        where: { contractNo },
      });
      if (existingByNo) {
        // Find next available
        const all = await prisma.contract.findMany({
          where: {
            contractNo: { startsWith: `XTTM/${yearNow}/` },
          },
          select: { contractNo: true },
        });
        let maxSeq = s.sequence;
        for (const c of all) {
          const tail = c.contractNo.slice(`XTTM/${yearNow}/`.length);
          const n = Number.parseInt(tail, 10);
          if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
        }
        contractNo = formatContractNumber(yearNow, maxSeq + 1);
      }
      await prisma.contract.create({
        data: {
          projectId: project.id,
          organizationId: project.organizationId,
          contractNo,
          totalValue: project.proposedBudget ?? 0,
          status: s.status,
          termsHtml: DEFAULT_TERMS_HTML,
          signedDate:
            s.signedDaysAgo !== null ? daysAgo(s.signedDaysAgo) : null,
          signedById: s.status !== 'DRAFT' ? banql.id : null,
          scanFileUrl: s.hasScan ? MOCK_SCAN_URL : null,
          effectiveFrom:
            s.status !== 'DRAFT' ? daysAgo(s.signedDaysAgo ?? 0) : null,
          effectiveTo:
            s.status !== 'DRAFT' ? daysAgo(-180) : null,
        },
      });
    }

    // Update project status to IN_PROGRESS where contract is IN_PROGRESS
    if (s.status === 'IN_PROGRESS') {
      await prisma.project.update({
        where: { id: project.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Implementation data
    if (s.impl) {
      const implCfg = s.impl;
      const milestones = Array.from({ length: implCfg.milestones }, (_, i) => ({
        id: `m-${project.id}-${i}`,
        title: [
          'Khảo sát + tuyển chọn doanh nghiệp tham gia',
          'Thiết kế gian hàng + tài liệu marketing',
          'Vận chuyển hàng mẫu + dựng gian hàng',
          'Tổ chức networking event + báo cáo kết quả',
          'Tổng kết + nghiệm thu',
        ][i] ?? `Mốc công việc ${i + 1}`,
        startDate: new Date(Date.now() - (60 - i * 15) * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        endDate: new Date(Date.now() - (45 - i * 15) * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        owner: ['Hoàng Mai Linh', 'Phòng Marketing', 'Logistics', 'Kinh doanh'][i] ?? 'Phòng Triển khai',
        progress: implCfg.withProgress ? Math.max(0, 100 - i * 25) : 0,
        note:
          i === 0
            ? 'Đã hoàn thành tuyển chọn 25 doanh nghiệp.'
            : i === 1
              ? 'Đang in ấn tài liệu.'
              : '',
        status:
          i === 0
            ? 'DONE'
            : i === 1
              ? 'IN_PROGRESS'
              : 'PENDING',
      }));

      await prisma.project.update({
        where: { id: project.id },
        data: {
          implementationJson: JSON.stringify({
            milestones,
            staff: [
              {
                id: 'st-1',
                name: 'Diệp Thành Kiệt',
                role: 'Trưởng đoàn',
                phone: '0901234567',
                email: 'kiet.diep@lefaso.org.vn',
              },
              {
                id: 'st-2',
                name: 'Hoàng Mai Linh',
                role: 'Điều phối',
                phone: '0907654321',
                email: 'linh.hoang@lefaso.org.vn',
              },
            ],
            schedule: {
              start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10),
              end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10),
              note: 'Triển khai theo kế hoạch đã phê duyệt.',
            },
          }),
        },
      });
    }

    if (s.consulate) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          contactedConsulate: true,
          consulateContactJson: JSON.stringify({
            countryName: s.consulate.countryName,
            contactName: 'Phạm Quang Niệm',
            contactTitle: 'Tham tán Thương mại',
            contactPhone: '+82-2-1234-5678',
            contactEmail: 'thuongvu.han@moit.gov.vn',
            contactDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
            note: 'Đã trao đổi về kế hoạch đoàn xúc tiến + lịch hẹn buyer.',
          }),
        },
      });
    }
  }

  // -----------------------------------------------------------------------
  // Seed AMENDMENTS
  // -----------------------------------------------------------------------
  const projectsForAmendments = allApproved.slice(0, 3);

  if (projectsForAmendments.length > 0) {
    type AmendmentSeed = {
      key: string;
      projectId: string;
      amendmentType:
        | 'TIME'
        | 'LOCATION'
        | 'BUDGET'
        | 'OBJECTIVE'
        | 'PROJECT_NAME';
      isCritical: boolean;
      oldValue: unknown;
      newValue: unknown;
      reason: string;
      status: 'PENDING' | 'APPROVED' | 'RESUBMIT_EVALUATION';
      decisionNumber?: string;
      decisionDaysAgo?: number;
      requestedById: string;
    };

    const amendmentSeeds: AmendmentSeed[] = [];
    if (projectsForAmendments[0]) {
      amendmentSeeds.push({
        key: 'SEED-AMEND-TIME-PENDING',
        projectId: projectsForAmendments[0].id,
        amendmentType: 'TIME',
        isCritical: false,
        oldValue: { start: '2026-09-08', end: '2026-09-13' },
        newValue: { start: '2026-09-22', end: '2026-09-27' },
        reason:
          'SEED-AMEND-TIME-PENDING. Do điều kiện thời tiết bất lợi tại khu vực tổ chức và lịch của đối tác triển lãm thay đổi, chúng tôi đề nghị dời lịch tổ chức sự kiện sang khoảng 22-27/9/2026 (chậm 2 tuần) để đảm bảo chất lượng hoạt động và sự tham gia đầy đủ của các doanh nghiệp.',
        status: 'PENDING',
        requestedById: donvi1.id,
      });
    }
    if (projectsForAmendments[1]) {
      amendmentSeeds.push({
        key: 'SEED-AMEND-LOCATION-APPROVED',
        projectId: projectsForAmendments[1].id,
        amendmentType: 'LOCATION',
        isCritical: false,
        oldValue: 'Düsseldorf, CHLB Đức',
        newValue: 'Frankfurt am Main, CHLB Đức',
        reason:
          'SEED-AMEND-LOCATION-APPROVED. Do sự kiện chính của đối tác đã chuyển sang Frankfurt am Main thay vì Düsseldorf như kế hoạch ban đầu. Việc chuyển địa điểm này không ảnh hưởng tới chi phí và đảm bảo kết quả tốt hơn nhờ quy mô buyer tập trung tại Frankfurt.',
        status: 'APPROVED',
        decisionNumber: 'XTTM-DC/2026/001',
        decisionDaysAgo: 15,
        requestedById: donvi1.id,
      });
    }
    if (projectsForAmendments[2]) {
      amendmentSeeds.push({
        key: 'SEED-AMEND-BUDGET-CRITICAL',
        projectId: projectsForAmendments[2].id,
        amendmentType: 'BUDGET',
        isCritical: true,
        oldValue: { total: 2_500_000_000 },
        newValue: { total: 3_200_000_000 },
        reason:
          'SEED-AMEND-BUDGET-CRITICAL. Do giá nguyên vật liệu xây dựng gian hàng và chi phí vận chuyển hàng mẫu tăng đột biến (~28%) so với dự toán ban đầu, chúng tôi đề nghị điều chỉnh tăng tổng dự toán lên 3,2 tỷ VND. Các hạng mục chi tiết đã được tính lại theo báo giá mới nhất từ nhà cung cấp.',
        status: 'PENDING',
        requestedById: donvi2?.id ?? donvi1.id,
      });
    }

    for (const a of amendmentSeeds) {
      // Find by reason prefix (unique seed marker)
      const existing = await prisma.projectAmendment.findFirst({
        where: { reason: { startsWith: a.key } },
      });

      const decisionDate = a.decisionDaysAgo
        ? daysAgo(a.decisionDaysAgo)
        : null;

      if (existing) {
        await prisma.projectAmendment.update({
          where: { id: existing.id },
          data: {
            amendmentType: a.amendmentType,
            isCritical: a.isCritical,
            oldValueJson: JSON.stringify(a.oldValue),
            newValueJson: JSON.stringify(a.newValue),
            reason: a.reason,
            status: a.status,
            decisionNumber: a.decisionNumber ?? null,
            decisionDate,
            reviewedById: a.status === 'APPROVED' ? banql.id : null,
            reviewedAt: decisionDate,
          },
        });
      } else {
        await prisma.projectAmendment.create({
          data: {
            projectId: a.projectId,
            amendmentType: a.amendmentType,
            isCritical: a.isCritical,
            oldValueJson: JSON.stringify(a.oldValue),
            newValueJson: JSON.stringify(a.newValue),
            reason: a.reason,
            status: a.status,
            decisionNumber: a.decisionNumber ?? null,
            decisionDate,
            reviewedById: a.status === 'APPROVED' ? banql.id : null,
            reviewedAt: decisionDate,
            requestedById: a.requestedById,
          },
        });
      }
    }
  }

  const contractCount = await prisma.contract.count();
  const amendmentCount = await prisma.projectAmendment.count();
  logSeedStep('Contracts', contractCount);
  logSeedStep('Amendments', amendmentCount);
}
