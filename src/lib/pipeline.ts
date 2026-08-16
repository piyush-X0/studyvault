import { extractText } from "./extract";
import { getFileBuffer } from "./getfilebuffer";
import { chunkText } from "./chunk";
import { generateEmbeddings } from "./embedding";
import { prisma } from "./prisma";

export async function runPipeline(documentId: string): Promise<void> {

    // Stage 1: Extract ──────────────────────────────────────────
    await prisma.document.update({
        where: { id: documentId },
        data: { extractedStatus: "PROCESSING", extractionError: null }
    });

    let extractedText: string;

    try {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: { r2Key: true, mimetype: true }
        });
        if (!document) throw new Error("Document not found");

        const buffer = await getFileBuffer(document.r2Key);
        extractedText = await extractText(buffer, document.mimetype);

        await prisma.document.update({
            where: { id: documentId },
            data: { extractedStatus: "EXTRACTED", extractedText }
        });

    } catch (error) {
        await prisma.document.update({
            where: { id: documentId },
            data: {
                extractedStatus: "FAILED",
                extractionError: error instanceof Error ? error.message : "Unknown error"
            }
        });
        throw error;
    }

    //  Stage 2: Chunk ────────────────────────────────────────────

    try {
        const existingCount = await prisma.documentChunks.count({
            where: { documentId }
        });

        if (existingCount === 0) {
            const chunks = chunkText(extractedText);
            await prisma.documentChunks.createMany({
                data: chunks.map((chunk) => ({
                    documentId,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex,
                    charCount: chunk.charCount
                }))
            });
        }

    } catch (error) {
        await prisma.document.update({
            where: { id: documentId },
            data: {
                extractedStatus: "FAILED",
                extractionError: error instanceof Error ? error.message : "Chunking failed"
            }
        });
        throw error;
    }

    // Stage 3: Embed ────────────────────────────────────────────

    await prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: "PROCESSING" }
    });

    try {
        const chunks = await prisma.documentChunks.findMany({
            where: { documentId },
            select: { id: true, content: true },
            orderBy: { chunkIndex: "asc" }
        });

        const vectors = await generateEmbeddings(chunks.map((c) => c.content));
        const ids = chunks.map((c) => c.id);
        const vectorLiterals = vectors.map((v) => `[${v.join(",")}]`);

        await prisma.$executeRaw`
            UPDATE "DocumentChunks" AS dc
            SET embedding = v.embedding::vector
            FROM unnest(${ids}::text[], ${vectorLiterals}::text[]) AS v(id, embedding)
            WHERE dc.id = v.id`;

        await prisma.document.update({
            where: { id: documentId },
            data: { embeddingStatus: "EMBEDDED" }
        });

    } catch (error) {
        await prisma.document.update({
            where: { id: documentId },
            data: {
                embeddingStatus: "FAILED",
                embeddingError: error instanceof Error ? error.message : "Embedding failed"
            }
        });
        throw error;
    }
}