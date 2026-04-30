// Dynamic catalog page — render config-driven CatalogPage for the matched slug.
// Defense-in-depth RBAC + invalid slug → notFound().

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

import { auth } from '@/lib/auth';
import { can, defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';
import { getCatalogConfigBySlug } from '@/lib/catalog-types';
import { listCatalogItems } from './_actions/list';
import { CatalogPage } from './_components/CatalogPage';

const PAGE_SIZE = 50;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const config = getCatalogConfigBySlug(slug);
  if (!config) return { title: 'Danh mục không tồn tại' };
  return { title: `${config.label} — Danh mục` };
}

export default async function CatalogSlugPage({
  params,
}: {
  params: Params;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (!can(session.user.role as Role, 'danh-muc', 'read')) {
    redirect(defaultLandingPath(session.user.role as Role));
  }

  const { slug } = await params;
  const config = getCatalogConfigBySlug(slug);
  if (!config) {
    notFound();
  }

  // Pre-fetch initial data for SSR
  const initialData = await listCatalogItems(
    config.kind,
    { isActive: 'all' },
    0,
    PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Đường dẫn"
        className="flex items-center gap-1 text-sm text-slate-600"
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-blue-700"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Trang chủ
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 text-slate-400"
          aria-hidden="true"
        />
        <Link href="/danh-muc" className="hover:text-blue-700">
          Danh mục
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 text-slate-400"
          aria-hidden="true"
        />
        <span className="text-slate-900">{config.label}</span>
      </nav>

      <CatalogPage
        kind={config.kind}
        initialData={initialData}
        userRole={session.user.role as Role}
      />
    </div>
  );
}
