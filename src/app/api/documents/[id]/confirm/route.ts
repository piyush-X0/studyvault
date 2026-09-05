import { auth } from "@/auth";
import { getDocumentForUser } from "@/lib/getDocument";
import { runPipeline } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { BUCKET_NAME, r2Client } from "@/lib/r2";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    try {
        const { id } = await params;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const documents = await getDocumentForUser(id, session.user.id, {
            id: true, uploadedStatus: true, r2Key: true
        });
        if (!documents) {
            return NextResponse.json({ error: "Document not Found" }, { status: 400 });
        }
        if (documents.uploadedStatus == "UPLOADED") {
            return NextResponse.json({ status: "UPLOADED" });
        }

        try {
            await r2Client.send(
                new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: documents.r2Key })
            )
        }
        catch {
            await prisma.document.update({
                where: { id }, data: { uploadedStatus: "FAILED" }
            });
            return NextResponse.json({ error: "file is not found in storage", status: "FAILED" }, { status: 422 });
        }
        await prisma.document.update({
            where: { id },
            data: { uploadedStatus: "UPLOADED" }
        });

        runPipeline(id).catch((error) => {
            console.error("Pipeline failed: ", error)
        });
        return NextResponse.json({
            status: "UPLOADED", message: "Pipeline Started"
        });
    }
    catch (er) {
        console.error("confirmation failed : ", er)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}