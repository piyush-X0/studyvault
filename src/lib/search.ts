import { prisma } from "./prisma";


export async function findRelevantChunks(documentId: string, queryvector: number[], topK: number = 5) {
    const vectorLiterals = `[${queryvector.join(",")}]`;

    const chunks = await prisma.$queryRaw<{ id: string, content: string, chunkIndex: number }[]>`
    SELECT id, content, "chunkIndex"
    FROM "DocumentChunks"
    WHERE "documentId" = ${documentId}
    ORDER BY embedding <=> ${vectorLiterals}::vector
    LIMIT ${topK}`;

    return chunks;
}

