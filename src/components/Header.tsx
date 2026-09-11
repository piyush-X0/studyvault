"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { AccountMenu } from "./ui/AccountMenu";
import { useSession } from "next-auth/react";

interface HeaderProps {
    onToggleMobileSidebar?: () => void;
    isScrolled?: boolean;
}

export default function Header({ onToggleMobileSidebar, isScrolled = false }: HeaderProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const isExcluded = pathname === "/signin" || pathname === "/signup";
    if (isExcluded) return null;

    return (
        <header
            className={`relative w-full shrink-0 border-b transition-all duration-200 bg-[#0A0A0A]/95 backdrop-blur-md ${isScrolled
                ? "border-neutral-800 shadow-md shadow-black/60"
                : "border-neutral-800/80"
                }`}
        >
            <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    {onToggleMobileSidebar && (
                        <button
                            type="button"
                            onClick={onToggleMobileSidebar}
                            aria-label="Toggle navigation menu"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-[#141414] text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    )}

                    <Link href="/" className="group flex items-center gap-2.5 transition-opacity hover:opacity-90">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black shadow-sm">
                            <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
                        </div>
                        <span className="font-semibold tracking-tight text-white text-base">
                            StudyVault
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    {session && (
                        <span className="hidden text-xs text-neutral-400 sm:inline-block">
                            {session.user?.email}
                        </span>
                    )}
                    <AccountMenu />
                </div>
            </div>
        </header>
    );
}
