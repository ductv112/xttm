import { PrismaClient } from '@prisma/client';
import { removeDiacritics } from '../../lib/vi-search';
import { logSeedStep } from './helpers';

/**
 * Seed 8 catalog tables với Vietnamese realistic data.
 * Idempotent qua upsert {where:{code},update,create}.
 *
 * Order matters cho hierarchical catalogs:
 * - OrgUnit: parents (BO_CT, VINATEX) trước children (CUC_XTTM, MAY10)
 * - ScoringCriterion: 4 group cha trước, 11 children resolve parentId qua lookup
 */

const sk = (...parts: string[]): string => removeDiacritics(parts.filter(Boolean).join(' '));

// All 8 ProjectKind codes — dùng cho ScoringCriterion.appliesToKinds (mọi tiêu chí áp dụng mọi kind)
const ALL_KIND_CODES = [
  'EXPORT_EXHIBITION',
  'INTL_CONFERENCE',
  'DOMESTIC_FAIR',
  'TRADE_DELEGATION_OUT',
  'TRADE_DELEGATION_IN',
  'TRADE_INFO_EXPORT',
  'TRADE_INFO_DOMESTIC',
  'TRAINING',
];

// =============================================================================
// CAT-01: ProjectKind (8 records)
// =============================================================================
async function seedProjectKinds(prisma: PrismaClient) {
  const data = [
    {
      code: 'EXPORT_EXHIBITION',
      name: 'Triển lãm xuất khẩu',
      description: 'Triển lãm/hội chợ tại nước ngoài quảng bá hàng Việt',
    },
    {
      code: 'INTL_CONFERENCE',
      name: 'Hội nghị quốc tế',
      description: 'Hội nghị/diễn đàn quốc tế về xúc tiến thương mại',
    },
    {
      code: 'DOMESTIC_FAIR',
      name: 'Hội chợ trong nước',
      description: 'Hội chợ thương mại tổ chức tại Việt Nam',
    },
    {
      code: 'TRADE_DELEGATION_OUT',
      name: 'Đoàn giao thương ra nước ngoài',
      description: 'Đoàn doanh nghiệp Việt đi khảo sát thị trường nước ngoài',
    },
    {
      code: 'TRADE_DELEGATION_IN',
      name: 'Đoàn giao thương vào Việt Nam',
      description: 'Đón đoàn nước ngoài vào tìm hiểu hàng Việt',
    },
    {
      code: 'TRADE_INFO_EXPORT',
      name: 'Thông tin TM tuyên truyền xuất khẩu',
      description: 'Truyền thông quảng bá hàng Việt ra thị trường nước ngoài',
    },
    {
      code: 'TRADE_INFO_DOMESTIC',
      name: 'Tuyên truyền trong nước',
      description: 'Tuyên truyền tiêu dùng hàng Việt tại Việt Nam',
    },
    {
      code: 'TRAINING',
      name: 'Đào tạo',
      description: 'Đào tạo kỹ năng XTTM cho doanh nghiệp',
    },
  ];

  for (const [i, item] of data.entries()) {
    const searchKey = sk(item.name, item.code);
    await prisma.projectKind.upsert({
      where: { code: item.code },
      update: { ...item, searchKey, displayOrder: i, isActive: true },
      create: { ...item, searchKey, displayOrder: i, isActive: true },
    });
  }

  const count = await prisma.projectKind.count();
  logSeedStep('ProjectKind', count);
}

