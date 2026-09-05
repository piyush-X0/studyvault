// src/app/signin/page.tsx
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage() {
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

            <div className="relative z-10 w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur">
                <div className="text-center">
                    <h1
                        className="text-3xl text-neutral-50"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                        Welcome back
                    </h1>

                    <p className="mt-2 text-sm text-neutral-400">
                        Sign in to chat with your documents.
                    </p>
                </div>

                <form
                    className="mt-8"
                    action={async () => {
                        "use server";
                        await signIn("google", {
                            redirectTo: "/chat",
                        });
                    }}
                >
                    <button
                        type="submit"
                        className="flex h-11 w-full items-center justify-center gap-3 rounded-md bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                            <path d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
                        </svg>

                        Continue with Google
                    </button>
                </form>

                <p className="mt-6 text-center font-mono text-[11px] text-neutral-600">
                    Encrypted session · 7-day expiry
                </p>
            </div>
        </main>
    );
}