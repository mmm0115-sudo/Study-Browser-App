import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { localDateKey } from "../lib/format";
import { formatDuration, formatScore } from "../lib/format";
import { updateUserSettings } from "../data/store";
import Avatar from "../components/Avatar";
import { BoltIcon, ClockIcon, FlameIcon, TrophyIcon, CheckIcon, LogoutIcon, TimerIcon } from "../components/icons";

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const name = profile?.displayName ?? user?.displayName ?? "ゲスト";

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [savingName, setSavingName] = useState(false);

  function startEdit() {
    setNameInput(profile?.displayName ?? name);
    setEditing(true);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!user || trimmed.length < 1 || trimmed.length > 20) return;
    setSavingName(true);
    try {
      await updateUserSettings(user.uid, { displayName: trimmed });
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert("名前の保存に失敗しました。通信環境を確認してください。");
    } finally {
      setSavingName(false);
    }
  }
  const today = localDateKey();
  const todaySeconds = profile?.lastStudyDate === today ? profile?.todaySeconds ?? 0 : 0;
  const sessions = profile?.totalSessions ?? 0;
  const achieveRate =
    sessions > 0 ? Math.round(((profile?.goalsAchieved ?? 0) / sessions) * 100) : 0;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div>
      {/* プロフィールヘッダー */}
      <div className="glass relative overflow-hidden rounded-3xl p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <Avatar photoURL={profile?.photoURL} name={name} size={72} className="ring-2 ring-white/15" />
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={nameInput}
                  maxLength={20}
                  autoFocus
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-base font-bold text-white outline-none ring-1 ring-accent-400/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveName}
                    disabled={savingName || nameInput.trim().length < 1}
                    className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {savingName ? "保存中…" : "保存"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 ring-1 ring-white/10"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-xl font-extrabold">{name}</h1>
                <button
                  onClick={startEdit}
                  className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                >
                  編集
                </button>
              </div>
            )}
            <p className="mt-1 truncate text-sm text-white/45">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-3 py-1 ring-1 ring-accent-400/30">
              <BoltIcon className="h-4 w-4 text-accent-300" />
              <span className="tabular font-display text-sm font-extrabold text-white">
                {formatScore(profile?.totalScore ?? 0)}
              </span>
              <span className="text-xs text-white/50">pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 今日の集中 */}
      <div className="mt-4 glass flex items-center justify-between rounded-3xl px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-accent-300 ring-1 ring-white/10">
            <TimerIcon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs text-white/45">今日の集中時間</div>
            <div className="tabular font-display text-2xl font-extrabold text-white">
              {formatDuration(todaySeconds)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 ring-1 ring-amber-400/25">
          <FlameIcon className="h-4 w-4 text-amber-400" />
          <span className="tabular text-sm font-bold text-amber-200">{profile?.streak ?? 0}</span>
          <span className="text-[11px] text-amber-200/70">日連続</span>
        </div>
      </div>

      {/* 統計グリッド */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<ClockIcon className="h-5 w-5" />}
          label="累計勉強時間"
          value={formatDuration(profile?.totalSeconds ?? 0)}
        />
        <StatCard
          icon={<TrophyIcon className="h-5 w-5" />}
          label="目標達成"
          value={`${profile?.goalsAchieved ?? 0} 回`}
        />
        <StatCard
          icon={<CheckIcon className="h-5 w-5" />}
          label="セッション数"
          value={`${sessions} 回`}
        />
        <StatCard
          icon={<BoltIcon className="h-5 w-5" />}
          label="達成率"
          value={`${achieveRate}%`}
        />
        <StatCard
          icon={<FlameIcon className="h-5 w-5" />}
          label="連続学習"
          value={`${profile?.streak ?? 0} 日`}
        />
        <StatCard
          icon={<BoltIcon className="h-5 w-5" />}
          label="合計スコア"
          value={`${formatScore(profile?.totalScore ?? 0)}`}
        />
      </div>

      {/* 達成率バー */}
      <div className="mt-4 glass rounded-3xl p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-white">目標達成率</span>
          <span className="tabular text-white/60">{achieveRate}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-500 to-fuchsia-400 transition-all duration-700"
            style={{ width: `${achieveRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/40">
          目標を達成したセッションの割合です。無理のない目標から始めましょう。
        </p>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3.5 text-sm font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-60"
      >
        <LogoutIcon className="h-5 w-5" />
        {loggingOut ? "ログアウト中…" : "ログアウト"}
      </button>

      <p className="mt-6 text-center text-[11px] text-white/30">StudyQuest · 集中して、競って、伸びる</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-accent-300 ring-1 ring-white/10">
        {icon}
      </span>
      <div className="mt-3 text-[11px] text-white/45">{label}</div>
      <div className="tabular mt-0.5 font-display text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}
