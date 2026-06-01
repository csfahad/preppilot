import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import {
    IconFileText,
    IconChevronRight,
    IconChevronLeft,
    IconCheck,
} from "@tabler/icons-react";

import {
    INDUSTRIES,
    FUNCTION_CATEGORIES,
    FUNCTIONS,
    SENIORITY_LEVELS,
    SENIORITY_EXPERIENCE_YEARS,
} from "@repo/shared/constants/taxonomy";

export const Route = createFileRoute("/onboarding/")({
    component: OnboardingWizard,
});

const STEPS = [
    { label: "Industry", desc: "What sector do you work in?" },
    { label: "Function", desc: "What's your job function?" },
    { label: "Seniority", desc: "What's your experience level?" },
    { label: "Resume", desc: "Upload your resume (optional)" },
    { label: "Goals", desc: "Where are you heading?" },
];

function OnboardingWizard() {
    const navigate = useNavigate();
    const { data: session, isPending: isSessionPending } = useSession();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);

    // form states
    const [industry, setIndustry] = useState("");
    const [functionCategory, setFunctionCategory] = useState("");
    const [subFunction, setSubFunction] = useState("");
    const [seniority, setSeniority] = useState("");
    const [experienceYears, setExperienceYears] = useState(0);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [targetCompanies, setTargetCompanies] = useState("");
    const [careerGoal, setCareerGoal] = useState("");

    useEffect(() => {
        if (!isSessionPending && !session) {
            navigate({ to: "/auth/login" });
        }
    }, [session, isSessionPending, navigate]);

    useEffect(() => {
        let cancelled = false;

        async function redirectCompletedUsers() {
            if (isSessionPending || !session) return;

            try {
                const res = await api.getProfile();
                if (cancelled) return;

                if (res.data) {
                    navigate({ to: "/dashboard" });
                    return;
                }
            } catch (err) {
                console.error("Profile check error:", err);
            } finally {
                if (!cancelled) setIsCheckingProfile(false);
            }
        }

        redirectCompletedUsers();

        return () => {
            cancelled = true;
        };
    }, [session, isSessionPending, navigate]);

    const canProceed = () => {
        switch (step) {
            case 0:
                return !!industry;
            case 1:
                return !!functionCategory && !!subFunction;
            case 2:
                return !!seniority;
            case 3:
                return true; // resume is optional
            case 4:
                return true; // goals are optional
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!session) {
            navigate({ to: "/auth/login" });
            return;
        }

        setIsSubmitting(true);
        try {
            // upload resume if provided
            let resumeUrl: string | undefined;
            if (resumeFile) {
                const { data } = await api.getUploadUrl(
                    resumeFile.name,
                    resumeFile.type,
                    "resumes",
                );
                await fetch(data.uploadUrl, {
                    method: "PUT",
                    body: resumeFile,
                    headers: { "Content-Type": resumeFile.type },
                });
                resumeUrl = data.fileUrl;
            }

            await api.createProfile({
                industry,
                functionCategory,
                subFunction,
                seniority,
                experienceYears,
                resumeUrl,
                targetCompanies: targetCompanies
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                careerGoal: careerGoal || undefined,
            });

            navigate({ to: "/dashboard" });
        } catch (err) {
            console.error("Onboarding error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const subFunctions = functionCategory
        ? ((FUNCTIONS as Record<string, readonly string[]>)[functionCategory] ??
          [])
        : [];

    if (!isSessionPending && !session) return null;

    if (isSessionPending || isCheckingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">
                        Preparing your account...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
            {/* Progress bar */}
            <div className="w-full max-w-2xl mb-8">
                <div className="flex items-center justify-between mb-4">
                    {STEPS.map((s, i) => (
                        <div key={s.label} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                                    i < step
                                        ? "bg-primary text-primary-foreground"
                                        : i === step
                                          ? "bg-primary/20 text-primary ring-2 ring-primary"
                                          : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {i < step ? (
                                    <IconCheck className="w-5 h-5" />
                                ) : (
                                    i + 1
                                )}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`hidden sm:block w-12 md:w-20 h-0.5 mx-1 transition-all duration-300 ${
                                        i < step ? "bg-primary" : "bg-border"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step content */}
            <div className="w-full max-w-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-card border border-border rounded-2xl p-8 shadow-sm"
                    >
                        <div className="mb-6">
                            <h2 className="font-heading text-2xl font-bold text-foreground">
                                {STEPS[step]!.label}
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                {STEPS[step]!.desc}
                            </p>
                        </div>

                        {/* Step 0: Industry */}
                        {step === 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {INDUSTRIES.map((ind) => (
                                    <button
                                        key={ind}
                                        onClick={() => setIndustry(ind)}
                                        className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                            industry === ind
                                                ? "border-primary bg-primary/10 text-primary font-medium"
                                                : "border-border hover:border-primary/50 hover:bg-accent"
                                        }`}
                                    >
                                        <span className="text-sm">{ind}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Step 1: Function */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {FUNCTION_CATEGORIES.map((fn) => (
                                        <button
                                            key={fn}
                                            onClick={() => {
                                                setFunctionCategory(fn);
                                                setSubFunction("");
                                            }}
                                            className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer text-sm ${
                                                functionCategory === fn
                                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                                    : "border-border hover:border-primary/50 hover:bg-accent"
                                            }`}
                                        >
                                            {fn}
                                        </button>
                                    ))}
                                </div>
                                {subFunctions.length > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Specialization
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {subFunctions.map((sf: string) => (
                                                <button
                                                    key={sf}
                                                    onClick={() =>
                                                        setSubFunction(sf)
                                                    }
                                                    className={`p-3 rounded-lg border text-left text-sm transition-all duration-200 cursor-pointer ${
                                                        subFunction === sf
                                                            ? "border-primary bg-primary/10 text-primary font-medium"
                                                            : "border-border hover:border-primary/50 hover:bg-accent"
                                                    }`}
                                                >
                                                    {sf}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Seniority */}
                        {step === 2 && (
                            <div className="space-y-3">
                                {SENIORITY_LEVELS.map((level) => {
                                    const range =
                                        SENIORITY_EXPERIENCE_YEARS[level];
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => {
                                                setSeniority(level);
                                                setExperienceYears(range.min);
                                            }}
                                            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                                                seniority === level
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:border-primary/50 hover:bg-accent"
                                            }`}
                                        >
                                            <div>
                                                <p
                                                    className={`font-medium ${seniority === level ? "text-primary" : "text-foreground"}`}
                                                >
                                                    {level}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {range.min}–{range.max}{" "}
                                                    years experience
                                                </p>
                                            </div>
                                            {seniority === level && (
                                                <IconCheck className="w-5 h-5 text-primary" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Step 3: Resume */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div
                                    className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() =>
                                        document
                                            .getElementById("resume-input")
                                            ?.click()
                                    }
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file) setResumeFile(file);
                                    }}
                                >
                                    <IconFileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-foreground font-medium">
                                        {resumeFile
                                            ? resumeFile.name
                                            : "Drop your resume here"}
                                    </p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        PDF, DOC, or DOCX • Max 10MB
                                    </p>
                                    <input
                                        id="resume-input"
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setResumeFile(file);
                                        }}
                                    />
                                </div>
                                {resumeFile && (
                                    <p className="text-sm text-primary flex items-center gap-2">
                                        <IconCheck className="w-4 h-4" /> AI
                                        will parse your skills and experience
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Step 4: Goals */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-2">
                                        Target Companies
                                    </label>
                                    <input
                                        type="text"
                                        value={targetCompanies}
                                        onChange={(e) =>
                                            setTargetCompanies(e.target.value)
                                        }
                                        placeholder="Google, Microsoft, startup... (comma separated)"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-2">
                                        Career Goal
                                    </label>
                                    <textarea
                                        value={careerGoal}
                                        onChange={(e) =>
                                            setCareerGoal(e.target.value)
                                        }
                                        placeholder="e.g., I want to become a Senior PM at a product company within 2 years"
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handleBack}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <IconChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            Next <IconChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            {isSubmitting ? "Setting up..." : "Complete Setup"}{" "}
                            <IconCheck className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
