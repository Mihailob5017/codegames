import { z } from "zod";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
const CATEGORIES = [
	"ARRAYS", "STRINGS", "HASHMAPS", "TWO_POINTERS", "STACKS",
	"BINARY_SEARCH", "SLIDING_WINDOW", "LINKED_LISTS", "TREES", "TRIES",
	"BACKTRACKING", "HEAPS", "GRAPHS", "DYNAMIC_PROGRAMMING", "INTERVALS",
	"GREEDY", "MATH", "MISC",
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
