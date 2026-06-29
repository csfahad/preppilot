import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { useSubscriptionStore } from "@/stores/subscription";
import { AppLoader } from "@/components/app-loader";
import {
    IconPlus,
    IconHistory,
    IconTrendingUp,
    IconFlame,
    IconChevronRight,
    IconVideo,
    IconCalendar,
    IconAlertTriangle,
    IconTrash,
    IconRefresh,
    IconPlayerPlay,
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
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const activeInterviews = interviews.filter(
        (i: any) => i.status === "active" || i.status === "processing",
    );

    const handleDeleteConfiguring = async (interviewId: string) => {
        setDeletingId(interviewId);
        try {
            await api.cancelInterview(interviewId);
            setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
        } catch (err) {
            console.error("Failed to delete interview:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "completed":
                return {
                    label: "Completed",
                    className:
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                };
            case "active":
                return {
                    label: "In Progress",
                    className:
                        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                };
            case "processing":
                return {
                    label: "Processing",
                    className:
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                };
            case "configuring":
                return {
                    label: "Failed",
                    className: "bg-destructive/10 text-destructive",
                };
            default:
                return {
                    label: status,
                    className: "bg-muted text-muted-foreground",
                };
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 60) return "text-amber-500";
        return "text-red-500";
    };

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
            {/* Welcome + Quick Start */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                        Welcome back
                        {session?.user.name
                            ? `, ${session.user.name.split(" ")[0]}`
                            : ""}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Ready to ace your next interview?
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Link
                        to="/interview/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all shadow-sm shadow-primary/20"
                    >
                        <IconPlus className="w-4 h-4" />
                        Start Interview
                    </Link>
                </motion.div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    {
                        icon: IconHistory,
                        label: "Total Interviews",
                        value: String(interviews.length),
                        color: "text-blue-500",
                        bgColor: "bg-blue-500/10",
                    },
                    {
                        icon: IconTrendingUp,
                        label: "Avg. Score",
                        value: avgScore ? `${avgScore}/100` : "—",
                        color: "text-emerald-500",
                        bgColor: "bg-emerald-500/10",
                    },
                    {
                        icon: IconFlame,
                        label: "Streak",
                        value: "0 days",
                        color: "text-orange-500",
                        bgColor: "bg-orange-500/10",
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}
                            >
                                <stat.icon
                                    className={`w-5 h-5 ${stat.color}`}
                                />
                            </div>
                            <div>
                                <p className="font-heading text-xl font-bold text-foreground leading-none">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Active interviews banner */}
            {activeInterviews.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                            <IconPlayerPlay className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                                You have {activeInterviews.length} active
                                interview
                                {activeInterviews.length > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Continue where you left off
                            </p>
                        </div>
                        <Link
                            to={
                                activeInterviews[0].status === "processing"
                                    ? "/interview/$interviewId/processing"
                                    : "/interview/$interviewId"
                            }
                            params={{ interviewId: activeInterviews[0].id }}
                            className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                        >
                            Resume <IconChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Interview History */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                        Recent Interviews
                    </h2>
                    {interviews.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {interviews.length} total
                        </span>
                    )}
                </div>

                {loading ? (
                    <section aria-busy="true" aria-live="polite">
                        <AppLoader
                            label="Loading recent interviews"
                            className="min-h-[260px] rounded-xl border border-border bg-card"
                        />
                    </section>
                ) : interviews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-xl p-12 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                            <IconHistory className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                            No interviews yet
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1 mb-6 max-w-sm mx-auto">
                            Start your first mock interview to begin improving
                            your skills
                        </p>
                        <Link
                            to="/interview/new"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all"
                        >
                            <IconPlus className="w-4 h-4" /> Start Interview
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {interviews.map((interview: any, i: number) => {
                            const isCompleted =
                                interview.status === "completed";
                            const isConfiguring =
                                interview.status === "configuring";
                            const statusConfig = getStatusConfig(
                                interview.status,
                            );
                            const recordingUrl =
                                interview.recording?.videoUrl ||
                                interview.recording?.audioUrl;

                            if (isConfiguring) {
                                return (
                                    <motion.div
                                        key={interview.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="relative bg-card border border-destructive/20 rounded-xl p-5 group"
                                    >
                                        {/* Failed state card */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                                                    <IconAlertTriangle className="w-4 h-4 text-destructive" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-foreground leading-tight">
                                                        {interview.roleTitle}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {interview.seniority}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig.className}`}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            Question generation failed. You can
                                            retry or remove this interview.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to="/interview/new"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all"
                                            >
                                                <IconRefresh className="w-3 h-3" />
                                                Retry
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    handleDeleteConfiguring(
                                                        interview.id,
                                                    )
                                                }
                                                disabled={
                                                    deletingId === interview.id
                                                }
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all cursor-pointer disabled:opacity-40"
                                            >
                                                {deletingId === interview.id ? (
                                                    <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                                                ) : (
                                                    <IconTrash className="w-3 h-3" />
                                                )}
                                                Delete
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.div
                                    key={interview.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
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
                                        className="block bg-card border border-border rounded-xl p-5 hover:border-primary/25 hover:shadow-sm hover:shadow-primary/5 transition-all group h-full"
                                    >
                                        {/* Card header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                                                    <IconVideo className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-medium text-foreground leading-tight truncate">
                                                        {interview.roleTitle}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {interview.seniority}
                                                    </p>
                                                </div>
                                            </div>
                                            {interview.report?.overallScore !=
                                                null && (
                                                <span
                                                    className={`text-lg font-bold tabular-nums ${getScoreColor(interview.report.overallScore)}`}
                                                >
                                                    {
                                                        interview.report
                                                            .overallScore
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        {/* Interview types */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {interview.interviewTypes
                                                ?.slice(0, 3)
                                                .map((type: string) => (
                                                    <span
                                                        key={type}
                                                        className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
                                                    >
                                                        {type.replace(
                                                            /_/g,
                                                            " ",
                                                        )}
                                                    </span>
                                                ))}
                                            {interview.interviewTypes?.length >
                                                3 && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                                                    +
                                                    {interview.interviewTypes
                                                        .length - 3}
                                                </span>
                                            )}
                                        </div>

                                        {/* Card footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig.className}`}
                                                >
                                                    {statusConfig.label}
                                                </span>
                                                {recordingUrl && (
                                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                        <IconPlayerPlay className="w-3 h-3" />
                                                        Recording
                                                    </span>
                                                )}
                                                {interview.createdAt && (
                                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                                        <IconCalendar className="w-3 h-3" />
                                                        {formatDate(
                                                            interview.createdAt,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <IconChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Free plan usage nudge */}
            {plan === "free" && interviewCount >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 p-5 rounded-xl bg-primary/5 border border-primary/15"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {!canStartInterview()
                                    ? "You've used all free interviews"
                                    : `${maxInterviews - interviewCount} free interview${maxInterviews - interviewCount !== 1 ? "s" : ""} remaining`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Upgrade to unlock unlimited interviews, voice
                                mode, and expert-level feedback
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            className="shrink-0 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all"
                        >
                            Upgrade to Pro
                        </Link>
                    </div>
                </motion.div>
            )}
        </main>
    );
}
