"use client";

import { useRef, useEffect, useState } from "react";
import {
    FileQuestion, Zap, Sparkles, Database, Lock, CheckCircle2, Copy, Check,
    FileText
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./MarkdownComponents";

export interface MessageItem {
    id: string;
    role: "user" | "assistant";
    fileName?: string;
    content: string;
    createdAt?: string;
    isNotice?: boolean;
}

interface ChatTranscriptProps {
    messages: MessageItem[];
    isLoading?: boolean;
    hasDocument?: boolean;
    isMessagesLoading?: boolean;
    onScrollStateChange?: (isScrolled: boolean) => void;
    onSampleClick?: (prompt: string) => void;
}

export default function ChatTranscript({
    messages,
    isLoading = false,
    isMessagesLoading = false,
    hasDocument = false,
}: ChatTranscriptProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const LOADING_MESSAGES = [
        { after: 0, text: "Searching relevant context..." },
        { after: 3000, text: "Preparing your answer..." },
        { after: 6000, text: "Synthesizing a response..." },
        { after: 9000, text: "Almost there, polishing the answer..." },
        { after: 12000, text: "Taking a bit longer than usual — still working on it..." },
    ];

    const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0].text);

    useEffect(() => {
        if (!isLoading) {
            setLoadingText(LOADING_MESSAGES[0].text);
            return;
        }

        const startedAt = Date.now();
        const interval = window.setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const current = [...LOADING_MESSAGES].reverse().find((m) => elapsed >= m.after);
            setLoadingText(current?.text ?? LOADING_MESSAGES[0].text);
        }, 500);

        return () => window.clearInterval(interval);
    }, [isLoading]);
    async function handleCopy(id: string, content: string) {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(id);
            window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    }
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, isLoading]);

    return (
        <div
            ref={containerRef}
            className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-6"
        >
            {isMessagesLoading ? (
                <div className="flex min-h-full items-center justify-center px-6 py-12">
                    <div className="text-sm text-neutral-500">
                        Loading conversation...
                    </div>
                </div>
            ) : !hasDocument ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                        className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center space-y-7 text-center pointer-events-none select-none"
                    >
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-[#161616] px-3 py-1 text-xs font-medium text-neutral-300">
                                <Sparkles className="h-3.5 w-3.5 text-white" />
                                <span>Vector-Powered RAG Engine</span>
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Ask your documents anything.
                            </h1>

                            <p className="mx-auto max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
                                Upload your research, PDFs, or lecture notes. We
                                chunk, embed with pgvector, and deliver grounded
                                citations in seconds.
                            </p>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3">
                            <div className="rounded-xl border border-neutral-800/90 bg-[#141414] p-3.5 shadow-sm">
                                <Zap className="mb-2 h-4 w-4 text-white" />
                                <h4 className="text-xs font-semibold text-white">
                                    Semantic Search
                                </h4>
                                <p className="mt-0.5 text-[11px] text-neutral-400">
                                    High-dimensional cosine similarity indexing
                                </p>
                            </div>

                            <div className="rounded-xl border border-neutral-800/90 bg-[#141414] p-3.5 shadow-sm">
                                <Database className="mb-2 h-4 w-4 text-white" />
                                <h4 className="text-xs font-semibold text-white">
                                    pgvector & Prisma
                                </h4>
                                <p className="mt-0.5 text-[11px] text-neutral-400">
                                    HNSW index for sub-50ms chunk queries
                                </p>
                            </div>

                            <div className="rounded-xl border border-neutral-800/90 bg-[#141414] p-3.5 shadow-sm">
                                <Lock className="mb-2 h-4 w-4 text-white" />
                                <h4 className="text-xs font-semibold text-white">
                                    Isolated Tenancy
                                </h4>
                                <p className="mt-0.5 text-[11px] text-neutral-400">
                                    Strict per-user data and session fences
                                </p>
                            </div>
                        </div>

                        <div className="w-full space-y-3 rounded-2xl border border-neutral-800/80 bg-[#111111]/90 p-4 text-left">
                            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                                    Engine Architecture Metrics
                                </span>

                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Ready for documents
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                <div>
                                    <p className="text-[10px] uppercase text-neutral-500">
                                        Vector Dimension
                                    </p>
                                    <p className="font-mono font-medium text-white">
                                        1536 Dim
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase text-neutral-500">
                                        Index Construction
                                    </p>
                                    <p className="font-mono font-medium text-white">
                                        HNSW ef=64
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase text-neutral-500">
                                        Overlap Buffer
                                    </p>
                                    <p className="font-mono font-medium text-white">
                                        10% Windows
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase text-neutral-500">
                                        Storage Tier
                                    </p>
                                    <p className="font-mono font-medium text-white">
                                        R2 + Postgres
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : messages.length === 0 ? (
                <div className="flex min-h-full items-center justify-center px-6 py-12">
                    <div className="flex max-w-md flex-col items-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-lg shadow-black/20">
                            <FileQuestion className="h-6 w-6 text-neutral-400" />
                        </div>

                        <h2 className="text-lg font-medium text-neutral-100">
                            No conversation yet
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                            Ask anything about this document to start a conversation.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mx-auto max-w-180 space-y-6">
                    {messages.map((msg) => {
                        const isUser = msg.role === "user";

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
                            >
                                {isUser && msg.fileName && (
                                    <span className="flex items-center gap-1 px-1 text-[11px] text-neutral-500">
                                        <FileText className="h-3 w-3" />
                                        {msg.fileName}
                                    </span>
                                )}

                                {isUser ? (
                                    <div className="max-w-[85%] rounded-2xl bg-[#171717] px-4 py-3 text-sm leading-relaxed text-zinc-200 shadow-sm sm:max-w-[80%]">
                                        <div className="whitespace-pre-wrap">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : msg.isNotice ? (
                                    <p className="px-2 text-center text-xs text-neutral-500 italic">
                                        {msg.content}
                                    </p>
                                ) : (
                                    <div className="max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed text-neutral-200 sm:max-w-full">
                                        <div className="whitespace-pre-wrap">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {isUser && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(msg.id, msg.content)}
                                        className="flex items-center gap-1 px-1 text-[11px] text-neutral-500 transition-colors hover:text-neutral-300"
                                        title="Copy question"
                                    >
                                        {copiedId === msg.id ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                Copied
                                            </>
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 pl-12 text-xs text-neutral-400"
                        >
                            <div className="flex gap-1">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:200ms]" />
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:400ms]" />
                            </div>

                            <span>{loadingText}</span>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
