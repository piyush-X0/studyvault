import mammoth from "mammoth";

export async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
    let rawText: string;
    switch (mimetype) {
        case "application/pdf": {
            const { PDFParse } = await import("pdf-parse");
            const parser = new PDFParse({ data: buffer });

            try {
                const response = await parser.getText()
                rawText = response.text;
            }
            finally {
                await parser.destroy()
            }
            break;
        }
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
            const { value } = await mammoth.extractRawText({ buffer });
            rawText = value;
            break;
        }
        case "text/plain":
        case "text/markdown": {
            rawText = buffer.toString("utf-8");
            break;
        }
        default: throw Error(`Unsupported mimetype for this extraction : ${mimetype}`);
    }
    if (!rawText.trim()) {
        throw new Error(`Extraction produced no text ( possibly a scanned/image only file )`);
    }
    return rawText.replace(/\u0000/g, "");
}