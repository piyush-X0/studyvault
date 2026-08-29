import { extractText } from "./extract";
import { getFileBuffer } from "./getfilebuffer";
import { chunkText } from "./chunk";
import { generateEmbeddings } from "./embedding";
import { prisma } from "./prisma";
import { timeStage } from "./utils";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, r2Client } from "./r2";

async function withPipelineRetry<T>(
    fn: () => Promise<T>,
    stageName: string,
    retries = 3
): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            const isTransient = error instanceof Error && (
                error.message.includes("ETIMEDOUT") ||
                error.message.includes("Connection terminated") ||
                error.message.includes("rate limit") ||
                error.message.includes("503") ||
                error.message.includes("fetch failed")
            )

            if (isTransient && attempt < retries) {
                const delay = attempt * 2000
                console.error(`[pipeline] ${stageName} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms`)
                await new Promise(r => setTimeout(r, delay))
                continue
            }

            console.error(`[pipeline] ${stageName} permanently failed:`, error)
            throw error
        }
    }
    throw new Error("unreachable")
}

async function autoCleanup(documentId: string, r2Key: string): Promise<void> {
    setTimeout(async () => {
        try {
            await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: r2Key }))
            await prisma.document.delete({ where: { id: documentId } })
            console.log(`[pipeline] auto-cleaned failed document ${documentId}`)
        } catch {
            console.error(`[pipeline] auto-cleanup failed for ${documentId}`)
        }
    }, 5000)
}

export async function runPipeline(documentId: string): Promise<void> {

    // fetch document first — accessible in all catch blocks
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { r2Key: true, mimetype: true }
    });
    if (!document) throw new Error("Document not found");

    // ── Stage 1: Extract ──────────────────────────────────────
    prisma.document.update({
        where: { id: documentId },
        data: { extractedStatus: "PROCESSING", extractionError: null }
    }).catch(() => { });

    let extractedText: string;

    try {
        const buffer = await withPipelineRetry(
            () => timeStage("fetch from R2", () => getFileBuffer(document.r2Key)),
            "fetch from R2"
        )

        extractedText = await withPipelineRetry(
            () => timeStage("extract text", () => extractText(buffer, document.mimetype)),
            "extract text"
        )

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
        autoCleanup(documentId, document.r2Key)
        throw error;
    }

    // ── Stage 2: Chunk ────────────────────────────────────────
    try {
        const existingCount = await prisma.documentChunks.count({
            where: { documentId }
        });

        if (existingCount === 0) {
            const chunks = chunkText(extractedText)
            console.log(`[pipeline] chunk text: ${chunks.length} chunks`)
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
        autoCleanup(documentId, document.r2Key)
        throw error;
    }

    // ── Stage 3: Embed ────────────────────────────────────────
    prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: "PROCESSING" }
    }).catch(() => { });

    try {
        const chunks = await prisma.documentChunks.findMany({
            where: { documentId },
            select: { id: true, content: true },
            orderBy: { chunkIndex: "asc" }
        });

        const vectors = await withPipelineRetry(
            () => timeStage("generate embeddings", () =>
                generateEmbeddings(chunks.map((c) => c.content))
            ),
            "generate embeddings"
        )

        const ids = chunks.map((c) => c.id);
        const vectorLiterals = vectors.map((v) => `[${v.join(",")}]`);

        await withPipelineRetry(
            () => timeStage("store vectors", () =>
                prisma.$executeRaw`
                    UPDATE "DocumentChunks" AS dc
                    SET embedding = v.embedding::vector
                    FROM unnest(${ids}::text[], ${vectorLiterals}::text[]) AS v(id, embedding)
                    WHERE dc.id = v.id`
            ),
            "store vectors"
        )

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
        autoCleanup(documentId, document.r2Key)
        throw error
    }
}