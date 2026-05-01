'use client';

// CatalogEditSheet — Sheet drawer với form switching theo CatalogKind.
// - Simple kinds (project-kind/industry-sector/promotion-type/market/country/org-unit):
//   inline RHF form với common fields + per-kind extra
// - scoring-criterion → ScoringCriterionForm (weight + parent + appliesToKinds)
// - document-template → DocumentTemplateForm (category + Tiptap editor + VariableMenu + preview)

import * as React from 'react';
import { useForm, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  getCatalogConfig,
  type CatalogKind,
} from '@/lib/catalog-types';
import {
  SCHEMA_BY_KIND,
  REGION_VALUES,
  REGION_LABELS,
  ORG_UNIT_TYPES,
  ORG_UNIT_TYPE_LABELS,
} from '../_actions/schemas';
import type { CatalogListRow } from '../_actions/list';
import { listCatalogItems } from '../_actions/list';
import { upsertCatalogItem } from '../_actions/upsert';
import {
  ScoringCriterionForm,
  type ScoringCriterionFormValues,
} from './ScoringCriterionForm';
import {
  DocumentTemplateForm,
  type DocumentTemplateFormValues,
} from './DocumentTemplateForm';

const NO_PARENT = '__none__';

type Props = {
  kind: CatalogKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogListRow | null;
  onSaved: () => void;
};

