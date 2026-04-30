'use client';

// ProfileDetailSheet — large drawer (640px wide) hiển thị full readonly profile.
// Footer buttons "Phê duyệt" / "Từ chối" chỉ visible khi status === SUBMITTED.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime } from '@/lib/format';
import {
  ORG_PROFILE_CONTACT_ROLE_LABELS,
  type OrgProfileContactRole,
} from '@/lib/workflows/orgProfile';

import { ApproveDialog } from './ApproveDialog';
import { RejectDialog } from './RejectDialog';
import {
  getOrgProfileDetail,
  type OrgProfileDetail,
} from '../_actions/list';

const CATEGORY_LABELS: Record<string, string> = {
  GIAY_DKKD: 'Giấy đăng ký kinh doanh',
  DIEU_LE: 'Điều lệ',
  QUYET_DINH: 'Quyết định thành lập',
  KHAC: 'Tài liệu khác',
};

export type ProfileDetailSheetProps = {
  profileId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function ProfileDetailSheet({
  profileId,
  onOpenChange,
}: ProfileDetailSheetProps) {
  const [detail, setDetail] = React.useState<OrgProfileDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!profileId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    getOrgProfileDetail(profileId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const handleSuccess = () => {
    onOpenChange(false);
    router.refresh();
  };

  const open = profileId !== null;
  const isSubmitted = detail?.status === 'SUBMITTED';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg">
                {detail?.organization.name ?? 'Đang tải hồ sơ...'}
              </SheetTitle>
              <SheetDescription>
                {detail?.organization.code} · {detail?.organization.type ?? ''}
              </SheetDescription>
            </div>
            {detail ? <StatusBadge status={detail.status} entity="ORG_PROFILE" /> : null}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : !detail ? (
            <p className="text-sm text-slate-500">Không tìm thấy hồ sơ.</p>
          ) : (
            <div className="space-y-6">
              {/* Status meta */}
              <section className="rounded-md bg-slate-50 p-3 text-sm">
                <dl className="grid grid-cols-2 gap-y-2">
                  {detail.submittedAt ? (
                    <>
                      <dt className="text-slate-600">Đã gửi lúc:</dt>
                      <dd className="font-medium text-slate-900">
                        {formatDateTime(detail.submittedAt)}
                      </dd>
                    </>
                  ) : null}
                  {detail.approvedAt ? (
                    <>
                      <dt className="text-slate-600">Đã phê duyệt lúc:</dt>
                      <dd className="font-medium text-slate-900">
                        {formatDateTime(detail.approvedAt)}
                        {detail.approvedByName ? ` · ${detail.approvedByName}` : ''}
                      </dd>
                    </>
                  ) : null}
                  {detail.rejectionReason ? (
                    <>
                      <dt className="col-span-2 text-red-700 font-medium">
                        Lý do từ chối:
                      </dt>
                      <dd className="col-span-2 mt-1 whitespace-pre-line text-red-800">
                        {detail.rejectionReason}
                      </dd>
                    </>
                  ) : null}
                </dl>
              </section>

              {/* Legal info */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  Thông tin pháp lý
                </h3>
                <dl className="grid grid-cols-1 gap-y-2 text-sm md:grid-cols-3">
                  <dt className="text-slate-600">Mã số thuế:</dt>
                  <dd className="md:col-span-2 font-medium text-slate-900">
                    {detail.legalInfo.taxCode || '—'}
                  </dd>
                  <dt className="text-slate-600">Địa chỉ:</dt>
                  <dd className="md:col-span-2 text-slate-900">
                    {detail.legalInfo.address || '—'}
                  </dd>
                  <dt className="text-slate-600">Người đại diện:</dt>
                  <dd className="md:col-span-2 text-slate-900">
                    {detail.legalInfo.representativeName || '—'}
                    {detail.legalInfo.representativeTitle
                      ? ` · ${detail.legalInfo.representativeTitle}`
                      : ''}
                  </dd>
                  <dt className="text-slate-600">Loại hình:</dt>
                  <dd className="md:col-span-2 text-slate-900">
                    {detail.legalInfo.businessType || '—'}
                  </dd>
                  <dt className="text-slate-600">Lĩnh vực:</dt>
                  <dd className="md:col-span-2 text-slate-900">
                    {detail.legalInfo.businessField || '—'}
                  </dd>
                </dl>
              </section>

              {/* Capabilities */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  Năng lực hoạt động
                </h3>
                {detail.capabilities.description ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-800"
                    dangerouslySetInnerHTML={{ __html: detail.capabilities.description }}
                  />
                ) : (
                  <p className="text-sm italic text-slate-500">Chưa khai báo mô tả năng lực</p>
                )}

                {detail.capabilities.achievements ? (
                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800">
                    <strong className="block mb-1 text-slate-700">Thành tích:</strong>
                    <p className="whitespace-pre-line">{detail.capabilities.achievements}</p>
                  </div>
                ) : null}

                {detail.capabilities.pastProjects && detail.capabilities.pastProjects.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Các đề án XTTM đã thực hiện:
                    </p>
                    <ul className="space-y-2">
                      {detail.capabilities.pastProjects.map((p, i) => (
                        <li
                          key={i}
                          className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                        >
                          <div className="font-medium text-slate-900">
                            {p.name} {p.year ? <span className="text-slate-500">({p.year})</span> : null}
                          </div>
                          {p.outcome ? (
                            <div className="mt-1 text-slate-700">{p.outcome}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              {/* Contacts */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  Đầu mối liên hệ ({detail.contacts.length})
                </h3>
                {detail.contacts.length === 0 ? (
                  <p className="text-sm italic text-slate-500">Chưa có đầu mối nào</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.contacts.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-slate-900">
                              {c.title ? `${c.title} ` : ''}
                              {c.name}
                            </span>
                            <span className="ml-2 text-xs text-slate-500">
                              ({ORG_PROFILE_CONTACT_ROLE_LABELS[c.role as OrgProfileContactRole] ?? c.role})
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 text-slate-700">
                          <span>{c.email}</span>
                          <span className="mx-2 text-slate-300">·</span>
                          <span>{c.phone}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Documents */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  Tài liệu pháp lý ({detail.documents.length})
                </h3>
                {detail.documents.length === 0 ? (
                  <p className="text-sm italic text-slate-500">Chưa có tài liệu nào</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm"
                      >
                        <FileText className="h-4 w-4 flex-shrink-0 text-blue-700" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <a
                            href={`/${doc.fileUrl}`}
                            className="font-medium text-blue-700 hover:underline truncate block"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {doc.fileName}
                          </a>
                          <p className="text-xs text-slate-500">
                            {(doc.category && CATEGORY_LABELS[doc.category]) || 'Khác'} ·{' '}
                            {doc.uploaderName || 'Đơn vị'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        {detail && isSubmitted ? (
          <SheetFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Từ chối với lý do
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setApproveOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Phê duyệt
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>

      {detail ? (
        <>
          <ApproveDialog
            open={approveOpen}
            onOpenChange={setApproveOpen}
            profileId={detail.id}
            organizationName={detail.organization.name}
            onSuccess={handleSuccess}
          />
          <RejectDialog
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            profileId={detail.id}
            organizationName={detail.organization.name}
            onSuccess={handleSuccess}
          />
        </>
      ) : null}
    </Sheet>
  );
}

export default ProfileDetailSheet;
