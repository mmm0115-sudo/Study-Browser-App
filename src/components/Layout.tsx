import { type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AmbientBackground from "./AmbientBackground";
import Avatar from "./Avatar";
import { TimerIcon, TrophyIcon, UserIcon, BoltIcon } from "./icons";

const NAV = [
  { to: "/", label: "ランキング", Icon: TrophyIcon },
  { to: "/timer", label: "勉強する", Icon: TimerIcon },
  { to: "/profile", label: "マイページ", Icon: UserIcon },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const location = useLocation();
  const name = profile?.displayName ?? user?.displayName ?? "ゲスト";

  return (
    <div className="min-h-dvh">
      <AmbientBackground />

      {/* デスクトップ用サイドバー */}
      <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-64 flex-col border-r border-white/5 bg-ink-900/60 px-5 py-7 backdrop-blur-xl lg:flex">
        <Brand />
        <nav className="mt-10 flex flex-col gap-1.5">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <Avatar photoURL={profile?.photoURL} name={name} size={40} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{name}</div>
            <div className="text-xs text-white/45">
              {(profile?.totalScore ?? 0).toLocaleString()} pt
            </div>
          </div>
        </div>
      </aside>

      {/* モバイル用トップバー */}
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink-900/70 px-5 py-3.5 backdrop-blur-xl lg:hidden">
        <Brand compact />
        <NavLink to="/profile" aria-label="マイページ">
          <Avatar photoURL={profile?.photoURL} name={name} size={36} />
        </NavLink>
      </header>

      {/* メイン */}
      <main
        key={location.pathname}
        className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 lg:max-w-4xl lg:py-10 lg:pl-72 lg:pr-8"
      >
        <div className="animate-rise">{children}</div>
      </main>

      {/* モバイル用ボトムナビ */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-ink-900/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition ${
                  isActive ? "text-accent-300" : "text-white/45"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""} transition`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 via-violet-400 to-fuchsia-400 text-white shadow-lg shadow-accent-500/30">
        <BoltIcon className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="font-display text-lg font-extrabold tracking-tight">
          Study<span className="text-gradient">Quest</span>
        </span>
      ) : (
        <span className="font-display text-base font-extrabold tracking-tight">
          Study<span className="text-gradient">Quest</span>
        </span>
      )}
    </div>
  );
}
