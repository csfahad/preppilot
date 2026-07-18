import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { AppLoader } from "@/components/app-loader";
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
    IconVideo,
    IconMicrophone,
    IconPlayerPause,
    IconPlayerPlay,
    IconVolume,
    IconVolumeOff,
    IconMaximize,
    IconMinimize,
    IconBrandLinkedin,
    IconBrandX,
    IconBrandReddit,
    IconCopy,
    IconExternalLink,
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
    const [shareOpen, setShareOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const [creatingShare, setCreatingShare] = useState(false);
    const shareRequestRef = useRef<Promise<string | null> | null>(null);
    const report = interview?.report;
    const recording = interview?.recording;
    const recordingUrl = recording?.videoUrl || recording?.audioUrl;
    const hasShareableReport = Boolean(report);
    const shareText = report
        ? `I scored ${report.overallScore}/100 on my ${interview?.roleTitle ?? "mock interview"} practice report with PrepPilot.`
        : "Review my PrepPilot interview report.";

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

    const createShareUrl = useCallback(() => {
        if (!shareRequestRef.current) {
            shareRequestRef.current = api
                .createReportShare(interviewId)
                .then((res) => {
                    const token = res.data?.token;
                    return token
                        ? `${window.location.origin}/share/${token}`
                        : null;
                })
                .finally(() => {
                    shareRequestRef.current = null;
                });
        }

        return shareRequestRef.current;
    }, [interviewId]);

    useEffect(() => {
        if (!hasShareableReport || shareUrl) return;

        let cancelled = false;

        createShareUrl()
            .then((url) => {
                if (!cancelled && url) {
                    setShareUrl(url);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("Share link preload error:", err);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [createShareUrl, hasShareableReport, shareUrl]);

    useEffect(() => {
        return () => {
            shareRequestRef.current = null;
        };
    }, []);

    if (loading) {
        return <AppLoader label="Loading interview report" />;
    }

    const radarData = report?.radarScores
        ? Object.entries(report.radarScores).map(([key, value]) => ({
              subject: key,
              score: value as number,
              fullMark: 100,
          }))
        : [];
    const encodedShareUrl = encodeURIComponent(shareUrl ?? "");
    const encodedShareText = encodeURIComponent(shareText);
    const encodedLinkedInText = encodeURIComponent(
        shareUrl ? `${shareText} ${shareUrl}` : shareText,
    );

    const handleShare = async () => {
        setShareOpen(true);
        setShareMessage(null);

        if (shareUrl) return;

        setCreatingShare(true);
        try {
            const url = await createShareUrl();
            if (!url) throw new Error("Unable to create share link.");
            setShareUrl(url);

            if ("share" in navigator) {
                await navigator
                    .share({
                        title: "PrepPilot interview report",
                        text: shareText,
                        url,
                    })
                    .catch(() => {});
            }
        } catch (err) {
            setShareMessage(
                err instanceof Error
                    ? err.message
                    : "Unable to create share link.",
            );
        } finally {
            setCreatingShare(false);
        }
    };

    const handleCopyShare = async () => {
        if (!shareUrl) return;

        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Share link copied.");
    };

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full overflow-x-hidden">
            <div className="relative flex items-center justify-between mb-8">
                <div />
                <button
                    onClick={handleShare}
                    disabled={!report || creatingShare}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <IconShare className="w-4 h-4" /> Share
                </button>
                {shareOpen && (
                    <div className="absolute right-0 top-12 z-20 w-[min(360px,calc(100vw-3rem))] rounded-xl border border-border bg-card p-4 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-heading text-sm font-semibold text-foreground">
                                    Share report
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Create a signed public link for this report.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShareOpen(false)}
                                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                aria-label="Close share panel"
                            >
                                <IconX className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 rounded-lg border border-border bg-background p-3">
                            <p className="truncate text-xs text-muted-foreground">
                                {creatingShare
                                    ? "Creating secure link..."
                                    : shareUrl || "Share link unavailable"}
                            </p>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleCopyShare}
                                disabled={!shareUrl}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                            >
                                <IconCopy className="h-4 w-4" />
                                Copy link
                            </button>
                            <a
                                href={
                                    shareUrl
                                        ? `https://www.linkedin.com/feed/?shareActive=true&text=${encodedLinkedInText}`
                                        : undefined
                                }
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent ${shareUrl ? "" : "pointer-events-none opacity-50"}`}
                            >
                                <IconBrandLinkedin className="h-4 w-4" />
                                LinkedIn
                            </a>
                            <a
                                href={
                                    shareUrl
                                        ? `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedShareUrl}`
                                        : undefined
                                }
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent ${shareUrl ? "" : "pointer-events-none opacity-50"}`}
                            >
                                <IconBrandX className="h-4 w-4" />X
                            </a>
                            <a
                                href={
                                    shareUrl
                                        ? `https://www.reddit.com/submit?url=${encodedShareUrl}&title=${encodedShareText}`
                                        : undefined
                                }
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent ${shareUrl ? "" : "pointer-events-none opacity-50"}`}
                            >
                                <IconBrandReddit className="h-4 w-4" />
                                Reddit
                            </a>
                        </div>

                        {shareUrl && (
                            <a
                                href={shareUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                            >
                                Open public report
                                <IconExternalLink className="h-3.5 w-3.5" />
                            </a>
                        )}
                        {shareMessage && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                {shareMessage}
                            </p>
                        )}
                    </div>
                )}
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

            {recordingUrl && (
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden mb-8"
                >
                    <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                                {recording.videoUrl ? (
                                    <IconVideo className="w-5 h-5 text-primary" />
                                ) : (
                                    <IconMicrophone className="w-5 h-5 text-primary" />
                                )}
                                Interview Recording
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Review your realtime session alongside the
                                feedback.
                            </p>
                        </div>
                        {recording.durationSeconds && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                                {Math.round(recording.durationSeconds / 60)} min
                            </span>
                        )}
                    </div>
                    <div className="p-4 sm:p-6">
                        <RecordingPlayer
                            src={recordingUrl}
                            type={recording.videoUrl ? "video" : "audio"}
                            durationHint={recording.durationSeconds}
                        />
                    </div>
                </motion.section>
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

function formatMediaTime(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${mins}:${secs}`;
}

function RecordingPlayer({
    src,
    type,
    durationHint,
}: {
    src: string;
    type: "video" | "audio";
    durationHint?: number | null;
}) {
    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
    const shellRef = useRef<HTMLDivElement>(null);
    const previewSeekRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(
        Number.isFinite(durationHint) && durationHint ? durationHint : 0,
    );
    const [volume, setVolume] = useState(0.85);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const effectiveDuration =
        duration > 0
            ? duration
            : Number.isFinite(durationHint) && durationHint
              ? durationHint
              : 0;
    const progress =
        effectiveDuration > 0
            ? Math.min((currentTime / effectiveDuration) * 100, 100)
            : 0;

    useEffect(() => {
        if (Number.isFinite(durationHint) && durationHint) {
            setDuration((current) => (current > 0 ? current : durationHint));
        }
    }, [durationHint]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const nextIsFullscreen =
                document.fullscreenElement === shellRef.current;
            setIsFullscreen(nextIsFullscreen);

            if (!nextIsFullscreen && screen.orientation?.unlock) {
                screen.orientation.unlock();
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
            if (screen.orientation?.unlock) {
                screen.orientation.unlock();
            }
        };
    }, []);

    const syncDuration = () => {
        const media = mediaRef.current;
        if (!media) return;

        if (Number.isFinite(media.duration) && media.duration > 0) {
            setDuration(media.duration);
            return;
        }

        if (Number.isFinite(durationHint) && durationHint) {
            setDuration(durationHint);
        }
    };

    const togglePlayback = async () => {
        const media = mediaRef.current;
        if (!media) return;

        if (media.paused) {
            await media.play();
        } else {
            media.pause();
        }
    };

    const toggleMute = () => {
        const media = mediaRef.current;
        if (!media) return;

        media.muted = !media.muted;
        setIsMuted(media.muted);
    };

    const changeVolume = (value: number) => {
        const media = mediaRef.current;
        if (!media) return;

        const nextVolume = Math.min(Math.max(value, 0), 1);
        media.volume = nextVolume;
        media.muted = value === 0;
        setVolume(nextVolume);
        setIsMuted(media.muted);
    };

    const seek = (value: number) => {
        const media = mediaRef.current;
        if (!media || !effectiveDuration) return;

        const nextTime = (value / 100) * effectiveDuration;
        if ("fastSeek" in media && typeof media.fastSeek === "function") {
            media.fastSeek(nextTime);
        } else {
            media.currentTime = nextTime;
        }
        setCurrentTime(media.currentTime);
    };

    const toggleFullscreen = async () => {
        if (type === "audio") return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }

        try {
            await shellRef.current?.requestFullscreen();
            await screen.orientation?.lock?.("landscape");
        } catch (error) {
            console.warn("Unable to enter landscape fullscreen", error);
        }
    };

    const sharedMediaProps = {
        ref: mediaRef as any,
        src,
        preload: "auto",
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        onEnded: () => setIsPlaying(false),
        onLoadedMetadata: () => {
            const media = mediaRef.current;
            if (!media) return;
            media.volume = volume;
            syncDuration();

            if (
                type === "video" &&
                !previewSeekRef.current &&
                media.currentTime === 0
            ) {
                previewSeekRef.current = true;
                const previewTime = effectiveDuration
                    ? Math.min(1, Math.max(0.1, effectiveDuration * 0.02))
                    : 0.1;
                media.currentTime = previewTime;
            }
        },
        onDurationChange: syncDuration,
        onSeeked: () => {
            const media = mediaRef.current;
            if (!media) return;
            setCurrentTime(media.currentTime);
        },
        onTimeUpdate: () => {
            const media = mediaRef.current;
            if (!media) return;
            setCurrentTime(media.currentTime);
        },
        onVolumeChange: () => {
            const media = mediaRef.current;
            if (!media) return;
            setVolume(media.volume);
            setIsMuted(media.muted || media.volume === 0);
        },
    };

    return (
        <div
            ref={shellRef}
            className={`recording-player mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-zinc-950 shadow-lg shadow-black/10 ${
                isFullscreen ? "recording-player--fullscreen" : ""
            }`}
        >
            <div
                className={
                    type === "video"
                        ? "recording-player__stage relative aspect-video bg-black"
                        : "relative flex min-h-52 items-center justify-center bg-[linear-gradient(135deg,#0a0a0a,#1f2937)]"
                }
            >
                {type === "video" ? (
                    <video
                        {...sharedMediaProps}
                        playsInline
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <>
                        <audio {...sharedMediaProps} />
                        <div className="flex flex-col items-center gap-3 text-white/85">
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10">
                                <IconMicrophone className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-sm font-semibold">
                                Audio recording
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="recording-player__toolbar bg-zinc-950 px-3 py-3 text-white sm:px-4">
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onInput={(event) => seek(Number(event.currentTarget.value))}
                    onChange={(event) => seek(Number(event.target.value))}
                    disabled={!effectiveDuration}
                    aria-label="Seek recording"
                    className="h-1.5 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="mt-3 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={togglePlayback}
                            aria-label={
                                isPlaying ? "Pause recording" : "Play recording"
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            {isPlaying ? (
                                <IconPlayerPause className="h-5 w-5" />
                            ) : (
                                <IconPlayerPlay className="h-5 w-5" />
                            )}
                        </button>
                        <span className="min-w-20 text-xs font-medium text-white/75 sm:min-w-24">
                            {formatMediaTime(currentTime)} /{" "}
                            {formatMediaTime(effectiveDuration)}
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <button
                            type="button"
                            onClick={toggleMute}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            {isMuted ? (
                                <IconVolumeOff className="h-4 w-4" />
                            ) : (
                                <IconVolume className="h-4 w-4" />
                            )}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : volume}
                            onInput={(event) =>
                                changeVolume(Number(event.currentTarget.value))
                            }
                            onChange={(event) =>
                                changeVolume(Number(event.target.value))
                            }
                            aria-label="Volume"
                            className="hidden h-1.5 w-24 cursor-pointer accent-primary sm:block"
                        />
                        {type === "video" && (
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                aria-label={
                                    isFullscreen
                                        ? "Exit fullscreen"
                                        : "Open fullscreen"
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                {isFullscreen ? (
                                    <IconMinimize className="h-4 w-4" />
                                ) : (
                                    <IconMaximize className="h-4 w-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
