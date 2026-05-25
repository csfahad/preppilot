ALTER TABLE "subscriptions" RENAME COLUMN "razorpay_subscription_id" TO "razorpay_order_id";
ALTER TABLE "subscriptions" RENAME COLUMN "razorpay_plan_id" TO "razorpay_payment_id";