import { z } from "zod";
import {
	problem_difficulty,
	problem_category,
	Language,
} from "@prisma/client";

const DIFFICULTIES = Object.values(problem_difficulty) as [string, ...string[]];
const CATEGORIES = Object.values(problem_category) as [string, ...string[]];
const LANGUAGES = Object.values(Language) as [string, ...string[]];

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
	language: z.enum(LANGUAGES, {
		message: `Invalid language. Must be one of: ${LANGUAGES.join(", ")}`,
	}),
});

export type CodeExecutionInput = z.infer<typeof CodeExecutionSchema>;

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

export const BulkAddStarterCodesSchema = z
	.array(
		z.object({
			language: z.enum(LANGUAGES),
			code: z.string(),
		}),
	)
	.min(1, "At least one starter code is required");

export type BulkAddStarterCodesInput = z.infer<
	typeof BulkAddStarterCodesSchema
>;

export const createUserSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.email("Invalid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(/[@$!%*?&]/, "Password must contain at least one special character"),
});
