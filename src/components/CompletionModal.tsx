import { CheckIcon, BoltIcon } from "./icons";
import { formatDuration } from "../lib/format";

interface Props {
  open: boolean;
  achieved: boolean;
  elapsedSeconds: number;
  goalSeconds: number;
  earnedScore: number;
  label: string;
  saving: boolean;
  onConfirm: () => void;
  onConfirmBreak: () => void;
  onDiscard: () => void;
}

export default function CompletionModal({
  open,
  achieved,
  elapsedSeconds,
  goalSeconds,
  earnedScore,
  label,
  saving,
  onConfirm,
  onConfirmBreak,
  onDiscard,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-title"
        className="glass-strong w-full max-w-sm rounded-3xl p-6 animate-pop-in"
      >
        <div className="flex flex-col items-center text-center">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg ${
              achieved
                ? "bg-gradient-to-br from-mint-400 to-accent-400 shadow-mint-400/30"
                : "bg-white/10"
            }`}
          >
            <CheckIcon className="h-8 w-8" />
          </span>

          <h2 id="completion-title" className="mt-4 font-display text-xl font-extrabold">
            {achieved ? "目標達成！おつかれさま 🎉" : "セッション終了"}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            {label ? `「${label}」を ` : ""}
            {formatDuration(elapsedSeconds)}集中しました
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            <Stat label="集中時間" value={formatDuration(elapsedSeconds)} />
            <Stat label="目標" value={formatDuration(goalSeconds)} />
          </div>

          <div
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 ${
              achieved ? "bg-mint-400/10 ring-1 ring-mint-400/30" : "bg-white/5"
            }`}
          >
            <BoltIcon className={`h-5 w-5 ${achieved ? "text-mint-400" : "text-white/40"}`} />
            <span className="text-sm text-white/60">獲得XP</span>
            <span
              className={`tabular font-display text-2xl font-extrabold ${
                achieved ? "text-mint-400" : "text-white/50"
              }`}
            >
              +{earnedScore}
            </span>
          </div>

          {!achieved && (
            <p className="mt-3 text-xs leading-relaxed text-amber-200/80">
              途中までの集中時間もXPになります。
              <br />
              次は少し短い目標から試してみよう 💪
            </p>
          )}

          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <button
              onClick={onDiscard}
              disabled={saving}
              className="flex-1 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-50"
            >
              記録しない
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-accent-500 to-violet-400 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-accent-500/30 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "保存中…" : "記録する"}
            </button>
          </div>
          <button
            onClick={onConfirmBreak}
            disabled={saving}
            className="mt-3 w-full rounded-2xl bg-mint-400/10 px-4 py-3 text-sm font-bold text-mint-400 ring-1 ring-mint-400/25 transition hover:bg-mint-400/15 disabled:opacity-50"
          >
            記録して5分休憩
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="tabular mt-1 font-display text-base font-bold text-white">{value}</div>
    </div>
  );
}
