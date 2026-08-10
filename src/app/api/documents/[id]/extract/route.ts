import { extractText } from "@/lib/extract";
import { getFileBuffer } from "@/lib/getfilebuffer";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const document = await prisma.document.findUnique({
            where: { id },
            select: { id: true, mimetype: true, r2Key: true, uploadedStatus: true, extractedStatus: true }
        });

        if (!document) {
            return NextResponse.json({ error: "DOCUMENT NOT FOUND" }, { status: 400 });
        }
        if (document.extractedStatus === "PROCESSING") {
            return NextResponse.json({ error: "Extraction already in progress" }, { status: 409 });
        }
        if (document.extractedStatus == "EXTRACTED") {
            return NextResponse.json({ error: "ALREADY EXTRACTED" }, { status: 200 });
        }

        await prisma.document.update({
            where: { id },
            data: { extractedStatus: "PROCESSING", extractionError: null }
        });

        try {
            const buffer = await getFileBuffer(document.r2Key);
            const text = await extractText(buffer, document.mimetype);

            const updated = await prisma.document.update({
                where: { id },
                data: { extractedStatus: "EXTRACTED", extractedText: text, extractionError: null }
            });
            return NextResponse.json({ status: updated.extractedStatus, textlength: text.length });

        } catch (extractError) {
            const message = extractError instanceof Error ? extractError.message : "Unknown Extraction Error";

            await prisma.document.update({
                where: { id },
                data: { extractedStatus: "FAILED", extractionError: message }
            });
            console.log("extraction failed : ", { documentID: id, error: message });
            return NextResponse.json({ error: "EXTRACTION FAILED", detail: message }, { status: 422 });
        }
    }
    catch (er) {
        console.log("POST api/documents/[id]/extract : ", er);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}