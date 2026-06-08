import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { useSubscriptionStore } from "@/stores/subscription";
import Header from "@/components/header";
import PublicHeader from "@/components/public-header";
import {
    IconCheck,
    IconX,
    IconCrown,
    IconSparkles,
    IconMicrophone,
    IconChartBar,
} from "@tabler/icons-react";

export const Route = createFileRoute("/pricing")({
    component: PricingPage,
});

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: "₹0",
        period: "forever",
        description: "Get a feel for AI interviews",
        features: [
            { text: "3 mock interviews", included: true },
            { text: "Text mode only", included: true },
            { text: "Basic feedback (score only)", included: true },
            { text: "Voice interviews", included: false },
            { text: "Model answers", included: false },
            { text: "Full feedback & tips", included: false },
            { text: "Priority support", included: false },
        ],
        cta: "Current Plan",
        popular: false,
    },
    {
        id: "pro_monthly",
        name: "Pro Monthly",
        price: "₹499",
        period: "/month",
        description: "For serious job seekers",
        features: [
            { text: "Unlimited interviews", included: true },
            { text: "Text + Voice mode", included: true },
            { text: "Full AI feedback & scoring", included: true },
            { text: "6 regional voice accents", included: true },
            { text: "Model answers for every question", included: true },
            { text: "Improvement tips & action items", included: true },
            { text: "Priority support", included: true },
        ],
        cta: "Upgrade to Pro",
        popular: true,
    },
    {
        id: "pro_annual",
        name: "Pro Annual",
        price: "₹3,999",
        period: "/year",
        description: "Best value — save 33%",
        features: [
            { text: "Everything in Pro Monthly", included: true },
            { text: "Save ₹1,989/year", included: true },
            { text: "Early access to new features", included: true },
            { text: "Resume parsing & analysis", included: true },
            { text: "Shareable scorecards", included: true },
            { text: "Performance analytics", included: true },
            { text: "Priority support", included: true },
        ],
        cta: "Upgrade to Annual",
        popular: false,
    },
];

function PricingPage() {
    const { data: session } = useSession();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const { plan: currentPlan, fetchPlan } = useSubscriptionStore();

    const handleSubscribe = async (planId: string) => {
        if (planId === "free") return;
        if (!session) {
            window.location.href = "/auth/login";
            return;
        }

        setLoadingPlan(planId);
        try {
            const res = await api.createSubscription(planId);
            const { orderId, razorpayKeyId, userEmail, planLabel } = res.data;

            const options = {
                key: razorpayKeyId,
                order_id: orderId,
                name: "PrepPilot",
                description: planLabel,
                prefill: {
                    email: userEmail,
                },
                handler: async (response: any) => {
                    await api.verifyPayment({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                    });
                    await fetchPlan();
                    window.location.href = "/dashboard";
                },
                theme: { color: "#65a30d" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Subscription error:", err);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {session ? <Header /> : <PublicHeader />}
            <script src="https://checkout.razorpay.com/v1/checkout.js" />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
                        Choose your plan
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                        Start free, upgrade when you're ready to get serious
                        about interview prep
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative rounded-2xl border p-8 flex flex-col ${
                                plan.popular
                                    ? "border-primary bg-card shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                                    : "border-border bg-card"
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1">
                                    <IconSparkles className="w-3 h-3" /> Most
                                    Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="font-heading text-xl font-semibold text-foreground">
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-6">
                                <span className="font-heading text-4xl font-bold text-foreground">
                                    {plan.price}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    {plan.period}
                                </span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature.text}
                                        className="flex items-start gap-2.5 text-sm"
                                    >
                                        {feature.included ? (
                                            <IconCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <IconX className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                                        )}
                                        <span
                                            className={
                                                feature.included
                                                    ? "text-foreground"
                                                    : "text-muted-foreground/60"
                                            }
                                        >
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={
                                    plan.id === "free" ||
                                    plan.id === currentPlan ||
                                    (currentPlan !== "free" &&
                                        plan.id !== "free") ||
                                    loadingPlan === plan.id
                                }
                                className={`w-full py-3 rounded-xl font-medium transition-all cursor-pointer ${
                                    plan.id === currentPlan
                                        ? "bg-muted text-muted-foreground cursor-default"
                                        : plan.popular
                                          ? "bg-primary text-primary-foreground hover:opacity-90"
                                          : plan.id === "free"
                                            ? "bg-muted text-muted-foreground cursor-default"
                                            : "border border-border text-foreground hover:bg-accent"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loadingPlan === plan.id
                                    ? "Processing..."
                                    : plan.id === currentPlan
                                      ? "Current Plan"
                                      : plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center space-y-4"
                >
                    <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <IconCrown className="w-4 h-4 text-primary" />{" "}
                            Cancel anytime
                        </span>
                        <span className="flex items-center gap-1.5">
                            <IconMicrophone className="w-4 h-4 text-primary" />{" "}
                            6 voice accents
                        </span>
                        <span className="flex items-center gap-1.5">
                            <IconChartBar className="w-4 h-4 text-primary" />{" "}
                            Instant feedback
                        </span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
