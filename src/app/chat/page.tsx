"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import ProjectSidebar from "@/components/chat/ProjectSidebar";
import ChatTranscript from "@/components/chat/ChatTranscript";
import ChatComposer from "@/components/chat/ChatComposer";
import {
    ALLOWED_MIME,
    MAX_UPLOAD_BYTES,
    deleteDocument,
    fetchDocuments,
    fetchMessages,
    persistMessage,
    streamAnswer,
    uploadDocument,
    type ChatMessage,
    type StudyDocument,
    type UploadStage,
} from "@/lib/studyvault-api";

export default function ChatPage() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const [documents, setDocuments] = useState<StudyDocument[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [asking, setAsking] = useState(false);

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
    const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);


    const refreshDocuments = useCallback(async () => {
        try {
            const nextDocuments = await fetchDocuments();
            setDocuments(nextDocuments);
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
        };
    }, [refreshDocuments]);

    function showUploadError(message: string) {
        setUploadError(message);
        window.setTimeout(() => setUploadError(null), 4000);
    }

    function stopPolling() {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }

    function startPolling(documentId: string) {
        stopPolling();

        pollingRef.current = setInterval(async () => {
            try {
                const nextDocuments = await fetchDocuments();
                const document = nextDocuments.find(
                    (item) => item.id === documentId,
                );

                if (!document) {
                    return;
                }

                if (document.embeddingStatus === "EMBEDDED") {
                    stopPolling();

                    // Add to sidebar only now.
                    setDocuments(nextDocuments);

                    setActiveDocId(documentId);
                    setUploadedDocId(documentId);
                    setUploadStage("ready");
                    setPendingFile(null);

                    setMessages(await fetchMessages(documentId));
                    return;
                }

                if (
                    document.embeddingStatus === "FAILED" ||
                    document.extractedStatus === "FAILED"
                ) {
                    stopPolling();

                    setUploadStage("failed");
                    setUploadedDocId(null);

                    const reason =
                        document.extractionError ??
                        document.embeddingError ??
                        "Document processing failed.";

                    setUploadError(reason);
                    return;
                }
            } catch (error) {
                console.error("Document polling failed:", error);

                stopPolling();
                setUploadStage("failed");
                setUploadError("Could not check document processing status.");
            }
        }, 3000);
    }

    async function handlePickFile(file: File) {
        setUploadError(null);
        setUploadedFileName(file.name);

        const documentId = await uploadDocument(file);

        setUploadedDocId(documentId);
        setActiveDocId(documentId);
        setUploadStage("processing");


        if (file.size > MAX_UPLOAD_BYTES) {
            setUploadedFileName(null);
            showUploadError("File too large. Maximum size is 1 MB.");
            return;
        }

        if (!ALLOWED_MIME.includes(file.type)) {
            setUploadedFileName(null);
            showUploadError(
                "Unsupported file type. Use PDF, DOCX, TXT, or Markdown.",
            );
            return;
        }

        setPendingFile(file);
        setUploadStage("uploading");

        try {
            const documentId = await uploadDocument(file);

            setUploadedDocId(documentId);
            setActiveDocId(documentId);
            setUploadStage("processing");

            await refreshDocuments();
            startPolling(documentId);
        } catch (error) {
            stopPolling();
            setPendingFile(null);
            setUploadedDocId(null);
            setUploadedFileName(null);
            setUploadStage("failed");

            showUploadError(
                error instanceof Error
                    ? error.message
                    : "Upload failed. Please try again.",
            );
        }
    }

    async function handleSelect(documentId: string) {
        stopPolling();

        setActiveDocId(documentId);
        setMessages([]);
        setIsMobileSidebarOpen(false);

        // This is an existing document selection, not a new upload.
        setPendingFile(null);
        setUploadedDocId(null);
        setUploadedFileName(null);
        setUploadStage("idle");
        setUploadError(null);

        try {
            const previousMessages = await fetchMessages(documentId);
            setMessages(previousMessages);
        } catch (error) {
            console.error("Failed to load messages:", error);
            showUploadError("Could not load this document's conversation.");
        }
    }
    async function handleDelete(documentId: string) {
        const deletedDocument = documents.find(
            (document) => document.id === documentId,
        );

        if (!deletedDocument) {
            return;
        }

        // Remove from UI immediately.
        setDocuments((currentDocuments) =>
            currentDocuments.filter((document) => document.id !== documentId),
        );

        if (activeDocId === documentId) {
            setActiveDocId(null);
            setMessages([]);
        }

        if (uploadedDocId === documentId) {
            setUploadedDocId(null);
            setUploadedFileName(null);
            setPendingFile(null);
            setUploadStage("idle");
        }

        try {
            // Backend deletion continues without blocking the UI.
            await deleteDocument(documentId);
        } catch (error) {
            console.error("Failed to delete document:", error);

            // Restore the item if backend deletion fails.
            setDocuments((currentDocuments) => {
                const alreadyRestored = currentDocuments.some(
                    (document) => document.id === documentId,
                );

                if (alreadyRestored) {
                    return currentDocuments;
                }

                return [...currentDocuments, deletedDocument].sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
            });

            showUploadError("Could not delete the document. It was restored.");
        }
    }

    function handleNewChat() {
        stopPolling();
        setActiveDocId(null);
        setMessages([]);
        setInput("");
        setPendingFile(null);
        setUploadedDocId(null);
        setUploadedFileName(null);
        setUploadStage("idle");
        setUploadError(null);
    }

    async function handleClearAttachment() {
        if (uploadedDocId) {
            await handleDelete(uploadedDocId);
        }

        setPendingFile(null);
        setUploadedDocId(null);
        setUploadedFileName(null);
        setUploadStage("idle");
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
            showUploadError("Upload or select a document first.");
            return;
        }

        const documentId = activeDocId;
        const currentFileName = uploadedFileName;
        const timestamp = Date.now();
        const assistantMessageId = `assistant-${timestamp}`;

        const userMessage: ChatMessage = {
            id: `user-${timestamp}`,
            role: "user",
            text: question,
            ...(currentFileName ? { fileName: currentFileName } : {}),
        };

        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: "assistant",
            text: "",
        };

        setMessages((previous) => [
            ...previous,
            userMessage,
            assistantMessage,
        ]);

        setInput("");
        setAsking(true);

        try {
            await persistMessage(documentId, {
                role: "user",
                text: question,
                ...(currentFileName ? { fileName: currentFileName } : {}),
            });

            const fullAnswer = await streamAnswer(
                documentId,
                question,
                (chunk) => {
                    setMessages((previous) =>
                        previous.map((message) =>
                            message.id === assistantMessageId
                                ? {
                                    ...message,
                                    text: message.text + chunk,
                                }
                                : message,
                        ),
                    );
                },
            );

            await persistMessage(documentId, {
                role: "assistant",
                text: fullAnswer,
            });
        } catch (error) {
            console.error("Answer request failed:", error);

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unable to generate an answer right now.";

            setMessages((previous) =>
                previous.map((message) =>
                    message.id === assistantMessageId
                        ? {
                            ...message,
                            text: errorMessage,
                        }
                        : message,
                ),
            );
        } finally {
            setAsking(false);
            setUploadedFileName(null);
        }
    }

    const activeDocument = documents.find(
        (document) => document.id === activeDocId,
    );

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0A0A0A] text-neutral-100">
            <Header
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
                isScrolled={isScrolled}
            />

            <div className="flex min-h-0 flex-1 w-full overflow-hidden">
                <ProjectSidebar
                    documents={documents}
                    isLoading={documentsLoading}
                    activeId={activeDocId}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onNewChat={handleNewChat}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />

                <main className="flex min-w-0 flex-1 flex-col bg-[#0D0D0D]">
                    <ChatTranscript
                        messages={messages.map((message) => ({
                            ...message,
                            content: message.text,
                        }))}
                        isLoading={asking}
                        hasDocument={Boolean(activeDocId)}
                        onScrollStateChange={setIsScrolled}
                    />

                    <ChatComposer
                        value={input}
                        onChange={setInput}
                        onSubmit={handleSubmit}
                        onPickFile={handlePickFile}
                        onClearAttachment={handleClearAttachment}
                        attachmentName={uploadedFileName ?? pendingFile?.name ?? null}
                        selectedDocName={activeDocument?.fileName}
                        uploadStage={uploadStage}
                        uploadError={uploadError}
                        disabled={
                            asking ||
                            documentsLoading ||
                            uploadStage === "uploading" ||
                            uploadStage === "processing"
                        }
                    />
                </main>
            </div>
        </div>
    );
}