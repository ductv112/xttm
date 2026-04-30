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
