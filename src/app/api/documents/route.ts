// src/app/api/documents/route.ts
export const runtime = "nodejs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }

    const documents = await prisma.document.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            fileName: true,
            size: true,
            mimetype: true,
            createdAt: true,
            uploadedStatus: true,
            extractedStatus: true,
            embeddingStatus: true,
        },
    });

    return NextResponse.json({ documents });
}