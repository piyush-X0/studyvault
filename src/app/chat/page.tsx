"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ProjectSidebar from "@/components/chat/ProjectSidebar";
import ChatTranscript, { MessageItem } from "@/components/chat/ChatTranscript";
import ChatComposer from "@/components/chat/ChatComposer";

export default function ChatPage() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | undefined>();
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (content: string) => {
        const userMsg: MessageItem = { id: Date.now().toString(), role: "user", content };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "This is a grounded answer retrieved from your document vectors.",
                },
            ]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0A0A0A] text-neutral-100">
            {/* 1. FIXED FULL-WIDTH HEADER AT THE TOP */}
            <Header
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
                isScrolled={isScrolled}
            />

            {/* 2. MAIN WORKSPACE AREA BELOW HEADER */}
            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                {/* SIDEBAR FLUSH UNDER HEADER */}
                <ProjectSidebar
                    documents={documents}
                    selectedDocumentId={selectedDocId}
                    onSelectDocument={(id) => setSelectedDocId(id)}
                    onNewChat={() => {
                        setSelectedDocId(undefined);
                        setMessages([]);
                    }}
                    onDeleteDocument={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />

                {/* CHAT TRANSCRIPT + COMPOSER */}
                <main className="flex flex-1 flex-col min-w-0 h-full relative bg-[#0D0D0D]">
                    <ChatTranscript
                        messages={messages}
                        isLoading={isLoading}
                        hasDocument={Boolean(selectedDocId || documents.length > 0)}
                        onScrollStateChange={setIsScrolled}
                        onSampleClick={(prompt) => handleSend(prompt)}
                    />

                    <ChatComposer
                        onSend={handleSend}
                        isLoading={isLoading}
                        selectedDocName={documents.find((d) => d.id === selectedDocId)?.name}
                    />
                </main>
            </div>
        </div>
    );
}