// =============================================================================
// CAT-02: IndustrySector (20 records)
// =============================================================================
async function seedIndustrySectors(prisma: PrismaClient) {
  const data = [
    { code: 'TEXTILE', name: 'Dệt may' },
    { code: 'FOOTWEAR', name: 'Da giày' },
    { code: 'WOOD', name: 'Gỗ và sản phẩm gỗ' },
    { code: 'SEAFOOD', name: 'Thủy sản' },
    { code: 'AGRICULTURE', name: 'Nông sản' },
    { code: 'COFFEE', name: 'Cà phê' },
    { code: 'RUBBER', name: 'Cao su' },
    { code: 'RICE', name: 'Gạo' },
    { code: 'STEEL', name: 'Sắt thép' },
    { code: 'ELECTRONICS', name: 'Điện tử' },
    { code: 'HANDICRAFT', name: 'Thủ công mỹ nghệ' },
    { code: 'CASHEW', name: 'Hạt điều' },
    { code: 'PEPPER', name: 'Hồ tiêu' },
    { code: 'FRUITS', name: 'Rau quả' },
    { code: 'TEA', name: 'Chè' },
    { code: 'GARMENT', name: 'May mặc' },
    { code: 'LEATHER', name: 'Da và sản phẩm da' },
    { code: 'MECHANICAL', name: 'Cơ khí' },
    { code: 'PLASTIC', name: 'Nhựa' },
    { code: 'FOOD_PROCESSING', name: 'Chế biến thực phẩm' },
  ];

  for (const [i, item] of data.entries()) {
    const searchKey = sk(item.name, item.code);
    await prisma.industrySector.upsert({
      where: { code: item.code },
      update: { ...item, searchKey, displayOrder: i, isActive: true },
      create: { ...item, searchKey, displayOrder: i, isActive: true },
    });
  }

  const count = await prisma.industrySector.count();
  logSeedStep('IndustrySector', count);
}

// =============================================================================
// CAT-03: Market (15 records — region-grouped)
// =============================================================================
async function seedMarkets(prisma: PrismaClient) {
  const data = [
    { code: 'EU', name: 'Liên minh châu Âu', nameEn: 'European Union', region: 'EUROPE' },
    { code: 'US', name: 'Hoa Kỳ', nameEn: 'United States', region: 'AMERICAS' },
    { code: 'CHINA', name: 'Trung Quốc', nameEn: 'China', region: 'ASIA' },
    { code: 'JAPAN', name: 'Nhật Bản', nameEn: 'Japan', region: 'ASIA' },
    { code: 'KOREA', name: 'Hàn Quốc', nameEn: 'South Korea', region: 'ASIA' },
    { code: 'ASEAN', name: 'ASEAN', nameEn: 'ASEAN', region: 'ASIA' },
    { code: 'MIDDLE_EAST', name: 'Trung Đông', nameEn: 'Middle East', region: 'ASIA' },
    { code: 'INDIA', name: 'Ấn Độ', nameEn: 'India', region: 'ASIA' },
    { code: 'AUSTRALIA', name: 'Úc - New Zealand', nameEn: 'Australia & NZ', region: 'OCEANIA' },
    { code: 'RUSSIA', name: 'Liên bang Nga', nameEn: 'Russia', region: 'EUROPE' },
    { code: 'AFRICA', name: 'Châu Phi', nameEn: 'Africa', region: 'AFRICA' },
    { code: 'LATAM', name: 'Mỹ Latinh', nameEn: 'Latin America', region: 'AMERICAS' },
    { code: 'UK', name: 'Anh Quốc', nameEn: 'United Kingdom', region: 'EUROPE' },
    { code: 'CANADA', name: 'Canada', nameEn: 'Canada', region: 'AMERICAS' },
    { code: 'BRAZIL', name: 'Brazil', nameEn: 'Brazil', region: 'AMERICAS' },
  ];

  for (const [i, item] of data.entries()) {
    const searchKey = sk(item.name, item.nameEn ?? '', item.code);
    await prisma.market.upsert({
      where: { code: item.code },
      update: { ...item, searchKey, displayOrder: i, isActive: true },
      create: { ...item, searchKey, displayOrder: i, isActive: true },
    });
  }

  const count = await prisma.market.count();
  logSeedStep('Market', count);
}

