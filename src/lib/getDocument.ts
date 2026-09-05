import { prisma } from "./prisma";
import { auth } from "@/auth";

export async function requireUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) throw new Response("Unauthorized", { status: 401 });
    return session.user.id;
}

export async function getDocumentForUser(
    documentId: string,
    userId: string,
    select?: Record<string, boolean>
) {
    const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
        ...select ? { select } : {}
    });
    return document;
}