import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getUploadPresignedUrl, buildStorageKey } from "../lib/r2.js";
import { db } from "../db/index.js";
import { interviewRecordings, interviews } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/presign", requireAuth, async (req, res) => {
    try {
        const { filename, contentType, folder } = req.body;

        if (!filename || !contentType) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "filename and contentType are required",
                },
            });
            return;
        }

        const validFolders = [
            "resumes",
            "audio",
            "reports",
            "avatars",
        ] as const;
        const uploadFolder = validFolders.includes(folder) ? folder : "resumes";

        const key = buildStorageKey(uploadFolder, req.user!.id, filename);
        const { uploadUrl, fileUrl } = await getUploadPresignedUrl(
            key,
            contentType,
        );

        res.json({
            success: true,
            data: { uploadUrl, fileUrl, key },
        });
    } catch (error) {
        console.error("[Upload] Error generating presigned URL:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to generate upload URL",
            },
        });
    }
});

router.post("/recording-url", requireAuth, async (req, res) => {
    try {
        const { interviewId, contentType } = req.body;

        if (!interviewId || !contentType) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "interviewId and contentType are required",
                },
            });
            return;
        }

        const validTypes = ["video/webm", "audio/webm"];
        if (!validTypes.includes(contentType)) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: `contentType must be one of: ${validTypes.join(", ")}`,
                },
            });
            return;
        }

        // verify interview belongs to user
        const interview = await db.query.interviews.findFirst({
            where: eq(interviews.id, interviewId),
        });

        if (!interview || interview.userId !== req.user!.id) {
            res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Interview not found",
                },
            });
            return;
        }

        const key = `recordings/${req.user!.id}/${interviewId}/session.webm`;
        const { uploadUrl, fileUrl } = await getUploadPresignedUrl(
            key,
            contentType,
            3600, // 1 hour expiration for the upload URL
        );

        // save recording metadata
        await db
            .insert(interviewRecordings)
            .values({
                interviewId,
                userId: req.user!.id,
                videoUrl: contentType === "video/webm" ? fileUrl : null,
                audioUrl: contentType === "audio/webm" ? fileUrl : null,
            })
            .onConflictDoUpdate({
                target: interviewRecordings.interviewId,
                set: {
                    videoUrl:
                        contentType === "video/webm" ? fileUrl : undefined,
                    audioUrl:
                        contentType === "audio/webm" ? fileUrl : undefined,
                },
            });

        res.json({
            success: true,
            data: { uploadUrl, fileUrl, key },
        });
    } catch (error) {
        console.error("[Upload] Error generating recording URL:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to generate recording upload URL",
            },
        });
    }
});

export default router;