// =============================================================================
// CAT-04: PromotionType (8 records)
// =============================================================================
async function seedPromotionTypes(prisma: PrismaClient) {
  const data = [
    { code: 'TRADE_FAIR', name: 'Hội chợ - triển lãm' },
    { code: 'BUSINESS_MATCHING', name: 'Kết nối giao thương' },
    { code: 'MARKET_RESEARCH', name: 'Nghiên cứu thị trường' },
    { code: 'BRAND_PROMOTION', name: 'Quảng bá thương hiệu' },
    { code: 'EXPORT_PROMOTION', name: 'Xúc tiến xuất khẩu' },
    { code: 'INVESTMENT_PROMOTION', name: 'Xúc tiến đầu tư' },
    { code: 'TRADE_TRAINING', name: 'Đào tạo XTTM' },
    { code: 'TRADE_COMMUNICATION', name: 'Truyền thông XTTM' },
  ];

  for (const [i, item] of data.entries()) {
    const searchKey = sk(item.name, item.code);
    await prisma.promotionType.upsert({
      where: { code: item.code },
      update: { ...item, searchKey, displayOrder: i, isActive: true },
      create: { ...item, searchKey, displayOrder: i, isActive: true },
    });
  }

  const count = await prisma.promotionType.count();
  logSeedStep('PromotionType', count);
}

// =============================================================================
// CAT-05: Country (30 records ISO alpha-3)
// =============================================================================
async function seedCountries(prisma: PrismaClient) {
  const data = [
    { code: 'VNM', name: 'Việt Nam', nameEn: 'Vietnam', region: 'ASIA', hasTradeOffice: false },
    { code: 'USA', name: 'Hoa Kỳ', nameEn: 'United States', region: 'AMERICAS', hasTradeOffice: true },
    { code: 'CHN', name: 'Trung Quốc', nameEn: 'China', region: 'ASIA', hasTradeOffice: true },
    { code: 'JPN', name: 'Nhật Bản', nameEn: 'Japan', region: 'ASIA', hasTradeOffice: true },
    { code: 'KOR', name: 'Hàn Quốc', nameEn: 'South Korea', region: 'ASIA', hasTradeOffice: true },
    { code: 'DEU', name: 'Đức', nameEn: 'Germany', region: 'EUROPE', hasTradeOffice: true },
    { code: 'FRA', name: 'Pháp', nameEn: 'France', region: 'EUROPE', hasTradeOffice: true },
    { code: 'GBR', name: 'Vương quốc Anh', nameEn: 'United Kingdom', region: 'EUROPE', hasTradeOffice: true },
    { code: 'ITA', name: 'Italia', nameEn: 'Italy', region: 'EUROPE', hasTradeOffice: true },
    { code: 'ESP', name: 'Tây Ban Nha', nameEn: 'Spain', region: 'EUROPE', hasTradeOffice: true },
    { code: 'NLD', name: 'Hà Lan', nameEn: 'Netherlands', region: 'EUROPE', hasTradeOffice: true },
    { code: 'BEL', name: 'Bỉ', nameEn: 'Belgium', region: 'EUROPE', hasTradeOffice: false },
    { code: 'RUS', name: 'Liên bang Nga', nameEn: 'Russia', region: 'EUROPE', hasTradeOffice: true },
    { code: 'IND', name: 'Ấn Độ', nameEn: 'India', region: 'ASIA', hasTradeOffice: true },
    { code: 'IDN', name: 'Indonesia', nameEn: 'Indonesia', region: 'ASIA', hasTradeOffice: true },
    { code: 'THA', name: 'Thái Lan', nameEn: 'Thailand', region: 'ASIA', hasTradeOffice: true },
    { code: 'MYS', name: 'Malaysia', nameEn: 'Malaysia', region: 'ASIA', hasTradeOffice: true },
    { code: 'SGP', name: 'Singapore', nameEn: 'Singapore', region: 'ASIA', hasTradeOffice: true },
    { code: 'PHL', name: 'Philippines', nameEn: 'Philippines', region: 'ASIA', hasTradeOffice: false },
    { code: 'AUS', name: 'Úc', nameEn: 'Australia', region: 'OCEANIA', hasTradeOffice: true },
    { code: 'NZL', name: 'New Zealand', nameEn: 'New Zealand', region: 'OCEANIA', hasTradeOffice: false },
    { code: 'CAN', name: 'Canada', nameEn: 'Canada', region: 'AMERICAS', hasTradeOffice: true },
    { code: 'MEX', name: 'Mexico', nameEn: 'Mexico', region: 'AMERICAS', hasTradeOffice: false },
    { code: 'BRA', name: 'Brazil', nameEn: 'Brazil', region: 'AMERICAS', hasTradeOffice: true },
    { code: 'ARG', name: 'Argentina', nameEn: 'Argentina', region: 'AMERICAS', hasTradeOffice: false },
    { code: 'ARE', name: 'UAE', nameEn: 'United Arab Emirates', region: 'ASIA', hasTradeOffice: true },
    { code: 'SAU', name: 'Ả Rập Xê Út', nameEn: 'Saudi Arabia', region: 'ASIA', hasTradeOffice: true },
    { code: 'ZAF', name: 'Nam Phi', nameEn: 'South Africa', region: 'AFRICA', hasTradeOffice: true },
    { code: 'EGY', name: 'Ai Cập', nameEn: 'Egypt', region: 'AFRICA', hasTradeOffice: true },
    { code: 'TUR', name: 'Thổ Nhĩ Kỳ', nameEn: 'Turkey', region: 'ASIA', hasTradeOffice: true },
  ];

  for (const [i, item] of data.entries()) {
    const searchKey = sk(item.name, item.nameEn ?? '', item.code);
    await prisma.country.upsert({
      where: { code: item.code },
      update: { ...item, searchKey, displayOrder: i, isActive: true },
      create: { ...item, searchKey, displayOrder: i, isActive: true },
    });
  }

  const count = await prisma.country.count();
  logSeedStep('Country', count);
}

