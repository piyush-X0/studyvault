import { prisma } from "./prisma";


export const DEV_USER_ID = "dev-user-id";

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