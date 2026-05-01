// Phase 9 (M5) seed — Báo cáo + Nghiệm thu + Tài chính.
// Demo state cover toàn bộ trạng thái:
//   Reports:
//     - 1 SUBMITTED (chờ BQL review)
//     - 1 APPROVED (đã duyệt — đủ điều kiện lập biên bản nghiệm thu)
//   AcceptanceRecords:
//     - 1 PASS (đầy đủ + có scan + đã chốt)
//     - 1 PARTIAL (đạt một phần, scan, chưa thanh lý)
//   FinancialRecords:
//     - 1 ADVANCE DISBURSED
//     - 1 PAYMENT APPROVED
//     - 1 SETTLEMENT DRAFT
//
// Idempotent — safe to re-run.

import type { PrismaClient } from '@prisma/client';

import { daysAgo } from '../../lib/date';
import { logSeedStep } from './helpers';

const SEED_REPORT_TITLE_PREFIX = '[SEED-09]';

const QUANTITATIVE_TEMPLATE_1 = {
  rows: [
    {
      id: 'qr-companies',
      name: 'Số doanh nghiệp tham gia',
      unit: 'doanh nghiệp',
      planned: 25,
      actual: 28,
      note: 'Vượt kế hoạch 12%',
    },
    {
      id: 'qr-contracts',
      name: 'Số hợp đồng/MOU ký kết',
      unit: 'hợp đồng',
      planned: 10,
      actual: 12,
      note: '5 hợp đồng chính thức + 7 MOU',
    },
    {
      id: 'qr-revenue',
      name: 'Doanh thu/giá trị giao dịch dự kiến',
      unit: 'triệu USD',
      planned: 5,
      actual: 6.2,
      note: 'Bao gồm giao dịch sau sự kiện',
    },
    {
      id: 'qr-buyers',
      name: 'Số đối tác/khách hàng tiếp xúc',
      unit: 'lượt',
      planned: 200,
      actual: 245,
      note: 'Trên 80% có quan tâm thực sự',
    },
  ],
};

const QUANTITATIVE_TEMPLATE_2 = {
  rows: [
    {
      id: 'qr-companies',
      name: 'Số doanh nghiệp tham gia',
      unit: 'doanh nghiệp',
      planned: 30,
      actual: 22,
      note: '8 DN không thể tham dự do lịch trùng',
    },
    {
      id: 'qr-contracts',
      name: 'Số hợp đồng/MOU ký kết',
      unit: 'hợp đồng',
      planned: 15,
      actual: 8,
      note: 'Đang đàm phán thêm 5 HĐ',
    },
    {
      id: 'qr-revenue',
      name: 'Doanh thu/giá trị giao dịch dự kiến',
      unit: 'triệu USD',
      planned: 8,
      actual: 4.5,
      note: 'Một số hợp đồng chưa chốt được giá',
    },
    {
      id: 'qr-buyers',
      name: 'Số đối tác/khách hàng tiếp xúc',
      unit: 'lượt',
      planned: 250,
      actual: 230,
      note: '',
    },
  ],
};

const QUALITATIVE_HTML_1 = `
<h3>1. Tổng quan kết quả</h3>
<p>Đề án đã được triển khai thành công với kết quả vượt kế hoạch ở cả 4 chỉ tiêu định lượng. Sự kiện thu hút được 28 doanh nghiệp Việt Nam tham gia (kế hoạch 25), và đã ký được 12 hợp đồng/MOU với các đối tác quốc tế.</p>
<h3>2. Bài học kinh nghiệm</h3>
<ul>
<li>Việc liên hệ Thương vụ trước 30 ngày giúp chuẩn bị buyer matching tốt hơn.</li>
<li>Truyền thông sự kiện qua các hiệp hội ngành tăng độ phủ doanh nghiệp tham gia.</li>
<li>Cần đầu tư hơn vào dịch thuật và biên dịch tài liệu marketing.</li>
</ul>
<h3>3. Đề xuất kỳ tiếp theo</h3>
<p>Đề nghị tiếp tục triển khai đề án năm sau với quy mô mở rộng 1.5 lần, kết hợp các hoạt động networking event và one-on-one matching. Đồng thời, cần phân bổ thêm ngân sách cho phần truyền thông quốc tế.</p>
`;

