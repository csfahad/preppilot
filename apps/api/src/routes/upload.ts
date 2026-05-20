import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getUploadPresignedUrl, buildStorageKey } from "../lib/r2.js";

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

export default router;
