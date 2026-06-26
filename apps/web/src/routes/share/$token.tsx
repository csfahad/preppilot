import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts";
import {
    IconArrowRight,
    IconChartBar,
    IconCheck,
    IconSparkles,
    IconTrendingUp,
} from "@tabler/icons-react";

export const Route = createFileRoute("/share/$token")({
    component: SharedReportPage,
});

type SharedReport = {
    id: string;
    roleTitle: string;
    seniority: string;
    interviewTypes: string[];
    durationMinutes: number;
    createdAt: string;
    report: {
        summaryText: string;
        radarScores: Record<string, number>;
        strengths: string[];
        weaknesses: string[];
        overallScore: number;
    };
};

function SharedReportPage() {
    const { token } = Route.useParams();
    const [report, setReport] = useState<SharedReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadSharedReport() {
            try {
                const res = await api.getSharedReport(token);
                setReport((res.data ?? null) as SharedReport | null);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "This shared report is unavailable.",
                );
            } finally {
                setLoading(false);
            }
        }

        void loadSharedReport();
    }, [token]);

    const radarData = report
        ? Object.entries(report.report.radarScores).map(([key, value]) => ({
              subject: key,
              score: value,
              fullMark: 100,
          }))
        : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <PublicHeader />
                <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                </main>
            </div>
        );
    }

    if (!report || error) {
        return (
            <div className="min-h-screen bg-background">
                <PublicHeader />
                <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-6 text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-destructive/10">
                        <IconChartBar className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="font-heading text-3xl font-bold text-foreground">
                        Shared report unavailable
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                        {error ||
                            "This link may be invalid, or the report may no longer be available."}
                    </p>
                    <Link
                        to="/"
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Go to PrepPilot
                        <IconArrowRight className="h-4 w-4" />
                    </Link>
                </main>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main>
                <section className="border-b border-border bg-muted/20">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                                <IconSparkles className="h-4 w-4" />
                                Shared PrepPilot report
                            </div>
                            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
                                {report.roleTitle}
                            </h1>
                            <p className="mt-4 max-w-xl text-muted-foreground">
                                {report.seniority} practice interview ·{" "}
                                {report.durationMinutes} minutes ·{" "}
                                {new Date(report.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    },
                                )}
                            </p>
                            <Link
                                to="/auth/login"
                                search={{ error: undefined }}
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                Practice your own interview
                                <IconArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <p className="text-sm text-muted-foreground">
                                Overall score
                            </p>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="font-heading text-7xl font-bold text-primary">
                                    {report.report.overallScore}
                                </span>
                                <span className="pb-3 font-heading text-2xl text-muted-foreground">
                                    /100
                                </span>
                            </div>
                            <p className="mt-5 max-w-2xl text-muted-foreground">
                                {report.report.summaryText.split("\n")[0]}
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="font-heading text-xl font-semibold text-foreground">
                            Performance Radar
                        </h2>
                        <div className="mt-4 h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
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
                        </div>
                    </div>

                    <div className="space-y-4">
                        <InsightList
                            title="Strengths"
                            icon={IconCheck}
                            items={report.report.strengths}
                        />
                        <InsightList
                            title="Areas to Improve"
                            icon={IconTrendingUp}
                            items={report.report.weaknesses}
                        />
                    </div>
                </section>
            </main>
            <PublicFooter />
        </div>
    );
}

function InsightList({
    title,
    icon: Icon,
    items,
}: {
    title: string;
    icon: typeof IconCheck;
    items: string[];
}) {
    return (
        <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </h2>
            <ul className="mt-4 space-y-3">
                {items.map((item) => (
                    <li
                        key={item}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                    </li>
                ))}
            </ul>
        </section>
    );
}
