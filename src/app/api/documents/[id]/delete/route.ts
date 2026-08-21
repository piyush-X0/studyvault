import { prisma } from "@/lib/prisma";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { getDocumentForUser, DEV_USER_ID } from "@/lib/getDocument";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const document = await getDocumentForUser(id, DEV_USER_ID, {
            id: true, r2Key: true
        })

        if (!document) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        await r2Client.send(
            new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: document.r2Key })
        )

        await prisma.document.delete({ where: { id } })

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error("[DELETE /api/documents/[id]/delete]", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}