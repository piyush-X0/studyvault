"use client";

import { useRef, useEffect } from "react";
import { Sparkles, Bot, User, Zap, Database, Lock, Cpu, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface MessageItem {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: string;
}

interface ChatTranscriptProps {
    messages: MessageItem[];
    isLoading?: boolean;
    hasDocument?: boolean;
    onScrollStateChange?: (isScrolled: boolean) => void;
    onSampleClick?: (prompt: string) => void;
}

export default function ChatTranscript({
    messages,
    isLoading = false,
    hasDocument = false,
    onScrollStateChange,
    onSampleClick,
}: ChatTranscriptProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (containerRef.current && onScrollStateChange) {
            onScrollStateChange(containerRef.current.scrollTop > 10);
        }
    };

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
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-8 md:px-8 space-y-6 scroll-smooth"
        >
            <AnimatePresence mode="wait">
                {messages.length === 0 && !hasDocument ? (
                    /* PURELY READ-ONLY INITIAL STATE */
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                        className="flex min-h-[60vh] flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-7 pointer-events-none select-none"
                    >
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-[#161616] px-3 py-1 text-xs font-medium text-neutral-300">
                                <Sparkles className="h-3.5 w-3.5 text-white" />
                                <span>Vector-Powered RAG Engine</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                                Ask your documents anything.
                            </h1>
                            <p className="text-sm sm:text-base text-neutral-400 max-w-md mx-auto leading-relaxed">
                                Upload your research, PDFs, or lecture notes. We chunk, embed with pgvector, and deliver grounded citations in seconds.
                            </p>
                        </div>

                        {/* READ-ONLY FEATURE SPECS (Informational only) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                            <div className="rounded-xl border border-neutral-800/90 bg-[#141414] p-3.5 shadow-sm">
                                <Zap className="h-4 w-4 text-white mb-2" />
                                <h4 className="text-xs font-semibold text-white">Semantic Search</h4>
                                <p className="text-[11px] text-neutral-400 mt-0.5">High-dimensional cosine similarity indexing</p>
                            </div>
                            <div className="rounded-xl border border-neutral-800/90 bg-[#141414] p-3.5 shadow-sm">
                                <Database className="h-4 w-4 text-white mb-2" />
                                <h4 className="text-xs font-semibold text-white">pgvector & Prisma</h4>
                                <p className="text-[11px] text-neutral-400 mt-0.5">HNSW index for sub-50ms chunk queries</p>
                            </div>
                            <div className="rounded-xl border border-neutral-800/90 bg-[#141414] p-3.5 shadow-sm">
                                <Lock className="h-4 w-4 text-white mb-2" />
                                <h4 className="text-xs font-semibold text-white">Isolated Tenancy</h4>
                                <p className="text-[11px] text-neutral-400 mt-0.5">Strict per-user data and session fences</p>
                            </div>
                        </div>

                        {/* READ-ONLY PIPELINE CAPABILITIES BADGES */}
                        <div className="w-full rounded-2xl border border-neutral-800/80 bg-[#111111]/90 p-4 text-left space-y-3">
                            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                                    Engine Architecture Metrics
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                                    <CheckCircle2 className="h-3 w-3" /> Ready for documents
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <p className="text-[10px] text-neutral-500 uppercase">Vector Dimension</p>
                                    <p className="font-mono font-medium text-white">768 Dim</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-neutral-500 uppercase">Index Construction</p>
                                    <p className="font-mono font-medium text-white">HNSW ef=64</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-neutral-500 uppercase">Overlap Buffer</p>
                                    <p className="font-mono font-medium text-white">10% Windows</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-neutral-500 uppercase">Storage Tier</p>
                                    <p className="font-mono font-medium text-white">R2 + Postgres</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* CONVERSATION TRANSCRIPT */
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg) => {
                            const isUser = msg.role === "user";
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                                >
                                    {!isUser && (
                                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl border border-neutral-800 bg-[#181818] text-white shadow-sm">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}

                                    <div
                                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                                            ? "max-w-[85%] sm:max-w-[75%] bg-white text-black shadow-sm font-medium"
                                            : "max-w-[95%] sm:max-w-[85%] bg-[#171717] text-neutral-200 border border-neutral-800"
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>

                                    {isUser && (
                                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-neutral-800 text-neutral-200">
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 text-neutral-400 text-xs pl-12"
                            >
                                <div className="flex gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse [animation-delay:200ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse [animation-delay:400ms]" />
                                </div>
                                <span>Synthesizing answer from chunks...</span>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