// =============================================================================
// CAT-06: OrgUnit (12 records — type-grouped + parent hierarchy)
// =============================================================================
async function seedOrgUnits(prisma: PrismaClient) {
  // Parents first — KHÔNG có parentCode
  const parents = [
    { code: 'BO_CT', name: 'Bộ Công Thương', type: 'MINISTRY' },
    { code: 'VITAS', name: 'Hiệp hội Dệt may Việt Nam', type: 'ASSOCIATION' },
    { code: 'LEFASO', name: 'Hiệp hội Da giày - Túi xách Việt Nam', type: 'ASSOCIATION' },
    { code: 'VINATEX', name: 'Tập đoàn Dệt May Việt Nam', type: 'ENTERPRISE' },
    { code: 'VASEP', name: 'Hiệp hội Chế biến và Xuất khẩu Thủy sản Việt Nam', type: 'ASSOCIATION' },
    { code: 'VCCI', name: 'Liên đoàn Thương mại và Công nghiệp Việt Nam', type: 'ASSOCIATION' },
    { code: 'VIFOREST', name: 'Hiệp hội Gỗ và Lâm sản Việt Nam', type: 'ASSOCIATION' },
    { code: 'VICOFA', name: 'Hiệp hội Cà phê - Ca cao Việt Nam', type: 'ASSOCIATION' },
    { code: 'VFA', name: 'Hiệp hội Lương thực Việt Nam', type: 'ASSOCIATION' },
  ];

  for (const [i, item] of parents.entries()) {
    const searchKey = sk(item.name, item.code);
    await prisma.orgUnit.upsert({
      where: { code: item.code },
      update: { ...item, parentId: null, searchKey, displayOrder: i, isActive: true },
      create: { ...item, parentId: null, searchKey, displayOrder: i, isActive: true },
    });
  }

  // Children — parentCode resolved sau khi parents seeded
  const childrenSpec = [
    {
      code: 'CUC_XTTM',
      name: 'Cục Xúc tiến Thương mại',
      type: 'DEPARTMENT',
      parentCode: 'BO_CT',
      displayOrder: 9,
    },
    {
      code: 'MAY10',
      name: 'Tổng Công ty May 10',
      type: 'ENTERPRISE',
      parentCode: 'VINATEX',
      displayOrder: 10,
    },
    {
      code: 'INST_TRADE',
      name: 'Viện Nghiên cứu Thương mại',
      type: 'RESEARCH_INSTITUTE',
      parentCode: 'BO_CT',
      displayOrder: 11,
    },
  ];

  for (const child of childrenSpec) {
    const parent = await prisma.orgUnit.findUnique({ where: { code: child.parentCode } });
    if (!parent) {
      throw new Error(`OrgUnit parent ${child.parentCode} not found cho child ${child.code}`);
    }
    const searchKey = sk(child.name, child.code);
    const { parentCode, displayOrder, ...rest } = child;
    await prisma.orgUnit.upsert({
      where: { code: child.code },
      update: { ...rest, parentId: parent.id, searchKey, displayOrder, isActive: true },
      create: { ...rest, parentId: parent.id, searchKey, displayOrder, isActive: true },
    });
  }

  const count = await prisma.orgUnit.count();
  logSeedStep('OrgUnit', count);
}

