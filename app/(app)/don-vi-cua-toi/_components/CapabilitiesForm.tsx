'use client';

// CapabilitiesForm — Section 2 năng lực hoạt động:
// - description: RichTextEditor (Tiptap) — mô tả ≥50 chars để pass validateGuards
// - achievements: textarea ngắn cho thành tích
// - pastProjects: table inline (tên / năm / kết quả) max 20 rows
// Auto-save debounce 1s sau khi user dừng tương tác.

import * as React from 'react';
import { Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/shared/RichTextEditor';

import { updateMyProfile } from '../_actions/update';
import type { OrgProfileCapabilities, OrgProfilePastProject } from '@/lib/workflows/orgProfile';

export type CapabilitiesFormProps = {
  initial: OrgProfileCapabilities;
  readOnly: boolean;
};

const AUTOSAVE_DEBOUNCE_MS = 1000;

const MIN_DESCRIPTION_CHARS = 50;

function stripHtmlLength(html: string): number {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length;
}

export function CapabilitiesForm({ initial, readOnly }: CapabilitiesFormProps) {
  const [description, setDescription] = React.useState<string>(initial.description ?? '');
  const [achievements, setAchievements] = React.useState<string>(initial.achievements ?? '');
  const [pastProjects, setPastProjects] = React.useState<OrgProfilePastProject[]>(
    initial.pastProjects ?? [],
  );
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = React.useRef<string>(
    JSON.stringify({
      description: initial.description ?? '',
      achievements: initial.achievements ?? '',
      pastProjects: initial.pastProjects ?? [],
    }),
  );

  const triggerSave = React.useCallback(
    async (values: OrgProfileCapabilities) => {
      try {
        setSaveState('saving');
        await updateMyProfile({ capabilities: values });
        lastSavedRef.current = JSON.stringify(values);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (err) {
        setSaveState('error');
        toast.error(
          err instanceof Error
            ? err.message
            : 'Không thể lưu năng lực hoạt động. Vui lòng thử lại.',
        );
      }
    },
    [],
  );

  // Schedule debounced save when any field changes
  React.useEffect(() => {
    if (readOnly) return;
    const values = { description, achievements, pastProjects };
    const serialized = JSON.stringify(values);
    if (serialized === lastSavedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void triggerSave(values);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description, achievements, pastProjects, readOnly, triggerSave]);

  const descriptionLen = stripHtmlLength(description);

  const addPastProject = () => {
    setPastProjects((prev) => [
      ...prev,
      { name: '', year: new Date().getFullYear(), outcome: '' },
    ]);
  };

  const updatePastProject = (idx: number, patch: Partial<OrgProfilePastProject>) => {
    setPastProjects((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    );
  };

  const removePastProject = (idx: number) => {
    setPastProjects((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Năng lực hoạt động</CardTitle>
            <CardDescription>
              Mô tả năng lực, thành tích và các đề án XTTM đã thực hiện trong những năm gần đây.
            </CardDescription>
          </div>
          <SaveIndicator state={saveState} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-700">
              Mô tả năng lực <span className="text-red-600">*</span>
            </Label>
            <span
              className={
                descriptionLen >= MIN_DESCRIPTION_CHARS
                  ? 'text-xs text-emerald-700'
                  : 'text-xs text-amber-700'
              }
            >
              {descriptionLen} / {MIN_DESCRIPTION_CHARS} ký tự tối thiểu
            </span>
          </div>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Mô tả năng lực chuyên môn, kinh nghiệm tổ chức XTTM, đội ngũ chuyên gia, hạ tầng triển khai..."
            readOnly={readOnly}
            minHeight={180}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="achievements" className="text-slate-700">
            Thành tích nổi bật
          </Label>
          <Textarea
            id="achievements"
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="Các giải thưởng, danh hiệu, công nhận của Bộ Công Thương / cơ quan khác..."
            disabled={readOnly}
            rows={3}
          />
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-700">
              Các đề án XTTM đã thực hiện <span className="text-slate-500 font-normal">(tối đa 20)</span>
            </Label>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPastProject}
                disabled={pastProjects.length >= 20}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Thêm đề án
              </Button>
            ) : null}
          </div>

          {pastProjects.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
              Chưa có đề án nào — vui lòng bổ sung 2-3 đề án XTTM gần nhất kèm kết quả định lượng để hồ sơ thuyết phục hơn.
            </p>
          ) : (
            <div className="space-y-3">
              {pastProjects.map((p, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-slate-50/50 p-3 md:grid-cols-[1fr_auto_2fr_auto]"
                >
                  <Input
                    placeholder="Tên đề án"
                    value={p.name}
                    onChange={(e) => updatePastProject(idx, { name: e.target.value })}
                    disabled={readOnly}
                  />
                  <Input
                    type="number"
                    placeholder="Năm"
                    className="md:w-24"
                    value={p.year ?? ''}
                    onChange={(e) =>
                      updatePastProject(idx, {
                        year: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    disabled={readOnly}
                  />
                  <Input
                    placeholder="Kết quả đạt được (số DN tham gia, giá trị HĐ ký kết...)"
                    value={p.outcome}
                    onChange={(e) => updatePastProject(idx, { outcome: e.target.value })}
                    disabled={readOnly}
                  />
                  {!readOnly ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePastProject(idx)}
                      aria-label="Xóa đề án"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SaveIndicator({
  state,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error';
}) {
  if (state === 'idle') return null;
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Đang lưu...
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Đã lưu
      </span>
    );
  }
  return <span className="text-xs text-red-600">Lưu thất bại</span>;
}

export default CapabilitiesForm;
