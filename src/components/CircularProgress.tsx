import type { ReactNode } from "react";

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  complete?: boolean;
  paused?: boolean;
  children?: ReactNode;
}

export default function CircularProgress({
  progress,
  size = 300,
  stroke = 14,
  complete = false,
  paused = false,
  children,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          <linearGradient id="ringGradDone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={complete ? "url(#ringGradDone)" : "url(#ringGrad)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-linear"
          style={{
            filter: complete
              ? "drop-shadow(0 0 14px rgba(52,211,153,0.55))"
              : paused
                ? "none"
                : "drop-shadow(0 0 12px rgba(168,85,247,0.45))",
            opacity: paused ? 0.55 : 1,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
