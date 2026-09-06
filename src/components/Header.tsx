import { auth, signOut } from "@/auth";
import Link from "next/link";
import { AccountMenu } from "./ui/AccountMenu";

export async function Header() {
    const session = await auth();

    return (

        <header className="flex shrink-0 items-center justify-between px-6 pt-5 pb-1">
            <Link href="/" className="font-display text-2xl tracking-wider text-neutral-100">
                Datafolio
            </Link>

            <AccountMenu />
        </header>
    );
}