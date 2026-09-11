"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu } from "@base-ui/react/menu";
import { LogOut } from "lucide-react";

function initials(name?: string | null, email?: string | null) {
    const value = name || email || "U";

    return value
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export function AccountMenu() {
    const { data: session } = useSession();
    const user = session?.user;

    if (!user) {
        return null;
    }

    const label = user.name || user.email || "Account";
    const avatarText = initials(user.name, user.email);

    return (
        <Menu.Root >
            <Menu.Trigger
                aria-label="Open account menu"
                className="  grid size-7  place-items-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-100 transition hover:border-neutral-500 hover:bg-neutral-700"
            >
                {user.image ? (
                    <img
                        src={user.image}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="size-full object-cover"
                    />
                ) : (
                    avatarText
                )}
            </Menu.Trigger>

            <Menu.Portal>
                <Menu.Positioner sideOffset={8} align="end">
                    <Menu.Popup className="z-50  w-65 overflow-hidden rounded-[13px]  border border-neutral-800 bg-neutral-900 p-1.5 shadow-xl shadow-black/40">
                        <div className="border-b border-neutral-800 px-3 py-2.5">
                            <p className="truncate text-sm font-medium text-neutral-100">
                                {label}
                            </p>

                            {user.email && (
                                <p className="mt-0.5 truncate text-xs text-neutral-400">
                                    {user.email}
                                </p>
                            )}
                        </div>

                        <Menu.Item
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 outline-none transition hover:bg-red-500/10 focus:bg-red-500/10"
                        >
                            <LogOut className="size-4" />
                            Sign out
                        </Menu.Item>
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
}