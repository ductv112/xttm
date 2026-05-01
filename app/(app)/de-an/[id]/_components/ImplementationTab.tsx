'use client';

// ImplementationTab — Phase 8 Plan 08-01 Task 3.
// Hiển thị + chỉnh sửa kế hoạch triển khai + cảnh báo Thương vụ 30d.

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Globe,
  ListChecks,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';

import type { ProjectDetail } from '../../_actions/get-detail';
import { saveImplementationPlan } from '../_actions/save-impl-plan';
import {
  parseImplementationJson,
  parseConsulateContactJson,
  type ImplementationData,
  type ImplementationMilestone,
  type ImplementationStaff,
} from '@/lib/implementation';
import { ImplementationTimeline } from './ImplementationTimeline';
import { ConsulateContactDialog } from './ConsulateContactDialog';

const STATUS_OPTIONS: Array<{
  value: ImplementationMilestone['status'];
  label: string;
}> = [
  { value: 'PENDING', label: 'Chưa bắt đầu' },
  { value: 'IN_PROGRESS', label: 'Đang triển khai' },
  { value: 'DONE', label: 'Hoàn thành' },
  { value: 'BLOCKED', label: 'Bị gián đoạn' },
];

const INTERNATIONAL_KINDS = new Set([
  'EXPORT_EXHIBITION',
  'INTL_CONFERENCE',
  'TRADE_DELEGATION_OUT',
  'TRADE_INFO_EXPORT',
]);

function genId(): string {
  return 'm-' + Math.random().toString(36).slice(2, 10);
}

