import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = global as typeof globalThis & { prisma?: PrismaClient }

const singletonPrisma = () => {
    const adapter = new PrismaNeon({
        connectionString: process.env.DATABASE_URL,
    })

    return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? singletonPrisma()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma