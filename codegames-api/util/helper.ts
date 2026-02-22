import { z } from "zod";

export const validateInput = (
	schema: z.ZodSchema,
	input: Record<string, any>,
): boolean => {
	try {
		schema.parse(input);
		return true;
	} catch (error) {
		console.error("Validation error:", error);
		return false;
	}
};
