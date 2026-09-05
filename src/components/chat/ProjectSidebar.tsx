
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  Trash2,
  TriangleAlert,
  PenSquare,
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
      Processing
    </span>
  );
}

export function ProjectSidebar({
  documents,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
}: ProjectSidebarProps) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return documents.filter((document) =>
      document.fileName.toLowerCase().includes(normalizedQuery),
    );
  }, [documents, query]);

  return (
    <aside className="panel-glass flex h-full w-76 shrink-0 flex-col overflow-hidden rounded-2xl">
      <div className="no-scrollbar flex-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-state-active py-2 text-[13px] font-semibold text-accent-foreground ring-1 ring-panel-border transition-colors hover:bg-state-hover"
        >
          <PenSquare className="size-3.5" />
          New Chat
        </button>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            aria-label="Search documents"
            className="h-9 w-full rounded-full border border-panel-border bg-composer/70 pl-9 pr-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
          />
        </div>

        {items.length === 0 ? (
          <p className="px-2 py-6 text-xs text-muted-foreground">
            {query.trim()
              ? "No matching documents found."
              : "No documents uploaded yet."}
          </p>
        ) : (
          <section className="mt-4">
            <h2 className="px-1 pb-2 text-[13px] font-semibold text-muted-foreground">
              Recents
            </h2>

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
          </section>
        )}
      </div>
    </aside>
  );
}