'use client';

// ScoringCriterionForm — đặc biệt cho CAT-07 với weight + parent hierarchy + appliesToKinds.

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/shared/MultiSelect';
import { listCatalogItems } from '../_actions/list';

const NO_PARENT = '__none__';

export type ScoringCriterionFormValues = {
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  weight: number;
  parentId?: string | null;
  appliesToKinds: string[];
};

type Props = {
  form: UseFormReturn<ScoringCriterionFormValues>;
  /** Item id hiện tại để loại khỏi parent dropdown (tránh self-reference) */
  currentItemId?: string | null;
  mode: 'create' | 'edit';
};

export function ScoringCriterionForm({ form, currentItemId, mode }: Props) {
  // Load potential parents (only root nodes / không phải descendant của current)
  const { data: parents } = useQuery({
    queryKey: ['catalog', 'scoring-criterion', 'parents'],
    queryFn: () =>
      listCatalogItems('scoring-criterion', { isActive: 'all' }, 0, 200),
    staleTime: 60_000,
  });

  // Filter to only root parents (no parentId) — Phase 2 chỉ 2-level hierarchy
  const parentOptions = React.useMemo(() => {
    const rows = parents?.rows ?? [];
    return rows.filter(
      (r) => !r.parentId && r.id !== currentItemId,
    );
  }, [parents, currentItemId]);

  // Load ProjectKinds for appliesToKinds MultiSelect
  const { data: projectKinds } = useQuery({
    queryKey: ['catalog', 'project-kind', 'active'],
    queryFn: () =>
      listCatalogItems('project-kind', { isActive: 'active' }, 0, 200),
    staleTime: 60_000,
  });

  const projectKindOptions = React.useMemo(() => {
    return (projectKinds?.rows ?? []).map((r) => ({
      value: r.code,
      label: r.name,
    }));
  }, [projectKinds]);

  return (
    <div className="space-y-5">
      <div className="form-grid">
        {/* Mã */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mã <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: TC_NL_01"
                  className="font-mono"
                  disabled={mode === 'edit'}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Chữ in hoa, số, gạch dưới. Không thể đổi sau khi tạo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Trọng số */}
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Trọng số (%) <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    {...field}
                    value={field.value ?? 0}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    %
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Trọng số trong tổng điểm thẩm định (0-100). Gợi ý: 4 nhóm =
                25% mỗi nhóm.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Tên */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Tên tiêu chí <span className="text-red-600">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="VD: Phù hợp định hướng XTTMQG"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mô tả */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mô tả</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Giải thích chi tiết tiêu chí và cách chấm điểm..."
                rows={3}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tiêu chí cha */}
      <FormField
        control={form.control}
        name="parentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tiêu chí cha</FormLabel>
            <FormControl>
              <Select
                value={
                  field.value && field.value.length > 0 ? field.value : NO_PARENT
                }
                onValueChange={(val) =>
                  field.onChange(val === NO_PARENT ? null : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>
                    Tiêu chí gốc (không thuộc nhóm cha)
                  </SelectItem>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({(p.weight ?? 0).toFixed(1)}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Nếu là nhóm cha, trọng số là tổng các tiêu chí con. Hiện tại chỉ
              hỗ trợ 2 cấp (cha-con).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Áp dụng cho loại đề án */}
      <FormField
        control={form.control}
        name="appliesToKinds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Áp dụng cho loại đề án</FormLabel>
            <FormControl>
              <MultiSelect
                options={projectKindOptions}
                values={Array.isArray(field.value) ? field.value : []}
                onChange={field.onChange}
                placeholder="-- Chọn loại đề án --"
                searchPlaceholder="Tìm loại đề án..."
                emptyText="Không tìm thấy loại đề án"
                maxBadgesShown={6}
              />
            </FormControl>
            <FormDescription>
              Tiêu chí này chỉ áp dụng khi thẩm định các loại đề án được chọn.
              Để trống = áp dụng cho tất cả.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Thứ tự hiển thị + Trạng thái */}
      <div className="form-grid">
        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thứ tự hiển thị</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                Số nhỏ hơn xuất hiện trước trong bảng tiêu chí thẩm định.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="form-grid-skip">
              <FormLabel>Trạng thái</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <Switch
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                    aria-label="Trạng thái hoạt động"
                  />
                  <span className="text-sm text-slate-700">
                    {field.value === true ? 'Đang hoạt động' : 'Đã ngừng'}
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Tắt để ngừng dùng tiêu chí trong các phiên thẩm định mới.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
