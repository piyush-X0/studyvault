// src/lib/embedding.ts

import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const EMBEDDING_MODEL = "gemini-embedding-2";
const OUTPUT_DIMENSIONS = 1536;

// Keep this conservative for a free/limited API tier.
// It means one API request contains up to five independent chunks.
const BATCH_SIZE = 5;

const BATCH_DELAY_MS = 1_000;

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

export async function generateEmbeddings(
    texts: string[],
): Promise<number[][]> {
    if (texts.length === 0) {
        return [];
    }

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

        const result = await genAI.models.embedContent({
            model: EMBEDDING_MODEL,

            // Critical:
            // Each object represents a separate Content input.
            // That tells Gemini to return one embedding per chunk.
            contents: batch.map((text) => ({
                role: "user",
                parts: [{ text }],
            })),

            config: {
                outputDimensionality: OUTPUT_DIMENSIONS,
            },
        });

        const embeddings = result.embeddings ?? [];

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