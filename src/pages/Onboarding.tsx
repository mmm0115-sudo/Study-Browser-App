import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateUserSettings } from "../data/store";
import AmbientBackground from "../components/AmbientBackground";
import Avatar from "../components/Avatar";
import { BoltIcon, TrophyIcon } from "../components/icons";

export default function Onboarding() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? "");
  const [dailyGoal, setDailyGoal] = useState(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 20;

  async function handleStart() {
    if (!user || !valid) return;
    setSaving(true);
    setError(null);
    try {
      await updateUserSettings(user.uid, {
        displayName: trimmed,
        dailyGoalMinutes: dailyGoal,
        onboarded: true,
      });
    } catch (e) {
      console.error(e);
      setError("保存に失敗しました。通信環境を確認してください。");
      setSaving(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <AmbientBackground />

      <div className="w-full max-w-md animate-pop-in">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 via-violet-400 to-fuchsia-400 text-white shadow-lg shadow-accent-500/40">
            <BoltIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold">ようこそ StudyQuest へ 🎉</h1>
          <p className="mt-2 text-sm text-white/55">
            まずはランキングに表示される
            <br />
            ニックネームを決めましょう。
          </p>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex flex-col items-center">
            <Avatar
              photoURL={profile?.photoURL}
              name={trimmed || "?"}
              size={80}
              className="ring-2 ring-white/15"
            />
            <div className="mt-4 w-full">
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                ニックネーム
              </label>
              <input
                type="text"
                value={name}
                maxLength={20}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && valid && handleStart()}
                placeholder="例：勉強マスター"
                className="w-full rounded-2xl bg-white/5 px-4 py-3.5 text-center text-lg font-semibold text-white placeholder:text-white/25 outline-none ring-1 ring-white/10 focus:ring-accent-400/60"
              />
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[11px] text-white/35">あとで変更できます</span>
                <span className="text-[11px] text-white/35">{trimmed.length}/20</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white/5 p-3.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-400/15 text-accent-300">
              <TrophyIcon className="h-4 w-4" />
            </span>
            <p className="text-xs leading-relaxed text-white/55">
              目標時間を決めて勉強 → 達成するとスコアが貯まり、
              みんなとランキングで競えます。さっそく始めましょう！
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-white/50">
              1日の目標
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDailyGoal(minutes)}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${
                    dailyGoal === minutes
                      ? "bg-accent-500 text-white"
                      : "bg-white/5 text-white/55 ring-1 ring-white/10"
                  }`}
                >
                  {minutes}分
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-center text-xs text-rose-300">{error}</p>}

          <button
            onClick={handleStart}
            disabled={!valid || saving}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-accent-500 to-violet-400 px-5 py-3.5 font-display text-lg font-bold text-white shadow-lg shadow-accent-500/30 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "準備中…" : "はじめる"}
          </button>
        </div>
      </div>
    </div>
  );
}
