"use client";

import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, FileText, LayoutGrid, Square, EllipsisVertical, Trash2 } from "lucide-react";
import { autoResize } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface Document {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: string;
  uploadedStatus: string;
  extractedStatus: string;
  embeddingStatus: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  fileName?: string;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [pipelineReady, setPipelineReady] = useState(false);
  const [asking, setAsking] = useState(false);
  const [uploadStage, setUploadStage] = useState<
    "idle" | "uploading" | "processing" | "ready" | "failed"
  >("idle");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const pollingRef = useRef<NodeJS.Timeout>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [thinkingLabel, setThinkingLabel] = useState('thinking...')
  const thinkingTimerRef = useRef<NodeJS.Timeout[]>([])
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect(() => { fetchDocuments() }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      console.error("failed to fetch documents");
    }
  }

  async function loadMessages(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}/messages`);
      const data = await res.json();
      const loaded = data.messages ?? [];
      setMessages(loaded.map((m: { role: string; text: string, fileName?: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        text: m.text,
        fileName: m.fileName ?? undefined
      })));
    } catch {
      console.error("failed to load messages");
    }
  }
  function openDocument(docId: string) {
    setActiveDocId(docId);
    setMessages([]);
    loadMessages(docId);
    setPendingFile(null);
    setPipelineReady(false);
    setUploadStage("idle");
    setOpenMenuId(null);
  }

  async function deleteDocument(docId: string) {
    try {
      await fetch(`/api/documents/${docId}/delete`, { method: "DELETE" });
      if (activeDocId === docId) {
        setActiveDocId(null);
        setMessages([]);
      }
      fetchDocuments();
    } catch {
      console.error("failed to delete document");
    }
  }

  async function handleUpload(file: File) {
    setUploadStage("uploading");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const { presignedUrl, documentId } = await res.json();
      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      await fetch(`/api/documents/${documentId}/confirm`, { method: "POST" });
      setUploadedDocId(documentId);
      setUploadStage("processing");
      fetchDocuments();
      startPolling(documentId);
    } catch {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setUploadStage("failed");
    }
  }

  function startPolling(docId: string) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        const docs: Document[] = data.documents ?? [];
        setDocuments(docs);
        const doc = docs.find((d) => d.id === docId);
        if (!doc) return;
        if (doc.embeddingStatus === "EMBEDDED") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setUploadStage("ready");
          setActiveDocId(docId);
          setPipelineReady(true);
        }
        if (doc.embeddingStatus === "FAILED" || doc.extractedStatus === "FAILED") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setUploadStage("failed");
        }
      } catch {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setUploadStage("failed");
      }
    }, 3000);
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 120_000);
  }

  function startThinkingTimer() {
    thinkingTimerRef.current.forEach(clearTimeout)
    thinkingTimerRef.current = []
    setThinkingLabel("thinking...")
    thinkingTimerRef.current.push(
      setTimeout(() => setThinkingLabel("preparing your answer..."), 8000)
    )
    thinkingTimerRef.current.push(
      setTimeout(() => setThinkingLabel("almost there..."), 14000)
    )
  }
  function clearThinkingTimer() {
    thinkingTimerRef.current.forEach(clearTimeout)
    thinkingTimerRef.current = []
    setThinkingLabel("thinking...")
  }

  async function handleQuery(fileName?: string) {
    if (!input.trim() || !activeDocId || asking) return;
    const userQuestion = input.trim();
    const docId = activeDocId;

    setMessages((prev) => [...prev, { role: "user", text: userQuestion, fileName }]);
    setInput("");
    setAsking(true);
    startThinkingTimer()
    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    await fetch(`/api/documents/${docId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", text: userQuestion, fileName }),
    });

    try {
      const res = await fetch(`/api/documents/${docId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });


      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = "";
      let firstChunk = true
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (firstChunk) {
          clearThinkingTimer()
          firstChunk = false
        }
        const chunk = decoder.decode(value, { stream: true });
        fullAnswer += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = { ...last, text: last.text + chunk };
          }
          return updated;
        });
      }

      await fetch(`/api/documents/${docId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "assistant", text: fullAnswer }),
      });

    } catch {
      clearThinkingTimer()
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: "Server is busy , please try again later..." };
        return updated;
      });
    } finally {
      clearThinkingTimer()
      setAsking(false);
    }
  }

  function dotColor(mimetype: string) {
    if (mimetype === "application/pdf") return "text-red-500";
    if (mimetype.includes("wordprocessingml")) return "text-blue-500";
    return "text-orange-500";
  }


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  return (
    <div className="h-screen bg-[#202124] text-[#E8E8E8] flex flex-col">
      {/* Header */}
      <header className="h-12 pl-5 pt-3 shrink-0 flex justify-self-start">
        <span className="text-[25px]  font-mono">DataFolio</span>

      </header>

      {/* Main Layout */}
      <div className="h-screen w-full flex mx-2 mt-3 overflow-hidden mb-2">

        {/* Left Card */}
        <aside className="max-w-fit min-w-77 h-full font-custom-theme bg-surface-container backdrop-blur-glass border border-custom-secondary rounded-2xl flex flex-col overflow-hidden">

          {/* Single Scrollable Container */}
          <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none [&::-webkit-scrollbar]:hidden p-3 pt-4">

            {/* 1. Tabs Bar (Scrolls away naturally) */}
            <div className="flex gap-2 rounded-3xl bg-surface-container mb-3">
              <button className="flex-1 py-1 text-sm rounded-2xl bg-state-active text-[#F1F3F4] flex items-center justify-center gap-1 font-semibold">
                <LayoutGrid className="w-3 h-3 stroke-3" />
                <span>My Chat</span>
              </button>
              <button
                onClick={() => {
                  setActiveDocId(null);
                  setMessages([]);
                  setInput("");
                  setPendingFile(null);
                  setPipelineReady(false);
                  setUploadStage("idle");
                  setUploadedDocId(null);
                }}
                className="flex-1 py-1.5 text-sm rounded-2xl text-[#BDC1C6] hover:bg-neutral-600 hover:text-white transition-colors font-mono"
              >
                New Chat
              </button>
            </div>

            {/* 2.  Search Input  */}
            <div className="sticky -top-4 z-20  py-2 mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full bg-zinc-800/80  border-custom-secondary text-xs text-white placeholder-zinc-500 rounded-xl px-3 py-2 outline-none  transition-colors font-mono"
              />
            </div>

            {/* 3. Document List */}
            <div>
              {filteredDocuments.length === 0 ? (
                <p className="text-xs text-zinc-600 px-3 py-2 font-mono">
                  {searchQuery ? "No matching chats found" : "No documents yet"}
                </p>
              ) : (
                filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`w-70 relative flex items-center gap-2 px-3 py-2 m-1 border-custom-secondary rounded-[9px] transition-colors group
              ${activeDocId === doc.id ? "bg-zinc-600" : "hover:bg-zinc-600"}
              ${doc.embeddingStatus !== "EMBEDDED" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
                    onClick={() => {
                      if (doc.embeddingStatus === "EMBEDDED") openDocument(doc.id);
                    }}
                  >
                    <span>
                      <FileText className={`w-4.5 h-4.5 mb-3 ${dotColor(doc.mimetype)}`} />
                    </span>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[14px] text-white truncate font-custom-theme font-semibold">
                        {doc.filename}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                        <span>
                          <Square className="w-2 h-2 stroke-1" />
                        </span>
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>

                    {/* Three-dot menu */}
                    <div
                      className="relative shrink-0"
                      onMouseLeave={() => setOpenMenuId(null)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                        }}
                        className={`text-zinc-500 hover:text-white text-sm px-1 transition-colors ${activeDocId === doc.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                      >
                        <EllipsisVertical className="w-4 h-4 text-bold" />
                      </button>
                      {openMenuId === doc.id && (
                        <div className="absolute right-0 top-6 z-10 bg-zinc-800 border-custom-secondary rounded-[9px] overflow-hidden w-20 shadow-lg">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDocument(doc.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center justify-around py-1 text-xs text-red-400 hover:bg-red-600 hover:text-white overflow-hidden border-custom-secondary rounded-[8px] transition-colors font-mono"
                          >
                            <span>
                              <Trash2 className="w-3 h-3" />
                            </span>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setPendingFile(file);
              e.target.value = "";
              await handleUpload(file);
            }}
          />
        </aside>

        {/* Right side */}
        < main className="flex-1 flex flex-col justify-between h-full min-w-0" >

          {/* Chat area */}
          < div className="flex-1 overflow-y-auto px-13 py-4 flex flex-col gap-6" >
            {
              messages.length === 0 && (
                <p className="text-zinc-600 text-sm font-mono">Upload a document to start</p>
              )
            }
            {
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.fileName && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2 mb-1 w-fit">
                      <span className="text-xs text-white font-mono block truncate max-w-50">
                        {msg.fileName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">
                        {msg.fileName.split(".").pop()}
                      </span>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                    ? "max-w-[70%] px-4 py-2 rounded-2xl bg-zinc-700 text-white"
                    : "text-zinc-300 max-w-[90%]"
                    }`}>
                    {msg.text}
                  </p>
                </div>
              ))
            }
            {
              asking && (
                <p className="text-zinc-500 text-sm font-mono animate-pulse">{thinkingLabel}</p>
              )
            }
            <div ref={chatBottomRef} />
          </div >

          {/* Query Card */}
          < footer className="mx-9 py-3" >
            <div className="bg-[#1b1c1e] border border-custom-secondary rounded-3xl p-4 px-5">
              {pendingFile && (
                <div className="flex items-center gap-2 mb-3 bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2 w-fit max-w-55">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs text-white font-mono truncate">{pendingFile.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">
                      {pendingFile.name.split(".").pop()}
                    </span>
                  </div>
                  {(uploadStage === "uploading" || uploadStage === "processing") && (
                    <div className="w-3 h-3 rounded-full border-2 border-zinc-500 border-t-white animate-spin shrink-0" />
                  )}
                  {uploadStage === "failed" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-red-400 text-xs">⚠</span>
                      <button
                        onClick={() => { setPendingFile(null); setUploadStage("idle"); setUploadedDocId(null); }}
                        className="text-zinc-500 hover:text-white text-xs transition-colors"
                      >✕</button>
                    </div>
                  )}
                  {uploadStage === "ready" && pipelineReady && (
                    <button
                      onClick={async () => {
                        if (uploadedDocId) {
                          await fetch(`/api/documents/${uploadedDocId}/delete`, { method: "DELETE" });
                          setUploadedDocId(null);
                          setActiveDocId(null);
                          fetchDocuments();
                        }
                        setPendingFile(null);
                        setPipelineReady(false);
                        setUploadStage("idle");
                      }}
                      className="text-zinc-500 hover:text-white text-xs shrink-0 transition-colors"
                    >✕</button>
                  )}
                </div>
              )}

              <textarea
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (uploadStage === "uploading" || uploadStage === "processing") return;
                    const fileName = pendingFile?.name;
                    setPendingFile(null);
                    setPipelineReady(false);
                    await handleQuery(fileName);
                  }
                }}
                placeholder="Write your Query..."
                className="w-full outline-none text-[18px] bg-transparent placeholder-zinc-500 resize-none overflow-hidden"
                style={{ minHeight: "110px", maxHeight: "240px" }}
              />

              <div className="flex items-center justify-between -mt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full h-8 w-8 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="bg-zinc-400 rounded-full text-zinc-900 w-10 h-10 hover:bg-zinc-200 transition-colors"
                  onClick={async () => {
                    if (uploadStage === "uploading" || uploadStage === "processing") return;
                    const fileName = pendingFile?.name;
                    setPendingFile(null);
                    setPipelineReady(false);
                    await handleQuery(fileName);
                  }}
                >
                  <ArrowUp />
                </Button>
              </div>
            </div>
          </footer >
        </main >
      </div >
    </div >
  );
}