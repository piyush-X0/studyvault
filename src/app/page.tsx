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
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
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
      const res = await fetch("api/upload", {
        method: "POST",
        headers: { "Content-Type": "Application/json" },
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
        const res = await fetch("api/documents");
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
        }

        if (
          doc.embeddingStatus === "FAILED" ||
          doc.extractedStatus === "FAILED"
        ) {
          clearInterval(pollingRef.current!);
          setUploadStage("failed");
        }
      } catch {
        console.error("polling Error");
      }
    }, 3000);
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 120_000);
  }
  async function handleQuery() {
    if (!question.trim() || !activeDocId || asking) return;
    setAsking(true);
    setAnswer("");
    try {
      const res = await fetch(`/api/documents/${activeDocId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "No answer returned.");
      setQuestion("");
    } catch {
      setAnswer("Something went wrong. Try again.");
    } finally {
      setAsking(false);
    }
  }
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPendingFile(file);
              e.target.value = "";
            }}
          />
        </aside>

        <main className=" flex-1 flex flex-col justify-between h-full min-w-0">
          {/*Chat area*/}
          <div className="flex-1"></div>

          {/*Right query Card*/}
          <footer className=" mx-9 py-3   ">
            <div className="bg-[#1b1c1e] border-2 border-zinc-700 rounded-4xl p-4 px-5 -mb-3">
              {pendingFile && (
                <div className="flex items-center gap-2 mb-3 bg-zinc-800 border border-zinc-700 rounded-2xl px-3  w-fit max-w-55 py-3 pb-12">
                  <button
                    onClick={() => setPendingFile(null)}
                    className="text-zinc-300 hover:text-white text-xs leading-none shrink-0 -ml-4 -mt-11 bg-zinc-700 rounded-full p-1"
                  >
                    ✕
                  </button>
                  <div className="flex flex-col min-w-0 -ml-2 ">
                    <span className="text-xs text-white font-mono truncate mb-1">
                      {pendingFile.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">
                      {pendingFile.name.split(".").pop()}
                    </span>
                  </div>
                </div>
              )}
              <textarea
                rows={1}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery();
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
                    if (pendingFile) {
                      await handleUpload(pendingFile);
                      setPendingFile(null);
                    } else {
                      handleQuery();
                    }
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
