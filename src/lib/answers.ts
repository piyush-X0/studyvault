import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function streamAnswer(
    question: string,
    chunks: string[],
    onChunk: (text: string) => void
): Promise<void> {
    const context = chunks.join("\n\n");
    const prompt = "You are a study assistent. Answer the user's question using only the provided documents excerpts. If the excerpts don't contain the enough information  to answer , say so clearly instead of guessing."

    const response = await genai.models.generateContentStream({
        model: "gemini-3.6-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    for await (const chunk of response) {
        const text = chunk.text;
        if (text) onChunk(text);
    }
}