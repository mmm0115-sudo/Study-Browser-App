import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import type { LeaderboardEntry, SessionResult, StudySession, UserProfile } from "../types";
import { localDateKey, localWeekKey, daysBetween } from "../lib/format";
import { calcEarnedScore, MAX_SESSION_SECONDS, MIN_STREAK_SECONDS } from "../lib/score";

const usersCol = collection(db, "users");
const publicProfilesCol = collection(db, "publicProfiles");

function userRef(uid: string) {
  return doc(usersCol, uid);
}

function publicProfileRef(uid: string) {
  return doc(publicProfilesCol, uid);
}

function publicProfileData(profile: UserProfile) {
  return {
    uid: profile.uid,
    displayName: profile.displayName ?? "名無しの勉強家",
    photoURL: profile.photoURL ?? "",
    totalScore: profile.totalScore ?? 0,
    totalSeconds: profile.totalSeconds ?? 0,
    goalsAchieved: profile.goalsAchieved ?? 0,
    streak: profile.streak ?? 0,
    weekKey: profile.weekKey ?? localWeekKey(),
    weekScore: profile.weekScore ?? 0,
    weekSeconds: profile.weekSeconds ?? 0,
    weekSessions: profile.weekSessions ?? 0,
    updatedAt: serverTimestamp(),
  };
}

