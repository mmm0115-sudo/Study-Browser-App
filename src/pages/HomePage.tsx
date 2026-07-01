import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchStudySessions, updateUserSettings } from "../data/store";
import type { StudySession } from "../types";
import { formatDuration, localDateKey } from "../lib/format";
import { getDailyQuests, getLevelProgress } from "../lib/progress";
import CircularProgress from "../components/CircularProgress";
import {
  BoltIcon,
  CheckIcon,
  FlameIcon,
  PlayIcon,
  SparkleIcon,
  TimerIcon,
  TrophyIcon,
} from "../components/icons";

export default function HomePage() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(profile?.dailyGoalMinutes ?? 60);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setSessions(await fetchStudySessions(user.uid, 80));
    } catch (error) {
      console.error("学習履歴を取得できませんでした", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load, profile?.totalSessions]);

  const today = localDateKey();
  const dailyGoal = profile?.dailyGoalMinutes ?? 60;
  const todaySeconds =
    (profile?.todayDate ?? profile?.lastStudyDate) === today ? profile?.todaySeconds ?? 0 : 0;
  const progress = Math.min(1, todaySeconds / (dailyGoal * 60));
  const remainingMinutes = Math.max(0, dailyGoal - Math.floor(todaySeconds / 60));
  const level = getLevelProgress(profile?.totalScore ?? 0);
  const quests = getDailyQuests(sessions, dailyGoal);
  const latestLabel = sessions.find((session) => session.label.trim())?.label;

  async function saveGoal() {
    if (!user) return;
    const value = Math.min(600, Math.max(5, Math.round(goalInput)));
    await updateUserSettings(user.uid, { dailyGoalMinutes: value });
    setEditingGoal(false);
  }

  return (
    <div>
      <section className="glass-strong relative overflow-hidden rounded-3xl p-5 sm:p-7">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent-500/25 blur-3xl" />
        <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium text-accent-300">今日のクエスト</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
              {remainingMinutes > 0 ? `あと${remainingMinutes}分、集中しよう` : "今日の目標クリア！"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {remainingMinutes > 0
                ? "小さく始めても大丈夫。積み重ねがレベルアップにつながります。"
                : "余力があれば、もう1セッション積み上げてみよう。"}
            </p>
            <Link
              to="/timer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-500 to-violet-400 px-6 py-3.5 font-display font-bold text-white shadow-lg shadow-accent-500/30 transition hover:opacity-95 active:scale-[0.98] sm:w-auto"
            >
              <PlayIcon className="h-5 w-5" />
              {latestLabel ? `「${latestLabel}」で集中` : "集中をはじめる"}
            </Link>
          </div>
          <div className="mx-auto">
            <CircularProgress progress={progress} complete={progress >= 1} size={176} stroke={12}>
              <span className="text-xs text-white/55">今日</span>
              <strong className="tabular mt-1 font-display text-2xl font-extrabold">
                {Math.floor(todaySeconds / 60)}
                <span className="ml-1 text-sm text-white/50">/ {dailyGoal}分</span>
              </strong>
              <button
                onClick={() => {
                  setGoalInput(dailyGoal);
                  setEditingGoal(true);
                }}
                className="mt-2 rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/60 ring-1 ring-white/10"
              >
                目標を変更
              </button>
            </CircularProgress>
          </div>
        </div>
      </section>

      {editingGoal && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <span className="text-sm text-white/60">1日の目標</span>
          <input
            type="number"
            min={5}
            max={600}
            value={goalInput}
            onChange={(event) => setGoalInput(Number(event.target.value))}
            className="min-w-0 flex-1 rounded-xl bg-black/20 px-3 py-2 text-right font-bold outline-none ring-1 ring-white/10 focus:ring-accent-400"
          />
          <span className="text-sm text-white/50">分</span>
          <button onClick={saveGoal} className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-bold">
            保存
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50">現在のレベル</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">
                Lv.{level.level} <span className="text-gradient">{level.title}</span>
              </h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-300 ring-1 ring-accent-400/25">
              <SparkleIcon className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-fuchsia-400"
              style={{ width: `${level.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/50">
            次のレベルまで {Math.max(0, level.required - level.current)} XP
          </p>
          <div className="mt-4 flex gap-2">
            <SmallStat icon={<FlameIcon className="h-4 w-4 text-amber-400" />} value={`${profile?.streak ?? 0}日連続`} />
            <SmallStat icon={<BoltIcon className="h-4 w-4 text-accent-300" />} value={`${profile?.totalScore ?? 0} XP`} />
          </div>
        </section>

        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50">デイリークエスト</p>
              <h2 className="mt-1 font-display text-lg font-extrabold">
                {quests.filter((quest) => quest.complete).length} / {quests.length} 達成
              </h2>
            </div>
            <TrophyIcon className="h-6 w-6 text-amber-400" />
          </div>
          <div className="mt-4 space-y-3">
            {quests.map((quest) => (
              <div key={quest.id} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    quest.complete ? "bg-mint-400/15 text-mint-400" : "bg-white/5 text-white/35"
                  }`}
                >
                  {quest.complete ? <CheckIcon className="h-4 w-4" /> : <TimerIcon className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/80">{quest.label}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-mint-400"
                      style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="tabular text-xs text-white/45">
                  {quest.current}/{quest.target}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass mt-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">今週の進み具合</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              {formatDuration(profile?.weekSeconds ?? 0)}
            </h2>
          </div>
          <Link to="/history" className="text-sm font-semibold text-accent-300">
            詳細を見る
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Summary label="セッション" value={`${profile?.weekSessions ?? 0}回`} />
          <Summary label="今週のXP" value={`${profile?.weekScore ?? 0}`} />
          <Summary label="週間順位" value="ランキングへ" to="/ranking" />
        </div>
        {loading && <p className="mt-3 text-xs text-white/40">記録を読み込み中…</p>}
      </section>
    </div>
  );
}

function SmallStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10">
      {icon}
      {value}
    </span>
  );
}

function Summary({ label, value, to }: { label: string; value: string; to?: string }) {
  const content = (
    <>
      <div className="text-[11px] text-white/45">{label}</div>
      <div className="mt-1 truncate font-display text-sm font-extrabold text-white">{value}</div>
    </>
  );
  return to ? (
    <Link to={to} className="rounded-2xl bg-white/5 p-3 text-center ring-1 ring-white/5">
      {content}
    </Link>
  ) : (
    <div className="rounded-2xl bg-white/5 p-3 text-center">{content}</div>
  );
}
