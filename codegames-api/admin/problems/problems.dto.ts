import { z } from "zod";
import { problem_difficulty, problem_category, Language } from "@prisma/client";

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
