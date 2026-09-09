"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Trash2, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentItem {
  id: string;
  name?: string;
  fileName?: string;
  status?: "READY" | "UPLOADING" | "EXTRACTING" | "CHUNKING" | "EMBEDDING" | "FAILED" | string;
  uploadedStatus?: string;
  size?: number;
  uploadedAt?: string;
  fileUrl?: string;
  progress?: number;
}

interface ProjectSidebarProps {
  documents: DocumentItem[];
  selectedDocumentId?: string;
  activeId?: string | null;
  onSelectDocument?: (id: string) => void;
  onSelect?: (id: string) => void;
  onNewChat: () => void;
  onDeleteDocument?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isLoading?: boolean;
}

export default function ProjectSidebar({
  documents,
  selectedDocumentId,
  activeId,
  onSelectDocument,
  onSelect,
  onNewChat,
  onDeleteDocument,
  onDelete,
  className = "",
  isOpen = false,
  onClose,
  isLoading = false,
}: ProjectSidebarProps) {
  const resolvedSelectedId = selectedDocumentId ?? activeId;
  const handleSelectDocument = onSelectDocument ?? onSelect ?? (() => undefined);
  const handleDeleteDocument = onDeleteDocument ?? onDelete ?? (() => undefined);
  const [query, setQuery] = useState("");

  const filteredDocs = useMemo(() => {
    if (!query.trim()) return documents;
    return documents.filter((doc) => {
      const docName = doc.name ?? doc.fileName ?? "";
      return docName.toLowerCase().includes(query.toLowerCase());
    });
  }, [documents, query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const sidebarContent = (
    <aside
      className={`flex h-full w-72 md:w-80 flex-col border-r border-neutral-800 bg-[#0A0A0A] text-neutral-200 ${className}`}
    >
      {/* FIXED CONTROLS TOP */}
      <div className="shrink-0 p-3 space-y-2 border-b border-neutral-800/80">
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onNewChat();
              onClose?.();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-neutral-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </motion.button>

          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-[#141414] py-1.5 pl-8 pr-3 text-xs text-neutral-100 placeholder-neutral-500 transition-all focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
        </div>
      </div>

      {/* FIXED TITLE */}
      <div className="shrink-0 px-4 pt-3.5 pb-1">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Recent Documents
        </p>
      </div>

      {/* SCROLLABLE DOCUMENT LIST ONLY */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {filteredDocs.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center px-4 text-center">
            <FileText className="h-8 w-8 text-neutral-700 mb-2" />
            <p className="text-xs text-neutral-500">
              {query ? "No matching documents" : "No documents uploaded yet"}
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = resolvedSelectedId === doc.id;
            const docName = doc.name ?? doc.fileName ?? "Untitled document";
            const docStatus = doc.status ?? doc.uploadedStatus ?? "UPLOADING";

            return (
              <div
                key={doc.id}
                onClick={() => {
                  handleSelectDocument(doc.id);
                  onClose?.();
                }}
                className={`group relative flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all text-xs ${isSelected
                  ? "bg-[#1C1C1C] font-medium text-white border border-neutral-700 shadow-sm"
                  : "text-neutral-400 hover:bg-[#141414] hover:text-neutral-200"
                  }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="shrink-0">
                    {(docStatus === "READY" || docStatus === "EMBEDDED") && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {docStatus === "FAILED" && (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                    )}
                    {docStatus !== "READY" && docStatus !== "FAILED" && docStatus !== "EMBEDDED" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
                    )}
                  </div>
                  <span className="truncate">{docName}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-opacity"
                  title="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block h-full shrink-0">
        {sidebarContent}
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed inset-y-0 left-0 w-72 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
