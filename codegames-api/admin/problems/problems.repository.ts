import prisma from "../../infrastructure/prisma";
import { Prisma } from "@prisma/client";
import { ProblemQueryFilters } from "../../util/validation-schema";

export const PROBLEM_LIST_SELECT = {
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

class ProblemsRepository {
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
}

export default ProblemsRepository;