const QUALITATIVE_HTML_2 = `
<h3>1. Tổng quan kết quả</h3>
<p>Đề án đã hoàn thành phần lớn các hạng mục kế hoạch. Tuy nhiên, do điều kiện thị trường có biến động và một số DN không thể tham gia đầy đủ, kết quả định lượng đạt khoảng 70-80% kế hoạch.</p>
<h3>2. Khó khăn gặp phải</h3>
<ul>
<li>Lịch sự kiện trùng với một hội chợ lớn khác trong khu vực, ảnh hưởng đến số DN tham gia.</li>
<li>Một số đối tác mục tiêu yêu cầu thêm thời gian để đánh giá sản phẩm trước khi ký hợp đồng.</li>
<li>Chi phí logistics tăng so với dự toán do yếu tố nhiên liệu.</li>
</ul>
<h3>3. Hướng khắc phục</h3>
<p>Đơn vị đang theo dõi 5 hợp đồng đang đàm phán, dự kiến chốt được trong 30 ngày tới. Đồng thời, sẽ phối hợp với Thương vụ tổ chức follow-up meeting để khai thác các cơ hội còn dang dở.</p>
`;

export async function seedReportsAcceptanceFinance(
  prisma: PrismaClient,
): Promise<void> {
  // Resolve users
  const banql = await prisma.user.findUnique({
    where: { username: 'banql' },
    select: { id: true },
  });
  const taichinh = await prisma.user.findUnique({
    where: { username: 'taichinh' },
    select: { id: true },
  });
  if (!banql || !taichinh) {
    console.warn(
      '[seedReportsAcceptanceFinance] missing users (banql/taichinh) — skip',
    );
    return;
  }

  // Cleanup previous seed records (idempotency)
  await prisma.financialRecord.deleteMany({
    where: { recordNumber: { startsWith: 'SEED-' } },
  });
  await prisma.acceptanceRecord.deleteMany({
    where: { recordNumber: { contains: 'SEED-09' } },
  });
  await prisma.report.deleteMany({
    where: { title: { startsWith: SEED_REPORT_TITLE_PREFIX } },
  });

  // Find IN_PROGRESS or COMPLETED projects with contracts
  const projects = await prisma.project.findMany({
    where: {
      status: { in: ['IN_PROGRESS', 'COMPLETED', 'APPROVED'] },
      contract: { isNot: null },
    },
    include: {
      contract: { select: { id: true, contractNo: true, totalValue: true } },
    },
    orderBy: { code: 'asc' },
  });

  if (projects.length === 0) {
    console.warn(
      '[seedReportsAcceptanceFinance] no eligible projects with contracts — skip',
    );
    return;
  }

  // -----------------------------------------------------------------------
  // Seed 2 Reports
  // -----------------------------------------------------------------------
  const project1 = projects[0];
  const project2 = projects[1] ?? projects[0];

  let report1Id: string | null = null;

  if (project1) {
    const r1 = await prisma.report.create({
      data: {
        projectId: project1.id,
        title: `${SEED_REPORT_TITLE_PREFIX} Báo cáo kết quả ${project1.code}`,
        reportType: 'FINAL',
        quantitativeJson: JSON.stringify(QUANTITATIVE_TEMPLATE_1),
        qualitativeHtml: QUALITATIVE_HTML_1,
        attendingCompaniesCount: 28,
        status: 'APPROVED',
        submittedAt: daysAgo(20),
        reviewedById: banql.id,
        reviewedAt: daysAgo(15),
        reviewComments:
          'Báo cáo đầy đủ, kết quả vượt kế hoạch. Tiến hành lập biên bản nghiệm thu.',
      },
    });
    report1Id = r1.id;
  }

  if (project2 && project2.id !== project1?.id) {
    await prisma.report.create({
      data: {
        projectId: project2.id,
        title: `${SEED_REPORT_TITLE_PREFIX} Báo cáo kết quả ${project2.code}`,
        reportType: 'FINAL',
        quantitativeJson: JSON.stringify(QUANTITATIVE_TEMPLATE_2),
        qualitativeHtml: QUALITATIVE_HTML_2,
        attendingCompaniesCount: 22,
        status: 'SUBMITTED',
        submittedAt: daysAgo(5),
      },
    });
  }

  // -----------------------------------------------------------------------
  // Seed 2 AcceptanceRecords (1 PASS đầy đủ, 1 PARTIAL)
  // -----------------------------------------------------------------------
  if (report1Id && project1) {
    await prisma.acceptanceRecord.create({
      data: {
        projectId: project1.id,
        reportId: report1Id,
        recordNumber: `001/BB-NT-XTTM/2026-SEED-09`,
        recordDate: daysAgo(10),
        result: 'PASS',
        comments:
          'Đề án triển khai thành công, đạt và vượt các chỉ tiêu kế hoạch. Hai bên thống nhất đề án hoàn thành tốt, đề nghị tiến hành thanh lý hợp đồng.',
        scannedFileUrl: '/mock-files/hop-dong-mau.pdf',
        liquidationDate: daysAgo(5),
        liquidationFileUrl: '/mock-files/hop-dong-mau.pdf',
        createdById: banql.id,
      },
    });

    // Promote project1 to COMPLETED so demo flow consistent
    await prisma.project.update({
      where: { id: project1.id },
      data: { status: 'COMPLETED' },
    });
    if (project1.contract) {
      await prisma.contract.update({
        where: { id: project1.contract.id },
        data: { status: 'LIQUIDATED' },
      });
    }
  }

  // PARTIAL acceptance — uses third project if available, else create from
  // a different APPROVED project's report
  const project3 = projects[2];
  if (project3 && project3.id !== project1?.id && project3.id !== project2?.id) {
    // Create supporting report first
    const r3 = await prisma.report.create({
      data: {
        projectId: project3.id,
        title: `${SEED_REPORT_TITLE_PREFIX} Báo cáo kết quả ${project3.code}`,
        reportType: 'FINAL',
        quantitativeJson: JSON.stringify(QUANTITATIVE_TEMPLATE_2),
        qualitativeHtml: QUALITATIVE_HTML_2,
        attendingCompaniesCount: 22,
        status: 'APPROVED',
        submittedAt: daysAgo(25),
        reviewedById: banql.id,
        reviewedAt: daysAgo(20),
        reviewComments:
          'Báo cáo đạt yêu cầu cơ bản. Một số chỉ tiêu chưa đạt — đề nghị giám sát phần đàm phán hợp đồng tiếp theo.',
      },
    });

    await prisma.acceptanceRecord.create({
      data: {
        projectId: project3.id,
        reportId: r3.id,
        recordNumber: `002/BB-NT-XTTM/2026-SEED-09`,
        recordDate: daysAgo(15),
        result: 'PARTIAL',
        comments:
          'Đề án hoàn thành cơ bản các hạng mục, tuy nhiên một số chỉ tiêu định lượng chưa đạt do yếu tố thị trường. Đơn vị tiếp tục theo dõi để khai thác cơ hội còn dang dở.',
        scannedFileUrl: '/mock-files/hop-dong-mau.pdf',
        createdById: banql.id,
      },
    });
  }

  // -----------------------------------------------------------------------
  // Seed 3 FinancialRecords (1 ADVANCE DISBURSED, 1 PAYMENT APPROVED, 1 SETTLEMENT DRAFT)
  // -----------------------------------------------------------------------
  if (project1 && project1.contract) {
    const contractValue = project1.contract.totalValue ?? 1_000_000_000;
    const advanceAmount = Math.round(contractValue * 0.5);
    const paymentAmount = Math.round(contractValue * 0.4);
    const settlementAmount = Math.round(contractValue * 0.1);

    await prisma.financialRecord.create({
      data: {
        projectId: project1.id,
        contractId: project1.contract.id,
        recordType: 'ADVANCE',
        recordNumber: `SEED-TU-XTTM-2026-001`,
        amount: advanceAmount,
        status: 'DISBURSED',
        submittedAt: daysAgo(70),
        approvedById: banql.id,
        approvedAt: daysAgo(65),
        disbursedAt: daysAgo(60),
        transactionDate: daysAgo(60),
        notes:
          'Tạm ứng 50% giá trị hợp đồng sau khi ký kết. Đã chuyển khoản qua KBNN.',
        createdById: taichinh.id,
      },
    });

    await prisma.financialRecord.create({
      data: {
        projectId: project1.id,
        contractId: project1.contract.id,
        recordType: 'PAYMENT',
        recordNumber: `SEED-PT-XTTM-2026-001`,
        amount: paymentAmount,
        status: 'APPROVED',
        submittedAt: daysAgo(8),
        approvedById: banql.id,
        approvedAt: daysAgo(3),
        notes:
          'Thanh toán 40% giá trị hợp đồng sau khi nghiệm thu. Đang chờ giải ngân.',
        createdById: taichinh.id,
      },
    });

    await prisma.financialRecord.create({
      data: {
        projectId: project1.id,
        contractId: project1.contract.id,
        recordType: 'SETTLEMENT',
        recordNumber: `SEED-QT-XTTM-2026-001`,
        amount: settlementAmount,
        status: 'DRAFT',
        notes:
          'Quyết toán phần kinh phí còn lại 10% sau khi thanh lý hợp đồng. Đang thu thập chứng từ.',
        createdById: taichinh.id,
      },
    });
  }

  const reportCount = await prisma.report.count();
  const acceptanceCount = await prisma.acceptanceRecord.count();
  const financialCount = await prisma.financialRecord.count();
  logSeedStep('Reports', reportCount);
  logSeedStep('AcceptanceRecords', acceptanceCount);
  logSeedStep('FinancialRecords', financialCount);
}
