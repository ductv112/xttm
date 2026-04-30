'use client';

// AssignmentBoard — drag-drop UI cho /phan-cong (INTAKE-03..05).
//
// Layout:
//   - Cột trái: "Hồ sơ chờ phân công" — list project cards, draggable
//   - Cột phải: "Chuyên viên" — list staff cards (drop zones) với load count + projects đã giao
//
// HTML5 native drag/drop (no extra deps):
//   onDragStart trên project card → setData('text/plain', projectId)
//   onDragOver/onDrop trên staff card hoặc unassigned column → call assignProject/unassignProject
//
// Mobile fallback: click project card mở Select dialog cho chuyên viên.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  Building2,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Inbox,
  RotateCcw,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import { formatDate, formatVNDCompact } from '@/lib/format';
import { PROJECT_KIND_LABELS } from '@/lib/workflows/project';

import type {
  AssignmentBoardData,
  AssignmentProject,
  StaffWithLoad,
} from '../_actions/list-staff';
import { assignProject } from '../_actions/assign';
import { unassignProject } from '../_actions/unassign';

type Props = {
  data: AssignmentBoardData;
  currentUserId: string;
};

export function AssignmentBoard({ data, currentUserId }: Props) {
  const router = useRouter();
  const [pickerProject, setPickerProject] =
    React.useState<AssignmentProject | null>(null);
  const [pickerStaffId, setPickerStaffId] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  // Group assigned projects by staff for right column rendering
  const projectsByStaff = React.useMemo(() => {
    const map = new Map<string, AssignmentProject[]>();
    for (const p of data.assignedProjects) {
      if (!p.assignedToUserId) continue;
      const arr = map.get(p.assignedToUserId) ?? [];
      arr.push(p);
      map.set(p.assignedToUserId, arr);
    }
    return map;
  }, [data.assignedProjects]);

  // ---------------------------------------------------------------
  // Drag-drop handlers
  // ---------------------------------------------------------------

  const handleDragStart = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>, projectId: string) => {
      e.dataTransfer.setData('text/plain', projectId);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  const handleDropOnStaff = React.useCallback(
    async (e: React.DragEvent<HTMLDivElement>, staff: StaffWithLoad) => {
      e.preventDefault();
      const projectId = e.dataTransfer.getData('text/plain');
      if (!projectId) return;
      if (busy) return;

      // Self-assign guard for LĐ that has CHUYENVIEN role overlap (rare)
      if (staff.id === currentUserId) {
        toast.error('Không thể tự phân công cho chính mình');
        return;
      }

      // If project is currently assigned, treat as REASSIGN — confirm
      const project = [
        ...data.unassignedProjects,
        ...data.assignedProjects,
      ].find((p) => p.id === projectId);
      if (!project) return;

      const isReassign = Boolean(project.assignedToUserId);
      if (isReassign && project.assignedToUserId === staff.id) {
        toast.info(`Đề án đã được giao cho ${staff.fullName}`);
        return;
      }
      if (isReassign) {
        const ok = await confirm({
          title: 'Tái phân công',
          description: `Hồ sơ "${project.name}" đang được giao cho ${
            project.assignedToUserName ?? 'chuyên viên khác'
          }. Bạn có chắc muốn chuyển sang ${staff.fullName}?`,
          confirmLabel: 'Tái phân công',
        });
        if (!ok) return;
      }

      try {
        setBusy(true);
        await assignProject(projectId, staff.id);
        toast.success(
          `${isReassign ? 'Đã tái phân công' : 'Đã phân công'} hồ sơ ${
            project.code
          } cho ${staff.fullName}`,
        );
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Phân công thất bại',
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, currentUserId, confirm, data, router],
  );

  const handleDropOnUnassigned = React.useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const projectId = e.dataTransfer.getData('text/plain');
      if (!projectId) return;
      if (busy) return;

      const project = data.assignedProjects.find((p) => p.id === projectId);
      if (!project) return;

      const ok = await confirm({
        title: 'Thu hồi hồ sơ',
        description: `Thu hồi hồ sơ "${project.name}" đang giao cho ${
          project.assignedToUserName ?? 'chuyên viên'
        }? Hồ sơ sẽ trở về hàng đợi chờ phân công.`,
        confirmLabel: 'Thu hồi',
        variant: 'destructive',
      });
      if (!ok) return;

      try {
        setBusy(true);
        await unassignProject(projectId);
        toast.success(`Đã thu hồi hồ sơ ${project.code}`);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Thu hồi thất bại',
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, confirm, data.assignedProjects, router],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ---------------------------------------------------------------
  // Picker dialog (mobile / fallback) — click project card → pick staff
  // ---------------------------------------------------------------

  const handleOpenPicker = (project: AssignmentProject) => {
    setPickerProject(project);
    setPickerStaffId(project.assignedToUserId ?? '');
  };

  const handlePickerConfirm = async () => {
    if (!pickerProject || !pickerStaffId) return;
    if (pickerStaffId === pickerProject.assignedToUserId) {
      setPickerProject(null);
      return;
    }
    const staff = data.staff.find((s) => s.id === pickerStaffId);
    if (!staff) return;
    try {
      setBusy(true);
      await assignProject(pickerProject.id, pickerStaffId);
      toast.success(
        `Đã phân công ${pickerProject.code} cho ${staff.fullName}`,
      );
      setPickerProject(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Phân công thất bại');
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        {/* LEFT — Unassigned queue */}
        <section
          className="rounded-md border border-slate-200 bg-white"
          onDragOver={handleDragOver}
          onDrop={handleDropOnUnassigned}
        >
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-900">
                Hồ sơ chờ phân công
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 font-medium text-blue-700"
            >
              {data.unassignedProjects.length}
            </Badge>
          </header>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
            {data.unassignedProjects.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 px-4 py-12 text-center">
                <Inbox
                  className="mx-auto mb-2 h-8 w-8 text-slate-400"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-slate-600">
                  Không có hồ sơ chờ phân công
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Khi BQL tiếp nhận hồ sơ mới, hồ sơ sẽ xuất hiện ở đây để phân
                  công cho chuyên viên kiểm tra.
                </p>
              </div>
            ) : (
              data.unassignedProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  draggable
                  onDragStart={handleDragStart}
                  onClick={() => handleOpenPicker(p)}
                />
              ))
            )}
          </div>
        </section>

        {/* RIGHT — Staff list with their loads */}
        <section className="rounded-md border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-900">
                Chuyên viên kiểm tra
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700"
            >
              {data.staff.length} chuyên viên
            </Badge>
          </header>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
            {data.staff.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 px-4 py-12 text-center">
                <Users
                  className="mx-auto mb-2 h-8 w-8 text-slate-400"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-slate-600">
                  Chưa có chuyên viên kiểm tra
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Vui lòng liên hệ Quản trị viên để tạo tài khoản vai trò
                  Chuyên viên.
                </p>
              </div>
            ) : (
              data.staff.map((staff) => (
                <StaffDropZone
                  key={staff.id}
                  staff={staff}
                  projects={projectsByStaff.get(staff.id) ?? []}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnStaff(e, staff)}
                  onProjectDragStart={handleDragStart}
                  onProjectClick={handleOpenPicker}
                  router={router}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Picker dialog (mobile/fallback) */}
      <Dialog
        open={pickerProject !== null}
        onOpenChange={(open) => !open && setPickerProject(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pickerProject?.assignedToUserId
                ? 'Tái phân công hồ sơ'
                : 'Phân công hồ sơ'}
            </DialogTitle>
            <DialogDescription>
              {pickerProject?.code} — {pickerProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Chuyên viên kiểm tra
            </label>
            <Select value={pickerStaffId} onValueChange={setPickerStaffId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn chuyên viên --" />
              </SelectTrigger>
              <SelectContent>
                {data.staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName} ({s.loadCount} hồ sơ đang xử lý)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPickerProject(null)}
              disabled={busy}
            >
              Hủy
            </Button>
            <Button
              onClick={handlePickerConfirm}
              disabled={!pickerStaffId || busy}
            >
              {busy ? 'Đang xử lý…' : 'Phân công'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </>
  );
}

// ---------------------------------------------------------------------------
// ProjectCard
// ---------------------------------------------------------------------------

type ProjectCardProps = {
  project: AssignmentProject;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onClick?: () => void;
  compact?: boolean;
};

function ProjectCard({
  project,
  draggable,
  onDragStart,
  onClick,
  compact,
}: ProjectCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={
        onDragStart ? (e) => onDragStart(e, project.id) : undefined
      }
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'group cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:shadow active:cursor-grabbing',
        compact && 'p-2.5',
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-blue-500"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-medium text-slate-500">
              {project.code}
            </span>
            <StatusBadge
              status={project.status}
              entity="PROJECT"
              className="text-[10px] px-1.5 py-0"
            />
          </div>
          <h3
            className={cn(
              'mt-1 line-clamp-2 text-sm font-medium text-slate-900',
              compact && 'line-clamp-1 text-xs',
            )}
          >
            {project.name}
          </h3>
          <div
            className={cn(
              'mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600',
              compact && 'mt-1',
            )}
          >
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" aria-hidden="true" />
              {project.organizationName}
            </span>
            <span>{PROJECT_KIND_LABELS[project.kind] ?? project.kind}</span>
            {project.totalBudget !== null ? (
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-3 w-3" aria-hidden="true" />
                {formatVNDCompact(project.totalBudget)}
              </span>
            ) : null}
            {project.receivedAt ? (
              <span className="text-slate-500">
                Tiếp nhận {formatDate(project.receivedAt)}
              </span>
            ) : project.submittedAt ? (
              <span className="text-slate-500">
                Nộp {formatDate(project.submittedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StaffDropZone
// ---------------------------------------------------------------------------

type StaffDropZoneProps = {
  staff: StaffWithLoad;
  projects: AssignmentProject[];
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onProjectDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    id: string,
  ) => void;
  onProjectClick: (project: AssignmentProject) => void;
  router: ReturnType<typeof useRouter>;
};

function StaffDropZone({
  staff,
  projects,
  onDragOver,
  onDrop,
  onProjectDragStart,
  onProjectClick,
  router,
}: StaffDropZoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleLeave = () => setIsDragOver(false);
  const handleDropWrap = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    onDrop(e);
  };

  const loadTone =
    staff.loadCount === 0
      ? 'bg-slate-100 text-slate-600 border-slate-200'
      : staff.loadCount <= 3
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : staff.loadCount <= 6
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div
      className={cn(
        'rounded-md border-2 border-dashed transition',
        isDragOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-200 bg-slate-50/50',
      )}
      onDragOver={onDragOver}
      onDragEnter={handleEnter}
      onDragLeave={handleLeave}
      onDrop={handleDropWrap}
    >
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 rounded-t-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            {staff.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {staff.fullName}
            </div>
            <div className="truncate text-xs text-slate-500">
              @{staff.username}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn('whitespace-nowrap font-medium', loadTone)}
        >
          {staff.loadCount} đang xử lý
        </Badge>
      </header>

      <div className="space-y-2 p-3">
        {projects.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
            Kéo hồ sơ vào đây để phân công cho {staff.fullName}
          </p>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="flex items-stretch gap-2">
              <div className="flex-1">
                <ProjectCard
                  project={p}
                  compact
                  draggable
                  onDragStart={onProjectDragStart}
                  onClick={() => onProjectClick(p)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-blue-600"
                  aria-label="Xem chi tiết"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/de-an/${p.id}`);
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-amber-600"
                  aria-label="Tái phân công"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectClick(p);
                  }}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Re-export for usage hint
export { ChevronRight, RotateCcw };
