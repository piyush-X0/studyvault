"use client";

interface Document {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: string;
  uploadedStatus: string;
  extractedStatus: string;
  embeddingstatus: string;
}
export default function Home() {
  return (
    <div className="h-screen bg-[#0A0A0A] text-[#E8E8E8] flex flex-col">
      {/* Header */}
      <header className=" h-12 border-b border-[#2A2A2A] px-9 shrink-0 flex items-center justify-between">
        <span className="font-mono text-sm tracking-widest ">LexiChat</span>
        <div>
          <a
            href="https://github.com/piyush-X0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#6B6B6B] hover:text-[#E8E8E8] transition-colors"
          >
            Github
          </a>
        </div>
      </header>
    </div>
  );
}
