import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { ensureUserProfile, subscribeProfile } from "../data/store";
import type { UserProfile } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** 直近のログイン関連エラー（auth/◯◯◯）。画面に表示して原因特定に使う。 */
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(navigator.userAgent);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // リダイレクト方式から戻ってきたときの結果・エラーを拾う（モバイル対策）
    getRedirectResult(auth).catch((e: unknown) => {
      const code = (e as { code?: string })?.code ?? "auth/unknown";
      console.error("リダイレクトログインエラー", e);
      setAuthError(code);
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setAuthError(null);
        try {
          await ensureUserProfile(u);
        } catch (e) {
          console.error("プロフィール作成に失敗", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // プロフィールをリアルタイム購読
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeProfile(user.uid, setProfile);
    return unsub;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      authError,
      async signInWithGoogle() {
        setAuthError(null);
        // モバイルはポップアップが不安定なのでリダイレクト方式を優先
        if (isMobile()) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e: unknown) {
          const code = (e as { code?: string })?.code;
          if (
            code === "auth/popup-blocked" ||
            code === "auth/cancelled-popup-request" ||
            code === "auth/operation-not-supported-in-this-environment"
          ) {
            await signInWithRedirect(auth, googleProvider);
          } else if (code === "auth/popup-closed-by-user") {
            // ユーザーが閉じただけ。無視。
          } else {
            setAuthError(code ?? "auth/unknown");
            throw e;
          }
        }
      },
      async logout() {
        await signOut(auth);
      },
    }),
    [user, profile, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
