import {
  collection,
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
import type { LeaderboardEntry, SessionResult, UserProfile } from "../types";
import { localDateKey, daysBetween } from "../lib/format";

const usersCol = collection(db, "users");

function userRef(uid: string) {
  return doc(usersCol, uid);
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
      lastStudyDate: "",
      streak: 0,
    };
    await setDoc(ref, {
      ...fresh,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ...fresh, createdAt: null, updatedAt: null };
  }

  // 表示名/アイコンが変わっていたら同期（ランキング表示のため）
  const data = snap.data() as UserProfile;
  if (data.displayName !== displayName || data.photoURL !== photoURL) {
    await setDoc(ref, { displayName, photoURL, updatedAt: serverTimestamp() }, { merge: true });
  }
  return { ...data, uid: user.uid, displayName, photoURL };
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
  const sessionRef = doc(collection(ref, "sessions"));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("profile not found");
    const p = snap.data() as UserProfile;

    // 連続日数の計算
    let streak = p.streak || 0;
    if (p.lastStudyDate === today) {
      // 今日すでに勉強済み → 連続日数は据え置き
      streak = Math.max(streak, 1);
    } else if (p.lastStudyDate && daysBetween(p.lastStudyDate, today) === 1) {
      streak = streak + 1;
    } else {
      streak = 1;
    }

    // 今日の勉強秒数（日付が変わっていればリセット）
    const todaySeconds =
      p.lastStudyDate === today
        ? (p.todaySeconds || 0) + result.elapsedSeconds
        : result.elapsedSeconds;

    tx.update(ref, {
      totalScore: (p.totalScore || 0) + result.earnedScore,
      totalSeconds: (p.totalSeconds || 0) + result.elapsedSeconds,
      totalSessions: (p.totalSessions || 0) + 1,
      goalsAchieved: (p.goalsAchieved || 0) + (result.achieved ? 1 : 0),
      todaySeconds,
      lastStudyDate: today,
      streak,
      updatedAt: serverTimestamp(),
    });

    tx.set(sessionRef, {
      ...result,
      date: today,
      createdAt: serverTimestamp(),
    });
  });
}

/** スコア上位のランキングを取得 */
export async function fetchLeaderboard(max = 100): Promise<LeaderboardEntry[]> {
  const q = query(usersCol, orderBy("totalScore", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as UserProfile;
    return {
      uid: d.id,
      displayName: data.displayName ?? "名無しの勉強家",
      photoURL: data.photoURL ?? "",
      totalScore: data.totalScore ?? 0,
      totalSeconds: data.totalSeconds ?? 0,
      goalsAchieved: data.goalsAchieved ?? 0,
      streak: data.streak ?? 0,
    };
  });
}
