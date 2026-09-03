import { generateEmbeddings } from "@/lib/embedding";
import { getDocumentForUser, DEV_USER_ID } from "@/lib/getDocument";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    let id: string | undefined;
    try {
        ({ id } = await params);

        const document = await getDocumentForUser(id, DEV_USER_ID, {
            id: true, embeddingStatus: true
        });

        if (!document) {
            return NextResponse.json({ error: "Document not Found" }, { status: 404 });
        }
        if (document.embeddingStatus == "EMBEDDED") {
            return NextResponse.json({ error: "Already Embedded" }, { status: 200 });
        }
        if (document.embeddingStatus == "PROCESSING") {
            return NextResponse.json({ error: "Embedding already in Progess" }, { status: 409 });
        }

        const chunks = await prisma.documentChunks.findMany({
            where: { documentId: id },
            select: { id: true, content: true },
            orderBy: { chunkIndex: "asc" }
        });
        if (chunks.length === 0) {
            return NextResponse.json({ error: "Document has not been chunked yet" }, { status: 409 });
        }

        chunks.forEach((c, i) => {
            if (!c.content || c.content.trim().length === 0) {
            }
        });
        await prisma.document.update({
            where: { id },
            data: { embeddingStatus: "PROCESSING" }
        });

        const vectors = await generateEmbeddings(chunks.map((chunk) => chunk.content));
        const ids = chunks.map((chunk) => chunk.id);
        const vectorLiterals = vectors.map((v) => `[${v.join(",")}]`);

        await prisma.$executeRaw`
        UPDATE "DocumentChunks" AS dc
        SET embedding = v.embedding::vector
        FROM unnest(${ids}::text[] , ${vectorLiterals}::text[]) AS v(id , embedding)
        WHERE dc.id = v.id`;

        await prisma.document.update({
            where: { id }, data: { embeddingStatus: "EMBEDDED" }
        });
        return NextResponse.json({ status: "EMBEDDED ", chunkCount: chunks.length });
    } catch (error) {
        console.error(" embedding message : ", error);

        if (id) {
            await prisma.document.update({
                where: { id },
                data: {
                    embeddingStatus: "FAILED",
                    embeddingError: error instanceof Error ? error.message : "Unknown Error"
                }
            }).catch(() => { });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

}