import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import AmbientBackground from "./components/AmbientBackground";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import TimerPage from "./pages/TimerPage";
import RankingPage from "./pages/RankingPage";
import ProfilePage from "./pages/ProfilePage";
import BoosterPage from "./pages/BoosterPage";
import { BoltIcon } from "./components/icons";

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
  if (!user) return <Login />;
  // ログイン済みだがプロフィール取得中
  if (!profile) return <Splash />;
  // 初回セットアップ未完了
  if (!profile.onboarded) return <Onboarding />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RankingPage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/booster" element={<BoosterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
