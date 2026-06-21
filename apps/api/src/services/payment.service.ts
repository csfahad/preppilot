import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../db/index.js";
import { subscriptions, users, interviewCredits } from "../db/schema.js";
import { eq, desc, and, gt, sql } from "drizzle-orm";
import type { UserPlan } from "@repo/shared/constants/taxonomy";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PACK_PRICES: Record<
    string,
    {
        amount: number;
        label: string;
        credits: number;
        durationMinutes: number;
        plan: UserPlan;
    }
> = {
    mini: {
        amount: 249900,
        label: "Mini Pack — 3 × 15min",
        credits: 3,
        durationMinutes: 15,
        plan: "mini_pack",
    },
    standard: {
        amount: 999900,
        label: "Standard Pack — 5 × 30min",
        credits: 5,
        durationMinutes: 30,
        plan: "standard_pack",
    },
    premium: {
        amount: 1999900,
        label: "Premium Pack — 10 × 45min",
        credits: 10,
        durationMinutes: 45,
        plan: "premium_pack",
    },
};

export async function createPackOrder(
    userId: string,
    packType: string,
    userEmail: string,
) {
    const pack = PACK_PRICES[packType];
    if (!pack) throw new Error(`Unknown pack type: ${packType}`);

    const order = await razorpay.orders.create({
        amount: pack.amount,
        currency: "INR",
        receipt: `pack_${packType}_${userId.slice(-8)}_${Date.now()}`,
        notes: {
            service: "preppilot",
            pack_type: packType,
            user_id: userId,
            user_email: userEmail,
        },
    });

    // create a pending subscription record so webhooks can find it later
    await db.insert(subscriptions).values({
        userId,
        razorpayOrderId: order.id,
        plan: pack.plan,
        status: "pending",
    });

    return {
        orderId: order.id,
        amount: pack.amount,
        currency: "INR",
        razorpayKeyId: process.env.RAZORPAY_KEY_ID!,
        userEmail,
        packLabel: pack.label,
        packType,
    };
}

// Legacy: keep createOrder for backward compat during migration
export async function createOrder(
    userId: string,
    planId: string,
    userEmail: string,
) {
    return createPackOrder(userId, planId, userEmail);
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

export async function activatePackPurchase(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    packType: string,
    userId: string,
) {
    const pack = PACK_PRICES[packType];
    if (!pack) throw new Error(`Unknown pack type: ${packType}`);

    // check if already activated (idempotency guard)
    const [existing] = await db
        .select()
        .from(subscriptions)
        .where(
            and(
                eq(subscriptions.razorpayOrderId, razorpayOrderId),
                eq(subscriptions.status, "active"),
            ),
        )
        .limit(1);

    if (existing) {
        console.log(
            `[Payments] Order ${razorpayOrderId} already activated, skipping`,
        );
        return;
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 6); // 6-month validity

    // insert credits
    await db.insert(interviewCredits).values({
        userId,
        packType: packType as "mini" | "standard" | "premium",
        totalCredits: pack.credits,
        usedCredits: 0,
        durationMinutes: pack.durationMinutes,
        razorpayOrderId,
        razorpayPaymentId,
        expiresAt,
    });

    // update the pending subscription record to active
    const updated = await db
        .update(subscriptions)
        .set({
            razorpayPaymentId,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
            updatedAt: now,
        })
        .where(
            and(
                eq(subscriptions.razorpayOrderId, razorpayOrderId),
                eq(subscriptions.status, "pending"),
            ),
        )
        .returning();

    // if no pending record was found (shouldn't happen, but safety net)
    if (updated.length === 0) {
        await db.insert(subscriptions).values({
            userId,
            razorpayOrderId,
            razorpayPaymentId,
            plan: pack.plan,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
        });
    }

    // update user plan to the highest active pack
    await db
        .update(users)
        .set({ plan: pack.plan, updatedAt: now })
        .where(eq(users.id, userId));
}

export async function handleWebhook(event: string, payload: any) {
    switch (event) {
        case "payment.captured": {
            const payment = payload.payment?.entity;
            const orderId = payment?.order_id;
            if (!orderId) break;

            // look up the pending subscription created at order time
            const [sub] = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.razorpayOrderId, orderId),
                        eq(subscriptions.status, "pending"),
                    ),
                )
                .limit(1);

            if (!sub) {
                // already activated (by /verify in dev, or duplicate webhook)
                console.log(
                    `[Payments] Webhook: no pending subscription for order ${orderId}, skipping`,
                );
                break;
            }

            // determine pack type from the subscription plan
            const packMap: Record<string, string> = {
                mini_pack: "mini",
                standard_pack: "standard",
                premium_pack: "premium",
            };
            const packType = packMap[sub.plan];
            if (!packType) {
                console.error(
                    `[Payments] Webhook: unknown plan '${sub.plan}' for order ${orderId}`,
                );
                break;
            }

            await activatePackPurchase(
                orderId,
                payment.id,
                packType,
                sub.userId,
            );
            console.log(
                `[Payments] Webhook: activated ${packType} pack for order ${orderId}`,
            );
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
                console.log(
                    `[Payments] Webhook: marked order ${orderId} as cancelled`,
                );
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
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

    return sub ?? null;
}

export async function getUserCredits(userId: string) {
    const now = new Date();

    const credits = await db
        .select()
        .from(interviewCredits)
        .where(
            and(
                eq(interviewCredits.userId, userId),
                gt(
                    sql`${interviewCredits.totalCredits} - ${interviewCredits.usedCredits}`,
                    0,
                ),
            ),
        )
        .orderBy(desc(interviewCredits.purchasedAt));

    // filter out expired
    const activeCredits = credits.filter(
        (c) => !c.expiresAt || c.expiresAt > now,
    );

    const totalRemaining = activeCredits.reduce(
        (sum, c) => sum + (c.totalCredits - c.usedCredits),
        0,
    );

    return {
        packs: activeCredits,
        totalRemaining,
    };
}

export async function consumeCredit(userId: string): Promise<boolean> {
    const { packs } = await getUserCredits(userId);

    // use oldest pack first (FIFO)
    const pack = packs[packs.length - 1];
    if (!pack) return false;

    await db
        .update(interviewCredits)
        .set({ usedCredits: pack.usedCredits + 1 })
        .where(eq(interviewCredits.id, pack.id));

    return true;
}
