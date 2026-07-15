import crypto from "crypto";
import { Router, type Request } from "express";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { requirePlanAccess } from "../middleware/plan-guard.js";
import { rateLimit } from "../middleware/rate-limit.js";
import {
    createInterview,
    startInterview,
    endInterview,
    cancelInterview,
    getInterviewById,
    getUserInterviews,
} from "../services/interview.service.js";
import { db } from "../db/index.js";
import {
    profiles,
    interviews,
    realtimeSessions,
    conversationTurns,
} from "../db/schema.js";
import { enqueueReportGeneration } from "../jobs/generate-report.js";
import { enqueueEmail } from "../jobs/send-email.js";
import {
    createConvAISession,
    endConvAISession,
} from "../realtime/convai-session.js";
import { buildInterviewerSystemPrompt } from "../realtime/interview-prompt.js";
import { PLAN_LIMITS } from "@repo/shared/constants/taxonomy";

const router = Router();

function getParam(req: Request, name: string) {
    const value = req.params[name];
    return typeof value === "string" && value.length > 0 ? value : null;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Unknown error";
}

function getShareSecret() {
    return process.env.REPORT_SHARE_SECRET!;
}

function signSharePayload(payload: { interviewId: string; userId: string }) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", getShareSecret())
        .update(body)
        .digest("base64url");

    return `${body}.${signature}`;
}

function verifyShareToken(token: string) {
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const expected = crypto
        .createHmac("sha256", getShareSecret())
        .update(body)
        .digest("base64url");

    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
        providedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const payload = JSON.parse(
            Buffer.from(body, "base64url").toString("utf8"),
        ) as { interviewId?: unknown; userId?: unknown };

        if (
            typeof payload.interviewId !== "string" ||
            typeof payload.userId !== "string"
        ) {
            return null;
        }

        return {
            interviewId: payload.interviewId,
            userId: payload.userId,
        };
    } catch {
        return null;
    }
}

router.post(
    "/",
    requireAuth,
    requirePlanAccess(),
    rateLimit(10, 60),
    async (req, res) => {
        try {
            if (
                !req.body.roleTitle ||
                !Array.isArray(req.body.interviewTypes) ||
                req.body.interviewTypes.length === 0
            ) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message:
                            "roleTitle and at least one interview type are required",
                    },
                });
                return;
            }

            const profile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, req.user!.id),
            });

            const durationMinutes = Number.parseInt(
                String(req.body.durationMinutes ?? "30"),
                10,
            );

            const interview = await createInterview({
                userId: req.user!.id,
                roleTitle: String(req.body.roleTitle),
                industry: req.body.industry || profile?.industry,
                functionCategory:
                    req.body.functionCategory || profile?.functionCategory,
                seniority:
                    req.body.seniority || profile?.seniority || "Mid-Level",
                interviewTypes: req.body.interviewTypes,
                interviewerTone: req.body.interviewerTone || "balanced",
                voiceAccent: req.body.voiceAccent || "american",
                durationMinutes: Number.isFinite(durationMinutes)
                    ? durationMinutes
                    : 30,
                targetCompany:
                    req.body.targetCompany || profile?.targetCompanies?.[0],
                jobDescription: req.body.jobDescription,
                skills: profile?.skills,
                experienceYears: profile?.experienceYears,
                consumePackCredit: String(req.user!.plan).endsWith("_pack"),
            });

            const interviewsUsed = req.user!.interviewCount + 1;
            if (
                req.user!.plan === "free" &&
                interviewsUsed >= PLAN_LIMITS.free.maxInterviews
            ) {
                try {
                    await enqueueEmail("trial_ending", {
                        to: req.user!.email,
                        name: req.user!.name,
                        interviewsUsed,
                    });
                } catch (emailErr) {
                    console.error(
                        "[Interviews] Failed to enqueue trial ending email:",
                        emailErr,
                    );
                }
            }

            res.status(201).json({ success: true, data: interview });
        } catch (error) {
            console.error("[Interviews] Error creating interview:", error);
            const errorMessage = getErrorMessage(error);
            if (errorMessage === "NO_ACTIVE_CREDITS") {
                res.status(403).json({
                    success: false,
                    error: {
                        code: "PLAN_LIMIT_REACHED",
                        message:
                            "You have no active interview credits remaining. Purchase a new pack to continue.",
                    },
                });
                return;
            }
            const isAiConfigError =
                errorMessage.includes("ANTHROPIC_API_KEY") ||
                errorMessage.includes("GEMINI_API_KEY");

            res.status(500).json({
                success: false,
                error: {
                    code: isAiConfigError
                        ? "AI_NOT_CONFIGURED"
                        : "INTERNAL_ERROR",
                    message: isAiConfigError
                        ? "AI is not configured. Set the API key for the selected AI_PROVIDER on the API server."
                        : "Failed to create interview",
                },
            });
        }
    },
);

