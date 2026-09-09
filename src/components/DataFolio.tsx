"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProjectSidebar from "@/components/chat/ProjectSidebar";
import ChatTranscript from "@/components/chat/ChatTranscript";
import ChatComposer from "@/components/chat/ChatComposer";
import {
    ALLOWED_MIME,
    MAX_UPLOAD_BYTES,
    deleteDocument as apiDeleteDocument,
    fetchDocuments,
    fetchMessages,
    persistMessage,
    streamAnswer,
    uploadDocument,
    type ChatMessage,
    type StudyDocument,
    type UploadStage,
} from "@/lib/studyvault-api";

export function DataFolioChat() {

    const [documents, setDocuments] = useState<StudyDocument[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [asking, setAsking] = useState(false);
    const [thinkingLabel, setThinkingLabel] = useState("thinking...");

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
    const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const thinkingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);


    const refreshDocuments = useCallback(async () => {
        try {
            const documents = await fetchDocuments();
            setDocuments(documents);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setDocumentsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshDocuments();

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }

            thinkingTimersRef.current.forEach(clearTimeout);
        };
    }, [refreshDocuments]);

    function showUploadError(message: string) {
        setUploadError(message);
        setTimeout(() => setUploadError(null), 4000);
    }

    function stopPolling() {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }

    function startPolling(docId: string) {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const docs = await fetchDocuments();
                setDocuments(docs);
                const doc = docs.find((d) => d.id === docId);
                if (!doc) return;

                if (doc.embeddingStatus === "EMBEDDED") {
                    stopPolling();
                    setUploadStage("ready");
                    setActiveDocId(docId);
                    setMessages([]);
                }
                if (doc.embeddingStatus === "FAILED" || doc.extractedStatus === "FAILED") {
                    stopPolling();
                    setUploadStage("failed");
                    setPendingFile(null);
                    setUploadedDocId(null)
                    showUploadError(getProcessingErrorMessage(doc));
                    return;
                }
            } catch {
                stopPolling();
                setUploadStage("failed");
            }
        }, 3000);

        setTimeout(stopPolling, 120_000);
    }
    const MAX_EXTRACTED_CHARS = 50_000;

    async function hasTooMuchPlainText(file: File): Promise<boolean> {
        const plainTextTypes = ["text/plain", "text/markdown"];

        if (!plainTextTypes.includes(file.type)) {
            return false;
        }

        const text = await file.text();

        return text.length > MAX_EXTRACTED_CHARS;
    }

    async function handlePickFile(file: File) {
        setUploadError(null);

        if (file.size > MAX_UPLOAD_BYTES) {
            showUploadError("File too large. Maximum size is 1 MB.");
            return;
        }
        if (!ALLOWED_MIME.includes(file.type)) {
            showUploadError("Unsupported file type. Use PDF, DOCX, TXT, or Markdown.");
            return;
        }
        try {
            if (await hasTooMuchPlainText(file)) {
                showUploadError(
                    "This text file exceeds the 50,000-character demo limit. " +
                    "Upload a shorter section instead.",
                );
                return;
            }
        } catch (error) {
            console.error("Could not read text file before upload:", error);

            showUploadError(
                "Could not read this text file. Please try another file.",
            );
            return;
        }
        setPendingFile(file);
        setUploadStage("uploading");

        try {
            const documentId = await uploadDocument(file);

            setUploadedDocId(documentId);
            setUploadStage("processing");

            void refreshDocuments();
            startPolling(documentId);
        } catch (error) {
            stopPolling();
            setPendingFile(null);
            setUploadedDocId(null);
            setUploadStage("failed");

            showUploadError(
                error instanceof Error
                    ? error.message
                    : "Upload failed. Please try again.",
            );
        }
    }
    async function handleClearAttachment() {
        if (uploadedDocId && uploadStage === "ready") {
            try {
                await apiDeleteDocument(uploadedDocId);
            } catch {
                console.error("failed to delete document");
            }
            setActiveDocId(null);
            refreshDocuments();
        }
        setPendingFile(null);
        setUploadedDocId(null);
        setUploadStage("idle");
    }

    function startThinkingTimers() {
        thinkingTimersRef.current.forEach(clearTimeout);
        setThinkingLabel("thinking...");
        thinkingTimersRef.current = [
            setTimeout(() => setThinkingLabel("preparing your answer..."), 8000),
            setTimeout(() => setThinkingLabel("almost there..."), 14000),
        ];
    }

    function clearThinkingTimers() {
        thinkingTimersRef.current.forEach(clearTimeout);
        thinkingTimersRef.current = [];
        setThinkingLabel("thinking...");
    }

    function getChatErrorMessage(error: unknown): string {
        const message = error instanceof Error ? error.message : "";
        const normalizedMessage = message.toLowerCase();

        if (
            normalizedMessage.includes("document not found") ||
            normalizedMessage.includes("no longer available")
        ) {
            return (
                "This document is no longer available. " +
                "It may have failed during processing or been removed."
            );
        }

        if (
            normalizedMessage.includes("document is not ready for query yet") ||
            normalizedMessage.includes("not ready")
        ) {
            return (
                "This document is still processing. " +
                "Please wait a moment and try again."
            );
        }

        if (
            normalizedMessage.includes("unauthorized") ||
            normalizedMessage.includes("401")
        ) {
            return "Your session has expired. Please sign in again.";
        }

        if (
            normalizedMessage.includes("503") ||
            normalizedMessage.includes("unavailable") ||
            normalizedMessage.includes("high demand")
        ) {
            return (
                "The AI service is experiencing high demand. " +
                "Please try again in a moment."
            );
        }

        if (
            normalizedMessage.includes("429") ||
            normalizedMessage.includes("resource_exhausted") ||
            normalizedMessage.includes("quota")
        ) {
            return (
                "The AI service is temporarily unavailable due to usage limits. " +
                "Please try again later."
            );
        }

        if (
            normalizedMessage.includes("timeout") ||
            normalizedMessage.includes("etimedout") ||
            normalizedMessage.includes("fetch failed") ||
            normalizedMessage.includes("network")
        ) {
            return "The request timed out or the network connection failed. Please try again.";
        }

        return "Unable to generate an answer right now. Please try again.";
    }
    function getProcessingErrorMessage(document: StudyDocument): string {
        const extractionError = document.extractionError ?? "";
        const embeddingError = document.embeddingError ?? "";

        if (extractionError.includes("too large after text extraction")) {
            return (
                "This document contains too much text for the demo limit. " +
                "Try uploading a shorter chapter, section, or notes."
            );
        }
        if (
            embeddingError.includes("RESOURCE_EXHAUSTED") ||
            embeddingError.includes("429") ||
            embeddingError.toLowerCase().includes("quota")
        ) {
            return (
                "AI processing is temporarily unavailable due to usage limits. " +
                "Please try again later."
            );
        }
        return "Document processing failed. Please try a different file.";
    }

    async function handleSubmit() {
        const question = input.trim();

        if (!question || asking) {
            return;
        }

        if (uploadStage === "uploading" || uploadStage === "processing") {
            return;
        }

        if (!activeDocId) {
            showUploadError("Upload a document first, then ask your question.");
            return;
        }

        const docId = activeDocId;
        const fileName = pendingFile?.name;
        const now = Date.now();
        const assistantId = `a-${now}`;

        setMessages((previous) => [
            ...previous,
            {
                id: `u-${now}`,
                role: "user",
                text: question,
                ...(fileName ? { fileName } : {}),
            },
            {
                id: assistantId,
                role: "assistant",
                text: "",
            },
        ]);

        setInput("");
        setPendingFile(null);
        setAsking(true);
        startThinkingTimers();

        try {
            await persistMessage(docId, {
                role: "user",
                text: question,
                ...(fileName ? { fileName } : {}),
            });

            let firstChunk = true;

            const fullAnswer = await streamAnswer(docId, question, (chunk) => {
                if (firstChunk) {
                    clearThinkingTimers();
                    firstChunk = false;
                }

                setMessages((previous) =>
                    previous.map((message) =>
                        message.id === assistantId
                            ? {
                                ...message,
                                text: message.text + chunk,
                            }
                            : message,
                    ),
                );
            });

            await persistMessage(docId, {
                role: "assistant",
                text: fullAnswer,
            });
        } catch (error) {
            console.error("Answer request failed:", error);

            const friendlyMessage = getChatErrorMessage(error);

            setMessages((previous) =>
                previous.map((message) =>
                    message.id === assistantId
                        ? {
                            ...message,
                            text: friendlyMessage,
                        }
                        : message,
                ),
            );
        } finally {
            clearThinkingTimers();
            setAsking(false);
        }
    }

    async function handleSelect(id: string) {
        setActiveDocId(id);
        setMessages([]);
        setPendingFile(null);
        setUploadedDocId(null);
        setUploadStage("idle");
        try {
            setMessages(await fetchMessages(id));
        } catch {
            console.error("failed to load messages");
        }
    }

    async function handleDelete(id: string) {
        try {
            await apiDeleteDocument(id);
        } catch {
            console.error("failed to delete document");
        }
        if (activeDocId === id) {
            setActiveDocId(null);
            setMessages([]);
        }
        refreshDocuments();
    }

    function handleNewChat() {
        stopPolling();
        setActiveDocId(null);
        setMessages([]);
        setInput("");
        setPendingFile(null);
        setUploadedDocId(null);
        setUploadStage("idle");
        setUploadError(null);
    }

    return (
        <div className="flex h-screen flex-col bg-background">
            <header className="shrink-0 px-6 pt-5 pb-3">
                <h1 className="font-display text-[30px] leading-none tracking-tight text-foreground">
                    DataFolio
                </h1>
            </header>

            <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4">
                <ProjectSidebar
                    documents={documents}
                    isLoading={documentsLoading}
                    activeId={activeDocId}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onNewChat={handleNewChat}
                />

                <main className="flex min-w-0 flex-1 flex-col">
                    <ChatTranscript
                        messages={messages.map((message) => ({
                            ...message,
                            content: message.text,
                        }))}

                    />
                    <div className="pt-2">
                        <ChatComposer
                            value={input}
                            onChange={setInput}
                            onSubmit={handleSubmit}
                            onSend={handleSubmit}
                            onPickFile={handlePickFile}
                            onClearAttachment={handleClearAttachment}
                            attachmentName={pendingFile?.name ?? null}
                            uploadStage={uploadStage}
                            uploadError={uploadError}
                            disabled={asking}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}