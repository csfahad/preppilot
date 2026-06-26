import { createFileRoute, Link } from "@tanstack/react-router";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import {
    IconArrowRight,
    IconCreditCard,
    IconFileText,
    IconShieldCheck,
} from "@tabler/icons-react";

export const Route = createFileRoute("/terms")({
    component: TermsPage,
});

const TERMS_SECTIONS = [
    {
        title: "Using PrepPilot",
        body: [
            "PrepPilot provides AI mock interview practice, role configuration, realtime interview sessions, recordings, transcripts, scoring, and feedback reports.",
            "You are responsible for the accuracy of profile details, job descriptions, and other information you provide before a session.",
            "AI feedback is practice guidance, not a guarantee of hiring outcomes, employment decisions, or professional certification.",
        ],
    },
    {
        title: "Accounts and access",
        body: [
            "You sign in through supported OAuth providers such as Google or GitHub. Keep access to those accounts secure.",
            "You may not share access in a way that bypasses pack limits, credit rules, abuse protections, or team ownership controls.",
            "We may restrict access for fraud, abuse, security risk, or attempts to disrupt the interview, payment, or reporting systems.",
        ],
    },
    {
        title: "Interview packs and credits",
        body: [
            "PrepPilot uses one-time interview packs, not recurring subscriptions. Credits expire 6 months after purchase unless stated otherwise at checkout.",
            "You can buy a new pack only after active credits are used or expired. We do not support pro-rata upgrades, downgrades, or stacking new packs on top of active credits.",
            "Pack duration and feature access vary by pack type. Starting an interview consumes one eligible credit for paid packs or the free-plan allowance where applicable.",
        ],
    },
    {
        title: "Payments, cancellation, and refunds",
        body: [
            "Payments are processed through Razorpay. Razorpay may collect payment method, billing contact, and transaction details under its own terms.",
            "Pack cancellation is available within 24 hours when eligible. Refunds are usage-based and calculated from unused credits where supported by the current cancellation flow.",
            "Expired credits, completed interviews, and used credits are not restored by buying another pack.",
        ],
    },
    {
        title: "Recordings, reports, and sharing",
        body: [
            "If you permit camera or microphone access, PrepPilot may save interview recordings and upload them for report review.",
            "Report share links are signed public links. Anyone with the link can view the shared report summary, so share only what you are comfortable making public.",
            "You retain responsibility for not uploading confidential employer data, proprietary interview prompts, or sensitive personal information unless you have permission.",
        ],
    },
    {
        title: "Acceptable use",
        body: [
            "Do not misuse PrepPilot to harass others, test illegal content, reverse engineer private systems, attack infrastructure, or bypass payment and usage limits.",
            "Do not upload malicious files or content that infringes third-party rights.",
            "We may suspend sessions, accounts, or access when usage creates legal, security, reliability, or abuse concerns.",
        ],
    },
] as const;

function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main>
                <LegalHero
                    eyebrow="Terms of Service"
                    title="The rules for practicing with PrepPilot"
                    description="These terms describe how PrepPilot packs, AI interviews, recordings, reports, and public sharing work."
                    icon={IconFileText}
                />
                <LegalContent sections={TERMS_SECTIONS} />
            </main>
            <PublicFooter />
        </div>
    );
}

function LegalHero({
    eyebrow,
    title,
    description,
    icon: Icon,
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon: typeof IconFileText;
}) {
    return (
        <section className="border-b border-border bg-muted/20">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                        <Icon className="h-4 w-4" />
                        {eyebrow}
                    </div>
                    <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Last updated: June 25, 2026
                    </p>
                </div>
            </div>
        </section>
    );
}

function LegalContent({
    sections,
}: {
    sections: ReadonlyArray<{ title: string; body: readonly string[] }>;
}) {
    return (
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="font-heading text-sm font-semibold text-foreground">
                        Quick summary
                    </h2>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <p className="flex gap-2">
                            <IconCreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            One-time packs, no recurring subscription.
                        </p>
                        <p className="flex gap-2">
                            <IconShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            Share links are public to anyone with the link.
                        </p>
                    </div>
                    <Link
                        to="/privacy"
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                        Read privacy policy
                        <IconArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </aside>

            <div className="space-y-4">
                {sections.map((section) => (
                    <section
                        key={section.title}
                        className="rounded-xl border border-border bg-card p-6"
                    >
                        <h2 className="font-heading text-xl font-semibold text-foreground">
                            {section.title}
                        </h2>
                        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                            {section.body.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </section>
    );
}
