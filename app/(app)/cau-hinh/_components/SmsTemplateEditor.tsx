'use client';

// SmsTemplateEditor — Plan 02-07 (CONFIG-02 — SMS)
// Inner Tabs với 3 sub-tabs (1 per SMS template key).
// Each sub-tab: textarea với realtime character count {n}/160 + variable insert dropdown + plain-text preview.
// T-02-07-08: substitution dùng split().join() (consistent với Plan 02-06 / EmailTemplateEditor).

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Braces } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  SMS_TEMPLATE_KEYS,
  SMS_TEMPLATE_LABELS,
  type SmsTemplate,
  type SmsTemplateKey,
} from '@/lib/system-config';
import { cn } from '@/lib/utils';

import {
  smsTemplateSchema,
  type SmsTemplateInput,
} from '../_actions/schemas';
import { updateSmsTemplate } from '../_actions/template';

const SMS_VARIABLES: { key: string; label: string; example: string }[] = [
  { key: 'namKy', label: 'Năm kỳ', example: '2026' },
  { key: 'hanNopDeAn', label: 'Hạn nộp đề án', example: '30/05/2026' },
  { key: 'tenDeAn', label: 'Tên đề án', example: 'Vietnam Expo 2026' },
  { key: 'loaiCanhBao', label: 'Loại cảnh báo', example: 'cham ky HD' },
  { key: 'tenDonVi', label: 'Tên đơn vị', example: 'VITAS' },
];

const MOCK_VALUES: Record<string, string> = Object.fromEntries(
  SMS_VARIABLES.map((v) => [v.key, v.example]),
);

function getMockValue(key: string): string {
  return MOCK_VALUES[key] ?? `[${key}]`;
}

function substitutePreview(body: string, vars: string[]): string {
  let out = body;
  for (const v of vars) {
    // T-02-07-08 — split().join() thay regex để tránh injection
    out = out.split(`{{${v}}}`).join(getMockValue(v));
  }
  return out;
}

type Props = {
  templates: Record<SmsTemplateKey, SmsTemplate>;
};

export function SmsTemplateEditor({ templates }: Props) {
  const [activeKey, setActiveKey] = React.useState<SmsTemplateKey>(
    SMS_TEMPLATE_KEYS[0],
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">Mẫu SMS</h2>
        <p className="text-sm text-slate-600">
          3 mẫu SMS — bắt buộc ≤ 160 ký tự. Gateway SMS Việt thường strip dấu khi
          gửi nên admin nên soạn nội dung không dấu.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeKey}
          onValueChange={(v) => setActiveKey(v as SmsTemplateKey)}
        >
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-slate-100 p-1">
            {SMS_TEMPLATE_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} className="text-sm">
                {SMS_TEMPLATE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          {SMS_TEMPLATE_KEYS.map((key) => (
            <TabsContent key={key} value={key} className="mt-4">
              <SingleSmsTemplateForm
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
// SingleSmsTemplateForm
// -----------------------------------------------------------------------------

type SingleProps = {
  templateKey: SmsTemplateKey;
  initialValue: SmsTemplate;
};

function SingleSmsTemplateForm({ templateKey, initialValue }: SingleProps) {
  const form = useForm<SmsTemplateInput>({
    resolver: zodResolver(smsTemplateSchema),
    defaultValues: { body: initialValue.body },
  });

  const [isPending, startTransition] = React.useTransition();
  const [variableMenuOpen, setVariableMenuOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const watchedBody = form.watch('body') ?? '';
  const charCount = watchedBody.length;
  const overLimit = charCount > 160;

  const previewBody = React.useMemo(
    () =>
      substitutePreview(
        watchedBody,
        SMS_VARIABLES.map((v) => v.key),
      ),
    [watchedBody],
  );

  const handleInsertVariable = (key: string) => {
    const placeholder = `{{${key}}}`;
    const ta = textareaRef.current;
    if (!ta) {
      // Fallback: append to end
      form.setValue('body', `${watchedBody}${placeholder}`, {
        shouldDirty: true,
      });
      setVariableMenuOpen(false);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next =
      watchedBody.slice(0, start) + placeholder + watchedBody.slice(end);
    form.setValue('body', next, { shouldDirty: true });
    // Restore cursor after insert (next render)
    setTimeout(() => {
      const newPos = start + placeholder.length;
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    }, 0);
    setVariableMenuOpen(false);
  };

  const handleSubmit = (values: SmsTemplateInput) => {
    startTransition(async () => {
      try {
        await updateSmsTemplate(templateKey, values);
        toast.success(
          `Đã lưu mẫu SMS "${SMS_TEMPLATE_LABELS[templateKey]}"`,
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
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>
                  Nội dung tin nhắn <span className="text-red-600">*</span>
                </FormLabel>
                <Popover
                  open={variableMenuOpen}
                  onOpenChange={setVariableMenuOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                    >
                      <Braces className="h-4 w-4" aria-hidden="true" />
                      Chèn biến
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-0">
                    <Command>
                      <CommandInput placeholder="Tìm biến..." />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy biến phù hợp</CommandEmpty>
                        <CommandGroup>
                          {SMS_VARIABLES.map((v) => (
                            <CommandItem
                              key={v.key}
                              value={`${v.key} ${v.label}`}
                              onSelect={() => handleInsertVariable(v.key)}
                              className="flex flex-col items-start gap-0.5"
                            >
                              <div className="flex w-full items-center justify-between">
                                <span className="font-mono text-xs text-blue-700">
                                  {`{{${v.key}}}`}
                                </span>
                                <span className="text-sm text-slate-700">
                                  {v.label}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                Ví dụ: {v.example}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <FormControl>
                <Textarea
                  ref={(el) => {
                    textareaRef.current = el;
                    field.ref(el);
                  }}
                  rows={4}
                  placeholder="VD: Cuc XTTM moi Quy don vi dang ky de an XTTMQG nam {{namKy}}. Han nop: {{hanNopDeAn}}."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <FormDescription>
                  Khuyến nghị soạn không dấu — gateway brand SMS Việt thường
                  strip dấu khi gửi.
                </FormDescription>
                <span
                  className={cn(
                    'text-xs font-medium',
                    overLimit ? 'text-red-600' : 'text-slate-500',
                  )}
                  aria-live="polite"
                >
                  {charCount}/160 ký tự
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Live preview */}
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 text-xs font-medium text-slate-600">
            Xem trước (với dữ liệu mẫu)
          </div>
          <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap">
            {previewBody || (
              <span className="italic text-slate-400">
                Chưa có nội dung — soạn ở ô trên
              </span>
            )}
          </div>
        </div>

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
