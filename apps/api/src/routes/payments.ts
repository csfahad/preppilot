import { Router, type Request } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    createPackOrder,
    verifyPaymentSignature,
    activatePackPurchase,
    handleWebhook,
    getUserSubscription,
    getUserCredits,
    consumeCredit,
} from "../services/payment.service.js";
import crypto from "crypto";

const router = Router();

// create a pack purchase order
router.post("/create-pack-order", requireAuth, async (req, res) => {
    try {
        const { packType } = req.body;

        if (!packType || !["mini", "standard", "premium"].includes(packType)) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message:
                        "Valid packType required (mini, standard, or premium)",
                },
            });
            return;
        }

        const result = await createPackOrder(
            req.user!.id,
            packType,
            req.user!.email,
        );
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("[Payments] Error creating pack order:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create order",
            },
        });
    }
});

// Legacy subscription endpoint - redirects to pack flow
router.post("/create-subscription", requireAuth, async (req, res) => {
    try {
        const { planId } = req.body;
        // map old plan IDs to new pack types
        const packMap: Record<string, string> = {
            mini_pack: "mini",
            standard_pack: "standard",
            premium_pack: "premium",
        };
        const packType = packMap[planId]!;
        const result = await createPackOrder(
            req.user!.id,
            packType,
            req.user!.email,
        );
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("[Payments] Error creating order:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create order",
            },
        });
    }
});

router.post("/verify", requireAuth, async (req, res) => {
    try {
        const isDev = process.env.NODE_ENV !== "production";

        if (!isDev) {
            res.json({
                success: true,
                data: { message: "Payment is being processed via webhook" },
            });
            return;
        }

        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            packType,
        } = req.body;

        if (!packType || !["mini", "standard", "premium"].includes(packType)) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message:
                        "Valid packType required (mini, standard, or premium)",
                },
            });
            return;
        }

        const isValid = await verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        );

        if (!isValid) {
            res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_SIGNATURE",
                    message: "Payment verification failed",
                },
            });
            return;
        }

        await activatePackPurchase(
            razorpayOrderId,
            razorpayPaymentId,
            packType,
            req.user!.id,
        );

        res.json({ success: true, data: { packType } });
    } catch (error) {
        console.error("[Payments] Error verifying payment:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to verify payment",
            },
        });
    }
});

// razorpay webhook handler
router.post("/webhook", async (req: Request, res) => {
    try {
        // verify webhook signature using the raw body buffer
        // (index.ts stores it via the express.json verify callback)
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const signature = req.headers["x-razorpay-signature"] as string;

        const rawBody = (req as any).rawBody as Buffer;
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        if (signature !== expectedSignature) {
            res.status(400).json({ error: "Invalid webhook signature" });
            return;
        }

        const event = req.body.event;
        await handleWebhook(event, req.body.payload);

        res.json({ success: true });
    } catch (error) {
        console.error("[Payments] Webhook error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
});

// get current subscription
router.get("/subscription", requireAuth, async (req, res) => {
    try {
        const subscription = await getUserSubscription(req.user!.id);
        res.json({ success: true, data: subscription });
    } catch (error) {
        console.error("[Payments] Error fetching subscription:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to fetch subscription",
            },
        });
    }
});

// get user credits
router.get("/credits", requireAuth, async (req, res) => {
    try {
        const credits = await getUserCredits(req.user!.id);
        res.json({ success: true, data: credits });
    } catch (error) {
        console.error("[Payments] Error fetching credits:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to fetch credits",
            },
        });
    }
});

// consume a credit (called before starting an interview)
router.post("/consume-credit", requireAuth, async (req, res) => {
    try {
        const consumed = await consumeCredit(req.user!.id);
        if (!consumed) {
            res.status(403).json({
                success: false,
                error: {
                    code: "NO_CREDITS",
                    message:
                        "You have no interview credits remaining. Purchase a pack to continue.",
                },
            });
            return;
        }
        res.json({ success: true });
    } catch (error) {
        console.error("[Payments] Error consuming credit:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to consume credit",
            },
        });
    }
});

export default router;
