'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { createCouncil } from '../_actions/create';

const TERM_OPTIONS = [
  { value: 'Lần 1', label: 'Lần 1' },
  { value: 'Lần 2', label: 'Lần 2 (bổ sung)' },
  { value: 'Lần 3', label: 'Lần 3' },
];

export function CreateCouncilButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [term, setTerm] = React.useState<string>('Lần 1');
  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 5) {
      toast.error('Tên hội đồng tối thiểu 5 ký tự');
      return;
    }
    try {
      setBusy(true);
      const result = await createCouncil({ name: trimmed, term });
      toast.success(`Đã tạo hội đồng "${result.name}"`);
      setOpen(false);
      setName('');
      setTerm('Lần 1');
      router.push(`/hoi-dong/${result.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo hội đồng thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button id="create-council" onClick={() => setOpen(true)} size="default">
        <PlusCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Tạo hội đồng mới
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo hội đồng thẩm định mới</DialogTitle>
            <DialogDescription>
              Khởi tạo hội đồng cho chu kỳ chương trình hiện tại. Bạn có thể
              thêm thành viên + phân công đề án ở bước sau.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="council-name">Tên hội đồng</Label>
              <Input
                id="council-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Hội đồng Thẩm định Chương trình XTTM Quốc gia 2026"
                maxLength={200}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="council-term">Kỳ thẩm định</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger id="council-term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={busy}>
              {busy ? (
                <>
                  <Loader2
                    className="mr-1.5 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Đang tạo...
                </>
              ) : (
                'Tạo hội đồng'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
