import { useRef } from "react";
import { ArrowUp, Plus, Sparkle, X, FileText } from "lucide-react";
import type { UploadStage } from "@/lib/studyvault-api";

interface ChatComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onPickFile?: (file: File) => void;
    onClearAttachment?: () => void;
    attachmentName?: string | null;
    uploadStage?: UploadStage;
    uploadError?: string | null;
    disabled?: boolean;
}

export function ChatComposer({
    value,
    onChange,
    onSubmit,
    onPickFile,
    onClearAttachment,
    attachmentName,
    uploadStage = "idle",
    uploadError,
    disabled,
}: ChatComposerProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    function autoResize(el: HTMLTextAreaElement) {
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
    }

    return (
        <div className="rounded-2xl border border-panel-border bg-composer p-4 pb-3">
            {attachmentName && (
                <div className="mb-2 flex w-fit max-w-full items-center gap-2 rounded-lg bg-elevated/70 px-3 py-1.5 ring-1 ring-panel-border">
                    <FileText className="size-3.5 shrink-0 text-file-pdf" />
                    <span className="truncate text-[11px] text-muted-foreground">{attachmentName}</span>
                    <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={onClearAttachment}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <X className="size-3" />
                    </button>
                </div>
            )}

            {uploadStage === "uploading" && (
                <p className="mb-2 text-[11px] text-muted-foreground">
                    Uploading document...
                </p>
            )}

            {uploadStage === "processing" && (
                <p className="mb-2 text-[11px] text-muted-foreground">
                    Processing document...
                </p>
            )}

            {uploadStage === "failed" && !uploadError && (
                <p className="mb-2 text-[11px] text-red-400">
                    Document processing failed.
                </p>
            )}

            {uploadError && (
                <p className="mb-2 text-[11px] text-red-400">
                    {uploadError}
                </p>
            )}

            <textarea
                rows={1}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    autoResize(e.target);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit();
                    }
                }}
                placeholder="Upload a document and ask anything about it"
                aria-label="Message"
                className="min-h-18 w-full resize-none overflow-hidden bg-transparent text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            />

            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];

                            if (file) {
                                onPickFile?.(file);
                            }

                            event.target.value = "";
                        }}
                    />

                    <button
                        type="button"
                        aria-label="Upload document"
                        title="Upload a document"
                        onClick={() => fileRef.current?.click()}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground"
                    >
                        <Plus className="size-4" />
                    </button>

                    <span className="hidden text-[9px] text-muted-foreground sm:inline  tracking-wider">
                        PDF, DOCX, TXT · max <span className="text-red-500"> 1 MB</span> · short documents work best
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-foreground/80">
                        <Sparkle className="size-3.5" />
                        Gemini 3 Flash
                    </span>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={disabled || (value.trim().length === 0 && !attachmentName)}
                        aria-label="Send message"
                        className="grid size-8 place-items-center rounded-full text-foreground transition-colors hover:bg-state-hover disabled:opacity-40"
                    >
                        <ArrowUp className="size-4" />
                    </button>
                </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Supports PDF, DOCX, TXT, and Markdown up to 1 MB. Very text-heavy documents
                may exceed the demo processing <span className="text-blue-500"> limit—upload</span> a chapter, section, or short
                notes instead.
            </p>
        </div>
    );
}
