import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { signOut } from "@/lib/auth-client";
import { useSubscriptionStore } from "@/stores/subscription";
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

    const planLabel =
        plan === "pro_monthly"
            ? "Pro Monthly"
            : plan === "pro_annual"
              ? "Pro Annual"
              : plan === "enterprise"
                ? "Enterprise"
                : "Free";

    const isPro = plan !== "free";

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
            <main className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">
                        Loading profile...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                    Account
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your profile and subscription
                </p>
            </motion.div>

            <div className="space-y-6">
                {/* Profile card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                >
                    {/* Profile header */}
                    <div className="px-6 py-5 border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-primary/10 ring-offset-2 ring-offset-card">
                                {session?.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || ""}
                                        className="w-14 h-14 rounded-full object-cover"
                                    />
                                ) : (
                                    <IconUser className="w-6 h-6 text-primary" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-heading text-lg font-semibold text-foreground truncate">
                                    {session?.user.name || "User"}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <IconMail className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground truncate">
                                        {session?.user.email}
                                    </span>
                                </div>
                            </div>
                            <span
                                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 ${
                                    isPro
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {planLabel}
                            </span>
                        </div>
                    </div>

                    {/* Profile details */}
                    <div className="px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                Professional Details
                            </h3>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                                >
                                    <IconEdit className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            if (profile)
                                                populateEditFields(profile);
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <IconLoader className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <IconDeviceFloppy className="w-3.5 h-3.5" />
                                        )}
                                        Save
                                    </button>
                                </div>
                            )}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
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
                                        <div className="sm:col-span-2">
                                            <p className="text-xs text-muted-foreground mb-1.5">
                                                Skills
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {profile.skills.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="px-2.5 py-1 rounded-md bg-muted text-xs text-foreground font-medium"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                {profile?.targetCompanies &&
                                    profile.targetCompanies.length > 0 && (
                                        <div className="sm:col-span-2">
                                            <p className="text-xs text-muted-foreground mb-1.5">
                                                Target Companies
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {profile.targetCompanies.map(
                                                    (company) => (
                                                        <span
                                                            key={company}
                                                            className="px-2.5 py-1 rounded-md bg-primary/10 text-xs text-primary font-medium flex items-center gap-1"
                                                        >
                                                            <IconTarget className="w-3 h-3" />
                                                            {company}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                {profile?.careerGoal && (
                                    <div className="sm:col-span-2">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Career Goal
                                        </p>
                                        <p className="text-sm text-foreground">
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
                    className="bg-card border border-border rounded-xl overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPro ? "bg-primary/10" : "bg-muted"}`}
                                >
                                    <IconCrown
                                        className={`w-5 h-5 ${isPro ? "text-primary" : "text-muted-foreground"}`}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {planLabel} Plan
                                    </h3>
                                    {currentPeriodEnd && (
                                        <p className="text-xs text-muted-foreground">
                                            Renews{" "}
                                            {new Date(
                                                currentPeriodEnd,
                                            ).toLocaleDateString("en-IN", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!isPro && (
                                <Link
                                    to="/pricing"
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all"
                                >
                                    <IconCrown className="w-3.5 h-3.5" />
                                    Upgrade
                                </Link>
                            )}
                            {isPro && (
                                <Link
                                    to="/pricing"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    Manage Plan
                                    <IconExternalLink className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-5">
                        {/* Usage */}
                        {!isPro && (
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Interviews Used
                                    </p>
                                    <p className="text-xs font-semibold text-foreground">
                                        {interviewCount} / {maxInterviews}
                                    </p>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min((interviewCount / maxInterviews) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Features */}
                        <div className="space-y-2.5">
                            {planFeatures.map((feature) => (
                                <div
                                    key={feature.label}
                                    className="flex items-center gap-3"
                                >
                                    {feature.enabled ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <IconCheck className="w-3 h-3 text-emerald-500" />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <IconX className="w-3 h-3 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <feature.icon
                                            className={`w-3.5 h-3.5 ${feature.enabled ? "text-foreground" : "text-muted-foreground/50"}`}
                                        />
                                        <span
                                            className={`text-sm ${feature.enabled ? "text-foreground" : "text-muted-foreground/60"}`}
                                        >
                                            {feature.label}
                                        </span>
                                    </div>
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
                    className="bg-card border border-border rounded-xl px-6 py-5"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Sign Out
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Sign out of your PrepPilot account
                            </p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all cursor-pointer"
                        >
                            <IconLogout className="w-4 h-4" />
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
        <div className="flex items-start gap-2.5">
            <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm text-foreground font-medium">
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}
