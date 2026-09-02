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

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
        const result = await genAI.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: batch,
            config: { outputDimensionality: OUTPUT_DIMENSIONS }
        })

        const embeddings = result.embeddings ?? []
        if (embeddings.length !== batch.length) {
            throw new Error(`Batch mismatch: sent ${batch.length}, got ${embeddings.length}`)
        }

        for (const e of embeddings) {
            if (!e.values) throw new Error("Missing embedding values")
            allEmbeddings.push(normalize(e.values))
        }

        // respect rate limit — 100 requests/min = ~600ms between batches
        if (batches.length > 1) {
            await new Promise(r => setTimeout(r, 700))
        }
    }

    return allEmbeddings
}