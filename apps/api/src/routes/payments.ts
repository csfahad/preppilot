import { Router, type Request } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    createOrder,
    verifyPaymentSignature,
    activateSubscription,
    handleWebhook,
    getUserSubscription,
} from "../services/payment.service.js";
import crypto from "crypto";

const router = Router();

router.post("/create-subscription", requireAuth, async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId || !["pro_monthly", "pro_annual"].includes(planId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message:
                        "Valid planId required (pro_monthly or pro_annual)",
                },
            });
            return;
        }

        const result = await createOrder(req.user!.id, planId, req.user!.email);
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

// verify razorpay checkout signature
router.post("/verify", requireAuth, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
            req.body;

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

        const subscription = await activateSubscription(
            razorpayOrderId,
            razorpayPaymentId,
        );
        res.json({ success: true, data: subscription });
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
        // verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const signature = req.headers["x-razorpay-signature"] as string;

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(JSON.stringify(req.body))
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

export default router;
