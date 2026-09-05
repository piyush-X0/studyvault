import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignIn() {
    const session = await auth();
    if (session) redirect("/");

    return (
        <main className="flex h-full items-center justify-center">
            <form
                action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/" });
                }}
            >
                <button type="submit" className="rounded-md border px-4 py-2">
                    Continue with Google
                </button>
            </form>
        </main>
    );
}