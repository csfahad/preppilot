import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { useSession } from "@/lib/auth-client";
import PublicHeader from "@/components/public-header";
import {
    IconArrowRight,
    IconCamera,
    IconChartBar,
    IconChecks,
    IconClock,
    IconFileAnalytics,
    IconFileText,
    IconLock,
    IconMessageCircle,
    IconMicrophone,
    IconPlayerPlay,
    IconShieldCheck,
    IconSparkles,
    IconTarget,
    IconUsers,
    IconVideo,
} from "@tabler/icons-react";

export const Route = createFileRoute("/")({ component: Home });

const HERO_PROOFS = [
    ["Video-first", IconCamera],
    ["AI follow-ups", IconMessageCircle],
    ["Saved reports", IconFileAnalytics],
];

const FEATURE_CARDS = [
    {
        icon: IconVideo,
        title: "Realtime video room",
        body: "Camera, microphone, timer, and AI interviewer stay in one focused workspace.",
    },
    {
        icon: IconMessageCircle,
        title: "Adaptive conversation",
        body: "Follow-ups respond to your answer instead of marching through a static script.",
    },
    {
        icon: IconChartBar,
        title: "Actionable report",
        body: "Scores, transcript evidence, model answers, and improvement tips sit beside the recording.",
    },
];

const WORKFLOW_STEPS = [
    ["01", "Choose role and duration"],
    ["02", "Join the realtime video room"],
    ["03", "Answer adaptive AI follow-ups"],
    ["04", "Replay recording and report"],
];

const REPORT_POINTS = [
    {
        icon: IconTarget,
        title: "Role-specific scoring",
        body: "Rubrics adapt to the seniority, function, and interview type selected during setup.",
    },
    {
        icon: IconFileText,
        title: "Transcript evidence",
        body: "Review the exact turns behind feedback instead of guessing what went well.",
    },
    {
        icon: IconMicrophone,
        title: "Delivery signals",
        body: "Pacing, confidence, and filler-word cues help tighten spoken answers.",
    },
    {
        icon: IconLock,
        title: "Pack-gated depth",
        body: "Model answers and full feedback unlock by pack without recurring subscription pressure.",
    },
];

const USE_CASES = [
    {
        title: "First-round screens",
        body: "Practice concise story framing, salary-safe phrasing, and quick role fit answers.",
        stat: "15 min",
    },
    {
        title: "Technical panels",
        body: "Explain tradeoffs, design choices, and debugging decisions under follow-up pressure.",
        stat: "30 min",
    },
    {
        title: "Final loops",
        body: "Rehearse leadership, scope, collaboration, and company-specific examples.",
        stat: "45 min",
    },
];

const FAQS = [
    {
        q: "Does PrepPilot replace human mock interviews?",
        a: "No. It gives repeatable camera-on practice between human sessions, so your live coaching time can focus on higher-value feedback.",
    },
    {
        q: "Can I practice for a specific company or role?",
        a: "Yes. Add a target company, role title, seniority, interview type, and optional job description before starting the room.",
    },
    {
        q: "What happens after the interview ends?",
        a: "The session moves to processing, then produces a report with recording playback, score breakdowns, strengths, and improvement areas.",
    },
    {
        q: "Are packs recurring subscriptions?",
        a: "No. Packs are one-time purchases. You can buy another pack only after active credits are used or expired.",
    },
];

function Home() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isPending && session) {
            navigate({ to: "/dashboard" });
        }
    }, [session, isPending, navigate]);

    if (isPending || session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">
                        Loading PrepPilot...
                    </p>
                </div>
            </div>
        );
    }

    return <LandingExperience />;
}

function LandingExperience() {
    return (
        <div className="min-h-screen bg-background overflow-x-clip">
            <PublicHeader />

            <section className="relative min-h-[calc(100vh-4rem)] border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(132,204,22,0.13),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.16),transparent_30%),linear-gradient(180deg,transparent,rgba(0,0,0,0.04))]" />
                <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] bg-size-[48px_48px]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-6rem)] grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center py-14 lg:py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-semibold mb-6">
                            <IconSparkles className="w-4 h-4" />
                            Realtime video interview practice
                        </div>
                        <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02] text-foreground">
                            PrepPilot
                        </h1>
                        <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                            Practice in a live camera-on interview room with an
                            AI interviewer, adaptive follow-ups, saved
                            recordings, transcripts, and role-specific feedback.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            <Link
                                to="/auth/login"
                                search={{ error: undefined }}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                Start realtime interview
                                <IconArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/pricing"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-background/70 text-foreground font-medium hover:bg-accent transition-all"
                            >
                                View packs
                            </Link>
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
                            {HERO_PROOFS.map(([label, Icon]) => (
                                <div
                                    key={String(label)}
                                    className="rounded-lg border border-border bg-background/70 p-3"
                                >
                                    <Icon className="w-4 h-4 text-primary mb-2" />
                                    <p className="text-xs font-semibold text-foreground">
                                        {String(label)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="relative"
                    >
                        <div className="rounded-xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden">
                            <div className="h-11 border-b border-border bg-muted/40 flex items-center justify-between px-4">
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-400/70" />
                                    <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                                    <span className="w-3 h-3 rounded-full bg-green-400/70" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    Live session · 18:24
                                </span>
                            </div>
                            <div className="p-4 sm:p-5 bg-background">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="aspect-video rounded-lg bg-zinc-950 border border-border relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_22%,rgba(132,204,22,0.22),transparent_34%),linear-gradient(145deg,#171717,#050505)]" />
                                        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                                            <span className="text-xs text-white/80">
                                                AI Interviewer
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                                                <IconPlayerPlay className="w-3 h-3" />
                                                LIVE
                                            </span>
                                        </div>
                                        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center">
                                            <IconVideo className="w-9 h-9 text-primary" />
                                        </div>
                                    </div>
                                    <div className="aspect-video rounded-lg bg-zinc-900 border border-border relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1f2937,#020617)]" />
                                        <div className="absolute left-4 bottom-4 text-xs text-white/80">
                                            You
                                        </div>
                                        <div className="absolute right-4 bottom-4 rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/80">
                                            camera on
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-lg border border-border bg-card p-4">
                                    <p className="text-xs font-semibold text-primary mb-2">
                                        Current follow-up
                                    </p>
                                    <p className="text-sm text-foreground leading-relaxed">
                                        Walk me through the tradeoff you made
                                        and how you validated the decision with
                                        users or data.
                                    </p>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {[
                                        ["Transcript", "Realtime"],
                                        ["Recording", "Auto-saved"],
                                        ["Report", "After session"],
                                    ].map(([title, value]) => (
                                        <div
                                            key={title}
                                            className="rounded-lg bg-muted/50 p-3"
                                        >
                                            <p className="text-[10px] text-muted-foreground">
                                                {title}
                                            </p>
                                            <p className="text-xs font-semibold text-foreground mt-1">
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section id="features" className="py-20 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-10">
                        <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
                            Built for the new interview loop
                        </h2>
                        <p className="text-muted-foreground mt-3">
                            No text mode detours. PrepPilot focuses on the
                            pressure, pacing, and presence of live interviews.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        {FEATURE_CARDS.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08 }}
                                className="rounded-xl border border-border bg-card p-6"
                            >
                                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                                    <feature.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-heading text-lg font-semibold text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    {feature.body}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="how-it-works"
                className="py-20 lg:py-24 border-y border-border bg-muted/25"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-[0.7fr_1fr] gap-10 items-start">
                        <div>
                            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
                                From setup to debrief in one flow
                            </h2>
                            <p className="text-muted-foreground mt-3">
                                Buy a pack, configure the role, join the room,
                                and review the evidence after the interview.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {WORKFLOW_STEPS.map(([step, label]) => (
                                <div
                                    key={step}
                                    className="rounded-xl border border-border bg-background p-5"
                                >
                                    <p className="text-xs font-bold text-primary">
                                        {step}
                                    </p>
                                    <p className="font-heading font-semibold text-foreground mt-3">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-[1fr_0.9fr] gap-10 items-center">
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                                        Report snapshot
                                    </p>
                                    <p className="font-heading font-semibold text-foreground mt-1">
                                        Product Manager · Final loop
                                    </p>
                                </div>
                                <span className="text-3xl font-heading font-bold text-primary">
                                    82
                                </span>
                            </div>
                            <div className="p-5 grid sm:grid-cols-2 gap-4">
                                <div className="rounded-lg bg-muted/40 p-4">
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Evidence timeline
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            "Clarified scope",
                                            "Missed metric",
                                            "Strong tradeoff",
                                        ].map((label, index) => (
                                            <div
                                                key={label}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                                <span className="text-sm text-foreground">
                                                    {label}
                                                </span>
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    0{index + 4}:12
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-zinc-950 p-4 text-white">
                                    <div className="h-28 rounded-md bg-[linear-gradient(135deg,#111827,#020617)] border border-white/10 flex items-end p-3">
                                        <span className="text-xs text-white/70">
                                            Recording review
                                        </span>
                                    </div>
                                    <div className="mt-4 h-1.5 rounded-full bg-white/15">
                                        <div className="h-full w-2/3 rounded-full bg-primary" />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                                        <span>12:48</span>
                                        <span>18:30</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
                                Feedback tied to what actually happened
                            </h2>
                            <p className="text-muted-foreground mt-3 leading-relaxed">
                                The debrief is built around reviewable evidence:
                                the recording, transcript turns, and scoring
                                dimensions that map back to the configured role.
                            </p>
                            <div className="mt-6 grid sm:grid-cols-2 gap-3">
                                {REPORT_POINTS.map((item) => (
                                    <div
                                        key={item.title}
                                        className="rounded-lg border border-border bg-background p-4"
                                    >
                                        <item.icon className="w-5 h-5 text-primary mb-3" />
                                        <h3 className="font-heading text-sm font-semibold text-foreground">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                            {item.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 lg:py-24 border-y border-border bg-muted/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                        <div className="max-w-2xl">
                            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
                                Match the practice to the interview stage
                            </h2>
                            <p className="text-muted-foreground mt-3">
                                Packs map naturally to different kinds of prep:
                                short screens, working sessions, and high-stakes
                                final rounds.
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium hover:bg-accent transition-all"
                        >
                            Compare packs
                            <IconArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        {USE_CASES.map((item) => (
                            <div
                                key={item.title}
                                className="rounded-xl border border-border bg-background p-6"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <IconUsers className="w-5 h-5 text-primary" />
                                    <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                        {item.stat}
                                    </span>
                                </div>
                                <h3 className="font-heading text-lg font-semibold text-foreground mt-5">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    {item.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
                            Common questions
                        </h2>
                        <p className="text-muted-foreground mt-3">
                            Practical answers before you start a camera-on
                            session.
                        </p>
                    </div>
                    <div className="divide-y divide-border rounded-xl border border-border bg-card">
                        {FAQS.map((faq) => (
                            <details
                                key={faq.q}
                                className="group p-5 open:bg-muted/20"
                            >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-heading font-semibold text-foreground">
                                    {faq.q}
                                    <IconArrowRight className="w-4 h-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                                Practice the room before the room matters.
                            </h2>
                            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <IconChecks className="w-4 h-4 text-primary" />
                                    1 free interview
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <IconClock className="w-4 h-4 text-primary" />
                                    Pack-based pricing
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <IconShieldCheck className="w-4 h-4 text-primary" />
                                    24-hour cancellation window
                                </span>
                            </div>
                        </div>
                        <Link
                            to="/auth/login"
                            search={{ error: undefined }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold hover:opacity-90 transition-all"
                        >
                            Get started
                            <IconArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
