import { Router, type Request } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    submitAndScoreAnswer,
    getInterviewScores,
} from "../services/scoring.service.js";
import {
    decideAdaptiveFollowUp,
    getInterviewById,
} from "../services/interview.service.js";
import { rateLimit } from "../middleware/rate-limit.js";

const router = Router();

function getParam(req: Request, name: string) {
    const value = req.params[name];
    return typeof value === "string" && value.length > 0 ? value : null;
}

router.post("/", requireAuth, rateLimit(30, 60), async (req, res) => {
    try {
        const { questionId, text, audioUrl, durationSeconds, isRedo } =
            req.body;

        if (!questionId || !text) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "questionId and text are required",
                },
            });
            return;
        }

        const result = await submitAndScoreAnswer({
            questionId,
            userId: req.user!.id,
            text,
            audioUrl,
            durationSeconds,
            isRedo,
        });

        res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
        console.error("[Answers] Error submitting answer:", error);
        const message =
            error instanceof Error ? error.message : "Failed to submit answer";

        if (message === "You can only redo an answer once") {
            res.status(400).json({
                success: false,
                error: { code: "REDO_LIMIT", message },
            });
            return;
        }

        if (message === "Question not found") {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message },
            });
            return;
        }

        if (message === "Question does not belong to this user") {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code:
                    message.includes("ANTHROPIC_API_KEY") ||
                    message.includes("GEMINI_API_KEY")
                        ? "AI_NOT_CONFIGURED"
                        : "INTERNAL_ERROR",
                message:
                    message.includes("ANTHROPIC_API_KEY") ||
                    message.includes("GEMINI_API_KEY")
                        ? "Answer scoring is not configured. Set the API key for the selected AI_PROVIDER on the API server."
                        : "Failed to submit answer",
            },
        });
    }
});

// decide adaptive follow-up
router.post("/:answerId/adaptive", requireAuth, async (req, res) => {
    try {
        const answerId = getParam(req, "answerId");
        if (!answerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Answer id is required",
                },
            });
            return;
        }

        const {
            question,
            answer,
            currentScore,
            interviewId,
            currentOrder,
            roleTitle,
            seniority,
        } = req.body;

        if (
            !question ||
            !answer ||
            !interviewId ||
            typeof currentOrder !== "number"
        ) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message:
                        "question, answer, interviewId, and currentOrder are required",
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

        const decision = await decideAdaptiveFollowUp({
            question,
            answer,
            currentScore: Number(currentScore),
            roleTitle: roleTitle || interview.roleTitle,
            seniority: seniority || interview.seniority,
            interviewId,
            currentOrder,
        });

        res.json({ success: true, data: decision });
    } catch (error) {
        console.error("[Answers] Error deciding follow-up:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to decide follow-up",
            },
        });
    }
});

router.get("/interview/:interviewId/scores", requireAuth, async (req, res) => {
    try {
        const interviewId = getParam(req, "interviewId");
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

        const scores = await getInterviewScores(interviewId);
        res.json({ success: true, data: scores });
    } catch (error) {
        console.error("[Answers] Error fetching scores:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to fetch scores",
            },
        });
    }
});

export default router;
