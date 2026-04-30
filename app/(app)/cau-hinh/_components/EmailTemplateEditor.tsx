'use client';

// EmailTemplateEditor — Plan 02-07 (CONFIG-02 — email)
// Inner Tabs với 5 sub-tabs (1 per email template key).
// Mỗi sub-tab: Subject Input + Honorific Select + Body Tabs (Soạn thảo / Xem trước iframe).
// T-02-07-04: preview iframe sandbox="" defense-in-depth XSS isolate.
// T-02-07-08: substitution dùng split().join() (consistent với Plan 02-06).

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import {
  HONORIFIC_OPTIONS,
  HONORIFIC_LABELS,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_LABELS,
  type EmailTemplate,
  type EmailTemplateKey,
} from '@/lib/system-config';

import {
  emailTemplateSchema,
  type EmailTemplateInput,
} from '../_actions/schemas';
import { updateEmailTemplate } from '../_actions/template';

// Variable list available cho mọi email template (consistent với plan spec)
const EMAIL_VARIABLES: { key: string; label: string; example: string }[] = [
  { key: 'honorific', label: 'Lời chào', example: 'Kính gửi Quý đơn vị' },
  {
    key: 'tenChuongTrinh',
    label: 'Tên chương trình',
    example: 'Chương trình XTTM Quốc gia 2026',
  },
  { key: 'namKy', label: 'Năm kỳ', example: '2026' },
  { key: 'ngayMo', label: 'Ngày mở cổng', example: '01/01/2026' },
  { key: 'hanNopDeAn', label: 'Hạn nộp đề án', example: '30/05/2026' },
  {
    key: 'tenDonVi',
    label: 'Tên đơn vị chủ trì',
    example: 'Hiệp hội Dệt may Việt Nam',
  },
  { key: 'tenDeAn', label: 'Tên đề án', example: 'Hội chợ Vietnam Expo 2026' },
  { key: 'soQuyetDinh', label: 'Số quyết định', example: '125/QĐ-XTTM' },
  { key: 'ngayKy', label: 'Ngày ký', example: '15/04/2026' },
  { key: 'nguoiKy', label: 'Người ký', example: 'TS. Nguyễn Văn A' },
  { key: 'soHopDong', label: 'Số hợp đồng', example: 'XTTM/2026/001' },
  {
    key: 'loaiCanhBao',
    label: 'Loại cảnh báo',
    example: 'chậm ký hợp đồng 60 ngày',
  },
  { key: 'ngayCanhBao', label: 'Ngày phát sinh', example: '20/04/2026' },
];

const MOCK_VALUES: Record<string, string> = Object.fromEntries(
  EMAIL_VARIABLES.map((v) => [v.key, v.example]),
);

function getMockValue(key: string): string {
  return MOCK_VALUES[key] ?? `[${key}]`;
}

function substitutePreview(html: string, vars: string[]): string {
  let out = html;
  for (const v of vars) {
    // T-02-07-08 — split().join() thay regex để tránh injection
    out = out.split(`{{${v}}}`).join(getMockValue(v));
  }
  return out;
}

function substituteHonorific(
  html: string,
  honorific: string,
): string {
  const label = HONORIFIC_LABELS[honorific as keyof typeof HONORIFIC_LABELS] ??
    honorific;
  return html.split('{{honorific}}').join(label);
}

type Props = {
  templates: Record<EmailTemplateKey, EmailTemplate>;
};

