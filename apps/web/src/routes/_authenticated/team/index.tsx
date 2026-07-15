import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { AppLoader } from "@/components/app-loader";
import { toast } from "sonner";
import {
    IconPlus,
    IconTrash,
    IconMail,
    IconUsers,
    IconCrown,
    IconShield,
    IconUser,
    IconChartBar,
    IconMessageCircle,
    IconTrendingUp,
} from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/team/")({
    component: TeamPage,
});

function TeamPage() {
    const [team, setTeam] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
    const [inviting, setInviting] = useState(false);
    const [createName, setCreateName] = useState("");
    const [creating, setCreating] = useState(false);

    const loadTeam = async () => {
        const res = await api.getTeam();
        setTeam(res.data);

        if (res.data && ["owner", "admin"].includes(res.data.role)) {
            setAnalyticsLoading(true);
            try {
                const analyticsRes = await api.getTeamAnalytics();
                setAnalytics(analyticsRes.data);
            } catch (err) {
                console.error("Team analytics error:", err);
                setAnalytics(null);
            } finally {
                setAnalyticsLoading(false);
            }
        } else {
            setAnalytics(null);
        }
    };

    useEffect(() => {
        loadTeam()
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleCreateTeam = async () => {
        if (!createName.trim()) return;
        setCreating(true);
        try {
            await api.createTeam(createName);
            await loadTeam();
        } catch (err) {
            console.error("Create team error:", err);
        } finally {
            setCreating(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            await api.inviteTeamMember(inviteEmail, inviteRole);
            const invitedEmail = inviteEmail.trim();
            setInviteEmail("");
            await loadTeam();
            toast.success("Invitation sent", {
                description: `An invitation was sent to ${invitedEmail}.`,
            });
        } catch (err) {
            console.error("Invite error:", err);
            toast.error("Invitation failed", {
                description:
                    err instanceof Error
                        ? err.message
                        : "We could not send the invitation. Please try again.",
            });
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Remove this team member?")) return;
        try {
            await api.removeTeamMember(memberId);
            await loadTeam();
        } catch (err) {
            console.error("Remove member error:", err);
        }
    };

    const roleIcon = (role: string) => {
        if (role === "owner")
            return <IconCrown className="w-4 h-4 text-yellow-500" />;
        if (role === "admin")
            return <IconShield className="w-4 h-4 text-blue-500" />;
        return <IconUser className="w-4 h-4 text-muted-foreground" />;
    };

    if (loading) {
        return (
            <main className="flex-1" aria-busy="true">
                <AppLoader label="Loading team workspace" />
            </main>
        );
    }

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
            {!team ? (
                /* Create Team */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-12 text-center"
                >
                    <IconUsers className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                    <h1 className="font-heading text-3xl font-bold text-foreground mb-3">
                        Create Your Team
                    </h1>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Set up a team to manage interview prep for your whole
                        organization. All members get enterprise access.
                    </p>
                    <div className="flex items-center gap-3 max-w-sm mx-auto">
                        <input
                            type="text"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            placeholder="Team name"
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleCreateTeam()
                            }
                            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        <button
                            onClick={handleCreateTeam}
                            disabled={!createName.trim() || creating}
                            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            {creating ? "Creating..." : "Create"}
                        </button>
                    </div>
                </motion.div>
            ) : (
                /* Team Dashboard */
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="font-heading text-3xl font-bold text-foreground">
                                    {team.name}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {team.members?.length || 0} /{" "}
                                    {team.maxMembers} members • Enterprise plan
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                                    {team.role}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Invite Section (admin/owner only) */}
                    {["owner", "admin"].includes(team.role) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-2xl p-6 mb-6"
                        >
                            <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <IconMail className="w-5 h-5 text-primary" />{" "}
                                Invite Members
                            </h2>
                            <div className="flex items-center gap-3">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) =>
                                        setInviteEmail(e.target.value)
                                    }
                                    placeholder="colleague@company.com"
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) =>
                                        setInviteRole(e.target.value as any)
                                    }
                                    className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm cursor-pointer"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteEmail.trim() || inviting}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                >
                                    <IconPlus className="w-4 h-4" />{" "}
                                    {inviting ? "Sending..." : "Invite"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Pending Invitations */}
                    {team.invitations?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="mb-6"
                        >
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                                Pending Invitations
                            </h3>
                            <div className="space-y-2">
                                {team.invitations.map((inv: any) => (
                                    <div
                                        key={inv.id}
                                        className="flex items-center justify-between bg-card border border-border rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <IconMail className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm text-foreground">
                                                {inv.email}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
                                                Pending
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {inv.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Team Analytics (admin/owner only) */}
                    {["owner", "admin"].includes(team.role) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            className="mb-6"
                        >
                            <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <IconChartBar className="w-5 h-5 text-primary" />{" "}
                                Team Analytics
                            </h2>
                            {analyticsLoading ? (
                                <section aria-busy="true" aria-live="polite">
                                    <AppLoader
                                        label="Loading team analytics"
                                        className="min-h-[180px] rounded-xl border border-border bg-card"
                                    />
                                </section>
                            ) : analytics ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        {[
                                            {
                                                icon: IconUsers,
                                                label: "Total Members",
                                                value: String(
                                                    analytics.totalMembers || 0,
                                                ),
                                                color: "text-blue-500",
                                            },
                                            {
                                                icon: IconMessageCircle,
                                                label: "Team Interviews",
                                                value: String(
                                                    analytics.totalInterviews ||
                                                        0,
                                                ),
                                                color: "text-green-500",
                                            },
                                            {
                                                icon: IconTrendingUp,
                                                label: "Avg. Interviews",
                                                value: analytics.totalMembers
                                                    ? (
                                                          analytics.totalInterviews /
                                                          analytics.totalMembers
                                                      ).toFixed(1)
                                                    : "0",
                                                color: "text-purple-500",
                                            },
                                        ].map((stat) => (
                                            <div
                                                key={stat.label}
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
                                            </div>
                                        ))}
                                    </div>

                                    {analytics.members?.length > 0 && (
                                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                                            {analytics.members.map(
                                                (member: any) => (
                                                    <div
                                                        key={member.userId}
                                                        className="flex items-center justify-between gap-4 p-4 border-b border-border last:border-b-0"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {member.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {member.email}
                                                            </p>
                                                        </div>
                                                        <span className="shrink-0 text-sm font-medium text-foreground">
                                                            {member.interviewCount ||
                                                                0}{" "}
                                                            interviews
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
                                    Team analytics are unavailable right now.
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Members List */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <IconUsers className="w-5 h-5 text-primary" /> Team
                            Members
                        </h2>
                        <div className="space-y-2">
                            {team.members?.map((member: any) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            {member.avatarUrl ? (
                                                <img
                                                    src={member.avatarUrl}
                                                    alt={member.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <IconUser className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                                {member.name}
                                                {roleIcon(member.role)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {member.role}
                                        </span>
                                        {["owner", "admin"].includes(
                                            team.role,
                                        ) &&
                                            member.role !== "owner" && (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            member.id,
                                                        )
                                                    }
                                                    className="text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                                >
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </main>
    );
}
