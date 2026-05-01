'use client';

// ScoringPanel — left half: rubric với slider 0-10 + comment + COI + total + actions.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Lock,
  Save,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';

import type {
  EvaluationDetail,
  EvaluationCriterionTree,
  EvaluationScoreEntry,
} from '../../_actions/get-detail';
import { saveEvaluationScore } from '../../_actions/save-score';
import { submitEvaluationScore } from '../../_actions/submit-score';
import { declineCOI } from '../../_actions/decline-coi';

type Props = {
  detail: EvaluationDetail;
};

export function ScoringPanel({ detail }: Props) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { project, council, scoreSheet, criteria } = detail;

  const isLocked = scoreSheet.status === 'SUBMITTED';
  const councilLocked = council.lockStatus === 'LOCKED';
  const readOnly = isLocked || councilLocked;

  const [scoresByCriterion, setScoresByCriterion] = React.useState<
    Map<string, EvaluationScoreEntry>
  >(() => new Map(scoreSheet.scores.map((s) => [s.criterionId, s] as const)));
  const [overallComment, setOverallComment] = React.useState(
    scoreSheet.comment ?? '',
  );
  const [coi, setCoi] = React.useState(scoreSheet.conflictOfInterest);
  const [coiReason, setCoiReason] = React.useState(
    scoreSheet.conflictOfInterest ? scoreSheet.comment ?? '' : '',
  );
  const [busy, setBusy] = React.useState<'save' | 'submit' | 'coi' | null>(
    null,
  );
  const [totalScore, setTotalScore] = React.useState<number>(
    scoreSheet.totalScore ?? 0,
  );

  const leafCriteria = React.useMemo(() => {
    const result: EvaluationCriterionTree[] = [];
    for (const root of criteria) {
      if (root.children.length === 0) result.push(root);
      else for (const child of root.children) result.push(child);
    }
    return result;
  }, [criteria]);

  React.useEffect(() => {
    if (coi) {
      setTotalScore(0);
      return;
    }
    let sum = 0;
    for (const c of leafCriteria) {
      const entry = scoresByCriterion.get(c.id);
      if (entry) sum += (entry.score / 10) * c.weight;
    }
    setTotalScore(Math.round(sum * 100) / 100);
  }, [scoresByCriterion, leafCriteria, coi]);

  const handleScoreChange = (criterionId: string, score: number) => {
    if (readOnly || coi) return;
    setScoresByCriterion((prev) => {
      const next = new Map(prev);
      const existing = next.get(criterionId);
      next.set(criterionId, {
        criterionId,
        score: Math.max(0, Math.min(10, score)),
        comment: existing?.comment,
      });
      return next;
    });
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    if (readOnly || coi) return;
    setScoresByCriterion((prev) => {
      const next = new Map(prev);
      const existing = next.get(criterionId);
      if (!existing) {
        next.set(criterionId, { criterionId, score: 0, comment });
      } else {
        next.set(criterionId, { ...existing, comment });
      }
      return next;
    });
  };

  const buildPayload = () => ({
    projectId: project.id,
    scores: Array.from(scoresByCriterion.values()),
    comment: overallComment.trim() || undefined,
    conflictOfInterest: coi,
  });

  const handleSaveDraft = async () => {
    try {
      setBusy('save');
      const r = await saveEvaluationScore(buildPayload());
      setTotalScore(r.totalScore);
      toast.success(
        `Đã lưu phiếu chấm (điểm tổng: ${r.totalScore.toFixed(2)})`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    if (!coi) {
      const completed = leafCriteria.filter((c) =>
        scoresByCriterion.has(c.id),
      ).length;
      const total = leafCriteria.length;
      if (completed < total) {
        toast.error(
          `Còn ${total - completed}/${total} tiêu chí chưa chấm. Vui lòng hoàn thành trước khi nộp.`,
        );
        return;
      }
    }
    const ok = await confirm({
      title: 'Nộp phiếu chấm chính thức',
      description: coi
        ? 'Bạn xác nhận có xung đột lợi ích với đề án này. Phiếu sẽ được nộp với cờ COI và không tham gia tính điểm trung bình. Sau khi nộp không thể chỉnh sửa.'
        : `Phiếu chấm với điểm tổng ${totalScore.toFixed(2)}/100 sẽ được khóa và không thể chỉnh sửa. Bạn có chắc muốn nộp?`,
      confirmLabel: 'Nộp phiếu',
    });
    if (!ok) return;
    try {
      setBusy('submit');
      // Save first to ensure latest data
      await saveEvaluationScore(buildPayload());
      const r = await submitEvaluationScore(project.id);
      toast.success(
        coi
          ? 'Đã nộp phiếu COI'
          : `Đã nộp phiếu chấm với điểm tổng ${r.totalScore.toFixed(2)}/100`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nộp phiếu thất bại');
    } finally {
      setBusy(null);
    }
  };

  const handleDeclineCOI = async () => {
    const reason = coiReason.trim();
    if (reason.length < 10) {
      toast.error('Vui lòng nhập lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    const ok = await confirm({
      title: 'Xác nhận xin từ chối thẩm định',
      description:
        'Bạn xác nhận có xung đột lợi ích với đề án này. Phiếu sẽ được nộp với cờ COI + lý do, và không tham gia tính điểm trung bình. Hành động này không thể hoàn tác.',
      confirmLabel: 'Xác nhận từ chối',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      setBusy('coi');
      await declineCOI({ projectId: project.id, reason });
      toast.success('Đã ghi nhận xin từ chối thẩm định do COI');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Xin từ chối thất bại',
      );
    } finally {
      setBusy(null);
    }
  };

  const completedCount = leafCriteria.filter((c) =>
    scoresByCriterion.has(c.id),
  ).length;
  const allCompleted = completedCount === leafCriteria.length;

  return (
    <>
      <div className="space-y-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1">
        {/* Status banner */}
        {isLocked ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Lock
                className="h-5 w-5 text-emerald-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-emerald-900">
                Phiếu chấm đã được nộp
              </h3>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              {scoreSheet.submittedAt
                ? `Đã nộp lúc ${new Date(scoreSheet.submittedAt).toLocaleString('vi-VN')}.`
                : 'Phiếu đã được khóa.'}{' '}
              {scoreSheet.conflictOfInterest ? (
                <strong>Phiếu COI — không tham gia tính điểm trung bình.</strong>
              ) : (
                <>Điểm tổng: <strong>{totalScore.toFixed(2)}/100</strong>.</>
              )}
            </p>
          </div>
        ) : councilLocked ? (
          <div className="rounded-md border border-slate-300 bg-slate-100 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-900">
                Hội đồng đã bị khóa
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-700">
              Bạn không thể chỉnh sửa phiếu chấm khi hội đồng đã đóng.
            </p>
          </div>
        ) : null}

        {/* Score summary */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-50 p-2">
                <Calculator
                  className="h-5 w-5 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  Điểm tổng (trọng số)
                </p>
                <p
                  className={cn(
                    'text-2xl font-semibold tabular-nums',
                    coi
                      ? 'text-amber-600'
                      : totalScore >= 70
                        ? 'text-emerald-700'
                        : totalScore >= 50
                          ? 'text-amber-600'
                          : 'text-slate-900',
                  )}
                >
                  {coi ? '— (COI)' : totalScore.toFixed(2)}
                  {!coi ? (
                    <span className="ml-1 text-base font-normal text-slate-500">
                      / 100
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                coi
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : allCompleted
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
              }
            >
              {coi
                ? 'COI flagged'
                : `${completedCount}/${leafCriteria.length} tiêu chí`}
            </Badge>
          </div>
        </div>

        {/* COI checkbox */}
        <div
          className={cn(
            'rounded-md border p-4',
            coi
              ? 'border-amber-300 bg-amber-50/60'
              : 'border-slate-200 bg-white',
          )}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="coi-checkbox"
              checked={coi}
              disabled={readOnly}
              onCheckedChange={(v) => setCoi(Boolean(v))}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label
                htmlFor="coi-checkbox"
                className="cursor-pointer text-sm font-medium text-slate-900"
              >
                <ShieldAlert
                  className="mr-1 inline h-4 w-4 text-amber-600"
                  aria-hidden="true"
                />
                Tôi có xung đột lợi ích với đề án này
              </Label>
              <p className="mt-1 text-xs text-slate-600">
                Khi tích chọn: phần chấm điểm sẽ bị vô hiệu hóa, phiếu sẽ được
                ghi nhận là COI và không tham gia tính điểm trung bình.
              </p>
              {coi ? (
                <div className="mt-2">
                  <Label
                    htmlFor="coi-reason"
                    className="text-xs font-medium text-slate-700"
                  >
                    Lý do (tối thiểu 10 ký tự)
                  </Label>
                  <Textarea
                    id="coi-reason"
                    value={coiReason}
                    onChange={(e) => setCoiReason(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    disabled={readOnly}
                    placeholder="Nêu rõ mối quan hệ / lý do xung đột lợi ích..."
                    className="mt-1"
                  />
                  {!isLocked ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-2"
                      onClick={handleDeclineCOI}
                      disabled={busy !== null || coiReason.trim().length < 10}
                    >
                      {busy === 'coi'
                        ? 'Đang xử lý…'
                        : 'Xin từ chối thẩm định'}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Criteria sections */}
        {!coi
          ? criteria.map((group) => (
              <CriterionGroup
                key={group.id}
                group={group}
                scoresByCriterion={scoresByCriterion}
                onScoreChange={handleScoreChange}
                onCommentChange={handleCommentChange}
                disabled={readOnly}
              />
            ))
          : null}

        {/* Overall comment */}
        {!coi ? (
          <section className="rounded-md border border-slate-200 bg-white">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-slate-700">
                Nhận xét tổng quan
              </h3>
            </header>
            <div className="p-4">
              <Textarea
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                placeholder="Nhận xét chung về đề án (tùy chọn)…"
                rows={4}
                maxLength={2000}
                disabled={readOnly}
              />
            </div>
          </section>
        ) : null}

        {/* Action buttons */}
        {!readOnly && !coi ? (
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={busy !== null}
              >
                <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {busy === 'save' ? 'Đang lưu…' : 'Lưu nháp'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={busy !== null || !allCompleted}
              >
                <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {busy === 'submit' ? 'Đang nộp…' : 'Nộp chính thức'}
              </Button>
            </div>
            {!allCompleted ? (
              <p className="mt-2 inline-flex w-full items-center justify-end gap-1 text-right text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                Cần chấm tất cả {leafCriteria.length} tiêu chí trước khi nộp
                (đã chấm {completedCount}).
              </p>
            ) : (
              <p className="mt-2 inline-flex w-full items-center justify-end gap-1 text-right text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Đã chấm đủ tất cả tiêu chí — sẵn sàng nộp.
              </p>
            )}
          </div>
        ) : null}
      </div>
      {confirmDialog}
    </>
  );
}

// =============================================================================

function CriterionGroup({
  group,
  scoresByCriterion,
  onScoreChange,
  onCommentChange,
  disabled,
}: {
  group: EvaluationCriterionTree;
  scoresByCriterion: Map<string, EvaluationScoreEntry>;
  onScoreChange: (id: string, score: number) => void;
  onCommentChange: (id: string, comment: string) => void;
  disabled: boolean;
}) {
  const isLeafGroup = group.children.length === 0;
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            {group.name}
          </h3>
          {group.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              {group.description}
            </p>
          ) : null}
        </div>
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 font-medium text-blue-700"
        >
          Trọng số: {group.weight}
        </Badge>
      </header>
      <div className="divide-y divide-slate-200">
        {isLeafGroup ? (
          <CriterionRow
            criterion={group}
            entry={scoresByCriterion.get(group.id)}
            onScoreChange={onScoreChange}
            onCommentChange={onCommentChange}
            disabled={disabled}
          />
        ) : (
          group.children.map((child) => (
            <CriterionRow
              key={child.id}
              criterion={child}
              entry={scoresByCriterion.get(child.id)}
              onScoreChange={onScoreChange}
              onCommentChange={onCommentChange}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CriterionRow({
  criterion,
  entry,
  onScoreChange,
  onCommentChange,
  disabled,
}: {
  criterion: EvaluationCriterionTree;
  entry: EvaluationScoreEntry | undefined;
  onScoreChange: (id: string, score: number) => void;
  onCommentChange: (id: string, comment: string) => void;
  disabled: boolean;
}) {
  const score = entry?.score ?? 0;
  const hasEntry = Boolean(entry);
  const weighted = (score / 10) * criterion.weight;
  const tone =
    score >= 8
      ? 'text-emerald-600'
      : score >= 5
        ? 'text-amber-600'
        : score > 0
          ? 'text-red-600'
          : 'text-slate-400';
  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-slate-900">
            {criterion.name}
          </h4>
          {criterion.description ? (
            <p className="mt-0.5 text-xs text-slate-500">
              {criterion.description}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-slate-500">
            Trọng số: <strong>{criterion.weight}</strong> điểm tối đa
          </p>
        </div>
        <div className="text-right">
          <div className={cn('text-2xl font-semibold tabular-nums', tone)}>
            {hasEntry ? score.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">
            ={' '}
            <strong className="tabular-nums text-slate-700">
              {weighted.toFixed(2)}
            </strong>{' '}
            điểm thực
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={score}
            onChange={(e) =>
              onScoreChange(criterion.id, Number(e.target.value))
            }
            disabled={disabled}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 disabled:opacity-50"
            aria-label={`Điểm cho ${criterion.name}`}
          />
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={score}
            onChange={(e) =>
              onScoreChange(criterion.id, Number(e.target.value))
            }
            disabled={disabled}
            className="w-16 rounded-md border border-slate-200 px-2 py-1 text-sm tabular-nums focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>0 - Không đạt</span>
          <span>5 - Trung bình</span>
          <span>10 - Xuất sắc</span>
        </div>
        <Textarea
          value={entry?.comment ?? ''}
          onChange={(e) => onCommentChange(criterion.id, e.target.value)}
          placeholder="Nhận xét cho tiêu chí này (tùy chọn)…"
          rows={2}
          maxLength={500}
          disabled={disabled}
          className="text-sm"
        />
      </div>
    </div>
  );
}
