import type { Request, Response, NextFunction } from "express";
import { PLAN_LIMITS, type UserPlan } from "@repo/shared/constants/taxonomy";

export function requirePlanAccess(
    feature?: "voice" | "model_answers" | "full_feedback",
) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required",
                },
            });
            return;
        }

        const plan = req.user.plan as UserPlan;
        const limits = PLAN_LIMITS[plan];

        if (!limits) {
            res.status(403).json({
                success: false,
                error: {
                    code: "INVALID_PLAN",
                    message: "Unknown subscription plan",
                },
            });
            return;
        }

        if (req.user.interviewCount >= limits.maxInterviews) {
            res.status(403).json({
                success: false,
                error: {
                    code: "PLAN_LIMIT_REACHED",
                    message: `You've used all ${limits.maxInterviews} interviews on the free plan. Upgrade to continue.`,
                },
            });
            return;
        }

        // check feature-specific access
        if (feature === "voice" && !limits.voiceEnabled) {
            res.status(403).json({
                success: false,
                error: {
                    code: "FEATURE_LOCKED",
                    message:
                        "Voice interviews are available on Pro plans. Upgrade to unlock.",
                },
            });
            return;
        }

        if (feature === "model_answers" && !limits.modelAnswers) {
            res.status(403).json({
                success: false,
                error: {
                    code: "FEATURE_LOCKED",
                    message:
                        "Model answers are available on Pro plans. Upgrade to see expert-level answers.",
                },
            });
            return;
        }

        if (feature === "full_feedback" && !limits.fullFeedback) {
            res.status(403).json({
                success: false,
                error: {
                    code: "FEATURE_LOCKED",
                    message:
                        "Full feedback is available on Pro plans. Upgrade to get detailed analysis.",
                },
            });
            return;
        }

        next();
    };
}
