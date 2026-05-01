// Phase 4 (M2.2) seed — 5 OrganizationProfile records covering all 4 statuses.
// Status mix per CONTEXT.md: 1 APPROVED (LEFASO) / 1 SUBMITTED (VITAS) / 1 REJECTED
// (VINATEX) / 2 DRAFT (VASEP, VCCI). Realistic Vietnamese legalInfo + capabilities
// + 2-3 contacts each. Idempotent via upsert on organizationId.

import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { daysAgo } from '../../lib/date';
import { logSeedStep } from './helpers';

type ContactSeed = {
  name: string;
  title: string;
  role: 'CHU_TICH' | 'PHO_CHU_TICH' | 'CHU_NHIEM' | 'DIEU_PHOI_VIEN' | 'KHAC';
  email: string;
  phone: string;
};

type PastProjectSeed = {
  name: string;
  year: number;
  outcome: string;
};

type ProfileSeed = {
  orgCode: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  legalInfo: {
    taxCode: string;
    address: string;
    representativeName: string;
    representativeTitle: string;
    businessType: string;
    businessField: string;
  };
  capabilities: {
    description: string; // Tiptap HTML
    achievements: string;
    pastProjects: PastProjectSeed[];
  };
  contacts: ContactSeed[];
  rejectionReason?: string;
  submittedDaysAgo?: number;
  approvedDaysAgo?: number;
};

