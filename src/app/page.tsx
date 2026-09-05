// src/app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WelcomePage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/chat");
  }

  return (
    <main className="relative flex h-full items-center justify-center overflow-hidden bg-neutral-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[64px_64px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-100 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500">
          Retrieval-Augmented Chat
        </p>

        <h1
          className="mt-4 text-6xl text-neutral-50"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          DataFolio
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
          Upload your PDFs and notes, then ask questions — answers are
          retrieved from{" "}
          <span className="text-neutral-200">your own documents</span>.
        </p>

        <div className="mt-8 flex items-center gap-2 font-mono text-[11px] text-neutral-600">
          <span className="rounded border border-neutral-800 px-2 py-1">
            upload
          </span>
          <span>→</span>
          <span className="rounded border border-neutral-800 px-2 py-1">
            chunk
          </span>
          <span>→</span>
          <span className="rounded border border-neutral-800 px-2 py-1">
            embed
          </span>
          <span>→</span>
          <span className="rounded border border-neutral-800 px-2 py-1">
            retrieve
          </span>
        </div>

        <Link
          href="/signin"
          className="mt-10 inline-flex h-11 items-center justify-center rounded-md bg-neutral-50 px-8 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
        >
          Get started
        </Link>

        <p className="mt-4 text-xs text-neutral-600">
          Sign in with Google — no passwords to remember.
        </p>
      </div>
    </main>
  );
}