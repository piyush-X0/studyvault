import { z } from "zod";

export const uploadBodySchema = z.object({
    filename: z.string().min(1, "filename is required").max(200, "filename too long")
        .refine((name) => !name.includes("/") && !name.includes("\\") && !name.includes(".."),
            "Invalid Username"),
    contentType: z.enum([
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]),
    size: z.number().int().positive("Size must be positive ").max(3 * 1024 * 1024, "File too large, Maximum size is 3MB")
});

export type UploadBody = z.infer<typeof uploadBodySchema>;