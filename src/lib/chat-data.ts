export type ProjectKind = "pdf" | "doc" | "txt" | "board";

export interface Project {
    id: string;
    title: string;
    date: string;
    kind: ProjectKind;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    fileName?: string;
}

export const projects: Project[] = [
    {
        id: "p1",
        title: "Software Defined Virtual Network",
        date: "Aug 19, 2026",
        kind: "pdf",
    },
    {
        id: "p2",
        title: "Project SDBDN Framework",
        date: "Aug 19, 2026",
        kind: "pdf",
    },
    {
        id: "p3",
        title: "chapter-2 Database System",
        date: "Aug 19, 2026",
        kind: "doc",
    },
    {
        id: "p4",
        title: "RAG Pipeline",
        date: "Aug 19, 2026",
        kind: "txt",
    },
];

export const initialMessages: ChatMessage[] = [
    {
        id: "m1",
        role: "user",
        text: "explain me about the whole summary this pdf carries.",
        fileName: "dummy-5-pages.pdf",
    },
    {
        id: "m2",
        role: "assistant",
        text: [
            "The provided document outlines the product requirements, engineering architecture, and development blueprint for AI Workspace, an AI-first personal knowledge management SaaS platform. The primary goal of this project is to build a production-grade, backend-heavy showcase application rather than clone existing standard text editors",
            "",
            "**Core Philosophy: AI-First Infrastructure**",
            "",
            "Every text file, document, or drawing acts as an intelligent data source for the AI system. **Knowledge Over Formatting:**",
            "",
            "Built-in rich text editors and sketching canvases exist primarily to feed organized context to the core AI engine. **Universal Parsing:**",
            "",
            "The platform extracts intelligence seamlessly across diverse formats including PDFs, DOCX, Markdown, standard text files, and hand-drawn architecture wireframes.",
        ].join("\n"),
    },
];
