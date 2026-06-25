import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// 公開クライアント設定。.env.local で上書き可能。値が無い場合は
// プロジェクト study-app-92fc8 のデフォルトを使用する。
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyC8K4CPWuzQJC_zH0ftKKKo3bZJCqffO_A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "study-app-92fc8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "study-app-92fc8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "study-app-92fc8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "1038717973539",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:1038717973539:web:b114da720e2041af346d96",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
