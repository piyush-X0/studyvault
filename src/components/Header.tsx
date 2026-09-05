import { auth, signOut } from "@/auth";
import Link from "next/link";

export async function Header() {
    const session = await auth();

    return (
        <header className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-6">
            <Link href="/" className="font-display text-xl text-neutral-100">
                Datafolio
            </Link>

            {session?.user?.id ? (
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-neutral-400 sm:block">
                        {session.user.email}
                    </span>

                    <form
                        action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/" });
                        }}
                    >
                        <button
                            type="submit"
                            className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
                        >
                            Sign out
                        </button>
                    </form>
                </div>
            ) : (
                <Link
                    href="/signin"
                    className="text-sm text-neutral-300 transition-colors hover:text-white"
                >
                    Sign in
                </Link>
            )}
        </header>
    );
}