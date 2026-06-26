import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription";
import { INTERVIEW_TYPES } from "@repo/shared/constants/interview-types";
import type { InterviewTypeId } from "@repo/shared/constants/interview-types";
import {
    INTERVIEWER_TONES,
    VOICE_ACCENTS,
} from "@repo/shared/constants/taxonomy";
import type { VoiceAccentId } from "@repo/shared/constants/taxonomy";
import {
    IconRocket,
    IconVolume,
    IconCheck,
    IconVideo,
    IconAlertTriangle,
} from "@tabler/icons-react";

type NewInterviewSearch = {
    roleTitle?: string;
    interviewType?: InterviewTypeId;
    focusQuestion?: string;
};

type InterviewSummary = {
    mode?: string | null;
    voiceAccent?: string | null;
};

const DEFAULT_VOICE_ACCENT = VOICE_ACCENTS[0].id;
const VOICE_ACCENT_STORAGE_KEY = "prep-pilot:voice-accent";

function getStringSearchParam(value: unknown) {
    return typeof value === "string" && value.trim() ? value : undefined;
}

function isInterviewTypeId(value: unknown): value is InterviewTypeId {
    return (
        typeof value === "string" &&
        INTERVIEW_TYPES.some((type) => type.id === value)
    );
}

function isVoiceAccentId(value: unknown): value is VoiceAccentId {
    return (
        typeof value === "string" &&
        VOICE_ACCENTS.some((accent) => accent.id === value)
    );
}

function getStoredVoiceAccent() {
    if (typeof window === "undefined") return null;

    const value = window.localStorage.getItem(VOICE_ACCENT_STORAGE_KEY);
    return isVoiceAccentId(value) ? value : null;
}

function saveVoiceAccentPreference(accent: VoiceAccentId) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(VOICE_ACCENT_STORAGE_KEY, accent);
}

export const Route = createFileRoute("/_authenticated/interview/new")({
    validateSearch: (search: Record<string, unknown>): NewInterviewSearch => ({
        roleTitle: getStringSearchParam(search.roleTitle),
        interviewType: isInterviewTypeId(search.interviewType)
            ? search.interviewType
            : undefined,
        focusQuestion: getStringSearchParam(search.focusQuestion),
    }),
    component: NewInterviewPage,
});

