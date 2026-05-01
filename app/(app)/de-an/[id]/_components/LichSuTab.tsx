'use client';

// LichSuTab — Tab Lịch sử phiên bản (PROJ-22). Plan 05-03 Batch C.
// Hiển thị bảng ProjectVersion snapshots — mỗi row: version / ngày / người tạo /
// lý do + button "Xem snapshot" mở Sheet với JSON pretty-printed.

import * as React from 'react';
import { History, Eye } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/format';

import type {
  ProjectDetail,
  ProjectVersionEntry,
} from '../../_actions/get-detail';

export type LichSuTabProps = {
  project: ProjectDetail;
};

export function LichSuTab({ project }: LichSuTabProps) {
  const versions = project.versions;
  const [activeVersion, setActiveVersion] =
    React.useState<ProjectVersionEntry | null>(null);
  const [snapshotData, setSnapshotData] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const openSnapshot = async (entry: ProjectVersionEntry) => {
    setActiveVersion(entry);
    setLoading(true);
    setSnapshotData(null);
    try {
      const res = await fetch(
        `/api/project-version/${encodeURIComponent(entry.id)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSnapshotData(JSON.stringify(data?.snapshot ?? data, null, 2));
    } catch (err) {
      setSnapshotData(`// Lỗi tải snapshot: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon="history"
            heading="Chưa có lịch sử phiên bản"
            description="Mỗi lần nộp/bổ sung đề án, một bản snapshot được lưu lại để truy vết lịch sử thay đổi."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" aria-hidden="true" />
            Lịch sử phiên bản
            <span className="ml-2 text-xs font-normal text-slate-500">
              {versions.length} bản lưu
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center">Phiên bản</TableHead>
                  <TableHead className="w-48">Thời điểm</TableHead>
                  <TableHead className="w-48">Người tạo</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead className="w-32 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...versions]
                  .sort((a, b) => b.versionNumber - a.versionNumber)
                  .map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="border-blue-200 bg-blue-50 text-blue-800"
                        >
                          v{v.versionNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatDateTime(v.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {v.createdByName ?? (
                          <span className="text-slate-400">(không rõ)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {v.reason ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-blue-700 hover:text-blue-800"
                          onClick={() => openSnapshot(v)}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Xem snapshot
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={activeVersion !== null}
        onOpenChange={(o) => {
          if (!o) {
            setActiveVersion(null);
            setSnapshotData(null);
          }
        }}
      >
        <SheetContent
          side="right"
          size="xl"
        >
          <SheetHeader>
            <SheetTitle>
              Snapshot phiên bản v{activeVersion?.versionNumber ?? '?'}
            </SheetTitle>
            <SheetDescription>
              {activeVersion
                ? `${formatDateTime(activeVersion.createdAt)} · ${
                    activeVersion.createdByName ?? '(không rõ)'
                  }${
                    activeVersion.reason ? ` · ${activeVersion.reason}` : ''
                  }`
                : ''}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4 pb-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Đang tải snapshot…
              </div>
            ) : snapshotData ? (
              <pre className="whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-800">
                {snapshotData}
              </pre>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                Chưa có dữ liệu
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default LichSuTab;
