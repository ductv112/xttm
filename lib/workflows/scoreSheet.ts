export type ScoreSheetStatus = 'DRAFT' | 'SUBMITTED';

export function canTransitionScoreSheet(from: ScoreSheetStatus, to: ScoreSheetStatus): boolean {
  return from === 'DRAFT' && to === 'SUBMITTED';
}

export const SCORE_SHEET_STATUS_LABELS: Record<ScoreSheetStatus, string> = {
  DRAFT: 'Đang chấm',
  SUBMITTED: 'Đã nộp',
};
