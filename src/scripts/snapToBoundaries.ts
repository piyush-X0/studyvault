


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