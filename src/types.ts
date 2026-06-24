import type { Timestamp } from "firebase/firestore";

/** Firestore: users/{uid} */
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  /** ランキング用スコア（達成した勉強分 + ボーナスの累計） */
  totalScore: number;
  /** 累計勉強秒数（達成・未達成問わず記録） */
  totalSeconds: number;
  /** 累計セッション数 */
  totalSessions: number;
  /** 目標達成回数 */
  goalsAchieved: number;
  /** 今日の勉強秒数（lastStudyDate が今日のときのみ有効） */
  todaySeconds: number;
  /** 最後に勉強した日（ローカル "YYYY-MM-DD"） */
  lastStudyDate: string;
  /** 連続学習日数 */
  streak: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  totalScore: number;
  totalSeconds: number;
  goalsAchieved: number;
  streak: number;
}

/** 勉強セッション完了時にサーバーへ送る結果 */
export interface SessionResult {
  /** 実際に集中した秒数 */
  elapsedSeconds: number;
  /** 目標秒数 */
  goalSeconds: number;
  /** 目標を達成したか */
  achieved: boolean;
  /** 獲得スコア */
  earnedScore: number;
  /** セッションのタイトル（科目など） */
  label: string;
}
