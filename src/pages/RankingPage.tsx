import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchLeaderboard } from "../data/store";
import type { LeaderboardEntry, UserProfile } from "../types";
import { localDateKey } from "../lib/format";
import Avatar from "../components/Avatar";
import { formatDuration, formatScore } from "../lib/format";
import { TrophyIcon, FlameIcon, BoltIcon, PlayIcon } from "../components/icons";

export default function RankingPage() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"weekly" | "all">("weekly");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchLeaderboard(100, period));
    } catch (e) {
      console.error(e);
      setError("ランキングを取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const myIndex = entries.findIndex((e) => e.uid === user?.uid);
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  return (
    <div>
      <Hero profile={profile} rank={myRank} loading={loading} />

      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">ランキング</h1>
          <p className="mt-1 text-sm text-white/50">同じ一週間の努力で競い合おう</p>
        </div>
        <button
          onClick={load}
          className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          更新
        </button>
      </header>

      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
        {([
          ["weekly", "今週"],
          ["all", "累計"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${
              period === value ? "bg-white/10 text-white shadow" : "text-white/45"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
          {podium.length > 0 && <Podium entries={podium} meUid={user?.uid} period={period} />}

          <div className="mt-4 space-y-2">
            {rest.map((e, i) => (
              <Row key={e.uid} rank={i + 4} entry={e} isMe={e.uid === user?.uid} period={period} />
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

function Hero({
  profile,
  rank,
  loading,
}: {
  profile: UserProfile | null;
  rank: number | null;
  loading: boolean;
}) {
  const today = localDateKey();
  const studiedToday =
    (profile?.todayDate ?? profile?.lastStudyDate) === today && (profile?.todaySeconds ?? 0) > 0;
  const name = profile?.displayName ?? "あなた";

  const headline = studiedToday
    ? "今日もよくがんばってる！この調子で上を目指そう🔥"
    : "ライバルはもう勉強中。あなたも追いつこう！";

  return (
    <div className="glass-strong relative mb-5 overflow-hidden rounded-3xl p-5 sm:p-6">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent-500/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/50">こんにちは、{name} さん</p>
            <h2 className="mt-1 font-display text-lg font-extrabold leading-snug text-white sm:text-xl">
              {headline}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] text-white/45">現在の順位</div>
            <div className="font-display text-3xl font-extrabold text-gradient">
              {loading ? "…" : rank ? `${rank}位` : "圏外"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Pill icon={<BoltIcon className="h-3.5 w-3.5 text-accent-300" />} text={`${formatScore(profile?.totalScore ?? 0)} pt`} />
          <Pill icon={<FlameIcon className="h-3.5 w-3.5 text-amber-400" />} text={`${profile?.streak ?? 0}日連続`} />
        </div>

        <Link
          to="/timer"
          className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-500 to-violet-400 px-5 py-3.5 font-display text-base font-bold text-white shadow-lg shadow-accent-500/30 transition hover:opacity-95 active:scale-[0.98]"
        >
          <PlayIcon className="h-5 w-5" />
          {studiedToday ? "もう一度勉強する" : "勉強をはじめる"}
        </Link>
      </div>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 ring-1 ring-white/10">
      {icon}
      {text}
    </span>
  );
}

function Podium({
  entries,
  meUid,
  period,
}: {
  entries: LeaderboardEntry[];
  meUid?: string;
  period: "weekly" | "all";
}) {
  // 2位・1位・3位 の順で表示（中央を高く）
  const slots = [
    { entry: entries[1], rank: 2, height: "h-24", medal: "🥈" },
    { entry: entries[0], rank: 1, height: "h-32", medal: "🥇" },
    { entry: entries[2], rank: 3, height: "h-20", medal: "🥉" },
  ].filter((slot): slot is typeof slot & { entry: LeaderboardEntry } => Boolean(slot.entry));

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-end justify-center gap-3">
        {slots.map(({ entry: e, rank, height, medal }) => {
          return (
            <div key={e.uid} className="flex flex-1 flex-col items-center">
              <div className="relative mb-2">
                <Avatar
                  photoURL={e.photoURL}
                  name={e.displayName}
                  size={rank === 1 ? 68 : 54}
                  className={rank === 1 ? "ring-2 ring-amber-400/70" : ""}
                />
                <span className="absolute -bottom-1 -right-1 text-lg">{medal}</span>
              </div>
              <div className="max-w-full truncate text-center text-xs font-semibold text-white">
                {e.uid === meUid ? "あなた" : e.displayName}
              </div>
              <div className="tabular text-[11px] text-accent-300">
                {formatScore(period === "weekly" ? e.weekScore : e.totalScore)} XP
              </div>
              <div
                className={`mt-2 flex w-full items-start justify-center rounded-t-xl bg-gradient-to-t pt-2 ${height} ${
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

function Row({
  rank,
  entry,
  isMe,
  period,
}: {
  rank: number;
  entry: LeaderboardEntry;
  isMe: boolean;
  period: "weekly" | "all";
}) {
  const score = period === "weekly" ? entry.weekScore : entry.totalScore;
  const seconds = period === "weekly" ? entry.weekSeconds : entry.totalSeconds;
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
          <span>{formatDuration(seconds)}</span>
          <span>{period === "weekly" ? `${entry.weekSessions}回` : `${entry.goalsAchieved}回達成`}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-right">
        <BoltIcon className="h-4 w-4 text-accent-300" />
        <span className="tabular font-display text-base font-extrabold text-white">
          {formatScore(score)}
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
