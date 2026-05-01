// Demo enrichment seed (post-launch) — bulk dữ liệu để demo dashboard/lists/charts.
// Chạy CUỐI cùng sau tất cả các seed khác để không bị các post-processor trước đó
// thay đổi trạng thái. Mọi record có code/recordNumber/title prefix riêng để dọn idempotent.
//
// Thêm:
//   - 19 projects bổ sung (cycle 2025: 8 / cycle 2026: 9 / cycle 2027: 2)
//   - 12 contracts bổ sung (10 đề án 2025 + 2 đề án 2026)
//   - 8 amendments bổ sung
//   - 8 implementation plans, 2 international consulate scenarios
//   - 6 reports, 4 acceptance records, 9 financial records
//   - 1 thêm council (2025 historical) + 1 (2026 lần 2) + members + score sheets
//   - ~40 inbox notifications

import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { daysAgo, daysFromNow } from '../../lib/date';
import { removeDiacritics } from '../../lib/vi-search';
import { logSeedStep } from './helpers';
import { formatContractNumber } from '../../lib/amendment-rules';

const DEMO_CODE_PREFIX = 'XTTM-DEMO-';

// =============================================================================
// PROJECT SEED DEFINITIONS — 19 records
// =============================================================================

type DemoProject = {
  code: string;
  orgCode: string;
  cycleYear: number;
  year: number;
  name: string;
  kind: string;
  status: string;
  industries: string[];
  markets: string[];
  countries: string[];
  promotions: string[];
  isTwoYear?: boolean;
  parentCode?: string;
  startDate?: string | null;
  endDate?: string | null;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  budgetTotal: number; // VND, used to generate budget rows
  objectiveText: string;
  contentText: string;
  planTasks: string[];
  budgetItems: { item: string; unit: string; quantity: number; unitPrice: number; source: 'STATE' | 'SELF' }[];
  pmEmail?: string;
  submittedDaysAgo?: number;
  approvedDaysAgo?: number;
  receivedDaysAgo?: number;
  assignedDaysAgo?: number;
  passedFormalCheck?: boolean;
};

