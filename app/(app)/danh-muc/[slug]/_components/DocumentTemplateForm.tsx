'use client';

// DocumentTemplateForm — đặc biệt cho CAT-08 với category + Tiptap editor + VariableMenu + preview iframe.
// T-02-06-04: preview rendered trong iframe sandbox để isolate XSS từ admin input.
// T-02-06-05: variable substitution dùng split().join() thay vì regex để tránh regex injection.

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Plus, X } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import {
  DOC_TEMPLATE_CATEGORIES,
  DOC_TEMPLATE_CATEGORY_LABELS,
} from '../_actions/schemas';

// Mock values cho preview — match seed Plan 02-02 placeholders.
// T-02-06-05: constant lookup, no regex evaluation of user input.
const MOCK_VALUES: Record<string, string> = {
  tenChuongTrinh: 'Chương trình XTTM Quốc gia 2026',
  namKy: '2026',
  hanNopDeAn: '30/05/2026',
  tenDonVi: 'Hiệp hội Dệt may Việt Nam',
  tenDeAn: 'Hội chợ Vietnam Expo 2026',
  soToTrinh: '12/TTr-XTTM',
  ngayKy: '15/04/2026',
  nguoiKy: 'TS. Nguyễn Văn A',
  diaDiem: 'Trung tâm Triển lãm Quốc tế ICE Hà Nội',
  thoiGianBatDau: '01/06/2026',
  thoiGianKetThuc: '05/06/2026',
  ngonNgu: 'Tiếng Việt và Tiếng Anh',
  ngayPhatHanh: '10/04/2026',
  soQuyetDinh: '125/QĐ-XTTM',
  tongKinhPhi: '5.500.000.000 VND',
  kinhPhiNganSach: '3.500.000.000 VND',
  kinhPhiDoiUng: '2.000.000.000 VND',
};

function getMockValue(key: string): string {
  return MOCK_VALUES[key] ?? `[${key}]`;
}

function substitutePreview(html: string, variables: string[]): string {
  let out = html;
  for (const v of variables) {
    // T-02-06-05 — split().join() thay vì regex để tránh regex injection
    out = out.split(`{{${v}}}`).join(getMockValue(v));
  }
  return out;
}

export type DocumentTemplateFormValues = {
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  category: (typeof DOC_TEMPLATE_CATEGORIES)[number];
  bodyHtml: string;
  variables: string[];
};

type Props = {
  form: UseFormReturn<DocumentTemplateFormValues>;
  mode: 'create' | 'edit';
};

export function DocumentTemplateForm({ form, mode }: Props) {
  const [variableInput, setVariableInput] = React.useState('');
  const watchedVariables = form.watch('variables') ?? [];
  const watchedBody = form.watch('bodyHtml') ?? '';

  const variableMenuItems = React.useMemo(
    () =>
      watchedVariables.map((key) => ({
        key,
        label: key,
        example: getMockValue(key),
      })),
    [watchedVariables],
  );

  const handleAddVariable = () => {
    const v = variableInput.trim();
    if (!v) return;
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(v)) {
      form.setError('variables', {
        message: 'Tên biến chỉ chứa chữ cái và số, bắt đầu bằng chữ cái',
      });
      return;
    }
    if (watchedVariables.includes(v)) {
      setVariableInput('');
      return;
    }
    form.setValue('variables', [...watchedVariables, v], {
      shouldDirty: true,
    });
    form.clearErrors('variables');
    setVariableInput('');
  };

  const handleRemoveVariable = (v: string) => {
    form.setValue(
      'variables',
      watchedVariables.filter((x) => x !== v),
      { shouldDirty: true },
    );
  };

  const previewHtml = React.useMemo(
    () => substitutePreview(watchedBody, watchedVariables),
    [watchedBody, watchedVariables],
  );

  // T-02-06-04 — sandbox iframe để isolate template HTML khỏi parent context
  const previewSrcDoc = React.useMemo(() => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Be Vietnam Pro', system-ui, sans-serif; padding: 24px; color: #0f172a; line-height: 1.6; }
  h1, h2, h3 { color: #1e293b; }
  h2 { font-size: 1.25rem; font-weight: 600; }
  h3 { font-size: 1.1rem; font-weight: 600; }
  p { margin: 0.75em 0; }
  ul, ol { padding-left: 1.5em; }
  blockquote { border-left: 4px solid #e2e8f0; padding-left: 1em; color: #475569; }
  a { color: #1d4ed8; }
</style>
</head>
<body>
${previewHtml || '<p style="color:#94a3b8;font-style:italic">Chưa có nội dung — soạn thảo ở tab "Soạn thảo"</p>'}
</body>
</html>`;
  }, [previewHtml]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  placeholder="VD: TEMPLATE_CV_MOI"
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

        {/* Loại văn bản */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Loại văn bản <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Chọn loại văn bản --" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TEMPLATE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {DOC_TEMPLATE_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
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
              Tên mẫu <span className="text-red-600">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="VD: Tờ trình phê duyệt đề án"
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
                placeholder="Mô tả mục đích sử dụng mẫu..."
                rows={2}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Variables — tag input */}
      <FormField
        control={form.control}
        name="variables"
        render={() => (
          <FormItem>
            <FormLabel>Biến (placeholder)</FormLabel>
            <FormDescription>
              Định nghĩa biến để chèn vào nội dung mẫu dạng{' '}
              <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                {'{{tenBien}}'}
              </code>
              . Sau đó dùng nút "Chèn biến" trong toolbar editor.
            </FormDescription>
            <div className="flex gap-2">
              <Input
                placeholder="VD: tenChuongTrinh"
                value={variableInput}
                onChange={(e) => setVariableInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariable();
                  }
                }}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVariable}
              >
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Thêm
              </Button>
            </div>
            {watchedVariables.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {watchedVariables.map((v) => (
                  <Badge
                    key={v}
                    variant="outline"
                    className="gap-1 border-blue-200 bg-blue-50 pr-1 font-mono text-blue-700"
                  >
                    <span>{`{{${v}}}`}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(v)}
                      className="rounded-full p-0.5 hover:bg-blue-200"
                      aria-label={`Xóa biến ${v}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Body editor — Tabs (Soạn thảo / Xem trước) */}
      <FormField
        control={form.control}
        name="bodyHtml"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Nội dung mẫu <span className="text-red-600">*</span>
            </FormLabel>
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Soạn thảo</TabsTrigger>
                <TabsTrigger value="preview">Xem trước</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <FormControl>
                  <RichTextEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Soạn thảo nội dung mẫu... Dùng nút 'Chèn biến' trong toolbar để chèn placeholder."
                    variables={variableMenuItems}
                    minHeight={320}
                  />
                </FormControl>
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                {/* T-02-06-04: sandbox iframe blocks scripts even nếu admin paste <script> */}
                <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                    Xem trước với dữ liệu mẫu — biến{' '}
                    <code className="font-mono">{'{{tenChuongTrinh}}'}</code>{' '}
                    sẽ thay bằng giá trị thực khi sinh văn bản.
                  </div>
                  <iframe
                    title="Xem trước mẫu văn bản"
                    sandbox=""
                    srcDoc={previewSrcDoc}
                    className="h-[400px] w-full border-0"
                  />
                </div>
              </TabsContent>
            </Tabs>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Display order + isActive */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
