import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { getPlanFullLabel } from "@/lib/plans";
import { useSubscriptionStore } from "@/stores/subscription";
import { AppLoader } from "@/components/app-loader";
import {
    IconArrowLeft,
    IconArrowRight,
    IconCalendar,
    IconCheck,
    IconClock,
    IconCreditCard,
    IconMail,
    IconPhone,
    IconReceipt,
    IconRefresh,
    IconShieldCheck,
    IconUser,
    IconX,
} from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/billing/")({
    component: BillingPage,
});

type CreditPack = {
    id: string;
    packType: "mini" | "standard" | "premium";
    totalCredits: number;
    usedCredits: number;
    durationMinutes: number;
    razorpayPaymentId?: string | null;
    purchasedAt: string;
    expiresAt: string | null;
};

type Subscription = {
    plan: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    razorpayOrderId?: string;
    razorpayPaymentId?: string | null;
    billingContact?: {
        email?: string | null;
        contact?: string | null;
        method?: string | null;
        amount?: number | null;
    } | null;
};

const RENEWAL_PACKS = [
    {
        id: "mini",
        name: "Mini",
        detail: "3 interviews · 15 min",
        price: "₹2,499",
    },
    {
        id: "standard",
        name: "Standard",
        detail: "5 interviews · 30 min",
        price: "₹9,999",
    },
    {
        id: "premium",
        name: "Premium",
        detail: "10 interviews · 45 min",
        price: "₹19,999",
    },
];

