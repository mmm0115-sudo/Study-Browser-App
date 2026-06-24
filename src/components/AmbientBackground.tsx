/** 背景の動くグラデーション。集中の邪魔をしない控えめな演出。 */
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-900">
      <div className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent-500/25 blur-[120px] animate-pulse-slow" />
      <div className="absolute right-[-10rem] top-1/4 h-[26rem] w-[26rem] rounded-full bg-violet-400/20 blur-[130px] animate-float" />
      <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-400/10 blur-[140px] animate-pulse-slow" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}
