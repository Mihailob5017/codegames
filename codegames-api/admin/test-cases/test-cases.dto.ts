import { z } from "zod";

export const BulkAddTestCasesSchema = z
	.array(
		z.object({
			input: z.string(),
			expectedOutput: z.string(),
			isSample: z.boolean().default(false),
		}),
	)
	.min(1, "At least one test case is required");

export type BulkAddTestCasesInput = z.infer<typeof BulkAddTestCasesSchema>;
