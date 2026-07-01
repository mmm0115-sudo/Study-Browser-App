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
  /** 今日の集計が属する日（ストリーク判定日とは分離） */
  todayDate?: string;
  /** 連続学習日数 */
  streak: number;
  /** 1日の目標時間（分） */
  dailyGoalMinutes?: number;
  /** 現在の週 "YYYY-MM-DD"（月曜日） */
  weekKey?: string;
  /** 今週獲得したスコア */
  weekScore?: number;
  /** 今週の集中秒数 */
  weekSeconds?: number;
  /** 今週のセッション数 */
  weekSessions?: number;
  /** ランキングに表示するか */
  rankingPublic?: boolean;
  /** 目標達成音を鳴らすか */
  soundEnabled?: boolean;
  /** ブラウザ通知を利用するか */
  notificationsEnabled?: boolean;
  /** 初回セットアップ（ニックネーム設定）を完了したか */
  onboarded?: boolean;
  /** XPブースター契約中か（サーバー＝Cloud Functions のみが書き込む） */
  boosterActive?: boolean;
  /** ブースター中のXP倍率（通常2） */
  boosterMultiplier?: number;
  /** Stripe 契約ステータス（active / canceled など） */
  boosterStatus?: string;
  /** Stripe 顧客ID（サーバーが設定） */
  stripeCustomerId?: string;
  /** Stripe サブスクID（サーバーが設定） */
  stripeSubscriptionId?: string;
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
  weekScore: number;
  weekSeconds: number;
  weekSessions: number;
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

/** Firestore: users/{uid}/sessions/{sessionId} */
export interface StudySession extends SessionResult {
  id: string;
  date: string;
  createdAt: Timestamp | null;
}