export function ImplementationTab({
  project,
  isOwner,
  canManage,
}: {
  project: ProjectDetail;
  isOwner: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const editable = isOwner || canManage;
  const initialData = parseImplementationJson(project.implementationJson);

  // Auto-seed milestones from plan rows if empty
  const seededInitial: ImplementationData = React.useMemo(() => {
    if (initialData.milestones.length > 0) return initialData;
    const planRows = project.plan?.rows ?? [];
    if (planRows.length === 0) return initialData;
    return {
      ...initialData,
      milestones: planRows.map(
        (r): ImplementationMilestone => ({
          id: genId(),
          title: r.task,
          startDate: null,
          endDate: r.dueDate ?? null,
          owner: r.owner ?? '',
          progress: 0,
          note: r.deliverable ?? '',
          status: 'PENDING',
        }),
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compute once
  }, []);

  const [data, setData] = React.useState<ImplementationData>(seededInitial);
  const [pending, setPending] = React.useState(false);
  const [consulateOpen, setConsulateOpen] = React.useState(false);

  const consulateContact = parseConsulateContactJson(
    project.consulateContactJson,
  );
  const isInternational = INTERNATIONAL_KINDS.has(project.kind);

  // Compute consulate warning: if international + has timeRange + start within 30d + not contacted
  const consulateWarning = React.useMemo(() => {
    if (!isInternational) return null;
    if (project.contactedConsulate) return null;
    const start = project.generalInfo?.timeRange?.start;
    if (!start) return null;
    const startTs = Date.parse(start);
    if (Number.isNaN(startTs)) return null;
    const daysUntil = Math.floor(
      (startTs - Date.now()) / (24 * 60 * 60 * 1000),
    );
    if (daysUntil < 0 || daysUntil > 60) return null;
    return { daysUntil, startDate: new Date(startTs) };
  }, [
    isInternational,
    project.contactedConsulate,
    project.generalInfo?.timeRange?.start,
  ]);

  function updateMilestone(
    id: string,
    patch: Partial<ImplementationMilestone>,
  ) {
    setData((s) => ({
      ...s,
      milestones: s.milestones.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    }));
  }

  function addMilestone() {
    setData((s) => ({
      ...s,
      milestones: [
        ...s.milestones,
        {
          id: genId(),
          title: '',
          startDate: null,
          endDate: null,
          owner: '',
          progress: 0,
          note: '',
          status: 'PENDING',
        },
      ],
    }));
  }

  function removeMilestone(id: string) {
    setData((s) => ({
      ...s,
      milestones: s.milestones.filter((m) => m.id !== id),
    }));
  }

  function updateStaff(id: string, patch: Partial<ImplementationStaff>) {
    setData((s) => ({
      ...s,
      staff: s.staff.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }));
  }

  function addStaff() {
    setData((s) => ({
      ...s,
      staff: [
        ...s.staff,
        { id: genId(), name: '', role: '', phone: '', email: '' },
      ],
    }));
  }

  function removeStaff(id: string) {
    setData((s) => ({
      ...s,
      staff: s.staff.filter((u) => u.id !== id),
    }));
  }

  async function handleSave() {
    if (!editable) return;
    setPending(true);
    try {
      const result = await saveImplementationPlan(project.id, data);
      if (result.ok) {
        toast.success('Đã lưu kế hoạch triển khai');
        router.refresh();
      } else {
        toast.error('Lưu thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cảnh báo Thương vụ 30 ngày */}
      {consulateWarning ? (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                Cảnh báo: Cần liên hệ Thương vụ ĐSQ trong vòng 30 ngày
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Đây là đề án quốc tế. Theo Điều 12 NĐ 28/2018/NĐ-CP, đơn vị
                phải liên hệ Thương vụ Việt Nam tại nước sở tại{' '}
                <strong>trước ít nhất 30 ngày</strong> kể từ thời điểm tổ chức
                hoạt động. Hoạt động bắt đầu ngày{' '}
                <strong>{formatDate(consulateWarning.startDate)}</strong> (còn{' '}
                {consulateWarning.daysUntil} ngày).
              </p>
              {editable ? (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setConsulateOpen(true)}
                >
                  <Globe className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Xác nhận đã liên hệ Thương vụ
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Liên hệ Thương vụ đã ghi nhận */}
      {project.contactedConsulate && consulateContact ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <Globe
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900">
                Đã liên hệ Thương vụ ĐSQ — {consulateContact.countryName}
              </h3>
              <div className="mt-1 text-sm text-emerald-800">
                <strong>{consulateContact.contactName}</strong>
                {consulateContact.contactTitle
                  ? ` (${consulateContact.contactTitle})`
                  : ''}
                {' · '}
                {formatDate(consulateContact.contactDate)}
              </div>
              {consulateContact.note ? (
                <p className="mt-1 text-sm italic text-emerald-700">
                  &ldquo;{consulateContact.note}&rdquo;
                </p>
              ) : null}
              {editable ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setConsulateOpen(true)}
                >
                  Cập nhật thông tin liên hệ
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Hợp đồng status badge */}
      {project.contractId ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-sm">
            Hợp đồng:{' '}
            <Link
              href={`/hop-dong/${project.contractId}`}
              className="font-mono font-semibold text-blue-700 hover:underline"
            >
              {project.contractNo}
            </Link>
            {' · '}
            <span className="font-medium">
              Trạng thái: {project.contractStatus}
            </span>
          </div>
        </div>
      ) : project.status === 'APPROVED' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Đề án đã được phê duyệt nhưng chưa có hợp đồng. Hãy đến trang{' '}
          <Link href="/hop-dong" className="font-semibold underline">
            Hợp đồng
          </Link>{' '}
          để tạo.
        </div>
      ) : null}

      {/* Tổng tiến độ + timeline */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ListChecks
            className="h-5 w-5 text-slate-700"
            aria-hidden="true"
          />
          <h3 className="font-semibold text-slate-900">
            Mốc công việc & tiến độ ({data.milestones.length})
          </h3>
        </div>
        <ImplementationTimeline milestones={data.milestones} />
      </section>

      {editable ? (
        <>
          {/* Editable milestones table */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">
                Chỉnh sửa kế hoạch
              </h4>
              <Button onClick={addMilestone} size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Thêm mốc
              </Button>
            </div>
            <div className="space-y-3">
              {data.milestones.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-1 gap-2 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-12">
                    <Label className="text-xs">Tên mốc công việc</Label>
                    <Input
                      value={m.title}
                      onChange={(e) =>
                        updateMilestone(m.id, { title: e.target.value })
                      }
                      placeholder="VD: Tuyển chọn doanh nghiệp tham gia"
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Bắt đầu</Label>
                    <Input
                      type="date"
                      value={m.startDate ?? ''}
                      onChange={(e) =>
                        updateMilestone(m.id, {
                          startDate: e.target.value || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Kết thúc</Label>
                    <Input
                      type="date"
                      value={m.endDate ?? ''}
                      onChange={(e) =>
                        updateMilestone(m.id, {
                          endDate: e.target.value || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Phụ trách</Label>
                    <Input
                      value={m.owner}
                      onChange={(e) =>
                        updateMilestone(m.id, { owner: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Tiến độ %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={m.progress}
                      onChange={(e) =>
                        updateMilestone(m.id, {
                          progress: Number(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(m.id)}
                    >
                      <Trash2
                        className="h-4 w-4 text-red-600"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                  <div className="sm:col-span-4">
                    <Label className="text-xs">Trạng thái</Label>
                    <Select
                      value={m.status}
                      onValueChange={(v) =>
                        updateMilestone(m.id, {
                          status: v as ImplementationMilestone['status'],
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-8">
                    <Label className="text-xs">Ghi chú / Kết quả</Label>
                    <Input
                      value={m.note}
                      onChange={(e) =>
                        updateMilestone(m.id, { note: e.target.value })
                      }
                      placeholder="Kết quả đạt được hoặc ghi chú"
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
              {data.milestones.length === 0 ? (
                <p className="text-center text-sm text-slate-500">
                  Chưa có mốc công việc nào — bấm &ldquo;Thêm mốc&rdquo; để
                  bắt đầu.
                </p>
              ) : null}
            </div>
          </section>

          {/* Staff editor */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-700" aria-hidden="true" />
                <h4 className="font-semibold text-slate-900">
                  Nhân sự thực hiện ({data.staff.length})
                </h4>
              </div>
              <Button onClick={addStaff} size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Thêm nhân sự
              </Button>
            </div>
            <div className="space-y-2">
              {data.staff.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-1 gap-2 rounded border border-slate-200 p-3 sm:grid-cols-12"
                >
                  <Input
                    placeholder="Họ tên"
                    value={u.name}
                    onChange={(e) =>
                      updateStaff(u.id, { name: e.target.value })
                    }
                    className="sm:col-span-3"
                  />
                  <Input
                    placeholder="Vai trò"
                    value={u.role}
                    onChange={(e) =>
                      updateStaff(u.id, { role: e.target.value })
                    }
                    className="sm:col-span-3"
                  />
                  <Input
                    placeholder="Số điện thoại"
                    value={u.phone}
                    onChange={(e) =>
                      updateStaff(u.id, { phone: e.target.value })
                    }
                    className="sm:col-span-2"
                  />
                  <Input
                    placeholder="Email"
                    value={u.email}
                    onChange={(e) =>
                      updateStaff(u.id, { email: e.target.value })
                    }
                    className="sm:col-span-3"
                  />
                  <div className="sm:col-span-1 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStaff(u.id)}
                    >
                      <Trash2
                        className="h-4 w-4 text-red-600"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </div>
              ))}
              {data.staff.length === 0 ? (
                <p className="text-center text-sm text-slate-500">
                  Chưa có nhân sự nào.
                </p>
              ) : null}
            </div>
          </section>

          {/* Schedule */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-slate-900">
              Lịch trình tổng
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Bắt đầu</Label>
                <Input
                  type="date"
                  value={data.schedule.start ?? ''}
                  onChange={(e) =>
                    setData((s) => ({
                      ...s,
                      schedule: {
                        ...s.schedule,
                        start: e.target.value || null,
                      },
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Kết thúc</Label>
                <Input
                  type="date"
                  value={data.schedule.end ?? ''}
                  onChange={(e) =>
                    setData((s) => ({
                      ...s,
                      schedule: {
                        ...s.schedule,
                        end: e.target.value || null,
                      },
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Ghi chú lịch trình</Label>
                <Textarea
                  rows={3}
                  value={data.schedule.note}
                  onChange={(e) =>
                    setData((s) => ({
                      ...s,
                      schedule: { ...s.schedule, note: e.target.value },
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={pending}>
              <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {pending ? 'Đang lưu...' : 'Lưu kế hoạch triển khai'}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-500">
          Bạn không có quyền chỉnh sửa kế hoạch triển khai này.
        </div>
      )}

      <ConsulateContactDialog
        projectId={project.id}
        open={consulateOpen}
        onOpenChange={setConsulateOpen}
        initial={consulateContact}
        defaultCountry={
          project.generalInfo?.countryIds?.[0] ? '' : ''
        }
      />
    </div>
  );
}
