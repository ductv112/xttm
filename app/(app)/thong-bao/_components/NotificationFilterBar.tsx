'use client';

// NotificationFilterBar — type select + unread checkbox + date range filter.
// URL search params source-of-truth.

import { useRouter, useSearchParams } from 'next/navigation';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
} from '@/lib/notification-types';

const TYPE_ALL = '__all__';

export function NotificationFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get('type') ?? TYPE_ALL;
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const fromDate = searchParams.get('from') ?? '';
  const toDate = searchParams.get('to') ?? '';

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === TYPE_ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    router.push(`/thong-bao?${params.toString()}`);
  };

  const handleClear = () => {
    router.push('/thong-bao');
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-type">Loại thông báo</Label>
          <Select
            value={currentType}
            onValueChange={(v) =>
              updateParam('type', v === TYPE_ALL ? null : v)
            }
          >
            <SelectTrigger id="filter-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TYPE_ALL}>Tất cả</SelectItem>
              {NOTIFICATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {NOTIFICATION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-from">Từ ngày</Label>
          <Input
            id="filter-from"
            type="date"
            value={fromDate}
            onChange={(e) => updateParam('from', e.target.value || null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-to">Đến ngày</Label>
          <Input
            id="filter-to"
            type="date"
            value={toDate}
            onChange={(e) => updateParam('to', e.target.value || null)}
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-unread"
              checked={unreadOnly}
              onCheckedChange={(checked) =>
                updateParam('unreadOnly', checked === true ? 'true' : null)
              }
            />
            <Label htmlFor="filter-unread" className="cursor-pointer">
              Chỉ chưa đọc
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            type="button"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>
    </div>
  );
}
