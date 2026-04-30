// Phase 5 (M2.3) seed — 6 mock projects covering diverse statuses + đề án 2 năm pair.
//
// Status mix per plan acceptance criteria:
//   1 APPROVED  — LEFASO 2025 (historical, in cycle 2025=COMPLETED)
//   2 SUBMITTED — LEFASO 2026 mới + LEFASO 2026 đề án 2 năm part 1
//   1 DRAFT     — VITAS 2026 đang soạn
//   1 IN_REVIEW — VITAS 2026 đoàn ra
//   1 TENTATIVE — LEFASO 2027 đề án 2 năm part 2 (parentProjectId → part 1)
//
// Idempotent: upsert by code (Project.code @unique).
// Realistic Vietnamese names + budget VND figures (500M - 2B).

import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { daysAgo } from '../../lib/date';
import { removeDiacritics } from '../../lib/vi-search';
import { logSeedStep } from './helpers';

type IndustryCode =
  | 'FOOTWEAR'
  | 'TEXTILE'
  | 'GARMENT'
  | 'LEATHER'
  | 'SEAFOOD'
  | 'WOOD'
  | 'COFFEE'
  | 'AGRICULTURE';

type MarketCode = 'EU' | 'US' | 'JAPAN' | 'KOREA' | 'CHINA' | 'ASEAN' | 'MIDDLE_EAST';

type CountryCode = 'DEU' | 'FRA' | 'USA' | 'JPN' | 'KOR' | 'CHN' | 'ITA' | 'NLD' | 'GBR' | 'ARE' | 'VNM';

type PromotionCode =
  | 'TRADE_FAIR'
  | 'BUSINESS_MATCHING'
  | 'BRAND_PROMOTION'
  | 'EXPORT_PROMOTION'
  | 'TRADE_TRAINING';

type ProjectKindCode =
  | 'EXPORT_EXHIBITION'
  | 'INTL_CONFERENCE'
  | 'DOMESTIC_FAIR'
  | 'TRADE_DELEGATION_OUT'
  | 'TRADE_INFO_EXPORT'
  | 'TRAINING';

type Status =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_REVIEW'
  | 'SUPPLEMENT_REQUIRED'
  | 'VALID'
  | 'APPROVED'
  | 'TENTATIVE';

type BudgetRow = {
  id: string;
  item: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  source: 'STATE' | 'SELF';
  note?: string;
};

type PlanRow = {
  id: string;
  task: string;
  deliverable: string;
  dueDate: string | null;
  owner: string;
};

type ChecklistEntrySeed = {
  itemId: string;
  status: '✓' | '✗' | 'N/A';
  note?: string;
};

type ScoreEntrySeed = {
  criterionCode: string;
  score: number;
  comment?: string;
};

type ProjectSeed = {
  code: string;
  orgCode: string; // LEFASO | VITAS | ...
  cycleYear: number; // 2025 | 2026 | 2027
  year: number;
  name: string;
  kind: ProjectKindCode;
  status: Status;
  parentCode?: string; // for đề án 2 năm linkage
  industrySectorCodes: IndustryCode[];
  marketCodes: MarketCode[];
  countryCodes: CountryCode[];
  promotionCodes: PromotionCode[];
  isTwoYear: boolean;
  nextYear?: number | null;
  timeRange?: { start: string | null; end: string | null; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null } | null;
  objectiveHtml: string;
  contentHtml: string;
  planRows: Omit<PlanRow, 'id'>[];
  budgetRows: Omit<BudgetRow, 'id' | 'amount'>[];
  pmContactEmail?: string; // resolve to OrgProfile.contacts[].id
  submittedDaysAgo?: number;
  assignedReviewer?: 'chuyenvien' | null;
  approvedDaysAgo?: number;
  // Phase 6 (M2.4) intake fields
  receivedDaysAgo?: number;
  assignedDaysAgo?: number;
  checklist?: ChecklistEntrySeed[];
  passedFormalCheck?: boolean;
  supplementRequestReason?: string;
  preliminaryScore?: {
    status: 'DRAFT' | 'SUBMITTED';
    scores: ScoreEntrySeed[];
    overallComment?: string;
    submittedDaysAgo?: number;
  };
};

// Helper: compute amount for budget row (qty * unitPrice)
function computeBudgetRow(row: Omit<BudgetRow, 'id' | 'amount'>): BudgetRow {
  return {
    id: randomUUID(),
    ...row,
    amount: row.quantity * row.unitPrice,
  };
}

// =============================================================================
// 6 SEED RECORDS
// =============================================================================

