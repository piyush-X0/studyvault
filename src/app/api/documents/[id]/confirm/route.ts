import { prisma } from "@/lib/prisma";
import { BUCKET_NAME, r2Client } from "@/lib/r2";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    try {
        const { id } = await params;

        const documents = await prisma.document.findUnique({
            where: { id }, select: { id: true, uploadStatus: true, r2Key: true }
        });

        if (!documents) {
            return NextResponse.json({ error: "Document not Found" }, { status: 400 });
        }
        if (documents.uploadStatus == "UPLOADED") {
            return NextResponse.json({ status: "UPLOADED" });
        }

        try {
            await r2Client.send(
                new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: documents.r2Key })
            )
        }
        catch (er) {
            await prisma.document.update({
                where: { id }, data: { uploadStatus: "FAILED" }
            });
            return NextResponse.json({ error: "file is not found in storage", status: "FAILED" }, { status: 422 });
        }
        const updated = await prisma.document.update({
            where: { id },
            data: { uploadStatus: "UPLOADED" }
        });
        return NextResponse.json({ status: updated.uploadStatus });
    }
    catch (er) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}