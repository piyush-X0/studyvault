
import { z } from "zod";

export const queryBodySchema = z.object({
    question: z.string().min(1, "Question is required").max(2000, "Question is too long")
});

export type queryBody = z.infer<typeof queryBodySchema>;