import { NextRequest, NextResponse } from "next/server";
import { BUCKET_NAME, r2Client } from "@/lib/r2";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest, res: Response) {
    try {

        const { filename, contentType, size } = await req.json();

        const MAX_FILE_SIZE = 10 * 1024 * 1024;

        if (!filename || !contentType || !size) {
            return NextResponse.json({ error: "MISSING Fields" }, { status: 400 });
        }
        if (size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Maximum File Size is 10MB " }, { status: 400 });
        }

        const r2Key = `${randomUUID()}-${filename}`
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
            ContentType: contentType
        });

        const presignedURL = await getSignedUrl(r2Client, command, { expiresIn: 300 });

        const document = await prisma.document.create({
            data: { filename, mimetype: contentType, size, r2Key }
        });
        return NextResponse.json({ presignedURL, r2Key, documentID: document.id }, { status: 200 });
    }
    catch (error) {
        console.log("POST [ api/upload ]: ", error);
        return NextResponse.json({ error: "Server Internal Error" }, { status: 500 });
    }
}