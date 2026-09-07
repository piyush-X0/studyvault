
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const EMBEDDING_MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONS = 1536;

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1_000;

const MAX_RETRIES = 5;

function normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(
        vector.reduce((sum, value) => sum + value * value, 0),
    );
    if (magnitude === 0) {
        throw new Error("Received a zero-magnitude embedding vector.");
    }
    return vector.map((value) => value / magnitude);
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: any): boolean {

    const status = err?.status ?? err?.code ?? err?.response?.status;
    return status === 429 || /RESOURCE_EXHAUSTED|429/i.test(String(err?.message ?? ""));
}

function getRetryDelayMs(err: any): number | null {
    // Google includes the exact wait time in error.details[].retryDelay,
    // e.g. "48.923920893s" — use it instead of blind exponential backoff.
    const details = err?.error?.details ?? err?.details ?? [];
    const retryInfo = details.find(
        (d: any) => d["@type"]?.includes("RetryInfo"),
    );
    const raw = retryInfo?.retryDelay; // "48.923920893s"
    if (!raw) return null;

    const seconds = parseFloat(raw.replace("s", ""));
    return Number.isFinite(seconds) ? seconds * 1000 : null;
}

async function embedBatchWithRetry(
    batch: string[],
): Promise<{ values?: number[] }[]> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const result = await genAI.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: batch.map((text) => ({ role: "user", parts: [{ text }] })),
                config: { outputDimensionality: OUTPUT_DIMENSIONS },
            });
            return result.embeddings ?? [];
        } catch (err) {
            lastError = err;

            if (!isRateLimitError(err) || attempt === MAX_RETRIES - 1) {
                throw err;
            }

            // Prefer Google's own stated wait time; fall back to exponential
            // backoff only if the error doesn't include one.
            const serverDelay = getRetryDelayMs(err);
            const backoff = serverDelay ?? (2 ** attempt * 1000 + Math.random() * 500);

            console.warn(
                `Embedding batch rate-limited, retrying in ${Math.round(backoff)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await sleep(backoff + 500); // small buffer past the stated reset
        }
    }

    throw lastError;
}

export async function generateEmbeddings(
    texts: string[],
): Promise<number[][]> {
    if (texts.length === 0) return [];

    const cleanedTexts = texts.map((text, index) => {
        const cleaned = text.trim();
        if (!cleaned) {
            throw new Error(`Chunk ${index} is empty and cannot be embedded.`);
        }
        return cleaned;
    });

    const allEmbeddings: number[][] = [];

    for (let start = 0; start < cleanedTexts.length; start += BATCH_SIZE) {
        const batch = cleanedTexts.slice(start, start + BATCH_SIZE);

        // Changed: call the retry wrapper instead of genAI directly
        const embeddings = await embedBatchWithRetry(batch);

        if (embeddings.length !== batch.length) {
            throw new Error(
                `Embedding response count mismatch: sent ${batch.length} chunks but received ${embeddings.length} embeddings.`,
            );
        }

        for (let index = 0; index < embeddings.length; index += 1) {
            const vector = embeddings[index]?.values;

            if (!vector || vector.length === 0) {
                throw new Error(
                    `Embedding response ${index} in batch starting at ${start} has no vector values.`,
                );
            }
            if (vector.length !== OUTPUT_DIMENSIONS) {
                throw new Error(
                    `Embedding dimension mismatch: expected ${OUTPUT_DIMENSIONS}, received ${vector.length}.`,
                );
            }
            allEmbeddings.push(normalize(vector));
        }

        const moreBatchesRemain = start + BATCH_SIZE < cleanedTexts.length;
        if (moreBatchesRemain) {
            await sleep(BATCH_DELAY_MS);
        }
    }

    return allEmbeddings;
}