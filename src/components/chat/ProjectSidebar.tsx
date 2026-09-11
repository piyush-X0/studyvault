"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCode2,
  FileText,
  FileType2,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentItem {
  id: string;
  fileName?: string;
  name?: string;
  mimetype?: string;

  size?: number;
  createdAt?: string;
  uploadedAt?: string;

  uploadedStatus?: string;
  extractedStatus?: string;
  embeddingStatus?: string;

  status?: string;
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
function getFileIcon(fileName: string, mimetype?: string) {
  const lowerName = fileName.toLowerCase();

  if (mimetype === "application/pdf" || lowerName.endsWith(".pdf")) {
    return {
      Icon: FileText,
      iconClassName: "text-red-400",
      containerClassName: "bg-red-500/10 border-red-500/20",
    };
  }

  if (
    mimetype === "text/plain" ||
    mimetype === "text/markdown" ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md")
  ) {
    return {
      Icon: FileType2,
      iconClassName: "text-orange-400",
      containerClassName: "bg-orange-500/10 border-orange-500/20",
    };
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    return {
      Icon: FileCode2,
      iconClassName: "text-blue-400",
      containerClassName: "bg-blue-500/10 border-blue-500/20",
    };
  }

  return {
    Icon: FileText,
    iconClassName: "text-neutral-400",
    containerClassName: "bg-neutral-500/10 border-neutral-500/20",
  };
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
      className={`flex h-full w-72 md:w-80 flex-col border-r border-neutral-800 bg-[#0A0A0A]  text-neutral-200 ${className}`}
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
            className="w-full rounded-lg border border-neutral-800 bg-[#141414] py-1.5 pl-8 pr-3 text-xs text-neutral-100 placeholder-neutral-500 transition-all focus:bg-zinc-800 focus:outline-none "
          />
        </div>
      </div>

      {/* FIXED TITLE */}
      <div className="shrink-0 px-4 pt-3.5 pb-1">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Recent Documents
        </p>
      </div>

      {/* DOCUMENT LIST */}
      <div className="min-h-0 flex-1 custom-scrollbar overflow-y-auto  px-2 py-1 space-y-1">
        {filteredDocs.map((document) => {
          const isSelected = resolvedSelectedId === document.id;
          const fileName = document.fileName ?? "Untitled document";
          const status =
            document.embeddingStatus ??
            document.extractedStatus ??
            document.uploadedStatus ??
            "PENDING";

          const {
            Icon: FileIcon,
            iconClassName,
            containerClassName,
          } = getFileIcon(fileName, document.mimetype);

          return (
            <div
              key={document.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectDocument?.(document.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSelectDocument?.(document.id);
                }
              }}
              className={[
                "group relative flex cursor-pointer items-center gap-3 rounded-xl",
                "border p-2.5 text-xs transition-all duration-200 ease-out",
                "hover:bg-zinc-800",
                isSelected
                  ? "border-neutral-700 bg-[#1C1C1C] text-white shadow-sm"
                  : "border-transparent text-neutral-400 hover:text-white",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  containerClassName,
                ].join(" ")}
              >
                <FileIcon className={`h-4 w-4 ${iconClassName}`} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{fileName}</p>

                <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                  <span>
                    {status === "EMBEDDED" ? "Ready" : status.toLowerCase()}
                  </span>

                  {status === "EMBEDDED" && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  )}

                  {status === "FAILED" && (
                    <AlertCircle className="h-3 w-3 text-rose-400" />
                  )}

                  {status !== "EMBEDDED" && status !== "FAILED" && (
                    <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />
                  )}
                </div>
              </div>

              {handleDeleteDocument && (
                <button
                  type="button"
                  aria-label={`Delete ${fileName}`}
                  title="Delete document"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteDocument(document.id);
                  }}
                  className={[
                    "shrink-0 rounded-md p-1.5 text-neutral-500",
                    "opacity-0 transition-all duration-200 ease-out",
                    "group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-400",
                    "focus-visible:opacity-100 focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-red-400/50",
                  ].join(" ")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
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
