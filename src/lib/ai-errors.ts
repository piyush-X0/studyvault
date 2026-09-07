export function getAiErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : "";

    const normalized = message.toLowerCase();

    if (
        normalized.includes("503") ||
        normalized.includes("unavailable") ||
        normalized.includes("high demand")
    ) {
        return "The AI service is experiencing high demand. Please try again in a moment.";
    }

    if (
        normalized.includes("429") ||
        normalized.includes("resource_exhausted") ||
        normalized.includes("quota")
    ) {
        return "The AI service is temporarily unavailable due to usage limits. Please try again later.";
    }

    if (
        normalized.includes("timeout") ||
        normalized.includes("etimedout") ||
        normalized.includes("fetch failed")
    ) {
        return "The AI request timed out. Please try again.";
    }

    return "Unable to generate an answer right now. Please try again.";
}