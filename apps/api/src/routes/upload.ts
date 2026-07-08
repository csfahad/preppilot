import { Router } from "express";
import type { Request } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    getUploadPresignedUrl,
    buildStorageKey,
    uploadBuffer,
} from "../lib/r2.js";
import { db } from "../db/index.js";
import { interviewRecordings, interviews } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();
const validFolders = ["resumes", "audio", "reports", "avatars"] as const;
const MAX_UPLOAD_BYTES = Number.parseInt(
    process.env.UPLOAD_MAX_BYTES ?? String(512 * 1024 * 1024),
    10,
);

function getHeaderValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function getContentLength(value: string | undefined): number | undefined {
    if (!value) return undefined;

    const length = Number(value);
    return Number.isSafeInteger(length) && length >= 0 ? length : undefined;
}

function decodeHeaderValue(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

async function readRequestBuffer(
    req: Request,
    maxBytes = MAX_UPLOAD_BYTES,
): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk as Uint8Array);
        totalBytes += buffer.length;

        if (totalBytes > maxBytes) {
            throw new Error("UPLOAD_TOO_LARGE");
        }

        chunks.push(buffer);
    }

    return Buffer.concat(chunks, totalBytes);
}

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

router.post("/file", requireAuth, async (req, res) => {
    try {
        const filenameHeader = getHeaderValue(req.headers["x-filename"]);
        const folderHeader = getHeaderValue(req.headers["x-folder"]);
        const contentType = req.headers["content-type"];

        if (!filenameHeader || !contentType) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "x-filename header and Content-Type are required",
                },
            });
            return;
        }

        const folder = validFolders.includes(folderHeader as any)
            ? (folderHeader as (typeof validFolders)[number])
            : "resumes";
        const key = buildStorageKey(
            folder,
            req.user!.id,
            decodeHeaderValue(filenameHeader),
        );
        const body = await readRequestBuffer(req);
        const fileUrl = await uploadBuffer(key, body, contentType);

        res.json({
            success: true,
            data: { fileUrl, key },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "UPLOAD_TOO_LARGE") {
            res.status(413).json({
                success: false,
                error: {
                    code: "UPLOAD_TOO_LARGE",
                    message: "Uploaded file is too large",
                },
            });
            return;
        }

        console.error("[Upload] Error uploading file:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to upload file",
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

router.post("/recording", requireAuth, async (req, res) => {
    try {
        const interviewId = getHeaderValue(req.headers["x-interview-id"]);
        const contentType = req.headers["content-type"];

        if (!interviewId || !contentType) {
            res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message:
                        "x-interview-id header and Content-Type are required",
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
                    message: `Content-Type must be one of: ${validTypes.join(", ")}`,
                },
            });
            return;
        }

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
        const body = await readRequestBuffer(req);
        const fileUrl = await uploadBuffer(key, body, contentType);

        await db
            .insert(interviewRecordings)
            .values({
                interviewId,
                userId: req.user!.id,
                videoUrl: contentType === "video/webm" ? fileUrl : null,
                audioUrl: contentType === "audio/webm" ? fileUrl : null,
                fileSizeBytes: getContentLength(req.headers["content-length"]),
            })
            .onConflictDoUpdate({
                target: interviewRecordings.interviewId,
                set: {
                    videoUrl:
                        contentType === "video/webm" ? fileUrl : undefined,
                    audioUrl:
                        contentType === "audio/webm" ? fileUrl : undefined,
                    fileSizeBytes: getContentLength(
                        req.headers["content-length"],
                    ),
                },
            });

        res.json({
            success: true,
            data: { fileUrl, key },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "UPLOAD_TOO_LARGE") {
            res.status(413).json({
                success: false,
                error: {
                    code: "UPLOAD_TOO_LARGE",
                    message: "Uploaded recording is too large",
                },
            });
            return;
        }

        console.error("[Upload] Error uploading recording:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to upload recording",
            },
        });
    }
});

export default router;
