import { z } from "zod";
import { problem_difficulty, problem_category, Language } from "@prisma/client";

const DIFFICULTIES = Object.values(problem_difficulty) as [problem_difficulty, ...problem_difficulty[]];
const CATEGORIES = Object.values(problem_category) as [problem_category, ...problem_category[]];
const LANGUAGES = Object.values(Language) as [Language, ...Language[]];

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

export const UpdateProblemSchema = z
	.object({
		title: z.string().min(1).optional(),
		slug: z.string().min(1).optional(),
		description: z.string().min(1).optional(),
		examples: z.array(z.string()).optional(),
		constrains: z.string().min(1).optional(),
		hints: z.array(z.string()).optional(),
		difficulty: z.enum(DIFFICULTIES).optional(),
		categories: z.array(z.enum(CATEGORIES)).optional(),
		solution: z.string().min(1).optional(),
		explanation: z.string().min(1).optional(),
		isPublished: z.boolean().optional(),
		testCases: z
			.array(
				z.object({
					input: z.string(),
					expectedOutput: z.string(),
					isSample: z.boolean().default(false),
				}),
			)
			.optional(),
		starterCodes: z
			.array(
				z.object({
					language: z.enum(LANGUAGES),
					code: z.string(),
				}),
			)
			.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	});

export type UpdateProblemInput = z.infer<typeof UpdateProblemSchema>;
