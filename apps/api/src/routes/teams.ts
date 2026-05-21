import { Router } from "express";
import { db } from "../db/index.js";
import { teams, teamMembers, teamInvitations, users } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { emailQueue } from "../jobs/send-email.js";
import crypto from "crypto";

const router = Router();

router.use(requireAuth);

// get user's team
router.get("/me", async (req, res) => {
    try {
        const membership = await db
            .select()
            .from(teamMembers)
            .innerJoin(teams, eq(teamMembers.teamId, teams.id))
            .where(eq(teamMembers.userId, req.user!.id))
            .limit(1);

        if (membership.length === 0) {
            return res.json({ success: true, data: null });
        }

        const team = membership[0]!.teams;
        const role = membership[0]!.team_members.role;

        // get members
        const members = await db
            .select({
                id: teamMembers.id,
                userId: teamMembers.userId,
                role: teamMembers.role,
                joinedAt: teamMembers.joinedAt,
                name: users.name,
                email: users.email,
                avatarUrl: users.avatarUrl,
            })
            .from(teamMembers)
            .innerJoin(users, eq(teamMembers.userId, users.id))
            .where(eq(teamMembers.teamId, team.id));

        // get pending invitations
        const invitations = await db
            .select()
            .from(teamInvitations)
            .where(
                and(
                    eq(teamInvitations.teamId, team.id),
                    eq(teamInvitations.acceptedAt, null as any),
                ),
            );

        res.json({
            success: true,
            data: { ...team, role, members, invitations },
        });
    } catch (err) {
        console.error("Get team error:", err);
        res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Failed to get team" },
        });
    }
});

// create team
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Team name is required",
                },
            });
        }

        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        // check slug uniqueness
        const existing = await db
            .select()
            .from(teams)
            .where(eq(teams.slug, slug))
            .limit(1);
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "SLUG_TAKEN",
                    message: "Team name already taken",
                },
            });
        }

        const [team] = await db
            .insert(teams)
            .values({
                name,
                slug,
                ownerId: req.user!.id,
            })
            .returning();

        // add owner as a member
        await db.insert(teamMembers).values({
            teamId: team!.id,
            userId: req.user!.id,
            role: "owner",
        });

        // upgrade user to enterprise plan
        await db
            .update(users)
            .set({ plan: "enterprise", updatedAt: new Date() })
            .where(eq(users.id, req.user!.id));

        res.status(201).json({ success: true, data: team });
    } catch (err) {
        console.error("Create team error:", err);
        res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Failed to create team" },
        });
    }
});

// invite member
router.post("/invite", async (req, res) => {
    try {
        const { email, role = "member" } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Email is required",
                },
            });
        }

        // find user's team
        const membership = await db
            .select()
            .from(teamMembers)
            .where(and(eq(teamMembers.userId, req.user!.id)))
            .limit(1);

        if (
            membership.length === 0 ||
            !["owner", "admin"].includes(membership[0]!.role)
        ) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Only owners and admins can invite members",
                },
            });
        }

        const teamId = membership[0]!.teamId;

        // check member count
        const team = await db
            .select()
            .from(teams)
            .where(eq(teams.id, teamId))
            .limit(1);
        const memberCount = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.teamId, teamId));
        if (team[0] && memberCount.length >= team[0].maxMembers) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "LIMIT_REACHED",
                    message: "Team member limit reached",
                },
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const inviteUrl = `${process.env.WEB_URL}/team/join?token=${token}`;

        const [invitation] = await db
            .insert(teamInvitations)
            .values({
                teamId,
                email,
                role: role as any,
                invitedBy: req.user!.id,
                token,
                expiresAt,
            })
            .returning();

        await emailQueue.add(
            "team_invitation",
            {
                type: "team_invitation",
                to: email,
                inviterName: req.user!.name || req.user!.email,
                teamName: team[0]?.name || "your team",
                inviteUrl,
            },
            {
                attempts: 3,
                backoff: { type: "exponential", delay: 5000 },
                removeOnComplete: true,
            },
        );

        res.status(201).json({
            success: true,
            data: {
                ...invitation,
                inviteUrl,
            },
        });
    } catch (err) {
        console.error("Invite error:", err);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to send invitation",
            },
        });
    }
});

// accept invitation
router.post("/join", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Token is required",
                },
            });
        }

        const [invitation] = await db
            .select()
            .from(teamInvitations)
            .where(eq(teamInvitations.token, token))
            .limit(1);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Invalid invitation" },
            });
        }

        if (invitation.acceptedAt) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "ALREADY_ACCEPTED",
                    message: "Invitation already accepted",
                },
            });
        }

        if (new Date() > invitation.expiresAt) {
            return res.status(410).json({
                success: false,
                error: { code: "EXPIRED", message: "Invitation expired" },
            });
        }

        // add user to team
        await db.insert(teamMembers).values({
            teamId: invitation.teamId,
            userId: req.user!.id,
            role: invitation.role,
        });

        // mark invitation as accepted
        await db
            .update(teamInvitations)
            .set({ acceptedAt: new Date() })
            .where(eq(teamInvitations.id, invitation.id));

        // upgrade user to enterprise
        await db
            .update(users)
            .set({ plan: "enterprise", updatedAt: new Date() })
            .where(eq(users.id, req.user!.id));

        res.json({ success: true, data: { teamId: invitation.teamId } });
    } catch (err) {
        console.error("Join team error:", err);
        res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Failed to join team" },
        });
    }
});

// remove member
router.delete("/members/:memberId", async (req, res) => {
    try {
        const { memberId } = req.params;

        // verify requester is owner/admin
        const requesterMembership = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.userId, req.user!.id))
            .limit(1);

        if (
            requesterMembership.length === 0 ||
            !["owner", "admin"].includes(requesterMembership[0]!.role)
        ) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Only owners and admins can remove members",
                },
            });
        }

        // can't remove the owner
        const targetMember = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.id, memberId))
            .limit(1);
        if (targetMember[0]?.role === "owner") {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Cannot remove the team owner",
                },
            });
        }

        await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

        // downgrade removed user to free
        if (targetMember[0]) {
            await db
                .update(users)
                .set({ plan: "free", updatedAt: new Date() })
                .where(eq(users.id, targetMember[0].userId));
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Remove member error:", err);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to remove member",
            },
        });
    }
});

// team analytics (admin)
router.get("/analytics", async (req, res) => {
    try {
        const membership = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.userId, req.user!.id))
            .limit(1);

        if (
            membership.length === 0 ||
            !["owner", "admin"].includes(membership[0]!.role)
        ) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Admin access required",
                },
            });
        }

        const teamId = membership[0]!.teamId;

        // get all team members
        const members = await db
            .select({
                userId: teamMembers.userId,
                name: users.name,
                email: users.email,
                interviewCount: users.interviewCount,
            })
            .from(teamMembers)
            .innerJoin(users, eq(teamMembers.userId, users.id))
            .where(eq(teamMembers.teamId, teamId));

        res.json({
            success: true,
            data: {
                totalMembers: members.length,
                totalInterviews: members.reduce(
                    (sum, m) => sum + m.interviewCount,
                    0,
                ),
                members,
            },
        });
    } catch (err) {
        console.error("Team analytics error:", err);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get team analytics",
            },
        });
    }
});

export default router;
