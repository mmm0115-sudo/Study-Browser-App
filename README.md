# StudyQuest 📚⚡

目標時間を決めて集中 → 達成した分だけスコアが貯まり → オンラインランキングで競い合える勉強タイマーアプリ。
スマホのブラウザでもPCでも快適に使えるレスポンシブ設計です。勉強中は時計・タイマーとしても使えます。

- **フロント**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **バックエンド**: Firebase（Authentication = Googleログイン / Cloud Firestore = データ管理）
- **公開（ホスティング）**: Firebase Hosting（無料枠で完結）

---

## 1. ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで表示される URL（通常 http://localhost:5173 ）を開きます。
スマホの実機で確認したいときは、同じ Wi-Fi 内で表示される `http://<PCのIP>:5173` にアクセスしてください（`server.host: true` 設定済み）。

> Firebase の設定は `.env.local` に保存済みです（プロジェクト `study-app-92fc8`）。
> 別プロジェクトに変える場合は `.env.local` を `.env.example` を参考に書き換えてください。

---

## 2. Firebase コンソール側の初期設定（初回のみ）

[Firebase コンソール](https://console.firebase.google.com/project/study-app-92fc8) を開いて、以下を有効化します。

### ① Google ログインを有効にする
1. **Authentication** → **Sign-in method** タブ
2. **Google** を選んで **有効にする** → プロジェクトのサポートメールを選択して保存

### ② Firestore データベースを作成する
1. **Firestore Database** → **データベースを作成**
2. ロケーションを選択（例：`asia-northeast1`＝東京）
3. **本番環境モード** で作成（セキュリティルールは後で `firebase deploy` で上書きされます）

### ③ 承認済みドメインの確認
- **Authentication** → **Settings** → **承認済みドメイン**
- `localhost` と `study-app-92fc8.web.app` / `study-app-92fc8.firebaseapp.com` が入っていればOK
- 独自ドメインで公開する場合はそのドメインを追加してください

---

## 3. 公開する（無料・Firebase Hosting）

```bash
# Firebase CLI を未インストールなら
npm install -g firebase-tools

# 初回のみログイン
firebase login

# ビルドしてデプロイ（Hosting + Firestoreルール）
npm run deploy
```

デプロイ完了後、以下のURLで公開されます（誰でもアクセス可）:

- https://study-app-92fc8.web.app
- https://study-app-92fc8.firebaseapp.com

> `npm run deploy` は `npm run build && firebase deploy` のショートカットです。
> Hosting だけ更新したいときは `firebase deploy --only hosting`、
> ルールだけなら `firebase deploy --only firestore:rules`。

### Vercel / Netlify で公開したい場合
Firebase Hosting の代わりに Vercel や Netlify でも無料公開できます。
ビルドコマンド `npm run build` / 公開ディレクトリ `dist` を指定し、SPA なので全パスを `/index.html` に rewrite する設定を入れてください。その場合も Firebase の **承認済みドメイン** に公開URLの追加を忘れずに。

---

## 4. スコアの仕組み

- 目標時間（例：25分）を決めて「集中スタート」。
- タイマーが目標に到達すると **目標達成** 🎉。集中した分数がそのままスコアになります（1分 = 1pt）。
- さらに **目標達成ボーナス**（目標分数の20%）が加算されます。
- 目標未達で終了した場合はスコアは入りませんが、勉強時間は記録されます。
- ランキングは全ユーザーの **合計スコア** で競います。連続学習日数（ストリーク）も記録。

---

## 5. ディレクトリ構成

```
src/
├─ firebase.ts            Firebase 初期化（Auth / Firestore）
├─ types.ts               型定義
├─ lib/
│  ├─ format.ts           時間・スコアの整形ユーティリティ
│  └─ score.ts            スコア計算ロジック
├─ data/store.ts          Firestore 読み書き（プロフィール/セッション/ランキング）
├─ contexts/AuthContext.tsx   Googleログイン状態の管理
├─ hooks/useStudyTimer.ts     タイムスタンプ基準の正確なタイマー（リロード復元対応）
├─ components/            UI 部品（タイマーリング・ナビ・紙吹雪 など）
└─ pages/
   ├─ Login.tsx           ログイン画面
   ├─ TimerPage.tsx       メイン（タイマー / 時計 / 目標設定）
   ├─ RankingPage.tsx     ランキング
   └─ ProfilePage.tsx     マイページ（統計）
```

---

## 6. 補足・既知の制限

- スコアはクライアントから書き込む構成のため、厳密な不正対策（改ざん防止）はしていません。
  本格的に競技性を高める場合は Cloud Functions でサーバー側集計に移行してください。
- Firestore のセキュリティルールは `firestore.rules` にあり、
  「自分のデータのみ書き込み可・全員のプロフィールは読み取り可（ランキング用）」になっています。
- 画面スリープ防止に Wake Lock API を使用（対応ブラウザのみ）。
