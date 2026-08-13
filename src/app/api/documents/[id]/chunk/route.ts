import { chunkText } from "@/lib/chunk";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function POST(req: NextResponse, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const document = await prisma.document.findUnique({
            where: { id },
            select: { id: true, extractedStatus: true, extractedText: true }
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
        console.log("chunk error ------", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}