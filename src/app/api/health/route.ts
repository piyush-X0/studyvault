import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ status: "ok", timeStamp: new Date().toISOString() });
    } catch (error) {
        console.error("Health check failed : ", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}