import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
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
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
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
      async signInWithGoogle() {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e: unknown) {
          // ポップアップがブロックされた場合はリダイレクトにフォールバック
          const code = (e as { code?: string })?.code;
          if (
            code === "auth/popup-blocked" ||
            code === "auth/cancelled-popup-request" ||
            code === "auth/operation-not-supported-in-this-environment"
          ) {
            await signInWithRedirect(auth, googleProvider);
          } else if (code !== "auth/popup-closed-by-user") {
            throw e;
          }
        }
      },
      async logout() {
        await signOut(auth);
      },
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
