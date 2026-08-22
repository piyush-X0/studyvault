import { streamAnswer } from "@/lib/answers";
import { generateEmbeddings } from "@/lib/embedding";
import { getDocumentForUser, DEV_USER_ID } from "@/lib/getDocument";
import { findRelevantChunks } from "@/lib/search";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const question: string = body.question;

        if (!question || !question.trim()) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        const document = await getDocumentForUser(id, DEV_USER_ID, {
            embeddingStatus: true
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }
        if (document.embeddingStatus !== "EMBEDDED") {
            return NextResponse.json({ error: "Document is not ready for query yet" }, { status: 409 });
        }

        const [questionvector] = await generateEmbeddings([question]);
        const relevantChunks = await findRelevantChunks(id, questionvector, 5);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                await streamAnswer(
                    question,
                    relevantChunks.map((c) => c.content),
                    (text) => {
                        controller.enqueue(encoder.encode(text));
                    }
                );
                controller.close();
            }
        });
        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            }
        });

    } catch (error) {
        console.error("query failed : ", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}