// =============================================================================
// CAT-07: ScoringCriterion (15 records — 4 group cha + 11 children)
// =============================================================================
async function seedScoringCriteria(prisma: PrismaClient) {
  const appliesToKindsJson = JSON.stringify(ALL_KIND_CODES);

  // 4 group cha (parentId = null)
  const groups = [
    {
      code: 'GROUP_RELEVANCE',
      name: 'Tính phù hợp',
      description: 'Mức độ phù hợp với định hướng XTTMQG, ngành hàng và địa bàn ưu tiên',
      weight: 25,
    },
    {
      code: 'GROUP_FEASIBILITY',
      name: 'Tính khả thi',
      description: 'Khả năng thực hiện về năng lực, tài chính và tiến độ',
      weight: 25,
    },
    {
      code: 'GROUP_IMPACT',
      name: 'Hiệu quả dự kiến',
      description: 'Hiệu quả kinh tế, số doanh nghiệp tham gia và tác động lan tỏa',
      weight: 30,
    },
    {
      code: 'GROUP_QUALITY',
      name: 'Chất lượng đề xuất',
      description: 'Mục tiêu rõ ràng đo lường được và phương pháp triển khai',
      weight: 20,
    },
  ];

  for (const [i, item] of groups.entries()) {
    const searchKey = sk(item.name, item.code);
    await prisma.scoringCriterion.upsert({
      where: { code: item.code },
      update: {
        ...item,
        appliesToKinds: appliesToKindsJson,
        parentId: null,
        searchKey,
        displayOrder: i,
        isActive: true,
      },
      create: {
        ...item,
        appliesToKinds: appliesToKindsJson,
        parentId: null,
        searchKey,
        displayOrder: i,
        isActive: true,
      },
    });
  }

  // 11 children — parentCode → parentId resolution
  const childrenSpec = [
    // Group 1: Tính phù hợp (3 child, sum weight = 25)
    {
      code: 'CRIT_FIT_DIRECTION',
      name: 'Phù hợp định hướng XTTMQG',
      parentCode: 'GROUP_RELEVANCE',
      weight: 10,
    },
    {
      code: 'CRIT_FIT_INDUSTRY',
      name: 'Phù hợp ngành hàng ưu tiên',
      parentCode: 'GROUP_RELEVANCE',
      weight: 8,
    },
    {
      code: 'CRIT_FIT_REGION',
      name: 'Phù hợp địa bàn ưu tiên',
      parentCode: 'GROUP_RELEVANCE',
      weight: 7,
    },
    // Group 2: Tính khả thi (3 child, sum weight = 25)
    {
      code: 'CRIT_FEAS_CAPACITY',
      name: 'Năng lực đơn vị chủ trì',
      parentCode: 'GROUP_FEASIBILITY',
      weight: 10,
    },
    {
      code: 'CRIT_FEAS_FINANCE',
      name: 'Tính khả thi tài chính',
      parentCode: 'GROUP_FEASIBILITY',
      weight: 8,
    },
    {
      code: 'CRIT_FEAS_TIMELINE',
      name: 'Tính khả thi tiến độ',
      parentCode: 'GROUP_FEASIBILITY',
      weight: 7,
    },
    // Group 3: Hiệu quả dự kiến (3 child, sum weight = 30)
    {
      code: 'CRIT_IMPACT_ECONOMIC',
      name: 'Hiệu quả kinh tế',
      parentCode: 'GROUP_IMPACT',
      weight: 12,
    },
    {
      code: 'CRIT_IMPACT_PARTICIPATION',
      name: 'Số doanh nghiệp tham gia',
      parentCode: 'GROUP_IMPACT',
      weight: 10,
    },
    {
      code: 'CRIT_IMPACT_SPREAD',
      name: 'Tác động lan tỏa',
      parentCode: 'GROUP_IMPACT',
      weight: 8,
    },
    // Group 4: Chất lượng đề xuất (2 child, sum weight = 20 — gộp "Bằng chứng số liệu" vào "Phương pháp")
    {
      code: 'CRIT_QUALITY_OBJECTIVE',
      name: 'Mục tiêu rõ ràng đo lường được',
      parentCode: 'GROUP_QUALITY',
      weight: 10,
    },
    {
      code: 'CRIT_QUALITY_METHOD',
      name: 'Phương pháp triển khai phù hợp',
      parentCode: 'GROUP_QUALITY',
      weight: 10,
    },
  ];

  for (const [i, child] of childrenSpec.entries()) {
    const parent = await prisma.scoringCriterion.findUnique({ where: { code: child.parentCode } });
    if (!parent) {
      throw new Error(`ScoringCriterion parent ${child.parentCode} not found cho ${child.code}`);
    }
    const searchKey = sk(child.name, child.code);
    const { parentCode, ...rest } = child;
    await prisma.scoringCriterion.upsert({
      where: { code: child.code },
      update: {
        ...rest,
        appliesToKinds: appliesToKindsJson,
        parentId: parent.id,
        searchKey,
        displayOrder: 10 + i, // children sau parents trong sort
        isActive: true,
      },
      create: {
        ...rest,
        appliesToKinds: appliesToKindsJson,
        parentId: parent.id,
        searchKey,
        displayOrder: 10 + i,
        isActive: true,
      },
    });
  }

  const count = await prisma.scoringCriterion.count();
  logSeedStep('ScoringCriterion', count);
}