router.get("/", requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const result = await getUserInterviews(req.user!.id, page, pageSize);

        res.json({
            success: true,
            data: result.interviews,
            pagination: {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / result.pageSize),
            },
        });
    } catch (error) {
        console.error("[Interviews] Error listing interviews:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to list interviews",
            },
        });
    }
});

router.get("/:id", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const interview = await getInterviewById(interviewId);

        if (!interview || interview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        res.json({ success: true, data: interview });
    } catch (error) {
        console.error("[Interviews] Error fetching interview:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to fetch interview",
            },
        });
    }
});

router.post("/:id/share", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const interview = await getInterviewById(interviewId);
        if (!interview || interview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        if (!interview.report) {
            res.status(409).json({
                success: false,
                error: {
                    code: "REPORT_NOT_READY",
                    message:
                        "This report is not ready to share yet. Try again after processing completes.",
                },
            });
            return;
        }

        const token = signSharePayload({
            interviewId,
            userId: req.user!.id,
        });

        res.json({ success: true, data: { token } });
    } catch (error) {
        console.error("[Interviews] Error creating share token:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create share link",
            },
        });
    }
});

router.get("/shared/:token", async (req, res) => {
    try {
        const token = getParam(req, "token");
        if (!token) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Share token is required",
                },
            });
            return;
        }

        const payload = verifyShareToken(token);
        if (!payload) {
            res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "This share link is invalid or unavailable.",
                },
            });
            return;
        }

        const interview = await getInterviewById(payload.interviewId);
        if (
            !interview ||
            interview.userId !== payload.userId ||
            !interview.report
        ) {
            res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "This shared report is unavailable.",
                },
            });
            return;
        }

        res.json({
            success: true,
            data: {
                id: interview.id,
                roleTitle: interview.roleTitle,
                seniority: interview.seniority,
                interviewTypes: interview.interviewTypes,
                durationMinutes: interview.durationMinutes,
                createdAt: interview.createdAt,
                report: interview.report,
            },
        });
    } catch (error) {
        console.error("[Interviews] Error fetching shared report:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to fetch shared report",
            },
        });
    }
});

router.patch("/:id/start", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const interview = await startInterview(interviewId, req.user!.id);
        if (!interview) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        res.json({ success: true, data: interview });
    } catch (error) {
        console.error("[Interviews] Error starting interview:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to start interview",
            },
        });
    }
});

router.patch("/:id/end", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const existingInterview = await getInterviewById(interviewId);
        if (!existingInterview || existingInterview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        if (existingInterview.status === "completed") {
            res.json({ success: true, data: existingInterview });
            return;
        }

        const interview =
            existingInterview.status === "processing"
                ? existingInterview
                : await endInterview(interviewId);

        if (!interview) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        await enqueueReportGeneration({
            interviewId,
            userId: req.user!.id,
            userEmail: req.user!.email,
            userName: req.user!.name,
        });

        res.json({ success: true, data: interview });
    } catch (error) {
        console.error("[Interviews] Error ending interview:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to end interview",
            },
        });
    }
});

router.patch("/:id/cancel", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const existingInterview = await getInterviewById(interviewId);
        if (!existingInterview || existingInterview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        const interview = await cancelInterview(interviewId);
        res.json({ success: true, data: interview });
    } catch (error) {
        console.error("[Interviews] Error cancelling interview:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to cancel interview",
            },
        });
    }
});