export function CatalogEditSheet({
  kind,
  open,
  onOpenChange,
  item,
  onSaved,
}: Props) {
  const config = getCatalogConfig(kind);
  const isEdit = item !== null;
  const isWide =
    kind === 'document-template' || kind === 'scoring-criterion';

  // Build defaultValues based on kind + item
  const defaultValues = React.useMemo(() => {
    return buildDefaultValues(kind, item);
  }, [kind, item]);

  // Use unknown then cast; per-kind schema dispatch
  // Cast resolver to compatible type — Zod 4 + RHF generic mismatch with discriminated union
  const form = useForm<FieldValues>({
    resolver: zodResolver(
      SCHEMA_BY_KIND[kind] as unknown as Parameters<typeof zodResolver>[0],
    ),
    defaultValues: defaultValues as FieldValues,
    mode: 'onBlur',
  });

  // Reset form khi mở sheet với item khác
  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues as FieldValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id, kind]);

  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await upsertCatalogItem(kind, item?.id ?? null, values);
      toast.success(
        isEdit
          ? `Đã cập nhật "${(values as { name: string }).name}"`
          : `Đã tạo "${(values as { name: string }).name}"`,
      );
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể lưu — vui lòng thử lại',
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size={isWide ? 'xl' : 'lg'}
        className="flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-slate-200 p-6 pb-4">
          <SheetTitle className="text-lg">
            {isEdit
              ? `Chỉnh sửa ${config.label.toLowerCase()}: ${item.name}`
              : `Thêm ${config.label.toLowerCase()}`}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Cập nhật thông tin và lưu để áp dụng thay đổi.'
              : `Điền thông tin để thêm ${config.label.toLowerCase()} mới vào danh mục.`}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6">
              {kind === 'scoring-criterion' ? (
                <ScoringCriterionForm
                  form={
                    form as unknown as UseFormReturn<ScoringCriterionFormValues>
                  }
                  currentItemId={item?.id ?? null}
                  mode={isEdit ? 'edit' : 'create'}
                />
              ) : kind === 'document-template' ? (
                <DocumentTemplateForm
                  form={
                    form as unknown as UseFormReturn<DocumentTemplateFormValues>
                  }
                  mode={isEdit ? 'edit' : 'create'}
                />
              ) : (
                <SimpleCatalogFields
                  kind={kind}
                  form={form}
                  isEdit={isEdit}
                  currentItemId={item?.id ?? null}
                />
              )}
            </div>

            <SheetFooter className="border-t border-slate-200 p-4">
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2
                        className="mr-1 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Đang lưu...
                    </>
                  ) : isEdit ? (
                    'Lưu thay đổi'
                  ) : (
                    'Tạo mới'
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// SimpleCatalogFields — render chung cho 6 catalogs đơn giản
// ---------------------------------------------------------------------------

type SimpleProps = {
  kind: CatalogKind;
  form: UseFormReturn<FieldValues>;
  isEdit: boolean;
  currentItemId: string | null;
};

function SimpleCatalogFields({ kind, form, isEdit, currentItemId }: SimpleProps) {
  // OrgUnit needs parent options
  const { data: orgUnitParents } = useQuery({
    queryKey: ['catalog', 'org-unit', 'all'],
    queryFn: () => listCatalogItems('org-unit', { isActive: 'all' }, 0, 200),
    staleTime: 60_000,
    enabled: kind === 'org-unit',
  });

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
                  placeholder={
                    kind === 'country'
                      ? 'VD: VNM (ISO alpha-3)'
                      : 'VD: EXPORT_EXHIBITION'
                  }
                  className="font-mono"
                  disabled={isEdit}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {kind === 'country'
                  ? 'Mã ISO 3166-1 alpha-3, đúng 3 chữ in hoa.'
                  : 'Chữ in hoa, số, gạch dưới. Không thể đổi sau khi tạo.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tên */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tên <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Tên hiển thị tiếng Việt" {...field} />
              </FormControl>
              <FormDescription>
                Tên hiển thị cho người dùng cuối trên các form chọn.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Tên tiếng Anh — Market + Country */}
      {(kind === 'market' || kind === 'country') ? (
        <FormField
          control={form.control}
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên tiếng Anh</FormLabel>
              <FormControl>
                <Input
                  placeholder="English name"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {/* Khu vực — Market + Country */}
      {(kind === 'market' || kind === 'country') ? (
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Khu vực <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Chọn khu vực --" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_VALUES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {REGION_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {/* Có thương vụ — Country */}
      {kind === 'country' ? (
        <FormField
          control={form.control}
          name="hasTradeOffice"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Có thương vụ Việt Nam</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <Switch
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                    aria-label="Có thương vụ"
                  />
                  <span className="text-sm text-slate-700">
                    {field.value === true ? 'Có thương vụ' : 'Chưa có'}
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Đánh dấu để kích hoạt cảnh báo &quot;30 ngày trước sự kiện
                quốc tế&quot; cho đề án sang quốc gia này.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {/* Loại — OrgUnit */}
      {kind === 'org-unit' ? (
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Loại đơn vị <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Chọn loại đơn vị --" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_UNIT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ORG_UNIT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {/* Đơn vị cha — OrgUnit */}
      {kind === 'org-unit' ? (
        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đơn vị cha</FormLabel>
              <FormControl>
                <Select
                  value={
                    field.value && field.value.length > 0
                      ? field.value
                      : NO_PARENT
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
                      Không thuộc đơn vị cha
                    </SelectItem>
                    {(orgUnitParents?.rows ?? [])
                      .filter((r) => r.id !== currentItemId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Cho phép tổ chức phân cấp (Bộ → Cục → Đơn vị trực thuộc).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {/* Mô tả */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mô tả</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Mô tả ngắn..."
                rows={3}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Display order + isActive */}
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
                Số nhỏ hơn hiển thị trước trong dropdown / danh sách chọn.
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
                Tắt để ẩn khỏi danh sách chọn nhưng giữ lại dữ liệu lịch sử.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// buildDefaultValues — preload form state per kind + item
// ---------------------------------------------------------------------------

function buildDefaultValues(
  kind: CatalogKind,
  item: CatalogListRow | null,
): Record<string, unknown> {
  const base = {
    code: item?.code ?? '',
    name: item?.name ?? '',
    description: item?.description ?? '',
    displayOrder: item?.displayOrder ?? 0,
    isActive: item?.isActive ?? true,
  };

  if (kind === 'market') {
    return {
      ...base,
      region: item?.region ?? '',
      nameEn: item?.nameEn ?? '',
    };
  }
  if (kind === 'country') {
    return {
      ...base,
      region: item?.region ?? '',
      hasTradeOffice: item?.hasTradeOffice ?? false,
      nameEn: item?.nameEn ?? '',
    };
  }
  if (kind === 'org-unit') {
    return {
      ...base,
      type: item?.type ?? '',
      parentId: item?.parentId ?? null,
    };
  }
  if (kind === 'scoring-criterion') {
    return {
      ...base,
      weight: item?.weight ?? 0,
      parentId: item?.parentId ?? null,
      appliesToKinds: item?.appliesToKinds ?? [],
    };
  }
  if (kind === 'document-template') {
    return {
      ...base,
      category: item?.category ?? '',
      bodyHtml: item?.bodyHtml ?? '',
      variables: item?.variables ?? [],
    };
  }

  return base;
}
