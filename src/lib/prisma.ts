import { PrismaClient } from "@/generated/prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = global as typeof globalThis & { prisma?: PrismaClient }

const singletonPrisma = () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
    })
    pool.on("error", (err) => console.error("pg pool error:", err))
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? singletonPrisma()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma