import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import PublicHeader from "@/components/public-header";
import {
    IconSparkles,
    IconMicrophone,
    IconChartBar,
    IconTarget,
    IconArrowRight,
    IconBolt,
    IconBrain,
    IconShieldCheck,
    IconWorld,
    IconBook2,
} from "@tabler/icons-react";

export const Route = createFileRoute("/landing")({
    component: LandingPage,
});

function LandingPage() {
    return (
        <div className="min-h-screen bg-background overflow-x-clip">
            <PublicHeader />

            {/* Hero */}
            <section className="relative py-24 md:py-32">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-primary/5 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
                </div>

                <div className="max-w-6xl mx-auto px-4 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <IconBolt className="w-4 h-4" /> AI-Powered Mock
                            Interviews
                        </div>
                        <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
                            Ace your next
                            <br />
                            <span className="text-primary">interview</span> with
                            AI
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
                            Practice with a realistic AI interviewer. Get
                            instant scoring, expert-level model answers, and
                            actionable feedback — tailored to your exact role.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/auth/login"
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                Start Free Interview{" "}
                                <IconArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/interview-questions"
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-border text-foreground font-medium hover:bg-accent transition-all"
                            >
                                <IconBook2 className="w-5 h-5" />
                                Browse Questions
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6">
                            3 free interviews • No credit card required
                        </p>
                    </motion.div>

                    {/* Mock UI preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-16 max-w-4xl mx-auto"
                    >
                        <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                            {/* Browser chrome */}
                            <div className="h-10 bg-muted/50 border-b border-border flex items-center gap-2 px-4">
                                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                                <div className="flex-1 mx-8">
                                    <div className="h-5 bg-muted rounded-md w-48 mx-auto" />
                                </div>
                            </div>
                            {/* Mock interview UI */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            Question 3 of 8
                                        </span>
                                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full w-[37%]" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-mono text-muted-foreground">
                                        2:45
                                    </span>
                                </div>
                                <div>
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 mb-3">
                                        behavioral
                                    </span>
                                    <h3 className="font-heading text-xl font-semibold text-foreground">
                                        Tell me about a time you had to resolve
                                        a conflict within your team. What was
                                        the outcome?
                                    </h3>
                                </div>
                                <div className="h-32 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
                                    Type or speak your answer...
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex gap-2">
                                        <div className="h-10 px-5 rounded-xl bg-primary/10 flex items-center text-primary text-sm font-medium">
                                            <IconMicrophone className="w-4 h-4 mr-1.5" />{" "}
                                            Voice
                                        </div>
                                    </div>
                                    <div className="h-10 px-6 rounded-xl bg-primary flex items-center text-primary-foreground text-sm font-medium">
                                        Submit Answer
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Social proof */}
            <section className="py-12 border-y border-border/50 bg-muted/30">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
                        <span>
                            <strong className="text-foreground">2,400+</strong>{" "}
                            interviews completed
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                            <strong className="text-foreground">15</strong>{" "}
                            industries covered
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                            <strong className="text-foreground">4.8/5</strong>{" "}
                            average rating
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                            <strong className="text-foreground">6</strong> voice
                            accents
                        </span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24">
                <div className="max-w-6xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Everything you need to interview with confidence
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                            From behavioral to technical, PrepPilot adapts to
                            your role and level
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: IconBrain,
                                title: "AI Interviewer",
                                desc: "Claude-powered questions tailored to your exact role, seniority, and target company. Adaptive follow-ups based on your answers.",
                                color: "text-purple-500",
                                bg: "bg-purple-500/10",
                            },
                            {
                                icon: IconMicrophone,
                                title: "Voice Mode",
                                desc: "Speak your answers naturally. Real-time transcription and 6 regional interviewer accents to match your target market.",
                                color: "text-blue-500",
                                bg: "bg-blue-500/10",
                            },
                            {
                                icon: IconChartBar,
                                title: "Instant Scoring",
                                desc: "6-dimension scoring: clarity, relevance, depth, structure, technical accuracy, and confidence. STAR format detection included.",
                                color: "text-green-500",
                                bg: "bg-green-500/10",
                            },
                            {
                                icon: IconTarget,
                                title: "Model Answers",
                                desc: "See what an expert-level answer looks like for every question. Learn the structure and depth interviewers expect.",
                                color: "text-orange-500",
                                bg: "bg-orange-500/10",
                            },
                            {
                                icon: IconSparkles,
                                title: "Resume Parsing",
                                desc: "Upload your resume and get questions personalized to your actual experience, skills, and career trajectory.",
                                color: "text-pink-500",
                                bg: "bg-pink-500/10",
                            },
                            {
                                icon: IconWorld,
                                title: "15 Industries",
                                desc: "Technology, Finance, Healthcare, Marketing, and more. 12 function categories with 50+ sub-specializations.",
                                color: "text-cyan-500",
                                bg: "bg-cyan-500/10",
                            },
                        ].map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all group"
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                                >
                                    <f.icon className={`w-6 h-6 ${f.color}`} />
                                </div>
                                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                                    {f.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {f.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section
                id="how-it-works"
                className="py-24 bg-muted/30 border-y border-border/50"
            >
                <div className="max-w-6xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                            How PrepPilot works
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Three steps to interview-ready
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Set Your Profile",
                                desc: "Tell us your industry, role, seniority, and target companies. Upload your resume for maximum personalization.",
                            },
                            {
                                step: "02",
                                title: "Practice with AI",
                                desc: "Choose your interview type, mode (text or voice), and interviewer tone. Answer questions in real-time with a countdown timer.",
                            },
                            {
                                step: "03",
                                title: "Get Expert Feedback",
                                desc: "Receive a detailed scorecard with radar charts, per-question breakdowns, model answers, and actionable improvement tips.",
                            },
                        ].map((s, i) => (
                            <motion.div
                                key={s.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                    <span className="font-heading text-2xl font-bold text-primary">
                                        {s.step}
                                    </span>
                                </div>
                                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                                    {s.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {s.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24">
                <div className="max-w-6xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Loved by job seekers
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Priya S.",
                                role: "Frontend Engineer → Google",
                                quote: "PrepPilot's behavioral questions were almost identical to what I faced in my actual Google interview. The STAR feedback was incredibly helpful.",
                            },
                            {
                                name: "Rahul M.",
                                role: "Product Manager → Razorpay",
                                quote: "Voice mode made practice feel real. The instant scoring helped me identify weak spots I didn't know I had. Got the offer on my first try.",
                            },
                            {
                                name: "Ananya K.",
                                role: "Data Analyst → Amazon",
                                quote: "The model answers taught me the depth interviewers expect. Went from scoring 4/10 to 8/10 on domain questions in just 2 weeks.",
                            },
                        ].map((t, i) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl border border-border bg-card"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <svg
                                            key={s}
                                            className="w-4 h-4 text-yellow-500 fill-current"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-sm text-foreground mb-4 leading-relaxed">
                                    &ldquo;{t.quote}&rdquo;
                                </p>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {t.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {t.role}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-muted/30 border-t border-border/50">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Ready to ace your interview?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            Start with 3 free mock interviews. No credit card
                            required.
                        </p>
                        <Link
                            to="/auth/login"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            Start Free Interview{" "}
                            <IconArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="font-heading text-lg font-bold">
                                Prep<span className="text-primary">Pilot</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                AI-powered interview coaching
                            </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <Link
                                to="/pricing"
                                className="hover:text-foreground transition-colors"
                            >
                                Pricing
                            </Link>
                            <Link
                                to="/interview-questions"
                                className="hover:text-foreground transition-colors"
                            >
                                Questions
                            </Link>
                            <a
                                href="/terms"
                                className="hover:text-foreground transition-colors"
                            >
                                Terms
                            </a>
                            <a
                                href="/privacy"
                                className="hover:text-foreground transition-colors"
                            >
                                Privacy
                            </a>
                            <a
                                href="mailto:support@preppilot.ai"
                                className="hover:text-foreground transition-colors"
                            >
                                Support
                            </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <IconShieldCheck className="w-4 h-4" />{" "}
                            <span>SOC 2 Compliant</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
