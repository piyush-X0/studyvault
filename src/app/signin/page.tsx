"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Database,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Cpu,
  Layers,
  FileCode2,
  Terminal,
  Server,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/chat" });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const pipelineSteps = [
    {
      step: "01",
      title: "Document Ingestion & Boundary Snapping",
      description:
        "Upload raw PDFs, DOCX, or text files to Cloudflare R2 storage. Text is parsed into clean streams while preserving heading anchors and logical paragraph boundaries.",
      badge: "Ingestion & Parse",
    },
    {
      step: "02",
      title: "Semantic Chunking & Gemini Vectorization",
      description:
        "Content is chunked into overlapping windows (~500 tokens). Chunks pass to Google Gemini's text-embedding engine producing 768-dimensional normalized dense vectors.",
      badge: "Vector Math",
    },
    {
      step: "03",
      title: "Neon Serverless & pgvector HNSW Indexing",
      description:
        "Embeddings are persisted in PostgreSQL with pgvector. An HNSW (Hierarchical Navigable Small World) index provides sub-50ms approximate nearest-neighbor retrieval.",
      badge: "Storage Engine",
    },
    {
      step: "04",
      title: "Augmented Context & Grounded Synthesis",
      description:
        "User prompts trigger cosine similarity search against chunks. The top-k matches construct a strictly grounded system prompt for hallucination-free generation.",
      badge: "Inference",
    },
  ];

  const techBadges = [
    { name: "Next.js 16 (Turbopack)", role: "Full-stack App Router" },
    { name: "TypeScript 5", role: "Type-Safe Pipeline" },
    { name: "PostgreSQL & pgvector", role: "Vector DB" },
    { name: "Prisma ORM", role: "Schema & Migrations" },
    { name: "Tailwind CSS v4", role: "Design System" },
    { name: "Framer Motion", role: "Fluid Physics" },
    { name: "Cloudflare R2", role: "Object Storage" },
    { name: "NextAuth.js v5", role: "Isolated Multi-Tenancy" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-neutral-100 selection:bg-neutral-800 selection:text-white">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-125 w-225 rounded-full bg-neutral-800/20 blur-[130px]" />
      </div>

      {/* TOP COMPACT NAV */}
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-neutral-800/80 bg-[#0A0A0A]/85 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight text-white text-sm">StudyVault</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 px-2.5 py-0.5 text-[11px] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RAG Pipeline Live
          </span>
        </div>
      </header>

      {/* SECTION 1: HERO + SIGN IN CARD */}
      <section className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col justify-center px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        {/* LEFT COLUMN: HERO CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-[#141414] px-3.5 py-1 text-xs font-medium text-neutral-300">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>Autonomous Document Reasoning Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Turn static papers into{" "}
            <span className="bg-linear-to-r from-neutral-200 via-neutral-400 to-neutral-600 bg-clip-text text-transparent">
              conversational context.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed">
            A production-ready RAG architecture built with strict TypeScript types, PostgreSQL vector indexing, and boundary-snapped semantic chunking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-lg">
            <div className="flex items-start gap-3 rounded-xl border border-neutral-800/80 bg-[#121212]/80 p-3.5 transition-all hover:border-neutral-700">
              <Database className="h-4 w-4 text-white shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">pgvector HNSW</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Sub-50ms cosine similarity indexing</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-neutral-800/80 bg-[#121212]/80 p-3.5 transition-all hover:border-neutral-700">
              <Cpu className="h-4 w-4 text-white shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">Boundary Snapping</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Lossless markdown sentence boundaries</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: INTERACTIVE SIGN IN CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10 lg:mt-0 flex w-full max-w-sm flex-col"
        >
          <div className="relative rounded-2xl border border-neutral-800 bg-[#111111]/90 p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-neutral-700">
            {/* Top ambient badge */}
            <div className="mb-6 space-y-1.5 text-center">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Enter Workspace
              </h2>
              <p className="text-xs text-neutral-400">
                Sign in with Google to query your indexed vault.
              </p>
            </div>

            {/* Google Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg transition-all hover:bg-neutral-200 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
              ) : (
                <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoading ? "Connecting session..." : "Continue with Google"}</span>
            </motion.button>

            {/* Tenancy & Security note */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500">
              <Lock className="h-3 w-3 text-neutral-400" />
              <span>Session isolation via encrypted OAuth tokens</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: ARCHITECTURE PIPELINE BREAKDOWN */}
      <section className="relative border-t border-neutral-800/80 bg-[#0E0E0E]/90 py-20 px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
              Pipeline Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              How the TypeScript RAG engine works
            </h2>
            <p className="text-sm text-neutral-400">
              Every document undergoes end-to-end processing with deterministic state checkpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineSteps.map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-neutral-800 bg-[#141414] p-5 transition-all duration-300 hover:border-neutral-600 hover:bg-[#181818]"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-neutral-500 group-hover:text-white transition-colors">
                    {item.step}
                  </span>
                  <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: TECHNICAL STACK SHOWCASE */}
      <section className="border-t border-neutral-800/80 py-16 px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
              Technology Stack
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Engineered with modern full-stack primitives
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {techBadges.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-neutral-800/80 bg-[#121212] p-3.5 transition-colors hover:border-neutral-700"
              >
                <p className="text-xs font-semibold text-white truncate">{t.name}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: DEEP DIVE FOOTER (PORTFOLIO SPECIFICATION) */}
      <footer className="border-t border-neutral-800/80 bg-[#080808] py-14 px-6 text-xs text-neutral-400">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-black">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-white text-sm">StudyVault</span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              A high-precision document search application combining dense vector embeddings with strict tenant isolation for mission-critical documents.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold uppercase tracking-wider text-neutral-300 text-[11px]">
              Retrieval Specifications
            </p>
            <ul className="space-y-1.5 text-[11px] text-neutral-400">
              <li>• Cosine distance metric ({'<=>'} ) via pgvector</li>
              <li>• HNSW parameters: `m=16`, `ef_construction=64`</li>
              <li>• Overlap buffer: 10% token carryover</li>
              <li>• S3-compatible pre-signed upload channels</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold uppercase tracking-wider text-neutral-300 text-[11px]">
              Production Design
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Designed as a portfolio RAG reference implementation. Demonstrates custom vector indexing pipelines without high-level black-box wrappers, providing full control over tokenization, chunk boundaries, and retrieval latency.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-10 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <span>StudyVault RAG Pipeline • Portfolio Showcase</span>
          <span>Next.js 16 • PostgreSQL • Prisma • Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}
