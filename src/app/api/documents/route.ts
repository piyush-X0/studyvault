import { DEV_USER_ID } from "@/lib/getDocument";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {

        const documents = await prisma.document.findMany({
            where: { userId: DEV_USER_ID },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                filename: true,
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