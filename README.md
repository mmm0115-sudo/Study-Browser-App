# StudyQuest

勉強を「続けたい」に変える、クエスト型の集中タイマーです。

毎日の目標を決めて集中すると、学習時間がXPとして積み上がります。デイリークエスト、レベル、学習レポート、週間ランキングを通して、小さな前進を実感しながら習慣化できます。

## 主な機能

- 正確な集中タイマー（バックグラウンド・再読み込みからの復元対応）
- 1日の学習目標と進捗表示
- デイリークエストとレベルアップ
- 目標達成音、ブラウザ通知、5分休憩タイマー
- 週間・累計ランキング
- 7日間グラフと28日間ヒートマップ
- 科目別の学習時間とセッション履歴
- 連続学習日数（ストリーク）
- Google／メールアドレス認証
- スマートフォン・デスクトップ対応
- ランキング公開設定

## XPの仕組み

- 集中時間1分につき1XP
- セッション目標を達成すると、目標時間の20%をボーナスXPとして獲得
- 目標の途中で終了しても、集中した時間分のXPを獲得
- ストリークは5分以上のセッションで更新
- 放置による過剰加点を防ぐため、1セッションのXP加算は最大4時間

## 画面構成

| 画面 | 内容 |
| --- | --- |
| ホーム | 今日の目標、クエスト、レベル、週間サマリー |
| 勉強する | 目標設定、集中タイマー、休憩タイマー |
| 記録 | 学習グラフ、ヒートマップ、科目別集計、履歴 |
| 順位 | 今週／累計ランキング |
| マイページ | 統計、表示名、通知、公開設定 |

## 技術スタック

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## ローカルで動かす

必要なもの：

- Node.js 20以降
- Firebaseプロジェクト

```bash
git clone <repository-url>
cd <repository-directory>
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` にFirebase Webアプリの設定を入力してください。

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Firebaseコンソールでは、次の機能を有効にします。

1. AuthenticationでGoogleまたはメール／パスワード認証を有効化
2. Cloud Firestoreを作成
3. 利用するドメインをAuthenticationの承認済みドメインへ追加
4. `firestore.rules` をデプロイ

## コマンド

```bash
npm run dev        # 開発サーバー
npm run typecheck  # TypeScriptの検査
npm run build      # 本番ビルド
npm run preview    # 本番ビルドのプレビュー
npm run deploy     # Firebaseへデプロイ
```

## データとプライバシー

ユーザーの学習統計とセッション履歴は本人だけが読み取れます。ランキングには、公開設定を有効にしたユーザーの表示名、アイコン、XP、学習時間など、順位表示に必要な情報だけを別コレクションへ同期します。

Firestoreルールでは、セッション時間とXPの増分、編集可能な設定項目を制限しています。競技性の高い公開サービスとして運用する場合は、XP集計をCloud Functionsなどの信頼できるサーバー環境へ移すことを推奨します。

## ディレクトリ構成

```text
src/
├── components/       UIコンポーネント
├── contexts/         認証状態
├── data/             Firestoreアクセス
├── hooks/            集中タイマー
├── lib/              日付、XP、進捗計算
└── pages/
    ├── HomePage.tsx
    ├── TimerPage.tsx
    ├── HistoryPage.tsx
    ├── RankingPage.tsx
    └── ProfilePage.tsx
```
