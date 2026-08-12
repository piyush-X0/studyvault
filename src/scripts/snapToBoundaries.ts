

export function snapToSentenceBoundary(text: string, position: number, searchLimit: number = 200): number {

    const before = text.slice(Math.max(0, position - 2), position);

    if (/[.!?]\s$/.test(before) || text[position - 1] === "\n") {
        return position;
    }

    const searchStart = Math.max(0, position - searchLimit);
    const window = text.slice(searchStart, position);
    const sentenceEnders = [".", "!", "?", "\n"];

    let latestMatch = -1;

    for (const enders of sentenceEnders) {
        const index = window.lastIndexOf(enders)
        if (index !== -1) {
            const matchEnd = index + enders.length;
            if (matchEnd > latestMatch) latestMatch = matchEnd;
        }
    }
    if (latestMatch !== -1) {
        return searchStart + latestMatch
    }
    return snapToWordBoundary(text, position)
};

export function snapToWordBoundary(text: string, position: number): number {
    if (position <= 0 || text[position - 1] === " " || text[position - 1] === "\n") {
        return position;
    }
    let i = position;
    while (i < text.length && text[i] !== " " && text[i] !== "\n") {
        i++;
    }
    return i;
}