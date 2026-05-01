import { PrismaClient } from '@prisma/client';
import { removeDiacritics } from '../../lib/vi-search';
import { logSeedStep } from './helpers';

type OrgSeed = {
  code: string;
  name: string;
  type: 'GOVERNMENT' | 'ASSOCIATION' | 'ENTERPRISE';
  taxCode?: string;
  address?: string;
  email?: string;
  isInvited: boolean;
};

const SEED_ORGS: OrgSeed[] = [
  {
    code: 'BO_CT',
    name: 'Bộ Công Thương',
    type: 'GOVERNMENT',
    address: '54 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',
    email: 'vanthu@moit.gov.vn',
    isInvited: false,
  },
  {
    code: 'CUC_XTTM',
    name: 'Cục Xúc tiến Thương mại',
    type: 'GOVERNMENT',
    address: '20 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
    email: 'xttm@moit.gov.vn',
    isInvited: false,
  },
  {
    code: 'VITAS',
    name: 'Hiệp hội Dệt may Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0100100100',
    address: '32 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    email: 'vitas@vitas.org.vn',
    isInvited: true,
  },
  {
    code: 'LEFASO',
    name: 'Hiệp hội Da giày - Túi xách Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0100200200',
    address: '160 Hoàng Hoa Thám, Tây Hồ, Hà Nội',
    email: 'lefaso@lefaso.org.vn',
    isInvited: true,
  },
  {
    code: 'VINATEX',
    name: 'Tập đoàn Dệt May Việt Nam',
    type: 'ENTERPRISE',
    taxCode: '0100300300',
    address: '25 Bà Triệu, Hoàn Kiếm, Hà Nội',
    email: 'info@vinatex.com.vn',
    isInvited: true,
  },
  {
    code: 'VASEP',
    name: 'Hiệp hội Chế biến và Xuất khẩu Thủy sản Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0100400400',
    address: '218 Lê Trọng Tấn, Tân Phú, TP.HCM',
    email: 'vasep@vasep.com.vn',
    isInvited: true,
  },
  {
    code: 'VCCI',
    name: 'Liên đoàn Thương mại và Công nghiệp Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0100500500',
    address: '9 Đào Duy Anh, Đống Đa, Hà Nội',
    email: 'vcci@vcci.com.vn',
    isInvited: true,
  },
  // ---------------------------------------------------------------------------
  // Demo enrichment (Phase post-launch) — 8 organizations bổ sung
  // ---------------------------------------------------------------------------
  {
    code: 'VIFOREST',
    name: 'Hiệp hội Gỗ và Lâm sản Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0100600600',
    address: '189 Thanh Nhàn, quận Hai Bà Trưng, Hà Nội',
    email: 'office@vietfores.org',
    isInvited: true,
  },
  {
    code: 'VICOFA',
    name: 'Hiệp hội Cà phê - Ca cao Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0100700700',
    address: '5 Ông Ích Khiêm, quận Ba Đình, Hà Nội',
    email: 'vicofa@vicofa.org.vn',
    isInvited: true,
  },
  {
    code: 'VIETRADE_HCM',
    name: 'Trung tâm Xúc tiến Thương mại TP.HCM (ITPC)',
    type: 'GOVERNMENT',
    taxCode: '0100800800',
    address: '92-96 Nguyễn Huệ, quận 1, TP.HCM',
    email: 'itpc@itpc.gov.vn',
    isInvited: true,
  },
  {
    code: 'MAY10',
    name: 'Tổng công ty May 10 - CTCP',
    type: 'ENTERPRISE',
    taxCode: '0100900900',
    address: '765A Nguyễn Văn Linh, phường Sài Đồng, quận Long Biên, Hà Nội',
    email: 'info@garco10.com.vn',
    isInvited: true,
  },
  {
    code: 'VFA',
    name: 'Hiệp hội Lương thực Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0101000100',
    address: '62 Nguyễn Thị Thập, phường Bình Thuận, quận 7, TP.HCM',
    email: 'vfa@vietfood.org.vn',
    isInvited: true,
  },
  {
    code: 'VIRAC',
    name: 'Viện Nghiên cứu Chiến lược, Chính sách Công Thương',
    type: 'ENTERPRISE',
    taxCode: '0101100200',
    address: '17 Yết Kiêu, quận Hoàn Kiếm, Hà Nội',
    email: 'contact@virac.org.vn',
    isInvited: true,
  },
  {
    code: 'HAWA',
    name: 'Hội Mỹ nghệ và Chế biến Gỗ TP.HCM',
    type: 'ASSOCIATION',
    taxCode: '0101200300',
    address: '185 Lý Chính Thắng, phường 7, quận 3, TP.HCM',
    email: 'info@hawa.org.vn',
    isInvited: true,
  },
  {
    code: 'VRA',
    name: 'Hiệp hội Cao su Việt Nam',
    type: 'ASSOCIATION',
    taxCode: '0101300400',
    address: '236 Nam Kỳ Khởi Nghĩa, phường 6, quận 3, TP.HCM',
    email: 'office@vra.com.vn',
    isInvited: true,
  },
];

export async function seedOrganizations(prisma: PrismaClient) {
  for (const org of SEED_ORGS) {
    const searchKey = removeDiacritics(`${org.name} ${org.code}`);
    await prisma.organization.upsert({
      where: { code: org.code },
      update: {
        name: org.name,
        type: org.type,
        taxCode: org.taxCode ?? null,
        address: org.address ?? null,
        email: org.email ?? null,
        isInvited: org.isInvited,
        searchKey,
      },
      create: {
        code: org.code,
        name: org.name,
        type: org.type,
        taxCode: org.taxCode ?? null,
        address: org.address ?? null,
        email: org.email ?? null,
        isInvited: org.isInvited,
        searchKey,
      },
    });
  }
  logSeedStep('Organizations', SEED_ORGS.length);
}
