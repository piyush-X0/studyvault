"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
    ArrowUp,
    FileCode2,
    FileText,
    FileType2,
    Loader2,
    Plus,
    X,
    type LucideIcon,
} from "lucide-react";
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
        if (uploadInProgress || uploadFailed || isLoading || disabled) {
            return;
        }

        if (!trimmed) {
            return;
        }

        if (pendingFile && (onPickFile || onFileUpload)) {
            const file = pendingFile;
            setPendingFile(null);

            if (onPickFile) {
                void onPickFile(file);
            } else {
                onFileUpload?.(file);
            }

            return;
        }

        if (!trimmed) {
            return;
        }

        if (onSubmit) {
            onSubmit();
        } else {
            onSend?.(trimmed);
        }

        if (value === undefined) {
            setInternalInput("");
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


    const uploadInProgress =
        uploadStage === "uploading" ||
        uploadStage === "processing";

    const uploadFailed = uploadStage === "failed";
    const canSend =
        Boolean(inputValue.trim()) &&
        !isLoading &&
        !disabled &&
        !uploadInProgress &&
        !uploadFailed;
    function getUploadStatusText(
        uploadStage?: UploadStage,
    ): string | null {
        switch (uploadStage) {
            case "uploading":
                return "Uploading file...";
            case "processing":
                return "Extracting, chunking and embedding...";
            case "ready":
                return "Document ready";
            case "failed":
                return "Upload failed";
            default:
                return null;
        }
    }
    function getUploadAnimation(uploadStage?: UploadStage): string {
        if (uploadStage === "uploading") {
            return "animate-pulse bg-blue-500/10";
        }

        if (uploadStage === "processing") {
            return "animate-pulse bg-purple-500/10";
        }

        if (uploadStage === "failed") {
            return "bg-red-500/10";
        }

        return "bg-[#1C1C1C]";
    }
    function getAttachmentIcon(fileName: string): {
        Icon: LucideIcon;
        className: string;
    } {
        const lowerName = fileName.toLowerCase();

        if (lowerName.endsWith(".pdf")) {
            return {
                Icon: FileText,
                className: "text-red-400",
            };
        }

        if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
            return {
                Icon: FileType2,
                className: "text-orange-400",
            };
        }

        if (lowerName.endsWith(".docx")) {
            return {
                Icon: FileCode2,
                className: "text-blue-400",
            };
        }

        return {
            Icon: FileText,
            className: "text-neutral-400",
        };
    }
    const attachmentIcon = displayAttachmentName
        ? getAttachmentIcon(displayAttachmentName)
        : null;
    const AttachmentIcon = attachmentIcon?.Icon;

    const uploadStatusText = getUploadStatusText(uploadStage);
    const uploadAnimation = getUploadAnimation(uploadStage);

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
                    {showAttachment && displayAttachmentName && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: 8, filter: "blur(8px)" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="flex items-center gap-2 px-3.5 pt-3 pb-1"
                        >
                            <div
                                className={[
                                    "flex min-w-0 flex-1 items-center gap-2 rounded-xl",
                                    "border border-neutral-700 px-3 py-1.5 text-xs",
                                    "text-neutral-200 shadow-sm transition-colors duration-300",
                                    uploadAnimation,
                                ].join(" ")}
                            >
                                {AttachmentIcon && attachmentIcon && (
                                    <AttachmentIcon
                                        className={`h-4 w-4 shrink-0 ${attachmentIcon.className}`}
                                    />
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {displayAttachmentName}
                                    </p>

                                    {uploadStatusText && (
                                        <p className="mt-0.5 text-[10px] text-neutral-500">
                                            {uploadStatusText}
                                        </p>
                                    )}
                                </div>

                                {uploadStage === "failed" && uploadError && (
                                    <span
                                        className="max-w-45 truncate text-[10px] text-red-400"
                                        title={uploadError}
                                    >
                                        {uploadError}
                                    </span>
                                )}

                                {uploadStage !== "failed" && uploadStage !== "ready" && (
                                    <span className="relative h-2 w-10 overflow-hidden rounded-full bg-neutral-800">
                                        <span className="absolute inset-y-0 left-0 w-1/2 animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-white/40 blur-sm" />
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={clearAttachment}
                                    className="ml-1 shrink-0 rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
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
                        className={[
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                            canSend
                                ? "bg-white text-black shadow-sm"
                                : "cursor-not-allowed bg-neutral-800 text-neutral-600",
                        ].join(" ")}
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
