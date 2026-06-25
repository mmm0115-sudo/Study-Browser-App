/**
 * StudyQuest Cloud Functions
 *
 * Stripe の「XPブースター」サブスクを扱う:
 *  - stripeWebhook: Stripe からのイベントを受け取り、契約状態を Firestore に反映
 *  - createBillingPortal: 解約・支払い管理用のポータルURLを発行（ログインユーザー向け）
 *
 * 必要なシークレット（firebase functions:secrets:set で設定）:
 *  - STRIPE_SECRET_KEY      … Stripe のシークレットキー（sk_test_... / sk_live_...）
 *  - STRIPE_WEBHOOK_SECRET  … Webhook 署名シークレット（whsec_...）
 */
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2";
import admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

/** ブースター中のXP倍率 */
const BOOSTER_MULTIPLIER = 2;

function stripeClient(): Stripe {
  return new Stripe(STRIPE_SECRET_KEY.value());
}

/** 契約状態(status)から boosterActive を判定して該当ユーザーに書き込む */
async function applyBoosterStatus(uid: string, status: string): Promise<void> {
  const active = status === "active" || status === "trialing";
  await db.doc(`users/${uid}`).set(
    {
      boosterActive: active,
      boosterMultiplier: active ? BOOSTER_MULTIPLIER : 1,
      boosterStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Stripe顧客ID → uid を逆引き */
async function uidForCustomer(customerId: string): Promise<string | null> {
  const snap = await db.doc(`stripeCustomers/${customerId}`).get();
  return snap.exists ? ((snap.data()?.uid as string) ?? null) : null;
}

/** Stripe Webhook 受信エンドポイント */
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe = stripeClient();
    const signature = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature as string,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error("署名検証に失敗", err);
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const uid = session.client_reference_id;
          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          if (uid && customerId) {
            // uid ↔ customer の対応を保存
            await db.doc(`users/${uid}`).set(
              { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId ?? null },
              { merge: true }
            );
            await db.doc(`stripeCustomers/${customerId}`).set({ uid }, { merge: true });

            // 契約状態を反映
            if (subscriptionId) {
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              await applyBoosterStatus(uid, sub.status);
            } else {
              await applyBoosterStatus(uid, "active");
            }
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const uid = await uidForCustomer(customerId);
          if (uid) {
            const status =
              event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
            await applyBoosterStatus(uid, status);
          }
          break;
        }

        default:
          // 他のイベントは無視
          break;
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webデータ処理でエラー", err);
      res.status(500).send("handler error");
    }
  }
);

/** 解約・支払い方法変更用の Stripe カスタマーポータルURLを発行 */
export const createBillingPortal = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "ログインが必要です。");
    }
    const uid = request.auth.uid;
    const userSnap = await db.doc(`users/${uid}`).get();
    const customerId = userSnap.data()?.stripeCustomerId as string | undefined;
    if (!customerId) {
      throw new HttpsError("failed-precondition", "サブスク情報が見つかりません。");
    }

    const returnUrl =
      (request.data?.returnUrl as string | undefined) ??
      "https://mmm0115-sudo.github.io/Study-Browser-App/";

    const stripe = stripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: portal.url };
  }
);
