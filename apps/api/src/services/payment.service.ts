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

const PLAN_PRICES: Record<string, { amount: number; label: string }> = {
    pro_monthly: { amount: 49900, label: "Pro Monthly Plan" },
    pro_annual: { amount: 399900, label: "Pro Annual Plan" },
};

export async function createOrder(
    userId: string,
    planId: string,
    userEmail: string,
) {
    const plan = PLAN_PRICES[planId];
    if (!plan) throw new Error(`Unknown plan: ${planId}`);

    // create order in Razorpay
    const order = await razorpay.orders.create({
        amount: plan.amount,
        currency: "INR",
        receipt: `${planId.slice(0, 7)}_${userId.slice(-8)}_${Date.now()}`,
        notes: {
            service: "preppilot",
            plan_id: planId,
            user_id: userId,
            user_email: userEmail,
        },
    });

    // save pending subscription record
    await db.insert(subscriptions).values({
        userId,
        razorpayOrderId: order.id,
        plan: planId as any,
        status: "pending",
    });

    return {
        orderId: order.id,
        amount: plan.amount,
        currency: "INR",
        razorpayKeyId: process.env.RAZORPAY_KEY_ID!,
        userEmail,
        planLabel: plan.label,
    };
}

export async function verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
): Promise<boolean> {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");

    return generatedSignature === razorpaySignature;
}

export async function activateSubscription(
    razorpayOrderId: string,
    razorpayPaymentId: string,
) {
    const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.razorpayOrderId, razorpayOrderId))
        .limit(1);

    if (!sub) throw new Error("Subscription not found");

    // activate subscription with correct period
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
            razorpayPaymentId,
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
        case "payment.captured": {
            const payment = payload.payment?.entity;
            const orderId = payment?.order_id;
            if (orderId) {
                const [sub] = await db
                    .select()
                    .from(subscriptions)
                    .where(eq(subscriptions.razorpayOrderId, orderId))
                    .limit(1);

                if (sub && sub.status === "pending") {
                    await activateSubscription(orderId, payment.id);
                }
            }
            break;
        }
        case "payment.failed": {
            const payment = payload.payment?.entity;
            const orderId = payment?.order_id;
            if (orderId) {
                await db
                    .update(subscriptions)
                    .set({ status: "cancelled", updatedAt: new Date() })
                    .where(eq(subscriptions.razorpayOrderId, orderId));
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
