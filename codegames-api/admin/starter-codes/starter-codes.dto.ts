import { z } from "zod";
import { Language } from "@prisma/client";

const LANGUAGES = Object.values(Language) as [string, ...string[]];

export const BulkAddStarterCodesSchema = z
	.array(
		z.object({
			language: z.enum(LANGUAGES),
			code: z.string(),
		}),
	)
	.min(1, "At least one starter code is required");

export type BulkAddStarterCodesInput = z.infer<typeof BulkAddStarterCodesSchema>;
