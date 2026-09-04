import { z } from "zod";

export function parseJsonBody<T>(body: unknown, schema: z.ZodSchema<T>): T {
    const result = schema.safeParse(body);

    if (!result.success) {
        const error = new Error("Invalid request body");
        (error as any).issues = result.error.issues;
        throw error;
    }
    return result.data;
}