import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useStudyTimer } from "../hooks/useStudyTimer";
import { commitSession } from "../data/store";
import { calcEarnedScore, isAchieved, GOAL_PRESETS } from "../lib/score";
import { formatClock, formatDuration, formatTimeOfDay } from "../lib/format";
import CircularProgress from "../components/CircularProgress";
import CompletionModal from "../components/CompletionModal";
import Confetti from "../components/Confetti";
import { PlayIcon, PauseIcon, StopIcon, ClockIcon, FlameIcon, BoltIcon, CheckIcon } from "../components/icons";

interface Completion {
  elapsedSeconds: number;
  goalSeconds: number;
  achieved: boolean;
  earnedScore: number;
  label: string;
}

export default function TimerPage() {
  const { user, profile } = useAuth();
  const timer = useStudyTimer();
  const [now, setNow] = useState(() => new Date());
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [saving, setSaving] = useState(false);
  const [fireConfetti, setFireConfetti] = useState(false);
  const [breakUntil, setBreakUntil] = useState<number | null>(null);
  const celebratedRef = useRef(false);

  // 時計（現在時刻）
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const active = timer.status !== "idle";
  const achieved = isAchieved(timer.elapsedSeconds, timer.goalSeconds);
  const progress = timer.goalSeconds > 0 ? timer.elapsedSeconds / timer.goalSeconds : 0;
  const remaining = Math.max(0, timer.goalSeconds - timer.elapsedSeconds);

  // 目標達成の瞬間に紙吹雪
  useEffect(() => {
    if (timer.status === "idle") {
      celebratedRef.current = false;
      return;
    }
    if (achieved && !celebratedRef.current) {
      celebratedRef.current = true;
      setFireConfetti(true);
      window.setTimeout(() => setFireConfetti(false), 200);
      // 軽い振動（対応端末のみ）
      if ("vibrate" in navigator) navigator.vibrate?.([40, 60, 40]);
      if (profile?.soundEnabled !== false) playChime();
      if (profile?.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
        new Notification("StudyQuest：目標達成！", {
          body: `${timer.label || "集中セッション"}を達成しました。おつかれさま！`,
          icon: "./favicon.svg",
        });
      }
    }
  }, [achieved, profile?.notificationsEnabled, profile?.soundEnabled, timer.label, timer.status]);

  useEffect(() => {
    if (timer.status === "idle") {
      document.title = "StudyQuest — 今日も一歩進もう";
      return;
    }
    document.title = `${formatClock(achieved ? timer.elapsedSeconds : remaining)} · ${timer.label || "集中中"}`;
    return () => {
      document.title = "StudyQuest — 集中して、競って、伸びる勉強タイマー";
    };
  }, [achieved, remaining, timer.elapsedSeconds, timer.label, timer.status]);

  // 画面が消えないようにする（Wake Lock）
  useEffect(() => {
    if (timer.status !== "running") return;
    let lock: WakeLockSentinel | null = null;
    let released = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        /* 非対応またはユーザー操作待ち */
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [timer.status]);

  function handleFinish() {
    if (timer.elapsedSeconds < 1) {
      timer.reset();
      return;
    }
    timer.pause();
    const earnedScore = calcEarnedScore(timer.elapsedSeconds, timer.goalSeconds);
    setCompletion({
      elapsedSeconds: timer.elapsedSeconds,
      goalSeconds: timer.goalSeconds,
      achieved,
      earnedScore,
      label: timer.label,
    });
  }

  async function handleConfirmSave(startBreak = false) {
    if (!completion || !user) return;
    setSaving(true);
    try {
      await commitSession(user.uid, {
        elapsedSeconds: completion.elapsedSeconds,
        goalSeconds: completion.goalSeconds,
        achieved: completion.achieved,
        earnedScore: completion.earnedScore,
        label: completion.label,
      });
      setCompletion(null);
      timer.reset();
      if (startBreak) setBreakUntil(Date.now() + 5 * 60 * 1000);
    } catch (e) {
      console.error("保存に失敗", e);
      alert("保存に失敗しました。通信環境をご確認ください。");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setCompletion(null);
    timer.reset();
  }

  return (
    <div className="no-select">
      <Confetti fire={fireConfetti} />

      {/* ヘッダー：現在時刻（時計として使える） */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-white/45">
            <ClockIcon className="h-4 w-4" />
            <span className="text-xs font-medium">
              {now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
            </span>
          </div>
          <div className="tabular mt-0.5 font-display text-2xl font-bold text-white/85">
            {formatTimeOfDay(now)}
            <span className="ml-1 text-base text-white/40">
              {now.getSeconds().toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            <MiniStat icon={<FlameIcon className="h-4 w-4 text-amber-400" />} value={`${profile.streak}`} unit="日連続" />
            <MiniStat icon={<BoltIcon className="h-4 w-4 text-accent-300" />} value={profile.totalScore.toLocaleString()} unit="pt" />
          </div>
        )}
      </div>

      {breakUntil ? (
        <BreakTimer
          until={breakUntil}
          soundEnabled={profile?.soundEnabled !== false}
          notificationsEnabled={profile?.notificationsEnabled === true}
          onFinish={() => setBreakUntil(null)}
        />
      ) : active ? (
        <ActiveTimer
          elapsed={timer.elapsedSeconds}
          goal={timer.goalSeconds}
          remaining={remaining}
          progress={progress}
          achieved={achieved}
          paused={timer.status === "paused"}
          label={timer.label}
          onPause={timer.pause}
          onResume={timer.resume}
          onFinish={handleFinish}
          onExtend={(minutes) => timer.extendGoal(minutes * 60)}
        />
      ) : (
        <GoalSetup
          goalSeconds={timer.goalSeconds}
          label={timer.label}
          onChangeGoal={timer.setGoal}
          onChangeLabel={timer.setLabel}
          onStart={() => timer.start(timer.goalSeconds, timer.label)}
        />
      )}

      <CompletionModal
        open={!!completion}
        achieved={completion?.achieved ?? false}
        elapsedSeconds={completion?.elapsedSeconds ?? 0}
        goalSeconds={completion?.goalSeconds ?? 0}
        earnedScore={completion?.earnedScore ?? 0}
        label={completion?.label ?? ""}
        saving={saving}
        onConfirm={() => handleConfirmSave(false)}
        onConfirmBreak={() => handleConfirmSave(true)}
        onDiscard={handleDiscard}
      />
    </div>
  );
}

/* ------------------------- 稼働中タイマー ------------------------- */

function ActiveTimer({
  elapsed,
  goal,
  remaining,
  progress,
  achieved,
  paused,
  label,
  onPause,
  onResume,
  onFinish,
  onExtend,
}: {
  elapsed: number;
  goal: number;
  remaining: number;
  progress: number;
  achieved: boolean;
  paused: boolean;
  label: string;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onExtend: (minutes: number) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      {label && (
        <div className="mb-4 rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70 ring-1 ring-white/10">
          {label}
        </div>
      )}

      <div className="relative my-2">
        <CircularProgress
          progress={achieved ? 1 : progress}
          complete={achieved}
          paused={paused}
          size={Math.min(340, typeof window !== "undefined" ? window.innerWidth - 56 : 340)}
          stroke={16}
        >
          <div className="flex flex-col items-center">
            {achieved ? (
              <span className="mb-1 flex items-center gap-1 rounded-full bg-mint-400/15 px-3 py-1 text-xs font-bold text-mint-400 ring-1 ring-mint-400/30">
                <CheckIcon className="h-3.5 w-3.5" /> 目標達成
              </span>
            ) : (
              <span className="mb-1 text-xs font-medium uppercase tracking-widest text-white/40">
                {paused ? "一時停止中" : "集中中"}
              </span>
            )}
            <div className="tabular font-display text-[3.4rem] font-extrabold leading-none text-white sm:text-6xl">
              {formatClock(elapsed)}
            </div>
            <div className="tabular mt-2 text-sm text-white/45">
              {achieved
                ? `目標 ${formatDuration(goal)} 達成 ✓`
                : `あと ${formatClock(remaining)} / 目標 ${formatDuration(goal)}`}
            </div>
          </div>
        </CircularProgress>
      </div>

      {/* コントロール */}
      <div className="mt-6 flex items-center justify-center gap-4">
        {paused ? (
          <CircleButton onClick={onResume} variant="primary" aria-label="再開">
            <PlayIcon className="h-7 w-7" />
          </CircleButton>
        ) : (
          <CircleButton onClick={onPause} variant="ghost" aria-label="一時停止">
            <PauseIcon className="h-7 w-7" />
          </CircleButton>
        )}
        <CircleButton onClick={onFinish} variant={achieved ? "success" : "danger"} aria-label="終了して記録">
          <StopIcon className="h-7 w-7" />
        </CircleButton>
      </div>
      <p className="mt-4 text-center text-xs text-white/35">
        {achieved
          ? "このまま続けると時間がさらに加算されます。停止すると記録できます。"
          : "集中した時間はXPになります。目標達成でボーナスXPも獲得できます。"}
      </p>
      {achieved && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-white/45">目標を延長</span>
          {[5, 15].map((minutes) => (
            <button
              key={minutes}
              onClick={() => onExtend(minutes)}
              className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 ring-1 ring-white/10"
            >
              +{minutes}分
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CircleButton({
  children,
  onClick,
  variant,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "ghost" | "danger" | "success";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    primary: "bg-gradient-to-br from-accent-500 to-violet-400 text-white shadow-lg shadow-accent-500/30",
    success: "bg-gradient-to-br from-mint-400 to-accent-400 text-white shadow-lg shadow-mint-400/30",
    danger: "bg-white/10 text-rose-200 ring-1 ring-rose-300/20",
    ghost: "bg-white/10 text-white ring-1 ring-white/10",
  };
  return (
    <button
      onClick={onClick}
      className={`flex h-16 w-16 items-center justify-center rounded-full transition active:scale-95 ${styles[variant]}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------- 目標設定（待機中） ------------------------- */

function GoalSetup({
  goalSeconds,
  label,
  onChangeGoal,
  onChangeLabel,
  onStart,
}: {
  goalSeconds: number;
  label: string;
  onChangeGoal: (s: number) => void;
  onChangeLabel: (l: string) => void;
  onStart: () => void;
}) {
  const goalMinutes = Math.round(goalSeconds / 60);
  const isPreset = useMemo(() => GOAL_PRESETS.includes(goalMinutes as never), [goalMinutes]);

  return (
    <div className="flex flex-col items-center">
      <div className="glass w-full rounded-3xl p-6 sm:p-7">
        <h2 className="font-display text-lg font-bold">今日の目標を決めよう</h2>
        <p className="mt-1 text-sm text-white/50">
          集中1分で1XP。目標達成でボーナスXPも獲得できます。
        </p>

        {/* 目標時間プリセット */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {GOAL_PRESETS.map((m) => {
            const selected = goalMinutes === m;
            return (
              <button
                key={m}
                onClick={() => onChangeGoal(m * 60)}
                className={`rounded-2xl px-2 py-4 text-center transition active:scale-95 ${
                  selected
                    ? "bg-gradient-to-br from-accent-500/90 to-violet-400/90 text-white shadow-lg shadow-accent-500/25"
                    : "bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10"
                }`}
              >
                <div className="font-display text-xl font-extrabold">{m}</div>
                <div className="text-[11px] opacity-70">分</div>
              </button>
            );
          })}
        </div>

        {/* カスタム入力 */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
          <ClockIcon className="h-5 w-5 text-white/40" />
          <input
            type="number"
            min={1}
            max={600}
            inputMode="numeric"
            value={goalMinutes}
            onChange={(e) => {
              const v = Math.max(1, Math.min(600, Number(e.target.value) || 0));
              onChangeGoal(v * 60);
            }}
            className={`w-full bg-transparent text-base font-semibold text-white outline-none ${
              isPreset ? "" : "text-accent-300"
            }`}
          />
          <span className="text-sm text-white/40">分</span>
        </div>

        {/* 科目ラベル */}
        <div className="mt-3">
          <input
            type="text"
            value={label}
            maxLength={24}
            onChange={(e) => onChangeLabel(e.target.value)}
            placeholder="科目・内容（任意）例：数学II 微分"
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-accent-400/50"
          />
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-500 to-violet-400 px-6 py-4 font-display text-lg font-bold text-white shadow-xl shadow-accent-500/30 transition hover:opacity-95 active:scale-[0.98]"
      >
        <PlayIcon className="h-6 w-6" />
        集中スタート
      </button>
    </div>
  );
}

function MiniStat({ icon, value, unit }: { icon: React.ReactNode; value: string; unit: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
      {icon}
      <span className="tabular text-sm font-bold text-white">{value}</span>
      <span className="text-[11px] text-white/40">{unit}</span>
    </div>
  );
}

function BreakTimer({
  until,
  soundEnabled,
  notificationsEnabled,
  onFinish,
}: {
  until: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  onFinish: () => void;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((until - Date.now()) / 1000)));
  const notified = useRef(false);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [until]);

  useEffect(() => {
    if (remaining > 0 || notified.current) return;
    notified.current = true;
    if (soundEnabled) playChime();
    if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification("StudyQuest：休憩終了", {
        body: "次の集中を始める準備ができました。",
        icon: "./favicon.svg",
      });
    }
  }, [notificationsEnabled, remaining, soundEnabled]);

  return (
    <div className="glass-strong flex flex-col items-center rounded-3xl px-6 py-10 text-center">
      <span className="rounded-full bg-mint-400/10 px-4 py-1.5 text-xs font-bold text-mint-400 ring-1 ring-mint-400/25">
        休憩中
      </span>
      <h2 className="mt-5 font-display text-2xl font-extrabold">目と肩を休めよう</h2>
      <p className="mt-2 text-sm text-white/55">水分補給して、少し遠くを見てみよう。</p>
      <div className="tabular my-8 font-display text-7xl font-extrabold text-gradient">
        {formatClock(remaining)}
      </div>
      <button
        onClick={onFinish}
        className="w-full max-w-xs rounded-2xl bg-gradient-to-r from-accent-500 to-violet-400 px-5 py-3.5 font-bold text-white"
      >
        {remaining === 0 ? "次の集中へ" : "休憩を終える"}
      </button>
    </div>
  );
}

function playChime() {
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.65);
    gain.connect(context.destination);
    [659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.12);
      oscillator.stop(context.currentTime + 0.6);
    });
    window.setTimeout(() => context.close().catch(() => {}), 900);
  } catch {
    // 音声API非対応時は振動・通知だけを使う
  }
}
