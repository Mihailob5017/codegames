import { z } from "zod";
import { Language } from "@prisma/client";

const LANGUAGES = Object.values(Language) as [Language, ...Language[]];

export const StarterCodeSchema = z.object({
	language: z.enum(LANGUAGES),
	code: z.string().min(1, "Code is required"),
});

export const BulkAddStarterCodesSchema = z
	.array(StarterCodeSchema)
	.min(1, "At least one starter code is required");

export type StarterCodeInput = z.infer<typeof StarterCodeSchema>;
export type BulkAddStarterCodesInput = z.infer<
	typeof BulkAddStarterCodesSchema
>;