const DEMO_PROJECTS: DemoProject[] = [
  // ===========================================================================
  // CYCLE 2025 — 8 historical projects (5 COMPLETED, 2 APPROVED, 1 REJECTED_FINAL)
  // (cycle 2025 đã có 1 APPROVED — XTTM-2025-001 — cộng 8 nữa = 9 total trong cycle 2025)
  // ===========================================================================
  {
    code: 'XTTM-DEMO-2025-002',
    orgCode: 'VITAS',
    cycleYear: 2025,
    year: 2025,
    name: 'Đoàn doanh nghiệp Dệt may tham dự Texworld Paris 2025 — Mở rộng thị phần EU',
    kind: 'EXPORT_EXHIBITION',
    status: 'COMPLETED',
    industries: ['TEXTILE', 'GARMENT'],
    markets: ['EU'],
    countries: ['FRA', 'DEU', 'ITA'],
    promotions: ['TRADE_FAIR', 'BUSINESS_MATCHING'],
    startDate: '2025-02-10',
    endDate: '2025-02-13',
    quarter: 'Q1',
    budgetTotal: 1_850_000_000,
    objectiveText:
      'Đưa 22 doanh nghiệp Dệt may Việt tham dự Texworld Paris 2025 — sự kiện hàng đầu châu Âu về vải, sợi và phụ kiện dệt may. Mục tiêu kết nối 100 buyers, ký 35 MOU.',
    contentText:
      'Gian hàng Vietnam Pavilion 200m² tại Le Bourget Paris, kết hợp Vietnam Textile Networking Day với 80 buyer EU + UK.',
    planTasks: [
      'Tuyển chọn 22 doanh nghiệp tham gia',
      'Đăng ký gian hàng + thiết kế concept',
      'Vận chuyển hàng mẫu sang Pháp',
      'Tổ chức sự kiện + tổng kết',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng Texworld 200m²', unit: 'm²', quantity: 200, unitPrice: 1_900_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 480_000_000, source: 'STATE' },
      { item: 'Vận chuyển 2 container', unit: 'container', quantity: 2, unitPrice: 105_000_000, source: 'STATE' },
      { item: 'Vé máy bay + lưu trú đoàn 12 người', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'STATE' },
      { item: 'Đối ứng đơn vị: in ấn + truyền thông', unit: 'gói', quantity: 1, unitPrice: 120_000_000, source: 'SELF' },
    ],
    pmEmail: 'minh.vu@vitas.org.vn',
    submittedDaysAgo: 420,
    approvedDaysAgo: 380,
  },
  {
    code: 'XTTM-DEMO-2025-003',
    orgCode: 'VICOFA',
    cycleYear: 2025,
    year: 2025,
    name: 'Đoàn giao thương Cà phê Việt Nam tại Hàn Quốc Q3/2025',
    kind: 'TRADE_DELEGATION_OUT',
    status: 'COMPLETED',
    industries: ['COFFEE', 'AGRICULTURE'],
    markets: ['KOREA'],
    countries: ['KOR'],
    promotions: ['BUSINESS_MATCHING', 'EXPORT_PROMOTION'],
    startDate: '2025-08-18',
    endDate: '2025-08-25',
    quarter: 'Q3',
    budgetTotal: 1_240_000_000,
    objectiveText:
      'Tổ chức đoàn 14 doanh nghiệp Cà phê đi khảo sát Hàn Quốc trong 8 ngày (Seoul → Busan). Mục tiêu kết nối 50 buyer Hàn, ký 20 hợp đồng cà phê đặc sản.',
    contentText:
      'Hành trình bao gồm Vietnam Coffee Showcase tại COEX Seoul, gặp gỡ Korea Coffee Association, tham quan rang xay tại Busan.',
    planTasks: [
      'Tuyển chọn 14 doanh nghiệp cà phê đặc sản',
      'Liên hệ Thương vụ VN tại Seoul',
      'Tổ chức Coffee Showcase + business matching',
      'Tổng kết + báo cáo nghiệm thu',
    ],
    budgetItems: [
      { item: 'Vé máy bay đoàn 18 người', unit: 'vé', quantity: 18, unitPrice: 22_000_000, source: 'STATE' },
      { item: 'Lưu trú 18 người x 8 đêm', unit: 'đêm-người', quantity: 144, unitPrice: 3_800_000, source: 'STATE' },
      { item: 'Showcase tại COEX Seoul + thuê thiết bị', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Phiên dịch tiếng Hàn 8 ngày', unit: 'ngày', quantity: 8, unitPrice: 18_000_000, source: 'STATE' },
      { item: 'Vận chuyển nội địa Seoul-Busan', unit: 'gói', quantity: 1, unitPrice: 95_000_000, source: 'STATE' },
      { item: 'Đối ứng: tài liệu + sản phẩm mẫu', unit: 'gói', quantity: 1, unitPrice: 85_000_000, source: 'SELF' },
    ],
    pmEmail: 'hai.nguyen@vicofa.org.vn',
    submittedDaysAgo: 360,
    approvedDaysAgo: 320,
  },
  {
    code: 'XTTM-DEMO-2025-004',
    orgCode: 'VIFOREST',
    cycleYear: 2025,
    year: 2025,
    name: 'Triển lãm Furniture Vietnam 2025 tại High Point Market Spring',
    kind: 'EXPORT_EXHIBITION',
    status: 'COMPLETED',
    industries: ['WOOD'],
    markets: ['US'],
    countries: ['USA'],
    promotions: ['TRADE_FAIR', 'BRAND_PROMOTION'],
    startDate: '2025-04-05',
    endDate: '2025-04-09',
    quarter: 'Q2',
    budgetTotal: 3_650_000_000,
    objectiveText:
      'Đưa 28 doanh nghiệp gỗ Việt tham dự High Point Market Spring 2025 — chợ nội thất lớn nhất thế giới. Mục tiêu ký 45 hợp đồng tổng giá trị 60 triệu USD.',
    contentText:
      'Gian hàng quốc gia 350m² tại trung tâm International Home Furnishings Center (IHFC), kết hợp Vietnam Wood Industry Forum bên lề.',
    planTasks: [
      'Tuyển chọn 28 doanh nghiệp gỗ',
      'Thiết kế gian hàng concept "Vietnam Wood Crafts"',
      'Vận chuyển 8 container hàng mẫu',
      'Tổ chức Industry Forum + sự kiện chính',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng IHFC 350m²', unit: 'm²', quantity: 350, unitPrice: 2_400_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 850_000_000, source: 'STATE' },
      { item: 'Vận chuyển 8 container 2 chiều', unit: 'container', quantity: 8, unitPrice: 145_000_000, source: 'STATE' },
      { item: 'Vé máy bay + lưu trú đoàn 22 người', unit: 'gói', quantity: 1, unitPrice: 1_180_000_000, source: 'STATE' },
      { item: 'Đối ứng: catalog + truyền thông', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'SELF' },
    ],
    pmEmail: 'lap.do@vietfores.org',
    submittedDaysAgo: 410,
    approvedDaysAgo: 365,
  },
  {
    code: 'XTTM-DEMO-2025-005',
    orgCode: 'VASEP',
    cycleYear: 2025,
    year: 2025,
    name: 'Tham dự Seafood Expo Global Brussels 2025 — Quảng bá Thủy sản Việt Nam tại EU',
    kind: 'EXPORT_EXHIBITION',
    status: 'COMPLETED',
    industries: ['SEAFOOD'],
    markets: ['EU'],
    countries: ['NLD', 'DEU', 'FRA'],
    promotions: ['TRADE_FAIR', 'BUSINESS_MATCHING'],
    startDate: '2025-04-22',
    endDate: '2025-04-24',
    quarter: 'Q2',
    budgetTotal: 2_750_000_000,
    objectiveText:
      'Đưa 35 doanh nghiệp thủy sản Việt tham dự Seafood Expo Global Brussels 2025 — sự kiện thủy sản lớn nhất thế giới. Mục tiêu duy trì + mở rộng thị phần EU sau IUU.',
    contentText:
      'Gian hàng Vietnam Pavilion 280m² tại Brussels Expo, kết hợp Vietnam Seafood Sustainability Forum.',
    planTasks: [
      'Tuyển chọn 35 doanh nghiệp đủ điều kiện EU',
      'Thiết kế gian hàng + tài liệu CBAM/IUU',
      'Vận chuyển 5 container hàng mẫu',
      'Tổ chức Sustainability Forum + tổng kết',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng 280m²', unit: 'm²', quantity: 280, unitPrice: 2_100_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 680_000_000, source: 'STATE' },
      { item: 'Vận chuyển 5 container', unit: 'container', quantity: 5, unitPrice: 125_000_000, source: 'STATE' },
      { item: 'Vé + lưu trú đoàn 18 người', unit: 'gói', quantity: 1, unitPrice: 920_000_000, source: 'STATE' },
      { item: 'Đối ứng: truyền thông + ấn phẩm', unit: 'gói', quantity: 1, unitPrice: 230_000_000, source: 'SELF' },
    ],
    pmEmail: 'nam.nguyen@vasep.com.vn',
    submittedDaysAgo: 405,
    approvedDaysAgo: 360,
  },
  {
    code: 'XTTM-DEMO-2025-006',
    orgCode: 'LEFASO',
    cycleYear: 2025,
    year: 2025,
    name: 'Hội nghị Quốc tế Da giày Việt Nam 2025 — Chuyển đổi xanh và bền vững',
    kind: 'INTL_CONFERENCE',
    status: 'COMPLETED',
    industries: ['FOOTWEAR', 'LEATHER'],
    markets: ['EU', 'US', 'JAPAN'],
    countries: ['DEU', 'USA', 'JPN'],
    promotions: ['TRADE_TRAINING', 'BRAND_PROMOTION'],
    startDate: '2025-11-12',
    endDate: '2025-11-13',
    quarter: 'Q4',
    budgetTotal: 1_960_000_000,
    objectiveText:
      'Tổ chức Hội nghị Quốc tế Da giày 2025 quy tụ 380 đại biểu từ 22 quốc gia, chủ đề chuyển đổi xanh đáp ứng yêu cầu CBAM 2026 của EU.',
    contentText:
      'Chương trình 2 ngày tại Khách sạn Sheraton Hà Nội: 4 phiên toàn thể + 6 phiên chuyên đề về CBAM, OEKO-TEX, GRS, Da thuộc bền vững.',
    planTasks: [
      'Lập đề án chi tiết + ngân sách',
      'Mời 25 diễn giả quốc tế',
      'Triển khai hội nghị 2 ngày',
      'Báo cáo + kỷ yếu hội nghị',
    ],
    budgetItems: [
      { item: 'Thuê hội trường Sheraton 2 ngày', unit: 'ngày', quantity: 2, unitPrice: 240_000_000, source: 'STATE' },
      { item: 'Vé máy bay + lưu trú diễn giả 12 người', unit: 'gói', quantity: 1, unitPrice: 720_000_000, source: 'STATE' },
      { item: 'Phiên dịch song song 4 ngôn ngữ', unit: 'ngày', quantity: 2, unitPrice: 75_000_000, source: 'STATE' },
      { item: 'Tài liệu hội nghị + kỷ yếu', unit: 'gói', quantity: 1, unitPrice: 180_000_000, source: 'STATE' },
      { item: 'Đối ứng: truyền thông + livestream', unit: 'gói', quantity: 1, unitPrice: 230_000_000, source: 'SELF' },
    ],
    pmEmail: 'linh.hoang@lefaso.org.vn',
    submittedDaysAgo: 460,
    approvedDaysAgo: 415,
  },
  {
    code: 'XTTM-DEMO-2025-007',
    orgCode: 'VINATEX',
    cycleYear: 2025,
    year: 2025,
    name: 'Đào tạo nâng cao năng lực XTTM cho 200 cán bộ Dệt may 2025',
    kind: 'TRAINING',
    status: 'COMPLETED',
    industries: ['TEXTILE', 'GARMENT'],
    markets: ['EU', 'US'],
    countries: ['DEU', 'USA', 'VNM'],
    promotions: ['TRADE_TRAINING'],
    startDate: '2025-06-15',
    endDate: '2025-06-30',
    quarter: 'Q2',
    budgetTotal: 980_000_000,
    objectiveText:
      'Tổ chức 5 khóa đào tạo cho 200 cán bộ Marketing - Xuất khẩu của 50 doanh nghiệp Dệt may tại Hà Nội, TP.HCM, Đà Nẵng.',
    contentText:
      'Mỗi khóa 3 ngày tập trung vào CBAM, EU Green Deal, US sourcing trends, kỹ năng đàm phán quốc tế.',
    planTasks: [
      'Khảo sát nhu cầu + tuyển chọn doanh nghiệp',
      'Thiết kế giáo trình 5 khóa',
      'Triển khai 5 khóa đào tạo',
      'Báo cáo + chứng chỉ',
    ],
    budgetItems: [
      { item: 'Thuê hội trường 5 khóa x 3 ngày', unit: 'ngày', quantity: 15, unitPrice: 30_000_000, source: 'STATE' },
      { item: 'Thù lao diễn giả + chuyên gia', unit: 'khóa', quantity: 5, unitPrice: 75_000_000, source: 'STATE' },
      { item: 'Tài liệu + giáo trình 200 bộ', unit: 'bộ', quantity: 200, unitPrice: 380_000, source: 'STATE' },
      { item: 'Đối ứng: vận hành + phối hợp', unit: 'gói', quantity: 1, unitPrice: 78_000_000, source: 'SELF' },
    ],
    pmEmail: 'truong.le@vinatex.com.vn',
    submittedDaysAgo: 430,
    approvedDaysAgo: 395,
  },
  {
    code: 'XTTM-DEMO-2025-008',
    orgCode: 'LEFASO',
    cycleYear: 2025,
    year: 2025,
    name: 'Tham dự Lineapelle Milano 2025 — Triển lãm Da thuộc & Phụ kiện thời trang',
    kind: 'EXPORT_EXHIBITION',
    status: 'APPROVED',
    industries: ['LEATHER', 'FOOTWEAR'],
    markets: ['EU'],
    countries: ['ITA', 'FRA'],
    promotions: ['TRADE_FAIR'],
    startDate: '2025-09-23',
    endDate: '2025-09-25',
    quarter: 'Q3',
    budgetTotal: 1_580_000_000,
    objectiveText:
      'Đưa 18 doanh nghiệp da thuộc Việt tham dự Lineapelle Milano 2025 nhằm mở rộng phân khúc thời trang trung-cao cấp.',
    contentText:
      'Gian hàng quốc gia 100m² tại Lineapelle Milano, networking event với 60 buyer Italy + EU.',
    planTasks: [
      'Tuyển chọn 18 doanh nghiệp da thuộc',
      'Đăng ký gian hàng + thiết kế',
      'Triển khai sự kiện',
      'Báo cáo nghiệm thu',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng Lineapelle 100m²', unit: 'm²', quantity: 100, unitPrice: 2_200_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 320_000_000, source: 'STATE' },
      { item: 'Vé + lưu trú đoàn 10 người', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'STATE' },
      { item: 'Networking event 60 khách', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Đối ứng: in ấn + truyền thông', unit: 'gói', quantity: 1, unitPrice: 180_000_000, source: 'SELF' },
    ],
    pmEmail: 'kiet.diep@lefaso.org.vn',
    submittedDaysAgo: 410,
    approvedDaysAgo: 365,
  },
  {
    code: 'XTTM-DEMO-2025-009',
    orgCode: 'VRA',
    cycleYear: 2025,
    year: 2025,
    name: 'Hội chợ Cao su Quốc tế Singapore 2025 — Mở rộng thị trường ASEAN',
    kind: 'EXPORT_EXHIBITION',
    status: 'REJECTED_FINAL',
    industries: ['AGRICULTURE'],
    markets: ['ASEAN'],
    countries: ['VNM'],
    promotions: ['TRADE_FAIR'],
    startDate: '2025-10-15',
    endDate: '2025-10-18',
    quarter: 'Q4',
    budgetTotal: 1_120_000_000,
    objectiveText:
      'Đưa doanh nghiệp Cao su Việt tham dự Singapore Rubber Expo 2025. Đề án bị từ chối phê duyệt do thiếu căn cứ pháp lý và năng lực đơn vị chưa đáp ứng.',
    contentText:
      'Gian hàng 60m² tại Marina Bay Sands Expo, business matching với buyer Singapore + Malaysia.',
    planTasks: [
      'Tuyển chọn doanh nghiệp',
      'Đăng ký gian hàng',
      'Tổ chức sự kiện',
      'Báo cáo',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng 60m²', unit: 'm²', quantity: 60, unitPrice: 1_500_000, source: 'STATE' },
      { item: 'Thiết kế + thi công', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Vé + lưu trú 8 người', unit: 'gói', quantity: 1, unitPrice: 380_000_000, source: 'STATE' },
      { item: 'Networking + phiên dịch', unit: 'gói', quantity: 1, unitPrice: 180_000_000, source: 'STATE' },
      { item: 'Đối ứng: truyền thông', unit: 'gói', quantity: 1, unitPrice: 190_000_000, source: 'SELF' },
    ],
    pmEmail: 'thuan.tran@vra.com.vn',
    submittedDaysAgo: 420,
  },

  // ===========================================================================
  // CYCLE 2026 — 9 projects funnel bổ sung (DRAFT/SUBMITTED/RESUBMITTED/...)
  // (cycle 2026 đã có 9 projects + 1 TENTATIVE — cộng thêm 9 nữa = ~18 trong cycle 2026)
  // ===========================================================================
  {
    code: 'XTTM-DEMO-2026-101',
    orgCode: 'VASEP',
    cycleYear: 2026,
    year: 2026,
    name: 'Tham dự Vietfish Expo 2026 — Triển lãm Thủy sản Việt Nam tại TP.HCM',
    kind: 'DOMESTIC_FAIR',
    status: 'DRAFT',
    industries: ['SEAFOOD'],
    markets: ['ASEAN'],
    countries: ['VNM'],
    promotions: ['TRADE_FAIR'],
    startDate: '2026-08-22',
    endDate: '2026-08-25',
    quarter: 'Q3',
    budgetTotal: 2_350_000_000,
    objectiveText:
      'Tổ chức Vietfish Expo 2026 với 350 gian hàng tại SECC TP.HCM, thu hút 30.000 lượt khách, 25 quốc gia tham dự.',
    contentText:
      'Quy mô 350 gian hàng + sự kiện bên lề: Vietnam Seafood Sustainability Day, Tilapia Networking Forum.',
    planTasks: [
      'Đăng ký + thiết kế tổng mặt bằng',
      'Tuyển chọn 350 gian hàng',
      'Tổ chức sự kiện 4 ngày',
      'Báo cáo + tổng kết',
    ],
    budgetItems: [
      { item: 'Thuê SECC 4 ngày', unit: 'ngày', quantity: 4, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Thiết kế tổng mặt bằng', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'STATE' },
      { item: 'Truyền thông trước + trong sự kiện', unit: 'gói', quantity: 1, unitPrice: 330_000_000, source: 'STATE' },
      { item: 'Đối ứng: vận hành + an ninh', unit: 'gói', quantity: 1, unitPrice: 320_000_000, source: 'SELF' },
    ],
    pmEmail: 'nam.nguyen@vasep.com.vn',
  },
  {
    code: 'XTTM-DEMO-2026-102',
    orgCode: 'VCCI',
    cycleYear: 2026,
    year: 2026,
    name: 'Diễn đàn Doanh nghiệp Việt Nam - Trung Đông 2026 tại Dubai',
    kind: 'INTL_CONFERENCE',
    status: 'DRAFT',
    industries: ['TEXTILE', 'FOOTWEAR', 'AGRICULTURE'],
    markets: ['MIDDLE_EAST'],
    countries: ['ARE'],
    promotions: ['BUSINESS_MATCHING', 'BRAND_PROMOTION'],
    startDate: '2026-11-05',
    endDate: '2026-11-07',
    quarter: 'Q4',
    budgetTotal: 2_180_000_000,
    objectiveText:
      'Tổ chức Diễn đàn Doanh nghiệp Việt Nam - Trung Đông tại Dubai với 250 đại biểu, mở rộng XTTM tại UAE và GCC.',
    contentText:
      'Chương trình 3 ngày: Vietnam Trade Forum + B2B matching + thăm Dubai Expo Site + meeting Dubai Chamber.',
    planTasks: [
      'Lập đề án chi tiết',
      'Mời doanh nghiệp + đối tác',
      'Tổ chức diễn đàn',
      'Báo cáo nghiệm thu',
    ],
    budgetItems: [
      { item: 'Thuê hội trường Dubai 3 ngày', unit: 'ngày', quantity: 3, unitPrice: 220_000_000, source: 'STATE' },
      { item: 'Vé máy bay + lưu trú đoàn 30 người', unit: 'gói', quantity: 1, unitPrice: 1_180_000_000, source: 'STATE' },
      { item: 'Phiên dịch tiếng Ả Rập + tiếng Anh', unit: 'gói', quantity: 1, unitPrice: 230_000_000, source: 'STATE' },
      { item: 'Đối ứng: truyền thông + tiếp khách', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'SELF' },
    ],
    pmEmail: 'cong.pham@vcci.com.vn',
  },
  {
    code: 'XTTM-DEMO-2026-103',
    orgCode: 'VFA',
    cycleYear: 2026,
    year: 2026,
    name: 'Đoàn doanh nghiệp Gạo Việt Nam tham dự Hội nghị Lương thực Quốc tế Manila 2026',
    kind: 'TRADE_DELEGATION_OUT',
    status: 'SUBMITTED',
    industries: ['AGRICULTURE'],
    markets: ['ASEAN'],
    countries: ['VNM'],
    promotions: ['EXPORT_PROMOTION', 'BUSINESS_MATCHING'],
    startDate: '2026-08-12',
    endDate: '2026-08-16',
    quarter: 'Q3',
    budgetTotal: 1_180_000_000,
    objectiveText:
      'Tổ chức đoàn 20 doanh nghiệp Gạo Việt tham dự Manila Rice Forum 2026, ký hợp đồng dài hạn với Philippines + Indonesia.',
    contentText:
      'Chương trình 5 ngày: Manila Forum + B2B matching + thăm Cảng Manila + gặp NFA Philippines.',
    planTasks: [
      'Tuyển chọn 20 doanh nghiệp',
      'Liên hệ Thương vụ Manila',
      'Triển khai đoàn',
      'Báo cáo',
    ],
    budgetItems: [
      { item: 'Vé máy bay 24 người', unit: 'vé', quantity: 24, unitPrice: 16_000_000, source: 'STATE' },
      { item: 'Lưu trú 24 người x 5 đêm', unit: 'đêm-người', quantity: 120, unitPrice: 3_200_000, source: 'STATE' },
      { item: 'Hội nghị + B2B matching', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Phiên dịch + tài liệu', unit: 'gói', quantity: 1, unitPrice: 95_000_000, source: 'STATE' },
      { item: 'Đối ứng: vận hành', unit: 'gói', quantity: 1, unitPrice: 60_000_000, source: 'SELF' },
    ],
    pmEmail: 'nam.nguyen@vietfood.org.vn',
    submittedDaysAgo: 6,
  },
  {
    code: 'XTTM-DEMO-2026-104',
    orgCode: 'VICOFA',
    cycleYear: 2026,
    year: 2026,
    name: 'Vietnam Coffee Festival 2026 tại Buôn Ma Thuột — Quy mô quốc tế',
    kind: 'DOMESTIC_FAIR',
    status: 'SUBMITTED',
    industries: ['COFFEE', 'AGRICULTURE'],
    markets: ['ASEAN'],
    countries: ['VNM'],
    promotions: ['TRADE_FAIR', 'BRAND_PROMOTION'],
    startDate: '2026-03-10',
    endDate: '2026-03-14',
    quarter: 'Q1',
    budgetTotal: 3_280_000_000,
    objectiveText:
      'Tổ chức Vietnam Coffee Festival 2026 quy mô 450 gian hàng, 35 quốc gia, 100.000 lượt khách tại Buôn Ma Thuột.',
    contentText:
      'Quy mô lớn nhất từ trước: 450 gian hàng + 4 cuộc thi + Coffee Trade Forum + Cup Tasters Championship.',
    planTasks: [
      'Đăng ký + thiết kế tổng mặt bằng',
      'Mời 450 doanh nghiệp + 30 đối tác quốc tế',
      'Triển khai festival 5 ngày',
      'Báo cáo + tổng kết',
    ],
    budgetItems: [
      { item: 'Thuê quảng trường + hội trường BMT', unit: 'ngày', quantity: 5, unitPrice: 180_000_000, source: 'STATE' },
      { item: 'Thiết kế tổng + concept "Coffee Origin"', unit: 'gói', quantity: 1, unitPrice: 720_000_000, source: 'STATE' },
      { item: 'Truyền thông quốc tế + livestream', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'STATE' },
      { item: 'Cuộc thi + diễn giả quốc tế', unit: 'gói', quantity: 1, unitPrice: 480_000_000, source: 'STATE' },
      { item: 'Đối ứng: vận hành + phối hợp địa phương', unit: 'gói', quantity: 1, unitPrice: 600_000_000, source: 'SELF' },
    ],
    pmEmail: 'hai.nguyen@vicofa.org.vn',
    submittedDaysAgo: 9,
  },
  {
    code: 'XTTM-DEMO-2026-105',
    orgCode: 'VIFOREST',
    cycleYear: 2026,
    year: 2026,
    name: 'Đoàn doanh nghiệp Gỗ Việt Nam tham dự imm Cologne 2026 (Đức)',
    kind: 'EXPORT_EXHIBITION',
    status: 'SUBMITTED',
    industries: ['WOOD'],
    markets: ['EU'],
    countries: ['DEU', 'NLD', 'ITA'],
    promotions: ['TRADE_FAIR', 'BUSINESS_MATCHING'],
    startDate: '2026-01-19',
    endDate: '2026-01-22',
    quarter: 'Q1',
    budgetTotal: 2_980_000_000,
    objectiveText:
      'Tổ chức đoàn 24 doanh nghiệp Gỗ tham dự imm Cologne 2026 — chợ nội thất hàng đầu châu Âu. Mục tiêu ký 35 hợp đồng tổng 40 triệu USD.',
    contentText:
      'Gian hàng quốc gia 280m² tại Koelnmesse, kết hợp Vietnam Wood Day với 80 buyer EU.',
    planTasks: [
      'Tuyển chọn 24 doanh nghiệp',
      'Đăng ký + thiết kế gian hàng',
      'Vận chuyển 5 container',
      'Triển khai imm Cologne',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng Koelnmesse 280m²', unit: 'm²', quantity: 280, unitPrice: 2_500_000, source: 'STATE' },
      { item: 'Thiết kế + thi công', unit: 'gói', quantity: 1, unitPrice: 720_000_000, source: 'STATE' },
      { item: 'Vận chuyển 5 container', unit: 'container', quantity: 5, unitPrice: 135_000_000, source: 'STATE' },
      { item: 'Vé + lưu trú đoàn 18 người', unit: 'gói', quantity: 1, unitPrice: 880_000_000, source: 'STATE' },
      { item: 'Đối ứng: catalog + truyền thông', unit: 'gói', quantity: 1, unitPrice: 175_000_000, source: 'SELF' },
    ],
    pmEmail: 'lap.do@vietfores.org',
    submittedDaysAgo: 14,
  },
  {
    code: 'XTTM-DEMO-2026-106',
    orgCode: 'MAY10',
    cycleYear: 2026,
    year: 2026,
    name: 'Tham dự Magic Las Vegas Spring 2026 — Triển lãm thời trang Mỹ',
    kind: 'EXPORT_EXHIBITION',
    status: 'ASSIGNED',
    industries: ['GARMENT', 'TEXTILE'],
    markets: ['US'],
    countries: ['USA'],
    promotions: ['TRADE_FAIR', 'BUSINESS_MATCHING'],
    startDate: '2026-02-16',
    endDate: '2026-02-19',
    quarter: 'Q1',
    budgetTotal: 2_480_000_000,
    objectiveText:
      'Đưa 16 doanh nghiệp May 10 + đối tác tham dự Magic Las Vegas Spring 2026, mở rộng thị phần thời trang nam.',
    contentText:
      'Gian hàng 180m² tại Mandalay Bay Convention Center, kết hợp Vietnam Garment Networking event.',
    planTasks: [
      'Tuyển chọn 16 đối tác',
      'Đăng ký gian hàng',
      'Vận chuyển hàng mẫu',
      'Triển khai sự kiện',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng Mandalay 180m²', unit: 'm²', quantity: 180, unitPrice: 2_700_000, source: 'STATE' },
      { item: 'Thiết kế + thi công', unit: 'gói', quantity: 1, unitPrice: 480_000_000, source: 'STATE' },
      { item: 'Vé + lưu trú đoàn 14 người', unit: 'gói', quantity: 1, unitPrice: 920_000_000, source: 'STATE' },
      { item: 'Networking event', unit: 'gói', quantity: 1, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Đối ứng: truyền thông', unit: 'gói', quantity: 1, unitPrice: 314_000_000, source: 'SELF' },
    ],
    pmEmail: 'long.bach@garco10.com.vn',
    submittedDaysAgo: 18,
    receivedDaysAgo: 14,
    assignedDaysAgo: 12,
  },
  {
    code: 'XTTM-DEMO-2026-107',
    orgCode: 'VFA',
    cycleYear: 2026,
    year: 2026,
    name: 'Hội thảo Xúc tiến Gạo Việt Nam tại Indonesia 2026',
    kind: 'TRADE_DELEGATION_OUT',
    status: 'IN_REVIEW',
    industries: ['AGRICULTURE'],
    markets: ['ASEAN'],
    countries: ['VNM'],
    promotions: ['EXPORT_PROMOTION'],
    startDate: '2026-07-08',
    endDate: '2026-07-12',
    quarter: 'Q3',
    budgetTotal: 1_320_000_000,
    objectiveText:
      'Tổ chức đoàn 18 doanh nghiệp Gạo Việt tham dự Hội thảo XTTM Gạo tại Jakarta. Mục tiêu mở rộng xuất khẩu Indonesia.',
    contentText:
      'Chương trình 5 ngày: Hội thảo + B2B + thăm Bulog + gặp Bộ Nông nghiệp Indonesia.',
    planTasks: [
      'Tuyển chọn 18 doanh nghiệp',
      'Liên hệ Thương vụ Jakarta',
      'Triển khai đoàn',
      'Báo cáo',
    ],
    budgetItems: [
      { item: 'Vé máy bay 22 người', unit: 'vé', quantity: 22, unitPrice: 14_000_000, source: 'STATE' },
      { item: 'Lưu trú 22 người x 5 đêm', unit: 'đêm-người', quantity: 110, unitPrice: 3_400_000, source: 'STATE' },
      { item: 'Hội thảo + B2B Jakarta', unit: 'gói', quantity: 1, unitPrice: 320_000_000, source: 'STATE' },
      { item: 'Phiên dịch + tài liệu', unit: 'gói', quantity: 1, unitPrice: 95_000_000, source: 'STATE' },
      { item: 'Đối ứng: vận hành', unit: 'gói', quantity: 1, unitPrice: 50_000_000, source: 'SELF' },
    ],
    pmEmail: 'co.phan@vietfood.org.vn',
    submittedDaysAgo: 22,
    receivedDaysAgo: 18,
    assignedDaysAgo: 16,
  },
  {
    code: 'XTTM-DEMO-2026-108',
    orgCode: 'VICOFA',
    cycleYear: 2026,
    year: 2026,
    name: 'Đoàn cà phê Việt Nam tham dự World of Coffee Athens 2026',
    kind: 'TRADE_DELEGATION_OUT',
    status: 'VALID',
    industries: ['COFFEE', 'AGRICULTURE'],
    markets: ['EU'],
    countries: ['DEU', 'NLD'],
    promotions: ['BUSINESS_MATCHING', 'BRAND_PROMOTION'],
    startDate: '2026-06-25',
    endDate: '2026-06-30',
    quarter: 'Q2',
    budgetTotal: 2_180_000_000,
    objectiveText:
      'Đưa 20 doanh nghiệp Cà phê đặc sản Việt tham dự World of Coffee Athens 2026 — sự kiện cà phê đặc sản hàng đầu châu Âu.',
    contentText:
      'Gian hàng Vietnam Pavilion 120m² + Cup Tasters Championship + Vietnam Coffee Origin Forum.',
    planTasks: [
      'Tuyển chọn 20 doanh nghiệp đặc sản',
      'Đăng ký gian hàng + Cup Tasters',
      'Triển khai sự kiện',
      'Báo cáo',
    ],
    budgetItems: [
      { item: 'Thuê gian hàng 120m²', unit: 'm²', quantity: 120, unitPrice: 2_300_000, source: 'STATE' },
      { item: 'Thiết kế + thi công gian hàng', unit: 'gói', quantity: 1, unitPrice: 480_000_000, source: 'STATE' },
      { item: 'Vé + lưu trú đoàn 14 người', unit: 'gói', quantity: 1, unitPrice: 720_000_000, source: 'STATE' },
      { item: 'Cup Tasters + Forum bên lề', unit: 'gói', quantity: 1, unitPrice: 380_000_000, source: 'STATE' },
      { item: 'Đối ứng: in ấn + tài liệu', unit: 'gói', quantity: 1, unitPrice: 324_000_000, source: 'SELF' },
    ],
    pmEmail: 'hai.nguyen@vicofa.org.vn',
    submittedDaysAgo: 32,
    receivedDaysAgo: 28,
    assignedDaysAgo: 26,
    passedFormalCheck: true,
  },
  {
    code: 'XTTM-DEMO-2026-109',
    orgCode: 'VIFOREST',
    cycleYear: 2026,
    year: 2026,
    name: 'VIFA EXPO 2026 — Triển lãm Quốc tế Đồ gỗ và Mỹ nghệ TP.HCM',
    kind: 'DOMESTIC_FAIR',
    status: 'APPROVED',
    industries: ['WOOD'],
    markets: ['ASEAN'],
    countries: ['VNM'],
    promotions: ['TRADE_FAIR', 'BUSINESS_MATCHING'],
    startDate: '2026-03-04',
    endDate: '2026-03-07',
    quarter: 'Q1',
    budgetTotal: 4_280_000_000,
    objectiveText:
      'Tổ chức VIFA EXPO 2026 quy mô 700 gian hàng, 110 quốc gia + vùng lãnh thổ tham dự, 50.000 lượt khách thương mại.',
    contentText:
      'Quy mô lớn nhất ngành: 700 gian hàng tại SECC TP.HCM + Vietnam Wood Industry Day + Furniture Design Awards.',
    planTasks: [
      'Đăng ký + thiết kế tổng',
      'Mời 700 gian hàng',
      'Triển khai 4 ngày',
      'Báo cáo + tổng kết',
    ],
    budgetItems: [
      { item: 'Thuê SECC 4 ngày toàn bộ tầng', unit: 'ngày', quantity: 4, unitPrice: 380_000_000, source: 'STATE' },
      { item: 'Thiết kế + thi công 700 gian hàng', unit: 'gói', quantity: 1, unitPrice: 980_000_000, source: 'STATE' },
      { item: 'Truyền thông quốc tế + roadshow', unit: 'gói', quantity: 1, unitPrice: 720_000_000, source: 'STATE' },
      { item: 'Sự kiện bên lề + giải thưởng', unit: 'gói', quantity: 1, unitPrice: 480_000_000, source: 'STATE' },
      { item: 'Đối ứng: vận hành + phối hợp', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'SELF' },
    ],
    pmEmail: 'lap.do@vietfores.org',
    submittedDaysAgo: 90,
    approvedDaysAgo: 50,
  },

  // ===========================================================================
  // CYCLE 2027 — 2 thêm TENTATIVE projects
  // ===========================================================================
  {
    code: 'XTTM-DEMO-2027-201',
    orgCode: 'VITAS',
    cycleYear: 2026, // belongs to active cycle parent
    year: 2027,
    name: 'Chương trình Dệt may Việt Nam Sustainability 2027 — Giai đoạn 2',
    kind: 'TRADE_INFO_EXPORT',
    status: 'TENTATIVE',
    industries: ['TEXTILE', 'GARMENT'],
    markets: ['EU'],
    countries: ['DEU'],
    promotions: ['BRAND_PROMOTION', 'TRADE_TRAINING'],
    startDate: null,
    endDate: null,
    quarter: null,
    budgetTotal: 2_800_000_000,
    objectiveText:
      'Giai đoạn 2 (2027) chương trình Dệt may bền vững Việt Nam: triển lãm CBAM-ready, đào tạo cho 300 doanh nghiệp.',
    contentText:
      'Tiếp nối 2026: tham dự Cinte Techtextil + workshop CBAM tại 5 thành phố + xây dựng VietGreen Textile Database.',
    planTasks: ['Khảo sát giai đoạn 1', 'Lập đề án 2027'],
    budgetItems: [
      { item: 'Tham dự Cinte Techtextil', unit: 'gói', quantity: 1, unitPrice: 980_000_000, source: 'STATE' },
      { item: 'Workshop 5 thành phố', unit: 'thành phố', quantity: 5, unitPrice: 220_000_000, source: 'STATE' },
      { item: 'Xây dựng database', unit: 'gói', quantity: 1, unitPrice: 580_000_000, source: 'STATE' },
      { item: 'Đối ứng: truyền thông', unit: 'gói', quantity: 1, unitPrice: 140_000_000, source: 'SELF' },
    ],
    pmEmail: 'minh.vu@vitas.org.vn',
  },
  {
    code: 'XTTM-DEMO-2027-202',
    orgCode: 'VICOFA',
    cycleYear: 2026,
    year: 2027,
    name: 'Vietnam Coffee Brand Worldwide 2027 — Phát triển thương hiệu cà phê VN tại EU',
    kind: 'TRADE_INFO_EXPORT',
    status: 'TENTATIVE',
    industries: ['COFFEE'],
    markets: ['EU'],
    countries: ['DEU', 'FRA', 'ITA'],
    promotions: ['BRAND_PROMOTION'],
    startDate: null,
    endDate: null,
    quarter: null,
    budgetTotal: 1_950_000_000,
    objectiveText:
      'Chiến lược thương hiệu Cà phê Việt 2027: pop-up store tại 4 thủ đô EU, tham dự Specialty Coffee Expo, MOU với 8 nhà rang xay châu Âu.',
    contentText:
      'Kết hợp pop-up store Berlin + Paris + Rome + Amsterdam, mỗi nơi 2 tuần, kèm chiến dịch truyền thông số.',
    planTasks: ['Lập đề án 2027', 'Khảo sát thị trường'],
    budgetItems: [
      { item: 'Pop-up store 4 thủ đô EU', unit: 'thủ đô', quantity: 4, unitPrice: 280_000_000, source: 'STATE' },
      { item: 'Specialty Coffee Expo Birmingham', unit: 'gói', quantity: 1, unitPrice: 480_000_000, source: 'STATE' },
      { item: 'Truyền thông số quốc tế 6 tháng', unit: 'tháng', quantity: 6, unitPrice: 45_000_000, source: 'STATE' },
      { item: 'Đối ứng: tài liệu + ấn phẩm', unit: 'gói', quantity: 1, unitPrice: 200_000_000, source: 'SELF' },
    ],
    pmEmail: 'hai.nguyen@vicofa.org.vn',
  },
];

// =============================================================================
// SEED FUNCTION
// =============================================================================

export async function seedDemoBulk(prisma: PrismaClient): Promise<void> {
  // Resolve users
  const banql = await prisma.user.findUnique({ where: { username: 'banql' }, select: { id: true } });
  const chuyenvien = await prisma.user.findUnique({
    where: { username: 'chuyenvien' },
    select: { id: true },
  });
  const chuyenvien2 = await prisma.user.findUnique({
    where: { username: 'chuyenvien2' },
    select: { id: true },
  });
  const chuyenvien3 = await prisma.user.findUnique({
    where: { username: 'chuyenvien3' },
    select: { id: true },
  });
  const taichinh = await prisma.user.findUnique({
    where: { username: 'taichinh' },
    select: { id: true },
  });

  if (!banql || !taichinh) {
    console.warn('[demo-bulk] missing users — skip');
    return;
  }

  // Resolve cycles
  const cycles = await prisma.programCycle.findMany({
    select: { id: true, year: true },
  });
  const cycleByYear = new Map(cycles.map((c) => [c.year, c.id]));

  // Resolve all orgs
  const orgs = await prisma.organization.findMany({
    select: { id: true, code: true },
  });
  const orgByCode = new Map(orgs.map((o) => [o.code, o.id]));

  // Resolve catalogs
  const [industrySectors, markets, countries, promotionTypes, criteria] =
    await Promise.all([
      prisma.industrySector.findMany({ select: { id: true, code: true } }),
      prisma.market.findMany({ select: { id: true, code: true } }),
      prisma.country.findMany({ select: { id: true, code: true } }),
      prisma.promotionType.findMany({ select: { id: true, code: true } }),
      prisma.scoringCriterion.findMany({
        select: { id: true, code: true, weight: true, parentId: true },
      }),
    ]);
  const sectorIdByCode = new Map(industrySectors.map((x) => [x.code, x.id]));
  const marketIdByCode = new Map(markets.map((x) => [x.code, x.id]));
  const countryIdByCode = new Map(countries.map((x) => [x.code, x.id]));
  const promotionIdByCode = new Map(promotionTypes.map((x) => [x.code, x.id]));

  // Resolve OrgProfile contacts for pm resolution
  const profiles = await prisma.organizationProfile.findMany({
    select: { id: true, organizationId: true, contactsJson: true },
  });
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
      /* ignore */
    }
  }

  // ---------------------------------------------------------------------------
  // PASS 1: Insert/upsert all DEMO_PROJECTS
  // ---------------------------------------------------------------------------
  let projectsCreated = 0;
  for (const p of DEMO_PROJECTS) {
    const cycleId = cycleByYear.get(p.cycleYear);
    const orgId = orgByCode.get(p.orgCode);
    if (!cycleId || !orgId) {
      console.warn(`[demo-bulk] skip ${p.code} — cycle or org not found`);
      continue;
    }

    const industrySectorIds = p.industries
      .map((c) => sectorIdByCode.get(c))
      .filter((id): id is string => Boolean(id));
    const marketIds = p.markets
      .map((c) => marketIdByCode.get(c))
      .filter((id): id is string => Boolean(id));
    const countryIds = p.countries
      .map((c) => countryIdByCode.get(c))
      .filter((id): id is string => Boolean(id));
    const promotionTypeIds = p.promotions
      .map((c) => promotionIdByCode.get(c))
      .filter((id): id is string => Boolean(id));

    // Build budget rows
    const budgetRows = p.budgetItems.map((b) => ({
      id: randomUUID(),
      ...b,
      amount: b.quantity * b.unitPrice,
    }));
    const totalState = budgetRows
      .filter((r) => r.source === 'STATE')
      .reduce((a, r) => a + r.amount, 0);
    const totalSelf = budgetRows
      .filter((r) => r.source === 'SELF')
      .reduce((a, r) => a + r.amount, 0);
    const total = totalState + totalSelf;

    const planRows = p.planTasks.map((t, i) => ({
      id: randomUUID(),
      task: t,
      deliverable: `Deliverable cho hạng mục ${i + 1}`,
      dueDate: null,
      owner: 'Phòng Tổ chức',
    }));

    const generalInfoJson = JSON.stringify({
      industrySectorIds,
      marketIds,
      countryIds,
      promotionTypeIds,
      timeRange:
        p.startDate || p.endDate
          ? { start: p.startDate ?? null, end: p.endDate ?? null, quarter: p.quarter ?? null }
          : null,
      isTwoYear: p.isTwoYear ?? false,
      nextYear: null,
    });
    const objectivesJson = JSON.stringify({
      objective: `<p>${p.objectiveText}</p>`,
      content: `<p>${p.contentText}</p>`,
    });
    const planJson = JSON.stringify({ rows: planRows });
    const budgetJson = JSON.stringify({ rows: budgetRows, totalState, totalSelf, total });

    // Resolve pmContactId
    let pmContactId: string | null = null;
    if (p.pmEmail) {
      pmContactId = contactIdByOrgEmail.get(`${orgId}:${p.pmEmail}`) ?? null;
    }

    // Resolve parent
    let parentProjectId: string | null = null;
    if (p.parentCode) {
      const parent = await prisma.project.findUnique({
        where: { code: p.parentCode },
        select: { id: true },
      });
      parentProjectId = parent?.id ?? null;
    }

    const submittedAt =
      p.submittedDaysAgo !== undefined ? daysAgo(p.submittedDaysAgo) : null;
    const receivedAt =
      p.receivedDaysAgo !== undefined ? daysAgo(p.receivedDaysAgo) : null;
    const assignedAt =
      p.assignedDaysAgo !== undefined ? daysAgo(p.assignedDaysAgo) : null;
    const approvedBudget =
      p.status === 'APPROVED' ||
      p.status === 'IN_PROGRESS' ||
      p.status === 'COMPLETED'
        ? total
        : null;

    // Round-robin reviewer assignment
    const reviewerCandidates = [chuyenvien?.id, chuyenvien2?.id, chuyenvien3?.id].filter(
      (id): id is string => Boolean(id),
    );
    const reviewerIdx = projectsCreated % Math.max(1, reviewerCandidates.length);
    const assignedReviewerId = assignedAt
      ? (reviewerCandidates[reviewerIdx] ?? null)
      : null;

    const baseData = {
      programCycleId: cycleId,
      organizationId: orgId,
      parentProjectId,
      name: p.name,
      year: p.year,
      kind: p.kind,
      status: p.status,
      generalInfoJson,
      objectivesJson,
      planJson,
      budgetJson,
      pmContactId,
      proposedBudget: total,
      approvedBudget,
      submittedAt,
      receivedAt,
      assignedAt,
      assignedById: assignedAt ? banql.id : null,
      assignedReviewerId,
      passedFormalCheck: p.passedFormalCheck ?? false,
      searchKey: removeDiacritics(`${p.name} ${p.kind} ${p.code}`),
      currentVersion: p.status === 'DRAFT' || p.status === 'TENTATIVE' ? 1 : 2,
    };

    await prisma.project.upsert({
      where: { code: p.code },
      update: baseData,
      create: { code: p.code, ...baseData },
    });
    projectsCreated++;
  }
  logSeedStep('Demo projects', projectsCreated);

  // ---------------------------------------------------------------------------
  // PASS 2: Create CONTRACTS for COMPLETED + APPROVED + IN_PROGRESS demo projects
  // (skip projects already covered by the existing contracts-and-amendments.ts)
  // ---------------------------------------------------------------------------
  const completedProjects = await prisma.project.findMany({
    where: {
      code: { startsWith: DEMO_CODE_PREFIX },
      status: { in: ['COMPLETED', 'APPROVED', 'IN_PROGRESS'] },
      contract: null,
    },
    select: {
      id: true,
      code: true,
      status: true,
      organizationId: true,
      proposedBudget: true,
      approvedBudget: true,
    },
    orderBy: { code: 'asc' },
  });

  const yearNow = new Date().getFullYear();
  // Find next available sequence to avoid collision with main contract seed
  const existingContracts = await prisma.contract.findMany({
    where: { contractNo: { startsWith: `XTTM/${yearNow}/` } },
    select: { contractNo: true },
  });
  let nextSeq = 100; // start demo contracts at /100 to avoid collision
  for (const c of existingContracts) {
    const tail = c.contractNo.slice(`XTTM/${yearNow}/`.length);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n) && n >= nextSeq) nextSeq = n + 1;
  }

  let contractsCreated = 0;
  for (const proj of completedProjects) {
    const value = proj.approvedBudget ?? proj.proposedBudget ?? 1_000_000_000;
    let contractNo = formatContractNumber(yearNow, nextSeq++);
    // Ensure unique
    let attempts = 0;
    while (
      await prisma.contract.findUnique({ where: { contractNo } })
    ) {
      contractNo = formatContractNumber(yearNow, nextSeq++);
      attempts++;
      if (attempts > 30) break;
    }

    let status: 'SIGNED' | 'IN_PROGRESS' | 'LIQUIDATED' = 'SIGNED';
    let signedDaysAgo = 60;
    if (proj.status === 'COMPLETED') {
      status = 'LIQUIDATED';
      signedDaysAgo = 200;
    } else if (proj.status === 'IN_PROGRESS') {
      status = 'IN_PROGRESS';
      signedDaysAgo = 80;
    }

    await prisma.contract.create({
      data: {
        projectId: proj.id,
        organizationId: proj.organizationId,
        contractNo,
        totalValue: value,
        status,
        signedDate: daysAgo(signedDaysAgo),
        signedById: banql.id,
        scanFileUrl: '/mock-files/hop-dong-mau.pdf',
        effectiveFrom: daysAgo(signedDaysAgo),
        effectiveTo: daysAgo(signedDaysAgo - 180),
        termsHtml:
          '<h3>Điều 1.</h3><p>Hợp đồng demo enrichment data — XTTM 2025/2026.</p>',
      },
    });
    contractsCreated++;
  }

  // Add 1 special "DRAFT contract overdue 65d" to demo 60d warning
  const approved2026 = await prisma.project.findFirst({
    where: {
      code: { startsWith: DEMO_CODE_PREFIX },
      status: 'APPROVED',
      contract: null,
    },
    select: {
      id: true,
      code: true,
      organizationId: true,
      proposedBudget: true,
    },
    orderBy: { code: 'asc' },
  });
  if (approved2026) {
    let contractNo = formatContractNumber(yearNow, nextSeq++);
    while (await prisma.contract.findUnique({ where: { contractNo } })) {
      contractNo = formatContractNumber(yearNow, nextSeq++);
    }
    await prisma.contract.create({
      data: {
        projectId: approved2026.id,
        organizationId: approved2026.organizationId,
        contractNo,
        totalValue: approved2026.proposedBudget ?? 1_000_000_000,
        status: 'DRAFT',
        termsHtml:
          '<h3>Điều 1.</h3><p>HĐ DRAFT chưa ký — demo cảnh báo 60 ngày sau quyết định.</p>',
      },
    });
    contractsCreated++;
  }
  logSeedStep('Demo contracts', contractsCreated);

  // ---------------------------------------------------------------------------
  // PASS 3: Implementation plans for IN_PROGRESS + COMPLETED projects
  // ---------------------------------------------------------------------------
  const implTargets = await prisma.project.findMany({
    where: {
      code: { startsWith: DEMO_CODE_PREFIX },
      status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      implementationJson: null,
    },
    select: { id: true, code: true, status: true },
  });
  let implCreated = 0;
  for (const proj of implTargets) {
    const milestones = [
      {
        id: `m-${proj.id}-0`,
        title: 'Khảo sát + tuyển chọn doanh nghiệp tham gia',
        startDate: daysAgo(120).toISOString().slice(0, 10),
        endDate: daysAgo(95).toISOString().slice(0, 10),
        owner: 'Phòng XTTM',
        progress: 100,
        note: 'Đã hoàn thành tuyển chọn doanh nghiệp.',
        status: 'DONE',
      },
      {
        id: `m-${proj.id}-1`,
        title: 'Thiết kế + thi công gian hàng / chuẩn bị tài liệu',
        startDate: daysAgo(95).toISOString().slice(0, 10),
        endDate: daysAgo(60).toISOString().slice(0, 10),
        owner: 'Phòng Tổ chức',
        progress: 100,
        note: 'Hoàn tất thiết kế.',
        status: 'DONE',
      },
      {
        id: `m-${proj.id}-2`,
        title: 'Vận chuyển + dựng gian hàng / triển khai sự kiện',
        startDate: daysAgo(60).toISOString().slice(0, 10),
        endDate: daysAgo(30).toISOString().slice(0, 10),
        owner: 'Logistics',
        progress: proj.status === 'COMPLETED' ? 100 : 70,
        note: proj.status === 'COMPLETED' ? 'Hoàn tất triển khai.' : 'Đang triển khai sự kiện.',
        status: proj.status === 'COMPLETED' ? 'DONE' : 'IN_PROGRESS',
      },
      {
        id: `m-${proj.id}-3`,
        title: 'Nghiệm thu + báo cáo + tổng kết',
        startDate: daysAgo(30).toISOString().slice(0, 10),
        endDate: daysFromNow(15).toISOString().slice(0, 10),
        owner: 'Phòng Tổng hợp',
        progress: proj.status === 'COMPLETED' ? 100 : 30,
        note: '',
        status:
          proj.status === 'COMPLETED'
            ? 'DONE'
            : 'IN_PROGRESS',
      },
    ];
    await prisma.project.update({
      where: { id: proj.id },
      data: {
        implementationJson: JSON.stringify({
          milestones,
          staff: [
            {
              id: 'st-1',
              name: 'Trưởng đoàn',
              role: 'Trưởng đoàn',
              phone: '0901234567',
              email: 'lead@example.vn',
            },
            {
              id: 'st-2',
              name: 'Điều phối viên',
              role: 'Điều phối',
              phone: '0907654321',
              email: 'coord@example.vn',
            },
          ],
          schedule: {
            start: daysAgo(120).toISOString().slice(0, 10),
            end: daysFromNow(15).toISOString().slice(0, 10),
            note: 'Triển khai theo kế hoạch.',
          },
        }),
      },
    });
    implCreated++;
  }
  logSeedStep('Demo implementation plans', implCreated);

  // ---------------------------------------------------------------------------
  // PASS 4: International consulate contact for 2 demo projects (Korea + EU)
  // ---------------------------------------------------------------------------
  const koreaProject = await prisma.project.findUnique({
    where: { code: 'XTTM-DEMO-2025-003' }, // Korea coffee delegation, COMPLETED
    select: { id: true },
  });
  if (koreaProject) {
    await prisma.project.update({
      where: { id: koreaProject.id },
      data: {
        contactedConsulate: true,
        consulateContactJson: JSON.stringify({
          countryName: 'Hàn Quốc',
          contactName: 'Phạm Quang Niệm',
          contactTitle: 'Tham tán Thương mại',
          contactPhone: '+82-2-3471-1280',
          contactEmail: 'thuongvu.han@moit.gov.vn',
          contactDate: daysAgo(380).toISOString().slice(0, 10),
          note: 'Đã trao đổi về kế hoạch đoàn cà phê + lịch hẹn buyer Hàn Quốc.',
        }),
      },
    });
  }

  // International event coming soon — Imm Cologne 2026 — chưa contacted (cảnh báo 30d trigger)
  const cologneProject = await prisma.project.findUnique({
    where: { code: 'XTTM-DEMO-2026-105' }, // Đoàn gỗ Cologne, SUBMITTED
    select: { id: true },
  });
  if (cologneProject) {
    // Để contactedConsulate=false để tạo cảnh báo
  }

  // ---------------------------------------------------------------------------
  // PASS 5: Reports + Acceptance Records + Financial Records
  // ---------------------------------------------------------------------------
  const completedDemoProjects = await prisma.project.findMany({
    where: {
      code: { startsWith: DEMO_CODE_PREFIX },
      status: 'COMPLETED',
    },
    select: { id: true, code: true, contract: { select: { id: true, totalValue: true } } },
  });

  // Cleanup previous demo records
  await prisma.financialRecord.deleteMany({
    where: { recordNumber: { startsWith: 'DEMO-' } },
  });
  await prisma.acceptanceRecord.deleteMany({
    where: { recordNumber: { contains: 'DEMO' } },
  });
  await prisma.report.deleteMany({
    where: { title: { startsWith: '[DEMO]' } },
  });

  let reportsCreated = 0;
  let acceptanceCreated = 0;
  let financialCreated = 0;
  let recordSeq = 100;

  for (let idx = 0; idx < completedDemoProjects.length; idx++) {
    const proj = completedDemoProjects[idx];
    if (!proj) continue;
    const reportStatus =
      idx === 0 ? 'APPROVED' : idx === 1 ? 'SUBMITTED' : idx === 2 ? 'RETURNED' : idx === 3 ? 'DRAFT' : 'APPROVED';

    const quantitative = {
      rows: [
        {
          id: 'qr-companies',
          name: 'Số doanh nghiệp tham gia',
          unit: 'doanh nghiệp',
          planned: 25,
          actual: 22 + idx,
          note: '',
        },
        {
          id: 'qr-contracts',
          name: 'Số hợp đồng/MOU ký kết',
          unit: 'hợp đồng',
          planned: 15,
          actual: 12 + idx,
          note: '',
        },
        {
          id: 'qr-revenue',
          name: 'Doanh thu/giá trị giao dịch',
          unit: 'triệu USD',
          planned: 8,
          actual: 6 + idx * 0.5,
          note: '',
        },
        {
          id: 'qr-buyers',
          name: 'Số đối tác tiếp xúc',
          unit: 'lượt',
          planned: 200,
          actual: 220 + idx * 10,
          note: '',
        },
      ],
    };

    const r = await prisma.report.create({
      data: {
        projectId: proj.id,
        title: `[DEMO] Báo cáo kết quả ${proj.code}`,
        reportType: 'FINAL',
        quantitativeJson: JSON.stringify(quantitative),
        qualitativeHtml: `<p>Báo cáo demo cho đề án ${proj.code}. Đề án đã triển khai theo kế hoạch.</p>`,
        attendingCompaniesCount: 22 + idx,
        status: reportStatus,
        submittedAt: daysAgo(45 - idx * 5),
        reviewedById: reportStatus === 'APPROVED' || reportStatus === 'RETURNED' ? banql.id : null,
        reviewedAt: reportStatus === 'APPROVED' || reportStatus === 'RETURNED' ? daysAgo(35 - idx * 5) : null,
        reviewComments:
          reportStatus === 'APPROVED'
            ? 'Báo cáo đầy đủ, đề nghị tiến hành nghiệm thu.'
            : reportStatus === 'RETURNED'
              ? 'Báo cáo còn thiếu phụ lục số liệu định lượng. Đề nghị bổ sung và nộp lại.'
              : null,
      },
    });
    reportsCreated++;

    // AcceptanceRecord cho 3 reports đầu tiên (status APPROVED)
    if (reportStatus === 'APPROVED' && acceptanceCreated < 4) {
      const result =
        acceptanceCreated < 3 ? 'PASS' : 'PARTIAL';
      await prisma.acceptanceRecord.create({
        data: {
          projectId: proj.id,
          reportId: r.id,
          recordNumber: `${String(recordSeq++).padStart(3, '0')}/BB-NT-XTTM/2026-DEMO`,
          recordDate: daysAgo(25 - idx * 3),
          result,
          comments:
            result === 'PASS'
              ? 'Đề án triển khai thành công, đạt và vượt các chỉ tiêu kế hoạch.'
              : 'Đề án hoàn thành cơ bản, một số chỉ tiêu chưa đạt do yếu tố thị trường.',
          scannedFileUrl: '/mock-files/hop-dong-mau.pdf',
          liquidationDate: result === 'PASS' ? daysAgo(15 - idx * 2) : null,
          liquidationFileUrl: result === 'PASS' ? '/mock-files/hop-dong-mau.pdf' : null,
          createdById: banql.id,
        },
      });
      acceptanceCreated++;
    }

    // Financial records cho 4 projects đầu (ADVANCE + PAYMENT + SETTLEMENT)
    if (proj.contract && financialCreated < 12) {
      const value = proj.contract.totalValue;
      const advanceAmount = Math.round(value * 0.5);
      const paymentAmount = Math.round(value * 0.4);
      const settlementAmount = Math.round(value * 0.1);

      // ADVANCE — DISBURSED
      await prisma.financialRecord.create({
        data: {
          projectId: proj.id,
          contractId: proj.contract.id,
          recordType: 'ADVANCE',
          recordNumber: `DEMO-TU-${String(recordSeq++).padStart(3, '0')}`,
          amount: advanceAmount,
          status: 'DISBURSED',
          submittedAt: daysAgo(180),
          approvedById: banql.id,
          approvedAt: daysAgo(175),
          disbursedAt: daysAgo(170),
          transactionDate: daysAgo(170),
          notes: 'Tạm ứng 50% giá trị hợp đồng sau khi ký kết.',
          createdById: taichinh.id,
        },
      });
      financialCreated++;

      // PAYMENT — APPROVED hoặc DISBURSED
      const payStatus = idx % 2 === 0 ? 'APPROVED' : 'DISBURSED';
      await prisma.financialRecord.create({
        data: {
          projectId: proj.id,
          contractId: proj.contract.id,
          recordType: 'PAYMENT',
          recordNumber: `DEMO-PT-${String(recordSeq++).padStart(3, '0')}`,
          amount: paymentAmount,
          status: payStatus,
          submittedAt: daysAgo(40),
          approvedById: banql.id,
          approvedAt: daysAgo(30),
          disbursedAt: payStatus === 'DISBURSED' ? daysAgo(25) : null,
          transactionDate: payStatus === 'DISBURSED' ? daysAgo(25) : null,
          notes: 'Thanh toán 40% giá trị hợp đồng sau nghiệm thu.',
          createdById: taichinh.id,
        },
      });
      financialCreated++;

      // SETTLEMENT — SETTLED hoặc APPROVED hoặc DRAFT
      const settleStatus =
        idx === 0 ? 'SETTLED' : idx === 1 ? 'SETTLED' : idx === 2 ? 'APPROVED' : 'DRAFT';
      await prisma.financialRecord.create({
        data: {
          projectId: proj.id,
          contractId: proj.contract.id,
          recordType: 'SETTLEMENT',
          recordNumber: `DEMO-QT-${String(recordSeq++).padStart(3, '0')}`,
          amount: settlementAmount,
          status: settleStatus,
          submittedAt: settleStatus !== 'DRAFT' ? daysAgo(20) : null,
          approvedById: settleStatus !== 'DRAFT' ? banql.id : null,
          approvedAt: settleStatus !== 'DRAFT' ? daysAgo(10) : null,
          notes: 'Quyết toán phần kinh phí còn lại.',
          createdById: taichinh.id,
        },
      });
      financialCreated++;
    }
  }
  logSeedStep('Demo reports', reportsCreated);
  logSeedStep('Demo acceptance records', acceptanceCreated);
  logSeedStep('Demo financial records', financialCreated);

  // ---------------------------------------------------------------------------
  // PASS 6: Additional ProjectAmendments
  // ---------------------------------------------------------------------------
  const completedProjectsForAmend = await prisma.project.findMany({
    where: {
      code: { startsWith: DEMO_CODE_PREFIX },
      status: { in: ['COMPLETED', 'APPROVED', 'IN_PROGRESS'] },
    },
    select: { id: true, code: true, organizationId: true, organization: { select: { users: { select: { id: true }, take: 1 } } } },
    take: 8,
  });
  await prisma.projectAmendment.deleteMany({
    where: { reason: { startsWith: 'DEMO-AMEND-' } },
  });
  let amendmentsCreated = 0;
  const amendTypes: Array<{
    type: string;
    isCritical: boolean;
    status: 'PENDING' | 'APPROVED' | 'RESUBMIT_EVALUATION';
    reasonSuffix: string;
    oldValue: unknown;
    newValue: unknown;
  }> = [
    {
      type: 'TIME',
      isCritical: false,
      status: 'APPROVED',
      reasonSuffix: 'TIME-1',
      oldValue: { start: '2026-09-01' },
      newValue: { start: '2026-09-15' },
    },
    {
      type: 'LOCATION',
      isCritical: false,
      status: 'APPROVED',
      reasonSuffix: 'LOC-1',
      oldValue: 'Hà Nội',
      newValue: 'TP.HCM',
    },
    {
      type: 'UNIT_NAME',
      isCritical: false,
      status: 'APPROVED',
      reasonSuffix: 'UNIT-1',
      oldValue: 'Phòng XTTM',
      newValue: 'Phòng Tổ chức Hội chợ',
    },
    {
      type: 'PROJECT_NAME',
      isCritical: false,
      status: 'PENDING',
      reasonSuffix: 'NAME-1',
      oldValue: 'Tên cũ',
      newValue: 'Tên mới đề xuất',
    },
    {
      type: 'OBJECTIVE',
      isCritical: true,
      status: 'RESUBMIT_EVALUATION',
      reasonSuffix: 'OBJ-1',
      oldValue: 'Mục tiêu cũ',
      newValue: 'Mục tiêu mở rộng quy mô',
    },
    {
      type: 'BUDGET',
      isCritical: true,
      status: 'RESUBMIT_EVALUATION',
      reasonSuffix: 'BUD-1',
      oldValue: { total: 2_000_000_000 },
      newValue: { total: 2_800_000_000 },
    },
    {
      type: 'MARKET',
      isCritical: true,
      status: 'APPROVED',
      reasonSuffix: 'MKT-1',
      oldValue: ['EU'],
      newValue: ['EU', 'US'],
    },
    {
      type: 'CONTENT',
      isCritical: true,
      status: 'PENDING',
      reasonSuffix: 'CNT-1',
      oldValue: 'Nội dung cũ',
      newValue: 'Nội dung mở rộng',
    },
  ];
  for (let i = 0; i < Math.min(amendTypes.length, completedProjectsForAmend.length); i++) {
    const at = amendTypes[i];
    const proj = completedProjectsForAmend[i];
    if (!at || !proj) continue;
    const requestedById = proj.organization.users[0]?.id ?? banql.id;
    const decisionDate = at.status === 'APPROVED' ? daysAgo(30) : null;
    await prisma.projectAmendment.create({
      data: {
        projectId: proj.id,
        amendmentType: at.type,
        isCritical: at.isCritical,
        oldValueJson: JSON.stringify(at.oldValue),
        newValueJson: JSON.stringify(at.newValue),
        reason: `DEMO-AMEND-${at.reasonSuffix} — Đơn vị đề nghị điều chỉnh ${at.type.toLowerCase()} của đề án để phù hợp tình hình thực tế. Sau khi rà soát, các thay đổi không ảnh hưởng tới mục tiêu chính của đề án và đảm bảo hiệu quả triển khai.`,
        status: at.status,
        decisionNumber: at.status === 'APPROVED' ? `DEMO-DC/2026/${String(i + 1).padStart(3, '0')}` : null,
        decisionDate,
        reviewedById: at.status === 'APPROVED' ? banql.id : null,
        reviewedAt: decisionDate,
        requestedById,
      },
    });
    amendmentsCreated++;
  }
  logSeedStep('Demo amendments', amendmentsCreated);

  // ---------------------------------------------------------------------------
  // PASS 7: Additional EvaluationCouncil — 2025 historical (LOCKED) + 2026 Lần 2
  // ---------------------------------------------------------------------------
  const cycle2025Id = cycleByYear.get(2025);
  const cycle2026Id = cycleByYear.get(2026);

  if (cycle2025Id) {
    const COUNCIL_2025_NAME = 'Hội đồng Thẩm định Chương trình XTTM Quốc gia 2025 — Kỳ 1 (Lịch sử)';
    let council2025 = await prisma.evaluationCouncil.findFirst({
      where: { programCycleId: cycle2025Id, name: COUNCIL_2025_NAME },
    });
    if (!council2025) {
      council2025 = await prisma.evaluationCouncil.create({
        data: {
          programCycleId: cycle2025Id,
          name: COUNCIL_2025_NAME,
          term: 'Lần 1',
          lockStatus: 'LOCKED',
          status: 'CLOSED',
          openAt: daysAgo(440),
          closeAt: daysAgo(380),
          createdById: banql.id,
        },
      });
    }

    // Members
    const hd = await prisma.user.findUnique({ where: { username: 'hoidong' }, select: { id: true } });
    const hd2 = await prisma.user.findUnique({ where: { username: 'hoidong2' }, select: { id: true } });
    const hd3 = await prisma.user.findUnique({ where: { username: 'hoidong3' }, select: { id: true } });
    const memberSpecs = [
      hd?.id && { userId: hd.id, role: 'CHU_TICH' },
      hd2?.id && { userId: hd2.id, role: 'PHO' },
      hd3?.id && { userId: hd3.id, role: 'UY_VIEN' },
    ].filter((x): x is { userId: string; role: string } => Boolean(x));
    for (const m of memberSpecs) {
      await prisma.councilMember.upsert({
        where: { councilId_userId: { councilId: council2025.id, userId: m.userId } },
        update: { role: m.role },
        create: { councilId: council2025.id, userId: m.userId, role: m.role },
      });
    }

    // Assign 5 cycle-2025 COMPLETED projects + 1 REJECTED_FINAL
    const cycle2025Projects = await prisma.project.findMany({
      where: {
        programCycleId: cycle2025Id,
        status: { in: ['COMPLETED', 'APPROVED', 'REJECTED_FINAL'] },
      },
      select: { id: true },
      take: 6,
    });
    for (const p of cycle2025Projects) {
      await prisma.projectCouncilAssignment.upsert({
        where: { councilId_projectId: { councilId: council2025.id, projectId: p.id } },
        update: {},
        create: { councilId: council2025.id, projectId: p.id },
      });
    }

    // Score sheets (SUBMITTED) from each member on each project — partial demo
    for (const p of cycle2025Projects.slice(0, 4)) {
      for (const m of memberSpecs) {
        const existing = await prisma.scoreSheet.findFirst({
          where: { projectId: p.id, reviewerId: m.userId, kind: 'EVALUATION' },
        });
        if (existing) continue;
        const sanitized: Array<{ criterionId: string; score: number; comment?: string }> = [];
        const sampleCodes = [
          'CRIT_FIT_DIRECTION',
          'CRIT_FIT_INDUSTRY',
          'CRIT_FEAS_CAPACITY',
          'CRIT_IMPACT_ECONOMIC',
        ];
        for (const code of sampleCodes) {
          const c = criteria.find((x) => x.code === code);
          if (c)
            sanitized.push({
              criterionId: c.id,
              score: 7.5 + Math.random() * 1.5,
            });
        }
        let totalScore = 0;
        for (const e of sanitized) {
          const c = criteria.find((x) => x.id === e.criterionId);
          if (c && c.parentId !== null) totalScore += (e.score / 10) * c.weight;
        }
        totalScore = Math.round(totalScore * 100) / 100;
        await prisma.scoreSheet.create({
          data: {
            councilId: council2025.id,
            projectId: p.id,
            reviewerId: m.userId,
            kind: 'EVALUATION',
            scoresJson: JSON.stringify(sanitized),
            totalScore,
            comment: 'Đề án đáp ứng yêu cầu, đề nghị phê duyệt.',
            status: 'SUBMITTED',
            submittedAt: daysAgo(395),
          },
        });
      }
    }
  }

  if (cycle2026Id) {
    const COUNCIL_2026_NAME =
      'Hội đồng Thẩm định Chương trình XTTM Quốc gia 2026 — Kỳ 2';
    let council2026Lan2 = await prisma.evaluationCouncil.findFirst({
      where: { programCycleId: cycle2026Id, name: COUNCIL_2026_NAME },
    });
    if (!council2026Lan2) {
      council2026Lan2 = await prisma.evaluationCouncil.create({
        data: {
          programCycleId: cycle2026Id,
          name: COUNCIL_2026_NAME,
          term: 'Lần 2',
          lockStatus: 'OPEN',
          status: 'OPEN',
          openAt: daysAgo(5),
          createdById: banql.id,
        },
      });
    }
    const hd = await prisma.user.findUnique({ where: { username: 'hoidong' }, select: { id: true } });
    const hd2 = await prisma.user.findUnique({ where: { username: 'hoidong2' }, select: { id: true } });
    const hd3 = await prisma.user.findUnique({ where: { username: 'hoidong3' }, select: { id: true } });
    const memberSpecs = [
      hd?.id && { userId: hd.id, role: 'PHO' },
      hd2?.id && { userId: hd2.id, role: 'CHU_TICH' },
      hd3?.id && { userId: hd3.id, role: 'UY_VIEN' },
    ].filter((x): x is { userId: string; role: string } => Boolean(x));
    for (const m of memberSpecs) {
      await prisma.councilMember.upsert({
        where: { councilId_userId: { councilId: council2026Lan2.id, userId: m.userId } },
        update: { role: m.role },
        create: { councilId: council2026Lan2.id, userId: m.userId, role: m.role },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // PASS 8: Inbox notifications — bổ sung cho các vai trò
  // ---------------------------------------------------------------------------
  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, role: true },
  });
  const userByUsername = new Map(allUsers.map((u) => [u.username, u]));

  // Cleanup demo notifications
  const demoSubjectPrefix = '[DEMO]';
  const existingDemoNotifs = await prisma.notification.findMany({
    where: { subject: { startsWith: demoSubjectPrefix } },
    select: { id: true },
  });
  if (existingDemoNotifs.length > 0) {
    const ids = existingDemoNotifs.map((n) => n.id);
    await prisma.notificationDispatch.deleteMany({
      where: { notificationId: { in: ids } },
    });
    await prisma.notification.deleteMany({ where: { id: { in: ids } } });
  }

  type Notif = {
    username: string;
    type: string;
    subject: string;
    content: string;
    daysAgo: number;
    read: boolean;
  };
  const demoNotifs: Notif[] = [
    // BANQL — additional
    { username: 'banql', type: 'NEW_PROJECT', subject: '[DEMO] Đề án mới: VIFA EXPO 2026 từ VIFOREST', content: '<p>Đơn vị VIFOREST nộp đề án mới VIFA EXPO 2026 — quy mô 700 gian hàng, ngân sách 4,28 tỷ VND.</p>', daysAgo: 1, read: false },
    { username: 'banql', type: 'NEW_PROJECT', subject: '[DEMO] Đề án mới: Vietnam Coffee Festival 2026', content: '<p>VICOFA nộp đề án Vietnam Coffee Festival 2026 tại Buôn Ma Thuột.</p>', daysAgo: 2, read: false },
    { username: 'banql', type: 'NEW_PROJECT', subject: '[DEMO] Đề án mới: Đoàn gỗ tham dự imm Cologne 2026', content: '<p>VIFOREST nộp đề án đoàn gỗ Cologne — cảnh báo: dưới 35 ngày tới sự kiện chưa liên hệ Thương vụ.</p>', daysAgo: 14, read: false },
    { username: 'banql', type: 'SLA_WARNING', subject: '[DEMO] Cảnh báo: 1 đề án quốc tế chưa liên hệ Thương vụ', content: '<p>Đề án XTTM-DEMO-2026-105 (Đoàn gỗ Cologne, sự kiện 19/1/2026) còn chưa liên hệ Thương vụ Việt Nam tại Berlin. Vui lòng đôn đốc đơn vị chủ trì.</p>', daysAgo: 0, read: false },
    { username: 'banql', type: 'GENERAL', subject: '[DEMO] Tổng kết quý: 5 đề án 2025 đã nghiệm thu', content: '<p>Đến cuối tháng 4/2026, đã hoàn tất nghiệm thu 5 đề án thuộc cycle 2025: Texworld Paris, Coffee Korea, High Point US, Seafood Brussels, Da giày Hội nghị.</p>', daysAgo: 5, read: true },
    { username: 'banql', type: 'GENERAL', subject: '[DEMO] Hội đồng Lần 2/2026 đã được thiết lập', content: '<p>Hội đồng Thẩm định Lần 2 năm 2026 đã được thiết lập với 3 thành viên. Sẵn sàng phân công đề án mới.</p>', daysAgo: 5, read: true },
    { username: 'banql', type: 'NEW_PROJECT', subject: '[DEMO] Đề án mới: Hội thảo Gạo Manila 2026', content: '<p>VFA nộp đề án đoàn Gạo Manila 2026.</p>', daysAgo: 6, read: true },

    // CHUYENVIEN — additional
    { username: 'chuyenvien', type: 'ASSIGNED', subject: '[DEMO] Phân công kiểm tra: VIFA EXPO 2026', content: '<p>Bạn được phân công kiểm tra hồ sơ VIFA EXPO 2026 (XTTM-DEMO-2026-109).</p>', daysAgo: 1, read: false },
    { username: 'chuyenvien', type: 'ASSIGNED', subject: '[DEMO] Phân công kiểm tra: Coffee Festival 2026', content: '<p>Bạn được phân công kiểm tra hồ sơ Vietnam Coffee Festival 2026.</p>', daysAgo: 3, read: false },
    { username: 'chuyenvien', type: 'GENERAL', subject: '[DEMO] Lịch họp tổng kết kỳ kiểm tra Q1', content: '<p>Họp tổng kết kỳ kiểm tra Q1/2026 sẽ tổ chức 14h ngày 10/05.</p>', daysAgo: 10, read: true },
    { username: 'chuyenvien2', type: 'ASSIGNED', subject: '[DEMO] Phân công kiểm tra: Đoàn Gỗ Cologne', content: '<p>Bạn được phân công kiểm tra đoàn gỗ Cologne — ưu tiên cao do sự kiện 19/1/2026.</p>', daysAgo: 14, read: false },
    { username: 'chuyenvien2', type: 'ASSIGNED', subject: '[DEMO] Phân công kiểm tra: Magic Las Vegas 2026', content: '<p>Bạn được phân công kiểm tra hồ sơ Magic Las Vegas Spring 2026.</p>', daysAgo: 12, read: false },
    { username: 'chuyenvien2', type: 'GENERAL', subject: '[DEMO] Tài liệu hướng dẫn cập nhật', content: '<p>Bộ tiêu chí kiểm tra hồ sơ vừa được cập nhật ngày 28/4/2026.</p>', daysAgo: 7, read: true },
    { username: 'chuyenvien3', type: 'ASSIGNED', subject: '[DEMO] Phân công kiểm tra: Hội thảo Gạo Indonesia', content: '<p>Bạn được phân công kiểm tra Hội thảo Gạo Indonesia 2026.</p>', daysAgo: 16, read: true },

    // HOIDONG
    { username: 'hoidong', type: 'COUNCIL_INVITATION', subject: '[DEMO] Mời tham gia Hội đồng Thẩm định 2026 Lần 2', content: '<p>BQL mời quý ông tham gia Hội đồng Thẩm định Lần 2 năm 2026 với vai trò Phó Chủ tịch.</p>', daysAgo: 5, read: false },
    { username: 'hoidong', type: 'REVIEW_DEADLINE', subject: '[DEMO] Sắp đến hạn chấm điểm: 4 đề án', content: '<p>Quý ông có 4 đề án trong Hội đồng Lần 2 năm 2026 chưa hoàn tất chấm điểm. Hạn chót: 15/5/2026.</p>', daysAgo: 2, read: false },
    { username: 'hoidong2', type: 'COUNCIL_INVITATION', subject: '[DEMO] Mời tham gia Hội đồng 2026 Lần 2 — Vai trò Chủ tịch', content: '<p>BQL mời quý ông tham gia Hội đồng Thẩm định Lần 2 năm 2026 với vai trò Chủ tịch.</p>', daysAgo: 5, read: true },
    { username: 'hoidong2', type: 'REVIEW_DEADLINE', subject: '[DEMO] Sắp đến hạn chấm điểm', content: '<p>Có 4 đề án trong Hội đồng Lần 2 năm 2026 chưa hoàn tất chấm điểm.</p>', daysAgo: 2, read: false },
    { username: 'hoidong3', type: 'COUNCIL_INVITATION', subject: '[DEMO] Mời tham gia Hội đồng 2026 Lần 2 — Vai trò Ủy viên', content: '<p>BQL mời quý bà tham gia Hội đồng Thẩm định Lần 2 năm 2026 với vai trò Ủy viên.</p>', daysAgo: 5, read: false },
    { username: 'hoidong3', type: 'GENERAL', subject: '[DEMO] Cập nhật tiêu chí chấm điểm 2026', content: '<p>Bộ tiêu chí chấm điểm thẩm định 2026 đã được cập nhật theo Nghị định mới.</p>', daysAgo: 8, read: true },

    // DONVI1 (LEFASO)
    { username: 'donvi1', type: 'APPROVAL_RESULT', subject: '[DEMO] Phê duyệt: Lineapelle Milano 2025', content: '<p>Đề án Lineapelle Milano 2025 (XTTM-DEMO-2025-008) đã được phê duyệt với kinh phí 1,58 tỷ VND. Đề nghị tiến hành ký HĐ trong 60 ngày.</p>', daysAgo: 365, read: true },
    { username: 'donvi1', type: 'SLA_WARNING', subject: '[DEMO] Cảnh báo: HĐ cần ký', content: '<p>Đề án XTTM-DEMO-2025-008 đã được phê duyệt nhưng chưa ký hợp đồng. Liên hệ Cục XTTM để xử lý.</p>', daysAgo: 305, read: true },
    { username: 'donvi1', type: 'SLA_WARNING', subject: '[DEMO] Cảnh báo: Báo cáo tổng hợp đến hạn', content: '<p>Đề án XTTM-DEMO-2025-006 (Hội nghị Da giày 2025) đã kết thúc 13/11/2025. Đề nghị nộp báo cáo tổng hợp.</p>', daysAgo: 130, read: true },
    { username: 'donvi1', type: 'SLA_WARNING', subject: '[DEMO] Cảnh báo: Liên hệ Thương vụ', content: '<p>Đề án MICAM Milano 2026 sự kiện 13/9/2026, dưới 35 ngày tới sự kiện. Vui lòng liên hệ Thương vụ Việt Nam tại Rome.</p>', daysAgo: 5, read: false },
    { username: 'donvi1', type: 'GENERAL', subject: '[DEMO] Hướng dẫn: Mẫu báo cáo tổng kết 2026', content: '<p>Mẫu báo cáo tổng kết đề án 2026 đã được cập nhật. Tải về tại trang Danh mục - Mẫu văn bản.</p>', daysAgo: 25, read: true },
    { username: 'donvi1', type: 'GENERAL', subject: '[DEMO] Mời tham dự: Hội nghị thường niên 2026', content: '<p>Cục XTTM kính mời đơn vị tham dự Hội nghị Tổng kết Chương trình XTTM Quốc gia 2025 ngày 20/5/2026.</p>', daysAgo: 12, read: true },
    { username: 'donvi1', type: 'APPROVAL_RESULT', subject: '[DEMO] Phê duyệt: GDS Düsseldorf 2025', content: '<p>Đề án GDS Düsseldorf 2025 đã được phê duyệt và hoàn tất triển khai.</p>', daysAgo: 290, read: true },
    { username: 'donvi1', type: 'GENERAL', subject: '[DEMO] Cảm ơn: Hoàn tất nghiệm thu 2025', content: '<p>Cám ơn LEFASO đã hoàn tất 2 đề án thuộc cycle 2025. Mời tham gia cycle 2026.</p>', daysAgo: 50, read: true },

    // DONVI2 (VITAS)
    { username: 'donvi2', type: 'APPROVAL_RESULT', subject: '[DEMO] Phê duyệt: Texworld Paris 2025', content: '<p>Đề án Texworld Paris 2025 (XTTM-DEMO-2025-002) đã được phê duyệt và hoàn tất nghiệm thu.</p>', daysAgo: 350, read: true },
    { username: 'donvi2', type: 'GENERAL', subject: '[DEMO] Đăng ký Cycle 2026 đã mở', content: '<p>Cycle 2026 đã mở đăng ký từ 1/4/2026. Hạn nộp: 30/5/2026.</p>', daysAgo: 28, read: true },
    { username: 'donvi2', type: 'SUPPLEMENT_REQUEST', subject: '[DEMO] Yêu cầu bổ sung: Đoàn Korea-Japan 2026', content: '<p>Đề án XTTM-2026-003 cần bổ sung: hợp đồng phiên dịch tiếng Hàn + tiếng Nhật. Đề nghị bổ sung trong 7 ngày.</p>', daysAgo: 8, read: false },
    { username: 'donvi2', type: 'GENERAL', subject: '[DEMO] Cập nhật tiêu chí đánh giá 2026', content: '<p>Tiêu chí đánh giá đề án 2026 vừa được cập nhật để đáp ứng yêu cầu CBAM EU.</p>', daysAgo: 18, read: true },
    { username: 'donvi2', type: 'APPROVAL_RESULT', subject: '[DEMO] Cập nhật trạng thái: Hội nghị Dệt may 2026', content: '<p>Đề án Hội nghị Dệt may 2026 đang trong giai đoạn DRAFT. Vui lòng hoàn tất khai báo.</p>', daysAgo: 22, read: true },
    { username: 'donvi2', type: 'GENERAL', subject: '[DEMO] Mời tham dự: Hội thảo CBAM EU', content: '<p>Cục XTTM phối hợp Bộ Tài chính tổ chức hội thảo CBAM EU ngày 25/5/2026.</p>', daysAgo: 10, read: true },

    // TAICHINH
    { username: 'taichinh', type: 'GENERAL', subject: '[DEMO] 4 hồ sơ tạm ứng chờ chi trả', content: '<p>Có 4 hồ sơ tạm ứng đã được BQL phê duyệt và chờ Tài chính chi trả.</p>', daysAgo: 1, read: false },
    { username: 'taichinh', type: 'GENERAL', subject: '[DEMO] Phê duyệt thanh toán XTTM-DEMO-2025-002', content: '<p>Hồ sơ thanh toán Texworld Paris 2025 đã được BQL phê duyệt — chờ chi trả qua KBNN.</p>', daysAgo: 30, read: true },
    { username: 'taichinh', type: 'GENERAL', subject: '[DEMO] Quyết toán XTTM-DEMO-2025-003', content: '<p>Hồ sơ quyết toán đoàn cà phê Hàn Quốc 2025 đã được phê duyệt SETTLED.</p>', daysAgo: 10, read: true },
    { username: 'taichinh', type: 'GENERAL', subject: '[DEMO] Báo cáo tài chính tháng 4/2026', content: '<p>Báo cáo tài chính tháng 4/2026 đã được Lãnh đạo Cục phê duyệt.</p>', daysAgo: 5, read: true },
    { username: 'taichinh', type: 'GENERAL', subject: '[DEMO] Hướng dẫn: Quyết toán cycle 2025', content: '<p>Hướng dẫn quyết toán cycle 2025 đã ban hành.</p>', daysAgo: 15, read: true },
    { username: 'taichinh', type: 'SLA_WARNING', subject: '[DEMO] Cảnh báo: 2 hồ sơ thanh toán quá hạn', content: '<p>Có 2 hồ sơ thanh toán đã được phê duyệt > 7 ngày nhưng chưa chi trả.</p>', daysAgo: 2, read: false },

    // LANHDAO
    { username: 'lanhdao', type: 'GENERAL', subject: '[DEMO] Báo cáo tổng kết Q1/2026', content: '<p>Báo cáo tổng kết Q1/2026 chương trình XTTM Quốc gia. Tổng ngân sách 95 tỷ, đã cam kết 32 tỷ.</p>', daysAgo: 3, read: false },
    { username: 'lanhdao', type: 'GENERAL', subject: '[DEMO] 5 đề án 2025 hoàn tất nghiệm thu', content: '<p>5 đề án thuộc cycle 2025 đã hoàn tất nghiệm thu thành công.</p>', daysAgo: 8, read: true },
    { username: 'lanhdao', type: 'SLA_WARNING', subject: '[DEMO] 2 đề án quốc tế chưa liên hệ Thương vụ', content: '<p>2 đề án quốc tế còn dưới 35 ngày tới sự kiện nhưng chưa liên hệ Thương vụ.</p>', daysAgo: 1, read: false },
    { username: 'lanhdao', type: 'GENERAL', subject: '[DEMO] Tờ trình mới chờ phê duyệt: 4 đề án', content: '<p>Có 1 tờ trình mới của Cục XTTM về việc phê duyệt 4 đề án XTTM 2026.</p>', daysAgo: 4, read: true },
    { username: 'lanhdao', type: 'GENERAL', subject: '[DEMO] Hội đồng Lần 2/2026 đã thiết lập', content: '<p>Hội đồng Thẩm định Lần 2 năm 2026 đã được thiết lập với 3 thành viên.</p>', daysAgo: 5, read: true },

    // ADMIN
    { username: 'admin', type: 'GENERAL', subject: '[DEMO] Báo cáo audit log tuần 18/2026', content: '<p>Tổng số sự kiện audit log tuần 18: 1.234. Không phát hiện hoạt động bất thường.</p>', daysAgo: 1, read: false },
    { username: 'admin', type: 'GENERAL', subject: '[DEMO] User mới được tạo: chuyenvien2, chuyenvien3', content: '<p>2 user mới được kích hoạt: Phạm Hồng Quân (chuyenvien2), Đinh Thị Thu Hương (chuyenvien3).</p>', daysAgo: 2, read: false },
    { username: 'admin', type: 'GENERAL', subject: '[DEMO] Cập nhật danh mục quốc gia', content: '<p>Danh mục Quốc gia đã thêm 5 nước mới: Bỉ, Hà Lan, Ba Lan, CH Séc, Hungary.</p>', daysAgo: 7, read: true },
    { username: 'admin', type: 'GENERAL', subject: '[DEMO] Sao lưu DB hoàn tất', content: '<p>Sao lưu cơ sở dữ liệu định kỳ hoàn tất lúc 02:00 ngày 30/4/2026.</p>', daysAgo: 1, read: true },
  ];

  let notifCreated = 0;
  for (const n of demoNotifs) {
    const u = userByUsername.get(n.username);
    if (!u) continue;
    const sentAt = daysAgo(n.daysAgo);
    const readAt = n.read ? daysAgo(Math.max(0, n.daysAgo - 1)) : null;
    const notif = await prisma.notification.create({
      data: {
        type: n.type,
        subject: n.subject,
        content: n.content,
        recipientType: 'USER',
        createdById: banql.id,
        createdAt: sentAt,
      },
    });
    await prisma.notificationDispatch.create({
      data: {
        notificationId: notif.id,
        recipientUserId: u.id,
        status: n.read ? 'READ' : 'SENT',
        sentAt,
        readAt,
      },
    });
    notifCreated++;
  }
  logSeedStep('Demo inbox notifications', notifCreated);
}
