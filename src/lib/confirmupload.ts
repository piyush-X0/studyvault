import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "./prisma";
import { BUCKET_NAME, r2Client } from "./r2";


export async function confirmUpload(documentId: string) {

    const documents = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, r2Key: true, uploadedStatus: true }
    });

    if (!documents) {
        return { ok: false as const, reason: "NOT FOUND " as const };
    }
    if (documents.uploadedStatus == "UPLOADED") {
        return { ok: true as const, reason: "ALREADY UPLOADED" };
    }

    try {
        await r2Client.send(
            new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: documents.r2Key })
        )
    } catch (error) {
        await prisma.document.update({
            where: { id: documentId },
            data: { uploadedStatus: "FAILED" }
        });
        return { ok: false as const, reason: "FILE NOT IN STORAGE" as const };
    }
    const updated = await prisma.document.update({
        where: { id: documentId },
        data: { uploadedStatus: "UPLOADED" }
    });
    return { ok: true as const, status: updated.uploadedStatus };
}