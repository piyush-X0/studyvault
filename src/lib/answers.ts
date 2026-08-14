import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODEL = "gemini-3.6-flash";

export async function generateAnswer(question: string, contextChunks: string[]): Promise<string> {

    const context = contextChunks
        .map((chunk, i) => `[Excerpt ${i + 1} \n ${chunk}]`)
        .join("\n\n");

    const response = await genAI.models.generateContent({
        model: CHAT_MODEL,
        contents: `Document excerpts:\n\n${context}\n\n Question : ${question}`,
        config: {
            systemInstruction: "You are a study assistent. Answer the user's question using only the provided documents excerpts. If the excerpts don't contain the enough information  to answer , say so clearly instead of guessing."
        }
    });
    return response.text ?? "";
}