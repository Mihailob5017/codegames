import prisma from "../../infrastructure/prisma";
import { Prisma } from "@prisma/client";
import { ProblemQueryFilters } from "./problems.dto";
import { PaginationParams } from "../../shared/types/common.types";

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
	async getAllProblems(pagination: PaginationParams) {
		const skip = (pagination.page - 1) * pagination.limit;
		const [data, total] = await Promise.all([
			prisma.problem.findMany({
				select: PROBLEM_LIST_SELECT,
				orderBy: { number: "asc" },
				skip,
				take: pagination.limit,
			}),
			prisma.problem.count(),
		]);
		return { data, total };
	}

	async queryProblems(
		filters: ProblemQueryFilters,
		pagination: PaginationParams,
	) {
		const skip = (pagination.page - 1) * pagination.limit;
		const where: Prisma.ProblemWhereInput = {
			...(filters.difficulty && { difficulty: filters.difficulty }),
			...(filters.isPublished !== undefined && {
				isPublished: filters.isPublished,
			}),
			...(filters.categories?.length && {
				categories: { hasSome: filters.categories },
			}),
			...(filters.search && {
				OR: [
					{
						title: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
					{ slug: { contains: filters.search, mode: "insensitive" } },
				],
			}),
		};
		const [data, total] = await Promise.all([
			prisma.problem.findMany({
				where,
				select: PROBLEM_LIST_SELECT,
				orderBy: { number: "asc" },
				skip,
				take: pagination.limit,
			}),
			prisma.problem.count({ where }),
		]);
		return { data, total };
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
