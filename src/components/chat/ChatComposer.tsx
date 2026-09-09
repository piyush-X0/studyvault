"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp, Plus, X, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UploadStage = "idle" | "uploading" | "processing" | "ready" | "failed";

interface ChatComposerProps {
    value?: string;
    onChange?: (value: string) => void;
    onSubmit?: () => void;
    onSend?: (message: string) => void;
    onFileUpload?: (file: File) => void;
    onPickFile?: (file: File) => Promise<void> | void;
    onClearAttachment?: () => void;
    attachmentName?: string | null;
    uploadStage?: UploadStage;
    uploadError?: string | null;
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    selectedDocName?: string;
}

export default function ChatComposer({
    value,
    onChange,
    onSubmit,
    onSend,
    onFileUpload,
    onPickFile,
    onClearAttachment,
    attachmentName,
    uploadStage,
    uploadError,
    isLoading = false,
    disabled = false,
    placeholder = "Ask anything about your document...",
    selectedDocName,
}: ChatComposerProps) {
    const [internalInput, setInternalInput] = useState("");
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const inputValue = value ?? internalInput;
    const displayAttachmentName = attachmentName ?? pendingFile?.name ?? null;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [inputValue]);

    const updateInput = (next: string) => {
        if (value !== undefined) {
            onChange?.(next);
            return;
        }

        setInternalInput(next);
    };

    const clearAttachment = () => {
        setPendingFile(null);
        onClearAttachment?.();
    };

    const handleSend = () => {
        const trimmed = inputValue.trim();

        if ((!trimmed && !pendingFile && !displayAttachmentName) || isLoading || disabled) {
            return;
        }

        if (pendingFile && (onPickFile || onFileUpload)) {
            const file = pendingFile;
            setPendingFile(null);

            if (onPickFile) {
                void onPickFile(file);
                return;
            }

            onFileUpload?.(file);
            return;
        }

        if (trimmed) {
            if (onSubmit) {
                onSubmit();
            } else if (onSend) {
                onSend(trimmed);
            }

            if (value === undefined) {
                setInternalInput("");
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            e.target.value = "";
            return;
        }

        e.target.value = "";

        if (onPickFile) {
            void onPickFile(file);
            return;
        }

        setPendingFile(file);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const showAttachment = displayAttachmentName && !uploadStage ? true : !!displayAttachmentName;

    return (
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-4">
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={handleFileChange}
                className="hidden"
            />

            <div
                className={`relative rounded-2xl border transition-all duration-200 bg-[#121212]/95 backdrop-blur-md ${isFocused
                    ? "border-neutral-500 ring-1 ring-neutral-500 shadow-lg shadow-black/50"
                    : "border-neutral-800"
                    }`}
            >
                <AnimatePresence>
                    {showAttachment && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="flex items-center gap-2 px-3.5 pt-3 pb-1"
                        >
                            <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-[#1C1C1C] px-3 py-1.5 text-xs text-neutral-200 shadow-sm">
                                <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="font-medium truncate max-w-55">{displayAttachmentName}</span>
                                {pendingFile && (
                                    <span className="text-[10px] text-neutral-500 font-mono">
                                        ({formatFileSize(pendingFile.size)})
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={clearAttachment}
                                    className="ml-1 rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                                    title="Remove attachment"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputValue}
                    disabled={disabled || isLoading}
                    onChange={(e) => updateInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                        selectedDocName
                            ? `Ask question in "${selectedDocName}"...`
                            : placeholder
                    }
                    className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                />

                <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-800/80">
                    <div className="flex items-center gap-2">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-[#1A1A1A] px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-[#222222] hover:text-white"
                            title="Attach document (.pdf, .txt, .docx)"
                        >
                            <Plus className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Attach document</span>
                        </motion.button>

                        <span className="text-[11px] text-neutral-500 hidden sm:inline-block">
                            Shift + Enter for new line
                        </span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={(!inputValue.trim() && !pendingFile && !displayAttachmentName) || isLoading || disabled}
                        onClick={handleSend}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all ${inputValue.trim() || pendingFile || displayAttachmentName
                            ? "bg-white text-black shadow-sm"
                            : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
