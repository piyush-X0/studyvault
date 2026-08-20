"use client";

import { Button } from "@/components/ui/button";
import { Plus, ArrowUp } from "lucide-react";
import { useState } from "react";

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

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    if (el.scrollHeight > 240) {
      el.style.overflowY = "auto";
    } else {
      el.style.overflowY = "hidden";
    }
  }
  function handleQuery() {}
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
        <aside className="w-100 h-full border border-zinc-700 rounded-4xl "></aside>

        <main className=" flex-1 flex flex-col justify-between h-full min-w-0">
          {/*Chat area*/}
          <div className="flex-1"></div>

          {/*Right Chat Card*/}
          <footer className=" mx-9 py-3   ">
            <div className="bg-[#1b1c1e] border-2 border-zinc-700 rounded-4xl p-4 px-5 -mb-3">
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
