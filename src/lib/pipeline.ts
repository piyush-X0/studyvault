import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { chunkText } from "./chunk";
import { generateEmbeddings } from "./embedding";
import { extractText } from "./extract";
import { getFileBuffer } from "./getfilebuffer";
import { prisma } from "./prisma";
import { BUCKET_NAME, r2Client } from "./r2";
import { timeStage } from "./utils";

const MAX_EXTRACTED_CHARS = 900_000;
const FAILED_DOCUMENT_CLEANUP_DELAY_MS = 30_000;

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
}

function isQuotaError(error: unknown): boolean {
    const message = getErrorMessage(error).toLowerCase();

    return (
        message.includes("resource_exhausted") ||
        message.includes("quota") ||
        message.includes("429")
    );
}

function isTransientError(error: unknown): boolean {
    const message = getErrorMessage(error).toLowerCase();

    return (
        message.includes("etimedout") ||
        message.includes("connection terminated") ||
        message.includes("503") ||
        message.includes("fetch failed") ||
        message.includes("econnreset") ||
        message.includes("network")
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


async function withPipelineRetry<T>(
    fn: () => Promise<T>,
    stageName: string,
    retries = 3,
): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            return await fn();
        } catch (error) {
            if (isQuotaError(error)) {
                console.error(
                    `[pipeline] ${stageName} stopped: embedding/API quota is exhausted.`,
                    error,
                );

                throw error;
            }

            const canRetry = isTransientError(error) && attempt < retries;

            if (canRetry) {
                const delayMs = attempt * 2_000;

                console.error(
                    `[pipeline] ${stageName} failed (attempt ${attempt}/${retries}), retrying in ${delayMs}ms`,
                    error,
                );

                await sleep(delayMs);
                continue;
            }

            console.error(
                `[pipeline] ${stageName} permanently failed after ${attempt}/${retries} attempt(s):`,
                error,
            );

            throw error;
        }
    }

    throw new Error("Pipeline retry loop ended unexpectedly.");
}

async function autoCleanup(
    documentId: string,
    r2Key: string,
): Promise<void> {
    setTimeout(async () => {
        try {
            await r2Client.send(
                new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: r2Key,
                }),
            );

            await prisma.document.delete({
                where: {
                    id: documentId,
                },
            });

            console.log(`[pipeline] auto-cleaned failed document ${documentId}`);
        } catch (error) {
            console.error(
                `[pipeline] auto-cleanup failed for document ${documentId}:`,
                error,
            );
        }
    }, FAILED_DOCUMENT_CLEANUP_DELAY_MS);
}

export async function runPipeline(documentId: string): Promise<void> {
    const document = await prisma.document.findUnique({
        where: {
            id: documentId,
        },
        select: {
            r2Key: true,
            mimetype: true,
        },
    });

    if (!document) {
        throw new Error("Document not found.");
    }

    // ── Stage 1: Fetch and extract ───────────────────────────────

    await prisma.document.update({
        where: {
            id: documentId,
        },
        data: {
            extractedStatus: "PROCESSING",
            extractionError: null,
            embeddingStatus: "PENDING",
            embeddingError: null,
        },
    });

    let extractedText: string;

    try {
        const buffer = await withPipelineRetry(
            () => timeStage("fetch from R2", () => getFileBuffer(document.r2Key)),
            "fetch from R2",
        );

        extractedText = await withPipelineRetry(
            () =>
                timeStage("extract text", () =>
                    extractText(buffer, document.mimetype),
                ),
            "extract text",
        );

        console.log(
            `[pipeline] extracted ${extractedText.length} characters from document ${documentId}`,
        );

        if (extractedText.length > MAX_EXTRACTED_CHARS) {
            throw new Error(
                `Document is too large after text extraction (${extractedText.length.toLocaleString()} characters). ` +
                `Maximum allowed is ${MAX_EXTRACTED_CHARS.toLocaleString()} characters.`,
            );
        }

        await prisma.document.update({
            where: {
                id: documentId,
            },
            data: {
                extractedStatus: "EXTRACTED",
                extractedText,
                extractionError: null,
            },
        });
    } catch (error) {
        const message = getErrorMessage(error);

        await prisma.document.update({
            where: {
                id: documentId,
            },
            data: {
                extractedStatus: "FAILED",
                extractionError: message,
            },
        });

        void autoCleanup(documentId, document.r2Key);
        throw error;
    }

    // ── Stage 2: Chunk ───────────────────────────────────────────

    try {
        const existingCount = await prisma.documentChunks.count({
            where: {
                documentId,
            },
        });

        if (existingCount === 0) {
            const chunks = chunkText(extractedText);

            if (chunks.length === 0) {
                throw new Error("Document produced no valid text chunks.");
            }

            console.log(
                `[pipeline] created ${chunks.length} chunk(s) for document ${documentId}`,
            );

            await prisma.documentChunks.createMany({
                data: chunks.map((chunk) => ({
                    documentId,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex,
                    charCount: chunk.charCount,
                })),
            });
        } else {
            console.log(
                `[pipeline] document ${documentId} already has ${existingCount} chunk(s); skipping chunk creation.`,
            );
        }
    } catch (error) {
        const message = getErrorMessage(error);

        await prisma.document.update({
            where: {
                id: documentId,
            },
            data: {
                extractedStatus: "FAILED",
                extractionError: message,
            },
        });

        void autoCleanup(documentId, document.r2Key);
        throw error;
    }

    // ── Stage 3: Generate and store embeddings ───────────────────

    await prisma.document.update({
        where: {
            id: documentId,
        },
        data: {
            embeddingStatus: "PROCESSING",
            embeddingError: null,
        },
    });

    try {
        const chunks = await prisma.documentChunks.findMany({
            where: {
                documentId,
            },
            select: {
                id: true,
                content: true,
            },
            orderBy: {
                chunkIndex: "asc",
            },
        });

        if (chunks.length === 0) {
            throw new Error("No chunks are available for embedding.");
        }

        const vectors = await withPipelineRetry(
            () =>
                timeStage("generate embeddings", () =>
                    generateEmbeddings(chunks.map((chunk) => chunk.content)),
                ),
            "generate embeddings",
        );

        if (vectors.length !== chunks.length) {
            throw new Error(
                `Embedding count mismatch: expected ${chunks.length} vector(s), received ${vectors.length}.`,
            );
        }

        console.log(
            `[pipeline] generated ${vectors.length} embedding vector(s) for document ${documentId}`,
        );

        const ids = chunks.map((chunk) => chunk.id);
        const vectorLiterals = vectors.map((vector) => `[${vector.join(",")}]`);

        await withPipelineRetry(
            () =>
                timeStage("store vectors", () =>
                    prisma.$executeRaw`
            UPDATE "DocumentChunks" AS dc
            SET embedding = values_to_update.embedding::vector
            FROM unnest(
              ${ids}::text[],
              ${vectorLiterals}::text[]
            ) AS values_to_update(id, embedding)
            WHERE dc.id = values_to_update.id
          `,
                ),
            "store vectors",
        );

        await prisma.document.update({
            where: {
                id: documentId,
            },
            data: {
                embeddingStatus: "EMBEDDED",
                embeddingError: null,
            },
        });

        console.log(`[pipeline] document ${documentId} is ready for querying`);
    } catch (error) {
        const message = getErrorMessage(error);

        await prisma.document.update({
            where: {
                id: documentId,
            },
            data: {
                embeddingStatus: "FAILED",
                embeddingError: message,
            },
        });

        void autoCleanup(documentId, document.r2Key);
        throw error;
    }
}