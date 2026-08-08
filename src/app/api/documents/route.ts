import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {

        const documents = await prisma.document.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true, filename: true, size: true, mimetype: true, createdAt: true
            }
        });
        return NextResponse.json({ documents });
    }
    catch (error) {
        console.log("GET [api/documents] : ", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}