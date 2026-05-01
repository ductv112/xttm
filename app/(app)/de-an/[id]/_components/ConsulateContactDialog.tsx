'use client';

// ConsulateContactDialog — Phase 8 Plan 08-01 Task 3.
// Converted to Sheet (right drawer) for richer form layout (Phase post-POC UI overhaul).

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { confirmConsulateContact } from '../_actions/confirm-consulate';
import type { ConsulateContactInput } from '@/lib/implementation';

export function ConsulateContactDialog({
  projectId,
  open,
  onOpenChange,
  initial,
  defaultCountry,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ConsulateContactInput | null;
  defaultCountry?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState<ConsulateContactInput>({
    countryName: initial?.countryName ?? defaultCountry ?? '',
    contactName: initial?.contactName ?? '',
    contactTitle: initial?.contactTitle ?? '',
    contactPhone: initial?.contactPhone ?? '',
    contactEmail: initial?.contactEmail ?? '',
    contactDate:
      initial?.contactDate ?? new Date().toISOString().slice(0, 10),
    note: initial?.note ?? '',
  });

  React.useEffect(() => {
    if (open && initial) {
      setForm({
        countryName: initial.countryName,
        contactName: initial.contactName,
        contactTitle: initial.contactTitle,
        contactPhone: initial.contactPhone,
        contactEmail: initial.contactEmail,
        contactDate: initial.contactDate,
        note: initial.note,
      });
    }
  }, [open, initial]);

  async function handleSubmit() {
    setPending(true);
    try {
      const result = await confirmConsulateContact(projectId, form);
      if (result.ok) {
        toast.success('Đã ghi nhận liên hệ Thương vụ ĐSQ');
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error('Lưu thất bại', { description: result.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="xl" className="p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
            Xác nhận liên hệ Thương vụ ĐSQ
          </SheetTitle>
          <SheetDescription>
            Ghi nhận thông tin đã liên hệ với Thương vụ Việt Nam tại nước sở
            tại trước sự kiện ít nhất 30 ngày (theo Điều 12 NĐ 28/2018/NĐ-CP).
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="country">Quốc gia / Thị trường *</Label>
              <Input
                id="country"
                value={form.countryName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, countryName: e.target.value }))
                }
                placeholder="VD: Hàn Quốc, Nhật Bản, UAE..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactName">Họ tên người liên hệ *</Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, contactName: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactTitle">Chức vụ</Label>
              <Input
                id="contactTitle"
                value={form.contactTitle}
                onChange={(e) =>
                  setForm((s) => ({ ...s, contactTitle: e.target.value }))
                }
                placeholder="Tham tán thương mại, Tùy viên..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Số điện thoại</Label>
              <Input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((s) => ({ ...s, contactPhone: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((s) => ({ ...s, contactEmail: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contactDate">Ngày liên hệ *</Label>
              <Input
                id="contactDate"
                type="date"
                value={form.contactDate}
                onChange={(e) =>
                  setForm((s) => ({ ...s, contactDate: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="note">Ghi chú nội dung trao đổi</Label>
              <Textarea
                id="note"
                value={form.note}
                onChange={(e) =>
                  setForm((s) => ({ ...s, note: e.target.value }))
                }
                rows={4}
                placeholder="Mô tả ngắn gọn nội dung đã trao đổi với Thương vụ ĐSQ..."
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {pending ? 'Đang lưu...' : 'Lưu thông tin liên hệ'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
