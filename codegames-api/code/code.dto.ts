import { z } from "zod";
import { Language } from "@prisma/client";

const LANGUAGES = Object.values(Language) as [string, ...string[]];

export const CodeExecutionSchema = z.object({
	code: z.string().min(1, "Code cannot be empty"),
	problemId: z.string().min(1, "Problem ID is required"),
	language: z.enum(LANGUAGES, {
		message: `Invalid language. Must be one of: ${LANGUAGES.join(", ")}`,
	}),
});

export type CodeExecutionInput = z.infer<typeof CodeExecutionSchema>;
