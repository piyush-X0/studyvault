"use client";

import { useState, useEffect } from "react";

interface Document {
  id: string;
  filename: string;
  size: string;
  mimetype: string;
  createdAt: string;
}
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) {
        const error = await res
          .json()
          .then((data) => data?.error || "Failed to fetch documents.")
          .catch(() => "Failed to fetch documents.");
        setStatus(error);
        return;
      }

      const data = await res.json();
      const docs = Array.isArray(data)
        ? data
        : Array.isArray(data?.documents)
          ? data.documents
          : [];
      setDocuments(docs);
    } catch (error) {
      console.error(error);
      setStatus("Failed to fetch documents.");
    }
  }
  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleUploading() {
    if (!file) return;
    setUploading(true);
    setStatus("Getting Upload URl....");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "Application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setStatus(error);
        return;
      }

      const { presignedUrl } = await res.json();
      setStatus("Uploading to R2...");

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        setStatus("Uploading failed....");
        return;
      }

      setStatus("Uploaded Successfully....");
      setFile(null);

      const input = document.getElementById("file-input") as HTMLInputElement;
      if (input) input.value = "";

      fetchDocuments();
    } catch (error) {
      setStatus("Something went Wrong....");
    } finally {
      setUploading(false);
    }
  }

  async function handleViewing(id: string) {
    setViewingId(id);
    try {
      const res = await fetch(`/api/documents/${id}/url?mode=view`);
      if (!res.ok) throw new Error("failed to get URL...");

      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      console.error("view failed...");
    } finally {
      setViewingId(null);
    }
  }

  async function handleDownloading(id: string, filename: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/documents/${id}/url?mode=download`);
      if (!res.ok) throw new Error("failed to get URL...");

      const { url } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    } catch {
      console.error("download failed...");
    } finally {
      setLoadingId(null);
    }
  }
  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-12">
          <p className="text-[11px] text-neutral-600 tracking-widest uppercase mb-2">
            file-vault
          </p>
          <h1 className="text-[22px] font-normal text-neutral-200 m-0">
            Your files, stored privately.
          </h1>
        </div>

        <div
          className={`border border-dashed border-neutral-800 rounded-lg p-7 mb-3 transition-colors duration-150 ${file ? "bg-neutral-950" : "bg-transparent"}`}
        >
          <label htmlFor="file-input" className="block cursor-pointer">
            <div className={`flex items-center gap-3 ${file ? "mb-4" : ""}`}>
              <div className="w-9 h-9 border border-neutral-800 rounded-md flex items-center justify-center text-neutral-600 shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-neutral-400 m-0">
                  {file ? file.name : "Choose a file"}
                </p>
                {file && (
                  <p className="text-[11px] text-neutral-600 mt-0.5 m-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
          </label>

          <input
            id="file-input"
            type="file"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setStatus("");
            }}
            className="hidden"
          />

          {file && (
            <button
              onClick={handleUploading}
              disabled={uploading}
              className={`w-full py-2.5 rounded-md text-[13px] font-mono transition-colors duration-150
              ${
                uploading
                  ? "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                  : "bg-neutral-200 text-black hover:bg-white cursor-pointer"
              }`}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>

        {status && (
          <p className="text-[12px] text-neutral-500 pl-1 mb-8">{status}</p>
        )}

        <div className="border-t border-neutral-900 my-8" />

        <div>
          <p className="text-[11px] text-neutral-600 tracking-widest uppercase mb-4">
            {documents.length === 0
              ? "No files yet"
              : `${documents.length} file${documents.length !== 1 ? "s" : ""}`}
          </p>

          <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between px-3.5 py-3 rounded-md gap-3 hover:bg-neutral-950 transition-colors duration-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-neutral-700 shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] text-neutral-300 m-0 truncate">
                      {doc.filename}
                    </p>
                    <p className="text-[11px] text-neutral-600 mt-0.5 m-0">
                      {(Number(doc.size) / 1024).toFixed(1)} KB ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleViewing(doc.id)}
                    disabled={viewingId === doc.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-[5px] text-[12px] font-mono transition-colors duration-100
                    ${
                      viewingId === doc.id
                        ? "border-neutral-800 text-neutral-700 cursor-not-allowed"
                        : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 cursor-pointer"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {viewingId === doc.id ? "..." : "View"}
                  </button>

                  <button
                    onClick={() => handleDownloading(doc.id, doc.filename)}
                    disabled={loadingId === doc.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-[5px] text-[12px] font-mono transition-colors duration-100
                    ${
                      loadingId === doc.id
                        ? "border-neutral-800 text-neutral-700 cursor-not-allowed"
                        : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 cursor-pointer"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {loadingId === doc.id ? "..." : "Download"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