function formatDate(value?: string | null) {
    if (!value) return "Not available";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(value?: string | null) {
    if (!value) return "Not available";
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function BillingPage() {
    const { data: session } = useSession();
    const { fetchPlan } = useSubscriptionStore();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [credits, setCredits] = useState<{
        packs: CreditPack[];
        totalRemaining: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [loadingPack, setLoadingPack] = useState<string | null>(null);
    const [confirmingPayment, setConfirmingPayment] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadBilling() {
            try {
                const [subRes, creditsRes] = await Promise.all([
                    api.getSubscription(),
                    api.getCredits(),
                ]);
                setSubscription((subRes.data ?? null) as Subscription | null);
                setCredits(
                    (creditsRes.data ?? null) as {
                        packs: CreditPack[];
                        totalRemaining: number;
                    } | null,
                );
            } catch (err) {
                console.error("Billing load error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadBilling();
    }, []);

    const activePack =
        credits?.packs.find(
            (pack) =>
                !!subscription?.razorpayPaymentId &&
                pack.razorpayPaymentId === subscription.razorpayPaymentId,
        ) ?? credits?.packs[0];
    const purchaseDate =
        subscription?.currentPeriodStart || activePack?.purchasedAt || null;
    const purchaseTime = purchaseDate ? new Date(purchaseDate).getTime() : 0;
    const cancellationDeadline = purchaseTime + 24 * 60 * 60 * 1000;
    const withinCancellationWindow =
        !!purchaseTime && Date.now() <= cancellationDeadline;
    const remainingCredits = activePack
        ? activePack.totalCredits - activePack.usedCredits
        : credits?.totalRemaining || 0;
    const canCancel =
        subscription?.status === "active" &&
        !!subscription.razorpayPaymentId &&
        withinCancellationWindow &&
        remainingCredits > 0;
    const canBuyPack = (credits?.totalRemaining ?? 0) <= 0;

    const refundCopy = useMemo(() => {
        if (!purchaseDate) return "No active pack purchase was found.";
        if (!withinCancellationWindow) {
            return "The 24-hour cancellation window has closed for this pack.";
        }
        if (remainingCredits <= 0) {
            return "All credits in this pack have been used, so no refundable balance remains.";
        }
        return "Eligible for usage-based cancellation. Refund value is calculated from unused credits.";
    }, [purchaseDate, remainingCredits, withinCancellationWindow]);

    const handleCancel = async () => {
        setCancelling(true);
        setMessage(null);
        try {
            const res = await api.cancelPlan();
            const cancelResult = res.data as
                | { refundAmountFormatted?: string }
                | undefined;
            await fetchPlan();
            setMessage(
                `Cancellation submitted. Estimated refund: ${cancelResult?.refundAmountFormatted || "usage-based amount"}.`,
            );
            const [subRes, creditsRes] = await Promise.all([
                api.getSubscription(),
                api.getCredits(),
            ]);
            setSubscription((subRes.data ?? null) as Subscription | null);
            setCredits(
                (creditsRes.data ?? null) as {
                    packs: CreditPack[];
                    totalRemaining: number;
                } | null,
            );
        } catch (err) {
            setMessage(
                err instanceof Error
                    ? err.message
                    : "Unable to cancel this pack right now.",
            );
        } finally {
            setCancelling(false);
        }
    };

    const reloadBilling = async () => {
        const [subRes, creditsRes] = await Promise.all([
            api.getSubscription(),
            api.getCredits(),
        ]);
        setSubscription((subRes.data ?? null) as Subscription | null);
        setCredits(
            (creditsRes.data ?? null) as {
                packs: CreditPack[];
                totalRemaining: number;
            } | null,
        );
    };

    const handlePurchase = async (packId: string) => {
        if (!canBuyPack || loadingPack) return;

        setLoadingPack(packId);
        setMessage(null);
        try {
            const res = await api.purchasePack(packId);
            const { orderId, razorpayKeyId, userEmail, packLabel } = res.data;
            const isDev = import.meta.env.DEV;

            const rzp = new (window as any).Razorpay({
                key: razorpayKeyId,
                order_id: orderId,
                name: "PrepPilot",
                description: packLabel,
                prefill: { email: userEmail },
                handler: async (response: any) => {
                    setConfirmingPayment(true);
                    try {
                        if (isDev) {
                            await api.verifyPayment({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                packType: packId,
                            });
                        }
                        await fetchPlan();
                        await reloadBilling();
                        setMessage(
                            "New pack activated. Your credits are ready.",
                        );
                    } catch (err) {
                        setMessage(
                            err instanceof Error
                                ? err.message
                                : "Payment completed, but activation could not be confirmed. Refresh billing in a moment.",
                        );
                    } finally {
                        setConfirmingPayment(false);
                    }
                },
                theme: { color: "#65a30d" },
            });
            rzp.open();
        } catch (err) {
            setMessage(
                err instanceof Error
                    ? err.message
                    : "Unable to start checkout right now.",
            );
        } finally {
            setLoadingPack(null);
        }
    };

    if (loading) {
        return (
            <main className="flex-1" aria-busy="true">
                <AppLoader label="Loading billing" />
            </main>
        );
    }

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1200px] mx-auto w-full">
            {confirmingPayment && (
                <div
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                    className="fixed inset-0 z-100 bg-background/95 backdrop-blur-sm"
                >
                    <AppLoader label="Confirming payment" />
                </div>
            )}
            <div className="mb-8">
                <Link
                    to="/account"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
                >
                    <IconArrowLeft className="w-4 h-4" />
                    Account
                </Link>
                <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                    Billing
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Pack ownership, payment contact, credits, and cancellation.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border bg-card rounded-xl overflow-hidden"
                >
                    <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Current pack
                            </p>
                            <h2 className="font-heading text-2xl font-bold text-foreground mt-2">
                                {getPlanFullLabel(subscription?.plan)}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {subscription?.status
                                    ? `${subscription.status[0].toUpperCase()}${subscription.status.slice(1)}`
                                    : "No active billing record"}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                            <IconShieldCheck className="w-3.5 h-3.5" />
                            Pack billing
                        </span>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoTile
                            icon={IconUser}
                            label="Subscribed user"
                            value={session?.user.name || "User"}
                        />
                        <InfoTile
                            icon={IconMail}
                            label="Email"
                            value={
                                subscription?.billingContact?.email ||
                                session?.user.email ||
                                "Not available"
                            }
                        />
                        <InfoTile
                            icon={IconPhone}
                            label="Mobile"
                            value={
                                subscription?.billingContact?.contact ||
                                "Not captured"
                            }
                        />
                        <InfoTile
                            icon={IconCreditCard}
                            label="Payment method"
                            value={
                                subscription?.billingContact?.method
                                    ? subscription.billingContact.method.toUpperCase()
                                    : "Razorpay"
                            }
                        />
                        <InfoTile
                            icon={IconCalendar}
                            label="Pack bought"
                            value={formatDateTime(purchaseDate)}
                        />
                        <InfoTile
                            icon={IconClock}
                            label="Expires"
                            value={formatDate(subscription?.currentPeriodEnd)}
                        />
                    </div>

                    <div className="mx-6 mb-6 rounded-lg border border-border bg-background/60 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Cancellation eligibility
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {refundCopy}
                                </p>
                            </div>
                            {canCancel ? (
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {cancelling ? (
                                        <IconRefresh className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <IconX className="w-4 h-4" />
                                    )}
                                    Cancel Plan
                                </button>
                            ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                                    <IconCheck className="w-3.5 h-3.5" />
                                    No action needed
                                </span>
                            )}
                        </div>
                        {message && (
                            <p className="text-xs text-muted-foreground mt-3">
                                {message}
                            </p>
                        )}
                    </div>
                </motion.section>

                <motion.aside
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="border border-border bg-card rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Credits
                            </p>
                            <p className="font-heading text-3xl font-bold text-foreground mt-1">
                                {credits?.totalRemaining ?? 0}
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconReceipt className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {credits?.packs.length ? (
                            credits.packs.map((pack) => {
                                const left =
                                    pack.totalCredits - pack.usedCredits;
                                return (
                                    <div
                                        key={pack.id}
                                        className="rounded-lg border border-border bg-background/60 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold capitalize text-foreground">
                                                {pack.packType} pack
                                            </p>
                                            <span className="text-xs text-primary font-semibold">
                                                {left}/{pack.totalCredits} left
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {pack.durationMinutes} min sessions
                                            · expires{" "}
                                            {formatDate(pack.expiresAt)}
                                        </p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No active credits found.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 border-t border-border pt-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Buy next pack
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {canBuyPack
                                        ? "Available because your current credits are used or expired."
                                        : "Locked until your active credits are used."}
                                </p>
                            </div>
                            {!canBuyPack && (
                                <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                                    Active
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {RENEWAL_PACKS.map((pack) => (
                                <button
                                    key={pack.id}
                                    type="button"
                                    onClick={() => handlePurchase(pack.id)}
                                    disabled={!canBuyPack || !!loadingPack}
                                    className="w-full rounded-lg border border-border bg-background/60 p-3 text-left transition-all hover:border-primary/35 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <span className="flex items-center justify-between gap-3">
                                        <span>
                                            <span className="block text-sm font-semibold text-foreground">
                                                {pack.name}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {pack.detail}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                                            {loadingPack === pack.id
                                                ? "Opening..."
                                                : pack.price}
                                            <IconArrowRight className="w-4 h-4 text-primary" />
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.aside>
            </div>
        </main>
    );
}

function InfoTile({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof IconUser;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Icon className="w-4 h-4" />
                {label}
            </div>
            <p className="text-sm font-medium text-foreground wrap-break-word">
                {value}
            </p>
        </div>
    );
}
