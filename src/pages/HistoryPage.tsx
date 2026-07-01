import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchStudySessions } from "../data/store";
import type { StudySession } from "../types";
import { formatDateLabel, formatDuration, localDateKey } from "../lib/format";
import { BookIcon, ChartIcon, CheckIcon, ClockIcon } from "../components/icons";

export default function HistoryPage() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      setSessions(await fetchStudySessions(user.uid, 180));
    } catch (reason) {
      console.error(reason);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load, profile?.totalSessions]);

  const daily = useMemo(() => buildDailyStats(sessions, 7), [sessions]);
  const heatmap = useMemo(() => buildDailyStats(sessions, 28), [sessions]);
  const subjects = useMemo(() => buildSubjects(sessions), [sessions]);
  const thisWeek = daily.reduce((sum, day) => sum + day.seconds, 0);
  const previousWeek = sessions
    .filter((session) => {
      const diff = daysAgo(session.date);
      return diff >= 7 && diff < 14;
    })
    .reduce((sum, session) => sum + session.elapsedSeconds, 0);
  const difference =
    previousWeek > 0 ? Math.round(((thisWeek - previousWeek) / previousWeek) * 100) : null;
  const maxDay = Math.max(1, ...daily.map((day) => day.seconds));
  const maxHeat = Math.max(1, ...heatmap.map((day) => day.seconds));

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-extrabold">学習レポート</h1>
        <p className="mt-1 text-sm text-white/55">積み重ねを見える形にしよう</p>
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-3xl bg-white/[0.04]" />
          <div className="h-48 animate-pulse rounded-3xl bg-white/[0.04]" />
        </div>
      ) : error ? (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-white/60">履歴を読み込めませんでした。</p>
          <button onClick={load} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">
            再読み込み
          </button>
        </div>
      ) : (
        <>
          <section className="glass-strong rounded-3xl p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/50">直近7日間</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold">{formatDuration(thisWeek)}</h2>
                <p className={`mt-1 text-xs ${difference != null && difference >= 0 ? "text-mint-400" : "text-white/45"}`}>
                  {difference == null
                    ? "比較できる先週の記録はまだありません"
                    : `先週より ${difference >= 0 ? "+" : ""}${difference}%`}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-300">
                <ChartIcon className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 flex h-40 items-end gap-2" aria-label="直近7日間の集中時間グラフ">
              {daily.map((day) => (
                <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="tabular text-[10px] text-white/45">
                    {day.seconds >= 60 ? `${Math.floor(day.seconds / 60)}分` : ""}
                  </span>
                  <div className="flex h-28 w-full items-end justify-center rounded-xl bg-white/[0.025] px-1">
                    <div
                      className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-accent-500 to-fuchsia-400 transition-all"
                      style={{
                        height: day.seconds ? `${Math.max(8, (day.seconds / maxDay) * 100)}%` : "3px",
                        opacity: day.seconds ? 1 : 0.18,
                      }}
                    />
                  </div>
                  <span className={`text-[11px] ${day.date === localDateKey() ? "font-bold text-accent-300" : "text-white/45"}`}>
                    {day.weekday}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <section className="glass rounded-3xl p-5">
              <div className="flex items-center gap-2">
                <BookIcon className="h-5 w-5 text-accent-300" />
                <h2 className="font-display text-lg font-extrabold">科目別</h2>
              </div>
              <div className="mt-4 space-y-4">
                {subjects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-white/40">科目を入力して記録すると表示されます</p>
                ) : (
                  subjects.slice(0, 5).map((subject, index) => (
                    <div key={subject.label}>
                      <div className="flex justify-between text-sm">
                        <span className="truncate font-medium text-white/75">{subject.label}</span>
                        <span className="tabular ml-3 text-white/50">{formatDuration(subject.seconds)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-violet-400"
                          style={{
                            width: `${(subject.seconds / subjects[0].seconds) * 100}%`,
                            opacity: 1 - index * 0.1,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-extrabold">28日間の足あと</h2>
                <span className="text-xs text-white/40">{sessions.length} セッション</span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {heatmap.map((day) => {
                  const strength = day.seconds / maxHeat;
                  return (
                    <div
                      key={day.date}
                      title={`${formatDateLabel(day.date)}: ${formatDuration(day.seconds)}`}
                      aria-label={`${formatDateLabel(day.date)} ${formatDuration(day.seconds)}`}
                      className="aspect-square rounded-md ring-1 ring-white/5"
                      style={{
                        backgroundColor: day.seconds
                          ? `rgba(129, 140, 248, ${0.2 + strength * 0.75})`
                          : "rgba(255,255,255,.035)",
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-white/35">
                少ない
                {[0.08, 0.25, 0.45, 0.7, 0.95].map((opacity) => (
                  <span key={opacity} className="h-3 w-3 rounded-sm bg-accent-400" style={{ opacity }} />
                ))}
                多い
              </div>
            </section>
          </div>

          <section className="mt-4">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="font-display text-lg font-extrabold">最近のセッション</h2>
                <p className="mt-0.5 text-xs text-white/45">新しい順</p>
              </div>
            </div>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="glass rounded-3xl px-6 py-12 text-center text-sm text-white/45">
                  最初の集中を記録すると、ここに履歴が残ります。
                </div>
              ) : (
                sessions.slice(0, 20).map((session) => <SessionRow key={session.id} session={session} />)
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: StudySession }) {
  const time = session.createdAt?.toDate
    ? session.createdAt.toDate().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.035] p-3.5 ring-1 ring-white/5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${session.achieved ? "bg-mint-400/15 text-mint-400" : "bg-white/5 text-white/45"}`}>
        {session.achieved ? <CheckIcon className="h-5 w-5" /> : <ClockIcon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white/80">{session.label || "自由学習"}</p>
        <p className="mt-0.5 text-[11px] text-white/40">
          {formatDateLabel(session.date)} {time}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular text-sm font-bold">{formatDuration(session.elapsedSeconds)}</p>
        <p className="text-[11px] text-accent-300">+{session.earnedScore} XP</p>
      </div>
    </div>
  );
}

function daysAgo(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date(`${localDateKey()}T00:00:00`);
  return Math.round((today.getTime() - target.getTime()) / 86_400_000);
}

function buildDailyStats(sessions: StudySession[], days: number) {
  const totals = new Map<string, number>();
  sessions.forEach((session) => totals.set(session.date, (totals.get(session.date) ?? 0) + session.elapsedSeconds));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = localDateKey(date);
    return {
      date: key,
      seconds: totals.get(key) ?? 0,
      weekday: date.toLocaleDateString("ja-JP", { weekday: "short" }).replace("曜日", ""),
    };
  });
}

function buildSubjects(sessions: StudySession[]) {
  const totals = new Map<string, number>();
  sessions.forEach((session) => {
    const label = session.label.trim() || "自由学習";
    totals.set(label, (totals.get(label) ?? 0) + session.elapsedSeconds);
  });
  return [...totals.entries()]
    .map(([label, seconds]) => ({ label, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}
