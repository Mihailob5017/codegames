import prisma from "../infrastructure/prisma";
import { Language, Prisma } from "@prisma/client";
import { ProblemQueryFilters } from "../util/validation-schema";

const PROBLEM_LIST_SELECT = {
	id: true,
	number: true,
	title: true,
	slug: true,
	difficulty: true,
	categories: true,
	isPublished: true,
	totalSubmissions: true,
	acceptedSubmissions: true,
	acceptanceRate: true,
	createdAt: true,
} satisfies Prisma.ProblemSelect;

class AdminRepository {
	getAllProblems() {
		return prisma.problem.findMany({
			select: PROBLEM_LIST_SELECT,
			orderBy: { number: "asc" },
		});
	}

	queryProblems(filters: ProblemQueryFilters) {
		return prisma.problem.findMany({
			where: {
				...(filters.difficulty && { difficulty: filters.difficulty }),
				...(filters.isPublished !== undefined && {
					isPublished: filters.isPublished,
				}),
				...(filters.categories?.length && {
					categories: { hasSome: filters.categories },
				}),
				...(filters.search && {
					OR: [
						{ title: { contains: filters.search, mode: "insensitive" } },
						{ slug: { contains: filters.search, mode: "insensitive" } },
					],
				}),
			},
			select: PROBLEM_LIST_SELECT,
			orderBy: { number: "asc" },
		});
	}

	getProblemById(id: string) {
		return prisma.problem.findUnique({
			where: { id },
			include: { TestCases: true },
		});
	}

	createProblem(data: Prisma.ProblemCreateInput) {
		return prisma.problem.create({
			data,
			include: { TestCases: true, StarterCodes: true },
		});
	}

	updateProblem(id: string, data: Prisma.ProblemUpdateInput) {
		return prisma.problem.update({ where: { id }, data });
	}

	deleteProblem(id: string) {
		return prisma.problem.delete({ where: { id } });
	}

	getTestCasesByProblemId(problemId: string) {
		return prisma.testCase.findMany({ where: { problemId } });
	}

	addTestCaseToProblem(
		problemId: string,
		data: { input: string; expectedOutput: string; isSample?: boolean },
	) {
		return prisma.testCase.create({
			data: {
				input: data.input,
				expectedOutput: data.expectedOutput,
				isSample: data.isSample ?? false,
				problem: { connect: { id: problemId } },
			},
		});
	}

	bulkAddTestCasesToProblem(
		problemId: string,
		data: { input: string; expectedOutput: string; isSample?: boolean }[],
	) {
		return prisma.testCase.createMany({
			data: data.map((tc) => ({
				problemId,
				input: tc.input,
				expectedOutput: tc.expectedOutput,
				isSample: tc.isSample ?? false,
			})),
		});
	}

	getStarterCodesByProblemId(problemId: string) {
		return prisma.starterCode.findMany({ where: { problemId } });
	}

	addStarterCodeToProblem(
		problemId: string,
		data: { language: Language; code: string },
	) {
		return prisma.starterCode.create({
			data: {
				language: data.language,
				code: data.code,
				problem: { connect: { id: problemId } },
			},
		});
	}

	bulkAddStarterCodesToProblem(
		problemId: string,
		data: { language: Language; code: string }[],
	) {
		return prisma.starterCode.createMany({
			data: data.map((sc) => ({
				problemId,
				language: sc.language,
				code: sc.code,
			})),
			skipDuplicates: true,
		});
	}
}

export default AdminRepository;
