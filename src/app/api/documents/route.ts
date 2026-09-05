import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const documents = await prisma.document.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fileName: true,
                size: true,
                mimetype: true,
                createdAt: true,
                uploadedStatus: true,
                extractedStatus: true,
                embeddingStatus: true
            }
        });
        return NextResponse.json({ documents });
    }
    catch (error) {
        console.error("Document fetching failed : ", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}