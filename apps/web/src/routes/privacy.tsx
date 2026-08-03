import { createFileRoute, Link } from "@tanstack/react-router";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import {
    IconArrowRight,
    IconDatabase,
    IconFileText,
    IconShieldCheck,
} from "@tabler/icons-react";

export const Route = createFileRoute("/privacy")({
    component: PrivacyPage,
});

const PRIVACY_SECTIONS = [
    {
        title: "Information we collect",
        body: [
            "Account information from OAuth providers, including name, email, avatar, and sign-in identifiers.",
            "Profile information you provide, including industry, function, seniority, experience, target companies, skills, career goals, and optional resume data.",
            "Interview information, including configuration, questions, answers, transcript turns, scores, reports, recordings, and realtime session metadata.",
            "Billing information from Razorpay, such as order IDs, payment IDs, payment method type, billing email, contact, and transaction status.",
        ],
    },
    {
        title: "How we use information",
        body: [
            "To create tailored interview sessions, generate follow-up prompts, produce feedback reports, and maintain your interview history.",
            "To enforce pack credits, expiration, cancellation eligibility, fraud prevention, rate limits, and account security.",
            "To process payments, activate packs, support refunds where eligible, and troubleshoot billing issues.",
            "To improve reliability, understand product usage, monitor errors, and protect the service from abuse.",
        ],
    },
    {
        title: "AI, recordings, and reports",
        body: [
            "Interview content may be sent to AI, speech, storage, or realtime service providers to run the session and generate feedback.",
            "Recordings are uploaded only when a session records successfully and are used to let you review the interview alongside feedback.",
            "Shared report links expose report summary information publicly to anyone with the signed link. Do not share a report if it includes sensitive context.",
        ],
    },
    {
        title: "Payments and providers",
        body: [
            "Payments are handled through Razorpay. We do not store raw card, UPI, bank, or wallet credentials.",
            "We store payment identifiers and pack records so credits, refunds, cancellations, and billing history work correctly.",
            "OAuth, email, storage, analytics, error monitoring, realtime voice, and AI providers may process limited data needed for their service role.",
        ],
    },
    {
        title: "Retention and controls",
        body: [
            "Completed reports and interview history remain available unless deletion is required or requested through support.",
            "Expired credits no longer allow new interviews, but related billing and usage records may remain for accounting, compliance, and abuse prevention.",
            "You can contact support@preppilot.csfahad.in to request account, recording, or profile-data deletion, subject to legal and operational retention needs.",
        ],
    },
    {
        title: "Security",
        body: [
            "We use authenticated routes, signed report links, provider-backed checkout, and scoped upload URLs to reduce unauthorized access.",
            "No internet service can be guaranteed perfectly secure. Avoid uploading confidential employer data or highly sensitive personal information unless necessary.",
        ],
    },
] as const;

function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main>
                <section className="border-b border-border bg-muted/20">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                                <IconShieldCheck className="h-4 w-4" />
                                Privacy Policy
                            </div>
                            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
                                How PrepPilot handles interview data
                            </h1>
                            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                                This policy explains the data we collect to run
                                AI interviews, recordings, reports, billing, and
                                account features.
                            </p>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Last updated: June 25, 2026
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <h2 className="font-heading text-sm font-semibold text-foreground">
                                Data posture
                            </h2>
                            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                                <p className="flex gap-2">
                                    <IconDatabase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    Interview data powers feedback and review.
                                </p>
                                <p className="flex gap-2">
                                    <IconFileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    Shared reports are public by link.
                                </p>
                            </div>
                            <Link
                                to="/terms"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                            >
                                Read terms
                                <IconArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </aside>

                    <div className="space-y-4">
                        {PRIVACY_SECTIONS.map((section) => (
                            <section
                                key={section.title}
                                className="rounded-xl border border-border bg-card p-6"
                            >
                                <h2 className="font-heading text-xl font-semibold text-foreground">
                                    {section.title}
                                </h2>
                                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                                    {section.body.map((item) => (
                                        <li key={item} className="flex gap-3">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                </section>
            </main>
            <PublicFooter />
        </div>
    );
}
