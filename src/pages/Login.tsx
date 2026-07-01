import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AmbientBackground from "../components/AmbientBackground";
import { BoltIcon, GoogleIcon, TimerIcon, TrophyIcon, FlameIcon } from "../components/icons";

const ERROR_HINTS: Record<string, string> = {
  "auth/unauthorized-domain":
    "このドメインが未許可です。Firebase の Authentication → 設定 → 承認済みドメインに追加してください。",
  "auth/operation-not-allowed":
    "このログイン方法が無効です。Firebase の Authentication → Sign-in method で有効にしてください。",
  "auth/invalid-email": "メールアドレスの形式が正しくありません。",
  "auth/email-already-in-use": "このメールは登録済みです。「ログイン」に切り替えてください。",
  "auth/weak-password": "パスワードは6文字以上にしてください。",
  "auth/missing-password": "パスワードを入力してください。",
  "auth/invalid-credential": "メールまたはパスワードが違います。",
  "auth/user-not-found": "このメールは未登録です。「新規登録」してください。",
  "auth/wrong-password": "パスワードが違います。",
  "auth/too-many-requests": "試行回数が多すぎます。少し待って再度お試しください。",
  "auth/network-request-failed": "通信エラーです。ネット接続を確認してください。",
  "auth/popup-blocked": "ポップアップがブロックされました。メールでのログインをお試しください。",
};

type Mode = "signin" | "signup";

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authError } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownError = error ?? authError;
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !busy;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (err) {
      setError((err as { code?: string })?.code ?? "auth/unknown");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError((err as { code?: string })?.code ?? "auth/unknown");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <AmbientBackground />

      <div className="w-full max-w-md animate-pop-in">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 via-violet-400 to-fuchsia-400 text-white shadow-lg shadow-accent-500/40">
            <BoltIcon className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight">
            Study<span className="text-gradient">Quest</span>
          </span>
        </div>

        <h1 className="text-center font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          集中して、競って、<span className="text-gradient">伸びる。</span>
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-white/55">
          集中した時間がXPになり、毎日のクエストと週間ランキングで楽しく続けられます。
        </p>

        <div className="glass mt-7 rounded-3xl p-6">
          {/* タブ切り替え */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1">
            <TabButton active={mode === "signin"} onClick={() => setMode("signin")}>
              ログイン
            </TabButton>
            <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
              新規登録
            </TabButton>
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                メールアドレス
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none ring-1 ring-white/10 focus:ring-accent-400/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                パスワード（6文字以上）
              </label>
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none ring-1 ring-white/10 focus:ring-accent-400/60"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-500 to-violet-400 px-5 py-3.5 font-bold text-white shadow-lg shadow-accent-500/30 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? "処理中…" : mode === "signup" ? "登録してはじめる" : "ログイン"}
            </button>
          </form>

          {/* 区切り */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/35">または</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 font-semibold text-ink-900 shadow-lg shadow-black/30 transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" />
            Googleでログイン
          </button>

          {shownError && (
            <div className="mt-4 rounded-xl bg-rose-400/10 px-3 py-2.5 text-center ring-1 ring-rose-300/20">
              <p className="text-xs font-semibold text-rose-200">
                {ERROR_HINTS[shownError] ?? "ログインに失敗しました。"}
              </p>
              <p className="mt-1 font-mono text-[10px] text-rose-200/60">{shownError}</p>
            </div>
          )}
        </div>

        <ul className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-5 text-white/40">
          <MiniFeature Icon={TimerIcon} label="集中タイマー" />
          <MiniFeature Icon={TrophyIcon} label="ランキング" />
          <MiniFeature Icon={FlameIcon} label="継続記録" />
        </ul>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl py-2 text-sm font-semibold transition ${
        active ? "bg-white/10 text-white shadow" : "text-white/45 hover:text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

function MiniFeature({ Icon, label }: { Icon: typeof TimerIcon; label: string }) {
  return (
    <li className="flex flex-col items-center gap-1">
      <Icon className="h-5 w-5" />
      <span className="text-[11px]">{label}</span>
    </li>
  );
}
