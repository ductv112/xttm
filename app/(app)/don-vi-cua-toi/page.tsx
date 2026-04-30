// /don-vi-cua-toi — RSC page cho đơn vị chủ trì tự sửa hồ sơ tổ chức.
// RBAC: chỉ DONVI mới có quyền truy cập (redirect mọi role khác về landing path).
// Page calls getOrCreateMyProfile() để auto-provision DRAFT khi DONVI lần đầu.

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { ROLES, type Role } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime } from '@/lib/format';

import { getOrCreateMyProfile } from './_actions/get-or-create';
import { LegalInfoForm } from './_components/LegalInfoForm';
import { CapabilitiesForm } from './_components/CapabilitiesForm';
import { ContactsManager } from './_components/ContactsManager';
import { DocumentsManager } from './_components/DocumentsManager';
import { ProfileTimeline } from './_components/ProfileTimeline';
import { SubmitButton } from './_components/SubmitButton';
import { RejectionAlert } from './_components/RejectionAlert';

export const metadata = { title: 'Hồ sơ Đơn vị Chủ trì' };

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = session.user.role as Role;

  // Page chỉ dành cho DONVI — mọi role khác về landing path mặc định
  if (role !== ROLES.DONVI) {
    redirect(defaultLandingPath(role));
  }

  const profile = await getOrCreateMyProfile();
  const isFrozen = profile.status === 'SUBMITTED';

  return (
    <main className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Hồ sơ Đơn vị Chủ trì
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <strong>{profile.organizationName}</strong> · MST: {profile.legalInfo.taxCode || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={profile.status} entity="ORG_PROFILE" />
          {profile.submittedAt ? (
            <span className="text-xs text-slate-500">
              Gửi lần cuối: {formatDateTime(profile.submittedAt)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Rejection alert at top when status=REJECTED */}
      {profile.status === 'REJECTED' ? (
        <div className="mb-6">
          <RejectionAlert reason={profile.rejectionReason} />
        </div>
      ) : null}

      {isFrozen ? (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Hồ sơ đang chờ Ban quản lý phê duyệt
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Trong thời gian này, mọi trường thông tin sẽ ở chế độ chỉ đọc. Vui lòng theo dõi thông báo từ Ban quản lý.
          </p>
        </div>
      ) : null}

      {/* 2-column layout: forms left (2/3), sidebar right (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <LegalInfoForm
            initial={profile.legalInfo}
            organizationName={profile.organizationName}
            readOnly={isFrozen}
          />
          <CapabilitiesForm initial={profile.capabilities} readOnly={isFrozen} />
          <ContactsManager initial={profile.contacts} readOnly={isFrozen} />
          <DocumentsManager initial={profile.documents} readOnly={isFrozen} />
        </div>

        <div className="space-y-6 lg:col-span-1">
          <SubmitButton
            status={profile.status}
            legalInfo={profile.legalInfo}
            capabilities={profile.capabilities}
            contacts={profile.contacts}
          />
          <ProfileTimeline
            createdAt={profile.createdAt}
            updatedAt={profile.updatedAt}
            submittedAt={profile.submittedAt}
            approvedAt={profile.approvedAt}
            approvedByName={profile.approvedByName}
            status={profile.status}
            rejectionReason={profile.rejectionReason}
          />
        </div>
      </div>
    </main>
  );
}