export function EmailTemplateEditor({ templates }: Props) {
  const [activeKey, setActiveKey] = React.useState<EmailTemplateKey>(
    EMAIL_TEMPLATE_KEYS[0],
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">Mẫu email</h2>
        <p className="text-sm text-slate-600">
          5 mẫu email tự động — sử dụng lời chào trang trọng tiếng Việt và biến
          động dạng {'{{tenBien}}'}.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeKey}
          onValueChange={(v) => setActiveKey(v as EmailTemplateKey)}
        >
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-slate-100 p-1">
            {EMAIL_TEMPLATE_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} className="text-sm">
                {EMAIL_TEMPLATE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          {EMAIL_TEMPLATE_KEYS.map((key) => (
            <TabsContent key={key} value={key} className="mt-4">
              <SingleEmailTemplateForm
                templateKey={key}
                initialValue={templates[key]}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// SingleEmailTemplateForm — 1 form per template key
// -----------------------------------------------------------------------------

type SingleProps = {
  templateKey: EmailTemplateKey;
  initialValue: EmailTemplate;
};

function SingleEmailTemplateForm({ templateKey, initialValue }: SingleProps) {
  const form = useForm<EmailTemplateInput>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      subject: initialValue.subject,
      honorific: initialValue.honorific as EmailTemplateInput['honorific'],
      bodyHtml: initialValue.bodyHtml,
    },
  });

  const [isPending, startTransition] = React.useTransition();
  const watchedBody = form.watch('bodyHtml') ?? '';
  const watchedHonorific = form.watch('honorific');

  const previewHtml = React.useMemo(() => {
    const variables = EMAIL_VARIABLES.map((v) => v.key);
    const withHonorific = substituteHonorific(watchedBody, watchedHonorific);
    return substitutePreview(withHonorific, variables);
  }, [watchedBody, watchedHonorific]);

  const previewSrcDoc = React.useMemo(
    () => `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Be Vietnam Pro', system-ui, sans-serif; padding: 24px; color: #0f172a; line-height: 1.6; max-width: 720px; }
  h1, h2, h3 { color: #1e293b; }
  p { margin: 0.75em 0; }
  ul, ol { padding-left: 1.5em; }
  blockquote { border-left: 4px solid #e2e8f0; padding-left: 1em; color: #475569; }
  a { color: #1d4ed8; }
  strong { color: #0f172a; }
</style>
</head>
<body>
${previewHtml || '<p style="color:#94a3b8;font-style:italic">Chưa có nội dung — soạn thảo ở tab "Soạn thảo"</p>'}
</body>
</html>`,
    [previewHtml],
  );

  const handleSubmit = (values: EmailTemplateInput) => {
    startTransition(async () => {
      try {
        await updateEmailTemplate(templateKey, values);
        toast.success(
          `Đã lưu mẫu email "${EMAIL_TEMPLATE_LABELS[templateKey]}"`,
        );
        form.reset(values);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
        toast.error(msg);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  Tiêu đề <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="VD: Mời tham gia Chương trình XTTM Quốc gia năm {{namKy}}"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="honorific"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Lời chào <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HONORIFIC_OPTIONS.map((h) => (
                        <SelectItem key={h} value={h}>
                          {HONORIFIC_LABELS[h]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription className="text-xs">
                  Tự động thay vào biến {'{{honorific}}'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bodyHtml"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nội dung email <span className="text-red-600">*</span>
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
                      placeholder="Soạn nội dung email... Dùng nút 'Chèn biến' trong toolbar để chèn placeholder."
                      variables={EMAIL_VARIABLES}
                      minHeight={320}
                    />
                  </FormControl>
                </TabsContent>

                <TabsContent value="preview" className="mt-2">
                  {/* T-02-07-04: sandbox iframe blocks scripts */}
                  <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                      Xem trước với dữ liệu mẫu — biến{' '}
                      <code className="font-mono">{'{{tenDeAn}}'}</code> sẽ thay
                      bằng giá trị thực khi gửi.
                    </div>
                    <iframe
                      title="Xem trước mẫu email"
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

        <div className="flex items-center justify-end border-t border-slate-200 pt-4">
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? (
              <Loader2
                className="mr-1 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Save className="mr-1 h-4 w-4" aria-hidden="true" />
            )}
            Lưu mẫu này
          </Button>
        </div>
      </form>
    </Form>
  );
}
