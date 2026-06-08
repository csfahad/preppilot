import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { useSubscriptionStore } from "@/stores/subscription";
import {
    IconPlus,
    IconHistory,
    IconTrendingUp,
    IconFlame,
    IconChevronRight,
    IconCrown,
    IconMicrophone,
    IconMessageCircle,
    IconBook2,
} from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
    component: DashboardPage,
});

function DashboardPage() {
    const { data: session } = useSession();
    const {
        plan,
        interviewCount,
        fetchPlan,
        canStartInterview,
        maxInterviews,
    } = useSubscriptionStore();
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [interviewRes] = await Promise.all([
                    api.listInterviews(),
                    fetchPlan(),
                ]);
                setInterviews(interviewRes.data || []);
            } catch (err) {
                console.error("Dashboard load error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [session, fetchPlan]);

    const completedInterviews = interviews.filter(
        (i: any) => i.status === "completed",
    );
    const avgScore =
        completedInterviews.length > 0
            ? Math.round(
                  completedInterviews.reduce(
                      (sum: number, i: any) =>
                          sum + (i.report?.overallScore || 0),
                      0,
                  ) / completedInterviews.length,
              )
            : 0;

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="font-heading text-3xl font-bold text-foreground">
                    Welcome back
                    {session?.user.name
                        ? `, ${session.user.name.split(" ")[0]}`
                        : ""}{" "}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Ready to ace your next interview?
                </p>
            </motion.div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    {
                        icon: IconHistory,
                        label: "Total Interviews",
                        value: String(interviews.length),
                        color: "text-blue-500",
                    },
                    {
                        icon: IconTrendingUp,
                        label: "Avg. Score",
                        value: avgScore ? `${avgScore}/100` : "—",
                        color: "text-green-500",
                    },
                    {
                        icon: IconFlame,
                        label: "Streak",
                        value: "0 days",
                        color: "text-orange-500",
                    },
                    {
                        icon: IconCrown,
                        label: "Plan",
                        value:
                            plan === "free"
                                ? `Free (${interviewCount}/${maxInterviews})`
                                : plan === "pro_monthly"
                                  ? "Pro Monthly"
                                  : plan === "pro_annual"
                                    ? "Pro Annual"
                                    : "Pro",
                        color: "text-purple-500",
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card border border-border rounded-xl p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="font-heading text-2xl font-bold text-foreground">
                            {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {stat.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Link
                        to="/interview/new"
                        className="block p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <IconPlus className="w-7 h-7 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-heading text-lg font-semibold text-foreground">
                                    Start New Interview
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Configure your role, type, and preferences
                                </p>
                            </div>
                            <IconChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link
                        to="/interview/new"
                        className="block p-6 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-105 transition-transform">
                                <IconMessageCircle className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-heading text-lg font-semibold text-foreground">
                                    Warm-up Mode
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    3 quick questions, no scoring — just
                                    practice
                                </p>
                            </div>
                            <IconChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Link
                        to="/interview-questions"
                        className="block p-6 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-105 transition-transform">
                                <IconBook2 className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-heading text-lg font-semibold text-foreground">
                                    Question Library
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Browse sample questions by role and type
                                </p>
                            </div>
                            <IconChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                    </Link>
                </motion.div>
            </div>

            {/* Interview History */}
            <div>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
                    Recent Interviews
                </h2>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-20 bg-muted rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <IconHistory className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                            No interviews yet
                        </h3>
                        <p className="text-muted-foreground mt-1 mb-6">
                            Start your first mock interview to begin improving
                        </p>
                        <Link
                            to="/interview/new"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
                        >
                            <IconPlus className="w-4 h-4" /> Start Interview
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {interviews.map((interview: any, i: number) => {
                            const isCompleted =
                                interview.status === "completed";

                            return (
                                <motion.div
                                    key={interview.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link
                                        to={
                                            isCompleted
                                                ? "/interview/$interviewId/report"
                                                : "/interview/$interviewId"
                                        }
                                        params={{
                                            interviewId: interview.id,
                                        }}
                                        className="block bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        interview.mode ===
                                                        "voice"
                                                            ? "bg-blue-500/10"
                                                            : "bg-primary/10"
                                                    }`}
                                                >
                                                    {interview.mode ===
                                                    "voice" ? (
                                                        <IconMicrophone className="w-5 h-5 text-blue-500" />
                                                    ) : (
                                                        <IconMessageCircle className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-foreground">
                                                        {interview.roleTitle}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {interview.seniority} •{" "}
                                                        {interview.interviewTypes?.join(
                                                            ", ",
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {interview.report
                                                    ?.overallScore && (
                                                    <span
                                                        className={`text-lg font-bold ${
                                                            interview.report
                                                                .overallScore >=
                                                            70
                                                                ? "text-green-500"
                                                                : interview
                                                                        .report
                                                                        .overallScore >=
                                                                    50
                                                                  ? "text-yellow-500"
                                                                  : "text-red-500"
                                                        }`}
                                                    >
                                                        {
                                                            interview.report
                                                                .overallScore
                                                        }
                                                    </span>
                                                )}
                                                <span
                                                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                        interview.status ===
                                                        "completed"
                                                            ? "bg-green-500/10 text-green-600"
                                                            : interview.status ===
                                                                "active"
                                                              ? "bg-blue-500/10 text-blue-600"
                                                              : interview.status ===
                                                                  "processing"
                                                                ? "bg-yellow-500/10 text-yellow-600"
                                                                : "bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    {interview.status}
                                                </span>
                                                <IconChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Paywall nudge */}
            {plan === "free" && interviewCount >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 p-6 rounded-2xl bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                                <IconCrown className="w-5 h-5 text-primary" />
                                {!canStartInterview()
                                    ? "You've used all free interviews"
                                    : "1 free interview remaining"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upgrade to unlock unlimited interviews, voice
                                mode, and expert-level feedback
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            className="shrink-0 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
                        >
                            Upgrade to Pro
                        </Link>
                    </div>
                </motion.div>
            )}
        </main>
    );
}
