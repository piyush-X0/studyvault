// 
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { ProjectSidebar } from "@/components/chat/ProjectSidebar";
import { ChatTranscript } from "@/components/chat/ChatTranscript";
import { ChatComposer } from "@/components/chat/ChatComposer";
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

import { signIn } from "next-auth/react";

export function DataFolioChat() {
    const { data: session, status } = useSession();


    const [documents, setDocuments] = useState<StudyDocument[]>([]);
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
        }
    }, []);

    useEffect(() => {
        if (status !== "authenticated") return;

        void Promise.resolve().then(refreshDocuments);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            thinkingTimersRef.current.forEach(clearTimeout);
        };
    }, [refreshDocuments, status]);

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
                    showUploadError("Processing failed. Please try a smaller or different file.");
                }
            } catch {
                stopPolling();
                setUploadStage("failed");
            }
        }, 3000);

        setTimeout(stopPolling, 120_000);
    }

    async function handlePickFile(file: File) {
        setUploadError(null);

        if (file.size > MAX_UPLOAD_BYTES) {
            showUploadError("File too large. Maximum size is 3MB.");
            return;
        }
        if (!ALLOWED_MIME.includes(file.type)) {
            showUploadError("Unsupported file type. Use PDF, DOCX, or TXT.");
            return;
        }

        setPendingFile(file);
        setUploadStage("uploading");

        try {
            const documentId = await uploadDocument(file);
            setUploadedDocId(documentId);
            setUploadStage("processing");
            refreshDocuments();
            startPolling(documentId);
        } catch (error) {
            stopPolling();
            setUploadStage("failed");
            showUploadError(
                error instanceof Error ? error.message : "Upload failed. Please try again.",
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

    async function handleSubmit() {
        const question = input.trim();
        if (!question || asking) return;
        if (uploadStage === "uploading" || uploadStage === "processing") return;

        if (!activeDocId) {
            showUploadError("Upload a document first, then ask your question.");
            return;
        }

        const docId = activeDocId;
        const fileName = pendingFile?.name;
        const assistantId = `a-${Date.now()}`;

        setMessages((prev) => [
            ...prev,
            { id: `u-${Date.now()}`, role: "user", text: question, ...(fileName ? { fileName } : {}) },
            { id: assistantId, role: "assistant", text: "" },
        ]);
        setInput("");
        setPendingFile(null);
        setAsking(true);
        startThinkingTimers();

        await persistMessage(docId, { role: "user", text: question, ...(fileName ? { fileName } : {}) });

        try {
            let first = true;
            const fullAnswer = await streamAnswer(docId, question, (chunk) => {
                if (first) {
                    clearThinkingTimers();
                    first = false;
                }
                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + chunk } : m)),
                );
            });

            await persistMessage(docId, { role: "assistant", text: fullAnswer });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to answer this question right now.";

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, text: getChatErrorMessage(error) }
                        : m,
                ),
            );
        } finally {
            clearThinkingTimers();
            setAsking(false);
        }
    }

    function getChatErrorMessage(error: unknown) {
        const message = error instanceof Error ? error.message : "";

        if (message === "Document not found") {
            return "This document is no longer available. It may have failed during processing.";
        }

        if (message === "Document is not ready for query yet") {
            return "This document is still being processed. Please wait a moment and try again.";
        }

        if (message.includes("Unauthorized")) {
            return "Your session has expired. Please sign in again.";
        }

        return "Unable to generate an answer right now. Please try again.";
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


    if (status === "loading") {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!session) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <h1 className="font-display text-3xl text-foreground">DataFolio</h1>
                <p className="text-sm text-muted-foreground">
                    Sign in to chat with your documents
                </p>
                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                    Sign in with Google
                </button>
            </div>
        );
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
                    activeId={activeDocId}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onNewChat={handleNewChat}
                />

                <main className="flex min-w-0 flex-1 flex-col">
                    <ChatTranscript
                        messages={messages}
                        thinking={asking}
                        thinkingLabel={thinkingLabel}
                        emptyLabel={
                            activeDocId
                                ? "Ask anything about this document."
                                : "Upload a document to start."
                        }
                    />
                    <div className="pt-2">
                        <ChatComposer
                            value={input}
                            onChange={setInput}
                            onSubmit={handleSubmit}
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