'use client';

// ScoringForm — chấm điểm sơ bộ với slider 0-10 + comment per criterion.
// Layout: list groups → list children criteria.
// Total auto-calculated từ leaf scores * weight / 10.
// Save draft + Finalize buttons.

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  CheckCircle2,
  Lock,
  Save,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';

import { saveScore } from '../../_actions/save-score';
import { finalizeScore } from '../../_actions/finalize-score';
import type {
  ScoringCriterionTree,
  ScoreEntry,
} from '../../_actions/get-detail';

type Props = {
  projectId: string;
  projectCode: string;
  projectName: string;
  criteria: ScoringCriterionTree[];
  initialScores: ScoreEntry[];
  initialOverallComment: string | null;
  initialStatus: 'DRAFT' | 'SUBMITTED';
  initialTotalScore: number | null;
  submittedAt: Date | null;
};

export function ScoringForm({
  projectId,
  projectCode,
  projectName,
  criteria,
  initialScores,
  initialOverallComment,
  initialStatus,
  initialTotalScore,
  submittedAt,
}: Props) {
  const router = useRouter();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [scoresByCriterion, setScoresByCriterion] = React.useState<
    Map<string, ScoreEntry>
  >(() => new Map(initialScores.map((s) => [s.criterionId, s] as const)));
  const [overallComment, setOverallComment] = React.useState(
    initialOverallComment ?? '',
  );
  const [status, setStatus] = React.useState<'DRAFT' | 'SUBMITTED'>(
    initialStatus,
  );
  const [busy, setBusy] = React.useState<'save' | 'finalize' | null>(null);
  const [totalScore, setTotalScore] = React.useState<number>(
    initialTotalScore ?? 0,
  );

  const isLocked = status === 'SUBMITTED';

  // Flatten leaf criteria for total calculation
  const leafCriteria = React.useMemo(() => {
    const result: ScoringCriterionTree[] = [];
    for (const root of criteria) {
      if (root.children.length === 0) {
        result.push(root);
      } else {
        for (const child of root.children) result.push(child);
      }
    }
    return result;
  }, [criteria]);

  // Recompute total whenever scores change
  React.useEffect(() => {
    let sum = 0;
    for (const c of leafCriteria) {
      const entry = scoresByCriterion.get(c.id);
      if (entry) {
        sum += (entry.score / 10) * c.weight;
      }
    }
    setTotalScore(Math.round(sum * 100) / 100);
  }, [scoresByCriterion, leafCriteria]);

  const handleScoreChange = (criterionId: string, score: number) => {
    if (isLocked) return;
    const next = new Map(scoresByCriterion);
    const existing = next.get(criterionId);
    next.set(criterionId, {
      criterionId,
      score: Math.max(0, Math.min(10, score)),
      comment: existing?.comment,
    });
    setScoresByCriterion(next);
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    if (isLocked) return;
    const next = new Map(scoresByCriterion);
    const existing = next.get(criterionId);
    if (!existing) {
      next.set(criterionId, { criterionId, score: 0, comment });
    } else {
      next.set(criterionId, { ...existing, comment });
    }
    setScoresByCriterion(next);
  };

  const buildPayload = () => {
    return {
      projectId,
      scores: Array.from(scoresByCriterion.values()),
      comment: overallComment.trim() || undefined,
    };
  };

  const handleSaveDraft = async () => {
    try {
      setBusy('save');
      const r = await saveScore(buildPayload());
      setTotalScore(r.totalScore);
      toast.success(`Đã lưu phiếu chấm (điểm tổng: ${r.totalScore.toFixed(2)})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setBusy(null);
    }
  };

  const handleFinalize = async () => {
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
    const ok = await confirm({
      title: 'Nộp phiếu chấm sơ bộ',
      description: `Phiếu chấm với điểm tổng ${totalScore.toFixed(2)}/100 sẽ được khóa và không thể chỉnh sửa. Bạn có chắc muốn nộp?`,
      confirmLabel: 'Nộp phiếu',
    });
    if (!ok) return;
    try {
      setBusy('finalize');
      // Save first to ensure latest data persisted
      await saveScore(buildPayload());
      const r = await finalizeScore(projectId);
      setStatus(r.status);
      toast.success(
        `Đã nộp phiếu chấm cho ${projectCode} với điểm tổng ${r.totalScore.toFixed(2)}/100`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nộp phiếu thất bại');
    } finally {
      setBusy(null);
    }
  };

  // Progress
  const completedCount = leafCriteria.filter((c) =>
    scoresByCriterion.has(c.id),
  ).length;
  const allCompleted = completedCount === leafCriteria.length;

  return (
    <>
      <div className="space-y-4">
        {/* Status banner */}
        {isLocked ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-emerald-900">
                Phiếu chấm đã được nộp
              </h3>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              {submittedAt
                ? `Đã nộp lúc ${new Date(submittedAt).toLocaleString('vi-VN')}.`
                : 'Phiếu chấm đã được khóa.'}{' '}
              Điểm tổng: <strong>{totalScore.toFixed(2)}/100</strong>.
            </p>
          </div>
        ) : null}

        {/* Score summary */}
        <div className="sticky top-4 z-10 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-50 p-2">
                <Calculator
                  className="h-5 w-5 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Điểm tổng (trọng số)</p>
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {totalScore.toFixed(2)}
                  <span className="ml-1 text-base font-normal text-slate-500">
                    / 100
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Badge
                variant="outline"
                className={
                  allCompleted
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }
              >
                {completedCount}/{leafCriteria.length} tiêu chí
              </Badge>
            </div>
          </div>
        </div>

        {/* Criteria sections */}
        {criteria.map((group) => (
          <CriterionGroup
            key={group.id}
            group={group}
            scoresByCriterion={scoresByCriterion}
            onScoreChange={handleScoreChange}
            onCommentChange={handleCommentChange}
            disabled={isLocked}
          />
        ))}

        {/* Overall comment */}
        <section className="rounded-md border border-slate-200 bg-white">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-slate-700">
              Nhận xét chung
            </h3>
          </header>
          <div className="p-4">
            <Textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Nhận xét tổng quan về đề án (tùy chọn)…"
              rows={4}
              maxLength={2000}
              disabled={isLocked}
            />
          </div>
        </section>

        {/* Action buttons */}
        {!isLocked ? (
          <div className="sticky bottom-4 z-10 rounded-md border border-slate-200 bg-white p-4 shadow-md">
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
                onClick={handleFinalize}
                disabled={busy !== null || !allCompleted}
              >
                <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {busy === 'finalize' ? 'Đang nộp…' : 'Nộp phiếu chấm'}
              </Button>
            </div>
            {!allCompleted ? (
              <p className="mt-2 text-right text-xs text-amber-600">
                Cần chấm tất cả {leafCriteria.length} tiêu chí trước khi nộp.
                Hiện đã chấm {completedCount}.
              </p>
            ) : (
              <p className="mt-2 inline-flex w-full items-center justify-end gap-1 text-right text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Đã chấm đủ tất cả tiêu chí — sẵn sàng nộp.
              </p>
            )}
          </div>
        ) : null}

        <div className="text-xs text-slate-500">
          Hồ sơ: <strong>{projectName}</strong>
        </div>
      </div>

      {confirmDialog}
    </>
  );
}

// ---------------------------------------------------------------------------
// CriterionGroup — render 1 group cha + children
// ---------------------------------------------------------------------------

type CriterionGroupProps = {
  group: ScoringCriterionTree;
  scoresByCriterion: Map<string, ScoreEntry>;
  onScoreChange: (id: string, score: number) => void;
  onCommentChange: (id: string, comment: string) => void;
  disabled: boolean;
};

function CriterionGroup({
  group,
  scoresByCriterion,
  onScoreChange,
  onCommentChange,
  disabled,
}: CriterionGroupProps) {
  const isLeafGroup = group.children.length === 0;

  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {group.name}
          </h3>
          {group.description ? (
            <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
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

// ---------------------------------------------------------------------------
// CriterionRow — slider + comment
// ---------------------------------------------------------------------------

type CriterionRowProps = {
  criterion: ScoringCriterionTree;
  entry: ScoreEntry | undefined;
  onScoreChange: (id: string, score: number) => void;
  onCommentChange: (id: string, comment: string) => void;
  disabled: boolean;
};

function CriterionRow({
  criterion,
  entry,
  onScoreChange,
  onCommentChange,
  disabled,
}: CriterionRowProps) {
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
    <div className="px-4 py-4">
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
          <p className="mt-1 text-xs text-slate-500">
            Trọng số: <strong>{criterion.weight}</strong> điểm tối đa
          </p>
        </div>
        <div className="text-right">
          <div className={cn('text-3xl font-semibold tabular-nums', tone)}>
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

      <div className="mt-3 space-y-2">
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
            className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm tabular-nums focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
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
