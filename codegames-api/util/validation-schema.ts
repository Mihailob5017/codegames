import { z } from "zod";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
const CATEGORIES = [
	"ARRAYS",
	"STRINGS",
	"HASHMAPS",
	"TWO_POINTERS",
	"STACKS",
	"BINARY_SEARCH",
	"SLIDING_WINDOW",
	"LINKED_LISTS",
	"TREES",
	"TRIES",
	"BACKTRACKING",
	"HEAPS",
	"GRAPHS",
	"DYNAMIC_PROGRAMMING",
	"INTERVALS",
	"GREEDY",
	"MATH",
	"MISC",
] as const;

export const ProblemQuerySchema = z.object({
	difficulty: z.enum(DIFFICULTIES).optional(),
	isPublished: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
	categories: z
		.string()
		.transform((v) => v.split(",").filter(Boolean))
		.pipe(z.array(z.enum(CATEGORIES)))
		.optional(),
	search: z.string().optional(),
});

export type ProblemQueryFilters = z.infer<typeof ProblemQuerySchema>;

export const CodeExecutionSchema = z.object({
	code: z.string().min(1, "Code cannot be empty"),
	problemId: z.string().min(1, "Problem ID is required"),
	language: z.enum(["JAVASCRIPT", "PYTHON", "JAVA", "CSHARP", "CPP"], {
		message:
			"Invalid language. Must be one of: JAVASCRIPT, PYTHON, JAVA, CSHARP, CPP",
	}),
});

export type CodeExecutionInput = z.infer<typeof CodeExecutionSchema>;

const LANGUAGES = ["PYTHON", "JAVASCRIPT", "JAVA", "CSHARP", "CPP"] as const;

export const CreateProblemSchema = z.object({
	title: z.string().min(1),
	slug: z.string().min(1),
	description: z.string().min(1),
	examples: z.array(z.string()).default([]),
	constrains: z.string().min(1),
	hints: z.array(z.string()).default([]),
	difficulty: z.enum(DIFFICULTIES),
	categories: z.array(z.enum(CATEGORIES)).default([]),
	solution: z.string().min(1),
	explanation: z.string().min(1),
	isPublished: z.boolean().default(false),
	testCases: z
		.array(
			z.object({
				input: z.string(),
				expectedOutput: z.string(),
				isSample: z.boolean().default(false),
			}),
		)
		.default([]),
	starterCodes: z
		.array(
			z.object({
				language: z.enum(LANGUAGES),
				code: z.string(),
			}),
		)
		.default([]),
});

export type CreateProblemInput = z.infer<typeof CreateProblemSchema>;

export const BulkAddTestCasesSchema = z.array(
	z.object({
		input: z.string(),
		expectedOutput: z.string(),
		isSample: z.boolean().default(false),
	}),
).min(1, "At least one test case is required");

export type BulkAddTestCasesInput = z.infer<typeof BulkAddTestCasesSchema>;

export const BulkAddStarterCodesSchema = z.array(
	z.object({
		language: z.enum(LANGUAGES),
		code: z.string(),
	}),
).min(1, "At least one starter code is required");

export type BulkAddStarterCodesInput = z.infer<typeof BulkAddStarterCodesSchema>;
