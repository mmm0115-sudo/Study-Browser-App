import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // 以前のリダイレクト方式の残骸を片付ける（エラーは画面に出さずログのみ）。
    // ストレージ分離環境では "missing initial state" になるが無視してよい。
    getRedirectResult(auth).catch((e) => console.warn("redirect cleanup", e));

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
        // ポップアップ方式で統一。リダイレクト方式はドメインが別
        // （github.io ↔ firebaseapp.com）だとストレージ分離で壊れるため使わない。
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e: unknown) {
          const code = (e as { code?: string })?.code;
          if (
            code === "auth/popup-closed-by-user" ||
            code === "auth/cancelled-popup-request"
          ) {
            // ユーザーが閉じただけ。無視。
            return;
          }
          setAuthError(code ?? "auth/unknown");
          throw e;
        }
      },
      async signInWithEmail(email, password) {
        setAuthError(null);
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (e: unknown) {
          setAuthError((e as { code?: string })?.code ?? "auth/unknown");
          throw e;
        }
      },
      async signUpWithEmail(email, password) {
        setAuthError(null);
        try {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        } catch (e: unknown) {
          setAuthError((e as { code?: string })?.code ?? "auth/unknown");
          throw e;
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
