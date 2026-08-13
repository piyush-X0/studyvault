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
    if (text.length == 0) return [];

    const response = await genAI.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: { outputDimensionality: OUTPUT_DIMENSIONS }
    });

    const embeddings = response.embeddings ?? [];

    if (embeddings.length !== text.length) {
        throw new Error(` Embedding count mismatched : sent ${text.length} texts and got ${embeddings.length} embeddings back`);
    }

    const result: number[][] = new Array(embeddings.length);
    for (let i = 0; i < embeddings.length; i++) {
        const values = embeddings[i].values;
        if (!values) {
            throw new Error(`Missing Embedding Value at index ${i}`);
        }
        result[i] = normalize(values);
    }
    return result;
}