function NewInterviewPage() {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const { canStartInterview } = useSubscriptionStore();
    const [loading, setLoading] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [initialVoiceAccentPreference] = useState(() => {
        const storedVoiceAccent = getStoredVoiceAccent();

        return {
            accent: storedVoiceAccent ?? DEFAULT_VOICE_ACCENT,
            hasStoredPreference: Boolean(storedVoiceAccent),
        };
    });
    const [hasStoredVoiceAccentPreference, setHasStoredVoiceAccentPreference] =
        useState(initialVoiceAccentPreference.hasStoredPreference);

    const [roleTitle, setRoleTitle] = useState(search.roleTitle ?? "");
    const [selectedTypes, setSelectedTypes] = useState<string[]>(
        search.interviewType
            ? [search.interviewType]
            : ["behavioral", "domain_knowledge"],
    );
    const [tone, setTone] = useState("balanced");
    const [voiceAccent, setVoiceAccent] = useState<VoiceAccentId>(
        initialVoiceAccentPreference.accent,
    );
    const [duration, setDuration] = useState("30");
    const [targetCompany, setTargetCompany] = useState("");
    const [jobDescription, setJobDescription] = useState(
        search.focusQuestion
            ? `Practice focus question:\n${search.focusQuestion}`
            : "",
    );

    useEffect(() => {
        api.getProfile()
            .then((res) => {
                if (res.data) {
                    setProfile(res.data);
                    if (!search.roleTitle) {
                        setRoleTitle(
                            `${res.data.seniority} ${res.data.subFunction}`,
                        );
                    }
                    if (res.data.targetCompanies?.length > 0) {
                        setTargetCompany(res.data.targetCompanies[0]);
                    }
                }
            })
            .catch(() => {});
    }, [search.roleTitle]);

    useEffect(() => {
        if (hasStoredVoiceAccentPreference) return;

        api.listInterviews(1)
            .then((res) => {
                const latestVoiceAccent = (
                    (res.data ?? []) as InterviewSummary[]
                ).find((interview) =>
                    isVoiceAccentId(interview.voiceAccent),
                )?.voiceAccent;

                if (isVoiceAccentId(latestVoiceAccent)) {
                    setVoiceAccent(latestVoiceAccent);
                    setHasStoredVoiceAccentPreference(true);
                    saveVoiceAccentPreference(latestVoiceAccent);
                }
            })
            .catch(() => {});
    }, [hasStoredVoiceAccentPreference]);

    if (!canStartInterview()) {
        return (
            <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <IconRocket className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="font-heading text-3xl font-bold text-foreground mb-3">
                        No Interview Credits
                    </h1>
                    <p className="text-muted-foreground text-lg mb-2">
                        You've used all your interview credits.
                    </p>
                    <p className="text-muted-foreground mb-8">
                        Purchase an interview pack to continue practicing with
                        our AI interviewer.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => navigate({ to: "/pricing" })}
                            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all cursor-pointer"
                        >
                            View Interview Packs
                        </button>
                        <button
                            onClick={() => navigate({ to: "/dashboard" })}
                            className="px-8 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-all cursor-pointer"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </motion.div>
            </main>
        );
    }

    const toggleType = (typeId: string) => {
        setSelectedTypes((prev) =>
            prev.includes(typeId)
                ? prev.filter((t) => t !== typeId)
                : [...prev, typeId],
        );
    };

    const selectVoiceAccent = (accent: VoiceAccentId) => {
        setVoiceAccent(accent);
        setHasStoredVoiceAccentPreference(true);
        saveVoiceAccentPreference(accent);
    };

    const handleStart = async () => {
        if (!roleTitle || selectedTypes.length === 0) return;
        setLoading(true);
        setStartError(null);
        try {
            const res = await api.createInterview({
                roleTitle,
                industry: profile?.industry,
                functionCategory: profile?.functionCategory,
                seniority: profile?.seniority,
                interviewTypes: selectedTypes,
                interviewerTone: tone,
                voiceAccent,
                durationMinutes: duration,
                targetCompany: targetCompany || undefined,
                jobDescription: jobDescription || undefined,
            });

            navigate({ to: `/interview/${res.data.id}/live` });
        } catch (err) {
            console.error("Create interview error:", err);
            setStartError(
                err instanceof Error
                    ? err.message
                    : "Unable to start this interview. Check your credits and try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <IconVideo className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-heading text-3xl font-bold text-foreground">
                                Configure Interview
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Set up your live AI interview session
                            </p>
                        </div>
                    </div>
                </motion.div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleStart();
                    }}
                    className="bg-card border border-border rounded-2xl p-5 sm:p-8 space-y-8"
                >
                    {search.focusQuestion && (
                        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                                Question library selection
                            </p>
                            <p className="text-sm text-foreground">
                                {search.focusQuestion}
                            </p>
                        </section>
                    )}

                    {startError && (
                        <section
                            role="alert"
                            className="rounded-xl border border-destructive/20 bg-destructive/10 p-4"
                        >
                            <div className="flex gap-3">
                                <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">
                                        Interview could not start
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {startError}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate({ to: "/billing" })
                                            }
                                            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                                        >
                                            Manage credits
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStartError(null)}
                                            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Role */}
                    <section className="space-y-2">
                        <label className="text-sm font-semibold text-foreground block mb-2">
                            Role Title
                        </label>
                        <input
                            type="text"
                            value={roleTitle}
                            onChange={(e) => setRoleTitle(e.target.value)}
                            placeholder="e.g., Senior Frontend Engineer"
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </section>

                    {/* Interview Types */}
                    <section>
                        <label className="text-sm font-semibold text-foreground block mb-3">
                            Question Types
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {INTERVIEW_TYPES.map((type) => (
                                <button
                                    type="button"
                                    key={type.id}
                                    onClick={() => toggleType(type.id)}
                                    className={`min-h-20 p-4 rounded-xl border text-left text-sm transition-all cursor-pointer ${
                                        selectedTypes.includes(type.id)
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            {type.label}
                                        </span>
                                        {selectedTypes.includes(type.id) && (
                                            <IconCheck className="w-4 h-4" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {type.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Interviewer Voice Accent */}
                    <section>
                        <label className="text-sm font-semibold text-foreground block mb-3">
                            Interviewer Voice
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {VOICE_ACCENTS.map((accent) => (
                                <button
                                    type="button"
                                    key={accent.id}
                                    onClick={() => selectVoiceAccent(accent.id)}
                                    className={`min-h-16 p-3 rounded-xl border text-sm transition-all cursor-pointer ${
                                        voiceAccent === accent.id
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <div className="flex h-full items-center gap-3 text-left">
                                        <IconVolume className="w-4 h-4 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium leading-5 text-foreground">
                                                {accent.label}
                                            </p>
                                            <p className="text-xs leading-4 text-muted-foreground">
                                                {accent.region}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Interviewer Tone */}
                    <section>
                        <label className="text-sm font-semibold text-foreground block mb-3">
                            Interviewer Tone
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {INTERVIEWER_TONES.map((t) => (
                                <button
                                    type="button"
                                    key={t.id}
                                    onClick={() => setTone(t.id)}
                                    className={`min-h-18 p-4 rounded-xl border text-left text-sm transition-all cursor-pointer ${
                                        tone === t.id
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <p className="font-medium">{t.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Duration */}
                    <section>
                        <label className="text-sm font-semibold text-foreground block mb-3">
                            Duration
                        </label>
                        <div className="flex gap-2">
                            {["15", "30", "45"].map((d) => (
                                <button
                                    type="button"
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                                        duration === d
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    {d} min
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Target Company & JD */}
                    <section>
                        <label className="text-sm font-semibold text-foreground block mb-2">
                            Target Company (optional)
                        </label>
                        <input
                            type="text"
                            value={targetCompany}
                            onChange={(e) => setTargetCompany(e.target.value)}
                            placeholder="e.g., Google, Stripe, any startup"
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </section>

                    <section>
                        <label className="text-sm font-semibold text-foreground block mb-2">
                            Job Description (optional — for highly tailored
                            questions)
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the actual job description here for personalized questions..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                        />
                    </section>

                    {/* Start Button */}
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={
                            loading || !roleTitle || selectedTypes.length === 0
                        }
                        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-heading font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Setting up interview...
                            </>
                        ) : (
                            <>
                                <IconVideo className="w-5 h-5" /> Start Live
                                Interview
                            </>
                        )}
                    </motion.button>
                </form>
            </div>
        </main>
    );
}
