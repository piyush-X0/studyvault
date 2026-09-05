// src/app/chat/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DataFolioChat } from "@/components/DataFolio";

export default async function ChatPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/signin");
    }

    return <DataFolioChat />;
}