// =============================================================================
// CAT-08: DocumentTemplate (6 records — Tiptap HTML stub)
// =============================================================================
async function seedDocumentTemplates(prisma: PrismaClient) {
  const data = [
    {
      code: 'MOI_DK',
      name: 'Công văn mời đăng ký đề án',
      category: 'CONG_VAN_MOI',
      description: 'Công văn gửi đơn vị chủ trì mời đăng ký đề án thuộc chu kỳ XTTMQG',
      bodyHtml:
        '<h2 style="text-align:center">CÔNG VĂN MỜI ĐĂNG KÝ ĐỀ ÁN</h2>' +
        '<p><strong>Kính gửi:</strong> {{tenDonVi}}</p>' +
        '<p>Thực hiện Chương trình Xúc tiến Thương mại Quốc gia năm {{namKy}}, ' +
        'Cục Xúc tiến Thương mại trân trọng mời Quý đơn vị tham gia đăng ký đề án ' +
        'thuộc chương trình <strong>{{tenChuongTrinh}}</strong>.</p>' +
        '<p>Hạn nộp đề án: <strong>{{hanNopDeAn}}</strong>.</p>' +
        '<p>Trân trọng cảm ơn sự hợp tác của Quý đơn vị.</p>' +
        '<p style="text-align:right">Hà Nội, ngày {{ngayKy}}</p>',
      variables: JSON.stringify([
        'tenChuongTrinh',
        'namKy',
        'hanNopDeAn',
        'tenDonVi',
        'ngayKy',
      ]),
    },
    {
      code: 'TO_TRINH_PD',
      name: 'Tờ trình phê duyệt đề án',
      category: 'TO_TRINH',
      description: 'Tờ trình Lãnh đạo Bộ phê duyệt danh sách đề án thẩm định đạt yêu cầu',
      bodyHtml:
        '<h2 style="text-align:center">TỜ TRÌNH</h2>' +
        '<p style="text-align:center"><em>Về việc phê duyệt đề án thuộc Chương trình XTTMQG năm {{namKy}}</em></p>' +
        '<p><strong>Số tờ trình:</strong> {{soToTrinh}}</p>' +
        '<p><strong>Ngày lập:</strong> {{ngayLap}}</p>' +
        '<p>Căn cứ kết quả thẩm định của Hội đồng, Cục Xúc tiến Thương mại kính trình Lãnh đạo Bộ phê duyệt ' +
        'danh sách các đề án dưới đây:</p>' +
        '<p>{{danhSachDeAn}}</p>' +
        '<p><strong>Tổng kinh phí dự kiến:</strong> {{tongKinhPhi}} VNĐ</p>' +
        '<p>Kính trình Lãnh đạo xem xét, phê duyệt.</p>',
      variables: JSON.stringify(['namKy', 'soToTrinh', 'ngayLap', 'danhSachDeAn', 'tongKinhPhi']),
    },
    {
      code: 'QD_PD',
      name: 'Quyết định phê duyệt đề án',
      category: 'QUYET_DINH',
      description: 'Quyết định của Bộ trưởng phê duyệt đề án thuộc Chương trình XTTMQG',
      bodyHtml:
        '<h2 style="text-align:center">QUYẾT ĐỊNH</h2>' +
        '<p style="text-align:center"><strong>Số: {{soQuyetDinh}}</strong></p>' +
        '<p style="text-align:center"><em>Phê duyệt {{tenChuongTrinh}} năm {{namKy}}</em></p>' +
        '<p><strong>BỘ TRƯỞNG BỘ CÔNG THƯƠNG</strong></p>' +
        '<p>Căn cứ Nghị định số 28/2018/NĐ-CP của Chính phủ; ' +
        'Theo đề nghị của Cục trưởng Cục Xúc tiến Thương mại,</p>' +
        '<p><strong>QUYẾT ĐỊNH:</strong></p>' +
        '<p><strong>Điều 1.</strong> Phê duyệt danh sách đề án thuộc {{tenChuongTrinh}} năm {{namKy}}:</p>' +
        '<p>{{danhSachDeAn}}</p>' +
        '<p><strong>Điều 2.</strong> Quyết định có hiệu lực kể từ ngày ký.</p>' +
        '<p style="text-align:right">{{nguoiKy}} - {{ngayKy}}</p>',
      variables: JSON.stringify([
        'soQuyetDinh',
        'ngayKy',
        'nguoiKy',
        'tenChuongTrinh',
        'namKy',
        'danhSachDeAn',
      ]),
    },
    {
      code: 'HD_TH',
      name: 'Hợp đồng thực hiện đề án',
      category: 'HOP_DONG',
      description: 'Hợp đồng giao đơn vị chủ trì thực hiện đề án sau khi đã phê duyệt',
      bodyHtml:
        '<h2 style="text-align:center">HỢP ĐỒNG THỰC HIỆN ĐỀ ÁN</h2>' +
        '<p style="text-align:center"><strong>Số: {{soHopDong}}</strong></p>' +
        '<p>Hôm nay, ngày {{ngayKy}}, hai bên gồm:</p>' +
        '<p><strong>Bên A:</strong> Cục Xúc tiến Thương mại - Bộ Công Thương</p>' +
        '<p><strong>Bên B:</strong> {{tenDonVi}}</p>' +
        '<p>Hai bên thống nhất ký Hợp đồng thực hiện đề án <strong>{{tenDeAn}}</strong> ' +
        'với các điều khoản sau:</p>' +
        '<p><strong>Điều 1.</strong> Kinh phí: {{kinhPhi}} VNĐ</p>' +
        '<p><strong>Điều 2.</strong> Thời hạn thực hiện: {{thoiHan}}</p>' +
        '<p>Hợp đồng có hiệu lực kể từ ngày ký.</p>',
      variables: JSON.stringify([
        'soHopDong',
        'ngayKy',
        'tenDonVi',
        'tenDeAn',
        'kinhPhi',
        'thoiHan',
      ]),
    },
    {
      code: 'BB_NT',
      name: 'Biên bản nghiệm thu đề án',
      category: 'BIEN_BAN_NGHIEM_THU',
      description: 'Biên bản nghiệm thu kết quả thực hiện đề án sau khi hoàn thành',
      bodyHtml:
        '<h2 style="text-align:center">BIÊN BẢN NGHIỆM THU</h2>' +
        '<p style="text-align:center"><strong>Số: {{soBienBan}}</strong></p>' +
        '<p><strong>Ngày lập:</strong> {{ngayLap}}</p>' +
        '<p>Hội đồng nghiệm thu tiến hành nghiệm thu kết quả thực hiện đề án ' +
        '<strong>{{tenDeAn}}</strong> do <strong>{{tenDonVi}}</strong> chủ trì thực hiện.</p>' +
        '<p><strong>Kết quả nghiệm thu:</strong> {{ketQua}}</p>' +
        '<p>Biên bản được lập thành 03 bản có giá trị pháp lý như nhau.</p>',
      variables: JSON.stringify(['soBienBan', 'ngayLap', 'tenDeAn', 'tenDonVi', 'ketQua']),
    },
    {
      code: 'TL_HD',
      name: 'Hợp đồng thanh lý',
      category: 'THANH_LY',
      description: 'Biên bản thanh lý hợp đồng sau khi đã nghiệm thu xong đề án',
      bodyHtml:
        '<h2 style="text-align:center">BIÊN BẢN THANH LÝ HỢP ĐỒNG</h2>' +
        '<p style="text-align:center"><strong>Số: {{soThanhLy}}</strong></p>' +
        '<p><strong>Ngày ký:</strong> {{ngayKy}}</p>' +
        '<p>Căn cứ Hợp đồng số <strong>{{soHopDongGoc}}</strong> giữa Cục Xúc tiến Thương mại và ' +
        '<strong>{{tenDonVi}}</strong>;</p>' +
        '<p>Căn cứ kết quả nghiệm thu đã hoàn tất, hai bên thống nhất thanh lý hợp đồng nói trên.</p>' +
        '<p>Biên bản được lập thành 03 bản có giá trị pháp lý như nhau.</p>',
      variables: JSON.stringify(['soThanhLy', 'ngayKy', 'soHopDongGoc', 'tenDonVi']),
    },
  ];

  for (const [i, item] of data.entries()) {
    const searchKey = sk(item.name, item.code, item.category);
    await prisma.documentTemplate.upsert({
      where: { code: item.code },
      update: { ...item, searchKey, displayOrder: i, isActive: true },
      create: { ...item, searchKey, displayOrder: i, isActive: true },
    });
  }

  const count = await prisma.documentTemplate.count();
  logSeedStep('DocumentTemplate', count);
}

// =============================================================================
// Entry — exported cho prisma/seed.ts gọi
// =============================================================================
export async function seedCatalogs(prisma: PrismaClient) {
  await seedProjectKinds(prisma);
  await seedIndustrySectors(prisma);
  await seedMarkets(prisma);
  await seedPromotionTypes(prisma);
  await seedCountries(prisma);
  await seedOrgUnits(prisma);
  await seedScoringCriteria(prisma);
  await seedDocumentTemplates(prisma);
}