/** ログイン時にプロフィールを作成 or 表示名/写真を更新して返す */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  const displayName = user.displayName ?? "名無しの勉強家";
  const photoURL = user.photoURL ?? "";

  if (!snap.exists()) {
    const fresh: Omit<UserProfile, "createdAt" | "updatedAt"> = {
      uid: user.uid,
      displayName,
      photoURL,
      totalScore: 0,
      totalSeconds: 0,
      totalSessions: 0,
      goalsAchieved: 0,
      todaySeconds: 0,
      todayDate: "",
      lastStudyDate: "",
      streak: 0,
      dailyGoalMinutes: 60,
      weekKey: localWeekKey(),
      weekScore: 0,
      weekSeconds: 0,
      weekSessions: 0,
      rankingPublic: true,
      soundEnabled: true,
      notificationsEnabled: false,
      onboarded: false,
    };
    await setDoc(ref, {
      ...fresh,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const created = { ...fresh, createdAt: null, updatedAt: null };
    await setDoc(publicProfileRef(user.uid), publicProfileData(created));
    return created;
  }

  // アイコンだけ Google と同期する。
  // 表示名はユーザーが編集できるので、ここでは上書きしない。
  const data = snap.data() as UserProfile;
  const defaults: Partial<UserProfile> = {};
  if (data.dailyGoalMinutes == null) defaults.dailyGoalMinutes = 60;
  if (data.rankingPublic == null) defaults.rankingPublic = true;
  if (data.soundEnabled == null) defaults.soundEnabled = true;
  if (data.notificationsEnabled == null) defaults.notificationsEnabled = false;
  if (data.weekScore == null) defaults.weekScore = 0;
  if (data.weekSeconds == null) defaults.weekSeconds = 0;
  if (data.weekSessions == null) defaults.weekSessions = 0;
  if (data.weekKey == null) defaults.weekKey = localWeekKey();
  if (data.todayDate == null) defaults.todayDate = data.lastStudyDate ?? "";
  if (photoURL && data.photoURL !== photoURL) defaults.photoURL = photoURL;
  if (Object.keys(defaults).length > 0) {
    await setDoc(ref, { ...defaults, updatedAt: serverTimestamp() }, { merge: true });
  }
  const merged = { ...data, ...defaults, uid: user.uid };
  if (merged.rankingPublic !== false) {
    await setDoc(publicProfileRef(user.uid), publicProfileData(merged), { merge: true });
  } else {
    await deleteDoc(publicProfileRef(user.uid));
  }
  return merged;
}

/** 表示名やオンボーディング状態など、ユーザー設定を更新する */
export async function updateUserSettings(
  uid: string,
  fields: {
    displayName?: string;
    onboarded?: boolean;
    dailyGoalMinutes?: number;
    rankingPublic?: boolean;
    soundEnabled?: boolean;
    notificationsEnabled?: boolean;
  }
): Promise<void> {
  await setDoc(
    userRef(uid),
    { ...fields, updatedAt: serverTimestamp() },
    { merge: true }
  );
  if (fields.displayName !== undefined || fields.rankingPublic !== undefined) {
    const snap = await getDoc(userRef(uid));
    if (!snap.exists()) return;
    const profile = { ...(snap.data() as UserProfile), uid };
    if (profile.rankingPublic === false) {
      await deleteDoc(publicProfileRef(uid));
    } else {
      await setDoc(publicProfileRef(uid), publicProfileData(profile), { merge: true });
    }
  }
}

/** プロフィールの購読（リアルタイム反映） */
export function subscribeProfile(
  uid: string,
  cb: (profile: UserProfile | null) => void
): () => void {
  return onSnapshot(userRef(uid), (snap) => {
    cb(snap.exists() ? ({ ...(snap.data() as UserProfile), uid }) : null);
  });
}

/**
 * 勉強セッションの結果を保存し、スコア・連続日数などを原子的に更新する。
 * セッション履歴は users/{uid}/sessions に追加。
 */
export async function commitSession(uid: string, result: SessionResult): Promise<void> {
  const ref = userRef(uid);
  const today = localDateKey();
  const week = localWeekKey();
  const sessionRef = doc(collection(ref, "sessions"));
  const safeElapsed = Math.min(MAX_SESSION_SECONDS, Math.max(1, Math.floor(result.elapsedSeconds)));
  const safeGoal = Math.min(MAX_SESSION_SECONDS, Math.max(60, Math.floor(result.goalSeconds)));
  const safeResult: SessionResult = {
    elapsedSeconds: safeElapsed,
    goalSeconds: safeGoal,
    achieved: safeElapsed >= safeGoal,
    earnedScore: calcEarnedScore(safeElapsed, safeGoal),
    label: result.label.trim().slice(0, 24),
  };

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("profile not found");
    const p = snap.data() as UserProfile;

    // 連続日数の計算
    let streak = p.streak || 0;
    let lastStudyDate = p.lastStudyDate || "";
    if (safeElapsed >= MIN_STREAK_SECONDS) {
      if (p.lastStudyDate === today) {
        streak = Math.max(streak, 1);
      } else if (p.lastStudyDate && daysBetween(p.lastStudyDate, today) === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
      lastStudyDate = today;
    }

    // 今日の勉強秒数（日付が変わっていればリセット）
    const todaySeconds =
      (p.todayDate ?? p.lastStudyDate) === today
        ? (p.todaySeconds || 0) + safeElapsed
        : safeElapsed;
    const sameWeek = p.weekKey === week;
    const weekScore = (sameWeek ? p.weekScore || 0 : 0) + safeResult.earnedScore;
    const weekSeconds = (sameWeek ? p.weekSeconds || 0 : 0) + safeElapsed;
    const weekSessions = (sameWeek ? p.weekSessions || 0 : 0) + 1;

    tx.update(ref, {
      totalScore: (p.totalScore || 0) + safeResult.earnedScore,
      totalSeconds: (p.totalSeconds || 0) + safeElapsed,
      totalSessions: (p.totalSessions || 0) + 1,
      goalsAchieved: (p.goalsAchieved || 0) + (safeResult.achieved ? 1 : 0),
      todaySeconds,
      todayDate: today,
      lastStudyDate,
      streak,
      weekKey: week,
      weekScore,
      weekSeconds,
      weekSessions,
      updatedAt: serverTimestamp(),
    });

    if (p.rankingPublic !== false) {
      tx.set(
        publicProfileRef(uid),
        {
          uid,
          displayName: p.displayName ?? "名無しの勉強家",
          photoURL: p.photoURL ?? "",
          totalScore: (p.totalScore || 0) + safeResult.earnedScore,
          totalSeconds: (p.totalSeconds || 0) + safeElapsed,
          goalsAchieved: (p.goalsAchieved || 0) + (safeResult.achieved ? 1 : 0),
          streak,
          weekKey: week,
          weekScore,
          weekSeconds,
          weekSessions,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    tx.set(sessionRef, {
      ...safeResult,
      date: today,
      createdAt: serverTimestamp(),
    });
  });
}

/** スコア上位のランキングを取得 */
export async function fetchLeaderboard(
  max = 100,
  period: "weekly" | "all" = "weekly"
): Promise<LeaderboardEntry[]> {
  const scoreField = period === "weekly" ? "weekScore" : "totalScore";
  const q = query(publicProfilesCol, orderBy(scoreField, "desc"), limit(Math.min(200, max * 2)));
  const snap = await getDocs(q);
  const week = localWeekKey();
  return snap.docs
    .filter((d) => {
      const data = d.data() as UserProfile;
      return period === "all" || data.weekKey === week;
    })
    .map((d) => {
      const data = d.data() as UserProfile;
      const currentWeek = data.weekKey === week;
      return {
        uid: d.id,
        displayName: data.displayName ?? "名無しの勉強家",
        photoURL: data.photoURL ?? "",
        totalScore: data.totalScore ?? 0,
        totalSeconds: data.totalSeconds ?? 0,
        goalsAchieved: data.goalsAchieved ?? 0,
        streak: data.streak ?? 0,
        weekScore: currentWeek ? data.weekScore ?? 0 : 0,
        weekSeconds: currentWeek ? data.weekSeconds ?? 0 : 0,
        weekSessions: currentWeek ? data.weekSessions ?? 0 : 0,
      };
    })
    .slice(0, max);
}

/** 新しい順に学習履歴を取得 */
export async function fetchStudySessions(uid: string, max = 120): Promise<StudySession[]> {
  const sessionsCol = collection(userRef(uid), "sessions");
  const q = query(sessionsCol, orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((item) => {
    const data = item.data() as Omit<StudySession, "id">;
    return { ...data, id: item.id };
  });
}
