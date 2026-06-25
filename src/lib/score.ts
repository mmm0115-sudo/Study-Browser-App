/**
 * スコア計算ロジック。
 *
 * 基本ルール（ユーザー要件）:
 *   「目標時間を決めて達成したら、その時間分スコアが溜まる」
 *
 *  - 目標を達成した場合: 集中した分数がそのままスコアになる（1分 = 1pt）。
 *  - さらに目標達成ボーナスとして、目標分数の 20% を加算（やる気ブースト）。
 *  - 目標未達成で終了した場合: スコアは入らない（時間は記録だけ残る）。
 */
export function calcEarnedScore(
  elapsedSeconds: number,
  goalSeconds: number,
  multiplier = 1
): number {
  const achieved = elapsedSeconds >= goalSeconds && goalSeconds > 0;
  if (!achieved) return 0;
  const focusedMinutes = Math.floor(elapsedSeconds / 60);
  const goalMinutes = Math.floor(goalSeconds / 60);
  const bonus = Math.floor(goalMinutes * 0.2);
  const base = focusedMinutes + bonus;
  return Math.round(base * multiplier);
}

export function isAchieved(elapsedSeconds: number, goalSeconds: number): boolean {
  return goalSeconds > 0 && elapsedSeconds >= goalSeconds;
}

/** よく使う目標プリセット（分） */
export const GOAL_PRESETS = [15, 25, 45, 60, 90, 120] as const;
