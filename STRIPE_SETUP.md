# XPブースター（Stripeサブスク）セットアップ手順

「購入したら解約するまでXP2倍」を**正しく自動反映**するための設定です。
Cloud Functions（サーバー）＋Stripe Webhookを使います。

> 前提：Cloud Functions は **Firebase Blaze プラン**（従量課金・無料枠あり／要クレカ登録）が必要です。
> 通常の個人利用なら無料枠にほぼ収まります。

---

## 0. 事前準備：Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## 1. Firebase を Blaze プランにする
[使用量と請求](https://console.firebase.google.com/project/study-app-92fc8/usage/details) →「プランを変更」→ **Blaze**。

## 2. Stripe のシークレットキーを登録
Stripe ダッシュボード（テストモード）→ 開発者 → APIキー → **シークレットキー**（`sk_test_...`）をコピー。
※ 以前貼った `pk_test_...`（公開鍵）とは別物です。`sk_` の方です。

```bash
cd "study App"
firebase functions:secrets:set STRIPE_SECRET_KEY
# → 貼り付けて Enter

# Webhook用は後で本物を入れる。まず仮の値でOK
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# → 仮に whsec_placeholder と入力して Enter
```

## 3. 関数とルールをデプロイ（WebhookのURLを取得）

```bash
firebase deploy --only functions,firestore:rules
```

完了後、関数URLが表示されます（控える）:
```
https://us-central1-study-app-92fc8.cloudfunctions.net/stripeWebhook
```

## 4. Stripe に Webhook を登録
Stripe ダッシュボード（テスト）→ 開発者 → **Webhook** → **エンドポイントを追加**
- **エンドポイントURL**：上の `stripeWebhook` のURL
- **イベントを選択**：
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- 作成後、**「署名シークレット」`whsec_...`** をコピー。

## 5. 本物の Webhook シークレットを登録して再デプロイ

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# → whsec_... を貼り付け

firebase deploy --only functions
```

## 6. 購入リンク（Payment Link）の確認
Stripe ダッシュボード → Payment Links → 該当リンク
- **料金が「継続（サブスク）」になっていること**（「解約するまで」を実現するため必須。買い切りだと解約判定ができません）
- 「支払い後」→ **顧客をリダイレクト** に設定：
  `https://mmm0115-sudo.github.io/Study-Browser-App/#/booster`
- ※ 購入者の特定はアプリ側が `client_reference_id`（あなたのuid）を自動付与するので設定不要です。

## 7. カスタマーポータルを有効化（解約ボタン用）
Stripe ダッシュボード → 設定 → 請求 → **カスタマーポータル** → 有効化して保存。
（アプリの「サブスクを管理・解約する」ボタンがこれを開きます）

---

## 動作確認
1. アプリ → 「ブースター」→「ブースターを購入する」
2. Stripe のテスト決済（カード番号 `4242 4242 4242 4242`／有効期限は未来／CVC任意）
3. 戻ってくると数秒で「**有効中**」に変わり、勉強で得るXPが**2倍**に
4. 「サブスクを管理・解約」→ 解約すると、Webhook経由で自動的に通常倍率へ戻る

## 仕組み（安全性）
- ブースターの有効/無効は **Cloud Functions（Admin権限）だけ**が書き込みます。
- Firestoreルールでクライアントからの `boosterActive` 改ざんを禁止しています。
- ただしスコア自体はクライアント計算のため、厳密な不正対策は別途サーバー集計が必要です（今後の拡張）。
