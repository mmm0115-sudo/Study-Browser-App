import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} が設定されていません。.env.local を確認してください。`);
  }
  return value;
}

// Firebase Webアプリの公開クライアント設定。
const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY", import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID", import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requiredEnv(
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: requiredEnv("VITE_FIREBASE_APP_ID", import.meta.env.VITE_FIREBASE_APP_ID),
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
