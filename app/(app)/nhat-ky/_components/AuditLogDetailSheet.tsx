'use client';

import * as React from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime } from '@/lib/format';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
} from '@/lib/audit-types';
import type { AuditLogRow } from '../_actions/types';

type Props = {
  row: AuditLogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuditLogDetailSheet({ row, open, onOpenChange }: Props) {
  const parsed = React.useMemo(() => parseDiffJson(row?.diffJson), [row?.diffJson]);

  async function copyJson() {
    if (!row?.diffJson) {
      toast.info('Không có dữ liệu chi tiết để sao chép');
      return;
    }
    try {
      await navigator.clipboard.writeText(row.diffJson);
      toast.success('Đã sao chép JSON vào bộ nhớ đệm');
    } catch {
      toast.error('Không thể sao chép. Vui lòng thử lại');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] flex flex-col p-0">
        {row && (
          <>
            <SheetHeader className="border-b border-slate-200 p-6">
              <SheetTitle className="text-base">
                {AUDIT_ACTION_LABELS[row.action]}{' '}
                {AUDIT_RESOURCE_LABELS[row.resource] ?? row.resource}
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-600">
                {formatDateTime(row.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="space-y-6 p-6">
                <Section title="Người thực hiện">
                  <Field label="Họ tên" value={row.userFullName} />
                  <Field
                    label="Vai trò"
                    value={ROLE_LABELS[row.userRole as Role] ?? row.userRole}
                  />
                  <Field label="Địa chỉ IP" value={row.ip ?? '—'} />
                  <Field
                    label="Trình duyệt"
                    value={summarizeUserAgent(row.userAgent)}
                  />
                </Section>

                <Section title="Đối tượng">
                  <Field
                    label="ID"
                    value={row.resourceId ?? '—'}
                    mono
                  />
                </Section>

                <Section title="Thay đổi">
                  <DiffView action={row.action} parsed={parsed} />
                </Section>
              </div>
            </ScrollArea>

            <SheetFooter className="border-t border-slate-200 p-4 flex-row gap-2">
              <Button variant="outline" onClick={copyJson} className="gap-1">
                <Copy className="h-4 w-4" />
                Sao chép JSON
              </Button>
              <Button variant="default" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------

type ParsedDiff = {
  before?: unknown;
  after?: unknown;
  diff?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
};

function parseDiffJson(raw: string | null | undefined): ParsedDiff | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedDiff;
  } catch {
    return null;
  }
}

function DiffView({
  action,
  parsed,
}: {
  action: string;
  parsed: ParsedDiff | null;
}) {
  if (!parsed) {
    return (
      <p className="text-sm text-slate-500 italic">
        Không có thay đổi chi tiết
      </p>
    );
  }

  // CREATE — show after only
  if (action === 'CREATE' && parsed.after !== undefined) {
    return (
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
          Sau khi tạo
        </p>
        <JsonBlock value={parsed.after} className="bg-green-50 border-green-200" />
      </div>
    );
  }

  // DELETE — show before only
  if (action === 'DELETE' && parsed.before !== undefined) {
    return (
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
          Trước khi xóa
        </p>
        <JsonBlock value={parsed.before} className="bg-red-50 border-red-200" />
      </div>
    );
  }

  // UPDATE / TRANSITION / others — show key-by-key diff if present
  if (parsed.diff && Object.keys(parsed.diff).length > 0) {
    return (
      <div className="space-y-3">
        {Object.entries(parsed.diff).map(([key, change]) => (
          <div key={key} className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border border-red-200 bg-red-50 p-2">
              <div className="text-xs font-semibold text-red-900 mb-1">
                {key} (cũ)
              </div>
              <s className="font-mono text-xs text-red-700 break-all">
                {formatVal(change.from)}
              </s>
            </div>
            <div className="rounded-md border border-green-200 bg-green-50 p-2">
              <div className="text-xs font-semibold text-green-900 mb-1">
                {key} (mới)
              </div>
              <span className="font-mono text-xs text-green-800 break-all">
                {formatVal(change.to)}
              </span>
            </div>
          </div>
        ))}
        {parsed.metadata && Object.keys(parsed.metadata).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">
              Thông tin bổ sung
            </p>
            <JsonBlock value={parsed.metadata} className="bg-slate-50 border-slate-200" />
          </div>
        )}
      </div>
    );
  }

  // Fallback — raw JSON
  return (
    <JsonBlock value={parsed} className="bg-slate-50 border-slate-200" />
  );
}

function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <pre
      className={
        'overflow-x-auto rounded-md border p-3 text-xs font-mono text-slate-800 ' +
        (className ?? 'bg-slate-50 border-slate-200')
      }
    >
      {text}
    </pre>
  );
}

function formatVal(v: unknown): string {
  if (v == null) return '∅';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
      <div className="text-slate-500">{label}</div>
      <div
        className={
          mono
            ? 'font-mono text-xs text-slate-800 break-all'
            : 'text-slate-900 break-words'
        }
      >
        {value}
      </div>
    </div>
  );
}

function summarizeUserAgent(ua: string | null): string {
  if (!ua) return '—';
  // Truncate: extract browser portion only (T-02-01-03 fingerprint mitigation alignment)
  // Pattern: just keep first 80 chars + indicate if truncated
  if (ua.length <= 80) return ua;
  return ua.slice(0, 80) + '…';
}
