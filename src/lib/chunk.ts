import { snapToSentenceBoundary } from "@/scripts/snapToBoundaries";

const DEFAULT_CHUNK_SIZE = 4000;
const DEFAULT_OVERLAP = 400;

interface Chunk {
    content: string,
    chunkIndex: number,
    charCount: number
}
export function chunkText(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    overlap: number = DEFAULT_OVERLAP): Chunk[] {
    if (!text || chunkSize <= 0) return [];

    const chunks: Chunk[] = [];
    const separators = ["\n\n", "\n", ". ", " "];

    let currentPosition = 0;
    while (currentPosition < text.length) {
        let endPosition = currentPosition + chunkSize;

        if (endPosition >= text.length) {
            endPosition = text.length;
        } else {
            const window = text.slice(currentPosition, endPosition);
            let foundseparator = false;
            for (const sep of separators) {
                const lastIndex = window.lastIndexOf(sep);
                if (lastIndex !== -1 && lastIndex > 0) {
                    endPosition = currentPosition + lastIndex + sep.length;
                    foundseparator = true;
                    break;
                }
            }
            if (!foundseparator) {
                endPosition = currentPosition + chunkSize;
            }
        }

        const content = text.slice(currentPosition, endPosition);
        if (content.trim().length > 0) {
            chunks.push({
                content: content.trim(),
                chunkIndex: chunks.length,
                charCount: content.trim().length
            });
        }

        const nextStart = endPosition - overlap;
        if (nextStart <= currentPosition) {
            currentPosition = endPosition;
        } else {
            const snapped = snapToSentenceBoundary(text, nextStart);
            currentPosition = snapped > currentPosition ? snapped : endPosition;
        }
        if (text.length - currentPosition <= overlap) {
            break;
        }
    }
    return chunks;
}