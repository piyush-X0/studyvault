import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

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

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500">
          Retrieval-Augmented Chat
        </p>

        <h1
          className="mt-4 text-6xl text-neutral-50"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Datafolio
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
          Upload notes and documents, then ask questions grounded in your own
          content.
        </p>

        <form
          className="mt-10"
          action={async () => {
            "use server";

            await signIn("google", {
              redirectTo: "/chat",
            });
          }}
        >
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-3 rounded-md bg-neutral-50 px-8 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Continue with Google
          </button>
        </form>

        <p className="mt-4 text-xs text-neutral-600">
          Secure Google sign-in · no password required
        </p>
      </div>
    </main>
  );
}