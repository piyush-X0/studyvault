/**
 * StudyVault backend client.
 * Talks to the existing API routes:
 *   GET    /api/documents
 *   POST   /api/upload                       -> { presignedUrl, documentId }
 *   POST   /api/documents/:id/confirm
 *   DELETE /api/documents/:id/delete
 *   GET    /api/documents/:id/messages
 *   POST   /api/documents/:id/messages
 *   POST   /api/documents/:id/query          -> text stream
 */

export type DocStatus = "PENDING" | "EMBEDDED" | "FAILED" | string;

export interface StudyDocument {
    id: string;
    filename: string;
    size: number;
    mimetype: string;
    createdAt: string;
    uploadedStatus: DocStatus;
    extractedStatus: DocStatus;
    embeddingStatus: DocStatus;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    fileName?: string;
}

export type UploadStage = "idle" | "uploading" | "processing" | "ready" | "failed";

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export const ALLOWED_MIME = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function kindFromMime(mimetype: string): "pdf" | "doc" | "txt" {
    if (mimetype === "application/pdf") return "pdf";
    if (mimetype.includes("wordprocessingml")) return "doc";
    return "txt";
}

export function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export async function fetchDocuments(): Promise<StudyDocument[]> {
    const res = await fetch("/api/documents");
    if (!res.ok) throw new Error("failed to fetch documents");
    const data = await res.json();
    return data.documents ?? [];
}

export async function fetchMessages(docId: string): Promise<ChatMessage[]> {
    const res = await fetch(`/api/documents/${docId}/messages`);
    if (!res.ok) throw new Error("failed to load messages");
    const data = await res.json();
    return (data.messages ?? []).map(
        (m: { id?: string; role: string; text: string; fileName?: string }, i: number) => ({
            id: m.id ?? `m-${i}`,
            role: m.role === "user" ? "user" : "assistant",
            text: m.text,
            ...(m.fileName ? { fileName: m.fileName } : {}),
        }),
    );
}

export async function persistMessage(
    docId: string,
    message: { role: "user" | "assistant"; text: string; fileName?: string },
) {
    await fetch(`/api/documents/${docId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
    });
}

export async function deleteDocument(docId: string) {
    await fetch(`/api/documents/${docId}/delete`, { method: "DELETE" });
}

/** Requests a presigned URL, PUTs the file, then confirms. Returns documentId. */
export async function uploadDocument(file: File): Promise<string> {
    const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
        }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Upload rejected.");
    }

    const { presignedUrl, documentId } = await res.json();
    const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
    })
    if (!uploadResponse.ok) {
        throw new Error("File upload to storage failed")
    }

    await fetch(`/api/documents/${documentId}/confirm`, { method: "POST" });
    return documentId as string;
}

/** Streams the answer from the RAG query route, invoking onChunk per token batch. */
export async function streamAnswer(
    docId: string,
    question: string,
    onChunk: (chunk: string) => void,
): Promise<string> {
    const res = await fetch(`/api/documents/${docId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
    });

    if (!res.body) throw new Error("No stream");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        onChunk(chunk);
    }

    return full;
}
