// Danh mục index — admin-only RSC. 8 catalog cards driven by CATALOG_CONFIGS.
// Defense-in-depth RBAC: middleware + RSC redirect + server action throw.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FolderTree,
  Tags,
  Globe2,
  Briefcase,
  Flag,
  Building2,
  ClipboardCheck,
  FileText,
  type LucideIcon,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { can, defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import {
  CATALOG_KINDS,
  CATALOG_CONFIGS,
  type CatalogKind,
} from '@/lib/catalog-types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCatalogCounts } from './[slug]/_actions/list';

export const metadata = { title: 'Danh mục hệ thống' };

const ICON_BY_KIND: Record<CatalogKind, LucideIcon> = {
  'project-kind': FolderTree,
  'industry-sector': Tags,
  market: Globe2,
  'promotion-type': Briefcase,
  country: Flag,
  'org-unit': Building2,
  'scoring-criterion': ClipboardCheck,
  'document-template': FileText,
};

const DESCRIPTION_BY_KIND: Record<CatalogKind, string> = {
  'project-kind':
    '8 loại đề án theo Nghị định 28: triển lãm, hội nghị, đào tạo...',
  'industry-sector': '20 ngành hàng — dệt may, da giày, gỗ, thủy sản...',
  market: '15 thị trường xuất khẩu chia 5 khu vực địa lý',
  'promotion-type': '8 loại hình XTTM theo quy định hiện hành',
  country: '30 quốc gia ISO alpha-3 — đánh dấu có thương vụ Việt Nam',
  'org-unit': '12 đơn vị: bộ, cục, hiệp hội, doanh nghiệp, viện nghiên cứu',
  'scoring-criterion':
    '15 tiêu chí thẩm định với trọng số (4 nhóm + 11 tiêu chí con)',
  'document-template':
    '6 mẫu văn bản: công văn mời, tờ trình, quyết định, hợp đồng, biên bản',
};

export default async function CatalogIndexPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!can(session.user.role as Role, 'danh-muc', 'read')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  const counts = await getCatalogCounts();
  const countMap = new Map(counts.map((c) => [c.kind, c]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Danh mục hệ thống
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          8 danh mục cấu hình quy chuẩn cho toàn bộ nghiệp vụ
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {CATALOG_KINDS.map((kind) => {
          const config = CATALOG_CONFIGS[kind];
          const Icon = ICON_BY_KIND[kind];
          const stat = countMap.get(kind);
          const totalCount = stat?.count ?? 0;
          const activeCount = stat?.activeCount ?? 0;

          return (
            <Link
              key={kind}
              href={`/danh-muc/${config.slug}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 rounded-lg"
            >
              <Card className="h-full transition hover:border-blue-700 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50">
                    <Icon
                      className="h-6 w-6 text-blue-700"
                      aria-hidden="true"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-base font-semibold text-slate-900">
                    {config.label}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {DESCRIPTION_BY_KIND[kind]}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-blue-700">
                      {totalCount} mục
                    </span>
                    {totalCount > 0 ? (
                      <span className="text-slate-500">
                        ({activeCount} đang hoạt động)
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
