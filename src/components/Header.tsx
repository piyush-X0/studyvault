import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
    const session = await auth();

    return (
        <header className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
            <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight">
                    StudyVault
                </span>
            </div>

            <div className="flex items-center gap-4">
                {session?.user ? (
                    <>
                        <div className="flex items-center gap-3">
                            {session.user.image && (
                                <img
                                    src={session.user.image}
                                    alt="Profile"
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            )}
                            <div className="hidden text-sm sm:block">
                                <p className="font-medium">{session.user.name}</p>
                                <p className="text-muted-foreground text-xs">
                                    {session.user.email}
                                </p>
                            </div>
                        </div>

                        <form
                            action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/" });
                            }}
                        >
                            <Button type="submit" variant="outline" size="sm">
                                Sign out
                            </Button>
                        </form>
                    </>
                ) : (
                    <a
                        href="/api/auth/signin"
                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Sign in
                    </a>
                )}
            </div>
        </header>
    );
}
