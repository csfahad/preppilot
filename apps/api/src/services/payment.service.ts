import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../db/index.js";
import { subscriptions, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { UserPlan } from "@repo/shared/constants/taxonomy";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_MAP: Record<string, string> = {
    pro_monthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY!,
    pro_annual: process.env.RAZORPAY_PLAN_PRO_ANNUAL!,
};

export async function createSubscription(userId: string, planId: string) {
    const razorpayPlanId = PLAN_MAP[planId];
    if (!razorpayPlanId) throw new Error(`Unknown plan: ${planId}`);

    // create subscription in Razorpay
    const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: 1,
        customer_notify: 1,
        notes: {
            service: "preppilot",
        },
    });

    // save pending subscription
    await db.insert(subscriptions).values({
        userId,
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId,
        plan: planId as any,
        status: "pending",
    });

    return {
        subscriptionId: subscription.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID!,
    };
}

export async function verifyPaymentSignature(
    razorpaySubscriptionId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
): Promise<boolean> {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${razorpayPaymentId}|${razorpaySubscriptionId}`);
    const generatedSignature = hmac.digest("hex");

    return generatedSignature === razorpaySignature;
}

export async function activateSubscription(razorpaySubscriptionId: string) {
    const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
        .limit(1);

    if (!sub) throw new Error("Subscription not found");

    // activate subscription
    const now = new Date();
    const periodEnd = new Date(now);
    if (sub.plan === "pro_annual") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await db
        .update(subscriptions)
        .set({
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

    // update user plan
    await db
        .update(users)
        .set({ plan: sub.plan, updatedAt: now })
        .where(eq(users.id, sub.userId));

    return sub;
}

export async function handleWebhook(event: string, payload: any) {
    switch (event) {
        case "subscription.charged": {
            const subId = payload.subscription?.entity?.id;
            if (subId) {
                await db
                    .update(subscriptions)
                    .set({ status: "active", updatedAt: new Date() })
                    .where(eq(subscriptions.razorpaySubscriptionId, subId));
            }
            break;
        }
        case "subscription.cancelled": {
            const subId = payload.subscription?.entity?.id;
            if (subId) {
                await db
                    .update(subscriptions)
                    .set({ status: "cancelled", updatedAt: new Date() })
                    .where(eq(subscriptions.razorpaySubscriptionId, subId));

                // downgrade user to free
                const [sub] = await db
                    .select()
                    .from(subscriptions)
                    .where(eq(subscriptions.razorpaySubscriptionId, subId));

                if (sub) {
                    await db
                        .update(users)
                        .set({ plan: "free", updatedAt: new Date() })
                        .where(eq(users.id, sub.userId));
                }
            }
            break;
        }
        case "subscription.completed": {
            const subId = payload.subscription?.entity?.id;
            if (subId) {
                await db
                    .update(subscriptions)
                    .set({ status: "expired", updatedAt: new Date() })
                    .where(eq(subscriptions.razorpaySubscriptionId, subId));
            }
            break;
        }
    }
}

export async function getUserSubscription(userId: string) {
    const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(subscriptions.createdAt)
        .limit(1);

    return sub ?? null;
}
