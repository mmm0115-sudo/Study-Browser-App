import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AmbientBackground from "../components/AmbientBackground";
import { BoltIcon, GoogleIcon, TimerIcon, TrophyIcon, FlameIcon } from "../components/icons";

const ERROR_HINTS: Record<string, string> = {
  "auth/unauthorized-domain":
    "このドメインが未許可です。Firebase の Authentication → 設定 → 承認済みドメイン に追加してください。",
  "auth/operation-not-allowed":
    "Googleログインが無効です。Firebase の Authentication → Sign-in method で Google を有効にしてください。",
  "auth/popup-blocked": "ポップアップがブロックされました。ブラウザの設定で許可してください。",
  "auth/network-request-failed": "通信エラーです。ネット接続を確認してください。",
};

export default function Login() {
  const { signInWithGoogle, authError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "auth/unknown";
      console.error(e);
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  const shownError = error ?? authError;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <AmbientBackground />

      <div className="w-full max-w-md animate-pop-in">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 via-violet-400 to-fuchsia-400 text-white shadow-lg shadow-accent-500/40">
            <BoltIcon className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight">
            Study<span className="text-gradient">Quest</span>
          </span>
        </div>

        <h1 className="text-center font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          集中して、競って、
          <br />
          <span className="text-gradient">伸びる。</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-white/55">
          目標時間を決めて勉強。達成した分だけスコアが貯まり、
          世界中の仲間とランキングで競い合えます。
        </p>

        <div className="glass mt-8 rounded-3xl p-6">
          <ul className="mb-6 space-y-3">
            <Feature
              Icon={TimerIcon}
              title="集中タイマー"
              desc="勉強中は時計・タイマーとして使える美しい画面"
            />
            <Feature
              Icon={TrophyIcon}
              title="オンラインランキング"
              desc="達成スコアで全国・全世界のライバルと勝負"
            />
            <Feature
              Icon={FlameIcon}
              title="継続を可視化"
              desc="連続学習日数や累計時間でモチベ維持"
            />
          </ul>

          <button
            onClick={handleLogin}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 font-semibold text-ink-900 shadow-lg shadow-black/30 transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" />
            {busy ? "ログイン中…" : "Googleではじめる"}
          </button>

          {shownError && (
            <div className="mt-3 rounded-xl bg-rose-400/10 px-3 py-2.5 text-center ring-1 ring-rose-300/20">
              <p className="text-xs font-semibold text-rose-200">
                ログイン失敗：<span className="font-mono">{shownError}</span>
              </p>
              {ERROR_HINTS[shownError] && (
                <p className="mt-1 text-[11px] leading-relaxed text-rose-200/80">
                  {ERROR_HINTS[shownError]}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-center text-[11px] leading-relaxed text-white/35">
            ログインすると利用規約に同意したものとみなされます。
            <br />
            勉強記録とスコアのみを保存します。
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  Icon,
  title,
  desc,
}: {
  Icon: typeof TimerIcon;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-accent-300 ring-1 ring-white/10">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-white/50">{desc}</div>
      </div>
    </li>
  );
}
