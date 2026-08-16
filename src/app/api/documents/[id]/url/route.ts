import { getDocumentForUser, DEV_USER_ID } from "@/lib/getDocument";
import { BUCKET_NAME, r2Client } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const mode = req.nextUrl.searchParams.get("mode");

        if (!id) {
            return NextResponse.json({ error: "Document Id is required" }, { status: 400 });
        }
        const documents = await getDocumentForUser(id, DEV_USER_ID, {
            id: true, r2Key: true, filename: true, mimetype: true
        });

        if (!documents) {
            return NextResponse.json({ error: "Document not Found " }, { status: 400 });
        }

        const safeFileName = encodeURIComponent(documents.filename);

        const contentDisposition = mode === "download" ?
            `attachment; filename="${safeFileName}"` : `inline; filename="${safeFileName}"`

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: documents.r2Key,
            ResponseContentDisposition: contentDisposition,
            ResponseContentType: documents.mimetype
        });

        const presignedURL = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        return NextResponse.json({ url: presignedURL });

    } catch (er) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}