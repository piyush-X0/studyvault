
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

let embedderPromise: Promise<FeatureExtractionPipeline> | null = null;
function getEmbedder() {
    if (!embedderPromise) {
        embedderPromise = pipeline("feature-extraction", EMBEDDING_MODEL);
    }
    return embedderPromise;
}
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embedder = await getEmbedder();
    const results: number[][] = [];

    for (const text of texts) {
        const output = await embedder(text, { pooling: "mean", normalize: true });
        results.push(Array.from(output.data as Float32Array));
    }
    return results;
}