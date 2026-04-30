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
