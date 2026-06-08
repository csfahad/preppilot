import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts";
import {
    IconShare,
    IconLock,
    IconCheck,
    IconX,
    IconChevronDown,
    IconChevronUp,
    IconStar,
    IconTrendingUp,
    IconAlertTriangle,
} from "@tabler/icons-react";

export const Route = createFileRoute(
    "/_authenticated/interview/$interviewId/report",
)({
    component: ReportPage,
});

function ReportPage() {
    const { interviewId } = Route.useParams();
    const { modelAnswers: canSeeModels, fullFeedback } = useSubscriptionStore();
    const [interview, setInterview] = useState<any>(null);
    const [scores, setScores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedQ, setExpandedQ] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [interviewRes, scoresRes] = await Promise.all([
                    api.getInterview(interviewId),
                    api.getInterviewScores(interviewId),
                ]);
                setInterview(interviewRes.data);
                setScores(scoresRes.data || []);
            } catch (err) {
                console.error("Report load error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [interviewId]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const report = interview?.report;
    const radarData = report?.radarScores
        ? Object.entries(report.radarScores).map(([key, value]) => ({
              subject: key,
              score: value as number,
              fullMark: 100,
          }))
        : [];

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div />
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors cursor-pointer">
                    <IconShare className="w-4 h-4" /> Share
                </button>
            </div>

            {report && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-8 mb-8 text-center"
                >
                    <p className="text-sm text-muted-foreground mb-2">
                        {interview.roleTitle} • {interview.seniority}
                    </p>
                    <div className="relative inline-block mb-4">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                            className={`font-heading text-7xl font-bold ${report.overallScore >= 70 ? "text-green-500" : report.overallScore >= 50 ? "text-yellow-500" : "text-red-500"}`}
                        >
                            {report.overallScore}
                        </motion.span>
                        <span className="text-2xl text-muted-foreground font-heading">
                            /100
                        </span>
                    </div>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        {report.summaryText?.split("\n")[0]}
                    </p>
                </motion.div>
            )}

            {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border rounded-2xl p-6"
                    >
                        <h3 className="font-heading font-semibold text-foreground mb-4">
                            Performance Radar
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{
                                        fill: "var(--muted-foreground)",
                                        fontSize: 12,
                                    }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={false}
                                    axisLine={false}
                                />
                                <Radar
                                    name="Score"
                                    dataKey="score"
                                    stroke="var(--primary)"
                                    fill="var(--primary)"
                                    fillOpacity={0.2}
                                    strokeWidth={2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 mb-3">
                                <IconStar className="w-5 h-5 text-green-500" />{" "}
                                Strengths
                            </h3>
                            <ul className="space-y-2">
                                {report.strengths?.map(
                                    (s: string, i: number) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                            <IconCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            {s}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 mb-3">
                                <IconTrendingUp className="w-5 h-5 text-yellow-500" />{" "}
                                Areas to Improve
                            </h3>
                            <ul className="space-y-2">
                                {report.weaknesses?.map(
                                    (w: string, i: number) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                            <IconAlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                            {w}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            )}

            <h3 className="font-heading text-xl font-semibold text-foreground mb-4">
                Answer Breakdown
            </h3>
            <div className="space-y-3">
                {scores.map((question: any, i: number) => {
                    const answer = question.answers?.[0];
                    const score = answer?.score;
                    const isExpanded = expandedQ === question.id;
                    return (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="bg-card border border-border rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() =>
                                    setExpandedQ(
                                        isExpanded ? null : question.id,
                                    )
                                }
                                className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <span className="text-sm font-medium text-muted-foreground w-8">
                                        Q{i + 1}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                            question.type === "behavioral"
                                                ? "bg-blue-500/10 text-blue-600"
                                                : question.type ===
                                                    "technical_coding"
                                                  ? "bg-purple-500/10 text-purple-600"
                                                  : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {question.type?.replace("_", " ")}
                                    </span>
                                    <p className="text-sm text-foreground truncate">
                                        {question.text}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {score && (
                                        <span
                                            className={`text-lg font-bold ${score.overall >= 7 ? "text-green-500" : score.overall >= 5 ? "text-yellow-500" : "text-red-500"}`}
                                        >
                                            {score.overall}/10
                                        </span>
                                    )}
                                    {isExpanded ? (
                                        <IconChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <IconChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            </button>
                            {isExpanded && score && (
                                <div className="px-5 pb-5 border-t border-border pt-4">
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {[
                                            {
                                                label: "Clarity",
                                                value: score.clarity,
                                            },
                                            {
                                                label: "Relevance",
                                                value: score.relevance,
                                            },
                                            {
                                                label: "Depth",
                                                value: score.depth,
                                            },
                                            {
                                                label: "Structure",
                                                value: score.structure,
                                            },
                                            {
                                                label: "Technical",
                                                value: score.technicalAccuracy,
                                            },
                                            {
                                                label: "Confidence",
                                                value: score.confidence,
                                            },
                                        ].map((dim) => (
                                            <div key={dim.label}>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">
                                                        {dim.label}
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {dim.value}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${dim.value >= 7 ? "bg-green-500" : dim.value >= 5 ? "bg-yellow-500" : "bg-red-500"}`}
                                                        style={{
                                                            width: `${dim.value * 10}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {score.starCompliance !== null && (
                                        <div className="flex items-center gap-2 mb-3 text-sm">
                                            {score.starCompliance ? (
                                                <>
                                                    <IconCheck className="w-4 h-4 text-green-500" />{" "}
                                                    <span className="text-green-600">
                                                        STAR format detected
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <IconX className="w-4 h-4 text-red-500" />{" "}
                                                    <span className="text-red-500">
                                                        STAR format missing
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <div className="bg-muted/50 rounded-xl p-4 mb-3">
                                        <p className="text-sm text-foreground">
                                            {score.feedbackText}
                                        </p>
                                    </div>
                                    {score.modelAnswer && (
                                        <div
                                            className={`rounded-xl p-4 relative ${canSeeModels ? "bg-primary/5 border border-primary/10" : "bg-muted/30"}`}
                                        >
                                            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                                                {canSeeModels ? (
                                                    <IconStar className="w-3.5 h-3.5" />
                                                ) : (
                                                    <IconLock className="w-3.5 h-3.5" />
                                                )}{" "}
                                                Model Answer
                                            </p>
                                            {canSeeModels ? (
                                                <p className="text-sm text-foreground">
                                                    {score.modelAnswer}
                                                </p>
                                            ) : (
                                                <>
                                                    <div className="blur-sm select-none pointer-events-none">
                                                        <p className="text-sm text-foreground">
                                                            {score.modelAnswer}
                                                        </p>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Link
                                                            to="/pricing"
                                                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                                                        >
                                                            Upgrade to see model
                                                            answers
                                                        </Link>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {score.improvementTips?.length > 0 &&
                                        fullFeedback && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                    Quick Fixes
                                                </p>
                                                <ul className="space-y-1">
                                                    {score.improvementTips.map(
                                                        (
                                                            tip: string,
                                                            j: number,
                                                        ) => (
                                                            <li
                                                                key={j}
                                                                className="text-sm text-muted-foreground flex items-start gap-2"
                                                            >
                                                                <span className="text-primary">
                                                                    →
                                                                </span>{" "}
                                                                {tip}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                    to="/interview/new"
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
                >
                    Start Another Interview
                </Link>
                <Link
                    to="/dashboard"
                    className="px-6 py-3 rounded-xl border border-border text-foreground hover:bg-accent transition-all"
                >
                    Back to Dashboard
                </Link>
            </div>
        </main>
    );
}
