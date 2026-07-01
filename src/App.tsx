import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import AmbientBackground from "./components/AmbientBackground";
import { BoltIcon } from "./components/icons";

const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const HomePage = lazy(() => import("./pages/HomePage"));
const TimerPage = lazy(() => import("./pages/TimerPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const RankingPage = lazy(() => import("./pages/RankingPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <AmbientBackground />
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 via-violet-400 to-fuchsia-400 text-white shadow-lg shadow-accent-500/40">
          <BoltIcon className="h-7 w-7" />
        </span>
        <p className="text-sm text-white/50">読み込み中…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return <Splash />;
  if (!user) return <Suspense fallback={<Splash />}><Login /></Suspense>;
  // ログイン済みだがプロフィール取得中
  if (!profile) return <Splash />;
  // 初回セットアップ未完了
  if (!profile.onboarded) return <Suspense fallback={<Splash />}><Onboarding /></Suspense>;

  return (
    <Layout>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/[0.04]" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