const SEEDS: ProjectSeed[] = [
  // ---------------------------------------------------------------------------
  // 1. APPROVED — LEFASO 2025 (lịch sử) — đã nghiệm thu xong, dùng để demo "Sao chép từ đề án cũ"
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2025-001',
    orgCode: 'LEFASO',
    cycleYear: 2025,
    year: 2025,
    name: 'Tham dự Triển lãm GDS Düsseldorf 2025 — Quảng bá ngành Da giày Việt tại EU',
    kind: 'EXPORT_EXHIBITION',
    status: 'APPROVED',
    industrySectorCodes: ['FOOTWEAR', 'LEATHER'],
    marketCodes: ['EU'],
    countryCodes: ['DEU', 'FRA', 'ITA'],
    promotionCodes: ['TRADE_FAIR', 'BRAND_PROMOTION'],
    isTwoYear: false,
    timeRange: { start: '2025-09-08', end: '2025-09-13', quarter: 'Q3' },
    objectiveHtml:
      '<p>Quảng bá hình ảnh ngành Da giày - Túi xách Việt Nam tại thị trường EU thông qua triển lãm chuyên ngành quy mô lớn nhất khu vực. Thúc đẩy ký kết hợp đồng xuất khẩu, tìm kiếm đối tác mới, và cập nhật xu hướng thị trường năm 2025-2026.</p><p><strong>Mục tiêu cụ thể:</strong></p><ul><li>30 doanh nghiệp tham gia trưng bày</li><li>Ký 50 biên bản ghi nhớ hợp tác</li><li>Tổng giá trị hợp đồng dự kiến 25 triệu USD</li></ul>',
    contentHtml:
      '<p>Tổ chức gian hàng Quốc gia Việt Nam (200m²) tại GDS Düsseldorf 2025. Bao gồm: thiết kế gian hàng, vận chuyển sản phẩm mẫu, biên dịch tài liệu marketing 4 ngôn ngữ (Anh/Đức/Pháp/Ý), tổ chức Vietnam Footwear Forum bên lề triển lãm, mời 200 buyers tiềm năng dự lễ khai trương.</p>',
    planRows: [
      { task: 'Khảo sát thị trường + tuyển chọn 30 DN', deliverable: 'Danh sách DN ký xác nhận', dueDate: '2025-04-30', owner: 'Hoàng Mai Linh' },
      { task: 'Thiết kế gian hàng + ấn phẩm', deliverable: 'Bản vẽ kỹ thuật + catalog tiếng Anh', dueDate: '2025-06-15', owner: 'Phòng Marketing' },
      { task: 'Vận chuyển mẫu + dựng gian hàng', deliverable: 'Gian hàng sẵn sàng tại Düsseldorf', dueDate: '2025-09-05', owner: 'Bộ phận Logistics' },
      { task: 'Tổ chức Vietnam Footwear Forum', deliverable: 'Báo cáo 200 khách + 50 MOU', dueDate: '2025-09-10', owner: 'Diệp Thành Kiệt' },
      { task: 'Tổng kết + báo cáo nghiệm thu', deliverable: 'Báo cáo PDF + minh chứng', dueDate: '2025-10-15', owner: 'Hoàng Mai Linh' },
    ],
    budgetRows: [
      { item: 'Thuê mặt bằng triển lãm 200m²', unit: 'm²', quantity: 200, unitPrice: 1_500_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 380_000_000, source: 'STATE' },
      { item: 'Vận chuyển hàng mẫu (2 chiều)', unit: 'container', quantity: 2, unitPrice: 95_000_000, source: 'STATE' },
      { item: 'Vé máy bay đoàn cán bộ (15 người)', unit: 'vé', quantity: 15, unitPrice: 35_000_000, source: 'STATE' },
      { item: 'Lưu trú + công tác phí (15 người x 7 đêm)', unit: 'đêm-người', quantity: 105, unitPrice: 4_500_000, source: 'STATE' },
      { item: 'In ấn catalog + ấn phẩm 4 ngôn ngữ', unit: 'gói', quantity: 1, unitPrice: 120_000_000, source: 'SELF' },
      { item: 'Phiên dịch + tiếp khách Forum', unit: 'gói', quantity: 1, unitPrice: 85_000_000, source: 'SELF' },
      { item: 'Hội phí + chi khác đối ứng đơn vị', unit: 'gói', quantity: 1, unitPrice: 60_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'kiet.diep@lefaso.org.vn',
    submittedDaysAgo: 365,
    approvedDaysAgo: 280,
  },

  // ---------------------------------------------------------------------------
  // 2. SUBMITTED — LEFASO 2026 đề án mới (recent submission, đang chờ tiếp nhận)
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-001',
    orgCode: 'LEFASO',
    cycleYear: 2026,
    year: 2026,
    name: 'Tham dự MICAM Milano 2026 — Triển lãm giày dép thời trang lớn nhất châu Âu',
    kind: 'EXPORT_EXHIBITION',
    status: 'SUBMITTED',
    industrySectorCodes: ['FOOTWEAR'],
    marketCodes: ['EU'],
    countryCodes: ['ITA', 'FRA', 'DEU'],
    promotionCodes: ['TRADE_FAIR', 'BUSINESS_MATCHING'],
    isTwoYear: false,
    timeRange: { start: '2026-09-13', end: '2026-09-16', quarter: 'Q3' },
    objectiveHtml:
      '<p>Đưa 25 doanh nghiệp da giày Việt tham dự MICAM Milano 2026 nhằm mở rộng thị phần tại Italy + EU, gia tăng tỷ trọng phân khúc thời trang trung-cao cấp.</p><ul><li>25 doanh nghiệp tham gia gian hàng quốc gia</li><li>40 hợp đồng tiền-MOU dự kiến</li><li>Giá trị xuất khẩu tăng thêm 15 triệu USD năm 2026-2027</li></ul>',
    contentHtml:
      '<p>Gian hàng quốc gia 180m² tại MICAM, thiết kế theo concept "Vietnam Footwear Heritage 2026" kết hợp truyền thống và công nghệ hiện đại. Bên cạnh đó tổ chức networking event tại khách sạn Principe di Savoia với 150 buyer Italy + EU.</p>',
    planRows: [
      { task: 'Khảo sát + tuyển chọn 25 doanh nghiệp', deliverable: 'Danh sách DN', dueDate: '2026-05-15', owner: 'Hoàng Mai Linh' },
      { task: 'Đăng ký gian hàng MICAM + thiết kế', deliverable: 'Hợp đồng thuê + bản vẽ', dueDate: '2026-06-30', owner: 'Phòng Tổ chức Hội chợ' },
      { task: 'Vận chuyển mẫu sản phẩm', deliverable: '2 container giao Milano', dueDate: '2026-09-05', owner: 'Bộ phận Logistics' },
      { task: 'Networking event + Vietnam Pavilion Day', deliverable: 'Báo cáo 150 buyer + 40 MOU', dueDate: '2026-09-15', owner: 'Diệp Thành Kiệt' },
    ],
    budgetRows: [
      { item: 'Thuê mặt bằng MICAM 180m²', unit: 'm²', quantity: 180, unitPrice: 1_800_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 450_000_000, source: 'STATE' },
      { item: 'Vận chuyển 2 container 2 chiều', unit: 'container', quantity: 2, unitPrice: 110_000_000, source: 'STATE' },
      { item: 'Vé máy bay 12 cán bộ', unit: 'vé', quantity: 12, unitPrice: 38_000_000, source: 'STATE' },
      { item: 'Networking event 150 khách', unit: 'gói', quantity: 1, unitPrice: 220_000_000, source: 'STATE' },
      { item: 'In ấn + truyền thông số', unit: 'gói', quantity: 1, unitPrice: 95_000_000, source: 'SELF' },
      { item: 'Phiên dịch tiếng Ý + Pháp', unit: 'gói', quantity: 1, unitPrice: 75_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'linh.hoang@lefaso.org.vn',
    submittedDaysAgo: 7,
    assignedReviewer: null,
  },

  // ---------------------------------------------------------------------------
  // 3. DRAFT — VITAS 2026 đang soạn
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-002',
    orgCode: 'VITAS',
    cycleYear: 2026,
    year: 2026,
    name: 'Hội nghị Quốc tế Dệt may Việt Nam 2026 — Chuyển đổi xanh và bền vững',
    kind: 'INTL_CONFERENCE',
    status: 'DRAFT',
    industrySectorCodes: ['TEXTILE', 'GARMENT'],
    marketCodes: ['EU', 'US', 'JAPAN'],
    countryCodes: ['DEU', 'NLD', 'JPN', 'USA'],
    promotionCodes: ['TRADE_TRAINING', 'BRAND_PROMOTION'],
    isTwoYear: false,
    timeRange: { start: '2026-11-18', end: '2026-11-19', quarter: 'Q4' },
    objectiveHtml:
      '<p>Tổ chức hội nghị quốc tế chủ đề "Chuyển đổi xanh và bền vững ngành Dệt may Việt Nam 2030" tại Hà Nội, quy tụ 500 đại biểu từ 25 quốc gia.</p>',
    contentHtml:
      '<p>Chương trình 2 ngày bao gồm 4 phiên toàn thể + 8 phiên chuyên đề, tập trung CBAM, OEKO-TEX, BSCI, mass balance. Đối tác chiến lược: ITC, GIZ, IFC.</p>',
    planRows: [
      { task: 'Lập đề án chi tiết + ngân sách', deliverable: 'Bản đề án phê duyệt nội bộ', dueDate: '2026-05-10', owner: 'Vũ Đức Minh' },
      { task: 'Mời diễn giả + đối tác', deliverable: 'Danh sách 30 diễn giả xác nhận', dueDate: '2026-08-30', owner: 'Phòng Quan hệ Quốc tế' },
    ],
    budgetRows: [
      { item: 'Thuê hội trường Khách sạn Sheraton 2 ngày', unit: 'ngày', quantity: 2, unitPrice: 250_000_000, source: 'STATE' },
      { item: 'Vé máy bay diễn giả quốc tế (10 người)', unit: 'vé', quantity: 10, unitPrice: 45_000_000, source: 'STATE' },
      { item: 'Lưu trú diễn giả 3 đêm', unit: 'đêm-người', quantity: 30, unitPrice: 5_500_000, source: 'STATE' },
      { item: 'Phiên dịch song song 4 ngôn ngữ', unit: 'ngày', quantity: 2, unitPrice: 75_000_000, source: 'STATE' },
      { item: 'Truyền thông + livestream', unit: 'gói', quantity: 1, unitPrice: 150_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'minh.vu@vitas.org.vn',
  },

  // ---------------------------------------------------------------------------
  // 4. IN_REVIEW — VITAS 2026 đề án đoàn ra (đang được kiểm tra)
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-003',
    orgCode: 'VITAS',
    cycleYear: 2026,
    year: 2026,
    name: 'Đoàn doanh nghiệp Dệt may Việt Nam khảo sát thị trường Hàn Quốc & Nhật Bản 2026',
    kind: 'TRADE_DELEGATION_OUT',
    status: 'IN_REVIEW',
    industrySectorCodes: ['TEXTILE', 'GARMENT'],
    marketCodes: ['JAPAN', 'KOREA'],
    countryCodes: ['JPN', 'KOR'],
    promotionCodes: ['BUSINESS_MATCHING', 'EXPORT_PROMOTION'],
    isTwoYear: false,
    timeRange: { start: '2026-06-15', end: '2026-06-25', quarter: 'Q2' },
    objectiveHtml:
      '<p>Tổ chức đoàn 18 doanh nghiệp Dệt may đi khảo sát thị trường Hàn Quốc + Nhật Bản trong 11 ngày (Seoul → Busan → Tokyo → Osaka). Mục tiêu kết nối 80 buyer Hàn-Nhật, ký 25 hợp đồng dài hạn.</p>',
    contentHtml:
      '<p>Hành trình bao gồm: hội thảo "Vietnam Textile Sourcing 2026" tại Seoul Trade Center, gặp gỡ Korea Textile Industry Federation, business matching tại JETRO Tokyo, thăm nhà máy Toyota Boshoku Osaka.</p>',
    planRows: [
      { task: 'Tuyển chọn 18 doanh nghiệp', deliverable: 'Danh sách DN', dueDate: '2026-04-15', owner: 'Vũ Đức Giang' },
      { task: 'Lên lịch trình + đặt vé máy bay', deliverable: 'Lịch trình chi tiết', dueDate: '2026-05-10', owner: 'Phòng Tổ chức Đoàn' },
      { task: 'Liên hệ Thương vụ VN tại Seoul + Tokyo', deliverable: 'Lịch hẹn xác nhận', dueDate: '2026-05-25', owner: 'Vũ Đức Minh' },
      { task: 'Thực hiện đoàn 11 ngày', deliverable: 'Báo cáo + 25 hợp đồng', dueDate: '2026-06-25', owner: 'Vũ Đức Giang' },
    ],
    budgetRows: [
      { item: 'Vé máy bay đoàn 22 người', unit: 'vé', quantity: 22, unitPrice: 28_000_000, source: 'STATE' },
      { item: 'Lưu trú 22 người x 11 đêm', unit: 'đêm-người', quantity: 242, unitPrice: 4_200_000, source: 'STATE' },
      { item: 'Vận chuyển nội địa Seoul-Busan-Tokyo-Osaka', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Hội thảo + business matching', unit: 'sự kiện', quantity: 4, unitPrice: 95_000_000, source: 'STATE' },
      { item: 'Phiên dịch tiếng Hàn + tiếng Nhật', unit: 'gói', quantity: 1, unitPrice: 150_000_000, source: 'STATE' },
      { item: 'Tài liệu + sản phẩm mẫu', unit: 'gói', quantity: 1, unitPrice: 80_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'giang.vu@vitas.org.vn',
    submittedDaysAgo: 18,
    receivedDaysAgo: 14,
    assignedDaysAgo: 12,
    assignedReviewer: 'chuyenvien',
    // Partial checklist — 8/9 required items, demo state IN_REVIEW
    checklist: [
      { itemId: 'CHK-01-LEGAL-SIGNATURE', status: '✓' },
      { itemId: 'CHK-02-LEGAL-CAPACITY', status: '✓' },
      {
        itemId: 'CHK-03-OBJECTIVE-CLARITY',
        status: '✓',
        note: 'Mục tiêu rõ ràng, đo lường được qua KPI.',
      },
      { itemId: 'CHK-04-PLAN-DETAIL', status: '✓' },
      {
        itemId: 'CHK-05-BUDGET-MATCH-PLAN',
        status: '✗',
        note: 'Hạng mục "Phiên dịch" trong dự toán chưa khớp với hoạt động trong kế hoạch — cần đối chiếu lại.',
      },
      { itemId: 'CHK-06-BUDGET-WITHIN-LIMIT', status: '✓' },
      { itemId: 'CHK-07-PM-INFO', status: '✓' },
      { itemId: 'CHK-08-MARKET-COUNTRY', status: '✓' },
      {
        itemId: 'CHK-09-CONSULATE-CONTACT',
        status: '✓',
        note: 'Đã có kế hoạch liên hệ Thương vụ VN tại Seoul và Tokyo.',
      },
      { itemId: 'CHK-12-COMPLIANCE', status: '✓' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. SUBMITTED — LEFASO 2026 Đề án 2 năm Part 1 (parent)
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-004',
    orgCode: 'LEFASO',
    cycleYear: 2026,
    year: 2026,
    name: 'Chương trình Xúc tiến Da giày Việt Nam tại Trung Đông 2026-2027 (giai đoạn 1)',
    kind: 'TRADE_INFO_EXPORT',
    status: 'SUBMITTED',
    industrySectorCodes: ['FOOTWEAR', 'LEATHER'],
    marketCodes: ['MIDDLE_EAST'],
    countryCodes: ['ARE'],
    promotionCodes: ['BRAND_PROMOTION', 'EXPORT_PROMOTION'],
    isTwoYear: true,
    nextYear: 2027,
    timeRange: { start: '2026-08-01', end: '2026-12-31', quarter: 'Q4' },
    objectiveHtml:
      '<p>Triển khai chương trình quảng bá Da giày Việt Nam tại UAE và các thị trường Trung Đông trong 2 năm 2026-2027. Giai đoạn 1 (2026): nghiên cứu thị trường, ra mắt thương hiệu, ký kết với 5 đại lý lớn.</p>',
    contentHtml:
      '<p>Triển khai 3 hoạt động chính trong năm 2026: (1) nghiên cứu thị trường UAE + Saudi Arabia, (2) chiến dịch truyền thông số trên LinkedIn + Instagram tiếng Anh + tiếng Ả Rập, (3) đoàn xúc tiến tham dự Dubai International Footwear Expo tháng 11/2026.</p>',
    planRows: [
      { task: 'Thuê đơn vị nghiên cứu thị trường', deliverable: 'Báo cáo thị trường UAE+SAU', dueDate: '2026-08-15', owner: 'Hoàng Mai Linh' },
      { task: 'Chiến dịch truyền thông số 4 tháng', deliverable: 'Báo cáo KPI tiếp cận 5 triệu impressions', dueDate: '2026-11-30', owner: 'Phòng Truyền thông' },
      { task: 'Tham dự Dubai Footwear Expo', deliverable: '5 hợp đồng đại lý', dueDate: '2026-11-20', owner: 'Diệp Thành Kiệt' },
    ],
    budgetRows: [
      { item: 'Thuê đơn vị nghiên cứu thị trường', unit: 'gói', quantity: 1, unitPrice: 350_000_000, source: 'STATE' },
      { item: 'Chiến dịch truyền thông số 4 tháng', unit: 'tháng', quantity: 4, unitPrice: 85_000_000, source: 'STATE' },
      { item: 'Tham dự Dubai Footwear Expo (gian hàng + đoàn 8 người)', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'STATE' },
      { item: 'Sản xuất ấn phẩm tiếng Ả Rập', unit: 'gói', quantity: 1, unitPrice: 120_000_000, source: 'SELF' },
      { item: 'Tổ chức 2 networking event Dubai', unit: 'sự kiện', quantity: 2, unitPrice: 140_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'kiet.diep@lefaso.org.vn',
    submittedDaysAgo: 4,
  },

  // ---------------------------------------------------------------------------
  // 6. TENTATIVE — LEFASO 2027 Đề án 2 năm Part 2 (child) — parentProjectId set
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-004-P2',
    orgCode: 'LEFASO',
    cycleYear: 2026, // FK to active cycle (parent's cycle); status TENTATIVE separates from active flow
    year: 2027,
    name: 'Chương trình Xúc tiến Da giày Việt Nam tại Trung Đông 2026-2027 (giai đoạn 2 - Năm 2027)',
    kind: 'TRADE_INFO_EXPORT',
    status: 'TENTATIVE',
    parentCode: 'XTTM-2026-004',
    industrySectorCodes: ['FOOTWEAR', 'LEATHER'],
    marketCodes: ['MIDDLE_EAST'],
    countryCodes: ['ARE'],
    promotionCodes: ['BRAND_PROMOTION', 'EXPORT_PROMOTION'],
    isTwoYear: true,
    nextYear: null,
    timeRange: null, // sẽ khai báo khi chu kỳ 2027 mở
    objectiveHtml:
      '<p>Giai đoạn 2 (2027): mở rộng thị trường Saudi Arabia + Qatar, ký kết với 10 đại lý mới, tham dự Saudi Footwear Show và xây dựng showroom ảo VR cho ngành Da giày Việt Nam.</p>',
    contentHtml:
      '<p>Tiếp nối thành quả 2026: (1) tham dự Saudi Footwear Show tháng 5/2027, (2) xây dựng showroom ảo VR, (3) tổ chức khóa đào tạo XTTM cho 50 cán bộ kinh doanh DN da giày tại Riyadh.</p>',
    planRows: [
      { task: 'Khảo sát kết quả giai đoạn 1', deliverable: 'Báo cáo nghiên cứu', dueDate: '2027-02-28', owner: 'Hoàng Mai Linh' },
    ],
    budgetRows: [
      { item: 'Tham dự Saudi Footwear Show', unit: 'gói', quantity: 1, unitPrice: 650_000_000, source: 'STATE' },
      { item: 'Xây dựng showroom ảo VR', unit: 'gói', quantity: 1, unitPrice: 420_000_000, source: 'STATE' },
      { item: 'Đào tạo 50 cán bộ tại Riyadh', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Truyền thông tiếng Ả Rập + tiếng Anh', unit: 'gói', quantity: 1, unitPrice: 150_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'kiet.diep@lefaso.org.vn',
  },

  // ---------------------------------------------------------------------------
  // 7. ASSIGNED — VITAS 2026 (đã được BQL tiếp nhận, chờ LĐ phân công cho chuyên viên)
  //    Phase 6 demo state: hồ sơ ở /phan-cong cột trái
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-005',
    orgCode: 'VITAS',
    cycleYear: 2026,
    year: 2026,
    name: 'Đào tạo nâng cao năng lực XTTM cho doanh nghiệp Dệt may xuất khẩu 2026',
    kind: 'TRAINING',
    status: 'ASSIGNED',
    industrySectorCodes: ['TEXTILE', 'GARMENT'],
    marketCodes: ['EU', 'US'],
    countryCodes: ['DEU', 'USA'],
    promotionCodes: ['TRADE_TRAINING'],
    isTwoYear: false,
    timeRange: { start: '2026-07-10', end: '2026-07-15', quarter: 'Q3' },
    objectiveHtml:
      '<p>Tổ chức 5 khóa đào tạo cho 200 cán bộ Marketing - Xuất khẩu của 60 doanh nghiệp Dệt may tại Hà Nội, TP.HCM, Đà Nẵng. Trang bị kỹ năng tiếp cận thị trường EU + US sau CBAM 2026.</p>',
    contentHtml:
      '<p>Mỗi khóa 2 ngày, kết hợp lý thuyết + workshop phân tích case study CBAM, OEKO-TEX, BSCI, EU Green Deal. Diễn giả: chuyên gia Bộ Công Thương + đại diện 3 hãng tư vấn quốc tế.</p>',
    planRows: [
      {
        task: 'Khảo sát nhu cầu đào tạo + tuyển chọn 60 doanh nghiệp',
        deliverable: 'Danh sách doanh nghiệp + 200 học viên',
        dueDate: '2026-05-31',
        owner: 'Vũ Đức Minh',
      },
      {
        task: 'Thiết kế giáo trình + tài liệu giảng dạy',
        deliverable: 'Giáo trình 5 khóa - 100 trang',
        dueDate: '2026-06-30',
        owner: 'Phòng Đào tạo',
      },
      {
        task: 'Tổ chức 5 khóa đào tạo tại 3 thành phố',
        deliverable: 'Báo cáo + chứng chỉ 200 học viên',
        dueDate: '2026-07-31',
        owner: 'Phòng Đào tạo',
      },
    ],
    budgetRows: [
      { item: 'Thuê hội trường + thiết bị (5 khóa x 2 ngày)', unit: 'ngày', quantity: 10, unitPrice: 35_000_000, source: 'STATE' },
      { item: 'Thù lao diễn giả + chuyên gia (5 khóa)', unit: 'khóa', quantity: 5, unitPrice: 80_000_000, source: 'STATE' },
      { item: 'Tài liệu + giáo trình (200 bộ)', unit: 'bộ', quantity: 200, unitPrice: 350_000, source: 'STATE' },
      { item: 'Đối ứng đơn vị: vận hành + phối hợp địa phương', unit: 'gói', quantity: 1, unitPrice: 120_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'minh.vu@vitas.org.vn',
    submittedDaysAgo: 5,
    receivedDaysAgo: 2,
    assignedReviewer: null, // chưa phân công chuyên viên
  },

  // ---------------------------------------------------------------------------
  // 8. VALID — LEFASO 2026 (đã được chuyên viên xác nhận hợp lệ + có PRELIMINARY ScoreSheet DRAFT)
  //    Phase 6 demo state: hồ sơ sẵn sàng chấm điểm sơ bộ ở /cham-diem-so-bo
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-006',
    orgCode: 'LEFASO',
    cycleYear: 2026,
    year: 2026,
    name: 'Tham dự Hội chợ AGENDA Paris 2026 - Triển lãm phụ kiện thời trang Da giày',
    kind: 'EXPORT_EXHIBITION',
    status: 'VALID',
    industrySectorCodes: ['LEATHER', 'FOOTWEAR'],
    marketCodes: ['EU'],
    countryCodes: ['FRA', 'ITA'],
    promotionCodes: ['TRADE_FAIR', 'BRAND_PROMOTION'],
    isTwoYear: false,
    timeRange: { start: '2026-09-04', end: '2026-09-07', quarter: 'Q3' },
    objectiveHtml:
      '<p>Đưa 12 doanh nghiệp phụ kiện da giày Việt tham dự AGENDA Paris 2026 — sự kiện thời trang phụ kiện hàng đầu châu Âu. Mục tiêu kết nối 60 buyers + ký 20 MOU.</p>',
    contentHtml:
      '<p>Gian hàng quốc gia 80m² tại AGENDA Paris, tổ chức Vietnam Leather Accessories Showcase với 30 buyer cao cấp tại khách sạn Le Meurice.</p>',
    planRows: [
      { task: 'Tuyển chọn 12 doanh nghiệp', deliverable: 'Danh sách', dueDate: '2026-05-15', owner: 'Hoàng Mai Linh' },
      { task: 'Thiết kế + thi công gian hàng', deliverable: 'Bản vẽ + hợp đồng', dueDate: '2026-07-15', owner: 'Phòng Tổ chức Hội chợ' },
      { task: 'Networking event + tham dự sự kiện', deliverable: 'Báo cáo 20 MOU', dueDate: '2026-09-10', owner: 'Diệp Thành Kiệt' },
    ],
    budgetRows: [
      { item: 'Thuê gian hàng AGENDA 80m²', unit: 'm²', quantity: 80, unitPrice: 1_750_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Vé máy bay 8 cán bộ', unit: 'vé', quantity: 8, unitPrice: 36_000_000, source: 'STATE' },
      { item: 'Networking event 30 khách', unit: 'gói', quantity: 1, unitPrice: 150_000_000, source: 'STATE' },
      { item: 'In ấn + truyền thông', unit: 'gói', quantity: 1, unitPrice: 80_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'kiet.diep@lefaso.org.vn',
    submittedDaysAgo: 25,
    receivedDaysAgo: 22,
    assignedDaysAgo: 20,
    assignedReviewer: 'chuyenvien',
    passedFormalCheck: true,
    // Full checklist all ✓ — đã đạt 100%
    checklist: [
      { itemId: 'CHK-01-LEGAL-SIGNATURE', status: '✓' },
      { itemId: 'CHK-02-LEGAL-CAPACITY', status: '✓' },
      { itemId: 'CHK-03-OBJECTIVE-CLARITY', status: '✓', note: 'Mục tiêu cụ thể, đo lường được.' },
      { itemId: 'CHK-04-PLAN-DETAIL', status: '✓' },
      { itemId: 'CHK-05-BUDGET-MATCH-PLAN', status: '✓' },
      { itemId: 'CHK-06-BUDGET-WITHIN-LIMIT', status: '✓' },
      { itemId: 'CHK-07-PM-INFO', status: '✓' },
      { itemId: 'CHK-08-MARKET-COUNTRY', status: '✓' },
      { itemId: 'CHK-09-CONSULATE-CONTACT', status: '✓' },
      { itemId: 'CHK-10-PRECEDENT-OUTCOME', status: '✓', note: 'LEFASO 2025 GDS Düsseldorf đã thành công.' },
      { itemId: 'CHK-11-SUSTAINABILITY', status: 'N/A' },
      { itemId: 'CHK-12-COMPLIANCE', status: '✓' },
    ],
    preliminaryScore: {
      status: 'DRAFT',
      overallComment:
        'Đề án có chất lượng tốt, đối tượng + thị trường rõ ràng. Đơn vị có kinh nghiệm. Cần chú ý phương án triển khai networking event để đảm bảo KPI 20 MOU.',
      scores: [
        { criterionCode: 'CRIT_FIT_DIRECTION', score: 8.5, comment: 'Phù hợp định hướng XTTMQG ngành Da giày EU.' },
        { criterionCode: 'CRIT_FIT_INDUSTRY', score: 9.0 },
        { criterionCode: 'CRIT_FIT_REGION', score: 9.0 },
        { criterionCode: 'CRIT_FEAS_CAPACITY', score: 9.0, comment: 'LEFASO có kinh nghiệm tổ chức 2025.' },
        { criterionCode: 'CRIT_FEAS_FINANCE', score: 7.5 },
        { criterionCode: 'CRIT_FEAS_TIMELINE', score: 8.0 },
        { criterionCode: 'CRIT_IMPACT_ECONOMIC', score: 8.0, comment: 'KPI 20 MOU + 60 buyers hợp lý.' },
        { criterionCode: 'CRIT_IMPACT_PARTICIPATION', score: 7.5 },
        { criterionCode: 'CRIT_IMPACT_SPREAD', score: 7.0 },
        { criterionCode: 'CRIT_QUALITY_OBJECTIVE', score: 8.0 },
        { criterionCode: 'CRIT_QUALITY_METHOD', score: 7.0, comment: 'Phương pháp triển khai phù hợp.' },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 9. SUPPLEMENT_REQUIRED — VITAS 2026 (chuyên viên đã trả bổ sung — đợi đơn vị nộp lại)
  //    Phase 6 demo state: hồ sơ ở SUPPLEMENT_REQUIRED, có lý do
  // ---------------------------------------------------------------------------
  {
    code: 'XTTM-2026-007',
    orgCode: 'VITAS',
    cycleYear: 2026,
    year: 2026,
    name: 'Hội chợ Dệt may - Da giày Việt Nam tại Đà Nẵng 2026',
    kind: 'DOMESTIC_FAIR',
    status: 'SUPPLEMENT_REQUIRED',
    industrySectorCodes: ['TEXTILE', 'GARMENT', 'FOOTWEAR'],
    marketCodes: ['ASEAN'],
    countryCodes: ['VNM'],
    promotionCodes: ['TRADE_FAIR'],
    isTwoYear: false,
    timeRange: { start: '2026-10-12', end: '2026-10-16', quarter: 'Q4' },
    objectiveHtml:
      '<p>Tổ chức Hội chợ Dệt may - Da giày Việt Nam quy mô khu vực tại Trung tâm Hội chợ Đà Nẵng. Quảng bá sản phẩm tới buyer ASEAN + nội địa.</p>',
    contentHtml:
      '<p>Quy mô 3000m² gian hàng, 100 doanh nghiệp tham gia, 5000 lượt khách tham quan dự kiến.</p>',
    planRows: [
      {
        task: 'Thiết kế tổng mặt bằng + đăng ký gian hàng',
        deliverable: 'Bản vẽ + xác nhận 100 DN',
        dueDate: '2026-08-01',
        owner: 'Vũ Đức Minh',
      },
      {
        task: 'Tổ chức hội chợ 5 ngày',
        deliverable: 'Báo cáo + minh chứng 5000 khách',
        dueDate: '2026-10-31',
        owner: 'Phòng Tổ chức Hội chợ',
      },
    ],
    budgetRows: [
      { item: 'Thuê trung tâm hội chợ Đà Nẵng', unit: 'ngày', quantity: 5, unitPrice: 180_000_000, source: 'STATE' },
      { item: 'Thiết kế tổng mặt bằng + thi công', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'STATE' },
      { item: 'Truyền thông trước + trong sự kiện', unit: 'gói', quantity: 1, unitPrice: 250_000_000, source: 'STATE' },
      { item: 'Vận hành + an ninh + tiếp đón', unit: 'gói', quantity: 1, unitPrice: 180_000_000, source: 'SELF' },
    ],
    pmContactEmail: 'giang.vu@vitas.org.vn',
    submittedDaysAgo: 15,
    receivedDaysAgo: 12,
    assignedDaysAgo: 10,
    assignedReviewer: 'chuyenvien',
    supplementRequestReason:
      'Đề nghị bổ sung các nội dung sau:\n• Hợp đồng thuê trung tâm hội chợ (hoặc thư xác nhận giữ chỗ) từ Trung tâm Hội chợ Đà Nẵng.\n• Phương án dự phòng nếu không đủ 100 doanh nghiệp đăng ký (trong vòng 30 ngày trước sự kiện).\n• Bảng phân tích định mức truyền thông 250 triệu đồng — cần chia nhỏ theo kênh (truyền hình / báo / digital).\n• Chứng nhận năng lực Phòng Tổ chức Hội chợ trong 3 năm gần nhất.',
    checklist: [
      { itemId: 'CHK-01-LEGAL-SIGNATURE', status: '✓' },
      {
        itemId: 'CHK-02-LEGAL-CAPACITY',
        status: '✗',
        note: 'Cần bổ sung chứng nhận năng lực Phòng Tổ chức Hội chợ 3 năm gần nhất.',
      },
      { itemId: 'CHK-03-OBJECTIVE-CLARITY', status: '✓' },
      { itemId: 'CHK-04-PLAN-DETAIL', status: '✓' },
      {
        itemId: 'CHK-05-BUDGET-MATCH-PLAN',
        status: '✗',
        note: 'Hạng mục truyền thông 250 triệu chưa chia nhỏ theo kênh.',
      },
      { itemId: 'CHK-06-BUDGET-WITHIN-LIMIT', status: '✓' },
      { itemId: 'CHK-07-PM-INFO', status: '✓' },
      { itemId: 'CHK-08-MARKET-COUNTRY', status: '✓' },
      { itemId: 'CHK-09-CONSULATE-CONTACT', status: 'N/A' },
      { itemId: 'CHK-12-COMPLIANCE', status: '✓' },
    ],
  },
];

// =============================================================================
// SEED DRIVER
// =============================================================================

export async function seedProjects(prisma: PrismaClient): Promise<void> {
  // Resolve cycle ids
  const cycles = await prisma.programCycle.findMany({
    where: { year: { in: [2025, 2026, 2027] } },
    select: { id: true, year: true, status: true },
  });
  const cycleByYear = new Map(cycles.map((c) => [c.year, c]));

  // Resolve org ids + their org-profile contacts (for pmContactId resolution)
  const orgs = await prisma.organization.findMany({
    where: { code: { in: ['LEFASO', 'VITAS'] } },
    select: { id: true, code: true },
  });
  const orgByCode = new Map(orgs.map((o) => [o.code, o]));

  const profiles = await prisma.organizationProfile.findMany({
    where: { organizationId: { in: orgs.map((o) => o.id) } },
    select: { id: true, organizationId: true, contactsJson: true, status: true },
  });

  // Build email → contactId map per org
  const contactIdByOrgEmail = new Map<string, string>();
  for (const p of profiles) {
    if (!p.contactsJson) continue;
    try {
      const arr = JSON.parse(p.contactsJson);
      if (Array.isArray(arr)) {
        for (const c of arr) {
          if (c?.email && c?.id) {
            contactIdByOrgEmail.set(`${p.organizationId}:${c.email}`, c.id);
          }
        }
      }
    } catch {
      // ignore parse error
    }
  }

  // Resolve user ids
  const donvi1 = await prisma.user.findUnique({
    where: { username: 'donvi1' },
    select: { id: true },
  });
  const donvi2 = await prisma.user.findUnique({
    where: { username: 'donvi2' },
    select: { id: true },
  });
  const chuyenvien = await prisma.user.findUnique({
    where: { username: 'chuyenvien' },
    select: { id: true },
  });
  const banql = await prisma.user.findUnique({
    where: { username: 'banql' },
    select: { id: true },
  });
  const banqlUserId = banql?.id ?? null;

  const userIdByOrgCode: Record<string, string | null> = {
    LEFASO: donvi1?.id ?? null,
    VITAS: donvi2?.id ?? null,
  };

  // Resolve scoring criterion ids by code (for PRELIMINARY ScoreSheet seeding)
  const scoringCriteriaRows = await prisma.scoringCriterion.findMany({
    select: { id: true, code: true, weight: true, parentId: true },
  });
  const criterionByCode = new Map(
    scoringCriteriaRows.map((c) => [c.code, c]),
  );

  // Resolve catalog ids by code
  const [industrySectors, markets, countries, promotionTypes] = await Promise.all([
    prisma.industrySector.findMany({ select: { id: true, code: true } }),
    prisma.market.findMany({ select: { id: true, code: true } }),
    prisma.country.findMany({ select: { id: true, code: true } }),
    prisma.promotionType.findMany({ select: { id: true, code: true } }),
  ]);
  const sectorIdByCode = new Map(industrySectors.map((x) => [x.code, x.id]));
  const marketIdByCode = new Map(markets.map((x) => [x.code, x.id]));
  const countryIdByCode = new Map(countries.map((x) => [x.code, x.id]));
  const promotionIdByCode = new Map(promotionTypes.map((x) => [x.code, x.id]));

  // PASS 1: insert all non-child seeds + record their resolved ids by code
  const insertedIdByCode = new Map<string, string>();

  // Sort: parents before children
  const ordered = [...SEEDS].sort((a, b) => {
    if (a.parentCode && !b.parentCode) return 1;
    if (!a.parentCode && b.parentCode) return -1;
    return 0;
  });

  for (const seed of ordered) {
    const cycle = cycleByYear.get(seed.cycleYear);
    if (!cycle) {
      console.warn(`[seedProjects] skip ${seed.code} — cycle ${seed.cycleYear} not found`);
      continue;
    }
    const org = orgByCode.get(seed.orgCode);
    if (!org) {
      console.warn(`[seedProjects] skip ${seed.code} — org ${seed.orgCode} not found`);
      continue;
    }

    // Resolve catalog ids
    const industrySectorIds = seed.industrySectorCodes
      .map((c) => sectorIdByCode.get(c))
      .filter((id): id is string => Boolean(id));
    const marketIds = seed.marketCodes
      .map((c) => marketIdByCode.get(c))
      .filter((id): id is string => Boolean(id));
    const countryIds = seed.countryCodes
      .map((c) => countryIdByCode.get(c))
      .filter((id): id is string => Boolean(id));
    const promotionTypeIds = seed.promotionCodes
      .map((c) => promotionIdByCode.get(c))
      .filter((id): id is string => Boolean(id));

    // Resolve pmContactId
    let pmContactId: string | null = null;
    if (seed.pmContactEmail) {
      pmContactId =
        contactIdByOrgEmail.get(`${org.id}:${seed.pmContactEmail}`) ?? null;
    }

    // Build budget rows + totals
    const budgetRowsResolved = seed.budgetRows.map(computeBudgetRow);
    const totalState = budgetRowsResolved
      .filter((r) => r.source === 'STATE')
      .reduce((acc, r) => acc + r.amount, 0);
    const totalSelf = budgetRowsResolved
      .filter((r) => r.source === 'SELF')
      .reduce((acc, r) => acc + r.amount, 0);
    const total = totalState + totalSelf;

    const budgetJson = JSON.stringify({
      rows: budgetRowsResolved,
      totalState,
      totalSelf,
      total,
    });

    // Build plan rows with stable ids
    const planJson = JSON.stringify({
      rows: seed.planRows.map((r) => ({ id: randomUUID(), ...r })),
    });

    const generalInfoJson = JSON.stringify({
      industrySectorIds,
      marketIds,
      countryIds,
      promotionTypeIds,
      timeRange: seed.timeRange ?? null,
      isTwoYear: seed.isTwoYear,
      nextYear: seed.nextYear ?? null,
    });

    const objectivesJson = JSON.stringify({
      objective: seed.objectiveHtml,
      content: seed.contentHtml,
    });

    // Resolve parent project id
    let parentProjectId: string | null = null;
    if (seed.parentCode) {
      const fromMap = insertedIdByCode.get(seed.parentCode);
      if (fromMap) {
        parentProjectId = fromMap;
      } else {
        const parent = await prisma.project.findUnique({
          where: { code: seed.parentCode },
          select: { id: true },
        });
        parentProjectId = parent?.id ?? null;
      }
    }

    // Resolve assigned reviewer
    const assignedReviewerId =
      seed.assignedReviewer === 'chuyenvien' ? chuyenvien?.id ?? null : null;

    const submittedAt =
      seed.submittedDaysAgo !== undefined ? daysAgo(seed.submittedDaysAgo) : null;
    const receivedAt =
      seed.receivedDaysAgo !== undefined ? daysAgo(seed.receivedDaysAgo) : null;
    const assignedAt =
      seed.assignedDaysAgo !== undefined ? daysAgo(seed.assignedDaysAgo) : null;

    // Phase 6 intake fields
    const checklistJson = seed.checklist
      ? JSON.stringify({
          items: seed.checklist,
          updatedAt: assignedAt
            ? assignedAt.toISOString()
            : new Date().toISOString(),
        })
      : null;

    const baseData = {
      programCycleId: cycle.id,
      organizationId: org.id,
      parentProjectId,
      name: seed.name,
      year: seed.year,
      kind: seed.kind,
      status: seed.status,
      generalInfoJson,
      objectivesJson,
      planJson,
      budgetJson,
      pmContactId,
      proposedBudget: total,
      approvedBudget: seed.status === 'APPROVED' ? total : null,
      submittedAt,
      receivedAt,
      assignedAt,
      assignedById: assignedAt ? banqlUserId : null,
      assignedReviewerId,
      checklistJson,
      passedFormalCheck: seed.passedFormalCheck ?? false,
      supplementRequestReason: seed.supplementRequestReason ?? null,
      searchKey: removeDiacritics(`${seed.name} ${seed.kind} ${seed.code}`),
      createdById: userIdByOrgCode[seed.orgCode] ?? null,
      currentVersion:
        seed.status === 'DRAFT' || seed.status === 'TENTATIVE' ? 1 : 2,
    };

    const created = await prisma.project.upsert({
      where: { code: seed.code },
      update: baseData,
      create: { code: seed.code, ...baseData },
    });
    insertedIdByCode.set(seed.code, created.id);

    // PRELIMINARY ScoreSheet (Phase 6) — chuyên viên chấm điểm sơ bộ
    if (seed.preliminaryScore && chuyenvien?.id) {
      const ps = seed.preliminaryScore;
      type SanitizedScore = {
        criterionId: string;
        score: number;
        comment: string | undefined;
      };
      const sanitized: SanitizedScore[] = [];
      for (const s of ps.scores) {
        const c = criterionByCode.get(s.criterionCode);
        if (!c) continue;
        sanitized.push({
          criterionId: c.id,
          score: Math.max(0, Math.min(10, s.score)),
          comment: s.comment,
        });
      }

      // Compute weighted total — only leaf criteria (parentId !== null)
      let totalScore = 0;
      for (const entry of sanitized) {
        const c = scoringCriteriaRows.find((x) => x.id === entry.criterionId);
        if (!c) continue;
        if (c.parentId === null) continue;
        totalScore += (entry.score / 10) * c.weight;
      }
      totalScore = Math.round(totalScore * 100) / 100;

      const submittedAtSheet =
        ps.status === 'SUBMITTED' && ps.submittedDaysAgo !== undefined
          ? daysAgo(ps.submittedDaysAgo)
          : ps.status === 'SUBMITTED'
            ? new Date()
            : null;

      // Find or create
      const existingSheet = await prisma.scoreSheet.findFirst({
        where: {
          projectId: created.id,
          reviewerId: chuyenvien.id,
          kind: 'PRELIMINARY',
        },
        select: { id: true },
      });
      if (existingSheet) {
        await prisma.scoreSheet.update({
          where: { id: existingSheet.id },
          data: {
            scoresJson: JSON.stringify(sanitized),
            totalScore,
            comment: ps.overallComment ?? null,
            status: ps.status,
            submittedAt: submittedAtSheet,
          },
        });
      } else {
        await prisma.scoreSheet.create({
          data: {
            projectId: created.id,
            reviewerId: chuyenvien.id,
            kind: 'PRELIMINARY',
            status: ps.status,
            scoresJson: JSON.stringify(sanitized),
            totalScore,
            comment: ps.overallComment ?? null,
            submittedAt: submittedAtSheet,
          },
        });
      }
    }

    // Snapshot version for projects that have been submitted
    if (seed.status !== 'DRAFT' && seed.status !== 'TENTATIVE') {
      const existingVersion = await prisma.projectVersion.findFirst({
        where: { projectId: created.id, versionNumber: 1 },
      });
      if (!existingVersion) {
        await prisma.projectVersion.create({
          data: {
            projectId: created.id,
            versionNumber: 1,
            snapshotJson: JSON.stringify({
              name: seed.name,
              kind: seed.kind,
              year: seed.year,
              generalInfo: JSON.parse(generalInfoJson),
              objectives: JSON.parse(objectivesJson),
              plan: JSON.parse(planJson),
              budget: JSON.parse(budgetJson),
              pmContactId,
              status: 'DRAFT',
              capturedAt: submittedAt?.toISOString() ?? new Date().toISOString(),
            }),
            reason: 'Snapshot khi nộp đề án',
            createdById: userIdByOrgCode[seed.orgCode] ?? null,
          },
        });
      }
    }
  }

  logSeedStep('Projects', SEEDS.length);
}
