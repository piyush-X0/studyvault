"use client";

import { useRef, useEffect } from "react";
import {
    Sparkles, Bot, User, Zap, Database, Lock, Cpu, FileQuestion,
    CheckCircle2
} from "lucide-react";
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
            ) : hasDocument && messages.length === 0 ? (
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
                <AnimatePresence mode="wait">
                    {messages.length === 0 && !hasDocument ? (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center space-y-7 text-center pointer-events-none select-none"
                        >
                            {/* Existing initial empty-state content */}
                        </motion.div>
                    ) : (
                        <div className="mx-auto max-w-3xl space-y-6">
                            {messages.map((msg) => {
                                const isUser = msg.role === "user";

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex gap-3 sm:gap-4 ${isUser
                                            ? "justify-end"
                                            : "justify-start"
                                            }`}
                                    >
                                        {!isUser}

                                        <div
                                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                                                ? "max-w-[85%] bg-[#171717] font-medium text-zinc-200 shadow-sm sm:max-w-[%]"
                                                : "max-w-[95%] text-neutral-200 sm:max-w-[85%]"
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap">
                                                {msg.content}
                                            </div>
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
                                    className="flex items-center gap-3 pl-12 text-xs text-neutral-400"
                                >
                                    <div className="flex gap-1">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:200ms]" />
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:400ms]" />
                                    </div>

                                    <span>
                                        Synthesizing answer from chunks...
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}
