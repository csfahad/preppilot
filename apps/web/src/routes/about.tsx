import { createFileRoute, Link } from "@tanstack/react-router";
import {
    IconArrowRight,
    IconChartBar,
    IconFileText,
    IconMessageCircle,
    IconShieldCheck,
    IconVideo,
} from "@tabler/icons-react";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";

export const Route = createFileRoute("/about")({
    head: () => ({
        meta: [
            { title: "About PrepPilot | AI Mock Interview Practice" },
            {
                name: "description",
                content:
                    "PrepPilot is an AI-powered mock interview practice app with camera-on sessions, adaptive follow-ups, recordings, transcripts, and role-specific feedback.",
            },
        ],
    }),
    component: AboutPage,
});

const PRACTICE_STAGES = [
    {
        title: "Set the interview context",
        description:
            "Choose your role, seniority, interview type, target company, and session length so each practice session is relevant to the opportunity ahead.",
        icon: IconFileText,
    },
    {
        title: "Practice live on camera",
        description:
            "Join a focused video room and answer questions from an AI interviewer that adapts its follow-ups to what you say.",
        icon: IconVideo,
    },
    {
        title: "Review the evidence",
        description:
            "Revisit the recording and transcript, then use role-specific scoring and feedback to improve your next answer.",
        icon: IconChartBar,
    },
] as const;

function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main>
                <section className="border-b border-border bg-muted/20">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
                        <div className="max-w-3xl">
                            <p className="text-sm font-semibold text-primary">
                                About PrepPilot
                            </p>
                            <h1 className="mt-4 text-balance font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                PrepPilot
                            </h1>
                            <h2 className="mt-4 max-w-2xl text-balance font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                AI-powered mock interview practice for real
                                opportunities.
                            </h2>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                                PrepPilot helps job seekers prepare through
                                camera-on interview sessions with an AI
                                interviewer, adaptive follow-up questions,
                                recordings, transcripts, and role-specific
                                feedback.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    to="/auth/login"
                                    search={{ error: undefined }}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                                >
                                    Start practicing
                                    <IconArrowRight className="h-5 w-5" />
                                </Link>
                                <Link
                                    to="/interview-questions"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent"
                                >
                                    Explore questions
                                    <IconMessageCircle className="h-5 w-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
                    <div className="max-w-2xl">
                        <h2 className="text-balance font-heading text-3xl font-bold tracking-tight text-foreground">
                            Practice with a clear loop from setup to review.
                        </h2>
                        <p className="mt-4 leading-relaxed text-muted-foreground">
                            The product is designed for repeatable practice
                            between human mock interviews—not as a replacement
                            for coaching or a promise of any hiring outcome.
                        </p>
                    </div>

                    <ol className="mt-10 divide-y divide-border border-y border-border">
                        {PRACTICE_STAGES.map((stage, index) => {
                            const Icon = stage.icon;

                            return (
                                <li
                                    key={stage.title}
                                    className="grid gap-4 py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(18rem,0.9fr)] sm:items-start sm:gap-6 sm:py-8"
                                >
                                    <span className="font-heading text-sm font-semibold text-primary">
                                        0{index + 1}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <h3 className="font-heading text-lg font-semibold text-foreground">
                                            {stage.title}
                                        </h3>
                                    </div>
                                    <p className="leading-relaxed text-muted-foreground sm:pt-1">
                                        {stage.description}
                                    </p>
                                </li>
                            );
                        })}
                    </ol>
                </section>

                <section className="border-y border-border bg-muted/20">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.7fr)] lg:items-center lg:px-8 lg:py-16">
                        <div>
                            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight text-foreground">
                                Google sign-in is used for your PrepPilot
                                account.
                            </h2>
                            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                                If you choose to sign in with Google, PrepPilot
                                uses the account information described in our
                                Privacy Policy to create and secure your
                                account. We use this information to provide
                                interview practice, maintain your session
                                history, and support your account.
                            </p>
                        </div>
                        <div className="rounded-xl bg-background p-6">
                            <IconShieldCheck className="h-6 w-6 text-primary" />
                            <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                                Your data, explained clearly
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                Learn what we collect, how interview data is
                                used, and the choices available to you.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
                                <Link
                                    to="/privacy"
                                    className="inline-flex items-center gap-2 text-primary hover:underline"
                                >
                                    Read the Privacy Policy
                                    <IconArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    to="/terms"
                                    className="inline-flex items-center gap-2 text-foreground hover:underline"
                                >
                                    Terms of Service
                                    <IconArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter />
        </div>
    );
}
