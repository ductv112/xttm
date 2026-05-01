// Dynamic catalog page — render config-driven CatalogPage for the matched slug.
// Defense-in-depth RBAC + invalid slug → notFound().

import { notFound, redirect } from 'next/navigation';

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
      {/* Breadcrumb removed — handled by AppTopbar AppBreadcrumb globally */}

      <CatalogPage
        kind={config.kind}
        initialData={initialData}
        userRole={session.user.role as Role}
      />
    </div>
  );
}
