import { useMemo, useState } from "react";
import { FileText, Search, Square, PenSquare } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatDate, kindFromMime, type StudyDocument } from "../../lib/studyvault-api";

interface ProjectSidebarProps {
  documents: StudyDocument[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

const kindTone: Record<"pdf" | "doc" | "txt", string> = {
  pdf: "text-file-pdf",
  doc: "text-file-doc",
  txt: "text-file-txt",
};

function ProjectIcon({ kind }: { kind: "pdf" | "doc" | "txt" }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-elevated ring-1 ring-panel-border">
      <FileText className={cn("size-4", kindTone[kind])} />
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

  const items = useMemo(
    () =>
      documents.filter((document) =>
        document.filename.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [documents, query],
  );

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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="h-9 w-full rounded-full border border-panel-border bg-composer/70 pl-9 pr-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
          />
        </div>

        {items.length === 0 ? (
          <p className="px-2 py-6 text-xs text-muted-foreground">No projects found.</p>
        ) : (
          <section className="mt-4">
            <h2 className="px-1 pb-2 text-[13px] font-semibold text-muted-foreground">
              Recents
            </h2>
            <ul className="space-y-0.5">
              {items.map((document) => (
                <li key={document.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(document.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                      activeId === document.id ? "bg-state-active" : "hover:bg-state-hover",
                    )}
                  >
                    <ProjectIcon kind={kindFromMime(document.mimetype)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-foreground">
                        {document.filename}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Square className="size-2" strokeWidth={1.5} />
                        {formatDate(document.createdAt)}
                      </span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Delete ${document.filename}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(document.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          onDelete(document.id);
                        }
                      }}
                      className="px-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      x
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
