import type { StudySession } from "../types";
import { localDateKey } from "./format";

export interface LevelProgress {
  level: number;
  title: string;
  current: number;
  required: number;
  percent: number;
}

const TITLES = [
  "はじめの一歩",
  "集中ビギナー",
  "習慣の芽",
  "集中トラベラー",
  "学びの冒険者",
  "継続マスター",
  "知識の探究者",
  "StudyQuest レジェンド",
];

export function getLevelProgress(totalScore: number): LevelProgress {
  const score = Math.max(0, totalScore);
  const level = Math.floor(Math.sqrt(score / 35)) + 1;
  const floor = 35 * (level - 1) ** 2;
  const ceiling = 35 * level ** 2;
  const current = score - floor;
  const required = ceiling - floor;
  return {
    level,
    title: TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))],
    current,
    required,
    percent: Math.min(100, (current / required) * 100),
  };
}

export function sessionsForDate(sessions: StudySession[], date = localDateKey()) {
  return sessions.filter((session) => session.date === date);
}

export function getDailyQuests(sessions: StudySession[], dailyGoalMinutes: number) {
  const today = sessionsForDate(sessions);
  const seconds = today.reduce((sum, session) => sum + session.elapsedSeconds, 0);
  const achieved = today.filter((session) => session.achieved).length;
  return [
    {
      id: "daily-time",
      label: `今日の目標 ${dailyGoalMinutes}分`,
      current: Math.min(dailyGoalMinutes, Math.floor(seconds / 60)),
      target: dailyGoalMinutes,
      complete: seconds >= dailyGoalMinutes * 60,
    },
    {
      id: "sessions",
      label: "集中を2回記録",
      current: Math.min(2, today.length),
      target: 2,
      complete: today.length >= 2,
    },
    {
      id: "achievement",
      label: "セッション目標を1回達成",
      current: Math.min(1, achieved),
      target: 1,
      complete: achieved >= 1,
    },
  ];
}
