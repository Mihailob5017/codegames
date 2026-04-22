import { z } from "zod";

export const TestCaseSchema = z.object({
	input: z.string().min(1, "Input is required"),
	expectedOutput: z.string().min(1, "Expected output is required"),
	isSample: z.boolean().default(false),
});

export const BulkAddTestCasesSchema = z
	.array(TestCaseSchema)
	.min(1, "At least one test case is required");

export type TestCaseInput = z.infer<typeof TestCaseSchema>;
export type BulkAddTestCasesInput = z.infer<typeof BulkAddTestCasesSchema>;
