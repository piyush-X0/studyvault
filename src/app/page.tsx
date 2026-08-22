"use client";

import { Button } from "@/components/ui/button";
import { Plus, ArrowUp } from "lucide-react";
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
export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string, fileName?: string }[]
  >([]);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null)
  const [pipelineReady, setPipelineReady] = useState(false)
  const [asking, setAsking] = useState(false);
  const [uploadStage, setUploadStage] = useState<
    "idle" | "uploading" | "processing" | "ready" | "failed"
  >("idle");
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      console.log("failed to fetch document");
    }
  }

  const pollingRef = useRef<NodeJS.Timeout>(null);

  async function handleUpload(file: File) {
    setUploadingFileName(file.name);
    setUploadStage("uploading");
    try {
      //getting presigned url
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
      //put file directly to R2
      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      //confirm ( triggers pipeline automatically)
      await fetch(`/api/documents/${documentId}/confirm`, {
        method: "POST",
      });
      setUploadedDocId(documentId);
      setUploadStage("processing");
      fetchDocuments();
      startPolling(documentId);
    } catch {
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

        if (
          doc.embeddingStatus === "FAILED" ||
          doc.extractedStatus === "FAILED"
        ) {
          clearInterval(pollingRef.current!);
          setUploadStage("failed");
        }
      } catch {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setUploadStage("failed")
      }
    }, 3000);
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 120_000);
  }

  async function handleQuery(fileName?: string) {
    if (!input.trim() || !activeDocId || asking) return;
    const userQuestion = input.trim();

    setMessages((prev) => [...prev, { role: "user", text: userQuestion, fileName }]);
    setInput("");
    setAsking(true);

    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    try {
      const res = await fetch(`/api/documents/${activeDocId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              text: last.text + chunk
            };
          }
          return updated;
        });
      }

    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: "Something went wrong." };
        return updated;
      });
    } finally {
      setAsking(false);
    }
  }
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="h-screen bg-[#202124] text-[#E8E8E8] flex flex-col">
      {/* Header */}
      <header className=" h-12  px-15 pt-5 shrink-0 flex items-center justify-between   ">
        <span className=" text-[25px] font-bold tracking-widest ">
          LexiChat
        </span>
        <div>
          <a
            href="https://github.com/piyush-X0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-md text-[#6B6B6B] hover:text-[#E8E8E8] transition-colors"
          >
            Github
          </a>
        </div>
      </header>
      {/*Main Layout */}
      <div className="h-screen w-full flex mx-2 mt-3  overflow-hidden  mb-2 ">
        {/*left Card*/}
        <aside className="w-100 h-full border border-zinc-700 rounded-4xl ">
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

        <main className=" flex-1 flex flex-col justify-between h-full min-w-0">
          {/*Chat area*/}
          <div className="flex-1 overflow-y-auto px-9 py-4 flex flex-col gap-6">
            {messages.length === 0 && (
              <p className="text-zinc-600 text-sm font-mono">Upload a document to start</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>

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

                <p className={`text-sm leading-relaxed max-w-[80%] px-4 py-2 rounded-2xl whitespace-pre-wrap ${msg.role === "user" ? "bg-zinc-700 text-white" : "text-zinc-300"
                  }`}>
                  {msg.text}
                </p>
              </div>
            ))}
            {asking && (
              <p className="text-zinc-500 text-sm font-mono animate-pulse">thinking...</p>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/*Right query Card*/}
          <footer className=" mx-9 py-3   ">
            <div className="bg-[#1b1c1e] border-2 border-zinc-700 rounded-4xl p-4 px-5 -mb-3">
              {pendingFile && (
                <div className="flex items-center gap-2 mb-3 bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2 w-fit max-w-55">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs text-white font-mono truncate">
                      {pendingFile.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">
                      {pendingFile.name.split(".").pop()}
                    </span>
                  </div>

                  {/* uploading */}
                  {uploadStage === "uploading" || uploadStage === "processing" ? (
                    <div className="w-3 h-3 rounded-full border-2 border-zinc-500 border-t-white animate-spin shrink-0" />
                  ) : null}

                  {/* failed */}
                  {uploadStage === "failed" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-red-400 text-xs">⚠</span>
                      <button
                        onClick={() => {
                          setPendingFile(null)
                          setUploadStage("idle")
                          setUploadedDocId(null)
                        }}
                        className="text-zinc-500 hover:text-white text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* ready — real delete */}
                  {uploadStage === "ready" && pipelineReady && (
                    <button
                      onClick={async () => {
                        if (uploadedDocId) {
                          await fetch(`/api/documents/${uploadedDocId}`, { method: "DELETE" })
                          setUploadedDocId(null)
                          setActiveDocId(null)
                          fetchDocuments()
                        }
                        setPendingFile(null)
                        setPipelineReady(false)
                        setUploadStage("idle")
                      }}
                      className="text-zinc-500 hover:text-white text-xs shrink-0 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <textarea
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    const fileName = pendingFile?.name
                    setPendingFile(null)
                    setPipelineReady(false)
                    await handleQuery(fileName)
                  }
                }}
                placeholder="Write your Query..."
                className="w-full outline-none text-[18px] bg-transparent placeholder-zinc-500 resize-none overflow-hidden "
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
                  className={
                    "bg-zinc-400 rounded-full text-zinc-900 w-10 h-10  hover:bg-zinc-200 transition-colors"
                  }
                  onClick={async () => {
                    const fileName = pendingFile?.name
                    setPendingFile(null)
                    setPipelineReady(false)
                    await handleQuery(fileName)
                  }}
                >
                  <ArrowUp />
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
