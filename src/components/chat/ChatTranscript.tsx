import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import type { ChatMessage } from "@/lib/chat-data";

function renderInline(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i} className="font-semibold text-foreground">
                {part.slice(2, -2)}
            </strong>
        ) : (
            <span key={i}>{part}</span>
        ),
    );
}

function AssistantBody({ text }: { text: string }) {
    const blocks = text.split("\n").filter((line) => line.trim().length > 0);
    return (
        <div className="max-w-[68ch] space-y-4 text-[13.5px] leading-relaxed text-foreground/90">
            {blocks.map((line, i) => (
                <p key={i}>{renderInline(line)}</p>
            ))}
        </div>
    );
}

export function ChatTranscript({
    messages,
    thinking,
    thinkingLabel = "thinking...",
    emptyLabel = "Pick a project or upload a document to start a conversation.",
}: {
    messages: ChatMessage[];
    thinking?: boolean;
    thinkingLabel?: string;
    emptyLabel?: string;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, thinking]);

    return (
        <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-4">
            {messages.length === 0 && (
                <p className="text-[13px] text-muted-foreground">
                    {emptyLabel}
                </p>
            )}

            <div className="space-y-6">
                {messages.map((message) =>
                    message.role === "user" ? (
                        <div key={message.id} className="flex flex-col items-end gap-2">
                            {message.fileName && (
                                <div className="flex max-w-[16rem] items-start gap-2 rounded-lg bg-elevated/70 px-3 py-2 ring-1 ring-panel-border">
                                    <FileText className="mt-0.5 size-3.5 shrink-0 text-file-pdf" />
                                    <span className="break-all text-[10px] leading-snug text-muted-foreground">
                                        {message.fileName}
                                    </span>
                                </div>
                            )}
                            <p className="max-w-[70%] rounded-2xl bg-bubble px-4 py-2 text-[13px] text-bubble-foreground">
                                {message.text}
                            </p>
                        </div>
                    ) : (
                        <AssistantBody key={message.id} text={message.text} />
                    ),
                )}

                {thinking && (
                    <p className="animate-pulse font-mono text-[12px] text-muted-foreground">
                        {thinkingLabel}
                    </p>
                )}
            </div>
            <div ref={bottomRef} />
        </div>
    );
}
