import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { signOut, useSession } from "@/lib/auth-client";
import { useSubscriptionStore } from "@/stores/subscription";
import { getPlanFullLabel, getPlanLabel, isPaidPlan } from "@/lib/plans";
import { AppLoader } from "@/components/app-loader";
import {
    INDUSTRIES,
    FUNCTION_CATEGORIES,
    SENIORITY_LEVELS,
} from "@repo/shared/constants/taxonomy";
import {
    IconUser,
    IconMail,
    IconBriefcase,
    IconBuilding,
    IconChevronUp,
    IconCrown,
    IconCheck,
    IconX,
    IconCalendar,
    IconEdit,
    IconDeviceFloppy,
    IconLoader,
    IconChartBar,
    IconMicrophone,
    IconMessageCircle,
    IconBulb,
    IconTarget,
    IconLogout,
    IconExternalLink,
} from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/account/")({
    component: AccountPage,
});

interface ProfileData {
    industry?: string;
    functionCategory?: string;
    subFunction?: string;
    seniority?: string;
    experienceYears?: number;
    targetCompanies?: string[];
    careerGoal?: string;
    skills?: string[];
    resumeUrl?: string;
}

function AccountPage() {
    const { data: session } = useSession();
    const {
        plan,
        interviewCount,
        maxInterviews,
        modelAnswers,
        fullFeedback,
        currentPeriodEnd,
        hasFetched,
        fetchPlan,
    } = useSubscriptionStore();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // editable fields
    const [editIndustry, setEditIndustry] = useState("");
    const [editFunction, setEditFunction] = useState("");
    const [editSeniority, setEditSeniority] = useState("");
    const [editExperience, setEditExperience] = useState(0);
    const [editGoal, setEditGoal] = useState("");
    const [editSkills, setEditSkills] = useState("");
    const [editCompanies, setEditCompanies] = useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                const [profileRes] = await Promise.all([
                    api.getProfile(),
                    fetchPlan(),
                ]);
                if (profileRes.data) {
                    setProfile(profileRes.data);
                    populateEditFields(profileRes.data);
                }
            } catch (err) {
                console.error("Profile load error:", err);
            } finally {
                setProfileLoading(false);
            }
        }
        loadProfile();
    }, [fetchPlan]);

    const populateEditFields = (p: ProfileData) => {
        setEditIndustry(p.industry || "");
        setEditFunction(p.functionCategory || "");
        setEditSeniority(p.seniority || "");
        setEditExperience(p.experienceYears || 0);
        setEditGoal(p.careerGoal || "");
        setEditSkills(p.skills?.join(", ") || "");
        setEditCompanies(p.targetCompanies?.join(", ") || "");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData: Record<string, any> = {
                industry: editIndustry || undefined,
                functionCategory: editFunction || undefined,
                seniority: editSeniority || undefined,
                experienceYears: editExperience,
                careerGoal: editGoal || undefined,
                skills: editSkills
                    ? editSkills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                targetCompanies: editCompanies
                    ? editCompanies
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
            };
            const res = await api.updateProfile(updateData);
            if (res.data) {
                setProfile(res.data);
                populateEditFields(res.data);
            }
            setEditing(false);
        } catch (err) {
            console.error("Profile save error:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = () => {
        signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/auth/login";
                },
            },
        });
    };

    const planLabel = getPlanLabel(plan);
    const planFullLabel = getPlanFullLabel(plan);
    const isPro = isPaidPlan(plan);
    const freeUsageUsed = Math.min(interviewCount, maxInterviews);
    const freeUsagePercent =
        maxInterviews > 0 ? (freeUsageUsed / maxInterviews) * 100 : 0;

    const planFeatures = [
        {
            label: "Unlimited interviews",
            enabled: isPro,
            icon: IconChartBar,
        },
        {
            label: "Live AI interview",
            enabled: true,
            icon: IconMicrophone,
        },
        {
            label: "Model answers",
            enabled: modelAnswers,
            icon: IconMessageCircle,
        },
        {
            label: "Full feedback & tips",
            enabled: fullFeedback,
            icon: IconBulb,
        },
    ];

    if (profileLoading || !hasFetched) {
        return (
            <main className="flex-1">
                <AppLoader
                    label="Loading profile"
                    className="min-h-[calc(100vh-4rem)]"
                />
            </main>
        );
    }

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                        Account
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Keep your interview profile accurate and your plan ready
                        for practice.
                    </p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <IconUser className="h-3.5 w-3.5" />
                    {session?.user.email}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                {/* Profile card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                    {/* Profile header */}
                    <div className="border-b border-border bg-muted/25 px-6 py-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                                    {session?.user.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || ""}
                                            className="h-16 w-16 rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <IconUser className="h-7 w-7 text-primary" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                        <h2 className="font-heading text-xl font-semibold text-foreground">
                                            {session?.user.name}
                                        </h2>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                isPro
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {planLabel}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <IconMail className="h-4 w-4" />
                                        <span className="truncate">
                                            {session?.user.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-accent"
                                >
                                    <IconEdit className="h-4 w-4" />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            if (profile)
                                                populateEditFields(profile);
                                        }}
                                        className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <IconLoader className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <IconDeviceFloppy className="h-4 w-4" />
                                        )}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile details */}
                    <div className="px-6 py-6">
                        <div className="mb-5">
                            <h3 className="text-sm font-semibold text-foreground">
                                Professional profile
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Used to tune role context, seniority, and
                                follow-up pressure in mock interviews.
                            </p>
                        </div>

                        {editing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Industry
                                    </label>
                                    <select
                                        value={editIndustry}
                                        onChange={(e) =>
                                            setEditIndustry(e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">
                                            Select industry
                                        </option>
                                        {INDUSTRIES.map((ind) => (
                                            <option key={ind} value={ind}>
                                                {ind}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Function
                                    </label>
                                    <select
                                        value={editFunction}
                                        onChange={(e) =>
                                            setEditFunction(e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">
                                            Select function
                                        </option>
                                        {FUNCTION_CATEGORIES.map((fn) => (
                                            <option key={fn} value={fn}>
                                                {fn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Seniority
                                    </label>
                                    <select
                                        value={editSeniority}
                                        onChange={(e) =>
                                            setEditSeniority(e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">
                                            Select seniority
                                        </option>
                                        {SENIORITY_LEVELS.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Years of Experience
                                    </label>
                                    <input
                                        type="number"
                                        value={editExperience}
                                        onChange={(e) =>
                                            setEditExperience(
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        min={0}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Skills (comma-separated)
                                    </label>
                                    <input
                                        value={editSkills}
                                        onChange={(e) =>
                                            setEditSkills(e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        placeholder="e.g. React, TypeScript, Node.js"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Target Companies (comma-separated)
                                    </label>
                                    <input
                                        value={editCompanies}
                                        onChange={(e) =>
                                            setEditCompanies(e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        placeholder="e.g. Google, Meta, Stripe"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Career Goal
                                    </label>
                                    <textarea
                                        value={editGoal}
                                        onChange={(e) =>
                                            setEditGoal(e.target.value)
                                        }
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                                        placeholder="e.g. Land a Senior Frontend Engineer role at a top tech company"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <DetailRow
                                    icon={IconBuilding}
                                    label="Industry"
                                    value={profile?.industry}
                                />
                                <DetailRow
                                    icon={IconBriefcase}
                                    label="Function"
                                    value={profile?.functionCategory}
                                />
                                <DetailRow
                                    icon={IconChevronUp}
                                    label="Seniority"
                                    value={profile?.seniority}
                                />
                                <DetailRow
                                    icon={IconCalendar}
                                    label="Experience"
                                    value={
                                        profile?.experienceYears != null
                                            ? `${profile.experienceYears} years`
                                            : undefined
                                    }
                                />
                                {profile?.skills &&
                                    profile.skills.length > 0 && (
                                        <div className="rounded-xl bg-muted/35 p-4 sm:col-span-2">
                                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                Skills
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="rounded-lg bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                {profile?.targetCompanies &&
                                    profile.targetCompanies.length > 0 && (
                                        <div className="rounded-xl bg-muted/35 p-4 sm:col-span-2">
                                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                Target Companies
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.targetCompanies.map(
                                                    (company) => (
                                                        <span
                                                            key={company}
                                                            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                                                        >
                                                            <IconTarget className="h-3 w-3" />
                                                            {company}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                {profile?.careerGoal && (
                                    <div className="rounded-xl bg-muted/35 p-4 sm:col-span-2">
                                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                                            Career Goal
                                        </p>
                                        <p className="text-sm leading-6 text-foreground">
                                            {profile.careerGoal}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Plan & Subscription */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                    <div className="border-b border-border bg-muted/25 px-6 py-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isPro ? "bg-primary/10" : "bg-muted"}`}
                                >
                                    <IconCrown
                                        className={`h-5 w-5 ${isPro ? "text-primary" : "text-muted-foreground"}`}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Current plan
                                    </p>
                                    <h3 className="mt-1 font-heading text-lg font-semibold text-foreground">
                                        {planFullLabel}
                                    </h3>
                                    {isPro && currentPeriodEnd && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Expires{" "}
                                            {new Date(
                                                currentPeriodEnd,
                                            ).toLocaleDateString("en-IN", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    )}
                                    {!isPro && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            One-time free trial
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!isPro && (
                                <Link
                                    to="/pricing"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
                                >
                                    <IconCrown className="h-3.5 w-3.5" />
                                    Upgrade
                                </Link>
                            )}
                            {isPro && (
                                <Link
                                    to="/billing"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                >
                                    Manage Plan
                                    <IconExternalLink className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        {/* Usage */}
                        {!isPro && (
                            <div className="mb-6 rounded-xl bg-muted/35 p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-foreground">
                                        Interviews Used
                                    </p>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {freeUsageUsed} / {maxInterviews}
                                    </p>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{
                                            width: `${Math.min(freeUsagePercent, 100)}%`,
                                        }}
                                    />
                                </div>
                                {interviewCount >= maxInterviews && (
                                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                        Free usage is exhausted permanently for
                                        this account.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Features */}
                        <div className="space-y-2">
                            {planFeatures.map((feature) => (
                                <div
                                    key={feature.label}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-3"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <feature.icon
                                            className={`h-4 w-4 ${feature.enabled ? "text-foreground" : "text-muted-foreground/50"}`}
                                        />
                                        <span
                                            className={`text-sm ${feature.enabled ? "text-foreground" : "text-muted-foreground/60"}`}
                                        >
                                            {feature.label}
                                        </span>
                                    </div>
                                    {feature.enabled ? (
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                                            <IconCheck className="h-3 w-3 text-emerald-500" />
                                        </div>
                                    ) : (
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background">
                                            <IconX className="h-3 w-3 text-muted-foreground/50" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Danger zone */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl border border-border bg-card px-6 py-5"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Sign Out
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                End this browser session and return to login.
                            </p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                        >
                            <IconLogout className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value?: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl bg-muted/35 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                    {label}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}
