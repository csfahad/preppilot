import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { signIn, useSession } from "@/lib/auth-client";
import { motion } from "motion/react";
import {
    IconBrandGoogle,
    IconBrandGithub,
    IconSparkles,
    IconMicrophone,
    IconChartBar,
} from "@tabler/icons-react";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/login")({
    component: LoginPage,
    validateSearch: (search: Record<string, unknown>) => ({
        error: (search.error as string) || undefined,
    }),
});

function LoginPage() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();
    const { error } = Route.useSearch();

    useEffect(() => {
        if (session && !isPending) {
            navigate({ to: "/dashboard" });
        }
    }, [session, isPending, navigate]);

    const webOrigin =
        typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000";
    const authCallbackURL = `${webOrigin}/auth/callback`;

    const handleGoogleSignIn = () => {
        signIn.social({ provider: "google", callbackURL: authCallbackURL });
    };

    const handleGithubSignIn = () => {
        signIn.social({ provider: "github", callbackURL: authCallbackURL });
    };

    return (
        <div className="min-h-screen flex">
            {/* Left - Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/15 blur-3xl" />

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link
                            to="/"
                            className="font-heading text-4xl font-bold tracking-tight text-foreground"
                        >
                            Prep<span className="text-primary">Pilot</span>
                        </Link>
                        <p className="mt-2 text-muted-foreground text-lg">
                            Your AI-powered interview coach
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 space-y-8">
                    {(
                        [
                            {
                                icon: (
                                    <IconSparkles className="w-6 h-6 text-primary" />
                                ),
                                title: "AI-Powered Questions",
                                desc: "Tailored to your exact role, seniority, and target company",
                            },
                            {
                                icon: (
                                    <IconMicrophone className="w-6 h-6 text-primary" />
                                ),
                                title: "Voice Interviews",
                                desc: "Practice with realistic AI interviewer voices and accents",
                            },
                            {
                                icon: (
                                    <IconChartBar className="w-6 h-6 text-primary" />
                                ),
                                title: "Deep Feedback",
                                desc: "Per-answer scoring, model answers, and growth tracking",
                            },
                        ] as const
                    ).map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.3 + i * 0.15,
                            }}
                            className="flex items-start gap-4"
                        >
                            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="font-heading font-semibold text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground text-sm mt-0.5">
                                    {feature.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="relative z-10">
                    <p className="text-xs text-muted-foreground">
                        Trusted by thousands of job seekers worldwide
                    </p>
                </div>
            </div>

            {/* Right - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="lg:hidden text-center">
                        <Link
                            to="/"
                            className="font-heading text-3xl font-bold tracking-tight"
                        >
                            Prep<span className="text-primary">Pilot</span>
                        </Link>
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                            Get started
                        </h2>
                        <p className="text-muted-foreground">
                            Sign in to start practicing interviews with AI
                        </p>
                    </div>

                    <div className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                                <svg
                                    className="w-4 h-4 shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                    />
                                </svg>
                                <span>
                                    {error === "access_denied"
                                        ? "Authorization was cancelled. Please try again."
                                        : "An error occurred during sign in. Please try again."}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={handleGoogleSignIn}
                            id="google-sign-in"
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-border bg-card hover:bg-accent transition-all duration-200 text-foreground font-medium shadow-sm hover:shadow-md cursor-pointer"
                        >
                            <IconBrandGoogle className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <button
                            onClick={handleGithubSignIn}
                            id="github-sign-in"
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-border bg-card hover:bg-accent transition-all duration-200 text-foreground font-medium shadow-sm hover:shadow-md cursor-pointer"
                        >
                            <IconBrandGithub className="w-5 h-5" />
                            Continue with GitHub
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            By continuing, you agree to our{" "}
                            <a
                                href="/terms"
                                className="text-primary hover:underline"
                            >
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a
                                href="/privacy"
                                className="text-primary hover:underline"
                            >
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
