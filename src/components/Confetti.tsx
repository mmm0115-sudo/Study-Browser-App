import { useEffect, useState } from "react";

const COLORS = ["#818cf8", "#a855f7", "#e879f9", "#34d399", "#fbbf24"];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
}

/** 一度だけ降る紙吹雪。`fire` が true になった瞬間に発火。 */
export default function Confetti({ fire }: { fire: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!fire) return;
    const next: Piece[] = Array.from({ length: 90 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.4,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 3600);
    return () => clearTimeout(t);
  }, [fire]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-12vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(108vh) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.2,0.6,0.4,1) forwards`,
          }}
        />
      ))}
    </div>
  );
}
