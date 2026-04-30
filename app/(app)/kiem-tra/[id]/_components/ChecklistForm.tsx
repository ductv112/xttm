'use client';

// ChecklistForm — chuyên viên đánh dấu ✓/✗/N/A + ghi chú từng item.
// Autosave debounce 1s. Disabled khi project status không cho edit.
//
// Layout: vertical list, mỗi item:
//   [Checkbox group ✓/✗/N/A] [label + description] [textarea note]

import * as React from 'react';
import { Check, FileText, X, MinusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CHECKLIST_ITEMS,
  CHECKLIST_PASS_THRESHOLD,
  type ChecklistEntry,
  type ChecklistItemStatus,
  computeChecklistPassRatio,
} from '@/lib/intake-checklist';

import { saveChecklist } from '../../_actions/save-checklist';

type Props = {
  projectId: string;
  initialEntries: ChecklistEntry[];
  readonly: boolean;
};

const STATUS_OPTIONS: {
  value: ChecklistItemStatus;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tone: string;
}[] = [
  {
    value: '✓',
    label: 'Đạt',
    icon: Check,
    tone: 'data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 data-[active=true]:border-emerald-300',
  },
  {
    value: '✗',
    label: 'Không đạt',
    icon: X,
    tone: 'data-[active=true]:bg-red-100 data-[active=true]:text-red-700 data-[active=true]:border-red-300',
  },
  {
    value: 'N/A',
    label: 'Không áp dụng',
    icon: MinusCircle,
    tone: 'data-[active=true]:bg-slate-200 data-[active=true]:text-slate-700 data-[active=true]:border-slate-400',
  },
];

