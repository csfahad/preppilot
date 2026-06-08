import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { INTERVIEW_TYPES } from "@repo/shared/constants/interview-types";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import {
    IconTrendingUp,
    IconTrendingDown,
    IconMinus,
    IconCalendar,
    IconTarget,
} from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/analytics/")({
    component: AnalyticsPage,
});

function AnalyticsPage() {
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.listInterviews()
            .then((res) => {
                setInterviews(res.data || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const completed = interviews.filter(
        (i: any) => i.status === "completed" && i.report,
    );

    // score over time data
    const scoreOverTime = completed
        .sort(
            (a: any, b: any) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        )
        .map((i: any, idx: number) => ({
            name: `#${idx + 1}`,
            score: i.report?.overallScore || 0,
            date: new Date(i.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
            }),
        }));

    // score by type
    const typeScores = new Map<string, { total: number; count: number }>();
    completed.forEach((i: any) => {
        (i.interviewTypes || []).forEach((type: string) => {
            const current = typeScores.get(type) ?? { total: 0, count: 0 };
            current.total += i.report?.overallScore || 0;
            current.count += 1;
            typeScores.set(type, current);
        });
    });
    const interviewTypeLabels = Object.fromEntries(
        INTERVIEW_TYPES.map((t) => [t.id, t.label]),
    );
    const typeData = Array.from(typeScores.entries()).map(([type, data]) => ({
        type:
            interviewTypeLabels[type] ??
            type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        avgScore: Math.round(data.total / data.count),
    }));

    // Radar: aggregate radar scores
    const radarTotals = new Map<string, { total: number; count: number }>();
    completed.forEach((i: any) => {
        if (i.report?.radarScores) {
            Object.entries(i.report.radarScores).forEach(([key, val]) => {
                const current = radarTotals.get(key) ?? {
                    total: 0,
                    count: 0,
                };
                current.total += val as number;
                current.count += 1;
                radarTotals.set(key, current);
            });
        }
    });
    const radarData = Array.from(radarTotals.entries()).map(
        ([subject, data]) => ({
            subject,
            score: Math.round(data.total / data.count),
            fullMark: 100,
        }),
    );

    // trend
    const recentScores = scoreOverTime.slice(-5);
    const olderScores = scoreOverTime.slice(-10, -5);
    const recentAvg =
        recentScores.length > 0
            ? recentScores.reduce((s: number, d: any) => s + d.score, 0) /
              recentScores.length
            : 0;
    const olderAvg =
        olderScores.length > 0
            ? olderScores.reduce((s: number, d: any) => s + d.score, 0) /
              olderScores.length
            : 0;
    const trend = recentAvg - olderAvg;

    const avgScore =
        completed.length > 0
            ? Math.round(
                  completed.reduce(
                      (s: number, i: any) => s + (i.report?.overallScore || 0),
                      0,
                  ) / completed.length,
              )
            : 0;

    const bestScore =
        completed.length > 0
            ? Math.max(
                  ...completed.map((i: any) => i.report?.overallScore || 0),
              )
            : 0;

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground">
                        Performance Analytics
                    </h1>
                </div>
            </div>

            {completed.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                    <IconTarget className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                        No data yet
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Complete at least one interview to see your analytics
                    </p>
                    <Link
                        to="/interview/new"
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
                    >
                        Start Interview
                    </Link>
                </div>
            ) : (
                <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            {
                                label: "Total Completed",
                                value: String(completed.length),
                                icon: IconCalendar,
                                color: "text-blue-500",
                            },
                            {
                                label: "Average Score",
                                value: `${avgScore}/100`,
                                icon: IconTarget,
                                color: "text-green-500",
                            },
                            {
                                label: "Best Score",
                                value: `${bestScore}/100`,
                                icon: IconTrendingUp,
                                color: "text-purple-500",
                            },
                            {
                                label: "Trend",
                                value:
                                    trend > 0
                                        ? `+${Math.round(trend)}`
                                        : trend < 0
                                          ? `${Math.round(trend)}`
                                          : "—",
                                icon:
                                    trend > 0
                                        ? IconTrendingUp
                                        : trend < 0
                                          ? IconTrendingDown
                                          : IconMinus,
                                color:
                                    trend > 0
                                        ? "text-green-500"
                                        : trend < 0
                                          ? "text-red-500"
                                          : "text-muted-foreground",
                            },
                        ].map((stat) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-xl p-5"
                            >
                                <stat.icon
                                    className={`w-5 h-5 ${stat.color} mb-3`}
                                />
                                <p className="font-heading text-2xl font-bold text-foreground">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Score over time */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-2xl p-6"
                        >
                            <h3 className="font-heading font-semibold text-foreground mb-4">
                                Score Over Time
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={scoreOverTime}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{
                                            fill: "var(--muted-foreground)",
                                            fontSize: 12,
                                        }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{
                                            fill: "var(--muted-foreground)",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: 8,
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="var(--primary)"
                                        strokeWidth={2.5}
                                        dot={{
                                            fill: "var(--primary)",
                                            r: 4,
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Radar */}
                        {radarData.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card border border-border rounded-2xl p-6"
                            >
                                <h3 className="font-heading font-semibold text-foreground mb-4">
                                    Skill Breakdown
                                </h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="var(--border)" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{
                                                fill: "var(--muted-foreground)",
                                                fontSize: 11,
                                            }}
                                        />
                                        <PolarRadiusAxis
                                            angle={30}
                                            domain={[0, 100]}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Radar
                                            dataKey="score"
                                            stroke="var(--primary)"
                                            fill="var(--primary)"
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}
                    </div>

                    {/* Score by question type */}
                    {typeData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card border border-border rounded-2xl p-6"
                        >
                            <h3 className="font-heading font-semibold text-foreground mb-4">
                                Average Score by Question Type
                            </h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={typeData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="type"
                                        tick={{
                                            fill: "var(--muted-foreground)",
                                            fontSize: 12,
                                        }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{
                                            fill: "var(--muted-foreground)",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: 8,
                                        }}
                                    />
                                    <Bar
                                        dataKey="avgScore"
                                        fill="var(--primary)"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </>
            )}
        </main>
    );
}
