import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalforPrisma = global as typeof globalThis & { prisma?: PrismaClient };

const singletonPrisma = () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalforPrisma.prisma || singletonPrisma();
if (process.env.NODE_ENV !== "production") globalforPrisma.prisma = prisma;