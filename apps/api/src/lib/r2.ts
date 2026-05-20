import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 600, // 10 minutes
): Promise<{ uploadUrl: string; fileUrl: string }> {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
    const fileUrl = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key;

    return { uploadUrl, fileUrl };
}

// Generate a presigned URL for downloading / viewing
export async function getDownloadPresignedUrl(
    key: string,
    expiresIn = 3600,
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
}

// Upload a buffer directly from server side (e.g., generated images)
export async function uploadBuffer(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await r2Client.send(command);
    return PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key;
}

export async function deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    await r2Client.send(command);
}

// Generate storage key with folder structure
export function buildStorageKey(
    folder: "resumes" | "audio" | "reports" | "avatars",
    userId: string,
    filename: string,
): string {
    const timestamp = Date.now();
    return `${folder}/${userId}/${timestamp}-${filename}`;
}
