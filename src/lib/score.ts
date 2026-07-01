/**
 * スコア計算ロジック。
 *
 * 基本ルール（ユーザー要件）:
 *   「目標時間を決めて達成したら、その時間分スコアが溜まる」
 *
 *  - 集中した分数は、未達成でもスコアになる（1分 = 1pt）。
 *  - 目標達成時は目標分数の20%をボーナス加算。
 *  - 放置対策として1セッションの加点対象は最大4時間。
 */
export function calcEarnedScore(
  elapsedSeconds: number,
  goalSeconds: number,
  multiplier = 1
): number {
  const safeElapsed = Math.min(Math.max(0, elapsedSeconds), 4 * 60 * 60);
  const achieved = safeElapsed >= goalSeconds && goalSeconds > 0;
  const focusedMinutes = Math.floor(safeElapsed / 60);
  const goalMinutes = Math.floor(goalSeconds / 60);
  const bonus = achieved ? Math.max(1, Math.floor(goalMinutes * 0.2)) : 0;
  const base = focusedMinutes + bonus;
  return Math.round(base * multiplier);
}

export function isAchieved(elapsedSeconds: number, goalSeconds: number): boolean {
  return goalSeconds > 0 && elapsedSeconds >= goalSeconds;
}

/** よく使う目標プリセット（分） */
export const GOAL_PRESETS = [15, 25, 45, 60, 90, 120] as const;

export const MAX_SESSION_SECONDS = 4 * 60 * 60;
export const MIN_STREAK_SECONDS = 5 * 60;
