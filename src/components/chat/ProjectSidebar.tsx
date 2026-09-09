
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  Trash2,
  TriangleAlert,
  PenSquare,
  CloudSync
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDate,
  kindFromMime,
  type StudyDocument,
} from "@/lib/studyvault-api";

interface ProjectSidebarProps {
  documents: StudyDocument[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  isLoading: boolean
}

type DocumentState = "ready" | "processing" | "failed";

const kindTone: Record<"pdf" | "doc" | "txt", string> = {
  pdf: "text-file-pdf",
  doc: "text-file-doc",
  txt: "text-file-txt",
};

function getDocumentState(document: StudyDocument): DocumentState {
  const hasFailed =
    document.uploadedStatus === "FAILED" ||
    document.extractedStatus === "FAILED" ||
    document.embeddingStatus === "FAILED";

  if (hasFailed) {
    return "failed";
  }

  const isReady =
    document.uploadedStatus === "UPLOADED" &&
    document.extractedStatus === "EXTRACTED" &&
    document.embeddingStatus === "EMBEDDED";

  if (isReady) {
    return "ready";
  }

  return "processing";
}

function DocumentSkeletonRow() {
  return (
    <li className="flex items-center gap-2.5 rounded-lg px-2 py-2">
      <span className="size-8 shrink-0 rounded-md bg-surface-elevated ring-1 ring-panel-border animate-pulse" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block h-3 w-3/4 rounded bg-surface-elevated animate-pulse" />
        <span className="block h-2.5 w-1/3 rounded bg-surface-elevated animate-pulse" />
      </span>
    </li>
  );
}

function DocumentSkeletonList() {
  return (
    <ul className="space-y-0.5">
      <DocumentSkeletonRow />
      <DocumentSkeletonRow />
      <DocumentSkeletonRow />
    </ul>
  );
}

function ProjectIcon({ kind }: { kind: "pdf" | "doc" | "txt" }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-elevated ring-1 ring-panel-border">
      <FileText className={cn("size-4", kindTone[kind])} />
    </span>
  );
}

function DocumentStatus({ state }: { state: DocumentState }) {
  if (state === "ready") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
        <CheckCircle2 className="size-3" />
        Ready
      </span>
    );
  }

  if (state === "failed") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-400">
        <TriangleAlert className="size-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[10px] text-amber-400">
      <Clock3 className="size-3 animate-pulse" />
      Scanning
    </span>
  );
}

export function ProjectSidebar({
  documents,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  isLoading
}: ProjectSidebarProps) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return documents.filter((document) =>
      document.fileName.toLowerCase().includes(normalizedQuery),
    );
  }, [documents, query]);

  return (
    <aside className="panel-glass flex h-full w-72 md:w-80 shrink-0 flex-col overflow-hidden rounded-2xl border-surface-border border-r  select-none z-20 bg-surface-subtle ">
      <div className="no-scrollbar flex flex-col flex-1 min-h-0 overflow-y-auto p-3  ">
        {/**New Chat Button  */}
        <div className=" ">
          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-border text-zinc-100 font-medium text-sm transition-all duration-200 shadow-sm border border-surface-border/80 hover:border-zinc-500/40 active:scale-[0.99] group"
          >
            <PenSquare style={{ width: "16", height: "16" }} className="lucide lucide-pen-square w-4 h-4 text-accent-emerald transition-transform group-hover:rotate-6" />
            <span> New Chat </span>
            <span className="ml-auto text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 border border-zinc-700/60 rounded px-1.5 py-0.5">⌘N</span>
          </button></div>

        {/**Search Document Button */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            aria-label="Search documents"
            className="h-9 w-full  bg-surface-card border border-surface-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accent-emerald/60 focus:border-accent-emerald/60 transition-all font-sans"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono">⌘K</span>
        </div>
        <section className="mt-4">
          <h2 className="px-1 pb-2 text-[13px] font-semibold text-muted-foreground">
            Recents
          </h2>

          {isLoading ? (
            <DocumentSkeletonList />
          ) : items.length === 0 ? (
            <p className="px-2 py-6 text-xs text-muted-foreground">
              {query.trim() ? "No matching documents found." : "No documents uploaded yet."}
            </p>
          ) : (

            <div className=" overflow-hidden">
              <ul className="space-y-0.5">
                {items.map((document) => {
                  const state = getDocumentState(document);
                  const isReady = state === "ready";
                  const isActive = activeId === document.id;

                  return (
                    <li
                      key={document.id}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors",
                        isActive && isReady
                          ? "bg-state-active"
                          : isReady
                            ? "hover:bg-state-hover"
                            : "opacity-60",
                      )}
                    >
                      <button
                        type="button"
                        disabled={!isReady}
                        onClick={() => {
                          if (isReady) {
                            onSelect(document.id);
                          }
                        }}
                        aria-label={
                          isReady
                            ? `Open ${document.fileName}`
                            : `${document.fileName} is ${state}`
                        }
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none",
                          isReady
                            ? "cursor-pointer"
                            : "cursor-not-allowed",
                        )}
                      >
                        <ProjectIcon kind={kindFromMime(document.mimetype)} />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-foreground">
                            {document.fileName}
                          </span>

                          <span className="mt-0.5 flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(document.createdAt)}
                            </span>

                            <DocumentStatus state={state} />
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-label={`Delete ${document.fileName}`}
                        onClick={() => onDelete(document.id)}
                        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
      {/** Cloud-legacy-memory */}
      <div className="p-3.5 border-t border-surface-border bg-surface-subtle/90" data-purpose="storge-meter">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
          <span className="flex items-center gap-1 text-zinc-300"> <CloudSync style={{ width: "15", height: "15" }} className="text-orange-500" /> Cloud-storage</span>
          <span className="text-zinc-400 font-medium">3.5 / 10 MB</span>
        </div>
        <div className="w-full bg-surface-card h-1.5 rounded-full overflow-hidden border border-surface-border">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400"
            style={{ width: "36%" }} /></div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 font-mono">
          <span> 8 files indexed</span>
          <span className="text-accent-emerald hover:underline cursor-pointer">Manage</span>
        </div>
      </div>
    </aside>
  );
}
