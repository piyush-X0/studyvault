import { auth } from "@/auth";
import ClientChat from "@/components/chat/ClientChat";
import { redirect } from "next/navigation";

export default async function ChatPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/signin")
    }
    return <ClientChat />;
}