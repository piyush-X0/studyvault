import { DEV_USER_ID, getDocumentForUser } from "@/lib/getDocument";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


//preserve current messages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {

        const { id } = await params;
        const { role, text } = await req.json();

        if (!role || !text) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const document = await getDocumentForUser(id, DEV_USER_ID, { id: true });
        if (!document) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const message = await prisma.messages.create({
            data: { documentId: id, role, text }
        });

        return NextResponse.json({ message });

    } catch (error) {
        console.error("Preserving messages failed : ", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
//delete current messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {

        const { id } = await params;
        const document = await getDocumentForUser(id, DEV_USER_ID, { id: true });

        if (!document) {
            return NextResponse.json({ error: "Not Found " }, { status: 404 });
        }

        const messages = await prisma.messages.findMany({
            where: { documentId: id },
            orderBy: { createdAt: "asc" },
            select: { id: true, role: true, text: true, createdAt: true }
        });

        return NextResponse.json({ messages });

    } catch (error) {
        console.error("message deletion failed : ", error)
        return NextResponse.json({ error: "Internal Server error" }, { status: 500 });
    }
}