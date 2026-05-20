import { Router } from "express";
import { db } from "../db/index.js";
import { profiles, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
    try {
        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, req.user!.id),
        });

        res.json({ success: true, data: profile ?? null });
    } catch (error) {
        console.error("[Profiles] Error fetching profile:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to fetch profile",
            },
        });
    }
});

// Create profile (onboarding)
router.post("/", requireAuth, async (req, res) => {
    try {
        const {
            industry,
            functionCategory,
            subFunction,
            seniority,
            experienceYears,
            resumeUrl,
            targetCompanies,
            careerGoal,
            skills,
        } = req.body;

        const existing = await db.query.profiles.findFirst({
            where: eq(profiles.userId, req.user!.id),
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: "PROFILE_EXISTS",
                    message: "Profile already exists. Use PATCH to update.",
                },
            });
            return;
        }

        const [profile] = await db
            .insert(profiles)
            .values({
                userId: req.user!.id,
                industry,
                functionCategory,
                subFunction,
                seniority,
                experienceYears: experienceYears ?? 0,
                resumeUrl,
                targetCompanies: targetCompanies ?? [],
                careerGoal,
                skills: skills ?? [],
            })
            .returning();

        await db
            .update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, req.user!.id));

        res.status(201).json({ success: true, data: profile });
    } catch (error) {
        console.error("[Profiles] Error creating profile:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create profile",
            },
        });
    }
});

router.patch("/me", requireAuth, async (req, res) => {
    try {
        const updateData: Record<string, any> = {};
        const allowed = [
            "industry",
            "functionCategory",
            "subFunction",
            "seniority",
            "experienceYears",
            "resumeUrl",
            "resumeParsedData",
            "targetCompanies",
            "careerGoal",
            "skills",
        ];

        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        }

        updateData.updatedAt = new Date();

        const [updated] = await db
            .update(profiles)
            .set(updateData)
            .where(eq(profiles.userId, req.user!.id))
            .returning();

        if (!updated) {
            res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Profile not found" },
            });
            return;
        }

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("[Profiles] Error updating profile:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to update profile",
            },
        });
    }
});

export default router;
