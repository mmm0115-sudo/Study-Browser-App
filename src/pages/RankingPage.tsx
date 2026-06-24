import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchLeaderboard } from "../data/store";
import type { LeaderboardEntry } from "../types";
import Avatar from "../components/Avatar";
import { formatDuration, formatScore } from "../lib/format";
import { TrophyIcon, FlameIcon, BoltIcon } from "../components/icons";

export default function RankingPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchLeaderboard(100));
    } catch (e) {
      console.error(e);
      setError("ランキングを取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const myIndex = entries.findIndex((e) => e.uid === user?.uid);
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">ランキング</h1>
          <p className="mt-1 text-sm text-white/50">達成スコアで競い合おう</p>
        </div>
        <button
          onClick={load}
          className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          更新
        </button>
      </header>

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <EmptyState title="エラー" desc={error} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="まだ誰もいません"
          desc="最初のチャレンジャーになろう。勉強を記録するとここに載ります。"
        />
      ) : (
        <>
          {podium.length > 0 && <Podium entries={podium} meUid={user?.uid} />}

          <div className="mt-4 space-y-2">
            {rest.map((e, i) => (
              <Row key={e.uid} rank={i + 4} entry={e} isMe={e.uid === user?.uid} />
            ))}
          </div>

          {myIndex === -1 && (
            <p className="mt-6 text-center text-sm text-white/40">
              あなたはまだ圏外です。目標を達成してスコアを稼ごう！
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Podium({ entries, meUid }: { entries: LeaderboardEntry[]; meUid?: string }) {
  // 2位・1位・3位 の順で表示（中央を高く）
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  const heights = ["h-24", "h-32", "h-20"];
  const ranks = [2, 1, 3];
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-end justify-center gap-3">
        {order.map((e, i) => {
          const rank = ranks[i];
          return (
            <div key={e.uid} className="flex flex-1 flex-col items-center">
              <div className="relative mb-2">
                <Avatar
                  photoURL={e.photoURL}
                  name={e.displayName}
                  size={rank === 1 ? 68 : 54}
                  className={rank === 1 ? "ring-2 ring-amber-400/70" : ""}
                />
                <span className="absolute -bottom-1 -right-1 text-lg">{medals[i]}</span>
              </div>
              <div className="max-w-full truncate text-center text-xs font-semibold text-white">
                {e.uid === meUid ? "あなた" : e.displayName}
              </div>
              <div className="tabular text-[11px] text-accent-300">{formatScore(e.totalScore)} pt</div>
              <div
                className={`mt-2 flex w-full items-start justify-center rounded-t-xl bg-gradient-to-t pt-2 ${heights[i]} ${
                  rank === 1
                    ? "from-amber-400/10 to-amber-400/30"
                    : "from-white/5 to-white/15"
                }`}
              >
                <span className="font-display text-xl font-extrabold text-white/80">{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ rank, entry, isMe }: { rank: number; entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 transition ${
        isMe
          ? "bg-accent-500/15 ring-accent-400/40"
          : "bg-white/[0.03] ring-white/5 hover:bg-white/[0.06]"
      }`}
    >
      <span className="tabular w-7 shrink-0 text-center font-display text-sm font-bold text-white/45">
        {rank}
      </span>
      <Avatar photoURL={entry.photoURL} name={entry.displayName} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
          {isMe ? "あなた" : entry.displayName}
          {isMe && (
            <span className="rounded-full bg-accent-400/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-200">
              YOU
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1">
            <FlameIcon className="h-3 w-3 text-amber-400/80" />
            {entry.streak}日
          </span>
          <span>{formatDuration(entry.totalSeconds)}</span>
          <span>{entry.goalsAchieved}回達成</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-right">
        <BoltIcon className="h-4 w-4 text-accent-300" />
        <span className="tabular font-display text-base font-extrabold text-white">
          {formatScore(entry.totalScore)}
        </span>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      <div className="glass mb-4 h-44 rounded-3xl" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/40">
        <TrophyIcon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-white/50">{desc}</p>
    </div>
  );
}
