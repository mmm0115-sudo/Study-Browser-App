import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../contexts/AuthContext";
import { functions } from "../firebase";
import { SparkleIcon, BoltIcon, CheckIcon, FlameIcon } from "../components/icons";

/** Stripe の購入リンク（テスト）。client_reference_id に uid を渡して購入者を特定する。 */
const PAYMENT_LINK = "https://buy.stripe.com/test_aFa00ifnsbQK45SgIr5EY00";

export default function BoosterPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = !!profile?.boosterActive;
  const multiplier = profile?.boosterMultiplier ?? 2;

  function handleBuy() {
    if (!user) return;
    const url = new URL(PAYMENT_LINK);
    url.searchParams.set("client_reference_id", user.uid);
    if (user.email) url.searchParams.set("prefilled_email", user.email);
    window.location.href = url.toString();
  }

  async function handleManage() {
    setLoading(true);
    setError(null);
    try {
      const createPortal = httpsCallable<{ returnUrl: string }, { url: string }>(
        functions,
        "createBillingPortal"
      );
      const res = await createPortal({ returnUrl: window.location.href });
      window.location.href = res.data.url;
    } catch (e) {
      console.error(e);
      setError("管理ページを開けませんでした。少し待って再度お試しください。");
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-extrabold">XPブースター</h1>
        <p className="mt-1 text-sm text-white/50">勉強で得るスコアを{multiplier}倍にしよう</p>
      </header>

      {/* メインカード */}
      <div className="glass-strong relative overflow-hidden rounded-3xl p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-400/25 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-fuchsia-400 to-accent-400 text-white shadow-lg shadow-fuchsia-400/30">
            <SparkleIcon className="h-8 w-8" />
          </span>
          <div className="mt-3 font-display text-4xl font-extrabold text-gradient">
            XP {multiplier}倍
          </div>

          {active ? (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mint-400/15 px-4 py-1.5 text-sm font-bold text-mint-400 ring-1 ring-mint-400/30">
              <CheckIcon className="h-4 w-4" /> 有効中
            </span>
          ) : (
            <p className="mt-2 text-sm text-white/55">
              契約中ずっと、勉強で得るスコアが{multiplier}倍になります。
            </p>
          )}
        </div>

        <ul className="relative mt-6 space-y-2.5">
          <Benefit text={`目標達成のスコアが常時${multiplier}倍`} />
          <Benefit text="ランキングを一気に駆け上がれる" />
          <Benefit text="いつでも解約OK・解約後は通常倍率に戻る" />
        </ul>

        <div className="relative mt-6">
          {active ? (
            <button
              onClick={handleManage}
              disabled={loading}
              className="w-full rounded-2xl bg-white/10 px-5 py-3.5 font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "開いています…" : "サブスクを管理・解約する"}
            </button>
          ) : (
            <button
              onClick={handleBuy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-fuchsia-400 to-accent-400 px-5 py-3.5 font-display text-lg font-bold text-white shadow-lg shadow-fuchsia-400/30 transition hover:opacity-95 active:scale-[0.98]"
            >
              <BoltIcon className="h-5 w-5" />
              ブースターを購入する
            </button>
          )}
          {error && <p className="mt-3 text-center text-xs text-rose-300">{error}</p>}
        </div>
      </div>

      {!active && (
        <p className="mt-4 px-1 text-center text-xs leading-relaxed text-white/40">
          購入後、決済の反映に数秒かかることがあります。
          <br />
          反映されると自動でこの画面が「有効中」に変わります。
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/35">
        <FlameIcon className="h-4 w-4 text-amber-400/70" />
        決済は Stripe により安全に処理されます
      </div>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2.5 rounded-2xl bg-white/5 px-4 py-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-400/15 text-mint-400">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <span className="text-sm text-white/75">{text}</span>
    </li>
  );
}
