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
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border bg-muted/25 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                            Recent Interviews
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review recordings, reports, and sessions that need
                            attention.
                        </p>
                    </div>
                    {interviews.length > 0 && (
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            <IconHistory className="h-3.5 w-3.5" />
                            {interviews.length} total
                        </div>
                    )}
                </div>

                {loading ? (
                    <section aria-busy="true" aria-live="polite">
                        <AppLoader
                            label="Loading recent interviews"
                            className="min-h-[320px] bg-card"
                        />
                    </section>
                ) : interviews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-6 py-14 text-center"
                    >
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <IconVideo className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-foreground">
                            Start with a camera-on practice round
                        </h3>
                        <p className="mx-auto mt-2 mb-7 max-w-md text-sm leading-6 text-muted-foreground">
                            Your completed sessions will appear here with the
                            report, recording status, and score evidence in one
                            place.
                        </p>
                        <Link
                            to="/interview/new"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                        >
                            <IconPlus className="h-4 w-4" /> Start Interview
                        </Link>
                    </motion.div>
                ) : (
                    <div className="divide-y divide-border">
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
                                        className="bg-destructive/5 px-5 py-5 sm:px-6"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                                                    <IconAlertTriangle className="h-5 w-5 text-destructive" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                        <h4 className="truncate text-sm font-semibold text-foreground">
                                                            {
                                                                interview.roleTitle
                                                            }
                                                        </h4>
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.className}`}
                                                        >
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Question generation
                                                        failed. Retry setup or
                                                        remove this unfinished
                                                        interview.
                                                    </p>
                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                        {interview.seniority ||
                                                            "Interview setup"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Link
                                                    to="/interview/new"
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
                                                >
                                                    <IconRefresh className="h-3.5 w-3.5" />
                                                    Retry
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteConfiguring(
                                                            interview.id,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        interview.id
                                                    }
                                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    {deletingId ===
                                                    interview.id ? (
                                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                                    ) : (
                                                        <IconTrash className="h-3.5 w-3.5" />
                                                    )}
                                                    Delete
                                                </button>
                                            </div>
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
                                        className="group block px-5 py-5 transition-colors hover:bg-muted/30 sm:px-6"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-950 text-primary">
                                                    <IconVideo className="h-5 w-5" />
                                                    {recordingUrl && (
                                                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                        <h4 className="truncate text-sm font-semibold text-foreground">
                                                            {
                                                                interview.roleTitle
                                                            }
                                                        </h4>
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.className}`}
                                                        >
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {interview.seniority ||
                                                            "Practice session"}
                                                        {interview.createdAt
                                                            ? ` · ${formatDate(interview.createdAt)}`
                                                            : ""}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {interview.interviewTypes
                                                            ?.slice(0, 3)
                                                            .map(
                                                                (
                                                                    type: string,
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            type
                                                                        }
                                                                        className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium capitalize text-muted-foreground"
                                                                    >
                                                                        {type.replace(
                                                                            /_/g,
                                                                            " ",
                                                                        )}
                                                                    </span>
                                                                ),
                                                            )}
                                                        {interview
                                                            .interviewTypes
                                                            ?.length > 3 && (
                                                            <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                                                                +
                                                                {interview
                                                                    .interviewTypes
                                                                    .length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 lg:justify-end">
                                                <div className="flex items-center gap-2">
                                                    {recordingUrl && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                                                            <IconPlayerPlay className="h-3 w-3" />
                                                            Recording
                                                        </span>
                                                    )}
                                                    {interview.createdAt && (
                                                        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                                                            <IconCalendar className="h-3.5 w-3.5" />
                                                            {formatDate(
                                                                interview.createdAt,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex shrink-0 items-center gap-3">
                                                    {interview.report
                                                        ?.overallScore !=
                                                    null ? (
                                                        <div className="min-w-16 rounded-xl bg-background px-3 py-2 text-center">
                                                            <p
                                                                className={`text-lg font-bold leading-none tabular-nums ${getScoreColor(interview.report.overallScore)}`}
                                                            >
                                                                {
                                                                    interview
                                                                        .report
                                                                        .overallScore
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                                                Score
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="min-w-16 rounded-xl bg-background px-3 py-2 text-center">
                                                            <p className="text-lg font-bold leading-none text-muted-foreground">
                                                                -
                                                            </p>
                                                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                                                Pending
                                                            </p>
                                                        </div>
                                                    )}
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all group-hover:border-primary/30 group-hover:text-primary">
                                                        <IconChevronRight className="h-4 w-4" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

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
