import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBEDDING_MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONS = 1536;


function normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) {
        throw new Error("Zero-magnitude vector, cannot normalize");
    }
    return vector.map((v) => v / magnitude);
}

export async function generateEmbeddings(text: string[]): Promise<number[][]> {
    if (text.length === 0) return [];

    const BATCH_SIZE = 20;
    const batches: string[][] = [];
    for (let i = 0; i < text.length; i += BATCH_SIZE) {
        batches.push(text.slice(i, i + BATCH_SIZE));
    }

    // run all batches in parallel
    const results = await Promise.all(
        batches.map((batch) =>
            genAI.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: batch,
                config: { outputDimensionality: OUTPUT_DIMENSIONS }
            })
        )
    );

    const allEmbeddings = results.flatMap((r) => r.embeddings ?? []);

    if (allEmbeddings.length !== text.length) {
        throw new Error(`Embedding count mismatch`);
    }

    return allEmbeddings.map((e, i) => {
        if (!e.values) throw new Error(`Missing value at index ${i}`);
        return normalize(e.values);
    });
}