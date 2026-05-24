import { Router, type Request } from "express";
import { eq } from "drizzle-orm";
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
import { profiles } from "../db/schema.js";
import { enqueueReportGeneration } from "../jobs/generate-report.js";

const router = Router();

function getParam(req: Request, name: string) {
    const value = req.params[name];
    return typeof value === "string" && value.length > 0 ? value : null;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Unknown error";
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
                mode: req.body.mode || "text",
                voiceAccent: req.body.voiceAccent,
                durationMinutes: Number.isFinite(durationMinutes)
                    ? durationMinutes
                    : 30,
                timerEnabled: req.body.timerEnabled ?? true,
                warmupMode: req.body.warmupMode ?? false,
                targetCompany:
                    req.body.targetCompany || profile?.targetCompanies?.[0],
                jobDescription: req.body.jobDescription,
                skills: profile?.skills,
                experienceYears: profile?.experienceYears,
            });

            res.status(201).json({ success: true, data: interview });
        } catch (error) {
            console.error("[Interviews] Error creating interview:", error);
            const errorMessage = getErrorMessage(error);
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
                        ? "Question generation is not configured. Set the API key for the selected AI_PROVIDER on the API server."
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

export default router;
