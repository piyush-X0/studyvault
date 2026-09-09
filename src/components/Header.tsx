import { auth } from "@/auth";
import { AccountMenu } from "./ui/AccountMenu";
import { Layers3, CpuIcon, CloudCheck } from "lucide-react";


export async function Header() {
    const session = await auth();

    return (

        <header className="h-14 border-b border-surface-border bg-surface-subtle/80 px-5 flex items-center justify-between shrink-0  select-none">
            <div className="flex items-center gap-4">
                {/**logo-Branding */}
                <div className="flex items-center gap-2 group cursor-pointer">
                    <span className="font-serif text-2xl tracking-normal text-zinc-100 italic transition-transform group-hover:scale-105 duration-200">
                        Datafolio
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-emerald pulse-indicator"></span>
                </div>
                {/**Workspace-benchMark */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-card border border-surface-border text-xs text-zinc-400 font-mono">
                    <Layers3 className="w-3 h-3" />
                    <span>workspace/rag-vault-01</span>
                </div>

            </div>
            <div className=" hidden md:flex items-center gap-3 px-3.5 py-1 rounded-full bg-surface-card/90 border border-surface-border text-[11px] font-mono text-zinc-400 shadow-inn-aller hover:text-zinc-300 transition-all duration-300">
                <CpuIcon className="w-3 h-3 text-purple-900 " />
                <span>   pgvector  1536d</span>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1 text-emerald-400/90"> <CloudCheck style={{ width: "12", height: "12" }} /> R2 Connected</span>
            </div>

            {/**user account-avatar */}
            <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full bg-surface-card hover:bg-surface-elevated border border-surface-border cursor-pointer transition-all duration-200">
                <span className="text-xs font-mono text-zinc-300 hidden sm:inline pl-1">
                    free-tier</span>
                <div className="">
                    <div><AccountMenu />
                    </div>
                </div>
            </div>
        </header >
    );
}