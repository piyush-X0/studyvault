import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const MODEL = "openai/gpt-oss-120b";
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAiError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return (
        message.includes("429") ||
        message.includes("rate_limit") ||
        message.includes("503") ||
        message.includes("fetch failed") ||
        message.includes("etimedout")
    );
}

export async function streamAnswer(
    question: string,
    chunks: string[],
    onChunk: (text: string) => void,
): Promise<void> {
    const context = chunks.join("\n\n");
    const prompt = `You are an expert assistant with deep knowledge across academic, business, and technical domains. Your job is to answer questions accurately using only the provided context.

IDENTITY:
You adapt to whoever is asking. A student gets clear explanations. A professional gets precise, direct answers. A technical person gets depth. Read the question tone and match it.

FORMAT INTELLIGENCE:
Detect the right format from the question itself — never force a format:
- Explanation questions ("how", "why", "what is") → flowing prose, conversational but precise
- Process questions ("how to", "steps to", "procedure") → numbered steps, plain text
- Comparison questions ("difference between", "vs", "compare") → clear contrast paragraphs
- List questions ("what are", "list", "name all") → clean hyphenated list
- Analysis questions ("analyze", "evaluate", "assess") → structured paragraphs with a conclusion
- If user explicitly says "bullet points", "steps", "paragraph", "explain simply" → follow exactly

WRITING RULES:
- Start answering immediately, zero preamble
- Never say "Based on the context" or "According to the document"
- Never repeat the question back
- Be thorough but never padded — every sentence earns its place
- Use markdown structure: ## for section headings, **bold** for key terms/definitions, - for bullet lists, numbered lists for sequences or ranked items, and --- on its own line to separate major sections when the answer covers multiple distinct topics
- Don't over-format a short, single-fact answer — structure is for answers that genuinely have multiple sections or lists, not every response
- End with the single most important insight when the answer is complex

BOUNDARIES:
- Answer only from the provided context
- If context doesn't cover the question: "This document doesn't cover that specifically."
- Never hallucinate or fill gaps with outside knowledge

Context:
${context}

Question: ${question}

Answer:`;

    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        let receivedAnyChunk = false;
        try {
            const stream = await groq.chat.completions.create({
                model: MODEL,
                messages: [{ role: "user", content: prompt }],
                stream: true,
            });

            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content;
                if (text) {
                    receivedAnyChunk = true;
                    onChunk(text);
                }
            }
            return;
        } catch (error) {
            lastError = error;
            const isFinalAttempt = attempt === MAX_ATTEMPTS - 1;
            if (receivedAnyChunk || !isRetryableAiError(error) || isFinalAttempt) throw error;

            const delayMs = (attempt + 1) * 1_500;
            console.warn(`[answers] Groq request failed on attempt ${attempt + 1}/${MAX_ATTEMPTS}; retrying in ${delayMs}ms.`);
            await sleep(delayMs);
        }
    }
}