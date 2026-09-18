import { streamAnswer } from "@/lib/answers";
import { getAiErrorMessage } from "@/lib/ai-errors";
import { generateEmbeddings } from "@/lib/embedding";
import { getDocumentForUser } from "@/lib/getDocument";
import { queryBodySchema } from "@/lib/schemas/query";
import { findRelevantChunks } from "@/lib/search";
import { parseJsonBody } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const raw = await req.json();
        const { question } = parseJsonBody(raw, queryBodySchema);

        const document = await getDocumentForUser(id, session.user.id, {
            embeddingStatus: true
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }
        if (document.embeddingStatus !== "EMBEDDED") {
            return NextResponse.json({ error: "Document is not ready for query yet" }, { status: 409 });
        }
        const MAX_CHATS_PER_DOCUMENT = 2;
        const chatCount = await prisma.messages.count({
            where: { documentId: id, role: "user" },
        });
        if (chatCount >= MAX_CHATS_PER_DOCUMENT) {
            return NextResponse.json(
                { error: "You've reached the chat limit for this file (max 2 questions).", code: "CHAT_LIMIT_REACHED" },
                { status: 403 },
            );
        }
        const [questionvector] = await generateEmbeddings([question]);
        const relevantChunks = await findRelevantChunks(id, questionvector, 5);

        const encoder = new TextEncoder();
        let clientDisconnected = false;

        const stream = new ReadableStream({
            async start(controller) {
                const safeEnqueue = (text: string) => {
                    if (clientDisconnected) {
                        return;
                    }
                    try {
                        controller.enqueue(encoder.encode(text));
                    } catch (error) {
                        clientDisconnected = true;
                    }
                };

                try {
                    await streamAnswer(
                        question,
                        relevantChunks.map((chunk) => chunk.content),
                        safeEnqueue,
                    );
                } catch (error) {
                    if (!clientDisconnected) {
                        console.error("AI answer generation failed:", error);
                        const safeMessage = getAiErrorMessage(error);
                        safeEnqueue(safeMessage);
                    }
                } finally {
                    if (!clientDisconnected) {
                        try {
                            controller.close();
                        } catch (error) {
                        }
                    }
                }
            },
            cancel() {
                clientDisconnected = true;
            },
        });
        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            }
        });

    } catch (error) {
        if (error instanceof Error && (error as any).issues) {
            return NextResponse.json({
                error: "Internal request body", details: (error as any).issues
            },
                { status: 400 });
        }
        console.error("Query failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}