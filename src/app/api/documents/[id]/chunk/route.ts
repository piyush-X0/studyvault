import { chunkText } from "@/lib/chunk";
import { getDocumentForUser } from "@/lib/getDocument";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const document = await getDocumentForUser(id, session.user.id, {
            id: true, extractedStatus: true, extractedText: true
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found " }, { status: 404 });

        }
        if (document.extractedStatus !== "EXTRACTED" || !document.extractedText) {
            return NextResponse.json({ error: "Document has not been Extracted yet" }, { status: 409 });
        }

        const existingChunkCount = await prisma.documentChunks.count({
            where: { documentId: id }
        });
        if (existingChunkCount > 0) {
            return NextResponse.json({ status: "ALREADY CHUNKED", chunkCount: existingChunkCount }, { status: 200 });
        }

        const chunks = chunkText(document.extractedText);
        await prisma.documentChunks.createMany({
            data: chunks.map((chunk) => ({
                documentId: id,
                content: chunk.content,
                chunkIndex: chunk.chunkIndex,
                charCount: chunk.charCount
            }))
        });
        return NextResponse.json({ status: "CHUNKED", chunkCount: chunks.length });

    } catch (error) {
        console.error("chunking failed : ", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}