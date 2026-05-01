// /phe-duyet/new — BQL lập tờ trình mới (chỉ form bước 1: chọn projects + soạn body).

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/lib/auth';
import { canFromDB } from '@/lib/permissions-db';
import { defaultLandingPath } from '@/lib/permissions';
import type { Role } from '@/lib/constants';

import { listSubmissionCandidates } from '../_actions/list-candidates';
import { SubmissionDraftForm } from '../[id]/_components/SubmissionDraftForm';

export const metadata = { title: 'Lập tờ trình mới' };

export default async function NewSubmissionPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;
  if (!(await canFromDB(role, 'phe-duyet', 'create'))) {
    redirect(defaultLandingPath(role));
  }

  const candidates = await listSubmissionCandidates();

  return (
    <main className="container mx-auto max-w-5xl py-8">
      <div className="mb-4">
        <Link
          href="/phe-duyet"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại danh sách tờ trình
        </Link>
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Lập tờ trình mới
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Chọn các đề án đã thẩm định để đưa vào tờ trình gửi Bộ Công Thương phê
          duyệt. Danh sách được xếp theo điểm trung bình cao đến thấp.
        </p>
      </header>

      <SubmissionDraftForm
        mode="create"
        candidates={candidates}
        initial={null}
      />
    </main>
  );
}
