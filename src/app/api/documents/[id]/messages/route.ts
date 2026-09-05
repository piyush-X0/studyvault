import { getDocumentForUser } from "@/lib/getDocument";
import { prisma } from "@/lib/prisma";
import { messageBodyScehma } from "@/lib/schemas/messages";
import { parseJsonBody } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";


//preserve current messages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { id } = await params;

        const raw = await req.json();
        const { role, text, fileName } = parseJsonBody(raw, messageBodyScehma);

        if (!role || !text) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const document = await getDocumentForUser(id, session.user.id, { id: true });
        if (!document) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const message = await prisma.messages.create({
            data: { documentId: id, role, text, fileName }
        });

        return NextResponse.json({ message });

    } catch (error) {
        if (error instanceof Error && (error as any).issues) {
            return NextResponse.json({ error: "Invalid request Body", details: (error as any).issues }, { status: 400 });
        }
        console.error("Preserving messages failed : ", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
//delete current messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {

        const { id } = await params;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const document = await getDocumentForUser(id, session.user.id, { id: true });

        if (!document) {
            return NextResponse.json({ error: "Not Found " }, { status: 404 });
        }

        const messages = await prisma.messages.findMany({
            where: { documentId: id },
            orderBy: { createdAt: "asc" },
            select: { id: true, role: true, text: true, fileName: true, createdAt: true }
        });

        return NextResponse.json({ messages });

    } catch (error) {
        console.error("message deletion failed : ", error)
        return NextResponse.json({ error: "Internal Server error" }, { status: 500 });
    }
}