const SEED: ProfileSeed[] = [
  {
    // 1. APPROVED — LEFASO (Hiệp hội Da giày)
    orgCode: 'LEFASO',
    status: 'APPROVED',
    submittedDaysAgo: 75,
    approvedDaysAgo: 60,
    legalInfo: {
      taxCode: '0100200200',
      address: '160 Hoàng Hoa Thám, phường Thụy Khuê, quận Tây Hồ, Hà Nội',
      representativeName: 'Diệp Thành Kiệt',
      representativeTitle: 'Chủ tịch Hiệp hội',
      businessType: 'Hiệp hội ngành nghề',
      businessField: 'Da giày, túi xách xuất khẩu',
    },
    capabilities: {
      description:
        '<p>Hiệp hội Da giày - Túi xách Việt Nam (LEFASO) thành lập năm 1990, là tổ chức xã hội-nghề nghiệp đại diện cho hơn 800 doanh nghiệp ngành da giày Việt Nam. Hiệp hội có kinh nghiệm 30 năm tổ chức các chương trình XTTM cấp quốc gia, kết nối thị trường EU, Mỹ, Nhật Bản. Đội ngũ chuyên gia 25 người gồm cán bộ tại Hà Nội và TP.HCM.</p><p>Năng lực chuyên môn: tư vấn kỹ thuật sản xuất giày dép, đào tạo kỹ năng quản lý chuỗi cung ứng, tổ chức triển lãm chuyên ngành quy mô lớn (1000+ gian hàng).</p>',
      achievements:
        'Giải thưởng "Đơn vị XTTM xuất sắc" của Bộ Công Thương năm 2022, 2023. Top 10 hiệp hội ngành nghề được doanh nghiệp đánh giá cao về hỗ trợ XTTM.',
      pastProjects: [
        {
          name: 'Đoàn doanh nghiệp da giày tham dự Triển lãm GDS Düsseldorf 2024',
          year: 2024,
          outcome: '32 doanh nghiệp tham gia, ký 47 hợp đồng tổng giá trị 18 triệu USD',
        },
        {
          name: 'Hội nghị Quốc tế Chuỗi cung ứng Da giày Châu Á - Thái Bình Dương',
          year: 2023,
          outcome: '450 đại biểu, 12 quốc gia, ký kết 8 biên bản hợp tác',
        },
        {
          name: 'Đào tạo kỹ năng XTTM cho 200 cán bộ doanh nghiệp da giày miền Bắc',
          year: 2023,
          outcome: '200 học viên hoàn thành, 85% áp dụng kiến thức vào công việc',
        },
      ],
    },
    contacts: [
      {
        name: 'Diệp Thành Kiệt',
        title: 'CN.',
        role: 'CHU_TICH',
        email: 'kiet.diep@lefaso.org.vn',
        phone: '0903456789',
      },
      {
        name: 'Hoàng Mai Linh',
        title: 'Th.S.',
        role: 'CHU_NHIEM',
        email: 'linh.hoang@lefaso.org.vn',
        phone: '0912345678',
      },
      {
        name: 'Nguyễn Thị Bích',
        title: 'CN.',
        role: 'DIEU_PHOI_VIEN',
        email: 'bich.nguyen@lefaso.org.vn',
        phone: '0987654321',
      },
    ],
  },
  {
    // 2. SUBMITTED — VITAS (Hiệp hội Dệt may) — đang chờ BQL phê duyệt
    orgCode: 'VITAS',
    status: 'SUBMITTED',
    submittedDaysAgo: 5,
    legalInfo: {
      taxCode: '0100100100',
      address: '32 Tràng Tiền, phường Tràng Tiền, quận Hoàn Kiếm, Hà Nội',
      representativeName: 'Vũ Đức Giang',
      representativeTitle: 'Chủ tịch Hiệp hội',
      businessType: 'Hiệp hội ngành nghề',
      businessField: 'Dệt may xuất khẩu',
    },
    capabilities: {
      description:
        '<p>Hiệp hội Dệt may Việt Nam (VITAS) là tổ chức đại diện cho hơn 1200 doanh nghiệp dệt may, chiếm 80% kim ngạch xuất khẩu ngành. Hiệp hội thành lập năm 2000, trụ sở tại Hà Nội với 2 văn phòng đại diện tại TP.HCM và Đà Nẵng. Đội ngũ chuyên môn gồm 40 cán bộ.</p><p>Năng lực: tổ chức đoàn XTTM thị trường EU, Mỹ, Nhật, Hàn; tư vấn tiêu chuẩn chất lượng quốc tế (BSCI, WRAP, OEKO-TEX); kết nối B2B với các nhà mua hàng quốc tế.</p>',
      achievements:
        'Đơn vị tổ chức Vietnam International Textile & Garment Industry Expo (VTG) thường niên với quy mô 700+ gian hàng, 25 quốc gia.',
      pastProjects: [
        {
          name: 'Đoàn doanh nghiệp dệt may tham dự Texworld Paris 2024',
          year: 2024,
          outcome: '18 doanh nghiệp, ký 23 hợp đồng tổng 12 triệu USD',
        },
        {
          name: 'Hội thảo "Thích ứng yêu cầu CBAM của EU đối với ngành dệt may"',
          year: 2024,
          outcome: '350 doanh nghiệp tham dự, ban hành 1 báo cáo khuyến nghị',
        },
      ],
    },
    contacts: [
      {
        name: 'Vũ Đức Giang',
        title: 'TS.',
        role: 'CHU_TICH',
        email: 'giang.vu@vitas.org.vn',
        phone: '0913987654',
      },
      {
        name: 'Vũ Đức Minh',
        title: 'Th.S.',
        role: 'CHU_NHIEM',
        email: 'minh.vu@vitas.org.vn',
        phone: '0934567890',
      },
    ],
  },
  {
    // 3. REJECTED — VINATEX (Tập đoàn Dệt May) — bị từ chối
    orgCode: 'VINATEX',
    status: 'REJECTED',
    submittedDaysAgo: 20,
    legalInfo: {
      taxCode: '0100300300',
      address: '25 Bà Triệu, phường Hàng Bài, quận Hoàn Kiếm, Hà Nội',
      representativeName: 'Lê Tiến Trường',
      representativeTitle: 'Tổng Giám đốc',
      businessType: 'Tập đoàn nhà nước',
      businessField: 'Dệt may, sợi, vải',
    },
    capabilities: {
      description:
        '<p>Tập đoàn Dệt May Việt Nam (VINATEX) là doanh nghiệp dẫn đầu ngành dệt may, sở hữu 70+ công ty thành viên trên toàn quốc. Tập đoàn có kinh nghiệm xuất khẩu sang 65 quốc gia với năng lực sản xuất 1.5 tỷ sản phẩm/năm.</p><p>Năng lực XTTM: tổ chức triển lãm sản phẩm cuối, kết nối B2B với khách hàng lớn (Walmart, H&M, Uniqlo, Inditex).</p>',
      achievements: 'Top 500 doanh nghiệp lớn nhất Việt Nam (VNR500) 8 năm liên tiếp.',
      pastProjects: [
        {
          name: 'Triển lãm Saigontex 2024',
          year: 2024,
          outcome: '500 gian hàng, 28 quốc gia',
        },
      ],
    },
    contacts: [
      {
        name: 'Lê Tiến Trường',
        title: 'TS.',
        role: 'CHU_TICH',
        email: 'truong.le@vinatex.com.vn',
        phone: '0903123456',
      },
      {
        name: 'Phạm Văn Việt',
        title: 'Th.S.',
        role: 'DIEU_PHOI_VIEN',
        email: 'viet.pham@vinatex.com.vn',
        phone: '0916789012',
      },
    ],
    rejectionReason:
      'Hồ sơ năng lực chưa đầy đủ — vui lòng bổ sung danh sách 3 đề án XTTM gần nhất kèm kết quả định lượng (số doanh nghiệp tham gia, giá trị hợp đồng ký kết, đối tác thị trường). Ngoài ra cần làm rõ năng lực tổ chức đoàn XTTM ra nước ngoài giai đoạn 2022-2024.',
  },
  {
    // 4. DRAFT — VASEP (Hiệp hội Thủy sản) — đang khai báo
    orgCode: 'VASEP',
    status: 'DRAFT',
    legalInfo: {
      taxCode: '0100400400',
      address: '218 Lê Trọng Tấn, phường Tây Thạnh, quận Tân Phú, TP.HCM',
      representativeName: 'Nguyễn Hoài Nam',
      representativeTitle: 'Tổng Thư ký',
      businessType: 'Hiệp hội ngành nghề',
      businessField: 'Chế biến và xuất khẩu thủy sản',
    },
    capabilities: {
      description:
        '<p>Hiệp hội Chế biến và Xuất khẩu Thủy sản Việt Nam (VASEP) thành lập năm 1998, đại diện cho 270 doanh nghiệp thủy sản chế biến xuất khẩu. Trụ sở tại TP.HCM, văn phòng đại diện tại Hà Nội.</p><p>Năng lực: tổ chức Vietfish Expo (triển lãm thủy sản quốc tế), tham gia Seafood Expo Global Brussels, Seafood Expo Asia Singapore.</p>',
      achievements: '',
      pastProjects: [
        {
          name: 'Vietfish Expo 2024',
          year: 2024,
          outcome: '320 gian hàng, 22 quốc gia, giao dịch 250 triệu USD',
        },
      ],
    },
    contacts: [
      {
        name: 'Nguyễn Hoài Nam',
        title: 'TS.',
        role: 'CHU_TICH',
        email: 'nam.nguyen@vasep.com.vn',
        phone: '0908765432',
      },
    ],
  },
  {
    // 5. DRAFT — VCCI (Liên đoàn Thương mại) — mới tạo, chưa khai báo gì
    orgCode: 'VCCI',
    status: 'DRAFT',
    legalInfo: {
      taxCode: '0100500500',
      address: '9 Đào Duy Anh, phường Phương Mai, quận Đống Đa, Hà Nội',
      representativeName: 'Phạm Tấn Công',
      representativeTitle: 'Chủ tịch',
      businessType: 'Tổ chức xã hội-nghề nghiệp',
      businessField: 'Xúc tiến thương mại đa ngành',
    },
    capabilities: {
      description:
        '<p>Liên đoàn Thương mại và Công nghiệp Việt Nam (VCCI) là tổ chức quốc gia tập hợp và đại diện cho cộng đồng doanh nghiệp Việt Nam.</p>',
      achievements: '',
      pastProjects: [],
    },
    contacts: [
      {
        name: 'Phạm Tấn Công',
        title: 'TS.',
        role: 'CHU_TICH',
        email: 'cong.pham@vcci.com.vn',
        phone: '0902345678',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Demo enrichment — 7 thêm profiles để cover trạng thái & ngành đa dạng
  // ---------------------------------------------------------------------------

  {
    // 6. APPROVED — VICOFA (Hiệp hội Cà phê - Ca cao)
    orgCode: 'VICOFA',
    status: 'APPROVED',
    submittedDaysAgo: 95,
    approvedDaysAgo: 80,
    legalInfo: {
      taxCode: '0100700700',
      address: '5 Ông Ích Khiêm, phường Điện Biên, quận Ba Đình, Hà Nội',
      representativeName: 'Nguyễn Nam Hải',
      representativeTitle: 'Chủ tịch Hiệp hội',
      businessType: 'Hiệp hội ngành nghề',
      businessField: 'Cà phê, ca cao xuất khẩu',
    },
    capabilities: {
      description:
        '<p>Hiệp hội Cà phê - Ca cao Việt Nam (VICOFA) thành lập năm 1990, đại diện cho 250+ doanh nghiệp xuất khẩu cà phê và ca cao. Việt Nam là quốc gia xuất khẩu cà phê lớn thứ 2 thế giới (sau Brazil) và đứng đầu về Robusta.</p><p>Năng lực: tổ chức Vietnam International Coffee Festival hàng năm, đoàn xúc tiến tham dự World of Coffee và Specialty Coffee Expo.</p>',
      achievements:
        'Đơn vị tổ chức Vietnam Coffee Day, ngày 1/12 hàng năm. Liên kết với 12 hiệp hội cà phê quốc tế.',
      pastProjects: [
        {
          name: 'Đoàn cà phê Việt tham dự World of Coffee Athens 2024',
          year: 2024,
          outcome: '15 doanh nghiệp, 28 hợp đồng tổng 22 triệu USD',
        },
        {
          name: 'Vietnam International Coffee Festival 2024 tại Buôn Ma Thuột',
          year: 2024,
          outcome: '420 gian hàng, 35 quốc gia, 80.000 lượt khách',
        },
      ],
    },
    contacts: [
      {
        name: 'Nguyễn Nam Hải',
        title: 'TS.',
        role: 'CHU_TICH',
        email: 'hai.nguyen@vicofa.org.vn',
        phone: '0913456789',
      },
      {
        name: 'Đỗ Hà Nam',
        title: 'CN.',
        role: 'PHO_CHU_TICH',
        email: 'nam.do@vicofa.org.vn',
        phone: '0918901234',
      },
      {
        name: 'Lê Thị Mai Trang',
        title: 'Th.S.',
        role: 'CHU_NHIEM',
        email: 'trang.le@vicofa.org.vn',
        phone: '0934567812',
      },
    ],
  },

  {
    // 7. APPROVED — VIFOREST (Hiệp hội Gỗ - Lâm sản)
    orgCode: 'VIFOREST',
    status: 'APPROVED',
    submittedDaysAgo: 110,
    approvedDaysAgo: 92,
    legalInfo: {
      taxCode: '0100600600',
      address: '189 Thanh Nhàn, phường Quỳnh Lôi, quận Hai Bà Trưng, Hà Nội',
      representativeName: 'Đỗ Xuân Lập',
      representativeTitle: 'Chủ tịch Hiệp hội',
      businessType: 'Hiệp hội ngành nghề',
      businessField: 'Gỗ, sản phẩm gỗ và lâm sản xuất khẩu',
    },
    capabilities: {
      description:
        '<p>Hiệp hội Gỗ và Lâm sản Việt Nam (VIFOREST) đại diện cho 600+ doanh nghiệp ngành gỗ và lâm sản chế biến. Việt Nam là nước xuất khẩu gỗ và sản phẩm gỗ lớn thứ 5 thế giới với kim ngạch trên 16 tỷ USD/năm.</p><p>Năng lực: tổ chức Vietnam International Furniture & Home Accessories Fair (VIFA EXPO), đoàn tham dự High Point Market (US) và imm Cologne (Đức).</p>',
      achievements:
        'Top 5 hiệp hội ngành nghề được Bộ Công Thương đánh giá xuất sắc 2023-2024.',
      pastProjects: [
        {
          name: 'Đoàn doanh nghiệp gỗ Việt tham dự High Point Market Spring 2024',
          year: 2024,
          outcome: '22 doanh nghiệp, ký 38 hợp đồng tổng 45 triệu USD',
        },
        {
          name: 'VIFA EXPO 2024 — Triển lãm Quốc tế Đồ gỗ và Mỹ nghệ',
          year: 2024,
          outcome: '650 gian hàng, 110 quốc gia + vùng lãnh thổ',
        },
      ],
    },
    contacts: [
      {
        name: 'Đỗ Xuân Lập',
        title: 'TS.',
        role: 'CHU_TICH',
        email: 'lap.do@vietfores.org',
        phone: '0903987456',
      },
      {
        name: 'Ngô Sỹ Hoài',
        title: 'Th.S.',
        role: 'PHO_CHU_TICH',
        email: 'hoai.ngo@vietfores.org',
        phone: '0917654321',
      },
    ],
  },

  {
    // 8. SUBMITTED — VFA (Hiệp hội Lương thực) — chờ BQL phê duyệt
    orgCode: 'VFA',
    status: 'SUBMITTED',
    submittedDaysAgo: 8,
    legalInfo: {
      taxCode: '0101000100',
      address: '62 Nguyễn Thị Thập, phường Bình Thuận, quận 7, TP.HCM',
      representativeName: 'Nguyễn Ngọc Nam',
      representativeTitle: 'Chủ tịch Hiệp hội',
      businessType: 'Hiệp hội ngành nghề',
      businessField: 'Gạo và lương thực xuất khẩu',
    },
    capabilities: {
      description:
        '<p>Hiệp hội Lương thực Việt Nam (VFA) đại diện cho 145 doanh nghiệp xuất khẩu gạo lớn của Việt Nam. Hiệp hội điều phối đấu thầu G2G + B2B với các thị trường truyền thống Philippines, Indonesia, Cuba, châu Phi.</p><p>Năng lực: theo dõi giá gạo thế giới, tham gia đoàn xúc tiến đa phương cấp Bộ trưởng Nông-Thương Đông Nam Á.</p>',
      achievements:
        'Hỗ trợ Việt Nam đạt kim ngạch xuất khẩu gạo kỷ lục 5,3 tỷ USD năm 2023.',
      pastProjects: [
        {
          name: 'Hội nghị Ngành Gạo Quốc tế Manila 2024',
          year: 2024,
          outcome: '80 đại biểu, ký kết 15 hợp đồng dài hạn',
        },
      ],
    },
    contacts: [
      {
        name: 'Nguyễn Ngọc Nam',
        title: 'CN.',
        role: 'CHU_TICH',
        email: 'nam.nguyen@vietfood.org.vn',
        phone: '0908123456',
      },
      {
        name: 'Phan Văn Có',
        title: 'Th.S.',
        role: 'CHU_NHIEM',
        email: 'co.phan@vietfood.org.vn',
        phone: '0913234567',
      },
    ],
  },

  {
    // 9. SUBMITTED — May 10 (Tổng công ty May 10) — chờ BQL phê duyệt
    orgCode: 'MAY10',
    status: 'SUBMITTED',
    submittedDaysAgo: 12,
    legalInfo: {
      taxCode: '0100900900',
      address: '765A Nguyễn Văn Linh, phường Sài Đồng, quận Long Biên, Hà Nội',
      representativeName: 'Thân Đức Việt',
      representativeTitle: 'Tổng Giám đốc',
      businessType: 'Tổng công ty cổ phần',
      businessField: 'Sản xuất và xuất khẩu hàng dệt may',
    },
    capabilities: {
      description:
        '<p>Tổng công ty May 10 thành lập năm 1946, là một trong những doanh nghiệp dệt may hàng đầu Việt Nam. Công ty sở hữu 18 xí nghiệp thành viên với 12.000 lao động, năng lực sản xuất 30 triệu sản phẩm/năm.</p><p>Năng lực XTTM: tham dự Texworld Paris, Magic Las Vegas, Première Vision; đối tác chiến lược của các thương hiệu lớn (Brooks Brothers, Pierre Cardin, Hugo Boss).</p>',
      achievements: 'Top 10 doanh nghiệp dệt may xuất khẩu lớn nhất Việt Nam 2023.',
      pastProjects: [
        {
          name: 'Tham dự Magic Las Vegas Spring 2024',
          year: 2024,
          outcome: 'Ký hợp đồng dài hạn 18 triệu USD với 3 đối tác Mỹ',
        },
      ],
    },
    contacts: [
      {
        name: 'Thân Đức Việt',
        title: 'CN.',
        role: 'CHU_TICH',
        email: 'viet.than@garco10.com.vn',
        phone: '0903345678',
      },
      {
        name: 'Bạch Thăng Long',
        title: 'Th.S.',
        role: 'CHU_NHIEM',
        email: 'long.bach@garco10.com.vn',
        phone: '0914456789',
      },
    ],
  },

  {
    // 10. REJECTED — HAWA (Hội Mỹ nghệ Gỗ TP.HCM) — bị từ chối
    orgCode: 'HAWA',
    status: 'REJECTED',
    submittedDaysAgo: 35,
    legalInfo: {
      taxCode: '0101200300',
      address: '185 Lý Chính Thắng, phường 7, quận 3, TP.HCM',
      representativeName: 'Nguyễn Quốc Khanh',
      representativeTitle: 'Chủ tịch',
      businessType: 'Hội nghề nghiệp',
      businessField: 'Mỹ nghệ và chế biến gỗ',
    },
    capabilities: {
      description:
        '<p>Hội Mỹ nghệ và Chế biến Gỗ TP.HCM (HAWA) đại diện cho 600+ doanh nghiệp gỗ phía Nam. Đơn vị tổ chức HAWA Expo (triển lãm đồ gỗ và nội thất TP.HCM).</p>',
      achievements: 'Tham gia tổ chức HAWA Expo 2024.',
      pastProjects: [
        {
          name: 'HAWA Expo 2024',
          year: 2024,
          outcome: '300 gian hàng, 40 quốc gia',
        },
      ],
    },
    contacts: [
      {
        name: 'Nguyễn Quốc Khanh',
        title: 'CN.',
        role: 'CHU_TICH',
        email: 'khanh.nguyen@hawa.org.vn',
        phone: '0908234123',
      },
    ],
    rejectionReason:
      'Hồ sơ năng lực còn thiếu thông tin. Đề nghị bổ sung: (1) Báo cáo tài chính 3 năm gần nhất của hội (2022-2024); (2) Danh sách chi tiết 600+ doanh nghiệp thành viên kèm thông tin liên hệ; (3) Ít nhất 3 đề án XTTM cấp quốc gia hoặc khu vực đã thực hiện trong 5 năm gần đây với kết quả định lượng. Sau khi bổ sung, đề nghị nộp lại hồ sơ để được xem xét.',
  },

  {
    // 11. REJECTED — VRA (Hiệp hội Cao su) — bị từ chối
    orgCode: 'VRA',
    status: 'REJECTED',
    submittedDaysAgo: 28,
    legalInfo: {
      taxCode: '0101300400',
      address: '236 Nam Kỳ Khởi Nghĩa, phường 6, quận 3, TP.HCM',
      representativeName: 'Trần Ngọc Thuận',
      representativeTitle: 'Chủ tịch',
      businessType: 'Hiệp hội ngành nghề',
      businessField: 'Cao su tự nhiên và sản phẩm cao su',
    },
    capabilities: {
      description:
        '<p>Hiệp hội Cao su Việt Nam (VRA) đại diện cho 100+ doanh nghiệp ngành cao su, bao gồm các đơn vị thành viên Tập đoàn Công nghiệp Cao su Việt Nam (VRG).</p>',
      achievements: '',
      pastProjects: [],
    },
    contacts: [
      {
        name: 'Trần Ngọc Thuận',
        title: 'TS.',
        role: 'CHU_TICH',
        email: 'thuan.tran@vra.com.vn',
        phone: '0908778899',
      },
    ],
    rejectionReason:
      'Hồ sơ chưa đáp ứng yêu cầu. Cần bổ sung: (1) Phần Capabilities chi tiết về năng lực tổ chức XTTM cấp quốc gia (mới chỉ có mô tả tổng quan); (2) Tối thiểu 2 đề án XTTM đã thực hiện trong 3 năm gần nhất kèm minh chứng kết quả; (3) Bổ sung thêm contact phụ trách XTTM (mới chỉ có 1 contact). Đề nghị bổ sung và nộp lại hồ sơ.',
  },

  {
    // 12. DRAFT — VIRAC (Viện Nghiên cứu) — đang khai báo
    orgCode: 'VIRAC',
    status: 'DRAFT',
    legalInfo: {
      taxCode: '0101100200',
      address: '17 Yết Kiêu, phường Cửa Nam, quận Hoàn Kiếm, Hà Nội',
      representativeName: 'Nguyễn Văn Hội',
      representativeTitle: 'Viện trưởng',
      businessType: 'Viện nghiên cứu',
      businessField: 'Nghiên cứu chiến lược, chính sách công thương',
    },
    capabilities: {
      description:
        '<p>Viện Nghiên cứu Chiến lược, Chính sách Công Thương trực thuộc Bộ Công Thương, thực hiện nghiên cứu chiến lược ngành công nghiệp và thương mại quốc gia.</p>',
      achievements: '',
      pastProjects: [],
    },
    contacts: [
      {
        name: 'Nguyễn Văn Hội',
        title: 'PGS.TS.',
        role: 'CHU_TICH',
        email: 'hoi.nguyen@virac.org.vn',
        phone: '0913112233',
      },
    ],
  },
];

export async function seedOrgProfiles(prisma: PrismaClient) {
  // Resolve approver user (banql) once
  const banqlUser = await prisma.user.findUnique({
    where: { username: 'banql' },
    select: { id: true },
  });

  for (const seed of SEED) {
    const org = await prisma.organization.findUnique({
      where: { code: seed.orgCode },
      select: { id: true },
    });
    if (!org) {
      console.warn(`[orgProfiles] skip ${seed.orgCode} — organization not found`);
      continue;
    }

    const contactsWithIds = seed.contacts.map((c) => ({
      id: randomUUID(),
      name: c.name,
      title: c.title,
      role: c.role,
      email: c.email,
      phone: c.phone,
    }));

    const submittedAt =
      seed.submittedDaysAgo !== undefined ? daysAgo(seed.submittedDaysAgo) : null;
    const approvedAt =
      seed.approvedDaysAgo !== undefined ? daysAgo(seed.approvedDaysAgo) : null;

    const baseData = {
      legalInfoJson: JSON.stringify(seed.legalInfo),
      capabilitiesJson: JSON.stringify(seed.capabilities),
      contactsJson: JSON.stringify(contactsWithIds),
      status: seed.status,
      rejectionReason: seed.rejectionReason ?? null,
      submittedAt,
      approvedAt,
      approvedById:
        seed.status === 'APPROVED' && banqlUser ? banqlUser.id : null,
    };

    await prisma.organizationProfile.upsert({
      where: { organizationId: org.id },
      update: baseData,
      create: {
        organizationId: org.id,
        ...baseData,
      },
    });
  }

  logSeedStep('OrganizationProfiles', SEED.length);
}
