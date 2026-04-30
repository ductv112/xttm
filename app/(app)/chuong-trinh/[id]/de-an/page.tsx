// /chuong-trinh/[id]/de-an — empty state placeholder (Phase 5 sẽ wire thực).

import { notFound } from 'next/navigation';

import { getCycleDetail } from '../../_actions/get-detail';
import { DeAnEmptyState } from '../_components/DeAnEmptyState';

export default async function DeAnTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let cycle;
  try {
    cycle = await getCycleDetail(id);
  } catch {
    notFound();
  }

  return <DeAnEmptyState cycle={cycle} />;
}
