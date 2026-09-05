import { z } from "zod";

export const messageBodyScehma = z.object({
    role: z.enum(["user", "assistant"]),
    text: z.string().min(1, "Message is required").max(10000, "Message too long"),
    fileName: z.string().max(200, "Filename too long").optional().nullable(),
});
export type messageBody = z.infer<typeof messageBodyScehma>;