'use client';

// AmendmentForm — Phase 8 Plan 08-01 Task 4.
// Dialog form đơn vị tạo yêu cầu điều chỉnh đề án.

import * as React from 'react';
import { AlertTriangle, Pencil, Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  AMENDMENT_TYPES,
  AMENDMENT_TYPE_LABELS,
  CRITICAL_AMENDMENT_TYPES,
  isCriticalAmendment,
  type AmendmentType,
} from '@/lib/amendment-rules';
import { formatVNDCompact } from '@/lib/format';

import { createAmendmentRequest } from '../_actions/create';

type Project = {
  generalInfo?: {
    timeRange?: { start?: string | null; end?: string | null } | null;
    marketIds?: string[];
    countryIds?: string[];
  } | null;
  budget?: {
    total?: number | null;
  } | null;
  objectives?: {
    objective?: string;
    content?: string;
  } | null;
};

export function AmendmentForm({
  projectId,
  projectName,
  projectGeneralInfo,
  projectBudget,
  projectObjectives,
  organizationName,
  open,
  onOpenChange,
  onSuccess,
}: {
  projectId: string;
  projectName: string;
  projectGeneralInfo: Project['generalInfo'];
  projectBudget: Project['budget'];
  projectObjectives: Project['objectives'];
  organizationName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [type, setType] = React.useState<AmendmentType>('TIME');
  const [oldValue, setOldValue] = React.useState('');
  const [newValue, setNewValue] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [pending, setPending] = React.useState(false);

  // Auto-fill old value khi đổi type
  React.useEffect(() => {
    if (!open) return;
    setOldValue(getOldValueDisplay(type, {
      generalInfo: projectGeneralInfo,
      budget: projectBudget,
      objectives: projectObjectives,
      name: projectName,
      organizationName,
    }));
    setNewValue('');
  }, [
    type,
    open,
    projectName,
    organizationName,
    projectGeneralInfo,
    projectBudget,
    projectObjectives,
  ]);

  React.useEffect(() => {
    if (open) {
      setReason('');
      setType('TIME');
    }
  }, [open]);

  const isCritical = isCriticalAmendment(type);

  async function handleSubmit() {
    if (reason.trim().length < 50) {
      toast.error('Lý do điều chỉnh phải ít nhất 50 ký tự');
      return;
    }
    if (!newValue.trim()) {
      toast.error('Vui lòng nhập giá trị mới');
      return;
    }
    setPending(true);
    try {
      const result = await createAmendmentRequest({
        projectId,
        amendmentType: type,
        oldValue: parseValueByType(type, oldValue),
        newValue: parseValueByType(type, newValue),
        reason,
      });
      if (result.ok) {
        toast.success('Đã gửi yêu cầu điều chỉnh', {
          description: result.isCritical
            ? 'Loại TRỌNG YẾU — sẽ được chuyển thẩm định lại.'
            : 'Loại NHỎ — BQL sẽ phê duyệt nội bộ.',
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error('Gửi yêu cầu thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-600" aria-hidden="true" />
            Đề nghị điều chỉnh đề án
          </DialogTitle>
          <DialogDescription>
            Đề án: <strong>{projectName}</strong>. Theo Điều 13 NĐ 28/2018/NĐ-CP,
            các điều chỉnh sẽ được phân loại tự động theo mức độ ảnh hưởng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Loại điều chỉnh *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as AmendmentType)}
            >
              <SelectTrigger id="type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AMENDMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {AMENDMENT_TYPE_LABELS[t]}
                    {CRITICAL_AMENDMENT_TYPES.includes(t)
                      ? ' (TRỌNG YẾU)'
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`rounded-md border-2 p-3 ${
              isCritical
                ? 'border-red-200 bg-red-50'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${isCritical ? 'text-red-700' : 'text-blue-700'}`}
                aria-hidden="true"
              />
              <div className="text-sm">
                {isCritical ? (
                  <p className="font-semibold text-red-900">
                    Loại điều chỉnh TRỌNG YẾU theo Điều 13 NĐ 28/2018/NĐ-CP
                  </p>
                ) : (
                  <p className="font-semibold text-blue-900">
                    Loại điều chỉnh NHỎ
                  </p>
                )}
                <p
                  className={`mt-1 ${isCritical ? 'text-red-800' : 'text-blue-800'}`}
                >
                  {isCritical
                    ? 'Yêu cầu này sẽ được chuyển HỘI ĐỒNG THẨM ĐỊNH xem xét lại. Đề án sẽ tạm chuyển về trạng thái "Đang thẩm định" trong thời gian xử lý.'
                    : 'BQL sẽ phê duyệt nội bộ. Sau khi phê duyệt, hệ thống sinh quyết định điều chỉnh và cập nhật đề án ngay.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="oldValue">Giá trị hiện tại</Label>
              {oldValue.length > 100 ? (
                <Textarea
                  id="oldValue"
                  value={oldValue}
                  readOnly
                  rows={5}
                  className="mt-1 bg-slate-50"
                />
              ) : (
                <Input
                  id="oldValue"
                  value={oldValue}
                  readOnly
                  className="mt-1 bg-slate-50"
                />
              )}
            </div>
            <div>
              <Label htmlFor="newValue">Giá trị mới đề xuất *</Label>
              {needsLargeInput(type) ? (
                <Textarea
                  id="newValue"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  rows={5}
                  placeholder={getPlaceholder(type)}
                  className="mt-1"
                />
              ) : (
                <Input
                  id="newValue"
                  type={type === 'TIME' ? 'date' : 'text'}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={getPlaceholder(type)}
                  className="mt-1"
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="reason">
              Lý do điều chỉnh * (tối thiểu 50 ký tự,{' '}
              <span
                className={
                  reason.length < 50 ? 'text-red-600' : 'text-emerald-600'
                }
              >
                hiện {reason.length}
              </span>
              )
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Mô tả chi tiết lý do cần điều chỉnh đề án (bối cảnh, ảnh hưởng, tác động...)"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {pending ? 'Đang gửi...' : 'Gửi yêu cầu điều chỉnh'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function needsLargeInput(type: AmendmentType): boolean {
  return ['CONTENT', 'OBJECTIVE', 'OTHER'].includes(type);
}

function getPlaceholder(type: AmendmentType): string {
  switch (type) {
    case 'TIME':
      return 'Chọn ngày mới...';
    case 'LOCATION':
      return 'Địa điểm mới (VD: Hà Nội, TP.HCM, Berlin...)';
    case 'PROJECT_NAME':
      return 'Tên đề án mới';
    case 'UNIT_NAME':
      return 'Tên đơn vị chủ trì mới';
    case 'OBJECTIVE':
      return 'Mô tả mục tiêu đề án mới...';
    case 'CONTENT':
      return 'Mô tả nội dung đề án mới...';
    case 'BUDGET':
      return 'Tổng dự toán mới (VND)';
    case 'MARKET':
      return 'Thị trường mục tiêu mới';
    default:
      return 'Giá trị mới...';
  }
}

function parseValueByType(type: AmendmentType, raw: string): unknown {
  if (!raw) return null;
  if (type === 'TIME') return { start: raw };
  if (type === 'BUDGET') {
    const n = Number(raw.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? { total: n } : null;
  }
  return raw;
}

function getOldValueDisplay(
  type: AmendmentType,
  ctx: {
    generalInfo: Project['generalInfo'];
    budget: Project['budget'];
    objectives: Project['objectives'];
    name: string;
    organizationName?: string;
  },
): string {
  switch (type) {
    case 'TIME': {
      const tr = ctx.generalInfo?.timeRange;
      return tr?.start && tr?.end
        ? `Từ ${tr.start} đến ${tr.end}`
        : tr?.start ?? 'Chưa có';
    }
    case 'LOCATION':
      return '— (xem chi tiết trong tab Tổng quan)';
    case 'PROJECT_NAME':
      return ctx.name;
    case 'UNIT_NAME':
      return ctx.organizationName ?? '—';
    case 'OBJECTIVE': {
      const html = ctx.objectives?.objective ?? '';
      return html.replace(/<[^>]+>/g, '').slice(0, 300);
    }
    case 'CONTENT': {
      const html = ctx.objectives?.content ?? '';
      return html.replace(/<[^>]+>/g, '').slice(0, 300);
    }
    case 'BUDGET': {
      const t = ctx.budget?.total ?? 0;
      return formatVNDCompact(t);
    }
    case 'MARKET': {
      const ids = ctx.generalInfo?.marketIds ?? [];
      return ids.length > 0
        ? `${ids.length} thị trường (xem tab Tổng quan)`
        : 'Chưa có';
    }
    default:
      return '—';
  }
}
