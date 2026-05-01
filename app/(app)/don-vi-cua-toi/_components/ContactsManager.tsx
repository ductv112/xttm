'use client';

// ContactsManager — Section 3: CRUD inline cho đầu mối liên hệ (max 20).
// Each row: tên, chức danh (title), vai trò (Select 5 options), email, sđt.
// Validate inline với contactInternal Zod schema. Thao tác qua addContact /
// updateContact / deleteContact server actions.

import * as React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  ORG_PROFILE_CONTACT_ROLE_LABELS,
  ORG_PROFILE_CONTACT_ROLES,
  type OrgProfileContact,
  type OrgProfileContactRole,
} from '@/lib/workflows/orgProfile';

import { addContact, deleteContact, updateContact } from '../_actions/contacts';

export type ContactsManagerProps = {
  initial: OrgProfileContact[];
  readOnly: boolean;
};

type EditingState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; contact: OrgProfileContact };

const VN_PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactsManager({ initial, readOnly }: ContactsManagerProps) {
  const [contacts, setContacts] = React.useState<OrgProfileContact[]>(initial);
  const [editing, setEditing] = React.useState<EditingState>({ mode: 'closed' });
  const [deleting, setDeleting] = React.useState<OrgProfileContact | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (values: ContactFormValues) => {
    setSubmitting(true);
    try {
      if (editing.mode === 'create') {
        const res = await addContact({
          name: values.name,
          title: values.title,
          role: values.role,
          email: values.email,
          phone: values.phone,
        });
        setContacts(res.contacts);
        toast.success('Đã thêm đầu mối liên hệ');
      } else if (editing.mode === 'edit') {
        const res = await updateContact({
          id: editing.contact.id,
          name: values.name,
          title: values.title,
          role: values.role,
          email: values.email,
          phone: values.phone,
        });
        setContacts(res.contacts);
        toast.success('Đã cập nhật đầu mối liên hệ');
      }
      setEditing({ mode: 'closed' });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể lưu đầu mối. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res = await deleteContact(deleting.id);
      setContacts(res.contacts);
      toast.success('Đã xóa đầu mối liên hệ');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể xóa đầu mối. Vui lòng thử lại.',
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Đầu mối liên hệ</CardTitle>
            <CardDescription>
              Danh sách người chịu trách nhiệm chính khi triển khai chương trình XTTM (tối thiểu 1, tối đa 20).
            </CardDescription>
          </div>
          {!readOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing({ mode: 'create' })}
              disabled={contacts.length >= 20}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm đầu mối
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Chưa có đầu mối nào. Vui lòng khai báo ít nhất 1 đầu mối liên hệ để gửi hồ sơ xác nhận.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Họ tên</th>
                  <th className="px-3 py-2 text-left font-medium">Chức danh / Học vị</th>
                  <th className="px-3 py-2 text-left font-medium">Vai trò</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Điện thoại</th>
                  {!readOnly ? <th className="px-3 py-2 w-20" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{c.name}</td>
                    <td className="px-3 py-2 text-slate-700">{c.title || '—'}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {ORG_PROFILE_CONTACT_ROLE_LABELS[c.role] ?? c.role}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{c.email}</td>
                    <td className="px-3 py-2 text-slate-700">{c.phone}</td>
                    {!readOnly ? (
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditing({ mode: 'edit', contact: c })}
                            aria-label="Chỉnh sửa đầu mối"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleting(c)}
                            aria-label="Xóa đầu mối"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ContactDialog
        open={editing.mode !== 'closed'}
        onOpenChange={(open) => {
          if (!open) setEditing({ mode: 'closed' });
        }}
        initial={editing.mode === 'edit' ? editing.contact : null}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xác nhận xóa đầu mối liên hệ"
        description={
          deleting
            ? `Bạn xác nhận xóa "${deleting.name}" khỏi danh sách đầu mối? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ContactDialog — form add/edit (lightweight, no RHF dependency for brevity)
// ---------------------------------------------------------------------------

type ContactFormValues = {
  name: string;
  title: string;
  role: OrgProfileContactRole;
  email: string;
  phone: string;
};

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: OrgProfileContact | null;
  submitting: boolean;
  onSubmit: (values: ContactFormValues) => Promise<void>;
};

function ContactDialog({
  open,
  onOpenChange,
  initial,
  submitting,
  onSubmit,
}: ContactDialogProps) {
  const [values, setValues] = React.useState<ContactFormValues>({
    name: '',
    title: '',
    role: 'CHU_NHIEM',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof ContactFormValues, string>>>({});

  React.useEffect(() => {
    if (open) {
      setValues({
        name: initial?.name ?? '',
        title: initial?.title ?? '',
        role: initial?.role ?? 'CHU_NHIEM',
        email: initial?.email ?? '',
        phone: initial?.phone ?? '',
      });
      setErrors({});
    }
  }, [open, initial]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!values.name.trim() || values.name.trim().length < 2) {
      next.name = 'Họ tên tối thiểu 2 ký tự';
    }
    if (!values.email.trim() || !EMAIL_REGEX.test(values.email.trim())) {
      next.email = 'Email không đúng định dạng';
    }
    if (!values.phone.trim() || !VN_PHONE_REGEX.test(values.phone.trim())) {
      next.phone = 'Số điện thoại Việt Nam không hợp lệ (ví dụ: 0912345678)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: values.name.trim(),
      title: values.title.trim(),
      role: values.role,
      email: values.email.trim(),
      phone: values.phone.trim(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="md" className="flex flex-col p-0">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <SheetHeader>
            <SheetTitle>{initial ? 'Chỉnh sửa đầu mối' : 'Thêm đầu mối liên hệ'}</SheetTitle>
            <SheetDescription>
              Vui lòng cung cấp đầy đủ thông tin để Ban quản lý có thể liên hệ khi cần.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-name">
                Họ và tên <span className="text-red-600">*</span>
              </Label>
              <Input
                id="contact-name"
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                aria-invalid={!!errors.name}
              />
              {errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="contact-title">Chức danh / Học vị</Label>
                <Input
                  id="contact-title"
                  placeholder="TS. / PGS. / CN."
                  value={values.title}
                  onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="contact-role">
                  Vai trò <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={values.role}
                  onValueChange={(role) =>
                    setValues((v) => ({ ...v, role: role as OrgProfileContactRole }))
                  }
                >
                  <SelectTrigger id="contact-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_PROFILE_CONTACT_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ORG_PROFILE_CONTACT_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contact-email">
                Email <span className="text-red-600">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                aria-invalid={!!errors.email}
              />
              {errors.email ? <p className="text-xs text-red-600">{errors.email}</p> : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contact-phone">
                Số điện thoại <span className="text-red-600">*</span>
              </Label>
              <Input
                id="contact-phone"
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
                placeholder="0912345678 hoặc +84912345678"
                aria-invalid={!!errors.phone}
              />
              {errors.phone ? <p className="text-xs text-red-600">{errors.phone}</p> : null}
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Thêm'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default ContactsManager;
