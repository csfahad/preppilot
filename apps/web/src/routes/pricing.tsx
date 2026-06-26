import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { useSubscriptionStore } from "@/stores/subscription";
import PublicHeader from "@/components/public-header";
import {
    IconCheck,
    IconX,
    IconSparkles,
    IconArrowLeft,
    IconClock,
    IconShieldCheck,
    IconCreditCard,
    IconChevronDown,
    IconPackage,
    IconStar,
    IconDiamond,
    IconGift,
    IconArrowRight,
} from "@tabler/icons-react";

export const Route = createFileRoute("/pricing")({
    component: PricingPage,
});

interface Pack {
    id: string;
    name: string;
    price: number;
    interviews: number;
    duration: number; // minutes
    description: string;
    perInterview: string;
    validity: string;
    features: { text: string; included: boolean }[];
    cta: string;
    popular: boolean;
    icon: typeof IconGift;
    accent: string;
    accentBg: string;
}

const PACKS: Pack[] = [
    {
        id: "free",
        name: "Free Tier",
        price: 0,
        interviews: 1,
        duration: 15,
        description: "Get a feel for AI interviews",
        perInterview: "Free",
        validity: "Forever",
        features: [
            { text: "1 free interview (15 min)", included: true },
            { text: "Basic feedback (score only)", included: true },
            { text: "Model answers", included: false },
            { text: "Detailed improvement tips", included: false },
            { text: "Priority support", included: false },
        ],
        cta: "Get Started Free",
        popular: false,
        icon: IconGift,
        accent: "text-zinc-400",
        accentBg: "bg-zinc-500/10",
    },
    {
        id: "mini",
        name: "Mini Pack",
        price: 2499,
        interviews: 3,
        duration: 15,
        description: "Quick practice sessions",
        perInterview: "\u20B9833/interview",
        validity: "6 months",
        features: [
            { text: "3 interviews × 15 min each", included: true },
            { text: "Full AI scoring", included: true },
            { text: "Model answers included", included: true },
            { text: "Detailed improvement tips", included: false },
            { text: "Priority support", included: false },
        ],
        cta: "Buy Mini Pack",
        popular: false,
        icon: IconPackage,
        accent: "text-blue-400",
        accentBg: "bg-blue-500/10",
    },
    {
        id: "standard",
        name: "Standard Pack",
        price: 9999,
        interviews: 5,
        duration: 30,
        description: "For serious job seekers",
        perInterview: "\u20B92,000/interview",
        validity: "6 months",
        features: [
            { text: "5 interviews × 30 min each", included: true },
            { text: "Full AI scoring + detailed feedback", included: true },
            { text: "Model answers included", included: true },
            { text: "Improvement tips & action items", included: true },
            { text: "Priority support", included: false },
        ],
        cta: "Buy Standard Pack",
        popular: true,
        icon: IconStar,
        accent: "text-primary",
        accentBg: "bg-primary/10",
    },
    {
        id: "premium",
        name: "Premium Pack",
        price: 19999,
        interviews: 10,
        duration: 45,
        description: "For maximum confidence",
        perInterview: "\u20B92,000/interview",
        validity: "6 months",
        features: [
            { text: "10 interviews × 45 min each", included: true },
            { text: "Full AI scoring + detailed feedback", included: true },
            { text: "Model answers included", included: true },
            { text: "Improvement tips & action items", included: true },
            { text: "Priority support", included: true },
        ],
        cta: "Buy Premium Pack",
        popular: false,
        icon: IconDiamond,
        accent: "text-amber-400",
        accentBg: "bg-amber-500/10",
    },
];

const COMPARISON_ROWS = [
    {
        feature: "Interviews included",
        free: "1",
        mini: "3",
        standard: "5",
        premium: "10",
    },
    {
        feature: "Duration per interview",
        free: "15 min",
        mini: "15 min",
        standard: "30 min",
        premium: "45 min",
    },
    {
        feature: "AI scoring",
        free: "Basic",
        mini: "Full",
        standard: "Full",
        premium: "Full",
    },
    {
        feature: "Model answers",
        free: false,
        mini: true,
        standard: true,
        premium: true,
    },
    {
        feature: "Detailed feedback",
        free: false,
        mini: false,
        standard: true,
        premium: true,
    },
    {
        feature: "Improvement tips",
        free: false,
        mini: false,
        standard: true,
        premium: true,
    },
    {
        feature: "Priority support",
        free: false,
        mini: false,
        standard: false,
        premium: true,
    },
    {
        feature: "Validity",
        free: "Forever",
        mini: "6 months",
        standard: "6 months",
        premium: "6 months",
    },
];

