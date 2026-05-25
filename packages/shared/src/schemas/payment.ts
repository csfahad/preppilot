import { z } from "zod/v4";

export const createSubscriptionSchema = z.object({
    planId: z.enum(["pro_monthly", "pro_annual", "pay_per_interview"]),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const verifyPaymentSchema = z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