/* Realtime session routes */
router.post("/:id/realtime/start", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const interview = await getInterviewById(interviewId);
        if (!interview || interview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        if (
            interview.status !== "configuring" &&
            interview.status !== "active"
        ) {
            res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_STATUS",
                    message: `Cannot start a realtime session for an interview with status '${interview.status}'`,
                },
            });
            return;
        }

        // build the system prompt for the AI interviewer
        const systemPrompt = buildInterviewerSystemPrompt({
            roleTitle: interview.roleTitle,
            industry: interview.industry,
            functionCategory: interview.functionCategory,
            seniority: interview.seniority,
            interviewTypes: interview.interviewTypes,
            interviewerTone: interview.interviewerTone,
            durationMinutes: interview.durationMinutes,
            targetCompany: interview.targetCompany ?? undefined,
            jobDescription: interview.jobDescription ?? undefined,
        });

        // create the ElevenLabs ConvAI session (signed URL)
        const { agentId, signedUrl, overrides } = await createConvAISession({
            interviewId,
            userId: req.user!.id,
            systemPrompt,
            voiceAccent: interview.voiceAccent,
            durationMinutes: interview.durationMinutes,
            roleTitle: interview.roleTitle,
        });

        const startedAt = new Date();

        // Retrying the live page must refresh the existing one-to-one session,
        // rather than failing on realtime_sessions.interview_id's unique key.
        const [session] = await db
            .insert(realtimeSessions)
            .values({
                interviewId,
                convaiAgentId: agentId,
                status: "active",
                startedAt,
            })
            .onConflictDoUpdate({
                target: realtimeSessions.interviewId,
                set: {
                    convaiAgentId: agentId,
                    status: "active",
                    startedAt,
                    endedAt: null,
                },
            })
            .returning();

        // update interview status to active
        await db
            .update(interviews)
            .set({ status: "active", startedAt })
            .where(eq(interviews.id, interviewId));

        res.json({
            success: true,
            data: { signedUrl, sessionId: session!.id, overrides },
        });
    } catch (error) {
        console.error("[Interviews] Error starting realtime session:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to start realtime session",
            },
        });
    }
});

router.post("/:id/realtime/end", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const interview = await getInterviewById(interviewId);
        if (!interview || interview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        // find the active realtime session
        const session = await db.query.realtimeSessions.findFirst({
            where: eq(realtimeSessions.interviewId, interviewId),
        });

        if (session?.convaiConversationId) {
            try {
                await endConvAISession(session.convaiConversationId);
            } catch (convaiErr) {
                console.warn(
                    "[Interviews] Error ending ConvAI session (continuing):",
                    convaiErr,
                );
            }
        }

        // update session status to ended
        if (session) {
            await db
                .update(realtimeSessions)
                .set({ status: "ended", endedAt: new Date() })
                .where(eq(realtimeSessions.id, session.id));
        }

        // update interview status to processing
        await db
            .update(interviews)
            .set({ status: "processing", endedAt: new Date() })
            .where(eq(interviews.id, interviewId));

        // enqueue report generation
        await enqueueReportGeneration({
            interviewId,
            userId: req.user!.id,
            userEmail: req.user!.email,
            userName: req.user!.name,
        });

        res.json({ success: true });
    } catch (error) {
        console.error("[Interviews] Error ending realtime session:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to end realtime session",
            },
        });
    }
});

router.get("/:id/transcript", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "id");
        if (!interviewId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Interview id is required",
                },
            });
            return;
        }

        const interview = await getInterviewById(interviewId);
        if (!interview || interview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Interview not found" },
            });
            return;
        }

        const turns = await db.query.conversationTurns.findMany({
            where: eq(conversationTurns.interviewId, interviewId),
            orderBy: [asc(conversationTurns.turnIndex)],
        });

        res.json({ success: true, data: turns });
    } catch (error) {
        console.error("[Interviews] Error fetching transcript:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to fetch transcript",
            },
        });
    }
});

export default router;