const FAQS = [
    {
        q: "What happens when my credits expire?",
        a: "Unused interview credits expire after 6 months from the date of purchase. Your completed interview results and feedback remain accessible forever — you'll only lose the ability to start new interviews with expired credits.",
    },
    {
        q: "Can I buy multiple packs?",
        a: "You can buy another pack only after your active credits are used or expired. PrepPilot does not stack new packs on top of an active pack, and pro-rata upgrades or downgrades are not supported.",
    },
    {
        q: "What payment methods do you accept?",
        a: "We use Razorpay for secure payments, supporting UPI, credit/debit cards, net banking, and popular wallets like Paytm and PhonePe. All transactions are encrypted and PCI-DSS compliant.",
    },
    {
        q: "Can I get a refund?",
        a: "We offer a full refund within 24 hours of purchase if you haven't used any credits from the pack. After using even one credit, refunds are prorated based on remaining unused credits. Contact support@preppilot.ai for assistance.",
    },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
    const [open, setOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="border border-border rounded-2xl overflow-hidden"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-accent/50 transition-colors"
            >
                <span className="font-heading font-semibold text-foreground text-[15px] pr-4">
                    {q}
                </span>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                >
                    <IconChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
            </button>
            <motion.div
                initial={false}
                animate={{
                    height: open ? "auto" : 0,
                    opacity: open ? 1 : 0,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {a}
                </p>
            </motion.div>
        </motion.div>
    );
}

function PricingPage() {
    const { data: session, isPending } = useSession();
    const [loadingPack, setLoadingPack] = useState<string | null>(null);
    const { plan: currentPlan, fetchPlan, hasFetched } = useSubscriptionStore();

    useEffect(() => {
        if (session?.user) {
            fetchPlan();
        }
    }, [session, fetchPlan]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    const handlePurchase = async (packId: string) => {
        if (packId === "free") return;
        if (!session) {
            window.location.href = "/auth/login";
            return;
        }

        setLoadingPack(packId);
        try {
            const res = await api.purchasePack(packId);
            const { orderId, razorpayKeyId, userEmail, packLabel } = res.data;

            const isDev = import.meta.env.DEV;

            const options = {
                key: razorpayKeyId,
                order_id: orderId,
                name: "PrepPilot",
                description: packLabel,
                prefill: {
                    email: userEmail,
                },
                handler: async (response: any) => {
                    if (isDev) {
                        await api.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            packType: packId,
                        });
                        await fetchPlan();
                        window.location.href = "/dashboard";
                    } else {
                        // Production: webhook handles activation.
                        // Poll until credits appear, then redirect.
                        const maxAttempts = 15;
                        const pollInterval = 2000; // 2 seconds

                        for (let i = 0; i < maxAttempts; i++) {
                            await new Promise((r) =>
                                setTimeout(r, pollInterval),
                            );
                            const planRes = await api.getUserPlan();
                            if (planRes.data && planRes.data.plan !== "free") {
                                break;
                            }
                        }

                        await fetchPlan();
                        window.location.href = "/dashboard";
                    }
                },
                theme: { color: "#65a30d" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Purchase error:", err);
        } finally {
            setLoadingPack(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {session ? (
                <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <IconArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            ) : (
                <PublicHeader />
            )}
            <script src="https://checkout.razorpay.com/v1/checkout.js" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
                        <IconCreditCard className="w-4 h-4" />
                        Pay per pack — no subscriptions
                    </div>
                    <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                        Interview packs for{" "}
                        <span className="text-primary">every stage</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                        Buy credits, practice at your pace. No recurring
                        charges, no surprises — just focused interview prep.
                    </p>
                </motion.div>

                {/* Pack Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border rounded-2xl overflow-hidden bg-card">
                    {PACKS.map((pack, i) => (
                        <motion.div
                            key={pack.id}
                            initial={{ opacity: 0, y: 28 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.15 + i * 0.1,
                                duration: 0.5,
                                ease: "easeOut",
                            }}
                            className={`relative flex flex-col ${
                                i < PACKS.length - 1
                                    ? "border-b lg:border-b-0 lg:border-r border-border"
                                    : ""
                            }`}
                        >
                            {/* Popular banner */}
                            {pack.popular ? (
                                <div className="bg-primary px-4 py-2 flex items-center justify-center gap-1.5 text-primary-foreground text-xs font-bold tracking-wide uppercase">
                                    <IconSparkles className="w-3.5 h-3.5" />
                                    Popular
                                </div>
                            ) : (
                                <div className="h-[33px]" />
                            )}

                            {/* Card top */}
                            <div className="px-6 pt-5 pb-5">
                                {/* Plan name */}
                                <h3 className="font-heading text-base font-semibold text-foreground tracking-tight">
                                    {pack.name}
                                </h3>

                                {/* Price */}
                                <div className="mt-3 mb-1">
                                    <span className="font-heading text-[2.5rem] font-bold text-foreground leading-none tracking-tight">
                                        {pack.price === 0
                                            ? "₹0"
                                            : `₹${pack.price.toLocaleString("en-IN")}`}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground min-h-[20px]">
                                    {pack.description}
                                </p>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => handlePurchase(pack.id)}
                                disabled={
                                    loadingPack === pack.id ||
                                    (pack.id === "free" &&
                                        hasFetched &&
                                        currentPlan !== "free") ||
                                    (!hasFetched && !!session)
                                }
                                className={`w-full py-3 font-medium text-sm transition-all cursor-pointer flex items-center justify-between px-6 border-y ${
                                    pack.popular
                                        ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                                        : "border-border text-foreground hover:bg-accent"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <span>
                                    {loadingPack === pack.id
                                        ? "Processing..."
                                        : !hasFetched && session
                                          ? "Loading..."
                                          : pack.id === "free" &&
                                              hasFetched &&
                                              currentPlan !== "free"
                                            ? "Included"
                                            : pack.cta}
                                </span>
                                <IconArrowRight className="w-4 h-4" />
                            </button>

                            {/* Features */}
                            <div className="px-6 pt-5 pb-6 flex-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    What&apos;s included
                                </p>
                                <ul className="space-y-2.5">
                                    {pack.features.map((f) => (
                                        <li
                                            key={f.text}
                                            className="flex items-start gap-2 text-sm"
                                        >
                                            {f.included ? (
                                                <IconCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            ) : (
                                                <IconX className="w-4 h-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                                            )}
                                            <span
                                                className={
                                                    f.included
                                                        ? "text-foreground"
                                                        : "text-muted-foreground/50"
                                                }
                                            >
                                                {f.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
                >
                    <span className="flex items-center gap-1.5">
                        <IconShieldCheck className="w-4 h-4 text-primary" />
                        Secure Razorpay checkout
                    </span>
                    <span className="flex items-center gap-1.5">
                        <IconCreditCard className="w-4 h-4 text-primary" />
                        UPI, cards & net banking
                    </span>
                    <span className="flex items-center gap-1.5">
                        <IconClock className="w-4 h-4 text-primary" />
                        Instant access after payment
                    </span>
                </motion.div>

                {/* Comparison Table */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-24"
                >
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
                        Compare packs side by side
                    </h2>
                    <p className="text-muted-foreground text-center mb-10 max-w-md mx-auto">
                        See exactly what you get with each pack
                    </p>

                    <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full min-w-[640px] border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-4 pr-4 text-sm font-medium text-muted-foreground w-[200px]">
                                        Feature
                                    </th>
                                    {PACKS.map((p) => (
                                        <th
                                            key={p.id}
                                            className={`text-center py-4 px-3 text-sm font-semibold ${
                                                p.popular
                                                    ? "text-primary"
                                                    : "text-foreground"
                                            }`}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{p.name}</span>
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {p.price === 0
                                                        ? "Free"
                                                        : `₹${p.price.toLocaleString("en-IN")}`}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON_ROWS.map((row, i) => (
                                    <tr
                                        key={row.feature}
                                        className={`border-b border-border/50 ${
                                            i % 2 === 0 ? "bg-muted/20" : ""
                                        }`}
                                    >
                                        <td className="py-3.5 pr-4 text-sm text-foreground font-medium">
                                            {row.feature}
                                        </td>
                                        {(
                                            [
                                                "free",
                                                "mini",
                                                "standard",
                                                "premium",
                                            ] as const
                                        ).map((col) => {
                                            const val = row[col];
                                            return (
                                                <td
                                                    key={col}
                                                    className={`text-center py-3.5 px-3 text-sm ${
                                                        col === "standard"
                                                            ? "bg-primary/3"
                                                            : ""
                                                    }`}
                                                >
                                                    {typeof val ===
                                                    "boolean" ? (
                                                        val ? (
                                                            <IconCheck className="w-4 h-4 text-green-500 mx-auto" />
                                                        ) : (
                                                            <IconX className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                                                        )
                                                    ) : (
                                                        <span className="text-foreground">
                                                            {val}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* FAQ */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-24 mb-8"
                >
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
                        Frequently asked questions
                    </h2>
                    <p className="text-muted-foreground text-center mb-10 max-w-md mx-auto">
                        Got questions? We've got answers.
                    </p>

                    <div className="max-w-2xl mx-auto space-y-3">
                        {FAQS.map((faq, i) => (
                            <FaqItem
                                key={faq.q}
                                q={faq.q}
                                a={faq.a}
                                index={i}
                            />
                        ))}
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
