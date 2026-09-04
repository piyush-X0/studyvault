import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { prisma } from '@/lib/prisma';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseJsonBody } from "@/lib/validation";
import { uploadBodySchema } from "@/lib/schemas/upload";

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
export async function POST(req: NextRequest) {
    const DEV_USER_ID = "dev-user-id";//later will replace with session.id after next-auth
    try {
        const raw = await req.json();
        const { filename, contentType, size } = parseJsonBody(raw, uploadBodySchema);

        if (!filename || !contentType || !size) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }
        if (!ALLOWED_TYPES.has(contentType)) {
            return NextResponse.json({ error: "UnSupported file tye" }, { status: 400 });
        }
        if (size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large. Maximum size is 3MB" }, { status: 400 });
        }
        const r2Key = `${DEV_USER_ID}/${randomUUID()}-${filename}`
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
            ContentType: contentType
        });

        const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 }); //5min

        const document = await prisma.document.create({
            data: {
                userId: DEV_USER_ID,
                filename,
                r2Key,
                size,
                mimetype: contentType
            }
        });
        return NextResponse.json({ presignedUrl, documentId: document.id, r2Key }, { status: 201 });
    }
    catch (error) {
        if (error instanceof Error && (error as any).issues) {
            return NextResponse.json({ error: "Invalid request body", details: (error as any).issues }, { status: 400 });
        }
        console.error("Uploading failed : ", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}