export function ChecklistForm({ projectId, initialEntries, readonly }: Props) {
  // Map by itemId for O(1) reads
  const [entriesByItemId, setEntriesByItemId] = React.useState<
    Map<string, ChecklistEntry>
  >(() => new Map(initialEntries.map((e) => [e.itemId, e] as const)));
  const [savingState, setSavingState] = React.useState<
    'idle' | 'pending' | 'saving' | 'saved' | 'error'
  >('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toEntries = React.useCallback(
    (m: Map<string, ChecklistEntry>): ChecklistEntry[] =>
      Array.from(m.values()),
    [],
  );

  // Trigger autosave whenever entries change
  const triggerSave = React.useCallback(
    (m: Map<string, ChecklistEntry>) => {
      if (readonly) return;
      setSavingState('pending');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          setSavingState('saving');
          await saveChecklist({
            projectId,
            items: toEntries(m).map((e) => ({
              itemId: e.itemId,
              status: e.status,
              note: e.note,
            })),
          });
          setSavingState('saved');
          setLastSavedAt(new Date());
        } catch (err) {
          setSavingState('error');
          toast.error(
            err instanceof Error ? err.message : 'Lưu checklist thất bại',
          );
        }
      }, 1000);
    },
    [projectId, toEntries, readonly],
  );

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleStatusChange = (
    itemId: string,
    status: ChecklistItemStatus,
  ) => {
    const next = new Map(entriesByItemId);
    const existing = next.get(itemId);
    next.set(itemId, {
      itemId,
      status,
      note: existing?.note,
    });
    setEntriesByItemId(next);
    triggerSave(next);
  };

  const handleNoteChange = (itemId: string, note: string) => {
    const next = new Map(entriesByItemId);
    const existing = next.get(itemId);
    if (!existing) {
      // Auto-set to '✓' when user only adds note
      next.set(itemId, { itemId, status: '✓', note });
    } else {
      next.set(itemId, { ...existing, note });
    }
    setEntriesByItemId(next);
    triggerSave(next);
  };

  const progress = React.useMemo(
    () =>
      computeChecklistPassRatio({ items: toEntries(entriesByItemId) }),
    [entriesByItemId, toEntries],
  );

  const meetsThreshold = progress.ratio >= CHECKLIST_PASS_THRESHOLD;
  const requiredItems = CHECKLIST_ITEMS.filter((i) => i.required);
  const optionalItems = CHECKLIST_ITEMS.filter((i) => !i.required);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-900">
              Tiến độ checklist
            </span>
            <Badge
              variant="outline"
              className={cn(
                'ml-2',
                meetsThreshold
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700',
              )}
            >
              {progress.passed}/{progress.total} ={' '}
              {Math.round(progress.ratio * 100)}%
            </Badge>
          </div>
          <SaveStatus state={savingState} lastSavedAt={lastSavedAt} />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full transition-all',
              meetsThreshold ? 'bg-emerald-500' : 'bg-amber-400',
            )}
            style={{ width: `${Math.min(100, progress.ratio * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {meetsThreshold
            ? `Đã đạt ngưỡng ${Math.round(CHECKLIST_PASS_THRESHOLD * 100)}% — có thể xác nhận hợp lệ.`
            : `Cần đạt tối thiểu ${Math.round(CHECKLIST_PASS_THRESHOLD * 100)}% (${Math.ceil(progress.total * CHECKLIST_PASS_THRESHOLD)}/${progress.total} mục) trước khi xác nhận hợp lệ.`}
        </p>
      </div>

      {/* Required section */}
      <ChecklistSection
        title="Mục bắt buộc"
        items={requiredItems}
        entries={entriesByItemId}
        readonly={readonly}
        onStatusChange={handleStatusChange}
        onNoteChange={handleNoteChange}
      />

      {/* Optional section */}
      {optionalItems.length > 0 ? (
        <ChecklistSection
          title="Mục tham khảo (không bắt buộc)"
          items={optionalItems}
          entries={entriesByItemId}
          readonly={readonly}
          onStatusChange={handleStatusChange}
          onNoteChange={handleNoteChange}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type ChecklistSectionProps = {
  title: string;
  items: typeof CHECKLIST_ITEMS;
  entries: Map<string, ChecklistEntry>;
  readonly: boolean;
  onStatusChange: (itemId: string, status: ChecklistItemStatus) => void;
  onNoteChange: (itemId: string, note: string) => void;
};

function ChecklistSection({
  title,
  items,
  entries,
  readonly,
  onStatusChange,
  onNoteChange,
}: ChecklistSectionProps) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </header>
      <ul className="divide-y divide-slate-200">
        {items.map((item, idx) => {
          const entry = entries.get(item.id);
          return (
            <li key={item.id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-slate-900">
                    {item.label}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = entry?.status === opt.value;
                      return (
                        <Button
                          key={opt.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          data-active={active}
                          disabled={readonly}
                          onClick={() => onStatusChange(item.id, opt.value)}
                          className={cn(
                            'h-8 border-slate-200 text-xs',
                            opt.tone,
                          )}
                        >
                          <Icon className="mr-1 h-3.5 w-3.5" aria-hidden={true} />
                          {opt.label}
                        </Button>
                      );
                    })}
                    {entry?.status ? (
                      <span className="ml-2 text-xs text-slate-500">
                        Đã đánh giá: <strong>{entry.status}</strong>
                      </span>
                    ) : (
                      <span className="ml-2 text-xs text-slate-400">
                        Chưa đánh giá
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <Textarea
                      placeholder="Ghi chú đánh giá (tùy chọn)…"
                      value={entry?.note ?? ''}
                      onChange={(e) => onNoteChange(item.id, e.target.value)}
                      disabled={readonly}
                      rows={2}
                      maxLength={500}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SaveStatus({
  state,
  lastSavedAt,
}: {
  state: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
}) {
  if (state === 'saving' || state === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {state === 'pending' ? 'Sắp lưu…' : 'Đang lưu…'}
      </span>
    );
  }
  if (state === 'saved' && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <Check className="h-3 w-3" aria-hidden="true" />
        Đã lưu lúc {lastSavedAt.toLocaleTimeString('vi-VN')}
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <X className="h-3 w-3" aria-hidden="true" />
        Lưu thất bại
      </span>
    );
  }
  return null;
}
