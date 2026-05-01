'use client';

// CouncilDetail — Tabs: Thành viên / Đề án / Kết quả / Báo cáo.
// All-in-one client component to coordinate state across tabs (selected projects/users).

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Gavel,
  Lock,
  Plus,
  ShieldAlert,
  Trash2,
  Trophy,
  Unlock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatVNDCompact } from '@/lib/format';

import type { CouncilAggregate } from '../../_actions/aggregate';
import type { AssignableProjectRow } from '../../_actions/assign-projects';
import {
  COUNCIL_MEMBER_ROLE_LABELS,
  COUNCIL_MEMBER_ROLES,
  type CouncilMemberRole,
} from '../../_actions/member-types';
import { addMember, removeMember } from '../../_actions/manage-members';
import {
  assignProjects,
  unassignProject,
} from '../../_actions/assign-projects';
import { lockCouncil, unlockCouncil } from '../../_actions/lock';

type EligibleUser = {
  id: string;
  fullName: string;
  email: string | null;
  alreadyMember: boolean;
  role: string;
};

type Props = {
  aggregate: CouncilAggregate;
  eligibleUsers: EligibleUser[];
  assignableProjects: AssignableProjectRow[];
  canManage: boolean;
};

export function CouncilDetail({
  aggregate,
  eligibleUsers,
  assignableProjects,
  canManage,
}: Props) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { council, members, projects } = aggregate;
  const isLocked = council.lockStatus === 'LOCKED';

  // Header lock toggle
  const handleLockToggle = async () => {
    if (!canManage) return;
    if (isLocked) {
      const ok = await confirm({
        title: 'Mở lại hội đồng',
        description:
          'Mở lại hội đồng để chỉnh sửa thành viên hoặc phân công thêm đề án. Các phiếu chấm đã nộp vẫn được giữ nguyên.',
        confirmLabel: 'Mở lại',
      });
      if (!ok) return;
      try {
        await unlockCouncil(council.id);
        toast.success('Đã mở lại hội đồng');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Mở lại thất bại');
      }
    } else {
      const ok = await confirm({
        title: 'Khóa hội đồng',
        description:
          'Khóa hội đồng để hoàn tất thẩm định. Sau khi khóa: không thể thêm/xóa thành viên, không thể phân công đề án mới, không nhận thêm phiếu chấm. Bạn có chắc chắn?',
        confirmLabel: 'Khóa hội đồng',
        variant: 'destructive',
      });
      if (!ok) return;
      try {
        await lockCouncil(council.id);
        toast.success('Đã khóa hội đồng — thẩm định hoàn tất');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Khóa thất bại');
      }
    }
  };

  return (
    <>
      {/* Header */}
      <header className="mb-6 rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Gavel
                className="h-5 w-5 text-blue-600"
                aria-hidden="true"
              />
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                {council.term}
              </Badge>
              <Badge
                variant="outline"
                className={
                  isLocked
                    ? 'border-slate-300 bg-slate-100 text-slate-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }
              >
                {isLocked ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
                    Đã khóa
                  </>
                ) : (
                  <>
                    <Unlock className="mr-1 h-3 w-3" aria-hidden="true" />
                    Đang mở
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="border-slate-200 text-slate-600">
                Chu kỳ {council.programCycleYear}
              </Badge>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900">
              {council.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {members.length} thành viên · {projects.length} đề án phân công ·{' '}
              {projects.reduce((acc, p) => acc + p.submittedCount, 0)} phiếu chấm
              đã nộp
            </p>
          </div>
          {canManage ? (
            <Button
              variant={isLocked ? 'outline' : 'default'}
              onClick={handleLockToggle}
            >
              {isLocked ? (
                <>
                  <Unlock className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Mở lại hội đồng
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Khóa hội đồng
                </>
              )}
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Thành viên ({members.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Đề án phân công ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="results">
            <Trophy className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Kết quả tổng hợp
          </TabsTrigger>
          <TabsTrigger value="report">
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Báo cáo PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersTab
            councilId={council.id}
            members={members}
            eligibleUsers={eligibleUsers}
            isLocked={isLocked}
            canManage={canManage}
          />
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <ProjectsTab
            councilId={council.id}
            projects={projects}
            assignableProjects={assignableProjects}
            isLocked={isLocked}
            canManage={canManage}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <ResultsTab aggregate={aggregate} />
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <ReportTab councilId={council.id} />
        </TabsContent>
      </Tabs>

      {confirmDialog}
    </>
  );
}

// =============================================================================
// MembersTab
// =============================================================================

function MembersTab({
  councilId,
  members,
  eligibleUsers,
  isLocked,
  canManage,
}: {
  councilId: string;
  members: CouncilAggregate['members'];
  eligibleUsers: EligibleUser[];
  isLocked: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [selectedUserId, setSelectedUserId] = React.useState<string>('');
  const [selectedRole, setSelectedRole] =
    React.useState<CouncilMemberRole>('UY_VIEN');
  const [busy, setBusy] = React.useState(false);

  const availableUsers = eligibleUsers.filter((u) => !u.alreadyMember);

  const handleAdd = async () => {
    if (!selectedUserId) {
      toast.error('Vui lòng chọn người dùng');
      return;
    }
    try {
      setBusy(true);
      const r = await addMember({
        councilId,
        userId: selectedUserId,
        role: selectedRole,
      });
      toast.success(
        `Đã thêm ${r.userFullName} với vai trò ${COUNCIL_MEMBER_ROLE_LABELS[r.role]}`,
      );
      setSelectedUserId('');
      setSelectedRole('UY_VIEN');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thêm thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (memberId: string, fullName: string) => {
    const ok = await confirm({
      title: `Xóa thành viên "${fullName}"?`,
      description:
        'Thao tác này sẽ xóa thành viên khỏi hội đồng. Nếu thành viên đã có phiếu chấm DRAFT, các phiếu này cũng sẽ bị mất.',
      confirmLabel: 'Xóa',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await removeMember({ councilId, memberId });
      toast.success(`Đã xóa thành viên ${fullName}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  return (
    <>
      {canManage && !isLocked ? (
        <div className="mb-4 rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            <Plus className="mr-1 inline h-4 w-4" aria-hidden="true" />
            Thêm thành viên mới
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="space-y-1.5 md:col-span-6">
              <Label htmlFor="add-user">Người dùng (vai trò Hội đồng)</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger id="add-user">
                  <SelectValue placeholder="-- Chọn người dùng --" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-slate-500">
                      Không còn người dùng nào để thêm
                    </div>
                  ) : (
                    availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                        {u.email ? (
                          <span className="ml-2 text-xs text-slate-400">
                            ({u.email})
                          </span>
                        ) : null}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-4">
              <Label htmlFor="add-role">Vai trò</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as CouncilMemberRole)}
              >
                <SelectTrigger id="add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNCIL_MEMBER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {COUNCIL_MEMBER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end md:col-span-2">
              <Button onClick={handleAdd} disabled={busy} className="w-full">
                {busy ? 'Đang thêm…' : 'Thêm'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Họ tên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-center">Phiếu DRAFT</TableHead>
              <TableHead className="text-center">Phiếu nộp</TableHead>
              {canManage && !isLocked ? (
                <TableHead className="w-20 text-right">Hành động</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage && !isLocked ? 5 : 4}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  Hội đồng chưa có thành viên nào.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {m.fullName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.role === 'CHU_TICH'
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : m.role === 'PHO'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : m.role === 'THU_KY'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                      }
                    >
                      {COUNCIL_MEMBER_ROLE_LABELS[m.role as CouncilMemberRole] ??
                        m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {m.draftSheetCount}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    <Badge
                      variant="outline"
                      className={
                        m.submittedSheetCount > 0
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }
                    >
                      {m.submittedSheetCount}
                    </Badge>
                  </TableCell>
                  {canManage && !isLocked ? (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(m.id, m.fullName)}
                        title="Xóa thành viên"
                      >
                        <Trash2
                          className="h-4 w-4 text-red-500"
                          aria-hidden="true"
                        />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {confirmDialog}
    </>
  );
}

// =============================================================================
// ProjectsTab
// =============================================================================

function ProjectsTab({
  councilId,
  projects,
  assignableProjects,
  isLocked,
  canManage,
}: {
  councilId: string;
  projects: CouncilAggregate['projects'];
  assignableProjects: AssignableProjectRow[];
  isLocked: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  const candidates = assignableProjects.filter((p) => !p.alreadyAssignedHere);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((p) => p.id)));
    }
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 đề án');
      return;
    }
    try {
      setBusy(true);
      const r = await assignProjects({
        councilId,
        projectIds: Array.from(selectedIds),
      });
      if (r.assigned > 0) {
        toast.success(
          `Đã phân công ${r.assigned} đề án — đã chuyển trạng thái sang Đang thẩm định`,
        );
      }
      if (r.skipped.length > 0) {
        toast.warning(`${r.skipped.length} đề án bị bỏ qua (xem chi tiết)`);
      }
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Phân công thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async (projectId: string, name: string) => {
    const ok = await confirm({
      title: `Hủy phân công "${name}"?`,
      description:
        'Đề án sẽ được chuyển về trạng thái Hợp lệ. Các phiếu chấm DRAFT (nếu có) sẽ bị xóa cùng với assignment.',
      confirmLabel: 'Hủy phân công',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      const r = await unassignProject({ councilId, projectId });
      toast.success(
        r.revertedToValid
          ? 'Đã hủy phân công — đề án quay về trạng thái Hợp lệ'
          : 'Đã hủy phân công',
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hủy phân công thất bại');
    }
  };

  return (
    <>
      {canManage && !isLocked ? (
        <div className="mb-4 rounded-md border border-slate-200 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Phân công đề án vào hội đồng
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Đã chọn {selectedIds.size}</span>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={busy || selectedIds.size === 0}
              >
                {busy ? 'Đang phân công…' : 'Phân công vào hội đồng'}
              </Button>
            </div>
          </header>
          <div className="max-h-72 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <Checkbox
                      checked={
                        candidates.length > 0 &&
                        selectedIds.size === candidates.length
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </TableHead>
                  <TableHead>Mã / Đề án</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Dự toán</TableHead>
                  <TableHead>Hội đồng khác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Không còn đề án nào để phân công.
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((p) => (
                    <TableRow
                      key={p.id}
                      className={
                        p.alreadyAssigned ? 'bg-amber-50/40' : undefined
                      }
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                          aria-label={`Chọn ${p.code}`}
                          disabled={p.alreadyAssigned}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-slate-500">
                          {p.code}
                        </div>
                        <div className="text-sm text-slate-900">{p.name}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.organizationName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} entity="PROJECT" />
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {p.proposedBudget
                          ? formatVNDCompact(p.proposedBudget)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {p.alreadyAssigned ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700"
                          >
                            Đã ở hội đồng khác
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-white">
        <header className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Đề án đã phân công ({projects.length})
          </h3>
        </header>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã / Đề án</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead className="text-center">Phiếu nộp</TableHead>
              <TableHead className="text-right">Điểm TB</TableHead>
              <TableHead className="text-right">Dự toán</TableHead>
              {canManage && !isLocked ? (
                <TableHead className="w-20 text-right">Hành động</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage && !isLocked ? 6 : 5}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  Chưa có đề án nào được phân công.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((p) => (
                <TableRow key={p.projectId}>
                  <TableCell>
                    <div className="font-mono text-xs text-slate-500">
                      {p.projectCode}
                    </div>
                    <div className="text-sm text-slate-900">
                      {p.projectName}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.organizationName}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="tabular-nums">
                      {p.submittedCount}/{p.totalMembers}
                    </span>
                    {p.coiCount > 0 ? (
                      <Badge
                        variant="outline"
                        className="ml-1 border-amber-200 bg-amber-50 text-amber-700"
                        title={`${p.coiCount} thành viên báo cáo COI`}
                      >
                        <ShieldAlert
                          className="mr-0.5 h-3 w-3"
                          aria-hidden="true"
                        />
                        {p.coiCount}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.averageScore !== null
                      ? p.averageScore.toFixed(2)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {p.proposedBudget
                      ? formatVNDCompact(p.proposedBudget)
                      : '—'}
                  </TableCell>
                  {canManage && !isLocked ? (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleUnassign(p.projectId, p.projectName)
                        }
                        title="Hủy phân công"
                        disabled={p.submittedCount > 0}
                      >
                        <Trash2
                          className={
                            p.submittedCount > 0
                              ? 'h-4 w-4 text-slate-300'
                              : 'h-4 w-4 text-red-500'
                          }
                          aria-hidden="true"
                        />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {confirmDialog}
    </>
  );
}

// =============================================================================
// ResultsTab
// =============================================================================

function ResultsTab({ aggregate }: { aggregate: CouncilAggregate }) {
  const { projects, sheetsByProject } = aggregate;
  const ranked = [...projects].sort((a, b) => {
    if (a.rank === null && b.rank === null) return 0;
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });

  const fullySubmitted = projects.filter(
    (p) => p.submittedCount + p.coiCount === p.totalMembers && p.totalMembers > 0,
  ).length;
  const partiallySubmitted = projects.filter(
    (p) =>
      p.submittedCount > 0 &&
      p.submittedCount + p.coiCount < p.totalMembers,
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Tổng đề án"
          value={projects.length}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
        />
        <SummaryCard
          label="Đã đủ phiếu"
          value={fullySubmitted}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          tone="emerald"
        />
        <SummaryCard
          label="Còn thiếu phiếu"
          value={partiallySubmitted}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          tone="amber"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Bảng xếp hạng đề án
          </h3>
          <p className="text-xs text-slate-500">
            Trung bình điểm tổng, không tính phiếu COI
          </p>
        </header>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Hạng</TableHead>
              <TableHead>Mã / Đề án</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead className="text-center">Phiếu</TableHead>
              <TableHead className="text-right">Điểm TB</TableHead>
              <TableHead className="text-right">Min/Max</TableHead>
              <TableHead className="text-right">Dự toán</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  Chưa có đề án nào trong hội đồng.
                </TableCell>
              </TableRow>
            ) : (
              ranked.map((p) => (
                <ResultRow
                  key={p.projectId}
                  project={p}
                  sheets={sheetsByProject[p.projectId] ?? []}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber';
}) {
  const map: Record<typeof tone, string> = {
    slate: 'border-slate-200 bg-white',
    emerald: 'border-emerald-200 bg-emerald-50/30',
    amber: 'border-amber-200 bg-amber-50/30',
  };
  return (
    <div className={`rounded-md border p-4 ${map[tone]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
            {value}
          </div>
        </div>
        {icon}
      </div>
    </div>
  );
}

function ResultRow({
  project,
  sheets,
}: {
  project: CouncilAggregate['projects'][number];
  sheets: CouncilAggregate['sheetsByProject'][string];
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <>
      <TableRow
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer hover:bg-slate-50"
      >
        <TableCell className="text-center font-semibold tabular-nums">
          {project.rank !== null ? (
            <Badge
              variant="outline"
              className={
                project.rank === 1
                  ? 'border-amber-300 bg-amber-100 text-amber-800'
                  : project.rank === 2
                    ? 'border-slate-300 bg-slate-100 text-slate-800'
                    : project.rank === 3
                      ? 'border-orange-200 bg-orange-50 text-orange-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
              }
            >
              #{project.rank}
            </Badge>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className="font-mono text-xs text-slate-500">
            {project.projectCode}
          </div>
          <div className="text-sm text-slate-900">{project.projectName}</div>
        </TableCell>
        <TableCell className="text-sm">{project.organizationName}</TableCell>
        <TableCell className="text-center tabular-nums">
          {project.submittedCount}/{project.totalMembers}
          {project.coiCount > 0 ? (
            <span className="ml-1 text-xs text-amber-600">
              (+{project.coiCount} COI)
            </span>
          ) : null}
        </TableCell>
        <TableCell className="text-right">
          <span
            className={`text-base font-semibold tabular-nums ${
              project.averageScore !== null && project.averageScore >= 70
                ? 'text-emerald-700'
                : project.averageScore !== null && project.averageScore >= 50
                  ? 'text-amber-700'
                  : project.averageScore !== null
                    ? 'text-red-700'
                    : 'text-slate-400'
            }`}
          >
            {project.averageScore !== null
              ? project.averageScore.toFixed(2)
              : '—'}
          </span>
        </TableCell>
        <TableCell className="text-right text-xs tabular-nums">
          {project.minScore !== null && project.maxScore !== null
            ? `${project.minScore.toFixed(1)} / ${project.maxScore.toFixed(1)}`
            : '—'}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums">
          {project.proposedBudget
            ? formatVNDCompact(project.proposedBudget)
            : '—'}
        </TableCell>
      </TableRow>
      {expanded && sheets.length > 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="bg-slate-50/50 p-0">
            <div className="px-6 py-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Chi tiết phiếu chấm
              </h4>
              <div className="space-y-2">
                {sheets.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {s.reviewerName}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-slate-200 text-xs text-slate-600"
                      >
                        {s.reviewerRole
                          ? COUNCIL_MEMBER_ROLE_LABELS[
                              s.reviewerRole as CouncilMemberRole
                            ] ?? s.reviewerRole
                          : 'Thành viên'}
                      </Badge>
                      {s.conflictOfInterest ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                        >
                          <ShieldAlert
                            className="mr-0.5 h-3 w-3"
                            aria-hidden="true"
                          />
                          COI
                        </Badge>
                      ) : null}
                      <Badge
                        variant="outline"
                        className={
                          s.status === 'SUBMITTED'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }
                      >
                        {s.status === 'SUBMITTED' ? 'Đã nộp' : 'Đang chấm'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold tabular-nums text-slate-900">
                        {s.totalScore !== null
                          ? s.totalScore.toFixed(2)
                          : '—'}
                      </div>
                      {s.comment ? (
                        <div className="mt-0.5 max-w-md text-xs text-slate-600">
                          “{s.comment.slice(0, 200)}”
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

// =============================================================================
// ReportTab
// =============================================================================

function ReportTab({ councilId }: { councilId: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-md bg-blue-50 p-3">
          <FileText className="h-8 w-8 text-blue-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">
            Báo cáo thẩm định PDF
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Xuất báo cáo tổng hợp kết quả thẩm định của hội đồng — bao gồm danh
            sách thành viên, danh sách đề án + xếp hạng + nhận xét, kết luận và
            kiến nghị. Theo chuẩn công văn nhà nước Việt Nam.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <a
                href={`/api/pdf/evaluation/${councilId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Xuất báo cáo PDF
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={`/api/pdf/evaluation/${councilId}?download=1`}
                download
              >
                Tải xuống
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
